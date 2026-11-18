// Downloads the offline lyric translator into assets/translator/ (not kept in Git):
// Transformers.js (Apache-2.0) with its WebAssembly runtime, and the Opus-MT English↔Spanish models
// from Helsinki-NLP (Apache-2.0, ONNX conversion by Xenova). Every file is pinned to an exact version and checked.
// Usage: node tools/fetch-translator.mjs            (both directions)
//        node tools/fetch-translator.mjs en-es      (one direction, to save data while developing)
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'assets','translator');
const runtime='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/';
const RUNTIME_FILES=['transformers.min.js','ort-wasm-simd-threaded.jsep.mjs','ort-wasm-simd-threaded.jsep.wasm'];
const MODELS={
 'en-es':{repo:'Xenova/opus-mt-en-es',revision:'4b002a4c7edd54a7ced58877258b87f7efd3f892'},
 'es-en':{repo:'Xenova/opus-mt-es-en',revision:'eadfd7c658a9d8929ac3b8e996b68a68e2c7d480'}
};
const MODEL_FILES=['config.json','generation_config.json','tokenizer.json','tokenizer_config.json','onnx/encoder_model_quantized.onnx','onnx/decoder_model_merged_quantized.onnx'];
// SHA-256 of every file. An empty pin is filled in once and must then be committed.
const PINS=JSON.parse(readFileSync(path.join(root,'tools','translator-pins.json'),'utf8'));

const sha=data=>createHash('sha256').update(data).digest('hex');
async function fetchFile(url,target,pinKey){
 if(existsSync(target)&&PINS[pinKey]&&sha(readFileSync(target))===PINS[pinKey])return false;
 const response=await fetch(url,{redirect:'follow'});
 if(!response.ok)throw Error(`Download failed (${response.status}): ${url}`);
 const data=Buffer.from(await response.arrayBuffer()),hash=sha(data);
 if(PINS[pinKey]&&PINS[pinKey]!==hash)throw Error(`Checksum mismatch for ${pinKey}: expected ${PINS[pinKey]}, got ${hash}`);
 if(!PINS[pinKey]){if(process.env.CI)throw Error('Unpinned translator file in CI: '+pinKey);PINS[pinKey]=hash;console.log('pinned',pinKey)}
 mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,data);return true;
}

const wanted=process.argv[2]?[process.argv[2]]:Object.keys(MODELS);
for(const direction of wanted)if(!MODELS[direction])throw Error('Unknown direction '+direction+'. Use en-es or es-en.');
for(const name of RUNTIME_FILES){if(await fetchFile(runtime+name,path.join(out,'runtime',name),'runtime/'+name))console.log('downloaded runtime/'+name)}
for(const direction of wanted){
 const {repo,revision}=MODELS[direction];
 for(const file of MODEL_FILES){
  const key=`models/${direction}/${file}`;
  if(await fetchFile(`https://huggingface.co/${repo}/resolve/${revision}/${file}`,path.join(out,'models',direction,file),key))console.log('downloaded',key);
 }
}
writeFileSync(path.join(root,'tools','translator-pins.json'),JSON.stringify(PINS,null,1)+'\n');
// The app shows the Translate button only for the directions listed here.
const directions=Object.keys(MODELS).filter(direction=>MODEL_FILES.every(file=>existsSync(path.join(out,'models',direction,file))));
writeFileSync(path.join(out,'NOTICE.txt'),'WorshipUI offline lyric translator\n\nTransformers.js 3.7.5 (Hugging Face) and ONNX Runtime Web (Microsoft): Apache License 2.0.\nOpus-MT English-Spanish and Spanish-English models (Helsinki-NLP, University of Helsinki), ONNX conversion by Xenova: Apache License 2.0.\nhttps://github.com/huggingface/transformers.js  https://huggingface.co/Helsinki-NLP/opus-mt-en-es  https://huggingface.co/Helsinki-NLP/opus-mt-es-en\n');
writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,directions})+'\n');
console.log('translator ready:',directions.join(', ')||'none');
