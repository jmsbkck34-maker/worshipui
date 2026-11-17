import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {streamState,validStreamSettings,defaultStreamSettings,createStreamServer} from '../desktop/stream.mjs';

const live={text:'Amazing grace',secondaryText:'Sublime gracia',type:'Song',black:false,clear:false};
const ccli={churchCopyright:'111',streaming:'222',streamingPlus:'',rehearsal:''};

test('overlay state follows the live slide, language choice, blanking and the CCLI streaming number',()=>{
 assert.equal(validStreamSettings(defaultStreamSettings),true);
 assert.equal(validStreamSettings({...defaultStreamSettings,fontSize:300}),false);
 assert.deepEqual(streamState(live,defaultStreamSettings,ccli),{layout:'lower',fontSize:56,background:'band',lines:['Amazing grace','Sublime gracia'],license:'CCLI Streaming License #222'});
 assert.deepEqual(streamState(live,{...defaultStreamSettings,show:'second'},ccli).lines,['Sublime gracia']);
 assert.deepEqual(streamState(live,{...defaultStreamSettings,show:'first'},ccli).lines,['Amazing grace']);
 assert.deepEqual(streamState({...live,black:true},defaultStreamSettings,ccli),{layout:'lower',fontSize:56,background:'band',lines:[],license:''});
 assert.deepEqual(streamState({...live,clear:true},defaultStreamSettings,ccli).lines,[]);
 assert.equal(streamState({...live,type:'Scripture'},defaultStreamSettings,ccli).license,'');
 assert.equal(streamState(live,{...defaultStreamSettings,ccli:false},ccli).license,'');
 assert.equal(streamState(live,defaultStreamSettings,null).license,'');
 // Invalid settings fall back to the defaults instead of breaking the overlay.
 assert.equal(streamState(live,{version:1,layout:'sideways'},ccli).layout,'lower');
});

test('overlay server serves the page and pushes updates to connected overlays',async()=>{
 let state=streamState(live,defaultStreamSettings,ccli);
 const stream=await createStreamServer(()=>state,{ports:[0]});
 try{
  const get=path=>new Promise((resolve,reject)=>request(stream.url.replace('/stream',path),res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,type:res.headers['content-type'],body}))}).on('error',reject).end());
  assert.match(stream.url,/^http:\/\/127\.0\.0\.1:\d+\/stream$/);
  const page=await get('/stream');assert.equal(page.status,200);assert.match(page.body,/EventSource\('\/stream\/events'\)/);
  assert.equal((await get('/nope')).status,404);
  const messages=[];
  await new Promise((resolve,reject)=>{
   const req=request(stream.url+'/events',res=>{res.setEncoding('utf8');res.on('data',chunk=>{messages.push(chunk);if(messages.length===1){state=streamState({...live,text:'Next slide',secondaryText:''},defaultStreamSettings,ccli);stream.update()}else{req.destroy();resolve()}})});
   req.on('error',error=>error.code==='ECONNRESET'?resolve():reject(error));req.end();
  });
  assert.deepEqual(JSON.parse(messages[0].replace(/^data: /,'')).lines,['Amazing grace','Sublime gracia']);
  assert.deepEqual(JSON.parse(messages[1].replace(/^data: /,'')).lines,['Next slide']);
 }finally{stream.close()}
});
