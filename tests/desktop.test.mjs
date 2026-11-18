import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDeviceStore,sharedOrigin} from '../desktop/storage.mjs';
import {createDesktopHost} from '../desktop/host.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const service={title:'Offline Sunday',items:[{id:'a',title:'Welcome',type:'Announcement',theme:'dusk',slides:['Saved on the church computer']}]};
const key='worshipui.service.v1';
test('desktop workspace survives restarts, rejects invalid writes, keeps recovery and never restores live output',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'wui-desktop-'));
 try{
  const first=openDeviceStore(directory);first.setItem(key,JSON.stringify(service));
  const ccli={churchCopyright:'123456',streaming:'234567',streamingPlus:'345678',rehearsal:'456789'};
  first.setItem('worshipui.ccli.v1',JSON.stringify(ccli));
  first.setItem('worshipui.live.v1',JSON.stringify({text:'Live slide'}));
  const second=openDeviceStore(directory);assert.deepEqual(JSON.parse(second.getItem(key)),service);assert.deepEqual(JSON.parse(second.getItem('worshipui.ccli.v1')),ccli);assert.equal(second.getItem('worshipui.live.v1'),null);
  assert.throws(()=>second.setItem(key,'{"title":"invalid"}'));assert.deepEqual(JSON.parse(second.getItem(key)),service);
  assert.throws(()=>second.setItem('worshipui.ccli.v1',JSON.stringify({...ccli,streaming:123})),/Invalid CCLI settings/);
  const library={version:1,active:'2026-12-06',entries:{'2026-12-06':{service,baseRevision:1,baseService:service}}};
  second.setItem('worshipui.setlists.v1',JSON.stringify(library));
  assert.deepEqual(JSON.parse(openDeviceStore(directory).getItem('worshipui.setlists.v1')),library);
  assert.throws(()=>second.setItem('worshipui.setlists.v1',JSON.stringify({...library,active:'2026-02-30'})),/Invalid setlist library/);
  const songLibrary={version:1,songs:[{id:'one',title:'Song',type:'Song',theme:'dusk',slides:['Verse'],sectionLabels:['Verse 1']}]};
  second.setItem('worshipui.songs.v1',JSON.stringify(songLibrary));
  assert.deepEqual(JSON.parse(openDeviceStore(directory).getItem('worshipui.songs.v1')),songLibrary);
  assert.throws(()=>second.setItem('worshipui.songs.v1',JSON.stringify({version:1,songs:[{...songLibrary.songs[0],sectionLabels:[]}]})),/Invalid song library/);
  assert.throws(()=>second.setItem('worshipui.songs.v1',JSON.stringify({version:1,songs:[service.items[0]]})),/Invalid song library/);
  const misaligned={title:'Scripture',items:[{id:'verse',title:'John 3:16',type:'Scripture',theme:'dusk',slides:['One','Two'],primaryVersion:'ESV',secondaryVersion:'NIV',secondarySlides:['Uno']}]};
  assert.throws(()=>second.setItem(key,JSON.stringify(misaligned)),/Invalid service/);
  const updated={...service,title:'Revised service'};second.setItem(key,JSON.stringify(updated));
  const backup=JSON.parse(await readFile(path.join(directory,'device.previous.json'),'utf8'));assert.deepEqual(JSON.parse(backup[key]),service);
  assert.throws(()=>second.setItem('arbitrary-file-path','{}'));
  await writeFile(path.join(directory,'device.json'),'broken data');assert.throws(()=>openDeviceStore(directory),/files have been kept/);
 }finally{await rm(directory,{recursive:true,force:true})}
});
test('desktop accepts only a plain HTTPS shared-service origin',()=>{
 assert.equal(sharedOrigin('https://church.example/'),'https://church.example');assert.equal(sharedOrigin(''),'');
 for(const bad of ['http://church.example','https://user:secret@church.example','https://church.example/path','https://church.example?token=x'])assert.throws(()=>sharedOrigin(bad));
});
test('packaged app and screens are served locally with internet unavailable',async()=>{
 const host=await createDesktopHost(root);
 try{
  for(const url of ['/','/?view=audience','/?view=stage','/app.js','/content-import.js','/email-requests.js','/bible-search.js','/assets/bibles/kjv.vpl.txt','/assets/bibles/web.vpl.txt','/assets/bibles/rv1909.vpl.txt','/sync.js','/i18n.js','/sync-core.js','/style.css','/desktop-ui.js','/slide-template.cjs',...Object.values((await import('../slide-template.cjs')).default.bundledFonts).map(font=>'/assets/fonts/'+font+'.ttf')]){
   const response=await fetch(host.origin+url);assert.equal(response.status,200);assert.ok((await response.arrayBuffer()).byteLength>0);
  }
  assert.equal((await fetch(host.origin+'/api/me')).status,503);
  assert.equal((await fetch(host.origin+'/desktop/main.mjs')).status,404);
  assert.equal((await fetch(host.origin+'/api/live')).status,404);
  assert.equal((await fetch(host.origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://attacker.example'},body:'{}'})).status,403);
 }finally{await new Promise(resolve=>host.server.close(resolve))}
});
test('desktop sync proxy retains its session privately and sends the configured cloud origin',async()=>{
 const calls=[];
 const fakeFetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({username:'operator',role:'operator'}),{status:200,headers:{'set-cookie':'wui_session=test-private; HttpOnly; Secure'}})};
 const host=await createDesktopHost(root,'https://church.example',fakeFetch);
 try{
  const login=await fetch(host.origin+'/api/login',{method:'POST',headers:{Origin:host.origin,'Content-Type':'application/json'},body:'{}'});
  assert.equal(login.status,200);assert.equal(login.headers.get('set-cookie'),null);
  await fetch(host.origin+'/api/me');assert.equal(calls[1].options.headers.Cookie,'wui_session=test-private');assert.equal(calls[0].options.headers.Origin,'https://church.example');assert.equal(calls[0].options.redirect,'error');
  host.setRemote('https://another.example');await fetch(host.origin+'/api/me');assert.equal(calls[2].options.headers.Cookie,undefined);
 }finally{await new Promise(resolve=>host.server.close(resolve))}
});
