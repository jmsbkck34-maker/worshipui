import test from 'node:test';
import assert from 'node:assert/strict';
import {signIn,createTokens,createDrive,createGoogleApi} from '../desktop/google.mjs';

// A stand-in for Google's token endpoint and Drive's app-data folder.
function fakeGoogle(){
 const files=new Map();let next=1;const calls=[];
 const json=(body,status=200)=>({ok:status<400,status,json:async()=>body});
 async function fetchImpl(url,options={}){
  calls.push([options.method||'GET',url.split('?')[0]]);
  if(url==='https://oauth2.googleapis.com/token'){
   const form=new URLSearchParams(options.body);
   if(form.get('grant_type')==='authorization_code'){
    assert.equal(form.get('code'),'the-code');assert.ok(form.get('code_verifier').length>=43);
    const idToken='x.'+Buffer.from(JSON.stringify({email:'church@example.org'})).toString('base64url')+'.y';
    return json({access_token:'access-1',refresh_token:'refresh-1',id_token:idToken,expires_in:3600});
   }
   assert.equal(form.get('refresh_token'),'refresh-1');return json({access_token:'access-2',expires_in:3600});
  }
  assert.match(options.headers.Authorization,/^Bearer access-/);
  const u=new URL(url);
  if(u.pathname==='/drive/v3/files'){
   assert.equal(u.searchParams.get('spaces'),'appDataFolder');
   const name=u.searchParams.get('q').match(/name='([^']+)'/)[1];
   return json({files:[...files.values()].filter(f=>f.name===name).map(({id,name,appProperties})=>({id,name,appProperties}))});
  }
  const read=u.pathname.match(/^\/drive\/v3\/files\/(\w+)$/);
  if(read)return json(files.get(read[1]).content);
  const upload=u.pathname.match(/^\/upload\/drive\/v3\/files(?:\/(\w+))?$/);
  if(upload){
   const parts=String(options.body).split(/\r\n--worshipui\w+(?:--)?/).map(part=>part.split('\r\n\r\n')[1]).filter(Boolean);
   const metadata=JSON.parse(parts[0]),content=JSON.parse(parts[1]);
   if(upload[1]){const file=files.get(upload[1]);file.content=content;file.appProperties=metadata.appProperties;return json({id:file.id})}
   assert.deepEqual(metadata.parents,['appDataFolder']);
   const id='f'+next++;files.set(id,{id,name:metadata.name,appProperties:metadata.appProperties,content});return json({id});
  }
  throw Error('unexpected '+url);
 }
 return {fetchImpl,files,calls};
}

test('Google sign-in uses PKCE with a loopback redirect and returns the account and refresh token',async()=>{
 const google=fakeGoogle();
 const result=await signIn({client_id:'client.apps.googleusercontent.com',client_secret:'s'},async address=>{
  const url=new URL(address);
  assert.equal(url.origin+url.pathname,'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.match(url.searchParams.get('scope'),/drive\.appdata/);
  const redirect=new URL(url.searchParams.get('redirect_uri'));assert.equal(redirect.hostname,'127.0.0.1');
  // The browser comes back to WorshipUI with the code.
  await fetch(redirect+'?code=the-code&state='+url.searchParams.get('state'));
 },{fetchImpl:google.fetchImpl});
 assert.equal(result.email,'church@example.org');assert.equal(result.refreshToken,'refresh-1');
});

test('Drive-backed sync API saves with revision checks and reads back setlists and branding',async()=>{
 const google=fakeGoogle();
 const api=createGoogleApi(createDrive(createTokens({client_id:'c'},'refresh-1',{fetchImpl:google.fetchImpl}),google.fetchImpl),'church@example.org');
 const service={title:'Advent 1',items:[{id:'s',title:'Song',type:'Song',theme:'dusk',slides:['Verse']}]};
 assert.deepEqual(await api('GET','/api/me'),{status:200,body:{username:'church@example.org',role:'operator'}});
 assert.equal((await api('GET','/api/setlists/2026-11-29')).body.version,null);
 const first=await api('PUT','/api/setlists/2026-11-29',{baseRevision:0,service});
 assert.equal(first.status,200);assert.equal(first.body.version.revision,1);assert.equal(first.body.version.author,'church@example.org');
 // A stale save (another computer saved first) is refused with the current copy.
 const stale=await api('PUT','/api/setlists/2026-11-29',{baseRevision:0,service:{...service,title:'Other'}});
 assert.equal(stale.status,409);assert.deepEqual(stale.body.current.service,service);
 assert.equal((await api('PUT','/api/setlists/2026-11-29',{baseRevision:1,service:{...service,title:'Advent 1 (edited)'}})).body.version.revision,2);
 assert.equal((await api('GET','/api/setlists/2026-11-29')).body.version.service.title,'Advent 1 (edited)');
 assert.equal((await api('GET','/api/setlists/2026-11-29/versions')).body.versions[0].revision,2);
 assert.equal((await api('PUT','/api/setlists/2026-11-29',{baseRevision:2,service:{title:'x'}})).status,400);
 const branding={name:'Grace',address:'',logo:'',showOnBlackout:true};
 assert.equal((await api('PUT','/api/branding',{baseRevision:0,branding})).body.version.revision,1);
 assert.deepEqual((await api('GET','/api/branding')).body.version.branding,branding);
 assert.equal((await api('POST','/api/login',{})).status,400);
 assert.deepEqual([...google.files.values()].map(f=>f.name).sort(),['branding.json','setlist-2026-11-29.json']);
 assert.equal(google.files.get('f1').appProperties.revision,'2');
});
