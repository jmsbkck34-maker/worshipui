import test from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import SlideTemplate from '../slide-template.cjs';
import {openStore,createApp} from '../server.mjs';
import {openDeviceStore} from '../desktop/storage.mjs';

const logo='data:image/png;base64,iVBORw0KGgo=';
const branding={name:'Grace Church',address:'1 Main St',logo,showOnBlackout:true};

test('branding validation accepts only the expected fields and safe embedded logos',()=>{
 assert.equal(SlideTemplate.validBranding(SlideTemplate.emptyBranding),true);
 assert.equal(SlideTemplate.validBranding(branding),true);
 for(const bad of [{...branding,logo:'https://example.com/logo.png'},{...branding,name:'x'.repeat(101)},{...branding,address:'x'.repeat(301)},{...branding,showOnBlackout:'yes'},{...branding,extra:1},{name:'',address:'',logo:''}])
  assert.equal(SlideTemplate.validBranding(bad),false);
 assert.equal(SlideTemplate.validBrandingRecord({version:1,branding,baseRevision:0,baseBranding:null}),true);
 assert.equal(SlideTemplate.validBrandingRecord({version:1,branding,baseRevision:-1,baseBranding:null}),false);
});

test('shared branding saves with revisions, detects conflicts and survives restart',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'wui-branding-'));
 const store=await openStore(directory),password='generated-test-only-password';
 await store.addUser('home-editor',password,'editor');
 const app=createApp(store,{origin:'http://worship.test'});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const request=(endpoint,{method='GET',cookie,body}={})=>new Promise((resolve,reject)=>{
  const req=httpRequest('http://127.0.0.1:'+app.address().port+endpoint,{method,headers:{Host:'worship.test',Origin:'http://worship.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})}},res=>{
   let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(text),cookie:res.headers['set-cookie']?.[0]?.split(';')[0]}));
  });req.on('error',reject);if(body!==undefined)req.write(JSON.stringify(body));req.end();
 });
 try{
  assert.equal((await request('/api/branding')).status,401);
  const {cookie}=await request('/api/login',{method:'POST',body:{username:'home-editor',password}});
  assert.equal((await request('/api/branding',{cookie})).body.version,null);
  const first=await request('/api/branding',{method:'PUT',cookie,body:{baseRevision:0,branding}});
  assert.equal(first.status,200);assert.equal(first.body.version.revision,1);
  const stale=await request('/api/branding',{method:'PUT',cookie,body:{baseRevision:0,branding:{...branding,name:'Other'}}});
  assert.equal(stale.status,409);assert.deepEqual(stale.body.current.branding,branding);
  assert.equal((await request('/api/branding',{method:'PUT',cookie,body:{baseRevision:1,branding:{...branding,logo:'javascript:alert(1)'}}})).status,400);
  const second=await request('/api/branding',{method:'PUT',cookie,body:{baseRevision:1,branding:{...branding,showOnBlackout:false}}});
  assert.equal(second.body.version.revision,2);
  const reopened=await openStore(directory);
  assert.equal(reopened.state().branding.revision,2);assert.equal(reopened.state().branding.branding.showOnBlackout,false);
 }finally{app.close();await rm(directory,{recursive:true,force:true})}
});

test('desktop workspace stores valid branding and rejects invalid branding',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'wui-branding-desktop-'));
 try{
  const record={version:1,branding,baseRevision:2,baseBranding:branding};
  openDeviceStore(directory).setItem('worshipui.branding.v1',JSON.stringify(record));
  assert.deepEqual(JSON.parse(openDeviceStore(directory).getItem('worshipui.branding.v1')),record);
  assert.throws(()=>openDeviceStore(directory).setItem('worshipui.branding.v1',JSON.stringify({...record,branding:{...branding,logo:'http://x'}})),/Invalid branding/);
 }finally{await rm(directory,{recursive:true,force:true})}
});
