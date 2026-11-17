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
test('text box position is optional, bounded and kept by shared-service validation',()=>{
 const base=SlideTemplate.normalize();
 assert.equal(SlideTemplate.textPosition(base),null);
 const moved={...base,textX:30,textY:75,textWidth:60};
 assert.equal(SlideTemplate.validTemplate(moved),true);
 assert.deepEqual(SlideTemplate.textPosition(moved),{x:30,y:75,width:60});
 assert.deepEqual(SlideTemplate.textPosition({...base,textY:20}),{x:50,y:20,width:90});
 for(const bad of [{textX:-1},{textX:101},{textY:50.5},{textWidth:19},{textWidth:'90'}])assert.equal(SlideTemplate.validTemplate({...base,...bad}),false);
 assert.equal(validService({title:'Moved',items:[{id:'s',title:'Song',type:'Song',theme:'dusk',template:moved,slides:['Verse']}]}),true);
});
test('per-slide screen targets must line up with the slides',()=>{
 const item={id:'s',title:'Song',type:'Song',theme:'dusk',slides:['Verse','Chorus']};
 assert.equal(validService({title:'S',items:[{...item,slideScreens:['','2']}]}),true);
 for(const bad of [['2'],['','3'],['',''],'2'])assert.equal(validService({title:'S',items:[{...item,slideScreens:bad}]}),false);
});

test('countdown items validate, find their end time and format the remaining time',()=>{
 const minutes={mode:'duration',seconds:300,message:'Service begins in',end:'zero',endMessage:''};
 assert.equal(SlideTemplate.validCountdown(minutes),true);
 assert.equal(SlideTemplate.validCountdown({...minutes,seconds:0}),false);
 assert.equal(SlideTemplate.validCountdown({mode:'clock',time:'10:30',message:'',end:'next',endMessage:''}),true);
 assert.equal(SlideTemplate.validCountdown({mode:'clock',time:'25:00',message:'',end:'next',endMessage:''}),false);
 const now=new Date(2026,10,22,10,0,0).getTime();
 assert.equal(SlideTemplate.countdownTarget(minutes,now),now+300000);
 assert.equal(SlideTemplate.countdownTarget({mode:'clock',time:'10:30',message:'',end:'zero',endMessage:''},now),new Date(2026,10,22,10,30,0).getTime());
 // A clock time already past today means tomorrow.
 assert.equal(SlideTemplate.countdownTarget({mode:'clock',time:'09:00',message:'',end:'zero',endMessage:''},now),new Date(2026,10,23,9,0,0).getTime());
 const live={target:now+65000,message:'Service begins in',end:'message',endMessage:'Welcome!'};
 assert.equal(SlideTemplate.countdownText(live,now),'Service begins in\n1:05');
 assert.equal(SlideTemplate.countdownText({...live,target:now+3725000},now),'Service begins in\n1:02:05');
 assert.equal(SlideTemplate.countdownText(live,now+70000),'Welcome!');
 assert.equal(SlideTemplate.countdownText({...live,end:'zero'},now+70000),'Service begins in\n0:00');
 const item={id:'c',title:'Countdown',type:'Countdown',theme:'midnight',slides:['Service begins in\n5:00'],countdown:minutes};
 assert.equal(validService({title:'S',items:[item]}),true);
 assert.equal(validService({title:'S',items:[{...item,countdown:undefined}]}),false);
 assert.equal(validService({title:'S',items:[{...item,type:'Song'}]}),false);
});
