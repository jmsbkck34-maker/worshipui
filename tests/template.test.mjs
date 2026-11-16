import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import SlideTemplate from '../slide-template.cjs';
import {validService,openStore} from '../server.mjs';
import {openDeviceStore} from '../desktop/storage.mjs';
test('template validation accepts old services and rejects unsafe colors, fonts and remote image references',()=>{
 assert.equal(SlideTemplate.validTemplate(undefined),true);
 const normal=SlideTemplate.normalize();assert.equal(SlideTemplate.validTemplate(normal),true);
 for(const bad of [{font:'url(evil)'},{color:'red; background:url(evil)'},{fontSize:201},{fontSize:23},{fontSize:40.5},{backgroundType:'image',image:'https://example.com/background.jpg'},{backgroundType:'image',image:'data:image/svg+xml;base64,AAAA'}])assert.equal(SlideTemplate.validTemplate({...normal,...bad}),false);
});
test('image background and text settings survive shared-service and desktop restarts',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'wui-template-'));
 try{
  const template={...SlideTemplate.normalize(),backgroundType:'image',image:'data:image/jpeg;base64,/9j/2Q==',font:'Georgia',fontSize:112};
  const service={title:'Offline images',items:[{id:'song',title:'Song',type:'Song',theme:'dusk',template,slides:['Verse','Chorus']}]};
  assert.equal(validService(service),true);
  const store=await openStore(path.join(directory,'shared'));await store.save(0,service,'test-editor');
  assert.deepEqual((await openStore(path.join(directory,'shared'))).state().versions[0].service,service);
  const desktop=openDeviceStore(path.join(directory,'desktop'));desktop.setItem('worshipui.service.v1',JSON.stringify(service));
  assert.deepEqual(JSON.parse(openDeviceStore(path.join(directory,'desktop')).getItem('worshipui.service.v1')),service);
  assert.equal(validService({...service,items:[{...service.items[0],template:{...template,fontSize:500}}]}),false);
 }finally{await rm(directory,{recursive:true,force:true})}
});

test('motion templates retain compatibility, validate choices and survive disk restart',async()=>{
 assert.equal(SlideTemplate.fonts.length,29);assert.equal(Object.keys(SlideTemplate.bundledFonts).length,8);
 const old={backgroundType:'preset',color:'#123456',image:'',font:'Arial',fontSize:80};assert.equal(SlideTemplate.validTemplate(old),true);assert.equal(SlideTemplate.normalize(old).motion,'aurora');
 for(const motion of SlideTemplate.motions){const template={...SlideTemplate.normalize(),backgroundType:'motion',motion:motion.id,font:'Montserrat'};assert.equal(SlideTemplate.validTemplate(template),true)}
 assert.equal(SlideTemplate.validTemplate({...SlideTemplate.normalize(),motion:'invalid css class'}),false);
 assert.equal(SlideTemplate.validTemplate({...SlideTemplate.normalize(),motionPaused:'yes'}),false);
 const directory=await mkdtemp(path.join(os.tmpdir(),'wui-motion-'));
 try{const template={...SlideTemplate.normalize(),backgroundType:'motion',motion:'stars',font:'Poppins',motionPaused:true};
 const service={title:'Motion service',items:[{id:'motion',title:'Song',type:'Song',theme:'dusk',template,slides:['Verse']}]};
 const store=openDeviceStore(directory);store.setItem('worshipui.service.v1',JSON.stringify(service));assert.deepEqual(JSON.parse(openDeviceStore(directory).getItem('worshipui.service.v1')),service);
 }finally{await rm(directory,{recursive:true,force:true})}
});
