import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createDesktopHost} from '../desktop/host.mjs';

test('the offline translator files are served only by exact name, and only the worker may run WebAssembly',async()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'wui-translator-'));
 try{
  mkdirSync(path.join(root,'assets','translator','models','en-es','onnx'),{recursive:true});
  writeFileSync(path.join(root,'assets','translator','manifest.json'),'{"version":1,"directions":["en-es"]}');
  writeFileSync(path.join(root,'assets','translator','models','en-es','onnx','encoder_model_quantized.onnx'),'model');
  writeFileSync(path.join(root,'translate-worker.js'),'self.onmessage=()=>{}');
  writeFileSync(path.join(root,'package.json'),'{}');writeFileSync(path.join(root,'index.html'),'<p>page</p>');
  const host=await createDesktopHost(root);
  try{
   const manifest=await fetch(host.origin+'/translate/manifest.json');
   assert.equal(manifest.status,200);assert.match(manifest.headers.get('content-type'),/application\/json/);
   assert.deepEqual(await manifest.json(),{version:1,directions:['en-es']});
   const model=await fetch(host.origin+'/translate/models/en-es/onnx/encoder_model_quantized.onnx');
   assert.equal(model.status,200);assert.equal(await model.text(),'model');
   const worker=await fetch(host.origin+'/translate-worker.js');
   assert.equal(worker.status,200);assert.match(worker.headers.get('content-security-policy'),/'wasm-unsafe-eval'/);
   const page=await fetch(host.origin+'/translate/manifest.json');assert.ok(page.ok);
   assert.doesNotMatch((await fetch(host.origin+'/')).headers.get('content-security-policy')||'',/wasm-unsafe-eval/);
   for(const bad of ['/translate/../package.json','/translate/models/en-fr/config.json','/translate/models/en-es/onnx/other.onnx','/translate/runtime/evil.js'])
    assert.equal((await fetch(host.origin+bad)).status,404,bad);
   assert.equal((await fetch(host.origin+'/translate/models/es-en/config.json')).status,404);
  }finally{host.server.closeAllConnections();host.server.close()}
 }finally{rmSync(root,{recursive:true,force:true})}
});
