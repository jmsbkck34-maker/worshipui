import {request as httpRequest} from 'node:http';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {openStore,createApp,validService} from '../server.mjs';
export async function integrationTests() {
 const directory=await mkdtemp(path.join(os.tmpdir(),'worshipui-test-'));
 const store=await openStore(directory);
 const password='generated-test-only-password';
 await store.addUser('home-editor',password,'editor');
 await store.addUser('church-operator',password,'operator');
 const app=createApp(store,{origin:'http://worship.test'});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+app.address().port;
 let checks=0;
 const check=(actual,expected)=>{assert.equal(JSON.stringify(actual),JSON.stringify(expected));checks++};
 async function request(endpoint,{method='GET',cookie,body,origin='http://worship.test'}={}){
   return new Promise((resolve,reject)=>{
     const req=httpRequest(base+endpoint,{method,headers:{Host:'worship.test',Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})}},res=>{
       let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>{try{resolve({status:res.statusCode,body:JSON.parse(text),cookie:res.headers['set-cookie']?.[0]?.split(';')[0]})}catch(error){reject(error)}});
     });req.on('error',reject);if(body!==undefined)req.write(JSON.stringify(body));req.end();
   });
 }
 try{
   check((await request('/api/service')).status,401);
   check((await request('/api/login',{method:'POST',body:{username:'home-editor',password:'incorrect'}})).status,401);
   const editor=await request('/api/login',{method:'POST',body:{username:'home-editor',password}});
   const operator=await request('/api/login',{method:'POST',body:{username:'church-operator',password}});
   check(editor.status,200);check(editor.body.role,'editor');check(operator.body.role,'operator');
   check((await request('/api/me',{cookie:editor.cookie})).body.username,'home-editor');
   const service={title:'Sunday',items:[{id:'song',title:'Song',type:'Song',theme:'dusk',slides:['First verse','Chorus']}]};
   check(validService(service),true);
   check((await request('/api/service',{method:'PUT',cookie:editor.cookie,origin:'http://attacker.test',body:{baseRevision:0,service}})).status,403);
   const first=await request('/api/service',{method:'PUT',cookie:editor.cookie,body:{baseRevision:0,service}});
   check(first.status,200);check(first.body.version.revision,1);
   check((await request('/api/service',{cookie:operator.cookie})).body.version.service,service);
   const remote=structuredClone(service);remote.items[0].slides[0]='Edited at home';
   const changed=await request('/api/service',{method:'PUT',cookie:editor.cookie,body:{baseRevision:1,service:remote}});
   check(changed.body.version.revision,2);
   const stale=await request('/api/service',{method:'PUT',cookie:operator.cookie,body:{baseRevision:1,service}});
   check(stale.status,409);check(stale.body.current.service,remote);
   const race=await Promise.all(['One','Two'].map(title=>request('/api/service',{method:'PUT',cookie:editor.cookie,body:{baseRevision:2,service:{...service,title}}})));
   check(race.map(r=>r.status).sort(),[200,409]);
   check((await request('/api/versions',{cookie:operator.cookie})).body.versions.length,3);
   check((await request('/api/versions/1',{cookie:editor.cookie})).body.version.service,service);
   const restore=await request('/api/service',{method:'PUT',cookie:operator.cookie,body:{baseRevision:3,service}});
   check(restore.body.version.revision,4);
   check((await request('/api/service',{method:'PUT',cookie:editor.cookie,body:{baseRevision:4,service:{title:'Invalid'}}})).status,400);
   check((await request('/api/live',{method:'POST',cookie:editor.cookie,body:{text:'Remote cannot project'}})).status,404);
   check((await request('/.data/workspace.json')).status,404);
   check((await request('/server.mjs')).status,404);
   const reopened=await openStore(directory);check(reopened.state().versions.at(-1).revision,4);
   check(reopened.state().users[0].password===password,false);
   await request('/api/logout',{method:'POST',cookie:editor.cookie,body:{}});
   check((await request('/api/me',{cookie:editor.cookie})).status,401);
   return checks;
 }finally{await new Promise(resolve=>app.close(resolve));await rm(directory,{recursive:true,force:true})}
}
