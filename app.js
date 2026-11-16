/* Worship UI: local-first, dependency-free service workspace. */
const workspaceStorage=window.worshipStorage||localStorage;
const KEY='worshipui.service.v1', LIVE='worshipui.live.v1', CCLI_KEY='worshipui.ccli.v1', LIBRARY='worshipui.setlists.v1';
const emptyCcliSettings={churchCopyright:'',streaming:'',streamingPlus:'',rehearsal:''};
const ccliSettingKeys=Object.keys(emptyCcliSettings);
function validCcliSettings(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===ccliSettingKeys.length&&ccliSettingKeys.every(key=>typeof value[key]==='string'&&value[key].length<=80)}
function validTranslations(item){
 if(item.primaryVersion!==undefined&&(item.type!=='Scripture'||typeof item.primaryVersion!=='string'||item.primaryVersion.length>80))return false;
 if(item.secondarySlides===undefined&&item.secondaryVersion===undefined)return true;
 return item.type==='Scripture'&&typeof item.primaryVersion==='string'&&item.primaryVersion.length>0&&item.primaryVersion.length<=80&&
  typeof item.secondaryVersion==='string'&&item.secondaryVersion.trim().length>0&&item.secondaryVersion.length<=80&&
  Array.isArray(item.secondarySlides)&&item.secondarySlides.length===item.slides.length&&item.secondarySlides.length<=200&&item.secondarySlides.every(text=>typeof text==='string'&&text.length>0&&text.length<=20000);
}
const themes=['dusk','ocean','ember','midnight'];
const demo={title:'Sunday gathering',items:[{id:'welcome',title:'Welcome home',type:'Announcement',theme:'dusk',slides:['Welcome home\nWe’re glad you’re here.','Take a moment.\nPrepare your heart for worship.']},{id:'grace',title:'Amazing Grace',type:'Song',theme:'ocean',slides:['Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.','’Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.','Through many dangers, toils and snares,\nI have already come;\n’Tis grace hath brought me safe thus far,\nAnd grace will lead me home.']},{id:'psalm',title:'Psalm 100:1–2 · KJV',type:'Scripture',theme:'ember',slides:['Make a joyful noise unto the LORD,\nall ye lands.\n\nPsalm 100:1 · KJV','Serve the LORD with gladness:\ncome before his presence with singing.\n\nPsalm 100:2 · KJV']},{id:'message',title:'A heart of gratitude',type:'Sermon',theme:'midnight',slides:['A heart of gratitude\nSunday message']}]};
const $=id=>document.getElementById(id);
function read(key,fallback){try{return JSON.parse(workspaceStorage.getItem(key))||fallback}catch{return fallback}}
function valid(s){return s&&typeof s.title==='string'&&s.title.length<=100&&Array.isArray(s.items)&&s.items.length<=200&&s.items.every(i=>i&&typeof i.id==='string'&&typeof i.title==='string'&&i.title.length<=100&&['Song','Scripture','Announcement','Sermon'].includes(i.type)&&themes.includes(i.theme)&&SlideTemplate.validTemplate(i.template)&&Array.isArray(i.slides)&&i.slides.length>0&&i.slides.length<=200&&i.slides.every(t=>typeof t==='string'&&t.length<=20000)&&validTranslations(i))&&new Set(s.items.map(i=>i.id)).size===s.items.length}
function validDate(value){if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value}
function validLibrary(value){
 return value&&value.version===1&&typeof value.active==='string'&&value.entries&&typeof value.entries==='object'&&!Array.isArray(value.entries)&&Object.hasOwn(value.entries,value.active)&&
  Object.entries(value.entries).every(([date,entry])=>(date==='undated'||validDate(date))&&entry&&valid(entry.service)&&Number.isInteger(entry.baseRevision)&&entry.baseRevision>=0&&(entry.baseService===null||valid(entry.baseService)));
}
let library=null;
try{const saved=workspaceStorage.getItem(LIBRARY);if(saved!==null){library=JSON.parse(saved);if(!validLibrary(library))throw Error('Invalid setlist library')}}
catch(error){$('saveState').textContent='Setlist library could not be read; saved data was preserved.';throw error}
let service=library?structuredClone(library.entries[library.active].service):read(KEY,null);if(!valid(service))service=structuredClone(demo);
function saveLibrary(next){if(!validLibrary(next))throw Error('Invalid setlist library');workspaceStorage.setItem(LIBRARY,JSON.stringify(next));library=next}
function storeService(next){
 if(!library){workspaceStorage.setItem(KEY,JSON.stringify(next));return}
 const updated=structuredClone(library);updated.entries[updated.active].service=structuredClone(next);saveLibrary(updated);
}
let selected=service.items[0]?.id,index=0,editing=false,output=read(LIVE,{text:'',next:'',theme:'midnight',black:false,clear:false});
const mode=new URLSearchParams(location.search).get('view');
function safeOutput(o){const optionalText=value=>value===undefined||typeof value==='string'&&value.length<=20000;return o&&typeof o.text==='string'&&typeof o.next==='string'&&themes.includes(o.theme)&&typeof o.black==='boolean'&&typeof o.clear==='boolean'&&SlideTemplate.validTemplate(o.template)&&optionalText(o.secondaryText)&&optionalText(o.nextSecondaryText)&&optionalText(o.primaryVersion)&&optionalText(o.secondaryVersion)&&optionalText(o.ccliFooter)}
if(!safeOutput(output))output={text:'',next:'',theme:'midnight',black:false,clear:false};
let ccliSettings={...emptyCcliSettings},ccliSettingsError='';
try{
 const saved=workspaceStorage.getItem(CCLI_KEY);
 if(saved!==null){const parsed=JSON.parse(saved);if(!validCcliSettings(parsed))throw Error('Saved CCLI settings are invalid. Re-enter the license numbers and save.');ccliSettings=parsed}
}catch(error){ccliSettingsError=error.message||'Could not read saved CCLI settings.'}
function slideContent(el,text,options={}){
 el.replaceChildren();
 if(options.secondaryText){
  const columns=document.createElement('div');columns.className='slide-columns';
  [[text,options.primaryVersion],[options.secondaryText,options.secondaryVersion]].forEach(([value,label])=>{
   const column=document.createElement('div');column.className='slide-column';
   if(label){const version=document.createElement('span');version.className='slide-label';version.textContent=label;column.append(version)}
   const content=document.createElement('span');content.className='slide-text';content.textContent=value;column.append(content);columns.append(column);
  });
  el.append(columns);
 }else{
  const content=document.createElement('span');content.className='slide-text';content.textContent=text;el.append(content);
 }
 if(options.ccliFooter){const footer=document.createElement('span');footer.className='slide-ccli-footer';footer.textContent=options.ccliFooter;el.append(footer)}
}
function paint(el,text,theme,black=false,template,options={}){
 const style=SlideTemplate.normalize(template);
 el.className='screen '+(black?'':theme)+(!black&&style.backgroundType==='motion'?' motion-background motion-'+style.motion+(style.motionPaused?' motion-paused':''):'');
 el.style.backgroundImage='';el.style.backgroundColor='';
 el.style.setProperty('--slide-font-size',String(style.fontSize));
 el.style.fontFamily='"'+style.font+'", sans-serif';
 if(!black&&style.backgroundType==='color'){el.style.backgroundImage='none';el.style.backgroundColor=style.color}
 if(!black&&style.backgroundType==='image')el.style.backgroundImage='url("'+style.image+'")';
 slideContent(el,black?'':text,black?{}:options);
}
function toast(t){$('toast').textContent=t;$('toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').style.display='none',3500)}
function persist(){try{storeService(service);$('saveState').textContent='Saved on this device';window.dispatchEvent(new Event('worship:changed'));return true}catch{$('saveState').textContent='Not saved — export a backup';toast('Storage unavailable. Export your service to keep a copy.');return false}}
function current(){return service.items.find(i=>i.id===selected)}
function renderOutput(){
 const options={secondaryText:output.secondaryText||'',primaryVersion:output.primaryVersion||'',secondaryVersion:output.secondaryVersion||'',ccliFooter:output.ccliFooter||''};
 if(mode==='audience'){paint($('outputText'),output.clear?'':output.text,output.theme,output.black,output.template,output.clear?{}:options)}
 else if(mode==='stage'){
  $('current').className='stage-slide';$('upNext').className='stage-slide stage-next';
  const template=SlideTemplate.normalize(output.template);
  ['current','upNext'].forEach(id=>{$(id).style.setProperty('--slide-font-size',String(template.fontSize));$(id).style.fontFamily='"'+template.font+'", sans-serif'});
  slideContent($('current'),output.black||output.clear?'':output.text||'Waiting for the first slide',output.black||output.clear?{}:options);
  slideContent($('upNext'),output.next||'End of item',{secondaryText:output.nextSecondaryText||'',primaryVersion:output.primaryVersion||'',secondaryVersion:output.secondaryVersion||''});
  $('stageState').textContent=output.black?'AUDIENCE BLACKED OUT':output.clear?'AUDIENCE LYRICS CLEARED':'CURRENT SLIDE';
 }else{
  paint($('live'),output.clear?'':output.text,output.theme,output.black,output.template,output.clear?{}:options);
  $('liveStatus').textContent=output.black?'BLACKOUT':output.clear?'TEXT CLEARED':output.text?'ON SCREEN':'READY';$('blackout').setAttribute('aria-pressed',String(output.black));
 }
}
if(mode==='audience'||mode==='stage'){
 document.body.className=mode==='audience'?'output-mode':'stage-mode';document.body.replaceChildren();
 const root=document.createElement('div');root.innerHTML=mode==='audience'?'<div id="outputText"></div><button class="fullscreen">Enter fullscreen</button>':'<h2 id="stageState">CURRENT SLIDE</h2><div id="current"></div><h2>UP NEXT</h2><div id="upNext"></div><button class="fullscreen">Enter fullscreen</button>';document.body.append(root);document.querySelector('.fullscreen').onclick=()=>document.documentElement.requestFullscreen().catch(()=>{});renderOutput();
}else{
 function render(){const item=current();$('serviceTitle').value=service.title;$('itemCount').textContent=service.items.length+' ITEMS';$('order').replaceChildren();service.items.forEach((i,n)=>{const row=document.createElement('div'),b=document.createElement('button');b.className='order-item'+(i.id===selected?' active':'');b.setAttribute('aria-current',String(i.id===selected));const num=document.createElement('span');num.className='number';num.textContent=String(n+1).padStart(2,'0');const txt=document.createElement('span'),title=document.createElement('strong'),meta=document.createElement('small');title.textContent=i.title;meta.textContent=i.type+' · '+i.slides.length+' slides';txt.append(title,meta);b.append(num,txt);b.onclick=()=>{selected=i.id;index=0;render()};row.append(b);if(i.id===selected){const controls=document.createElement('div');controls.className='reorder';[-1,1].forEach(dir=>{const move=document.createElement('button');move.textContent=dir<0?'↑ Move up':'↓ Move down';move.disabled=n+dir<0||n+dir>=service.items.length;move.onclick=()=>{[service.items[n],service.items[n+dir]]=[service.items[n+dir],service.items[n]];persist();render()};controls.append(move)});row.append(controls)}$('order').append(row)});$('selectedTitle').textContent=item?.title||'Build your service';$('itemType').textContent=item?.type||'Start with a song or welcome';$('edit').disabled=!item;$('take').disabled=!item;$('slides').replaceChildren();const slideOptions=(slideIndex)=>({secondaryText:item?.secondarySlides?.[slideIndex]||'',primaryVersion:item?.primaryVersion||'',secondaryVersion:item?.secondaryVersion||'',ccliFooter:item?.type==='Song'&&ccliSettings.churchCopyright?'CCLI License #'+ccliSettings.churchCopyright:''});if(item)item.slides.forEach((text,n)=>{const b=document.createElement('button');b.className='slide-card'+(index===n?' selected':'');b.setAttribute('aria-label','Preview slide '+(n+1));b.setAttribute('aria-pressed',String(index===n));const s=document.createElement('div');paint(s,text,item.theme,false,item.template,slideOptions(n));const caption=document.createElement('div');caption.className='slide-caption';caption.textContent='SLIDE '+String(n+1).padStart(2,'0')+(index===n?' · SELECTED':'');b.append(s,caption);b.onclick=()=>{index=n;render()};$('slides').append(b)});paint($('preview'),item?.slides[index]||'Add your first service item',item?.theme||'midnight',false,item?.template,item?slideOptions(index):{});$('themes').replaceChildren();themes.forEach(theme=>{const b=document.createElement('button');b.className=theme+(item?.theme===theme?' chosen':'');b.title=theme;b.setAttribute('aria-label',theme+' background');b.disabled=!item;b.onclick=()=>{item.theme=theme;item.template={...SlideTemplate.normalize(item.template),backgroundType:'preset'};persist();render()};$('themes').append(b)});$('ready').textContent=service.items.length?service.items.length+' items · '+service.items.reduce((n,i)=>n+i.slides.length,0)+' slides saved locally. Check text size and your projector before starting.':'Your service is empty. Add an item to begin.';renderTemplateControls(item);renderOutput();if(window.worshipWorkspace)window.worshipWorkspace.setRole(window.worshipWorkspace.role)}
 function renderTemplateControls(item){
  const template=SlideTemplate.normalize(item?.template);
  $('templateEdit').disabled=!item;
  $('backgroundColor').value=template.color;$('textFont').value=template.font;$('textSize').value=String(template.fontSize);
  $('templateSummary').textContent=item?template.font+' · '+template.fontSize+' px · '+(template.backgroundType==='motion'?SlideTemplate.motions.find(m=>m.id===template.motion).name:template.backgroundType==='image'?'Imported image':template.backgroundType==='color'?template.color:'Gradient background'):'Add an item to edit its template';
    $('removeImage').hidden=!template.image;
  $('motionEnabled').checked=!template.motionPaused;
  $('motionEnabled').disabled=template.backgroundType!=='motion';
  $('motionChoices').replaceChildren();
  SlideTemplate.motions.forEach(motion=>{
   const button=document.createElement('button');button.type='button';button.className='motion-choice';
   button.setAttribute('aria-label',motion.name+' motion background');button.setAttribute('aria-pressed',String(template.backgroundType==='motion'&&template.motion===motion.id));
   const preview=document.createElement('span');preview.className='motion-swatch motion-background motion-'+motion.id+(template.motionPaused?' motion-paused':'');
   const name=document.createElement('span');name.textContent=motion.name;button.append(preview,name);
   button.onclick=()=>updateTemplate({backgroundType:'motion',motion:motion.id});$('motionChoices').append(button);
  });
  $('eyedropper').disabled=!window.EyeDropper;
  $('eyedropper').title=window.EyeDropper?'Pick a color from your screen':'Screen eyedropper unavailable in this browser; use the color picker';
 }
 function updateTemplate(change,targetId=selected){
  const item=service.items.find(i=>i.id===targetId);if(!item)return false;
  const template={...SlideTemplate.normalize(item.template),...change};
  if(!SlideTemplate.validTemplate(template)){toast('Choose a font size between 24 and 200.');return false}
  const candidate=structuredClone(service);candidate.items.find(i=>i.id===targetId).template=template;
  if(new Blob([JSON.stringify(candidate)]).size>4800000){toast('This service is too large. Use a smaller background image.');return false}
  const previous=item.template;item.template=template;
  if(!persist()){item.template=previous;toast('Unable to save the template. Export a backup or use a smaller image.');return false}
  render();return true;
 }
 SlideTemplate.fonts.forEach(font=>{const option=document.createElement('option');option.value=font;option.textContent=font+(SlideTemplate.bundledFonts[font]?' · included':'');option.style.fontFamily=font;$('textFont').append(option)});
 $('templateEdit').onclick=()=>{if(current()){$('templateDialog').showModal();renderTemplateControls(current())}};
 $('closeTemplate').onclick=()=>$('templateDialog').close();
  $('motionEnabled').onchange=event=>updateTemplate({motionPaused:!event.target.checked});
 $('backgroundColor').oninput=event=>updateTemplate({backgroundType:'color',color:event.target.value});
 $('textFont').onchange=event=>updateTemplate({font:event.target.value});
 $('textSize').onchange=event=>{if(!updateTemplate({fontSize:Number(event.target.value)}))renderTemplateControls(current())};
 $('eyedropper').onclick=async()=>{
  if(!window.EyeDropper)return;const targetId=selected;
  try{const result=await new window.EyeDropper().open();updateTemplate({backgroundType:'color',color:result.sRGBHex},targetId)}
  catch(error){if(error.name!=='AbortError')toast('Could not pick that color. Use the color picker instead.')}
 };
 $('removeImage').onclick=()=>updateTemplate({image:'',backgroundType:'preset'});
 $('backgroundImage').onchange=async event=>{
  const file=event.target.files[0],targetId=selected;if(!file)return;
  $('imageStatus').textContent='Preparing image for offline use…';
  let bitmap;
  try{
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000)throw Error('Choose a PNG, JPEG or WebP image under 10 MB.');
   bitmap=await createImageBitmap(file);
   if(bitmap.width*bitmap.height>50000000)throw Error('Choose an image smaller than 50 megapixels.');
   const canvas=document.createElement('canvas');const scale=Math.min(1,1920/bitmap.width,1080/bitmap.height);
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const context=canvas.getContext('2d');context.fillStyle='#000';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   let image=canvas.toDataURL('image/jpeg',0.85);
   if(image.length>1400000)image=canvas.toDataURL('image/jpeg',0.6);
   if(image.length>1400000)throw Error('That image is too detailed. Choose a smaller image.');
   $('imageStatus').textContent=updateTemplate({backgroundType:'image',image},targetId)?'Image saved with the service for offline use.':'Image not saved.';
  }catch(error){$('imageStatus').textContent=error.message}
  finally{bitmap?.close();event.target.value=''}
 };
 function broadcast(){if(window.worshipWorkspace?.role==='editor')return;try{workspaceStorage.setItem(LIVE,JSON.stringify(output))}catch{toast('Cannot connect output windows: browser storage is unavailable.')}renderOutput();if(!mode&&window.worshipWorkspace)window.worshipWorkspace.setRole(window.worshipWorkspace.role)}
 function take(){if(window.worshipWorkspace?.role==='editor')return;const i=current();if(!i)return;output={text:i.slides[index],next:i.slides[index+1]||'',secondaryText:i.secondarySlides?.[index]||'',nextSecondaryText:i.secondarySlides?.[index+1]||'',primaryVersion:i.primaryVersion||'',secondaryVersion:i.secondaryVersion||'',ccliFooter:i.type==='Song'&&ccliSettings.churchCopyright?'CCLI License #'+ccliSettings.churchCopyright:'',theme:i.theme,template:SlideTemplate.normalize(i.template),black:false,clear:false};broadcast()}
 function move(dir){const i=current();if(!i)return;if(index+dir>=0&&index+dir<i.slides.length){index+=dir}else{const n=service.items.indexOf(i)+dir;if(n<0||n>=service.items.length)return;selected=service.items[n].id;index=dir>0?0:service.items[n].slides.length-1}render()}
 $('take').onclick=take;$('next').onclick=()=>move(1);$('previous').onclick=()=>move(-1);$('clear').onclick=()=>{if(window.worshipWorkspace?.role==='editor')return;output.clear=!output.clear;broadcast()};$('blackout').onclick=()=>{if(window.worshipWorkspace?.role==='editor')return;output.black=!output.black;broadcast()};
 $('serviceTitle').oninput=e=>{service.title=e.target.value;persist()};
 const SONGS='worshipui.songs.v1';
 let songs={version:1,songs:[]},songError='',chosenSongStyle=null,biblePromise=null;
 function validSongs(value){return value&&value.version===1&&Array.isArray(value.songs)&&value.songs.length<=10000&&new Set(value.songs.map(song=>song?.id)).size===value.songs.length&&value.songs.every(song=>song&&song.type==='Song'&&valid({title:'',items:[song]}))}
 try{const saved=workspaceStorage.getItem(SONGS);if(saved!==null){songs=JSON.parse(saved);if(!validSongs(songs))throw Error('Saved song library is invalid.')}}
 catch(error){songError=error.message||'Could not read the song library.'}
 function saveSongs(next){
  if(songError)throw Error(songError+' The saved library was preserved.');
  if(!validSongs(next))throw Error('The song library has reached its limit or contains invalid songs.');
  workspaceStorage.setItem(SONGS,JSON.stringify(next));songs=next;
 }
 function renderSongs(){
  const term=$('songSearch').value.trim().toLowerCase();$('songResults').replaceChildren();
  if(songError){$('songStatus').textContent=songError+' The saved library was preserved.';return}
  const matches=songs.songs.filter(song=>!term||song.title.toLowerCase().includes(term)||song.slides.some(text=>text.toLowerCase().includes(term))).slice(0,50);
  matches.forEach(song=>{const button=document.createElement('button');button.type='button';button.textContent=song.title;button.onclick=()=>{
   $('titleInput').value=song.title;$('textInput').value=song.slides.join('\n\n');
   chosenSongStyle={theme:song.theme,...(song.template?{template:structuredClone(song.template)}:{})};
   $('songStatus').textContent='Selected '+song.title+'. Review it, then save the item.';
  };$('songResults').append(button)});
  $('songStatus').textContent=matches.length?matches.length+' saved song'+(matches.length===1?'':'s')+' shown.':'No saved songs match. Import a file or save a song below.';
 }
 $('songSearch').oninput=renderSongs;
 $('saveSongTemplate').onclick=()=>{
  try{
   const title=$('titleInput').value.trim(),slides=$('textInput').value.trim().split(/\n\s*\n/).filter(Boolean);
   const style=chosenSongStyle||(editing&&current()?.type==='Song'?{theme:current().theme,...(current().template?{template:structuredClone(current().template)}:{})}:{theme:'dusk'});
   const song={id:crypto.randomUUID(),title,type:'Song',slides,...style};
   if(!title||!slides.length||slides.some(text=>text.length>20000))throw Error('Enter a song title and slide text first.');
   saveSongs({version:1,songs:[...songs.songs,song]});renderSongs();$('songStatus').textContent='Song saved to this device’s library.';
  }catch(error){$('songStatus').textContent=error.message||'Could not save this song.'}
 };
 $('songFile').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
   if(file.size>5000000)throw Error('Choose a song file under 5 MB.');
   const text=await file.text(),imported=WorshipContentImport.parseLyricsFile(file.name,text);
   const additions=imported.map(song=>({id:crypto.randomUUID(),title:song.title,type:'Song',theme:'dusk',slides:song.slides}));
   const next={version:1,songs:[...songs.songs,...additions]};
   if(songError||!validSongs(next))throw Error(songError||'The song library has reached its limit or the imported song is invalid.');
   if(window.worshipDesktop?.archiveSong)await window.worshipDesktop.archiveSong(file.name,text);
   saveSongs(next);renderSongs();$('songStatus').textContent=additions.length+' song'+(additions.length===1?'':'s')+' imported. Check title, writers and copyright notices before display.';
  }catch(error){$('songStatus').textContent=(error.message||'Could not import that song.')+' If the file was copied, it remains in the song folder.'}
  finally{event.target.value=''}
 };
 if(window.worshipDesktop?.openSongFolder){
  $('openSongFolder').hidden=false;
  $('openSongFolder').onclick=async()=>{try{await window.worshipDesktop.openSongFolder();$('songStatus').textContent='Save SongSelect downloads here, then import the file above.'}catch(error){$('songStatus').textContent=error.message}};
 }
 $('searchBible').onclick=async()=>{
  $('bibleStatus').textContent='Searching the KJV…';$('bibleResults').replaceChildren();
  try{
   if(!biblePromise)biblePromise=fetch('/assets/bibles/kjv.vpl.txt').then(response=>{if(!response.ok)throw Error('KJV data is unavailable.');return response.text()}).then(WorshipBible.parse).catch(error=>{biblePromise=null;throw error});
   const results=WorshipBible.search(await biblePromise,$('bibleQuery').value);
   results.forEach(result=>{const button=document.createElement('button');button.type='button';button.textContent=result.reference+' · '+result.slides[0].slice(0,100);button.onclick=()=>{
    $('titleInput').value=result.reference+' · KJV';$('textInput').value=result.slides.map((text,index)=>text+'\n'+result.verseReferences[index]+' · KJV').join('\n\n');$('itemPrimaryVersion').value='KJV';
    $('bibleStatus').textContent='Selected '+result.reference+'. Review it, then save the item.';
   };$('bibleResults').append(button)});
   $('bibleStatus').textContent=results.length?results.length+' result'+(results.length===1?'':'s')+' shown.':'No matching verses found.';
  }catch(error){$('bibleStatus').textContent=error.message||'Could not search the KJV.'}
 };
 function openEditor(isEdit){editing=isEdit;chosenSongStyle=null;const i=isEdit?current():null;$('dialogTitle').textContent=isEdit?'Edit service item':'Add to your service';$('titleInput').value=i?.title||'';$('typeInput').value=i?.type||'Song';$('textInput').value=i?.slides.join('\n\n')||'';$('itemPrimaryVersion').value=i?.primaryVersion||'';$('itemSecondaryVersion').value=i?.secondaryVersion||'';$('itemSecondaryText').value=i?.secondarySlides?.join('\n\n')||'';$('delete').hidden=!isEdit;updateItemTranslationFields();renderSongs();$('itemDialog').showModal()}
 $('add').onclick=()=>openEditor(false);$('edit').onclick=()=>openEditor(true);$('cancel').onclick=()=>$('itemDialog').close();
 function updateItemTranslationFields(){const type=$('typeInput').value;$('translationFields').hidden=type!=='Scripture';$('bibleTools').hidden=type!=='Scripture';$('songTools').hidden=type!=='Song';$('saveSongTemplate').hidden=type!=='Song'}
 $('typeInput').onchange=updateItemTranslationFields;
 $('itemForm').onsubmit=e=>{
  e.preventDefault();const title=$('titleInput').value.trim(),type=$('typeInput').value,slides=$('textInput').value.trim().split(/\n\s*\n/).filter(Boolean);
  if(!slides.length||slides.length>200||slides.some(text=>text.length>20000)||!title){toast('Enter a title and 1–200 slides, with fewer than 20,000 characters per slide.');return}
  if(!editing&&service.items.length>=200){toast('This service has reached the 200-item limit.');return}
  const item={title,type,slides};
  if(type==='Scripture'){
   const primaryVersion=$('itemPrimaryVersion').value.trim(),secondaryVersion=$('itemSecondaryVersion').value.trim(),secondaryText=$('itemSecondaryText').value.trim();
   if(primaryVersion.length>80||secondaryVersion.length>80){toast('Keep translation names under 80 characters.');return}
   if(primaryVersion)item.primaryVersion=primaryVersion;
   if(secondaryVersion||secondaryText){
    if(!primaryVersion||!secondaryVersion||!secondaryText){toast('Enter the primary and secondary translation names and both Scripture texts.');return}
    try{item.secondarySlides=WorshipContentImport.parseScriptureText(secondaryText)}catch(error){toast(error.message||'Could not read the second translation.');return}
    if(item.secondarySlides.length!==slides.length){toast('Both translations must have the same number of slides.');return}
    item.secondaryVersion=secondaryVersion;
   }
  }
  if(editing){const existing=current();Object.assign(existing,item);if(type==='Song'&&chosenSongStyle){existing.theme=chosenSongStyle.theme;if(chosenSongStyle.template)existing.template=chosenSongStyle.template;else delete existing.template}['primaryVersion','secondaryVersion','secondarySlides'].forEach(key=>{if(item[key]===undefined)delete existing[key]})}
  else{const created={id:crypto.randomUUID(),...item,theme:'dusk',...(type==='Song'?chosenSongStyle||{}:{})};service.items.push(created);selected=created.id}
  index=0;persist();render();$('itemDialog').close()
 };
 $('delete').onclick=()=>{if(!confirm('Remove this item from the service? Your live output will stay unchanged.'))return;service.items=service.items.filter(i=>i.id!==selected);selected=service.items[0]?.id;index=0;persist();render();$('itemDialog').close()};
 $('settings').onclick=()=>$('settingsDialog').showModal();
 $('closeSettings').onclick=()=>$('settingsDialog').close();
 ['ccliChurchCopyright','ccliStreaming','ccliStreamingPlus','ccliRehearsal'].forEach((id,index)=>{$(id).value=[ccliSettings.churchCopyright,ccliSettings.streaming,ccliSettings.streamingPlus,ccliSettings.rehearsal][index]});
 $('ccliStatus').textContent=ccliSettingsError||'Saved on this device only; not included in service exports or sync.';
 $('saveCcliSettings').onclick=()=>{
  const next={churchCopyright:$('ccliChurchCopyright').value.trim(),streaming:$('ccliStreaming').value.trim(),streamingPlus:$('ccliStreamingPlus').value.trim(),rehearsal:$('ccliRehearsal').value.trim()};
  if(!validCcliSettings(next)){$('ccliStatus').textContent='License numbers must be 80 characters or fewer.';return}
  try{workspaceStorage.setItem(CCLI_KEY,JSON.stringify(next));ccliSettings=next;ccliSettingsError='';$('ccliStatus').textContent='CCLI license settings saved on this device.';render()}
  catch(error){$('ccliStatus').textContent='Could not save CCLI settings: '+(error.message||'device storage is unavailable.')}
 };
 function updateScriptureButton(){
  const primaryText=$('scriptureText').value.trim(),secondaryVersion=$('secondaryScriptureVersion').value.trim(),secondaryText=$('secondaryScriptureText').value.trim(),hasSecondary=!!(secondaryVersion||secondaryText);
  let secondaryError='';
  if(hasSecondary){
   if(!secondaryVersion||!secondaryText)secondaryError='Enter both a second translation name and its text.';
   else if(primaryText){
    try{const primary=WorshipContentImport.parseScriptureText(primaryText),secondary=WorshipContentImport.parseScriptureText(secondaryText);if(primary.length!==secondary.length)secondaryError='Both translations must have the same number of slides.'}
    catch(error){secondaryError=error.message||'Could not read the second translation.'}
   }
  }
  $('secondaryScriptureStatus').textContent=secondaryError||'Optional: use blank lines to align each slide in both languages.';
  $('addScripture').disabled=!$('scriptureVersion').value||!$('scriptureReference').value.trim()||!primaryText||!!secondaryError;
 }
 $('scriptureReference').oninput=updateScriptureButton;
 $('scriptureText').oninput=updateScriptureButton;
 $('scriptureVersion').onchange=updateScriptureButton;
 $('secondaryScriptureVersion').oninput=updateScriptureButton;
 $('secondaryScriptureText').oninput=updateScriptureButton;
 $('scriptureFile').onchange=async event=>{
  const file=event.target.files?.[0];if(!file)return;
  $('scriptureImportStatus').textContent='Reading Scripture file…';
  try{
   if(file.size>5000000)throw Error('Choose a text file under 5 MB.');
   const imported=WorshipContentImport.parseScriptureFile(file.name,await file.text());
   if(imported.reference)$('scriptureReference').value=imported.reference;
   $('scriptureText').value=imported.slides.join('\n\n');
   $('scriptureImportStatus').textContent=imported.slides.length+' verse'+(imported.slides.length===1?'':'s')+' loaded. Confirm the selected version and passage before adding.';
   updateScriptureButton();
  }catch(error){$('scriptureImportStatus').textContent=error.message||'Could not read that Scripture file.'}
  finally{event.target.value=''}
 };
 $('secondaryScriptureFile').onchange=async event=>{
  const file=event.target.files?.[0];if(!file)return;
  $('secondaryScriptureStatus').textContent='Reading second translation file…';
  try{
   if(file.size>5000000)throw Error('Choose a text file under 5 MB.');
   const imported=WorshipContentImport.parseScriptureFile(file.name,await file.text());
   if(imported.reference&&!$('scriptureReference').value.trim())$('scriptureReference').value=imported.reference;
   $('secondaryScriptureText').value=imported.slides.join('\n\n');
   updateScriptureButton();
  }catch(error){$('secondaryScriptureStatus').textContent=error.message||'Could not read that Scripture file.'}
  finally{event.target.value=''}
 };
 $('addScripture').onclick=()=>{
  const reference=$('scriptureReference').value.trim(),version=$('scriptureVersion').value;
  try{
   const slides=WorshipContentImport.parseScriptureText($('scriptureText').value);
   const title=reference+' · '+version;
   if(title.length>100)throw Error('Shorten the passage reference to 90 characters or fewer.');
   const item={title,type:'Scripture',theme:'ember',slides,primaryVersion:version};
   const secondaryText=$('secondaryScriptureText').value.trim(),secondaryVersion=$('secondaryScriptureVersion').value.trim();
   if(secondaryText||secondaryVersion){
    if(!secondaryText||!secondaryVersion)throw Error('Enter both a second translation name and its text.');
    item.secondarySlides=WorshipContentImport.parseScriptureText(secondaryText);
    if(item.secondarySlides.length!==slides.length)throw Error('Both translations must have the same number of slides.');
    item.secondaryVersion=secondaryVersion;
   }
   if(window.worshipWorkspace.addItems([item])){
    $('scriptureImportStatus').textContent=title+' added to the service. It has not been taken live.';
    $('scriptureReference').value='';$('scriptureText').value='';$('secondaryScriptureVersion').value='';$('secondaryScriptureText').value='';updateScriptureButton();
   }
  }catch(error){$('scriptureImportStatus').textContent=error.message||'Could not add that Scripture passage.'}
 };
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(service,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='worshipui-service.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error();const s=JSON.parse(await file.text());if(!valid(s))throw Error();if(!confirm('Replace the current service with this backup? Export first if you want to keep it.'))return;service=s;selected=s.items[0]?.id;index=0;persist();render();toast('Service imported')}catch{toast('Could not import. Choose a valid Worship UI JSON backup under 5 MB.')}finally{e.target.value=''}};
 function openOutput(view){if(window.worshipWorkspace?.role==='editor')return;if(!window.open('?view='+view,'worshipui-'+view,'popup,width=1100,height=700'))toast('Allow pop-up windows to open your '+view+' display.')}
 $('audience').onclick=()=>openOutput('audience');$('stage').onclick=()=>openOutput('stage');
 document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName)||$('itemDialog').open||e.ctrlKey||e.metaKey||e.altKey)return;if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp',' ','b','B'].includes(e.key))e.preventDefault();if(['ArrowRight','ArrowDown'].includes(e.key))move(1);if(['ArrowLeft','ArrowUp'].includes(e.key))move(-1);if(e.key===' ')take();if(e.key.toLowerCase()==='b'){$('blackout').click()}});
 window.worshipWorkspace={
   role:'operator',
   getService:()=>structuredClone(service),valid,
   getDate:()=>library?.active==='undated'?'':library?.active||'',
   getDateEntry:date=>library?.entries[date||'undated']?structuredClone(library.entries[date||'undated']):null,
   getDateEntries:()=>library?structuredClone(library.entries):{},
   setDateEntry(date,entry){
     if(!library||!Object.hasOwn(library.entries,date||'undated'))return false;
     const next=structuredClone(library);next.entries[date||'undated']=structuredClone(entry);
     try{saveLibrary(next);return true}catch{return false}
   },
   openDate(date,copy,meta){
     if(date&&!validDate(date))return false;
     if(!persist())return false;
     const next=library?structuredClone(library):{version:1,active:'undated',entries:{undated:{service:structuredClone(service),baseRevision:meta.baseRevision,baseService:structuredClone(meta.baseService)}}};
     const key=date||'undated',empty={title:'New service',items:[]};
     if(!next.entries[key])next.entries[key]={service:copy?structuredClone(service):structuredClone(empty),baseRevision:0,baseService:structuredClone(empty)};
     else if(copy)next.entries[key].service=structuredClone(service);
     next.active=key;
     try{saveLibrary(next)}catch{toast('Could not save the selected setlist. Export a backup and check storage.');return false}
     service=structuredClone(next.entries[key].service);selected=service.items[0]?.id;index=0;render();return true;
   },
   addItems(items){
     if(!Array.isArray(items)||!items.length||service.items.length+items.length>200){toast('The service can contain at most 200 items.');return false}
     if(items.some(item=>!item||!['Song','Scripture'].includes(item.type)||typeof item.title!=='string'||!item.title.trim()||!Array.isArray(item.slides)||!item.slides.length||item.slides.some(slide=>typeof slide!=='string')||!validTranslations(item))){toast('Imported content is invalid.');return false}
     const additions=items.map(item=>{const addition={id:crypto.randomUUID(),title:item.title.trim(),type:item.type,theme:item.theme||(item.type==='Scripture'?'ember':'dusk'),slides:item.slides};['primaryVersion','secondaryVersion','secondarySlides'].forEach(key=>{if(item[key]!==undefined)addition[key]=item[key]});return addition});
     const candidate=structuredClone(service);candidate.items.push(...additions);
     if(!valid(candidate)){toast('Imported content exceeds the service limits.');return false}
     if(new Blob([JSON.stringify(candidate)]).size>4800000){toast('This service is too large to add the imported content. Export a backup or use smaller files.');return false}
     const previous=service,previousSelected=selected,previousIndex=index;
     service=candidate;selected=additions[0].id;index=0;
     if(!persist()){service=previous;selected=previousSelected;index=previousIndex;render();return false}
     render();return true;
   },
   editing:()=>!!$('itemDialog').open||!!$('templateDialog')?.open||!!$('settingsDialog')?.open||document.activeElement===$('serviceTitle')||!!$('reviewDialog')?.open||!!$('historyDialog')?.open,
   replace(next){
     if(!valid(next))return false;
     try{storeService(next)}catch{return false}
     service=structuredClone(next);if(!service.items.some(i=>i.id===selected))selected=service.items[0]?.id;
     index=Math.min(index,Math.max(0,(current()?.slides.length||1)-1));render();return true;
   },
   setRole(role){this.role=role;['take','clear','blackout','audience','stage'].forEach(id=>$(id).disabled=role==='editor'||(id==='take'&&!current()));}
 };
 persist();render();
}
window.addEventListener('storage',e=>{if(e.key===LIVE){const o=read(LIVE,null);if(safeOutput(o)){output=o;renderOutput();if(!mode&&window.worshipWorkspace)window.worshipWorkspace.setRole(window.worshipWorkspace.role)}}});
