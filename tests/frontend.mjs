import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const clone=value=>JSON.parse(JSON.stringify(value));
export async function frontendTests(){
 const sources=await Promise.all(['slide-template.cjs','app.js','sync-core.js','sync.js'].map(file=>readFile(new URL('../'+file,import.meta.url),'utf8')));
 const initial={title:'Sunday',items:[{id:'song',title:'Original',type:'Song',theme:'dusk',slides:['Original verse','Original chorus']}]};
 const key='worshipui.service.v1',liveKey='worshipui.live.v1',metaKey='worshipui.sync.v1';
 let checks=0;function check(a,b){assert.equal(JSON.stringify(a),JSON.stringify(b));checks++}
 async function client(role='operator',online=true){
   const nodes=new Map(),storage=new Map([[key,JSON.stringify(initial)],[metaKey,JSON.stringify({baseRevision:1,baseService:initial,live:false,role,username:role})]]),intervals=[];
   function element(){return {value:'',open:false,style:{setProperty(key,value){this[key]=value}},children:[],textContent:'',append(...children){this.children.push(...children)},replaceChildren(){this.children=[]},setAttribute(){},showModal(){this.open=true},close(){this.open=false},click(){return this.onclick?.()},innerHTML:''}}
   const node=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
   let remote={revision:1,service:clone(initial),author:'home',savedAt:new Date().toISOString()};
   const listeners=new Map();
   const context={console,URLSearchParams,location:{search:''},structuredClone:clone,crypto:{randomUUID:()=>Math.random().toString()},Blob,Event:class{constructor(type){this.type=type}},
     document:{getElementById:node,createElement:element,querySelector:()=>node('aside'),body:element(),activeElement:null,addEventListener(){}},
     localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},AbortSignal:{timeout(){}},
     confirm:()=>true,setInterval:fn=>intervals.push(fn),setTimeout:()=>1,clearTimeout(){},
     addEventListener(type,fn){listeners.set(type,fn)},dispatchEvent(event){listeners.get(event.type)?.(event)},
     async fetch(url,options={}){if(!online)throw Error('Offline');
       let response;
       if(url==='/api/me'||url==='/api/login')response={username:role,role};
       else if(url==='/api/service'&&options.method==='PUT'){
         const body=JSON.parse(options.body);if(body.baseRevision!==remote.revision)return {ok:false,status:409,json:async()=>({current:clone(remote)})};
         remote={revision:remote.revision+1,service:body.service,author:role,savedAt:new Date().toISOString()};response={version:clone(remote)};
       }else if(url==='/api/service')response={version:clone(remote)};
       else throw Error('Unexpected API');
       return {ok:true,status:200,json:async()=>response};
     }};
   context.window=context;vm.createContext(context);sources.forEach(source=>vm.runInContext(source,context));
   await new Promise(resolve=>setTimeout(resolve,0));
   return {nodes,node,storage,context,setRemote:v=>remote=v,setOnline:v=>online=v,async poll(){await intervals[0]();await new Promise(resolve=>setTimeout(resolve,0))}};
 }
 const church=await client();
 check(church.node('order').children.length,1);
 church.node('take').onclick();const projected=church.storage.get(liveKey);check(JSON.parse(projected).text,'Original verse');
 church.node('liveMode').onclick();
 const second={revision:2,service:clone(initial),author:'home',savedAt:new Date().toISOString()};second.service.items[0].slides[0]='Changed at home';
 church.setRemote(second);await church.poll();
 check(church.context.worshipWorkspace.getService(),initial);check(church.node('reviewUpdate').hidden,false);check(church.storage.get(liveKey),projected);
 church.node('reviewUpdate').onclick();
 const third=clone(second);third.revision=3;third.service.items[0].slides[0]='A newer unreviewed edit';church.setRemote(third);await church.poll();
 church.node('acceptRemote').onclick();check(church.context.worshipWorkspace.getService(),second.service);check(church.storage.get(liveKey),projected);
 await church.poll();check(church.node('reviewUpdate').hidden,false);
 check(JSON.parse(church.storage.get('worshipui.recovery.v1')).at(-1).service,initial);
 // Offline controls use local content, with no server round trip.
 church.setOnline(false);await church.poll();church.node('next').onclick();church.node('take').onclick();check(JSON.parse(church.storage.get(liveKey)).text,'Original chorus');
 // Divergent local edits must not be auto-applied or silently overwritten.
 const conflicts=await client();conflicts.node('serviceTitle').oninput({target:{value:'My offline edit'}});conflicts.setRemote(second);await conflicts.poll();
 check(conflicts.context.worshipWorkspace.getService().title,'My offline edit');check(conflicts.node('reviewUpdate').hidden,false);
 conflicts.node('reviewUpdate').onclick();await conflicts.node('keepLocal').onclick();
 check(JSON.parse(conflicts.storage.get(metaKey)).baseRevision,3);check(conflicts.context.worshipWorkspace.getService().title,'My offline edit');
 const editor=await client('editor');check(editor.node('take').disabled,true);editor.node('take').onclick();editor.node('blackout').onclick();check(editor.storage.has(liveKey),false);
 editor.node('next').onclick();check(editor.node('take').disabled,true);
 const offline=await client('operator',false);offline.node('take').onclick();check(JSON.parse(offline.storage.get(liveKey)).text,'Original verse');
 // A browser started offline reconnects using its retained sign-in session.
 offline.setOnline(true);offline.setRemote(second);await offline.poll();check(offline.context.worshipWorkspace.getService(),second.service);
 // Preparation mode applies clean remote content automatically, never the live output.
 const prep=await client();prep.node('take').onclick();const before=prep.storage.get(liveKey);prep.setRemote(second);await prep.poll();check(prep.context.worshipWorkspace.getService(),second.service);check(prep.storage.get(liveKey),before);
 // Editing an item holds incoming updates.
 const editing=await client();editing.node('edit').onclick();editing.setRemote(second);await editing.poll();check(editing.context.worshipWorkspace.getService(),initial);check(editing.node('reviewUpdate').hidden,false);
 // Template edits persist with the item but never mutate a projected snapshot.
 const design=await client();design.node('take').onclick();const oldLive=design.storage.get(liveKey);
 design.node('backgroundColor').oninput({target:{value:'#123456'}});
 check(design.context.worshipWorkspace.getService().items[0].template.backgroundType,'color');
 check(JSON.parse(design.storage.get(key)).items[0].template.color,'#123456');check(design.storage.get(liveKey),oldLive);
 design.node('textFont').onchange({target:{value:'Georgia'}});design.node('textSize').onchange({target:{value:'120'}});
 check(JSON.parse(design.storage.get(key)).items[0].template.font,'Georgia');check(JSON.parse(design.storage.get(key)).items[0].template.fontSize,120);
 design.node('textSize').onchange({target:{value:'900'}});check(JSON.parse(design.storage.get(key)).items[0].template.fontSize,120);
 design.node('take').onclick();check(JSON.parse(design.storage.get(liveKey)).template.fontSize,120);check(JSON.parse(design.storage.get(liveKey)).template.color,'#123456');
 const create=design.context.document.createElement;
 design.context.createImageBitmap=async()=>({width:3840,height:2160,close(){}});
 design.context.document.createElement=tag=>tag==='canvas'?{getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,/9j/2Q=='}:create(tag);
 await design.node('backgroundImage').onchange({target:{files:[{type:'image/jpeg',size:1000}],value:'image.jpg'}});
 check(JSON.parse(design.storage.get(key)).items[0].template.backgroundType,'image');
 check(JSON.parse(design.storage.get(key)).items[0].template.image,'data:image/jpeg;base64,/9j/2Q==');
 design.node('removeImage').onclick();check(JSON.parse(design.storage.get(key)).items[0].template.image,'');
 // Built-in motion and fonts save offline and remain separate from the current live snapshot.
 const motions=await client();check(motions.node('motionChoices').children.length,6);check(motions.node('textFont').children.length,29);
 motions.node('take').onclick();const motionLive=motions.storage.get(liveKey);
 motions.node('motionChoices').children[0].onclick();
 check(JSON.parse(motions.storage.get(key)).items[0].template.backgroundType,'motion');check(motions.node('preview').className.includes('motion-aurora'),true);check(motions.storage.get(liveKey),motionLive);
 motions.node('textFont').onchange({target:{value:'Montserrat'}});motions.node('motionEnabled').onchange({target:{checked:false}});
 check(motions.node('preview').className.includes('motion-paused'),true);
 motions.node('take').onclick();check(JSON.parse(motions.storage.get(liveKey)).template.motion,'aurora');check(JSON.parse(motions.storage.get(liveKey)).template.font,'Montserrat');
 motions.node('blackout').onclick();check(motions.node('live').className.includes('motion-background'),false);
 return checks;
}
