// Home sync with Google: sign in with a Google account and keep setlists, the undated service and branding in that
// account's hidden WorshipUI app-data area of Google Drive (scope drive.appdata — WorshipUI cannot see the user's
// other Drive files). The desktop host answers the same /api/* requests the shared server would, so sync.js keeps its
// revision checks, review-before-applying and conflict handling unchanged.
import http from 'node:http';
import crypto from 'node:crypto';
import SlideTemplate from '../slide-template.cjs';
import {validService} from '../server.mjs';

const AUTH='https://accounts.google.com/o/oauth2/v2/auth',TOKEN='https://oauth2.googleapis.com/token';
const DRIVE='https://www.googleapis.com/drive/v3',UPLOAD='https://www.googleapis.com/upload/drive/v3';
export const SCOPES='openid email https://www.googleapis.com/auth/drive.appdata';
const base64url=buffer=>Buffer.from(buffer).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

// Desktop OAuth with PKCE and a loopback redirect: the browser signs in, Google sends the code back to this computer.
export async function signIn(client,openBrowser,{fetchImpl=fetch,timeout=300000}={}){
 const verifier=base64url(crypto.randomBytes(32)),challenge=base64url(crypto.createHash('sha256').update(verifier).digest()),state=base64url(crypto.randomBytes(16));
 let finish;const result=new Promise((resolve,reject)=>{finish={resolve,reject}});
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname!=='/oauth'){res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end('<!doctype html><meta charset="utf-8"><title>WorshipUI</title><body style="font-family:sans-serif;padding:40px"><h2>You can close this tab and return to WorshipUI.</h2></body>');
  if(url.searchParams.get('state')!==state)finish.reject(Error('Google sign-in did not match. Try again.'));
  else if(url.searchParams.get('error'))finish.reject(Error('Google sign-in was cancelled.'));
  else finish.resolve(url.searchParams.get('code'));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const redirect=`http://127.0.0.1:${server.address().port}/oauth`;
 const timer=setTimeout(()=>finish.reject(Error('Google sign-in timed out. Try again.')),timeout);
 try{
  const params=new URLSearchParams({client_id:client.client_id,redirect_uri:redirect,response_type:'code',scope:SCOPES,code_challenge:challenge,code_challenge_method:'S256',state,access_type:'offline',prompt:'consent'});
  await openBrowser(AUTH+'?'+params);
  const code=await result;
  const response=await fetchImpl(TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:client.client_id,client_secret:client.client_secret||'',redirect_uri:redirect,grant_type:'authorization_code',code_verifier:verifier})});
  const tokens=await response.json();
  if(!response.ok||!tokens.refresh_token)throw Error('Google did not complete the sign-in. Try again.');
  const email=JSON.parse(Buffer.from(String(tokens.id_token||'').split('.')[1]||'','base64url').toString('utf8')||'{}').email||'Google account';
  return {refreshToken:tokens.refresh_token,email,accessToken:tokens.access_token,expiresAt:Date.now()+(tokens.expires_in||3000)*1000};
 }finally{clearTimeout(timer);server.close()}
}

// Short-lived access tokens from the saved refresh token, renewed a minute before they expire.
export function createTokens(client,refreshToken,{fetchImpl=fetch,initial=null}={}){
 let token=initial?.accessToken||'',expiresAt=initial?.expiresAt||0;
 return async()=>{
  if(token&&Date.now()<expiresAt-60000)return token;
  const response=await fetchImpl(TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:client.client_id,client_secret:client.client_secret||'',refresh_token:refreshToken,grant_type:'refresh_token'})});
  const data=await response.json();
  if(!response.ok)throw Object.assign(Error('Google sign-in expired. Sign in with Google again.'),{status:401});
  token=data.access_token;expiresAt=Date.now()+(data.expires_in||3000)*1000;return token;
 };
}

// JSON files in the app-data folder, each with a "revision" app property for compare-and-swap saves.
export function createDrive(getAccessToken,fetchImpl=fetch){
 async function call(url,options={}){
  const response=await fetchImpl(url,{...options,headers:{Authorization:'Bearer '+await getAccessToken(),...options.headers}});
  if(response.status===401)throw Object.assign(Error('Google sign-in expired. Sign in with Google again.'),{status:401});
  if(!response.ok)throw Error('Google Drive is unavailable. Your setlists are still on this computer.');
  return response;
 }
 return {
  async find(name){
   const query=new URLSearchParams({spaces:'appDataFolder',q:`name='${name}' and trashed=false`,fields:'files(id,name,appProperties)',pageSize:'10'});
   return (await (await call(DRIVE+'/files?'+query)).json()).files?.[0]||null;
  },
  async read(id){return (await call(DRIVE+'/files/'+id+'?alt=media')).json()},
  async write(id,name,content,appProperties){
   const boundary='worshipui'+crypto.randomBytes(8).toString('hex');
   const metadata=id?{appProperties}:{name,parents:['appDataFolder'],appProperties};
   const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(content)}\r\n--${boundary}--`;
   await call(UPLOAD+'/files'+(id?'/'+id:'')+'?uploadType=multipart',{method:id?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
  }
 };
}

// Answers the shared-server API from Drive: /api/me, /api/service, /api/setlists/<date>, /api/branding and history.
export function createGoogleApi(drive,email){
 async function get(name){const file=await drive.find(name);return file?{file,version:await drive.read(file.id)}:{file:null,version:null}}
 async function save(name,base,field,value){
  const {file,version}=await get(name);
  if(base!==(version?.revision||0))return {status:409,body:{conflict:true,current:version}};
  const next={revision:(version?.revision||0)+1,[field]:value,author:email,savedAt:new Date().toISOString()};
  await drive.write(file?.id||null,name,next,{revision:String(next.revision)});
  return {status:200,body:{version:next}};
 }
 const summary=version=>version?[{revision:version.revision,author:version.author,savedAt:version.savedAt,title:version.service?.title||''}]:[];
 return async(method,pathname,body)=>{
  if(pathname==='/api/me'&&method==='GET')return {status:200,body:{username:email,role:'operator'}};
  if(pathname==='/api/login')return {status:400,body:{error:'This computer syncs with Google. Use Sign in with Google.'}};
  if(pathname==='/api/logout')return {status:200,body:{ok:true}};
  if(pathname==='/api/branding'){
   if(method==='GET')return {status:200,body:{version:(await get('branding.json')).version}};
   if(!Number.isInteger(body?.baseRevision)||body.baseRevision<0||!SlideTemplate.validBranding(body.branding))return {status:400,body:{error:'Invalid branding or revision'}};
   return save('branding.json',body.baseRevision,'branding',body.branding);
  }
  const match=pathname.match(/^\/api\/(?:service|setlists\/(\d{4}-\d{2}-\d{2}))(\/versions(?:\/(\d+))?)?$/)||(pathname.match(/^\/api\/versions(?:\/(\d+))?$/)&&[null,null,'/versions',pathname.match(/\d+$/)?.[0]]);
  if(!match)return {status:404,body:{error:'Not found'}};
  const name=match[1]?'setlist-'+match[1]+'.json':'service.json';
  if(match[2]){
   const {version}=await get(name);
   if(match[3])return Number(match[3])===version?.revision?{status:200,body:{version}}:{status:404,body:{error:'Version not found'}};
   return {status:200,body:{versions:summary(version)}};
  }
  if(method==='GET')return {status:200,body:{version:(await get(name)).version}};
  if(!Number.isInteger(body?.baseRevision)||body.baseRevision<0||!validService(body.service))return {status:400,body:{error:'Invalid service or revision'}};
  return save(name,body.baseRevision,'service',body.service);
 };
}
