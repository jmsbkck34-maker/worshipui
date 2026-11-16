import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const clone=value=>JSON.parse(JSON.stringify(value));
export async function frontendTests(){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/href="https:\/\/www\.songselect\.ccli\.com\/"/);
 assert.doesNotMatch(html,/id="lyricsFile"/);
 const sources=await Promise.all(['slide-template.cjs','content-import.js','bible-search.js','app.js','sync-core.js','sync.js'].map(file=>readFile(new URL('../'+file,import.meta.url),'utf8')));
 const kjv=await readFile(new URL('../assets/bibles/kjv.vpl.txt',import.meta.url),'utf8');
 const initial={title:'Sunday',items:[{id:'song',title:'Original',type:'Song',theme:'dusk',slides:['Original verse','Original chorus']}]};
 const key='worshipui.service.v1',liveKey='worshipui.live.v1',metaKey='worshipui.sync.v1';
 let checks=0;function check(a,b){assert.equal(JSON.stringify(a),JSON.stringify(b));checks++}
 async function client(role='operator',online=true,savedStorage=null){
   const nodes=new Map(),storage=savedStorage||new Map([[key,JSON.stringify(initial)],[metaKey,JSON.stringify({baseRevision:1,baseService:initial,live:false,role,username:role})]]),intervals=[],dated=new Map();
   function element(){return {value:'',open:false,style:{setProperty(key,value){this[key]=value}},children:[],textContent:'',append(...children){this.children.push(...children)},replaceChildren(){this.children=[]},setAttribute(){},showModal(){this.open=true},close(){this.open=false},click(){return this.onclick?.()},innerHTML:''}}
   const node=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
   let remote={revision:1,service:clone(initial),author:'home',savedAt:new Date().toISOString()};
   const listeners=new Map();
   const context={console,URLSearchParams,location:{search:''},structuredClone:clone,crypto:{randomUUID:()=>Math.random().toString()},Blob,Event:class{constructor(type){this.type=type}},
     document:{getElementById:node,createElement:element,querySelector:()=>node('aside'),body:element(),activeElement:null,addEventListener(){}},
     localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},AbortSignal:{timeout(){}},
     confirm:()=>true,setInterval:fn=>intervals.push(fn),setTimeout:()=>1,clearTimeout(){},
     addEventListener(type,fn){listeners.set(type,fn)},dispatchEvent(event){listeners.get(event.type)?.(event)},
     async fetch(url,options={}){if(url==='/assets/bibles/kjv.vpl.txt')return {ok:true,text:async()=>kjv};if(!online)throw Error('Offline');
       let response;
       if(url==='/api/me'||url==='/api/login')response={username:role,role};
       else if(url.startsWith('/api/setlists/')){
         const date=url.slice('/api/setlists/'.length),current=dated.get(date)||null;
         if(options.method==='PUT'){
           const body=JSON.parse(options.body);if(body.baseRevision!==(current?.revision||0))return {ok:false,status:409,json:async()=>({current:clone(current)})};
           const version={revision:(current?.revision||0)+1,service:body.service,author:role,savedAt:new Date().toISOString()};dated.set(date,version);response={version:clone(version)};
         }else response={version:clone(current)};
       }else if(url==='/api/service'&&options.method==='PUT'){
         const body=JSON.parse(options.body);if(body.baseRevision!==remote.revision)return {ok:false,status:409,json:async()=>({current:clone(remote)})};
         remote={revision:remote.revision+1,service:body.service,author:role,savedAt:new Date().toISOString()};response={version:clone(remote)};
       }else if(url==='/api/service')response={version:clone(remote)};
       else throw Error('Unexpected API');
       return {ok:true,status:200,json:async()=>response};
     }};
   context.window=context;vm.createContext(context);sources.forEach(source=>vm.runInContext(source,context));
   await new Promise(resolve=>setTimeout(resolve,0));
   return {nodes,node,storage,context,setRemote:v=>remote=v,setDated:(date,v)=>dated.set(date,v),getDated:date=>dated.get(date),setOnline:v=>online=v,async poll(){await intervals[0]();await new Promise(resolve=>setTimeout(resolve,0))}};
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
 const imports=await client();imports.node('settings').onclick();check(imports.node('settingsDialog').open,true);check(imports.context.worshipWorkspace.editing(),true);
 imports.node('ccliChurchCopyright').value='123456';imports.node('ccliStreaming').value='234567';imports.node('ccliStreamingPlus').value='345678';imports.node('ccliRehearsal').value='456789';imports.node('saveCcliSettings').onclick();
 check(JSON.parse(imports.storage.get('worshipui.ccli.v1')),{churchCopyright:'123456',streaming:'234567',streamingPlus:'345678',rehearsal:'456789'});
 check(JSON.stringify(imports.context.worshipWorkspace.getService()).includes('123456'),false);
 check(imports.context.worshipWorkspace.getService().items.length,1);imports.node('take').onclick();
 check(JSON.parse(imports.storage.get(liveKey)).ccliFooter,'CCLI License #123456');
 imports.node('scriptureVersion').value='ESV';imports.node('scriptureReference').value='John 3:16';imports.node('scriptureText').value='First verse text\n\nSecond verse text';
 imports.node('secondaryScriptureVersion').value='Reina-Valera 1960';imports.node('secondaryScriptureText').value='Primer versículo\n\nSegundo versículo';
 imports.node('scriptureText').oninput();
 imports.node('secondaryScriptureText').value='Un solo versículo';imports.node('secondaryScriptureText').oninput();
 check(imports.node('addScripture').disabled,true);
 imports.node('secondaryScriptureText').value='Primer versículo\n\nSegundo versículo';imports.node('secondaryScriptureText').oninput();
 check(imports.node('addScripture').disabled,false);imports.node('addScripture').onclick();
 const added=imports.context.worshipWorkspace.getService().items[1];
 check(added.title,'John 3:16 · ESV');check(added.slides,['First verse text','Second verse text']);
 check(added.primaryVersion,'ESV');check(added.secondaryVersion,'Reina-Valera 1960');check(added.secondarySlides,['Primer versículo','Segundo versículo']);
 check(imports.node('preview').children[0].className,'slide-columns');check(imports.node('preview').children[0].children.length,2);
 imports.node('take').onclick();check(JSON.parse(imports.storage.get(liveKey)).secondaryText,'Primer versículo');
 check(JSON.parse(imports.storage.get(liveKey)).nextSecondaryText,'Segundo versículo');
 imports.node('edit').onclick();check(imports.node('itemSecondaryVersion').value,'Reina-Valera 1960');
 imports.node('itemSecondaryText').value='Uno';imports.node('itemForm').onsubmit({preventDefault(){}});
 check(imports.node('toast').textContent,'Both translations must have the same number of slides.');
 // Dated workspaces are retained offline and independently uploaded on reconnect.
 const calendar=await client('operator',false);
 calendar.node('setlistDate').value='2026-12-06';calendar.node('copyDate').onclick();
 check(calendar.context.worshipWorkspace.getService(),initial);
 calendar.node('serviceTitle').oninput({target:{value:'First Sunday'}});
 calendar.node('setlistDate').value='2026-12-13';calendar.node('openDate').onclick();
 check(calendar.context.worshipWorkspace.getService().items.length,0);
 calendar.node('serviceTitle').oninput({target:{value:'Second Sunday'}});
 calendar.node('openUndated').onclick();check(calendar.context.worshipWorkspace.getService(),initial);
 calendar.setOnline(true);await calendar.poll();
 check(calendar.getDated('2026-12-06').service.title,'First Sunday');
 check(calendar.getDated('2026-12-13').service.title,'Second Sunday');
 const reopened=await client('operator',false,calendar.storage);
 reopened.node('setlistDate').value='2026-12-06';reopened.node('openDate').onclick();
 check(reopened.context.worshipWorkspace.getService().title,'First Sunday');
 reopened.node('liveMode').onclick();reopened.node('setlistDate').value='2026-12-13';reopened.node('openDate').onclick();
 check(reopened.context.worshipWorkspace.getDate(),'2026-12-06');
 const datedConflict=await client('operator',false);
 datedConflict.node('setlistDate').value='2026-12-20';datedConflict.node('openDate').onclick();
 datedConflict.node('serviceTitle').oninput({target:{value:'Local Sunday'}});
 const remoteDate={revision:1,service:{title:'Remote Sunday',items:[]},author:'home',savedAt:new Date().toISOString()};
 datedConflict.setDated('2026-12-20',remoteDate);datedConflict.setOnline(true);await datedConflict.poll();
 check(datedConflict.context.worshipWorkspace.getService().title,'Local Sunday');check(datedConflict.node('reviewUpdate').hidden,false);
 datedConflict.node('reviewUpdate').onclick();datedConflict.node('acceptRemote').onclick();
 check(datedConflict.context.worshipWorkspace.getService().title,'Remote Sunday');
 // Saved and imported songs can be selected in the editor; KJV works offline.
 const content=await client('operator',false);
 content.node('add').onclick();content.node('titleInput').value='Local song';content.node('textInput').value='First slide\n\nSecond slide';
 content.node('saveSongTemplate').onclick();check(JSON.parse(content.storage.get('worshipui.songs.v1')).songs.length,1);
 content.node('songSearch').value='Local';content.node('songSearch').oninput();check(content.node('songResults').children.length,1);
 content.node('songResults').children[0].onclick();content.node('itemForm').onsubmit({preventDefault(){}});
 check(content.context.worshipWorkspace.getService().items[1].title,'Local song');
 content.node('add').onclick();await content.node('songFile').onchange({target:{files:[{name:'Imported.txt',size:11,text:async()=>'Verse text'}],value:'Imported.txt'}});
 check(JSON.parse(content.storage.get('worshipui.songs.v1')).songs.length,2);
 content.node('typeInput').value='Scripture';content.node('typeInput').onchange();content.node('bibleQuery').value='John 3:16-17';await content.node('searchBible').onclick();
 check(content.node('bibleResults').children.length,1);content.node('bibleResults').children[0].onclick();
 check(content.node('itemPrimaryVersion').value,'KJV');content.node('itemForm').onsubmit({preventDefault(){}});
 check(content.context.worshipWorkspace.getService().items.at(-1).slides.length,2);
 return checks;
}
