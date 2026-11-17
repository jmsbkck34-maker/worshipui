import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import SlideTemplate from '../slide-template.cjs';
import {validService} from '../server.mjs';
import {createDesktopHost} from '../desktop/host.mjs';

const image='a'.repeat(32)+'.png',video='b'.repeat(32)+'.mp4';

test('media slides validate their files and stay aligned with the slides',()=>{
 const item={id:'m',title:'Welcome',type:'Media',theme:'midnight',slides:['Welcome.png','Intro.mp4'],media:[{kind:'image',file:image,name:'Welcome.png'},{kind:'video',file:video,name:'Intro.mp4'}]};
 assert.equal(validService({title:'S',items:[item]}),true);
 assert.equal(validService({title:'S',items:[{...item,media:item.media.slice(0,1)}]}),false);
 assert.equal(validService({title:'S',items:[{...item,media:[{kind:'video',file:image,name:'x'},item.media[1]]}]}),false);
 assert.equal(validService({title:'S',items:[{...item,media:[{kind:'image',file:'../x.png',name:'x'},item.media[1]]}]}),false);
 assert.equal(validService({title:'S',items:[{...item,type:'Song'}]}),false);
 assert.equal(SlideTemplate.mediaKind('x.MOV'),'video');assert.equal(SlideTemplate.mediaKind('x.exe'),null);
});

test('the desktop host serves media files, including byte ranges for video seeking',async()=>{
 const mediaDir=await mkdtemp(path.join(os.tmpdir(),'wui-media-'));
 const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
 await writeFile(path.join(mediaDir,video),Buffer.from('0123456789'));
 const host=await createDesktopHost(root,'',fetch,{mediaDir});
 try{
  const whole=await fetch(host.origin+'/media/'+video);
  assert.equal(whole.status,200);assert.equal(whole.headers.get('content-type'),'video/mp4');assert.equal(await whole.text(),'0123456789');
  const part=await fetch(host.origin+'/media/'+video,{headers:{Range:'bytes=2-5'}});
  assert.equal(part.status,206);assert.equal(part.headers.get('content-range'),'bytes 2-5/10');assert.equal(await part.text(),'2345');
  assert.equal((await fetch(host.origin+'/media/'+image)).status,404);
  assert.equal((await fetch(host.origin+'/media/..%2F'+video)).status,404);
 }finally{host.server.close();await rm(mediaDir,{recursive:true,force:true})}
});
