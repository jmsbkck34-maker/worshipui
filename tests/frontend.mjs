import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const clone=value=>JSON.parse(JSON.stringify(value));
export async function frontendTests(){
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 // www.songselect.ccli.com has no valid certificate; the bare host does.
 assert.match(html,/href="https:\/\/songselect\.ccli\.com\/"/);
 assert.doesNotMatch(html,/www\.songselect/);
 assert.doesNotMatch(html,/id="lyricsFile"/);
 const sources=await Promise.all(['slide-template.cjs','content-import.js','bible-search.js','app.js','sync-core.js','sync.js'].map(file=>readFile(new URL('../'+file,import.meta.url),'utf8')));
 const kjv=await readFile(new URL('../assets/bibles/kjv.vpl.txt',import.meta.url),'utf8');
 const rv1909=await readFile(new URL('../assets/bibles/rv1909.vpl.txt',import.meta.url),'utf8');
 const initial={title:'Sunday',items:[{id:'song',title:'Original',type:'Song',theme:'dusk',slides:['Original verse','Original chorus']}]};
 const key='worshipui.service.v1',liveKey='worshipui.live.v1',metaKey='worshipui.sync.v1';
 let checks=0;function check(a,b){assert.equal(JSON.stringify(a),JSON.stringify(b));checks++}
 async function client(role='operator',online=true,savedStorage=null,desktop=null){
   const nodes=new Map(),storage=savedStorage||new Map([[key,JSON.stringify(initial)],[metaKey,JSON.stringify({baseRevision:1,baseService:initial,live:false,role,username:role})]]),intervals=[],dated=new Map();
   function element(){return {value:'',open:false,style:{setProperty(key,value){this[key]=value}},children:[],textContent:'',append(...children){this.children.push(...children)},replaceChildren(){this.children=[]},setAttribute(){},showModal(){this.open=true},close(){this.open=false},click(){return this.onclick?.()},innerHTML:''}}
   const node=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
   let remote={revision:1,service:clone(initial),author:'home',savedAt:new Date().toISOString()},brandingRemote=null;
   const listeners=new Map(),documentListeners=new Map();
   const context={console,URLSearchParams,location:{search:''},structuredClone:clone,crypto:{randomUUID:()=>Math.random().toString()},Blob,Event:class{constructor(type){this.type=type}},
     document:{getElementById:node,createElement:element,querySelector:selector=>selector==='dialog[open]'?null:node('aside'),body:element(),activeElement:null,addEventListener(type,fn){documentListeners.set(type,fn)}},
     localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},AbortSignal:{timeout(){}},
     confirm:()=>true,setInterval:fn=>intervals.push(fn),setTimeout:()=>1,clearTimeout(){},
     addEventListener(type,fn){listeners.set(type,fn)},dispatchEvent(event){listeners.get(event.type)?.(event)},
     async fetch(url,options={}){if(url==='/assets/bibles/kjv.vpl.txt')return {ok:true,text:async()=>kjv};if(url==='/assets/bibles/rv1909.vpl.txt')return {ok:true,text:async()=>rv1909};if(!online)throw Error('Offline');
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
       else if(url==='/api/branding'&&options.method==='PUT'){
         const body=JSON.parse(options.body);if(body.baseRevision!==(brandingRemote?.revision||0))return {ok:false,status:409,json:async()=>({current:clone(brandingRemote)})};
         brandingRemote={revision:(brandingRemote?.revision||0)+1,branding:body.branding,author:role,savedAt:new Date().toISOString()};response={version:clone(brandingRemote)};
       }else if(url==='/api/branding')response={version:clone(brandingRemote)};
       else throw Error('Unexpected API');
       return {ok:true,status:200,json:async()=>response};
     }};
   if(desktop)context.worshipDesktop=desktop;
   context.window=context;vm.createContext(context);sources.forEach(source=>vm.runInContext(source,context));
   await new Promise(resolve=>setTimeout(resolve,0));
   return {nodes,node,storage,context,keydown:event=>documentListeners.get('keydown')(event),setRemote:v=>remote=v,getBrandingRemote:()=>clone(brandingRemote),setBrandingRemote:v=>brandingRemote=v,setDated:(date,v)=>dated.set(date,v),getDated:date=>dated.get(date),setOnline:v=>online=v,async poll(){await intervals[0]();await new Promise(resolve=>setTimeout(resolve,0))}};
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
 check(content.node('songResults').children.length,0);check(content.node('songStatus').textContent,'Song saved to this device’s library.');
 content.node('songSearch').value='  ';content.node('songSearch').oninput();check(content.node('songResults').children.length,0);
 content.node('songSearch').value='Local';content.node('songSearch').oninput();check(content.node('songResults').children.length,1);
 content.node('songResults').children[0].onclick();content.node('itemForm').onsubmit({preventDefault(){}});
 check(content.context.worshipWorkspace.getService().items[1].title,'Local song');
 content.node('add').onclick();await content.node('songFile').onchange({target:{files:[{name:'Imported.txt',size:11,text:async()=>'Verse text'}],value:'Imported.txt'}});
 check(JSON.parse(content.storage.get('worshipui.songs.v1')).songs.length,2);
 content.node('typeInput').value='Scripture';await content.node('typeInput').onchange();
 check(content.node('bibleBook').children.length,66);
 content.node('bibleBook').value='JOH';content.node('bibleBook').onchange();
 content.node('bibleChapter').value='3';content.node('bibleChapter').onchange();
 content.node('bibleFirst').value='16';content.node('bibleFirst').onchange();content.node('bibleLast').value='17';content.node('addBiblePassage').onclick();
 check(content.context.worshipWorkspace.getService().items.at(-1).primaryVersion,'KJV');
 check(content.context.worshipWorkspace.getService().items.at(-1).slides.length,2);check(content.node('itemDialog').open,false);
 content.node('edit').onclick();content.node('addBiblePassage').onclick();
 check(content.node('itemPrimaryVersion').value,'KJV');check(content.node('itemDialog').open,true);
 content.node('add').onclick();content.node('typeInput').value='Scripture';content.node('typeInput').onchange();
 check(content.node('titleInput').required,false);content.node('titleInput').value='';content.node('textInput').value='Scripture text';
 content.node('itemForm').onsubmit({preventDefault(){}});check(content.context.worshipWorkspace.getService().items.at(-1).title,'Scripture');
 content.node('add').onclick();check(content.node('titleInput').required,true);
 content.node('scriptureVersion').value='KJV';content.node('scriptureReference').value='';content.node('scriptureText').value='Verse text';
 content.node('scriptureText').oninput();check(content.node('addScripture').disabled,false);content.node('addScripture').onclick();
 check(content.context.worshipWorkspace.getService().items.at(-1).title,'Scripture · KJV');
 const combined=await client('operator',false);
 combined.node('add').onclick();combined.node('typeInput').value='Scripture';await combined.node('typeInput').onchange();
 combined.node('bibleBook').value='JOH';combined.node('bibleBook').onchange();combined.node('bibleChapter').value='3';combined.node('bibleChapter').onchange();
 combined.node('bibleFirst').value='16';combined.node('bibleFirst').onchange();combined.node('bibleLast').value='17';combined.node('bibleLayout').value='combined';combined.node('addBiblePassage').onclick();
 const passage=combined.context.worshipWorkspace.getService().items.at(-1);
 check(passage.slides.length,1);check(passage.slides[0].includes('John 3:16 · KJV'),true);check(passage.slides[0].includes('John 3:17 · KJV'),true);check(passage.fitText,true);
 combined.node('take').onclick();check(JSON.parse(combined.storage.get(liveKey)).fitText,true);
 combined.node('edit').onclick();combined.node('itemForm').onsubmit({preventDefault(){}});check(combined.context.worshipWorkspace.getService().items.at(-1).slides.length,1);check(combined.context.worshipWorkspace.getService().items.at(-1).fitText,true);
 combined.node('scriptureVersion').value='KJV';combined.node('scriptureText').value='First verse\n\nSecond verse';combined.node('scriptureLayout').value='combined';
 combined.node('secondaryScriptureVersion').value='Other';combined.node('secondaryScriptureText').value='First translation\n\nSecond translation';
 combined.node('addScripture').onclick();const paired=combined.context.worshipWorkspace.getService().items.at(-1);
 check(paired.slides,['First verse\nSecond verse']);check(paired.secondarySlides,['First translation\nSecond translation']);check(paired.fitText,true);
 check(combined.context.worshipWorkspace.getService().items.find(item=>item.id===passage.id).verseSlides.length,2);
 const pairedIndex=combined.context.worshipWorkspace.getService().items.findIndex(item=>item.id===paired.id);
 combined.node('order').children[pairedIndex].children[0].onclick();combined.node('templateEdit').onclick();
 check(combined.node('verseLayoutSection').hidden,false);check(combined.node('verseLayout').textContent,'One verse per slide');
 combined.node('verseLayout').onclick();let toggled=combined.context.worshipWorkspace.getService().items[pairedIndex];
 check(toggled.slides,['First verse','Second verse']);check(toggled.secondarySlides,['First translation','Second translation']);check(toggled.fitText,undefined);check(toggled.verseSlides,undefined);
 check(combined.node('verseLayout').textContent,'All verses on one slide');
 combined.node('verseLayout').onclick();toggled=combined.context.worshipWorkspace.getService().items[pairedIndex];
 check(toggled.slides,['First verse\nSecond verse']);check(toggled.verseSlides,['First verse','Second verse']);check(toggled.secondaryVerseSlides,['First translation','Second translation']);check(toggled.fitText,true);
 combined.node('scriptureText').value='a'.repeat(15000)+'\n\n'+'b'.repeat(10000);combined.node('secondaryScriptureVersion').value='';combined.node('secondaryScriptureText').value='';
 const count=combined.context.worshipWorkspace.getService().items.length;combined.node('addScripture').onclick();check(combined.context.worshipWorkspace.getService().items.length,count);check(combined.node('scriptureImportStatus').textContent.includes('20,000'),true);
 const keys=await client('operator',false);
 const space=target=>keys.keydown({target,key:' ',preventDefault(){},repeat:false});
 space({tagName:'DIV'});check(JSON.parse(keys.storage.get(liveKey)).text,'Original verse');
 space(Object.assign(keys.node('take'),{tagName:'BUTTON'}));check(JSON.parse(keys.storage.get(liveKey)).text,'Original chorus');
 space({tagName:'DIV'});check(JSON.parse(keys.storage.get(liveKey)).text,'Original chorus');
 keys.node('slides').children[0].onclick();keys.node('take').onclick();keys.node('blackout').onclick();space({tagName:'DIV'});
 check(JSON.parse(keys.storage.get(liveKey)).text,'Original chorus');check(JSON.parse(keys.storage.get(liveKey)).black,true);
 const sections=await client('operator',false);
 sections.node('slides').children[0].oncontextmenu({preventDefault(){}});
 check(sections.node('songSectionDialog').open,true);sections.node('songSectionChoice').value='Verse 1';sections.node('songSectionForm').onsubmit({preventDefault(){}});
 check(sections.context.worshipWorkspace.getService().items[0].sectionLabels,['Verse 1','']);
 check(sections.node('slides').children[0].children[1].textContent.includes('Verse 1'),true);
 sections.node('slides').children[1].onclick();sections.node('songSection').onclick();sections.node('songSectionChoice').value='custom';sections.node('songSectionChoice').onchange();
 check(sections.node('songSectionCustomLabel').hidden,false);sections.node('songSectionCustom').value='Chorus 2';sections.node('songSectionForm').onsubmit({preventDefault(){}});
 check(sections.context.worshipWorkspace.getService().items[0].sectionLabels,['Verse 1','Chorus 2']);
 sections.node('take').onclick();check(Object.hasOwn(JSON.parse(sections.storage.get(liveKey)),'sectionLabels'),false);
 sections.node('edit').onclick();sections.node('textInput').value='Edited verse\n\nOriginal chorus\n\nNew slide';
 sections.context.confirm=()=>false;sections.node('itemForm').onsubmit({preventDefault(){}});
 check(sections.node('itemDialog').open,true);check(sections.context.worshipWorkspace.getService().items[0].sectionLabels,['Verse 1','Chorus 2']);
 sections.context.confirm=()=>true;sections.node('cancel').onclick();
 sections.node('edit').onclick();sections.node('textInput').value='Original chorus\n\nOriginal verse';sections.node('itemForm').onsubmit({preventDefault(){}});
 check(sections.context.worshipWorkspace.getService().items[0].sectionLabels,['Chorus 2','Verse 1']);
 sections.node('edit').onclick();sections.node('saveSongTemplate').onclick();sections.node('cancel').onclick();
 sections.node('add').onclick();check(sections.node('songResults').children.length,0);
 sections.node('songSearch').value='Original';sections.node('songSearch').oninput();sections.node('songResults').children[0].onclick();sections.node('itemForm').onsubmit({preventDefault(){}});
 check(sections.context.worshipWorkspace.getService().items.at(-1).sectionLabels,['Chorus 2','Verse 1']);
 sections.node('edit').onclick();sections.node('typeInput').value='Announcement';sections.node('typeInput').onchange();sections.node('itemForm').onsubmit({preventDefault(){}});
 check(Object.hasOwn(sections.context.worshipWorkspace.getService().items.at(-1),'sectionLabels'),false);
 // Church branding saves locally, shares with revisions, and asks before overwriting another computer's change.
 const settle=()=>new Promise(resolve=>setTimeout(resolve,20));
 const brand=await client();await settle();
 brand.node('brandName').value='Grace Church';brand.node('brandAddress').value='1 Main St';brand.node('saveBranding').onclick();await settle();
 check(brand.node('churchName').textContent,'Grace Church');check(brand.getBrandingRemote().branding.name,'Grace Church');
 check(JSON.parse(brand.storage.get('worshipui.branding.v1')).baseRevision,1);
 brand.setBrandingRemote({revision:2,branding:{name:'Shared name',address:'',logo:'',showOnBlackout:true},author:'home',savedAt:new Date().toISOString()});
 brand.node('brandName').value='Local name';brand.node('saveBranding').onclick();await settle();
 check(brand.node('brandingConflict').hidden,false);check(brand.getBrandingRemote().branding.name,'Shared name');
 brand.node('keepLocalBranding').onclick();await settle();
 check(brand.getBrandingRemote().revision,3);check(brand.getBrandingRemote().branding.name,'Local name');check(brand.node('brandingConflict').hidden,true);
 const logoRecord={version:1,branding:{name:'',address:'',logo:'data:image/png;base64,iVBORw0KGgo=',showOnBlackout:true},baseRevision:0,baseBranding:null};
 const lit=await client('operator',false,new Map([[key,JSON.stringify(initial)],[metaKey,JSON.stringify({baseRevision:1,baseService:initial,live:false,role:'operator',username:'operator'})],['worshipui.branding.v1',JSON.stringify(logoRecord)]]));
 check(lit.node('headerLogo').hidden,false);
 lit.node('take').onclick();check(lit.node('live').children.some(child=>child.className==='blackout-logo'),false);
 lit.node('blackout').onclick();check(lit.node('live').children.some(child=>child.className==='blackout-logo'),true);
 // A single click previews a slide; a quick second click on the same slide takes it live.
 const quick=await client('operator',false);
 quick.node('slides').children[1].onclick();check(JSON.parse(quick.storage.get(liveKey)||'{}').text===undefined||JSON.parse(quick.storage.get(liveKey)).text!=='Original chorus',true);
 quick.node('slides').children[1].onclick();check(JSON.parse(quick.storage.get(liveKey)).text,'Original chorus');
 // The Bible picker adds the Spanish second translation by default, verse for verse.
 const spanish=await client('operator',false);
 check(spanish.node('secondLanguage').value,'es');
 spanish.node('add').onclick();spanish.node('typeInput').value='Scripture';await spanish.node('typeInput').onchange();await settle();
 check(spanish.node('bibleSecond').hidden,false);check(spanish.node('bibleSecond').textContent.startsWith('+ Add Spanish'),true);spanish.node('bibleSecond').onclick();check(spanish.node('bibleSecond').textContent.startsWith('✓'),true);
 spanish.node('bibleBook').value='JOH';spanish.node('bibleBook').onchange();spanish.node('bibleChapter').value='3';spanish.node('bibleChapter').onchange();
 spanish.node('bibleFirst').value='16';spanish.node('bibleFirst').onchange();spanish.node('bibleLast').value='17';spanish.node('bibleLayout').value='verses';
 await spanish.node('addBiblePassage').onclick();
 const parallelItem=spanish.context.worshipWorkspace.getService().items.at(-1);
 check(parallelItem.secondaryVersion,'RVR1909');check(parallelItem.secondarySlides.length,2);check(parallelItem.secondarySlides[0].endsWith('Juan 3:16 · RVR1909'),true);check(parallelItem.slides[0].endsWith('John 3:16 · KJV'),true);
 spanish.node('secondLanguage').value='fr';spanish.node('secondLanguage').onchange();
 check(JSON.parse(spanish.storage.get('worshipui.language.v1')).secondLanguage,'fr');check(spanish.node('bibleSecond').hidden,true);
 // Another version: pasted from YouVersion, split on verse numbers, labelled with that translation.
 const yv=await client('operator',false);
 yv.node('add').onclick();yv.node('typeInput').value='Scripture';await yv.node('typeInput').onchange();await settle();
 yv.node('bibleVersion').value='YOUVERSION';await yv.node('bibleVersion').onchange();check(yv.node('youVersionTools').hidden,false);
 yv.node('youVersionId').value='NIV';
 yv.node('bibleBook').value='JOH';yv.node('bibleBook').onchange();yv.node('bibleChapter').value='3';yv.node('bibleChapter').onchange();
 yv.node('bibleFirst').value='16';yv.node('bibleFirst').onchange();yv.node('bibleLast').value='17';yv.node('bibleLayout').value='verses';
 yv.node('youVersionText').value='16 For God so loved the world. 17 For God did not send his Son. John 3:16-17 NIV';
 await yv.node('addBiblePassage').onclick();
 const pastedItem=yv.context.worshipWorkspace.getService().items.at(-1);
 check(pastedItem.primaryVersion,'NIV');check(pastedItem.title,'John 3:16-17 · NIV');check(pastedItem.slides,['For God so loved the world.\nJohn 3:16 · NIV','For God did not send his Son.\nJohn 3:17 · NIV']);check(pastedItem.secondarySlides,undefined);
 // The second translation box can be filled from the slide references.
 const fill=await client('operator',false);
 fill.node('add').onclick();fill.node('typeInput').value='Scripture';await fill.node('typeInput').onchange();await settle();
 check(fill.node('fillSecondLanguage').hidden,false);
 fill.node('textInput').value='For God so loved the world.\nJohn 3:16 · KJV\n\nFor God sent not his Son.\nJohn 3:17 · KJV';
 await fill.node('fillSecondLanguage').onclick();
 check(fill.node('itemSecondaryVersion').value,'RVR1909');check(fill.node('itemPrimaryVersion').value,'KJV');
 check(fill.node('itemSecondaryText').value.split('\n\n').map(slide=>slide.split('\n').at(-1)),['Juan 3:16 · RVR1909','Juan 3:17 · RVR1909']);
 fill.node('textInput').value='No reference here';await fill.node('fillSecondLanguage').onclick();check(fill.node('fillSecondStatus').textContent.includes('verse reference'),true);
 // Slides can target one audience screen; each screen chooses which language it shows.
 const screens=await client('operator',false);
 screens.node('slides').children[1].onclick();screens.node('slideScreen').value='2';screens.node('slideScreen').onchange();
 check(screens.context.worshipWorkspace.getService().items[0].slideScreens,['','2']);
 check(screens.node('slides').children[1].children[1].textContent.endsWith(' · Screen 2'),true);
 screens.node('take').onclick();check(JSON.parse(screens.storage.get(liveKey)).screen,'2');
 screens.node('slideScreen').value='';screens.node('slideScreenAll').onclick();check(screens.context.worshipWorkspace.getService().items[0].slideScreens,undefined);
 screens.node('screen2Show').value='second';screens.node('screen2Show').onchange();
 check(JSON.parse(screens.storage.get('worshipui.screens.v1')).screens.map(screen=>screen.show),['both','second']);
 // The header toggle makes Spanish the main language; the second-language button then adds English.
 const es=await client('operator',false);
 es.node('langEs').onclick();check(JSON.parse(es.storage.get('worshipui.language.v1')).mainLanguage,'es');check(es.node('secondLanguage').disabled,true);
 es.node('add').onclick();es.node('typeInput').value='Scripture';await es.node('typeInput').onchange();await settle();
 check(es.node('bibleVersion').value,'RVR1909');check(es.node('bibleSecond').textContent,'+ Add English · KJV');
 es.node('bibleSecond').onclick();
 es.node('bibleBook').value='JOH';es.node('bibleBook').onchange();es.node('bibleChapter').value='3';es.node('bibleChapter').onchange();
 es.node('bibleFirst').value='16';es.node('bibleFirst').onchange();es.node('bibleLast').value='16';es.node('bibleLayout').value='verses';
 await es.node('addBiblePassage').onclick();
 const spanishMain=es.context.worshipWorkspace.getService().items.at(-1);
 check(spanishMain.title,'Juan 3:16 · RVR1909');check(spanishMain.secondaryVersion,'KJV');check(spanishMain.secondarySlides[0].endsWith('John 3:16 · KJV'),true);
 es.node('langEn').onclick();check(JSON.parse(es.storage.get('worshipui.language.v1')).mainLanguage,'en');check(es.node('bibleVersion').value,'KJV');
 // Screen setup keeps each screen's display when its language choice changes; without the desktop app it explains dragging.
 const setup=await client('operator',false,new Map([[key,JSON.stringify(initial)],[metaKey,JSON.stringify({baseRevision:1,baseService:initial,live:false,role:'operator',username:'operator'})],['worshipui.screens.v1',JSON.stringify({version:1,screens:[{show:'both',display:7},{show:'both'}],stage:{display:9}})]]));
 setup.node('screen1Show').value='first';setup.node('screen1Show').onchange();
 check(JSON.parse(setup.storage.get('worshipui.screens.v1')),{version:1,screens:[{show:'first',display:7},{show:'both'}],stage:{display:9}});
 setup.node('screenSetup').onclick();await settle();
 check(setup.node('screensStatus').textContent.startsWith('Display placement is available in the installed app'),true);check(setup.node('audience1Show').value,'first');
 setup.node('stageDisplay').value='';setup.node('stageDisplay').onchange();check(JSON.parse(setup.storage.get('worshipui.screens.v1')).stage,undefined);
 // Saved setlists under the calendar: newest first, click to open, delete (except the open one) with a recovery copy.
 const entry=title=>({service:{title,items:[]},baseRevision:0,baseService:{title,items:[]}});
 const savedLibrary={version:1,active:'2026-11-22',entries:{undated:entry('Undated'),'2026-11-22':entry('Advent 1'),'2026-11-29':entry('Advent 2'),'2026-11-15':entry('Thanksgiving')}};
 const dates=await client('operator',false,new Map([[metaKey,JSON.stringify({baseRevision:0,baseService:null,live:false,role:'operator',username:'operator'})],['worshipui.setlists.v1',JSON.stringify(savedLibrary)]]));
 dates.context.worshipWorkspace.setRole('operator');dates.node('liveMode').onclick();dates.node('liveMode').onclick();
 const rows=()=>dates.node('savedSetlists').children;
 check(rows().map(row=>row.children[0].title),['2026-11-29','2026-11-22','2026-11-15']);
 check(rows()[1].children.length,1);check(rows()[0].children[0].children[1].textContent,'Advent 2');
 rows()[0].children[0].onclick();check(dates.context.worshipWorkspace.getDate(),'2026-11-29');check(dates.context.worshipWorkspace.getService().title,'Advent 2');
 rows()[2].children[1].onclick();
 check(Object.keys(JSON.parse(dates.storage.get('worshipui.setlists.v1')).entries).sort(),['2026-11-22','2026-11-29','undated']);
 check(JSON.parse(dates.storage.get('worshipui.recovery.v1')).at(-1).service.title,'Thanksgiving');
 check(rows().map(row=>row.children[0].title),['2026-11-29','2026-11-22']);
 // Switching setlists warns about changes not yet on the shared server; cancelling stays put.
 const unpublished={version:1,active:'2026-11-22',entries:{undated:entry('Undated'),'2026-11-22':{service:{title:'Edited offline',items:[]},baseRevision:3,baseService:{title:'Shared copy',items:[]}},'2026-11-29':entry('Advent 2')}};
 const leave=await client('operator',false,new Map([[metaKey,JSON.stringify({baseRevision:3,baseService:{title:'Shared copy',items:[]},live:false,role:'operator',username:'operator'})],['worshipui.setlists.v1',JSON.stringify(unpublished)]]));
 leave.context.worshipWorkspace.setRole('operator');leave.node('liveMode').onclick();leave.node('liveMode').onclick();
 let prompt='';leave.context.confirm=message=>{prompt=message;return false};
 leave.node('savedSetlists').children[0].children[0].onclick();
 check(prompt.includes('not on the shared server yet'),true);check(prompt.endsWith('Switch setlists anyway?'),true);check(leave.context.worshipWorkspace.getDate(),'2026-11-22');
 leave.context.confirm=()=>true;leave.node('savedSetlists').children[0].children[0].onclick();check(leave.context.worshipWorkspace.getDate(),'2026-11-29');
 // Without changes, no prompt.
 prompt='';leave.context.confirm=message=>{prompt=message;return true};leave.node('savedSetlists').children[1].children[0].onclick();check(prompt,'');
 // Copied YouVersion text moves the passage selectors to what was copied and previews the slides.
 const flow=await client('operator',false);
 flow.node('add').onclick();flow.node('typeInput').value='Scripture';await flow.node('typeInput').onchange();await settle();
 flow.node('bibleVersion').value='YOUVERSION';await flow.node('bibleVersion').onchange();
 flow.node('youVersionText').value='1 The LORD is my shepherd; I shall not want. 2 He makes me lie down in green pastures.\nPsalm 23:1-2 ESV\n\nhttps://bible.com/bible/59/psa.23.1-2.ESV';
 flow.node('youVersionText').oninput();
 check([flow.node('bibleBook').value,flow.node('bibleChapter').value,flow.node('bibleFirst').value,flow.node('bibleLast').value,flow.node('youVersionId').value],['PSA','23','1','2','ESV']);
 check(flow.node('youVersionPreview').hidden,false);check(flow.node('youVersionPreview').children[0].textContent,'2 slides · Psalms 23:1-2 · ESV');
 await flow.node('addBiblePassage').onclick();
 check(flow.context.worshipWorkspace.getService().items.at(-1).slides,['The LORD is my shepherd; I shall not want.\nPsalms 23:1 · ESV','He makes me lie down in green pastures.\nPsalms 23:2 · ESV']);
 // Song slides: duplicate the chorus, drag it into place, move and delete; labels and the live slide follow.
 const song={title:'Sunday',items:[{id:'song',title:'Song',type:'Song',theme:'dusk',slides:['Verse one','Chorus','Verse two'],sectionLabels:['Verse 1','Chorus','Verse 2']}]};
 const edit=await client('operator',false,new Map([[key,JSON.stringify(song)],[metaKey,JSON.stringify({baseRevision:1,baseService:song,live:false,role:'operator',username:'operator'})]]));
 const slidesOf=()=>edit.context.worshipWorkspace.getService().items[0];
 edit.node('slides').children[1].onclick();edit.node('take').onclick();
 edit.node('slideDuplicate').onclick();
 check(slidesOf().slides,['Verse one','Chorus','Chorus','Verse two']);check(slidesOf().sectionLabels,['Verse 1','Chorus','Chorus','Verse 2']);
 const cards=()=>edit.node('slides').children,drop={preventDefault(){}};
 cards()[2].ondragstart({dataTransfer:{setData(){}}});cards()[3].ondrop(drop);
 check(slidesOf().slides,['Verse one','Chorus','Verse two','Chorus']);check(slidesOf().sectionLabels,['Verse 1','Chorus','Verse 2','Chorus']);
 edit.node('slideMoveLeft').onclick();check(slidesOf().slides,['Verse one','Chorus','Chorus','Verse two']);
 edit.node('slideDelete').onclick();check(slidesOf().slides,['Verse one','Chorus','Verse two']);check(slidesOf().sectionLabels,['Verse 1','Chorus','Verse 2']);
 // The live chorus (slide 2) is still the live slide, so Space advances to Verse two.
 edit.keydown({key:' ',target:{tagName:'DIV'},preventDefault(){}});check(JSON.parse(edit.storage.get(liveKey)).text,'Verse two');
 // Licensed Bible versions (installed app): listed in Settings, offered under Version, and used for slides.
 const shelf=[{id:'NIV',name:'New International Version',language:'en'}],saved=[];
 const licensed=await client('operator',false,null,{listBibles:async()=>shelf.slice(),readBible:async id=>kjv.replace('JOH 3:16 ','JOH 3:16 Licensed: '),saveBible:async(version,text)=>{saved.push([version,text.length]);shelf.push(version);return version},deleteBible:async id=>{shelf.splice(shelf.findIndex(v=>v.id===id),1)}});
 await settle();
 check(licensed.node('licensedList').children[0].children[0].textContent,'NIV · New International Version · English');
 licensed.node('add').onclick();licensed.node('typeInput').value='Scripture';await licensed.node('typeInput').onchange();await settle();
 check(licensed.node('bibleVersion').children.map(option=>option.value),['KJV','NIV','YOUVERSION']);
 licensed.node('bibleVersion').value='NIV';await licensed.node('bibleVersion').onchange();await settle();
 licensed.node('bibleBook').value='JOH';licensed.node('bibleBook').onchange();licensed.node('bibleChapter').value='3';licensed.node('bibleChapter').onchange();
 licensed.node('bibleFirst').value='16';licensed.node('bibleFirst').onchange();licensed.node('bibleLast').value='16';licensed.node('bibleLayout').value='verses';
 await licensed.node('addBiblePassage').onclick();
 const licensedItem=licensed.context.worshipWorkspace.getService().items.at(-1);
check(licensedItem.primaryVersion,'NIV');check(licensedItem.slides[0].startsWith('Licensed: For God'),true);check(licensedItem.slides[0].endsWith('John 3:16 · NIV'),true);
 // Adding needs an abbreviation and a name first; then the file is saved through the desktop bridge.
 licensed.node('licensedId').value='';licensed.node('licensedName').value='';
 await licensed.node('licensedFile').onchange({target:{files:[{text:async()=>'x'}],value:''}});
 check(licensed.node('licensedStatus').textContent.startsWith('Enter the abbreviation'),true);check(saved.length,0);
 licensed.node('licensedId').value='esv';licensed.node('licensedName').value='English Standard Version';licensed.node('licensedLanguage').value='en';
 await licensed.node('licensedFile').onchange({target:{files:[{text:async()=>'GEN 1:1 In the beginning'}],value:''}});
 check(saved[0][0],{id:'ESV',name:'English Standard Version',language:'en'});check(licensed.node('licensedList').children.length,2);
 // Countdown items: made in the editor, shown as one slide, and live with a running timer.
 const timer=await client('operator',false);
 timer.node('add').onclick();timer.node('typeInput').value='Countdown';await timer.node('typeInput').onchange();
 check(timer.node('countdownFields').hidden,false);check(timer.node('textInputRow').hidden,true);
 timer.node('countdownMode').value='duration';timer.node('countdownMinutes').value='2';timer.node('countdownSeconds').value='30';
 timer.node('countdownMessage').value='Service begins in';timer.node('countdownEnd').value='message';timer.node('countdownEndMessage').value='Welcome!';
 timer.node('titleInput').value='';timer.node('itemForm').onsubmit({preventDefault(){}});
 const countdownItem=timer.context.worshipWorkspace.getService().items.at(-1);
 check([countdownItem.title,countdownItem.type,countdownItem.slides],['Countdown','Countdown',['Service begins in\n2:30']]);
 check(countdownItem.countdown,{mode:'duration',seconds:150,message:'Service begins in',end:'message',endMessage:'Welcome!'});
 const timerStart=Date.now();timer.node('take').onclick();const liveTimer=JSON.parse(timer.storage.get(liveKey));
 check(liveTimer.type,'Countdown');check(liveTimer.countdown.target>=timerStart+150000&&liveTimer.countdown.target<=Date.now()+150000,true);
 check(timer.node('live').children[0].textContent.startsWith('Service begins in\n2:'),true);
 // Setlist files: opening one puts it on its own date; replacing a different setlist asks and keeps a recovery copy.
 const shared=await client('operator',false);
 const fromHome={format:'worshipui-setlist',version:1,date:'2026-12-06',service:{title:'Advent 2',items:[{id:'a',title:'Song',type:'Song',theme:'dusk',slides:['Come, thou long expected Jesus']}]},savedAt:'2026-12-01T20:00:00Z'};
 const openFile=async data=>shared.node('setlistFileInput').onchange({target:{files:[{size:1000,text:async()=>JSON.stringify(data)}],value:''}});
 await openFile(fromHome);await settle();
 check(shared.context.worshipWorkspace.getDate(),'2026-12-06');check(shared.context.worshipWorkspace.getService(),fromHome.service);
 let asked='';shared.context.confirm=message=>{asked=message;return false};
 await openFile({...fromHome,service:{...fromHome.service,title:'Advent 2 (changed)'}});await settle();
 check(asked.startsWith('Replace your setlist for 2026-12-06'),true);check(shared.context.worshipWorkspace.getService().title,'Advent 2');
 shared.context.confirm=()=>true;
 await openFile({...fromHome,service:{...fromHome.service,title:'Advent 2 (changed)'}});await settle();
 check(shared.context.worshipWorkspace.getService().title,'Advent 2 (changed)');
 check(JSON.parse(shared.storage.get('worshipui.recovery.v1')).at(-1).service.title,'Advent 2');
 await openFile({format:'something-else'});check(shared.node('syncStatus').textContent,'That file is not a WorshipUI setlist.');
 // Images and video: files chosen in the editor become slides; taking a video live plays it, and it can be paused.
 const chosenMedia=[{kind:'image',file:'a'.repeat(32)+'.png',name:'Welcome.png'},{kind:'video',file:'b'.repeat(32)+'.mp4',name:'Intro.mp4'}];
 const mediaClient=await client('operator',false,null,{importMedia:async()=>chosenMedia});
 mediaClient.node('add').onclick();mediaClient.node('typeInput').value='Media';await mediaClient.node('typeInput').onchange();
 check(mediaClient.node('mediaFields').hidden,false);check(mediaClient.node('textInputRow').hidden,true);
 await mediaClient.node('addMedia').onclick();check(mediaClient.node('mediaList').children.length,2);
 mediaClient.node('titleInput').value='Welcome loop';mediaClient.node('itemForm').onsubmit({preventDefault(){}});
 const mediaItem=mediaClient.context.worshipWorkspace.getService().items.at(-1);
 check([mediaItem.type,mediaItem.title,mediaItem.slides,mediaItem.media],['Media','Welcome loop',['Welcome.png','Intro.mp4'],chosenMedia]);
 mediaClient.node('slides').children[1].onclick();mediaClient.node('take').onclick();
 let mediaLive=JSON.parse(mediaClient.storage.get(liveKey));check([mediaLive.media,mediaLive.paused],[chosenMedia[1],false]);
 check(mediaClient.node('videoToggle').hidden,false);mediaClient.node('videoToggle').onclick();
 mediaLive=JSON.parse(mediaClient.storage.get(liveKey));check(mediaLive.paused,true);check(mediaClient.node('videoToggle').textContent,'Play video');
 // PowerPoint import: slides arrive as images, the deck name becomes the title, and animations are mentioned.
 const deckSlides=[{kind:'image',file:'d'.repeat(32)+'.png',name:'Slide 1'},{kind:'image',file:'e'.repeat(32)+'.png',name:'Slide 2'}];
 const ppt=await client('operator',false,null,{importMedia:async()=>[],importPowerPoint:async()=>({title:'Announcements',media:deckSlides,animated:1})});
 ppt.node('add').onclick();ppt.node('typeInput').value='Media';await ppt.node('typeInput').onchange();
 check(ppt.node('importPowerPoint').hidden,false);ppt.node('titleInput').value='';
 await ppt.node('importPowerPoint').onclick();
 check(ppt.node('titleInput').value,'Announcements');check(ppt.node('mediaStatus').textContent.includes('1 had animations'),true);
 ppt.node('itemForm').onsubmit({preventDefault(){}});
 check(ppt.context.worshipWorkspace.getService().items.at(-1).media,deckSlides);
 // Without PowerPoint support (Mac, browser) the button is hidden.
 const noPpt=await client('operator',false,null,{importMedia:async()=>[]});
 noPpt.node('add').onclick();noPpt.node('typeInput').value='Media';await noPpt.node('typeInput').onchange();check(noPpt.node('importPowerPoint').hidden,true);
 // Songs with lyrics in the second language: one block per slide, refused when the counts differ.
 const bilingual=await client('operator',false);
 bilingual.node('add').onclick();bilingual.node('typeInput').value='Song';await bilingual.node('typeInput').onchange?.();
 check(bilingual.node('songLanguageFields').hidden,false);
 bilingual.node('titleInput').value='Amazing Grace';bilingual.node('textInput').value='Amazing grace\n\nI once was lost';
 bilingual.node('songSecondText').value='Sublime gracia';bilingual.node('itemForm').onsubmit({preventDefault(){}});
 check(bilingual.context.worshipWorkspace.getService().items.some(item=>item.title==='Amazing Grace'),false);
 bilingual.node('songSecondText').value='Sublime gracia\n\nPerdido anduve';bilingual.node('itemForm').onsubmit({preventDefault(){}});
 const bilingualSong=bilingual.context.worshipWorkspace.getService().items.find(item=>item.title==='Amazing Grace');
 check(bilingualSong.secondarySlides,['Sublime gracia','Perdido anduve']);check(bilingualSong.primaryVersion,undefined);check(typeof bilingualSong.secondaryVersion,'string');
 const remoteEditor=await client('editor',false);remoteEditor.node('slides').children[1].onclick();remoteEditor.node('slides').children[1].onclick();check(remoteEditor.storage.has(liveKey),false);
 return checks;
}
