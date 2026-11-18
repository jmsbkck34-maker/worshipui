// Offline lyric translation. Runs in a worker so the window stays responsive while the model works.
// Everything loads from this computer (assets/translator, served under /translate/); nothing is sent online.
import {pipeline,env} from '/translate/runtime/transformers.min.js';
env.allowRemoteModels=false;env.allowLocalModels=true;env.localModelPath='/translate/models/';env.useBrowserCache=false;
env.backends.onnx.wasm.wasmPaths='/translate/runtime/';env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
const loaded=new Map();
const translator=direction=>{if(!loaded.has(direction))loaded.set(direction,pipeline('translation',direction,{dtype:'q8',device:'wasm'}).catch(error=>{loaded.delete(direction);throw error}));return loaded.get(direction)};
const BATCH=6;
self.onmessage=async({data})=>{
 const {id,direction,lines}=data||{};
 try{
  if(!['en-es','es-en'].includes(direction)||!Array.isArray(lines)||lines.length>2000||lines.some(line=>typeof line!=='string'||line.length>1000))throw Error('Invalid translation request');
  self.postMessage({id,progress:0,total:lines.length});
  const run=await translator(direction),result=[];
  for(let start=0;start<lines.length;start+=BATCH){
   const batch=lines.slice(start,start+BATCH),output=await run(batch,{max_new_tokens:128});
   result.push(...output.map(entry=>String(entry.translation_text||'').trim()));
   self.postMessage({id,progress:result.length,total:lines.length});
  }
  self.postMessage({id,result});
 }catch(error){self.postMessage({id,error:String(error?.message||error)})}
};
