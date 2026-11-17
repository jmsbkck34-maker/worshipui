// Livestream overlay for OBS: a local page (http://127.0.0.1:<port>/stream) that OBS adds as a Browser source.
// It shows the live slide as lower-third or full-screen text on a transparent background and updates instantly
// through Server-Sent Events. Only this computer can connect (bound to 127.0.0.1).
import http from 'node:http';

export const defaultStreamSettings={version:1,layout:'lower',show:'both',fontSize:56,background:'band',ccli:true};
export function validStreamSettings(value){
 return !!value&&value.version===1&&['lower','full'].includes(value.layout)&&['both','first','second'].includes(value.show)&&
  Number.isInteger(value.fontSize)&&value.fontSize>=24&&value.fontSize<=120&&['band','transparent'].includes(value.background)&&typeof value.ccli==='boolean';
}

// What the overlay should show for the live output, the stream settings and the CCLI numbers.
export function streamState(output,settings,ccli){
 const s=validStreamSettings(settings)?settings:defaultStreamSettings;
 const o=output&&typeof output==='object'?output:{};
 let lines=[];
 if(!o.black&&!o.clear&&typeof o.text==='string'&&o.text.trim()){
  const first=o.text,second=typeof o.secondaryText==='string'?o.secondaryText:'';
  if(s.show==='first'||!second)lines=[first];
  else if(s.show==='second')lines=[second];
  else lines=[first,second];
 }
 const streaming=typeof ccli?.streaming==='string'?ccli.streaming.trim():'';
 const license=s.ccli&&lines.length&&o.type==='Song'&&streaming?'CCLI Streaming License #'+streaming:'';
 return {layout:s.layout,fontSize:s.fontSize,background:s.background,lines:lines.map(line=>line.slice(0,20000)),license};
}

const page=`<!doctype html><html><head><meta charset="utf-8"><title>WorshipUI stream</title><style>
@font-face{font-family:Inter;src:url('/stream/font') format('truetype');font-weight:100 900}
html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden;font-family:Inter,"Segoe UI",sans-serif}
#box{position:absolute;left:0;right:0;color:#fff;text-align:center;white-space:pre-wrap;line-height:1.25;text-shadow:0 2px 8px #000c;display:none;box-sizing:border-box}
#box.lower{bottom:4vh;padding:2.2vh 6vw;max-height:38vh}
#box.full{top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:6vh 8vw}
#box.band.lower{background:linear-gradient(transparent,#000000b8 18%,#000000c8)}
#box.band.full{background:#000000a6}
#box .second{opacity:.85;margin-top:.5em}
#license{position:absolute;right:2vw;bottom:1vh;font-size:14px;color:#fffc;text-shadow:0 1px 4px #000}
</style></head><body><div id="box"></div><div id="license"></div><script>
const box=document.getElementById('box'),license=document.getElementById('license');
function fit(size){box.style.fontSize=size+'px';let n=size;while(n>18&&box.scrollHeight>box.clientHeight+1){n-=2;box.style.fontSize=n+'px'}}
function show(state){
 box.className=state.layout+' '+(state.background==='band'?'band':'');box.replaceChildren();
 state.lines.forEach((text,n)=>{const part=document.createElement('div');if(n)part.className='second';part.textContent=text;box.append(part)});
 box.style.display=state.lines.length?(state.layout==='full'?'flex':'block'):'none';
 license.textContent=state.license;
 if(state.lines.length)fit(state.fontSize*Math.min(window.innerWidth,1920)/1920);
}
const events=new EventSource('/stream/events');events.onmessage=event=>show(JSON.parse(event.data));
</script></body></html>`;

// Serves the overlay on the first free port from 48095 (an uncommon range, so the address OBS uses stays the same). getState() returns the current overlay state.
export async function createStreamServer(getState,{ports=[48095,48096,48097,48098,48099],font}={}){
 const clients=new Set();
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.writeHead(405);res.end();return}
  if(url.pathname==='/stream'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; font-src 'self'"});res.end(page);return}
  if(url.pathname==='/stream/font'&&font){res.writeHead(200,{'Content-Type':'font/ttf'});res.end(font);return}
  if(url.pathname==='/stream/events'){
   res.writeHead(200,{'Content-Type':'text/event-stream','Connection':'keep-alive'});
   res.write('data: '+JSON.stringify(getState())+'\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;
  }
  res.writeHead(404);res.end();
 });
 let port=null;
 for(const candidate of ports){
  try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(candidate,'127.0.0.1',()=>{server.off('error',reject);resolve()})});port=server.address().port;break}
  catch(error){if(error.code!=='EADDRINUSE')throw error}
 }
 if(!port)throw Error('Ports 48095–48099 are busy, so the livestream overlay is off.');
 return {
  port,url:`http://127.0.0.1:${port}/stream`,
  // Push the latest state to every connected overlay (OBS) after the live slide or settings change.
  update(){const data='data: '+JSON.stringify(getState())+'\n\n';for(const client of clients)client.write(data)},
  close(){for(const client of clients)client.end();server.close()}
 };
}
