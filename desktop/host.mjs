import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {sharedOrigin} from './storage.mjs';
const FILES=new Map([['/',['index.html','text/html']],['/index.html',['index.html','text/html']],['/app.js',['app.js','text/javascript']],['/content-import.js',['content-import.js','text/javascript']],['/sync.js',['sync.js','text/javascript']],['/sync-core.js',['sync-core.js','text/javascript']],['/slide-template.cjs',['slide-template.cjs','text/javascript']],['/assets/fonts/Inter.ttf',['assets/fonts/Inter.ttf','font/ttf']],['/assets/fonts/Montserrat.ttf',['assets/fonts/Montserrat.ttf','font/ttf']],['/assets/fonts/Lato.ttf',['assets/fonts/Lato.ttf','font/ttf']],['/assets/fonts/Merriweather.ttf',['assets/fonts/Merriweather.ttf','font/ttf']],['/assets/fonts/PlayfairDisplay.ttf',['assets/fonts/PlayfairDisplay.ttf','font/ttf']],['/assets/fonts/Oswald.ttf',['assets/fonts/Oswald.ttf','font/ttf']],['/assets/fonts/Poppins.ttf',['assets/fonts/Poppins.ttf','font/ttf']],['/assets/fonts/SourceSans3.ttf',['assets/fonts/SourceSans3.ttf','font/ttf']],['/desktop-ui.js',['desktop-ui.js','text/javascript']],['/style.css',['style.css','text/css']]]);
FILES.set('/i18n.js',['i18n.js','text/javascript']);
FILES.set('/bible-search.js',['bible-search.js','text/javascript']);
FILES.set('/email-requests.js',['email-requests.js','text/javascript']);
FILES.set('/assets/bibles/kjv.vpl.txt',['assets/bibles/kjv.vpl.txt','text/plain']);
FILES.set('/assets/bibles/web.vpl.txt',['assets/bibles/web.vpl.txt','text/plain']);
FILES.set('/assets/bibles/rv1909.vpl.txt',['assets/bibles/rv1909.vpl.txt','text/plain']);
// Offline lyric translator (assets/translator, downloaded by tools/fetch-translator.mjs). Only these exact files are served.
const TRANSLATOR=/^\/translate\/(manifest\.json|runtime\/(?:transformers\.min\.js|ort-wasm-simd-threaded\.jsep\.(?:mjs|wasm))|models\/(?:en-es|es-en)\/(?:config\.json|generation_config\.json|tokenizer\.json|tokenizer_config\.json|onnx\/(?:encoder_model_quantized|decoder_model_merged_quantized)\.onnx))$/;
const TRANSLATOR_TYPES={json:'application/json',js:'text/javascript',mjs:'text/javascript',wasm:'application/wasm',onnx:'application/octet-stream'};
// The worker alone may compile WebAssembly; the page keeps the strict policy.
const WORKER_POLICY="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'";
async function serveTranslator(res,file,type){
 let info;try{info=await stat(file)}catch{res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"Not found"}');return}
 res.writeHead(200,{'Content-Type':type,'Content-Length':info.size});createReadStream(file).pipe(res);
}
const ENDPOINTS=new Set(['/api/me','/api/login','/api/logout','/api/service','/api/versions','/api/branding']);
// Media files for "Images & video" slides, served from the app's media folder with byte ranges (video seeking).
const MEDIA_TYPES={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',mp4:'video/mp4',webm:'video/webm',m4v:'video/mp4',mov:'video/quicktime'};
async function serveMedia(req,res,mediaDir,name){
 const file=path.join(mediaDir,name);let info;try{info=await stat(file)}catch{res.writeHead(404);res.end();return}
 const type=MEDIA_TYPES[name.split('.').pop()],range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
 if(range){
  const start=range[1]?Number(range[1]):Math.max(0,info.size-Number(range[2])),end=range[1]&&range[2]?Math.min(Number(range[2]),info.size-1):info.size-1;
  if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return}
  res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});
  createReadStream(file,{start,end}).pipe(res);return;
 }
 res.writeHead(200,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Length':info.size});createReadStream(file).pipe(res);
}
export async function createDesktopHost(root,initialOrigin='',remoteFetch=fetch,{mediaDir=''}={}){
 let remote=sharedOrigin(initialOrigin),cookie='',localApi=null;
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body))};
  try{
   const origin=`http://127.0.0.1:${server.address().port}`;
   if(req.headers.host!==new URL(origin).host)return reply(403,{error:'Unexpected host'});
   const url=new URL(req.url,origin);
   const media=/^\/media\/([a-f0-9]{32}\.(?:png|jpg|jpeg|webp|gif|mp4|webm|m4v|mov))$/.exec(url.pathname);
   if(media&&mediaDir&&req.method==='GET')return serveMedia(req,res,mediaDir,media[1]);
   if(req.method==='GET'&&url.pathname==='/translate-worker.js'){res.setHeader('Content-Security-Policy',WORKER_POLICY);return serveTranslator(res,path.join(root,'translate-worker.js'),'text/javascript')}
   const translatorFile=TRANSLATOR.exec(url.pathname);
   if(translatorFile&&req.method==='GET'){res.setHeader('Content-Security-Policy',WORKER_POLICY);return serveTranslator(res,path.join(root,'assets','translator',...translatorFile[1].split('/')),TRANSLATOR_TYPES[translatorFile[1].split('.').pop()])}
   if(!url.pathname.startsWith('/api/')){
    const file=FILES.get(url.pathname);if(!file||req.method!=='GET')return reply(404,{error:'Not found'});
    res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8'});res.end(await readFile(path.join(root,file[0])));return;
   }
   if(!ENDPOINTS.has(url.pathname)&&!/^\/api\/versions\/\d+$/.test(url.pathname)&&!/^\/api\/setlists\/[0-9]{4}-[0-9]{2}-[0-9]{2}(?:\/versions(?:\/[0-9]+)?)?$/.test(url.pathname))return reply(404,{error:'Not found'});
   if(!['GET','PUT','POST'].includes(req.method))return reply(405,{error:'Method not allowed'});
   if(req.method!=='GET'&&(req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json')))return reply(403,{error:'Local same-origin JSON required'});
   let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>5_000_000)return reply(413,{error:'Request too large'});chunks.push(chunk)}
   // Signed in with Google: answer from Google Drive instead of a shared server.
   if(localApi){
    let body=null;if(req.method!=='GET'){try{body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'null')}catch{return reply(400,{error:'Invalid JSON'})}}
    try{const result=await localApi(req.method,url.pathname,body);return reply(result.status,result.body)}
    catch(error){return reply(error.status===401?401:503,{error:error.message||'Google Drive is unavailable. Your setlists are still on this computer.'})}
   }
   if(!remote)return reply(503,{error:'No shared server configured. Your church workspace runs locally.'});
   const requestOrigin=remote;
   const response=await remoteFetch(remote+url.pathname,{method:req.method,headers:{Origin:remote,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(req.method!=='GET'?{body:Buffer.concat(chunks)}:{}),redirect:'error',signal:AbortSignal.timeout(10000)});
   if(remote!==requestOrigin)return reply(409,{error:'Shared server changed. Retry the request.'});
   const session=response.headers.get('set-cookie');
   if(session&&url.pathname==='/api/login'&&response.ok)cookie=session.split(';')[0];
   if(url.pathname==='/api/logout'&&response.ok)cookie='';
   if(response.status===401)cookie='';
   // Never return a remote session cookie, HTML, or script to the desktop page.
   const reader=response.body.getReader();let responseSize=0,responseParts=[];
   while(true){const part=await reader.read();if(part.done)break;responseSize+=part.value.length;if(responseSize>6_000_000){await reader.cancel();throw Error('Response too large')}responseParts.push(part.value)}
   const data=JSON.parse(Buffer.concat(responseParts).toString('utf8'));
   reply(response.status,data);
  }catch{reply(503,{error:'Shared server unavailable. Your downloaded service is available locally.'})}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 return {server,origin:`http://127.0.0.1:${server.address().port}`,getRemote:()=>remote,setRemote(value){remote=sharedOrigin(value);cookie=''},setLocalApi(handler){localApi=handler}};
}
