/* Worship UI: local-first, dependency-free service workspace. */
const workspaceStorage=window.worshipStorage||localStorage;
const KEY='worshipui.service.v1', LIVE='worshipui.live.v1', CCLI_KEY='worshipui.ccli.v1', LIBRARY='worshipui.setlists.v1';
const emptyCcliSettings={churchCopyright:'',streaming:'',streamingPlus:'',rehearsal:''};
const ccliSettingKeys=Object.keys(emptyCcliSettings);
function validCcliSettings(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===ccliSettingKeys.length&&ccliSettingKeys.every(key=>typeof value[key]==='string'&&value[key].length<=80)}
function validTranslations(item){
 if(item.fitText!==undefined&&(item.type!=='Scripture'||typeof item.fitText!=='boolean'))return false;
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
function valid(s){return s&&typeof s.title==='string'&&s.title.length<=100&&Array.isArray(s.items)&&s.items.length<=200&&s.items.every(i=>i&&typeof i.id==='string'&&typeof i.title==='string'&&i.title.length<=100&&['Song','Scripture','Announcement','Sermon'].includes(i.type)&&themes.includes(i.theme)&&SlideTemplate.validTemplate(i.template)&&Array.isArray(i.slides)&&i.slides.length>0&&i.slides.length<=200&&i.slides.every(t=>typeof t==='string'&&t.length<=20000)&&validTranslations(i)&&(i.sectionLabels===undefined||i.type==='Song'&&Array.isArray(i.sectionLabels)&&i.sectionLabels.length===i.slides.length&&i.sectionLabels.every(label=>typeof label==='string'&&label.length<=50)))&&new Set(s.items.map(i=>i.id)).size===s.items.length}
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
function safeOutput(o){const optionalText=value=>value===undefined||typeof value==='string'&&value.length<=20000;return o&&typeof o.text==='string'&&typeof o.next==='string'&&themes.includes(o.theme)&&typeof o.black==='boolean'&&typeof o.clear==='boolean'&&(o.fitText===undefined||typeof o.fitText==='boolean')&&SlideTemplate.validTemplate(o.template)&&optionalText(o.secondaryText)&&optionalText(o.nextSecondaryText)&&optionalText(o.primaryVersion)&&optionalText(o.secondaryVersion)&&optionalText(o.ccliFooter)}
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
let fitPending=false;
function scheduleFit(){
 if(fitPending)return;
 fitPending=true;window.setTimeout(()=>{
  fitPending=false;
  document.querySelectorAll('.screen').forEach(screen=>{
   if(!screen.fitScripture||!screen.clientWidth||!screen.clientHeight)return;
   const style=getComputedStyle(screen),height=screen.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
   const texts=Array.from(screen.querySelectorAll('.slide-text'));
   if(!texts.length||height<=0)return;
   texts.forEach(text=>text.style.fontSize='');
   const sizes=texts.map(text=>parseFloat(getComputedStyle(text).fontSize));
   const available=texts.map(text=>{
    const label=text.parentElement.querySelector('.slide-label');
    if(!label)return height;
    const labelStyle=getComputedStyle(label);
    return height-label.getBoundingClientRect().height-parseFloat(labelStyle.marginBottom);
   });
   function fits(scale){
    texts.forEach((text,n)=>text.style.fontSize=(sizes[n]*scale)+'px');
    return texts.every((text,n)=>text.scrollHeight<=available[n]&&text.scrollWidth<=text.clientWidth);
   }
   if(fits(1))return;
   let low=0,high=1;
   for(let n=0;n<16;n++){const middle=(low+high)/2;if(fits(middle))low=middle;else high=middle}
   fits(low);
  });
 },0);
}
window.addEventListener('resize',scheduleFit);
document.addEventListener('visibilitychange',scheduleFit);
if(document.fonts){document.fonts.ready.then(scheduleFit);document.fonts.addEventListener('loadingdone',scheduleFit)}
function paint(el,text,theme,black=false,template,options={}){
 const style=SlideTemplate.normalize(template);
 el.className='screen '+(black?'':theme)+(!black&&style.backgroundType==='motion'?' motion-background motion-'+style.motion+(style.motionPaused?' motion-paused':''):'');
 el.style.backgroundImage='';el.style.backgroundColor='';
 el.style.setProperty('--slide-font-size',String(style.fontSize));
 el.style.fontFamily='"'+style.font+'", sans-serif';
 if(!black&&style.backgroundType==='color'){el.style.backgroundImage='none';el.style.backgroundColor=style.color}
 if(!black&&style.backgroundType==='image')el.style.backgroundImage='url("'+style.image+'")';
 slideContent(el,black?'':text,black?{}:options);
 el.fitScripture=!black&&!!options.fitText;scheduleFit();
}
function toast(t){$('toast').textContent=t;$('toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').style.display='none',3500)}
function persist(){try{storeService(service);$('saveState').textContent='Saved on this device';window.dispatchEvent(new Event('worship:changed'));return true}catch{$('saveState').textContent='Not saved — export a backup';toast('Storage unavailable. Export your service to keep a copy.');return false}}
function current(){return service.items.find(i=>i.id===selected)}
function renderOutput(){
 const options={secondaryText:output.secondaryText||'',primaryVersion:output.primaryVersion||'',secondaryVersion:output.secondaryVersion||'',ccliFooter:output.ccliFooter||'',fitText:!!output.fitText};
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
 const renderWorkspace=render;
 render=function(){
  renderWorkspace();
  const item=current(),isSong=item?.type==='Song';
  if(item?.type==='Scripture'&&item.fitText){$('preview').fitScripture=true;Array.from($('slides').children).forEach(card=>card.children[0].fitScripture=true);scheduleFit()}
  $('songSection').hidden=!isSong;$('songSection').disabled=!isSong;
  if(isSong)Array.from($('slides').children).forEach((card,n)=>{
   const label=item.sectionLabels?.[n];
   if(label){const caption=card.children[1];caption.textContent+=' · '+label;card.setAttribute('aria-label','Preview slide '+(n+1)+', '+label)}
   card.oncontextmenu=event=>{event.preventDefault();openSongSection(n)};
  });
 };
 let sectionTarget=null;
 const sectionChoices=['Verse','Verse 1','Verse 2','Verse 3','Verse 4','Chorus','Pre-Chorus','Bridge','Intro','Outro','Tag','Instrumental'];
 function openSongSection(slideIndex){
  const item=current();if(item?.type!=='Song'||slideIndex<0||slideIndex>=item.slides.length)return;
  sectionTarget={id:item.id,index:slideIndex};
  const label=item.sectionLabels?.[slideIndex]||'';
  $('songSectionChoice').value=label&&!sectionChoices.includes(label)?'custom':label;
  $('songSectionCustom').value=label&&!sectionChoices.includes(label)?label:'';
  $('songSectionCustomLabel').hidden=$('songSectionChoice').value!=='custom';
  $('songSectionDialog').showModal();
 }
 $('songSection').onclick=()=>openSongSection(index);
 $('songSectionChoice').onchange=()=>$('songSectionCustomLabel').hidden=$('songSectionChoice').value!=='custom';
 $('cancelSongSection').onclick=()=>$('songSectionDialog').close();
 $('songSectionForm').onsubmit=event=>{
  event.preventDefault();
  const item=service.items.find(i=>i.id===sectionTarget?.id),n=sectionTarget?.index;
  if(!item||item.type!=='Song'||!Number.isInteger(n)||n>=item.slides.length){toast('The song slide is no longer available.');return}
  const label=$('songSectionChoice').value==='custom'?$('songSectionCustom').value.trim():$('songSectionChoice').value;
  if(($('songSectionChoice').value==='custom'&&!label)||label.length>50){toast('Enter a section name of up to 50 characters.');return}
  const previous=item.sectionLabels,labels=previous?previous.slice():item.slides.map(()=>'');
  labels[n]=label;if(labels.some(Boolean))item.sectionLabels=labels;else delete item.sectionLabels;
  if(!persist()){if(previous)item.sectionLabels=previous;else delete item.sectionLabels;return}
  $('songSectionDialog').close();render();
 };
 function remapSectionLabels(oldSlides,oldLabels,newSlides){
  if(!oldLabels)return undefined;
  const used=new Set(),mapping=newSlides.map(text=>{
   const matches=oldSlides.map((old,index)=>old===text?index:-1).filter(index=>index>=0);
   return matches.length===1&&newSlides.filter(slide=>slide===text).length===1?matches[0]:-1;
  });
  mapping.filter(n=>n>=0).forEach(n=>used.add(n));
  const labels=mapping.map((match,n)=>{
   if(match<0&&oldSlides.length===newSlides.length&&!used.has(n)){match=n;used.add(n)}
   return match<0?'':oldLabels[match];
  });
  return labels.some(Boolean)?labels:undefined;
 }
 function confirmSectionLoss(oldLabels,newLabels){
  return !oldLabels||oldLabels.filter(Boolean).length<=(newLabels||[]).filter(Boolean).length||confirm('Some section labels cannot be matched to the changed slides. Continue without those labels?');
 }
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
 let livePosition=null;
 function broadcast(){if(window.worshipWorkspace?.role==='editor')return;try{workspaceStorage.setItem(LIVE,JSON.stringify(output))}catch{toast('Cannot connect output windows: browser storage is unavailable.')}renderOutput();if(!mode&&window.worshipWorkspace)window.worshipWorkspace.setRole(window.worshipWorkspace.role)}
 function take(preserveBlanking=false){if(window.worshipWorkspace?.role==='editor')return;const i=current();if(!i)return;livePosition={id:i.id,index};output={text:i.slides[index],next:i.slides[index+1]||'',secondaryText:i.secondarySlides?.[index]||'',nextSecondaryText:i.secondarySlides?.[index+1]||'',primaryVersion:i.primaryVersion||'',secondaryVersion:i.secondaryVersion||'',fitText:!!i.fitText,ccliFooter:i.type==='Song'&&ccliSettings.churchCopyright?'CCLI License #'+ccliSettings.churchCopyright:'',theme:i.theme,template:SlideTemplate.normalize(i.template),black:preserveBlanking&&output.black,clear:preserveBlanking&&output.clear};broadcast()}
 function move(dir){const i=current();if(!i)return false;if(index+dir>=0&&index+dir<i.slides.length){index+=dir}else{const n=service.items.indexOf(i)+dir;if(n<0||n>=service.items.length)return false;selected=service.items[n].id;index=dir>0?0:service.items[n].slides.length-1}render();return true}
 function advanceLive(){
  if(window.worshipWorkspace?.role==='editor')return;
  if(!livePosition){take();return}
  const liveItem=service.items.find(item=>item.id===livePosition.id);
  if(!liveItem||liveItem.slides[livePosition.index]!==output.text){toast('The live slide changed or is no longer in this service. Select a slide and choose Take live.');return}
  const previousSelected=selected,previousIndex=index;
  selected=liveItem.id;index=livePosition.index;
  if(move(1))take(true);else{selected=previousSelected;index=previousIndex;toast('Already at the end of the service.')}
 }
 $('take').onclick=()=>take();$('next').onclick=()=>move(1);$('previous').onclick=()=>move(-1);$('clear').onclick=()=>{if(window.worshipWorkspace?.role==='editor')return;output.clear=!output.clear;broadcast()};$('blackout').onclick=()=>{if(window.worshipWorkspace?.role==='editor')return;output.black=!output.black;broadcast()};
 $('serviceTitle').oninput=e=>{service.title=e.target.value;persist()};
 const SONGS='worshipui.songs.v1';
 let songs={version:1,songs:[]},songError='',chosenSongStyle=null,chosenSongSlides=null,biblePromise=null,chosenScriptureFit=null;
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
  if(!term){$('songStatus').textContent='Search by title or lyrics to find saved songs.';return}
  const matches=songs.songs.filter(song=>song.title.toLowerCase().includes(term)||song.slides.some(text=>text.toLowerCase().includes(term))).slice(0,50);
  matches.forEach(song=>{const button=document.createElement('button');button.type='button';button.textContent=song.title;button.onclick=()=>{
   $('titleInput').value=song.title;$('textInput').value=song.slides.join('\n\n');
   chosenSongStyle={theme:song.theme,...(song.template?{template:structuredClone(song.template)}:{}),...(song.sectionLabels?{sectionLabels:structuredClone(song.sectionLabels)}:{})};chosenSongSlides=song.slides.slice();
   $('songStatus').textContent='Selected '+song.title+'. Review it, then save the item.';
  };$('songResults').append(button)});
  $('songStatus').textContent=matches.length?matches.length+' saved song'+(matches.length===1?'':'s')+' shown.':'No saved songs match. Import a file or save a song below.';
 }
 $('songSearch').oninput=renderSongs;
 $('saveSongTemplate').onclick=()=>{
  try{
   const title=$('titleInput').value.trim(),slides=$('textInput').value.trim().split(/\n\s*\n/).filter(Boolean);
   const style=chosenSongStyle||(editing&&current()?.type==='Song'?{theme:current().theme,...(current().template?{template:structuredClone(current().template)}:{})}:{theme:'dusk'});
   const labels=chosenSongStyle?remapSectionLabels(chosenSongSlides,chosenSongStyle.sectionLabels,slides):editing&&current()?.type==='Song'?remapSectionLabels(current().slides,current().sectionLabels,slides):undefined;
   const originalLabels=chosenSongStyle?.sectionLabels||(editing&&current()?.type==='Song'?current().sectionLabels:undefined);
   if(!confirmSectionLoss(originalLabels,labels))return;
   const song={id:crypto.randomUUID(),title,type:'Song',slides,theme:style.theme,...(style.template?{template:style.template}:{}),...(labels?{sectionLabels:labels}:{})};
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
 let bibleData=null;
 function fillBibleOptions(id,values,selected){
  const select=$(id);select.replaceChildren();
  values.forEach(value=>{const option=document.createElement('option');option.value=String(value.id??value);option.textContent=String(value.name??value);select.append(option)});
  select.value=values.some(value=>String(value.id??value)===String(selected))?String(selected):values.length?String(values[0].id??values[0]):'';
  select.disabled=!values.length;
 }
 function updateBibleVerses(){
  const verses=WorshipBible.verseNumbers(bibleData,$('bibleBook').value,Number($('bibleChapter').value));
  fillBibleOptions('bibleFirst',verses,$('bibleFirst').value);
  fillBibleOptions('bibleLast',verses.filter(verse=>verse>=Number($('bibleFirst').value)),$('bibleLast').value);
  $('addBiblePassage').disabled=!verses.length;
 }
 function updateBibleChapters(){
  fillBibleOptions('bibleChapter',WorshipBible.chapters(bibleData,$('bibleBook').value),$('bibleChapter').value);updateBibleVerses();
 }
 async function prepareBible(){
  if(bibleData)return;
  $('bibleStatus').textContent='Loading the KJV…';
  try{
   if(!biblePromise)biblePromise=fetch('/assets/bibles/kjv.vpl.txt').then(response=>{if(!response.ok)throw Error('KJV data is unavailable.');return response.text()}).then(WorshipBible.parse).catch(error=>{biblePromise=null;throw error});
   bibleData=await biblePromise;fillBibleOptions('bibleBook',WorshipBible.books(),$('bibleBook').value);updateBibleChapters();
   $('bibleStatus').textContent='Choose a book, chapter and verse range. When editing, selection fills the item for review.';
  }catch(error){$('bibleStatus').textContent=error.message||'Could not load the KJV.'}
 }
 $('bibleBook').onchange=updateBibleChapters;$('bibleChapter').onchange=updateBibleVerses;
 $('bibleFirst').onchange=updateBibleVerses;
 $('addBiblePassage').onclick=()=>{
  try{
    const result=WorshipBible.passage(bibleData,$('bibleBook').value,Number($('bibleChapter').value),Number($('bibleFirst').value),Number($('bibleLast').value));
    const title=result.reference+' · KJV',verses=result.slides.map((text,index)=>text+'\n'+result.verseReferences[index]+' · KJV');
    const combined=$('bibleLayout').value==='combined'&&verses.length>1,slides=combined?[verses.join('\n')]:verses;
    if(slides.some(text=>text.length>20000)){$('bibleStatus').textContent='The combined passage exceeds 20,000 characters. Choose one verse per slide.';return}
    if(editing){
     $('titleInput').value=title;$('textInput').value=slides.join('\n\n');$('itemPrimaryVersion').value='KJV';
     chosenScriptureFit=combined;
     $('bibleStatus').textContent='Selected '+result.reference+'. Review it, then save the item.';
    }else{
     if(($('titleInput').value.trim()||$('textInput').value.trim()||$('itemPrimaryVersion').value.trim()||$('itemSecondaryVersion').value.trim()||$('itemSecondaryText').value.trim())&&!confirm('Add this passage and discard the unsaved item text?'))return;
     if(window.worshipWorkspace.addItems([{title,type:'Scripture',theme:'ember',slides,primaryVersion:'KJV',...(combined?{fitText:true}:{})}])){
      $('itemDialog').close();toast(title+' added to the service.');
     }
    }
  }catch(error){$('bibleStatus').textContent=error.message||'Could not add that KJV passage.'}
 };
 function openEditor(isEdit){editing=isEdit;chosenSongStyle=null;chosenSongSlides=null;chosenScriptureFit=null;const i=isEdit?current():null;$('dialogTitle').textContent=isEdit?'Edit service item':'Add to your service';$('titleInput').value=i?.title||'';$('typeInput').value=i?.type||'Song';$('textInput').value=i?.slides.join('\n\n')||'';$('itemPrimaryVersion').value=i?.primaryVersion||'';$('itemSecondaryVersion').value=i?.secondaryVersion||'';$('itemSecondaryText').value=i?.secondarySlides?.join('\n\n')||'';$('songSearch').value='';$('delete').hidden=!isEdit;updateItemTranslationFields();renderSongs();$('itemDialog').showModal()}
 $('add').onclick=()=>openEditor(false);$('edit').onclick=()=>openEditor(true);$('cancel').onclick=()=>$('itemDialog').close();
 function updateItemTranslationFields(){const type=$('typeInput').value;$('translationFields').hidden=type!=='Scripture';$('bibleTools').hidden=type!=='Scripture';$('songTools').hidden=type!=='Song';$('saveSongTemplate').hidden=type!=='Song';$('titleInput').required=type!=='Scripture';$('titleLabel').textContent=type==='Scripture'?'Title (optional)':'Title';if(type==='Scripture')return prepareBible()}
 $('typeInput').onchange=updateItemTranslationFields;
 $('itemForm').onsubmit=e=>{
  e.preventDefault();const type=$('typeInput').value,title=$('titleInput').value.trim()||(type==='Scripture'?'Scripture':''),slides=$('textInput').value.trim().split(/\n\s*\n/).filter(Boolean);
  if(!slides.length||slides.length>200||slides.some(text=>text.length>20000)||!title){toast('Enter a title (optional for Scripture) and 1–200 slides, with fewer than 20,000 characters per slide.');return}
  if(!editing&&service.items.length>=200){toast('This service has reached the 200-item limit.');return}
  const item={title,type,slides};
  if(type==='Song'){
   const source=chosenSongStyle?{slides:chosenSongSlides,sectionLabels:chosenSongStyle.sectionLabels}:editing&&current()?.type==='Song'?current():null;
   const labels=source&&remapSectionLabels(source.slides,source.sectionLabels,slides);
   if(source&&!confirmSectionLoss(source.sectionLabels,labels))return;
   if(labels)item.sectionLabels=labels;
  }
  if(type==='Scripture'){
   if(chosenScriptureFit===true||(chosenScriptureFit===null&&editing&&current()?.type==='Scripture'&&current().fitText))item.fitText=true;
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
  if(editing){const existing=current();Object.assign(existing,item);if(type==='Song'&&chosenSongStyle){existing.theme=chosenSongStyle.theme;if(chosenSongStyle.template)existing.template=chosenSongStyle.template;else delete existing.template}['primaryVersion','secondaryVersion','secondarySlides','sectionLabels','fitText'].forEach(key=>{if(item[key]===undefined)delete existing[key]})}
  else{const created={id:crypto.randomUUID(),...item,theme:type==='Song'&&chosenSongStyle?chosenSongStyle.theme:'dusk',...(type==='Song'&&chosenSongStyle?.template?{template:chosenSongStyle.template}:{})};service.items.push(created);selected=created.id}
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
  $('addScripture').disabled=!$('scriptureVersion').value||!primaryText||!!secondaryError;
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
   const title=(reference||'Scripture')+' · '+version;
   if(title.length>100)throw Error('Shorten the passage reference to 90 characters or fewer.');
   const item={title,type:'Scripture',theme:'ember',slides,primaryVersion:version};
   const secondaryText=$('secondaryScriptureText').value.trim(),secondaryVersion=$('secondaryScriptureVersion').value.trim();
   if(secondaryText||secondaryVersion){
    if(!secondaryText||!secondaryVersion)throw Error('Enter both a second translation name and its text.');
    item.secondarySlides=WorshipContentImport.parseScriptureText(secondaryText);
    if(item.secondarySlides.length!==slides.length)throw Error('Both translations must have the same number of slides.');
    item.secondaryVersion=secondaryVersion;
   }
   if($('scriptureLayout').value==='combined'&&slides.length>1){
    item.slides=[slides.join('\n')];
    if(item.secondarySlides)item.secondarySlides=[item.secondarySlides.join('\n')];
    if(item.slides[0].length>20000||item.secondarySlides?.[0].length>20000)throw Error('The combined passage exceeds 20,000 characters. Choose one verse per slide.');
    item.fitText=true;
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
 document.addEventListener('keydown',e=>{if($('itemDialog').open||$('songSectionDialog').open||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName)&&!(e.target===$('take')&&e.key===' '))return;if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp',' ','b','B'].includes(e.key))e.preventDefault();if(['ArrowRight','ArrowDown'].includes(e.key))move(1);if(['ArrowLeft','ArrowUp'].includes(e.key))move(-1);if(e.key===' '&&!e.repeat)advanceLive();if(e.key.toLowerCase()==='b'){$('blackout').click()}});
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
     const additions=items.map(item=>{const addition={id:crypto.randomUUID(),title:item.title.trim(),type:item.type,theme:item.theme||(item.type==='Scripture'?'ember':'dusk'),slides:item.slides};['primaryVersion','secondaryVersion','secondarySlides','fitText'].forEach(key=>{if(item[key]!==undefined)addition[key]=item[key]});return addition});
     const candidate=structuredClone(service);candidate.items.push(...additions);
     if(!valid(candidate)){toast('Imported content exceeds the service limits.');return false}
     if(new Blob([JSON.stringify(candidate)]).size>4800000){toast('This service is too large to add the imported content. Export a backup or use smaller files.');return false}
     const previous=service,previousSelected=selected,previousIndex=index;
     service=candidate;selected=additions[0].id;index=0;
     if(!persist()){service=previous;selected=previousSelected;index=previousIndex;render();return false}
     render();return true;
   },
   editing:()=>!!$('itemDialog').open||!!$('songSectionDialog').open||!!$('templateDialog')?.open||!!$('settingsDialog')?.open||document.activeElement===$('serviceTitle')||!!$('reviewDialog')?.open||!!$('historyDialog')?.open,
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
