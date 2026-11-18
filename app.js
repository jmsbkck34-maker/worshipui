/* WorshipUI: local-first, dependency-free service workspace. */
const workspaceStorage=window.worshipStorage||localStorage;
// English edition (a separate, smaller installer): one language, so second-language controls are hidden.
const ENGLISH_ONLY=window.worshipDesktop?.edition==='english';
const KEY='worshipui.service.v1', LIVE='worshipui.live.v1', CCLI_KEY='worshipui.ccli.v1', LIBRARY='worshipui.setlists.v1', BRANDING='worshipui.branding.v1';
const emptyCcliSettings={churchCopyright:'',streaming:'',streamingPlus:'',rehearsal:''};
const ccliSettingKeys=Object.keys(emptyCcliSettings);
function validCcliSettings(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===ccliSettingKeys.length&&ccliSettingKeys.every(key=>typeof value[key]==='string'&&value[key].length<=80)}
function validTranslations(item){
 if(item.fitText!==undefined&&(item.type!=='Scripture'||typeof item.fitText!=='boolean'))return false;
 const verseList=(list,length)=>Array.isArray(list)&&list.length>=2&&list.length<=200&&(length===undefined||list.length===length)&&list.every(text=>typeof text==='string'&&text.length>0&&text.length<=20000);
 if(item.verseSlides!==undefined&&!(item.type==='Scripture'&&item.fitText===true&&item.slides.length===1&&verseList(item.verseSlides)))return false;
 if(item.secondaryVerseSlides!==undefined&&!(item.verseSlides&&Array.isArray(item.secondarySlides)&&verseList(item.secondaryVerseSlides,item.verseSlides.length)))return false;
 if(item.primaryVersion!==undefined&&(item.type!=='Scripture'||typeof item.primaryVersion!=='string'||item.primaryVersion.length>80))return false;
 if(item.secondarySlides===undefined&&item.secondaryVersion===undefined)return true;
 // Scripture names both translations; a song only names its second language.
 return (item.type==='Scripture'&&typeof item.primaryVersion==='string'&&item.primaryVersion.length>0&&item.primaryVersion.length<=80||item.type==='Song'&&item.primaryVersion===undefined)&&
  typeof item.secondaryVersion==='string'&&item.secondaryVersion.trim().length>0&&item.secondaryVersion.length<=80&&
  Array.isArray(item.secondarySlides)&&item.secondarySlides.length===item.slides.length&&item.secondarySlides.length<=200&&item.secondarySlides.every(text=>typeof text==='string'&&text.length>0&&text.length<=20000);
}
const themes=['dusk','ocean','ember','midnight'];
const SCREEN_TARGETS=['','1','2'];
function validSlideScreens(item){return item.slideScreens===undefined||Array.isArray(item.slideScreens)&&item.slideScreens.length===item.slides.length&&item.slideScreens.every(target=>SCREEN_TARGETS.includes(target))&&item.slideScreens.some(Boolean)}
const demo={title:'Sunday gathering',items:[{id:'welcome',title:'Welcome home',type:'Announcement',theme:'dusk',slides:['Welcome home\nWe’re glad you’re here.','Take a moment.\nPrepare your heart for worship.']},{id:'grace',title:'Amazing Grace',type:'Song',theme:'ocean',slides:['Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.','’Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.','Through many dangers, toils and snares,\nI have already come;\n’Tis grace hath brought me safe thus far,\nAnd grace will lead me home.']},{id:'psalm',title:'Psalm 100:1–2 · KJV',type:'Scripture',theme:'ember',slides:['Make a joyful noise unto the LORD,\nall ye lands.\n\nPsalm 100:1 · KJV','Serve the LORD with gladness:\ncome before his presence with singing.\n\nPsalm 100:2 · KJV']},{id:'message',title:'A heart of gratitude',type:'Sermon',theme:'midnight',slides:['A heart of gratitude\nSunday message']}]};
const $=id=>document.getElementById(id);
function read(key,fallback){try{return JSON.parse(workspaceStorage.getItem(key))||fallback}catch{return fallback}}
function brandingOf(value){return {name:value.name,address:value.address,logo:value.logo,showOnBlackout:value.showOnBlackout}}
function readBranding(){
 const record=read(BRANDING,null);
 return SlideTemplate.validBrandingRecord(record)?record:{version:1,branding:{...SlideTemplate.emptyBranding},baseRevision:0,baseBranding:null};
}
function valid(s){return s&&typeof s.title==='string'&&s.title.length<=100&&Array.isArray(s.items)&&s.items.length<=200&&s.items.every(i=>i&&typeof i.id==='string'&&typeof i.title==='string'&&i.title.length<=100&&['Song','Scripture','Announcement','Sermon','Countdown','Media'].includes(i.type)&&(i.type==='Countdown'?SlideTemplate.validCountdown(i.countdown):i.countdown===undefined)&&(i.type==='Media'?SlideTemplate.validMediaItem(i):i.media===undefined)&&themes.includes(i.theme)&&SlideTemplate.validTemplate(i.template)&&Array.isArray(i.slides)&&i.slides.length>0&&i.slides.length<=200&&i.slides.every(t=>typeof t==='string'&&t.length<=20000)&&validTranslations(i)&&(i.sectionLabels===undefined||i.type==='Song'&&Array.isArray(i.sectionLabels)&&i.sectionLabels.length===i.slides.length&&i.sectionLabels.every(label=>typeof label==='string'&&label.length<=50))&&validSlideScreens(i))&&new Set(s.items.map(i=>i.id)).size===s.items.length}
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
function safeOutput(o){const optionalText=value=>value===undefined||typeof value==='string'&&value.length<=20000;return o&&typeof o.text==='string'&&typeof o.next==='string'&&themes.includes(o.theme)&&typeof o.black==='boolean'&&typeof o.clear==='boolean'&&(o.fitText===undefined||typeof o.fitText==='boolean')&&SlideTemplate.validTemplate(o.template)&&optionalText(o.secondaryText)&&optionalText(o.nextSecondaryText)&&optionalText(o.primaryVersion)&&optionalText(o.secondaryVersion)&&optionalText(o.ccliFooter)&&(o.screen===undefined||SCREEN_TARGETS.includes(o.screen))&&(o.type===undefined||['Song','Scripture','Announcement','Sermon','Countdown','Media'].includes(o.type))&&(o.media===undefined||SlideTemplate.validMediaEntry(o.media))&&(o.paused===undefined||typeof o.paused==='boolean')&&(o.countdown===undefined||SlideTemplate.validLiveCountdown(o.countdown))}
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
 // Fonts missing on a computer (for example Segoe UI on a Mac) fall back to the bundled Inter.
 el.style.fontFamily='"'+style.font+'", "Inter", sans-serif';
 if(!black&&style.backgroundType==='color'){el.style.backgroundImage='none';el.style.backgroundColor=style.color}
 if(!black&&style.backgroundType==='image')el.style.backgroundImage='url("'+style.image+'")';
 const position=SlideTemplate.textPosition(template);
 if(position)el.className+=' text-positioned';
 ['--text-x','--text-y','--text-width'].forEach((name,n)=>position?el.style.setProperty(name,[position.x,position.y,position.width][n]+'%'):el.style.setProperty(name,''));
 if(!black&&options.media){
  const media=options.media,existing=el.querySelector?.('.slide-media');
  if(!(existing&&existing.mediaFile===media.file)){
   el.replaceChildren();
   const node=document.createElement(media.kind==='video'?'video':'img');node.className='slide-media';node.mediaFile=media.file;node.src='/media/'+media.file;
   if(media.kind==='video'){node.preload='metadata';node.playsInline=true;node.muted=!options.withSound;if(options.play)node.autoplay=true}else node.alt='';
   el.append(node);
  }
  const video=el.querySelector?.('video.slide-media');
  if(video&&options.play){if(options.paused)video.pause();else video.play?.().catch(()=>{})}
  el.fitScripture=false;return;
 }
 slideContent(el,black?'':text,black?{}:options);
 if(black&&options.blackoutLogo){const logo=document.createElement('img');logo.className='blackout-logo';logo.alt='';logo.src=options.blackoutLogo;el.append(logo)}
 el.fitScripture=!black&&!!options.fitText;scheduleFit();
}
function toast(t){$('toast').textContent=t;$('toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').style.display='none',3500)}
// saveFailed stays true until a later save succeeds, so switching setlists can warn about unsaved work.
let saveFailed=false;
function persist(){try{storeService(service);saveFailed=false;$('saveState').textContent='Saved on this device';window.dispatchEvent(new Event('worship:changed'));return true}catch{saveFailed=true;$('saveState').textContent='Not saved — use Back up';toast('Storage unavailable. Use Back up to keep a copy.');return false}}
function current(){return service.items.find(i=>i.id===selected)}
// Audience screens: each screen shows both languages, the first only, or the second only.
const SCREENS='worshipui.screens.v1',SCREEN_SHOWS=['both','first','second'];
// Each audience screen: what it shows and, optionally, the display it opens on; the stage window may have a display too.
function validScreens(value){
 const display=entry=>entry.display===undefined||Number.isSafeInteger(entry.display);
 return value&&value.version===1&&Array.isArray(value.screens)&&value.screens.length===2&&value.screens.every(screen=>screen&&SCREEN_SHOWS.includes(screen.show)&&display(screen))&&
  (value.stage===undefined||!!value.stage&&typeof value.stage==='object'&&display(value.stage));
}
function readScreens(){const saved=read(SCREENS,null);return validScreens(saved)?saved:{version:1,screens:[{show:'both'},{show:'both'}]}}
function languageView(o,show){
 if(show==='first')return {...o,secondaryText:'',nextSecondaryText:''};
 // Slides without a second translation (songs, announcements) still show their only text.
 if(show==='second'&&o.secondaryText)return {...o,text:o.secondaryText,next:o.nextSecondaryText||'',primaryVersion:o.secondaryVersion||'',secondaryText:'',nextSecondaryText:'',secondaryVersion:''};
 return o;
}
const screenNumber=mode==='audience'?(new URLSearchParams(location.search).get('screen')==='2'?'2':'1'):'';
// A slide sent to the other screen leaves this screen's content as it was; blackout and clear apply to every screen.
let screenContent=!output.screen||output.screen===screenNumber?output:{...output,text:'',secondaryText:''};
function renderOutput(){
 if(mode==='audience'&&(!output.screen||output.screen===screenNumber))screenContent=output;
 let shown=mode==='audience'?languageView(screenContent,readScreens().screens[Number(screenNumber)-1].show):output;
 if(shown.countdown)shown={...shown,text:SlideTemplate.countdownText(shown.countdown,Date.now()),secondaryText:''};
 const options={secondaryText:shown.secondaryText||'',primaryVersion:shown.primaryVersion||'',secondaryVersion:shown.secondaryVersion||'',ccliFooter:shown.ccliFooter||'',fitText:!!shown.fitText,...(shown.media?{media:shown.media,play:true,paused:!!shown.paused,withSound:mode==='audience'}:{})};
 if(output.black){const branding=readBranding().branding;if(branding.showOnBlackout&&branding.logo)options.blackoutLogo=branding.logo}
 if(mode==='audience'){paint($('outputText'),output.clear?'':shown.text,shown.theme,output.black,shown.template,output.clear?{}:options)}
 else if(mode==='stage'){
  $('current').className='stage-slide';$('upNext').className='stage-slide stage-next';
  const template=SlideTemplate.normalize(output.template);
  ['current','upNext'].forEach(id=>{$(id).style.setProperty('--slide-font-size',String(template.fontSize));$(id).style.fontFamily='"'+template.font+'", "Inter", sans-serif'});
  slideContent($('current'),output.black||output.clear?'':shown.text||'Waiting for the first slide',output.black||output.clear?{}:options);
  slideContent($('upNext'),output.next||'End of item',{secondaryText:output.nextSecondaryText||'',primaryVersion:output.primaryVersion||'',secondaryVersion:output.secondaryVersion||''});
  $('stageState').textContent=output.black?'AUDIENCE BLACKED OUT':output.clear?'AUDIENCE LYRICS CLEARED':'CURRENT SLIDE';
 }else{
  paint($('live'),output.clear?'':shown.text,output.theme,output.black,output.template,output.clear?{}:options);
  $('videoToggle').hidden=output.media?.kind!=='video';$('videoToggle').textContent=output.paused?'Play video':'Pause video';
  $('liveStatus').textContent=output.black?'BLACKOUT':output.clear?'TEXT CLEARED':output.text?'ON SCREEN':'READY';$('blackout').setAttribute('aria-pressed',String(output.black));
 }
}
// A running countdown redraws every quarter second. In the main window, "Go to the next item" advances once at zero.
let countdownDone=0;
function countdownTick(){
 if(output.countdown&&!output.black){
  renderOutput();
  if(!mode&&output.countdown.end==='next'&&Date.now()>=output.countdown.target&&countdownDone!==output.countdown.target){countdownDone=output.countdown.target;window.worshipWorkspace?.advanceLive?.()}
 }
 setTimeout(countdownTick,250);
}
setTimeout(countdownTick,250);
if(mode==='audience'||mode==='stage'){
 document.body.className=mode==='audience'?'output-mode':'stage-mode';document.body.replaceChildren();
 const root=document.createElement('div');root.innerHTML=mode==='audience'?'<div id="outputText"></div><button class="fullscreen">Enter fullscreen</button>':'<h2 id="stageState">CURRENT SLIDE</h2><div id="current"></div><h2>UP NEXT</h2><div id="upNext"></div><button class="fullscreen">Enter fullscreen</button>';document.body.append(root);document.querySelector('.fullscreen').onclick=()=>document.documentElement.requestFullscreen().catch(()=>{});renderOutput();
}else{
 // Two clicks on the same slide within 450 ms put it live (each click redraws the cards, so native dblclick is unreliable).
 let lastSlideClick=null;
 function render(){const item=current();$('serviceTitle').value=service.title;$('itemCount').textContent=service.items.length+' ITEMS';$('order').replaceChildren();service.items.forEach((i,n)=>{const row=document.createElement('div'),b=document.createElement('button');b.className='order-item'+(i.id===selected?' active':'');b.setAttribute('aria-current',String(i.id===selected));const num=document.createElement('span');num.className='number';num.textContent=String(n+1).padStart(2,'0');const txt=document.createElement('span'),title=document.createElement('strong'),meta=document.createElement('small');title.textContent=i.title;meta.textContent=i.type+' · '+i.slides.length+' slides';txt.append(title,meta);b.append(num,txt);b.onclick=()=>{selected=i.id;index=0;render()};row.append(b);if(i.id===selected){const controls=document.createElement('div');controls.className='reorder';[-1,1].forEach(dir=>{const move=document.createElement('button');move.textContent=dir<0?'↑ Move up':'↓ Move down';move.disabled=n+dir<0||n+dir>=service.items.length;move.onclick=()=>{[service.items[n],service.items[n+dir]]=[service.items[n+dir],service.items[n]];persist();render()};controls.append(move)});row.append(controls)}$('order').append(row)});$('selectedTitle').textContent=item?.title||'Build your service';$('itemType').textContent=item?.type||'Start with a song or welcome';$('edit').disabled=!item;$('take').disabled=!item;$('slides').replaceChildren();const slideOptions=(slideIndex)=>({...(item?.media?.[slideIndex]?{media:item.media[slideIndex]}:{}),secondaryText:item?.secondarySlides?.[slideIndex]||'',primaryVersion:item?.primaryVersion||'',secondaryVersion:item?.secondaryVersion||'',ccliFooter:item?.type==='Song'&&ccliSettings.churchCopyright?'CCLI License #'+ccliSettings.churchCopyright:''});if(item)item.slides.forEach((text,n)=>{const b=document.createElement('button');b.className='slide-card'+(index===n?' selected':'');b.setAttribute('aria-label','Preview slide '+(n+1));b.setAttribute('aria-pressed',String(index===n));const s=document.createElement('div');paint(s,text,item.theme,false,item.template,slideOptions(n));const caption=document.createElement('div');caption.className='slide-caption';caption.textContent='SLIDE '+String(n+1).padStart(2,'0')+(index===n?' · SELECTED':'');b.append(s,caption);b.onclick=()=>{const now=Date.now(),double=lastSlideClick?.id===item.id&&lastSlideClick.n===n&&now-lastSlideClick.at<450;lastSlideClick=double?null:{id:item.id,n,at:now};index=n;render();if(double)take()};$('slides').append(b)});paint($('preview'),item?.slides[index]||'Add your first service item',item?.theme||'midnight',false,item?.template,item?slideOptions(index):{});$('themes').replaceChildren();themes.forEach(theme=>{const b=document.createElement('button');b.className=theme+(item?.theme===theme?' chosen':'');b.title=theme;b.setAttribute('aria-label',theme+' background');b.disabled=!item;b.onclick=()=>{item.theme=theme;item.template={...SlideTemplate.normalize(item.template),backgroundType:'preset'};persist();render()};$('themes').append(b)});$('ready').textContent=service.items.length?service.items.length+' items · '+service.items.reduce((n,i)=>n+i.slides.length,0)+' slides saved locally. Check text size and your projector before starting.':'Your service is empty. Add an item to begin.';renderTemplateControls(item);renderOutput();if(window.worshipWorkspace)window.worshipWorkspace.setRole(window.worshipWorkspace.role)}
 const renderWorkspace=render;
 render=function(){
  renderWorkspace();
  renderSlideScreens();
  const item=current(),isSong=item?.type==='Song';
  if(item?.type==='Scripture'&&item.fitText){$('preview').fitScripture=true;Array.from($('slides').children).forEach(card=>card.children[0].fitScripture=true);scheduleFit()}
  $('songSection').hidden=!isSong;$('songSection').disabled=!isSong;
  if(isSong)Array.from($('slides').children).forEach((card,n)=>{
   const label=item.sectionLabels?.[n];
   if(label){const caption=card.children[1];caption.textContent+=' · '+label;card.setAttribute('aria-label','Preview slide '+(n+1)+', '+label)}
   card.oncontextmenu=event=>{event.preventDefault();openSongSection(n)};
  });
  // Drag a slide card onto another to move it there.
  if(item)Array.from($('slides').children).forEach((card,n)=>{
   card.draggable=true;
   card.ondragstart=event=>{dragFrom=n;event.dataTransfer?.setData('text/plain',String(n))};
   card.ondragover=event=>{if(dragFrom!==null)event.preventDefault()};
   card.ondrop=event=>{event.preventDefault();const from=dragFrom;dragFrom=null;if(from!==null)moveSlide(from,n)};
   card.ondragend=()=>{dragFrom=null};
  });
  const count=item?.slides.length||0;
  $('slideMoveLeft').disabled=!item||index===0;$('slideMoveRight').disabled=!item||index>=count-1;
  $('slideDuplicate').disabled=!item||count>=200;$('slideDelete').disabled=!item||count<2;
 };
 // Reordering, duplicating and deleting slides. Everything stored per slide (section labels, screen targets,
 // the second translation) moves with its slide; the live slide keeps pointing at the same slide.
 let dragFrom=null;
 const PER_SLIDE=['slides','sectionLabels','slideScreens','secondarySlides','media'];
 function changeSlides(change,newIndex){
  const item=current();if(!item)return false;
  const before=structuredClone(item),order=change([...item.slides.keys()]);
  PER_SLIDE.forEach(key=>{if(Array.isArray(item[key]))item[key]=order.map(n=>item[key][n])});
  // A combined passage's saved separate verses no longer line up once its slides change.
  if(item.slides.length!==before.slides.length){delete item.verseSlides;delete item.secondaryVerseSlides}
  if(!valid(service)||!persist()){Object.keys(item).forEach(key=>delete item[key]);Object.assign(item,before);toast('Unable to change the slides.');render();return false}
  if(livePosition?.id===item.id){const moved=order.indexOf(livePosition.index);livePosition=moved<0?null:{...livePosition,index:moved}}
  index=newIndex;render();return true;
 }
 function moveSlide(from,to){
  const item=current();if(!item||from===to||to<0||to>=item.slides.length)return;
  changeSlides(order=>{const [slide]=order.splice(from,1);order.splice(to,0,slide);return order},to);
 }
 $('slideMoveLeft').onclick=()=>moveSlide(index,index-1);
 $('slideMoveRight').onclick=()=>moveSlide(index,index+1);
 $('slideDuplicate').onclick=()=>{
  const item=current();if(!item)return;
  if(item.slides.length>=200){toast('An item can have at most 200 slides.');return}
  changeSlides(order=>{order.splice(index+1,0,index);return order},index+1);
 };
 $('slideDelete').onclick=()=>{
  const item=current();if(!item)return;
  if(item.slides.length<2){toast('An item needs at least one slide.');return}
  if(!confirm('Delete this slide from the item? Your live output stays unchanged.'))return;
  const removed=index;changeSlides(order=>{order.splice(removed,1);return order},Math.min(removed,item.slides.length-2));
 };
 // Per-slide audience screen ("" all screens, "1", "2"), shown on the thumbnails and set below the slides.
 function renderSlideScreens(){
  const item=current(),targets=item?.slideScreens;
  $('slideScreen').disabled=!item;$('slideScreenAll').disabled=!item;$('slideScreen').value=targets?.[index]||'';
  if(targets)Array.from($('slides').children).forEach((card,n)=>{if(targets[n])card.children[1].textContent+=' · Screen '+targets[n]});
 }
 function setSlideScreens(item,next){
  const previous=item.slideScreens;
  if(next.some(Boolean))item.slideScreens=next;else delete item.slideScreens;
  if(!persist()){if(previous)item.slideScreens=previous;else delete item.slideScreens}
  render();
 }
 $('slideScreen').onchange=()=>{const item=current();if(!item)return;const next=item.slideScreens?.slice()||item.slides.map(()=>'');next[index]=$('slideScreen').value;setSlideScreens(item,next)};
 $('slideScreenAll').onclick=()=>{const item=current();if(item)setSlideScreens(item,item.slides.map(()=>$('slideScreen').value))};
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
  renderVerseLayout(item);renderTextPosition(item);
 }
 function renderTextPosition(item){
  const position=SlideTemplate.textPosition(item?.template)||{x:50,y:50,width:90};
  $('textX').value=String(position.x);$('textY').value=String(position.y);$('textWidth').value=String(position.width);
  ['textX','textY','textWidth','resetTextPosition'].forEach(id=>$(id).disabled=!item);
  if(!item)return;
  const slide=Math.min(index,item.slides.length-1);
  paint($('templatePreview'),item.slides[slide]||'',item.theme,false,item.template,{fitText:item.fitText,secondaryText:item.secondarySlides?.[slide]||'',primaryVersion:item.type==='Scripture'?item.primaryVersion||'':'',secondaryVersion:item.type==='Scripture'?item.secondaryVersion||'':''});
  $('templatePreview').className+=' template-preview';
 }
 // Live preview while dragging or sliding; the template is saved when the gesture ends.
 function previewTextPosition(x,y,width){
  const preview=$('templatePreview');if(!preview.className.includes('text-positioned'))preview.className+=' text-positioned';
  preview.style.setProperty('--text-x',x+'%');preview.style.setProperty('--text-y',y+'%');preview.style.setProperty('--text-width',width+'%');
  $('textX').value=String(x);$('textY').value=String(y);$('textWidth').value=String(width);
 }
 function sliderPosition(){return {textX:Number($('textX').value),textY:Number($('textY').value),textWidth:Number($('textWidth').value)}}
 ['textX','textY','textWidth'].forEach(id=>{
  $(id).oninput=()=>{const p=sliderPosition();previewTextPosition(p.textX,p.textY,p.textWidth)};
  $(id).onchange=()=>updateTemplate(sliderPosition());
 });
 $('resetTextPosition').onclick=()=>updateTemplate({textX:undefined,textY:undefined,textWidth:undefined});
 let textDrag=null;
 function dragPoint(event){
  const box=$('templatePreview').getBoundingClientRect();if(!box.width||!box.height)return null;
  const clamp=value=>Math.max(0,Math.min(100,Math.round(value)));
  return {x:clamp((event.clientX-box.left)/box.width*100),y:clamp((event.clientY-box.top)/box.height*100)};
 }
 $('templatePreview').onpointerdown=event=>{
  if(!current())return;
  const point=dragPoint(event);if(!point)return;
  textDrag={...point,width:Number($('textWidth').value)};$('templatePreview').setPointerCapture?.(event.pointerId);
  previewTextPosition(textDrag.x,textDrag.y,textDrag.width);event.preventDefault();
 };
 $('templatePreview').onpointermove=event=>{
  if(!textDrag)return;const point=dragPoint(event);if(!point)return;
  textDrag={...textDrag,...point};previewTextPosition(textDrag.x,textDrag.y,textDrag.width);
 };
 $('templatePreview').onpointerup=$('templatePreview').onpointercancel=()=>{
  if(!textDrag)return;const drag=textDrag;textDrag=null;
  updateTemplate({textX:drag.x,textY:drag.y,textWidth:drag.width});
 };
 function renderVerseLayout(item){
  const scripture=item?.type==='Scripture';$('verseLayoutSection').hidden=!scripture;if(!scripture)return;
  const combined=!!item.verseSlides,legacy=!combined&&item.fitText&&item.slides.length===1;
  $('verseLayout').textContent=combined?'One verse per slide':'All verses on one slide';
  $('verseLayout').disabled=legacy||!combined&&item.slides.length<2;
  $('verseLayoutStatus').textContent=combined?'Showing all '+item.verseSlides.length+' verses on one slide with auto-fit text.':legacy?'This passage was combined before verses could be split again. Re-add it to show one verse per slide.':item.slides.length<2?'This item has a single slide.':'Showing one verse per slide.';
 }
 // Switch a Scripture item between one verse per slide and all verses on one auto-fit slide.
 function toggleVerseLayout(){
  const item=current();if(item?.type!=='Scripture')return;
  const before=structuredClone(item);
  if(item.verseSlides){
   item.slides=item.verseSlides;delete item.verseSlides;delete item.fitText;delete item.slideScreens;
   if(item.secondaryVerseSlides){item.secondarySlides=item.secondaryVerseSlides;delete item.secondaryVerseSlides}
  }else{
   if(item.slides.length<2)return;
   const combined=item.slides.join('\n'),secondary=item.secondarySlides?.join('\n');
   if(combined.length>20000||secondary?.length>20000){toast('The combined passage exceeds 20,000 characters. Keep one verse per slide.');return}
   item.verseSlides=item.slides;item.slides=[combined];item.fitText=true;delete item.slideScreens;
   if(item.secondarySlides){item.secondaryVerseSlides=item.secondarySlides;item.secondarySlides=[secondary]}
  }
  index=0;
  if(!valid(service)||!persist()){service.items[service.items.indexOf(item)]=before;toast('Unable to change the verse layout.')}
  render();renderTemplateControls(current());
 }
 $('verseLayout').onclick=toggleVerseLayout;
 function updateTemplate(change,targetId=selected){
  const item=service.items.find(i=>i.id===targetId);if(!item)return false;
  const template={...SlideTemplate.normalize(item.template),...change};
  if(!SlideTemplate.validTemplate(template)){toast('Choose a font size between 24 and 200.');return false}
  const candidate=structuredClone(service);candidate.items.find(i=>i.id===targetId).template=template;
  if(new Blob([JSON.stringify(candidate)]).size>4800000){toast('This service is too large. Use a smaller background image.');return false}
  const previous=item.template;item.template=template;
  if(!persist()){item.template=previous;toast('Unable to save the template. Use Back up or use a smaller image.');return false}
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
 function take(preserveBlanking=false){if(window.worshipWorkspace?.role==='editor')return;const i=current();if(!i)return;livePosition={id:i.id,index};output={text:i.slides[index],next:i.slides[index+1]||'',secondaryText:i.secondarySlides?.[index]||'',nextSecondaryText:i.secondarySlides?.[index+1]||'',primaryVersion:i.type==='Scripture'?i.primaryVersion||'':'',secondaryVersion:i.type==='Scripture'?i.secondaryVersion||'':'',fitText:!!i.fitText,ccliFooter:i.type==='Song'&&ccliSettings.churchCopyright?'CCLI License #'+ccliSettings.churchCopyright:'',theme:i.theme,template:SlideTemplate.normalize(i.template),screen:i.slideScreens?.[index]||'',type:i.type,...(i.media?.[index]?{media:i.media[index],paused:false}:{}),...(i.type==='Countdown'?{countdown:{target:SlideTemplate.countdownTarget(i.countdown,Date.now()),message:i.countdown.message,end:i.countdown.end,endMessage:i.countdown.endMessage}}:{}),black:preserveBlanking&&output.black,clear:preserveBlanking&&output.clear};broadcast()}
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
 $('videoToggle').onclick=()=>{if(!output.media||output.media.kind!=='video'||window.worshipWorkspace?.role==='editor')return;output.paused=!output.paused;broadcast()};
 $('take').onclick=()=>take();$('next').onclick=()=>move(1);$('previous').onclick=()=>move(-1);$('clear').onclick=()=>{if(window.worshipWorkspace?.role==='editor')return;output.clear=!output.clear;broadcast()};$('blackout').onclick=()=>{if(window.worshipWorkspace?.role==='editor')return;output.black=!output.black;broadcast()};
 $('serviceTitle').oninput=e=>{service.title=e.target.value;persist()};
 const SONGS='worshipui.songs.v1';
 let songs={version:1,songs:[]},songError='',chosenSongStyle=null,chosenSongSlides=null,chosenScriptureFit=null,chosenVerseSlides=null,chosenSecondVerseSlides=null;
 function validSongs(value){return value&&value.version===1&&Array.isArray(value.songs)&&value.songs.length<=10000&&new Set(value.songs.map(song=>song?.id)).size===value.songs.length&&value.songs.every(song=>song&&song.type==='Song'&&valid({title:'',items:[song]}))}
 try{const saved=workspaceStorage.getItem(SONGS);if(saved!==null){songs=JSON.parse(saved);if(!validSongs(songs))throw Error('Saved song library is invalid.')}}
 catch(error){songError=error.message||'Could not read the song library.'}
 function saveSongs(next){
  if(songError)throw Error(songError+' The saved library was preserved.');
  if(!validSongs(next))throw Error('The song library has reached its limit or contains invalid songs.');
  workspaceStorage.setItem(SONGS,JSON.stringify(next));songs=next;
 }
 function loadSong(song){
  $('titleInput').value=song.title;$('textInput').value=song.slides.join('\n\n');$('songSecondText').value=song.secondarySlides?.join('\n\n')||'';
  chosenSongStyle={theme:song.theme,...(song.template?{template:structuredClone(song.template)}:{}),...(song.sectionLabels?{sectionLabels:structuredClone(song.sectionLabels)}:{})};chosenSongSlides=song.slides.slice();
 }
 function appendSongResult(song){
  const button=document.createElement('button');button.type='button';button.textContent=song.title;
  button.onclick=()=>{loadSong(song);$('songStatus').textContent='Selected '+song.title+'. Review it, then save the item.'};
  $('songResults').append(button);
 }
 function renderSongs(){
  const term=$('songSearch').value.trim().toLowerCase();$('songResults').replaceChildren();
  if(songError){$('songStatus').textContent=songError+' The saved library was preserved.';return}
  if(!term){$('songStatus').textContent='Search by title or lyrics to find saved songs.';return}
  const matches=songs.songs.filter(song=>song.title.toLowerCase().includes(term)||song.slides.some(text=>text.toLowerCase().includes(term))||song.secondarySlides?.some(text=>text.toLowerCase().includes(term))).slice(0,50);
  matches.forEach(appendSongResult);
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
   const second=$('songSecondText').value.trim().split(/\n\s*\n/).filter(Boolean);
   if(second.length&&second.length!==slides.length)throw Error('The second-language lyrics need one block per slide: '+slides.length+' slides, '+second.length+' blocks.');
   const song={id:crypto.randomUUID(),title,type:'Song',slides,...(second.length?{secondarySlides:second,secondaryVersion:secondLanguage().name}:{}),theme:style.theme,...(style.template?{template:style.template}:{}),...(labels?{sectionLabels:labels}:{})};
   if(!title||!slides.length||slides.some(text=>text.length>20000))throw Error('Enter a song title and slide text first.');
   saveSongs({version:1,songs:[...songs.songs,song]});renderSongs();$('songStatus').textContent='Song saved to this device’s library.';
  }catch(error){$('songStatus').textContent=error.message||'Could not save this song.'}
 };
 $('songFile').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
   if(file.size>5000000)throw Error('Choose a song file under 5 MB.');
   const text=await file.text(),imported=WorshipContentImport.parseLyricsFile(file.name,text);
   const additions=imported.map(song=>({id:crypto.randomUUID(),title:song.title.slice(0,100),type:'Song',theme:'dusk',slides:song.slides,...(song.sectionLabels?.some(Boolean)?{sectionLabels:song.sectionLabels}:{})}));
   const next={version:1,songs:[...songs.songs,...additions]};
   if(songError||!validSongs(next))throw Error(songError||'The song library has reached its limit or the imported song is invalid.');
   if(window.worshipDesktop?.archiveSong)await window.worshipDesktop.archiveSong(file.name,text);
   saveSongs(next);
   // Show the imported songs in the search results right away; a single song is also loaded into the editor.
   $('songSearch').value=additions.length===1?additions[0].title:'';renderSongs();
   if(additions.length===1)loadSong(additions[0]);else additions.forEach(appendSongResult);
   $('songStatus').textContent=additions.length===1?additions[0].title+' imported and loaded below. Check title, writers and copyright notices before display.':additions.length+' songs imported and listed above. Check titles, writers and copyright notices before display.';
  }catch(error){$('songStatus').textContent=(error.message||'Could not import that song.')+' If the file was copied, it remains in the song folder.'}
  finally{event.target.value=''}
 };
 if(window.worshipDesktop?.openSongFolder){
  $('openSongFolder').hidden=false;
  $('openSongFolder').onclick=async()=>{try{await window.worshipDesktop.openSongFolder();$('songStatus').textContent='Save SongSelect downloads here, then import the file above.'}catch(error){$('songStatus').textContent=error.message}};
 }
 let bibleData=null,bibleDataId='';
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
  renderYouVersionPreview();
 }
 function updateBibleChapters(){
  fillBibleOptions('bibleChapter',WorshipBible.chapters(bibleData,$('bibleBook').value),$('bibleChapter').value);updateBibleVerses();
 }
 // Each bundled translation loads once, on first use, and stays in memory.
 const bibleLoads=new Map();
 // Licensed versions added in Settings (installed app only): [{id, name, language, licensed:true}].
 let licensedVersions=[];
 function allVersions(){return [...WorshipBible.versions,...licensedVersions]}
 function loadBible(id){
  const version=allVersions().find(v=>v.id===id);if(!version)return Promise.reject(Error('Unknown Bible version.'));
  if(!bibleLoads.has(id)){
   const text=version.licensed?window.worshipDesktop.readBible(id):fetch(version.file).then(response=>{if(!response.ok)throw Error(id+' data is unavailable.');return response.text()});
   const loading=text.then(WorshipBible.parse);
   loading.catch(()=>bibleLoads.delete(id));bibleLoads.set(id,loading);
  }
  return bibleLoads.get(id);
 }
 // Language settings: the main language (header toggle, English or Spanish) and, when English is main,
 // the second language from Settings (Spanish unless changed). With Spanish as main, the second language is English.
 const LANGUAGE='worshipui.language.v1';
 function languageSettings(){const saved=read(LANGUAGE,null);return {version:1,secondLanguage:saved?.secondLanguage||'es',mainLanguage:saved?.mainLanguage==='es'?'es':'en'}}
 function saveLanguageSettings(change){
  try{workspaceStorage.setItem(LANGUAGE,JSON.stringify({...languageSettings(),...change}));return true}catch{toast('Could not save the language setting on this device.');return false}
 }
 function serviceLanguage(){return languageSettings().mainLanguage}
 function secondLanguage(){
  const id=serviceLanguage()==='es'?'en':languageSettings().secondLanguage;
  return WorshipBible.languages.find(language=>language.id===id)||WorshipBible.languages[0];
 }
 // Main version: the bundled Bible in the main language (KJV or Reina-Valera 1909), or another translation from YouVersion.
 // The bundled Bible supplies the book/chapter/verse structure for the selectors.
 const YOUVERSION='YOUVERSION';
 function bundledVersion(){return WorshipBible.versions.find(v=>v.id===(serviceLanguage()==='es'?'RVR1909':'KJV'))}
 // The chosen bundled or licensed version; YouVersion uses the bundled Bible for its book/chapter/verse structure.
 function bibleVersion(){return licensedVersions.find(v=>v.id===$('bibleVersion').value)||bundledVersion()}
 function renderVersionChoices(){
  const chosen=$('bibleVersion').value,keep=chosen===YOUVERSION||licensedVersions.some(v=>v.id===chosen);
  const licensed=licensedVersions.map(v=>({id:v.id,name:v.name+' ('+v.id+')'}));
  fillBibleOptions('bibleVersion',[bundledVersion(),...licensed,{id:YOUVERSION,name:serviceLanguage()==='es'?'Otra versión · YouVersion':'Another version · YouVersion'}],keep?chosen:bundledVersion().id);
  const preferred=WorshipBible.youVersions.filter(v=>(v.language||'en')===serviceLanguage()).concat(WorshipBible.youVersions.filter(v=>(v.language||'en')!==serviceLanguage()));
  fillBibleOptions('youVersionId',preferred.map(v=>({id:v.abbr,name:v.abbr+' · '+v.name})),preferred[0].abbr);
 }
 renderVersionChoices();
 // Settings → Licensed Bible versions: list, add from a text file, remove.
 function renderLicensed(){
  const list=$('licensedList');list.replaceChildren();
  if(!window.worshipDesktop?.listBibles){const note=document.createElement('p');note.className='subtle';note.textContent='Licensed versions can be added in the installed app.';list.append(note);$('licensedFile').disabled=true;return}
  if(!licensedVersions.length){const note=document.createElement('p');note.className='subtle';note.textContent='No licensed versions added yet.';list.append(note)}
  licensedVersions.forEach(version=>{
   const row=document.createElement('div');row.className='licensed-row';
   const label=document.createElement('span');label.textContent=version.id+' · '+version.name+' · '+(version.language==='es'?'Spanish (Español)':'English');
   const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';
   remove.onclick=async()=>{
    if(!confirm('Remove '+version.id+' from this computer? Slides already made with it stay in your services.'))return;
    try{await window.worshipDesktop.deleteBible(version.id);bibleLoads.delete(version.id);await refreshLicensed();$('licensedStatus').textContent=version.id+' removed from this computer.'}
    catch(error){$('licensedStatus').textContent=cleanError(error)}
   };
   row.append(label,remove);list.append(row);
  });
 }
 async function refreshLicensed(){
  try{licensedVersions=window.worshipDesktop?.listBibles?(await window.worshipDesktop.listBibles()).map(v=>({...v,licensed:true})):[]}catch{licensedVersions=[]}
  renderLicensed();renderVersionChoices();
 }
 $('licensedFile').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  const version={id:$('licensedId').value.trim().toUpperCase(),name:$('licensedName').value.trim(),language:$('licensedLanguage').value};
  try{
   if(!/^[A-Z0-9]{2,12}$/.test(version.id))throw Error('Enter the abbreviation (for example NIV) before choosing the file.');
   if(!version.name)throw Error('Enter the version name before choosing the file.');
   $('licensedStatus').textContent='Checking '+version.id+'…';
   const saved=await window.worshipDesktop.saveBible(version,await file.text());
   bibleLoads.delete(saved.id);await refreshLicensed();
   $('licensedId').value='';$('licensedName').value='';
   $('licensedStatus').textContent=saved.id+' added. Choose it under Version when adding Scripture.';
  }catch(error){$('licensedStatus').textContent=cleanError(error)||'Could not add that Bible file.'}
  finally{event.target.value=''}
 };
 refreshLicensed();
 function usingYouVersion(){return $('bibleVersion').value===YOUVERSION}
 function youVersion(){return WorshipBible.youVersions.find(v=>v.abbr===$('youVersionId').value)||WorshipBible.youVersions[0]}
 function mainLanguage(){return usingYouVersion()?youVersion().language||'en':bibleVersion().language}
 // A copied passage can name a translation that is not in the list (e.g. "NASB2020"); its label is then used as-is.
 function mainVersionId(){return usingYouVersion()?(pastedAbbr||youVersion().abbr):bibleVersion().id}
 fillBibleOptions('secondLanguage',WorshipBible.languages.filter(language=>language.id!=='en'),languageSettings().secondLanguage);
 $('secondLanguage').onchange=()=>{
  if(saveLanguageSettings({secondLanguage:$('secondLanguage').value}))$('secondLanguageStatus').textContent='Second language saved on this device.';
  renderSecondOption();
 };
 // Header toggle: English or Spanish as the main language. Flipping it reverses the language choices everywhere.
 function renderLanguageToggle(){
  const main=serviceLanguage();
  $('langEn').setAttribute('aria-pressed',String(main==='en'));$('langEs').setAttribute('aria-pressed',String(main==='es'));
  $('secondLanguage').disabled=main==='es';
  $('secondLanguageStatus').textContent=main==='es'?'Spanish is the main language, so the second language is English.':'Used for the second translation when choosing Scripture.';
 }
 function setServiceLanguage(main){
  if(main===serviceLanguage()||!saveLanguageSettings({mainLanguage:main}))return;
  renderLanguageToggle();renderVersionChoices();window.WorshipI18n?.setLanguage(main);window.dispatchEvent(new Event('worship:language'));
  if(!$('bibleTools').hidden)prepareBible();else renderSecondOption();
  toast(main==='es'?'Idioma principal: Español · second language: English':'Main language: English · second language: '+secondLanguage().name);
 }
 $('langEn').onclick=()=>setServiceLanguage('en');$('langEs').onclick=()=>setServiceLanguage('es');
 renderLanguageToggle();
 if(ENGLISH_ONLY){
  if(serviceLanguage()!=='en')saveLanguageSettings({mainLanguage:'en'});window.WorshipI18n?.setLanguage('en');
  document.querySelector('.language-toggle').hidden=true;document.querySelector('.language-section').hidden=true;
  ['screen1Show','screen2Show','audience1Show','audience2Show','streamShow'].forEach(id=>{$(id).hidden=true});
 }
 // The second Bible: the bundled version for the chosen language, unless it is the same language as the main version.
 function secondBible(){
  const language=secondLanguage(),version=WorshipBible.versions.find(v=>v.id===language.bible);
  return version&&version.language!==mainLanguage()?version:null;
 }
 // The second language is off until the operator presses the button for this passage.
 let addSecondLanguage=false;
 function renderSecondOption(){
  const version=secondBible(),language=secondLanguage(),on=!!version&&addSecondLanguage;
  renderFillSecond();
  $('bibleSecond').hidden=!version||ENGLISH_ONLY;$('bibleSecond').setAttribute('aria-pressed',String(on));
  $('bibleSecond').textContent=!version?'':on?'✓ '+language.name+' added · '+version.id+' (click to remove)':'+ Add '+language.name+' · '+version.id;
 }
 $('bibleSecond').onclick=()=>{addSecondLanguage=!addSecondLanguage;renderSecondOption()};
 // Second translation box: fill it from the bundled second-language Bible using the references on each slide.
 function renderFillSecond(){
  const version=secondBible();
  $('fillSecondLanguage').hidden=!version;
  if(version)$('fillSecondLanguage').textContent='+ Add '+secondLanguage().name+' · '+version.id;
 }
 $('fillSecondLanguage').onclick=async()=>{
  const version=secondBible();if(!version)return;
  const slides=$('textInput').value.trim().split(/\n\s*\n/).filter(Boolean);
  const references=slides.map(text=>WorshipBible.slideReferences(text));
  if(!slides.length||references.some(list=>!list.length)){$('fillSecondStatus').textContent='Each slide needs a verse reference such as “John 3:16 · KJV”. Choose the passage above to add one.';return}
  try{
   $('fillSecondStatus').textContent='Loading the '+version.id+'…';
   const bible=await loadBible(version.id);
   const perSlide=references.map(list=>WorshipBible.parallel(bible,list,version.language).map(verse=>verse.text+'\n'+verse.reference+' · '+version.id));
   if(!$('itemPrimaryVersion').value.trim()){const label=slides[0].match(/ · ([A-Za-z0-9]+)$/m);if(label)$('itemPrimaryVersion').value=label[1]}
   $('itemSecondaryVersion').value=version.id;$('itemSecondaryText').value=perSlide.map(list=>list.join('\n')).join('\n\n');
   // A single combined slide keeps its separate verses so the verse layout button can split both languages later.
   chosenSecondVerseSlides=perSlide.length===1&&perSlide[0].length>1?perSlide[0]:null;
   $('fillSecondStatus').textContent=version.name+' added. Review it, then save the item.';
  }catch(error){$('fillSecondStatus').textContent=error.message||'Could not add the second language.'}
 };
 async function prepareBible(){
  const version=bibleVersion();renderSecondOption();
  $('youVersionTools').hidden=!usingYouVersion();
  // Installed app: one button fetches the verses (bible.com stays hidden). Browser: open bible.com and copy.
  const inApp=!!window.worshipDesktop?.fetchBible;$('youVersionStepCheck').hidden=!inApp;
  $('openYouVersion').textContent=inApp?'Get verses from YouVersion':'Open passage in YouVersion';$('openYouVersion').classList?.toggle('primary',inApp);
  $('addBiblePassage').textContent=usingYouVersion()?'Add pasted passage':'Add selected passage';
  if(bibleData&&bibleDataId===version.id){fillBibleOptions('bibleBook',WorshipBible.books(mainLanguage()),$('bibleBook').value);updateBibleChapters();return}
  $('bibleStatus').textContent='Loading the '+version.id+'…';$('addBiblePassage').disabled=true;
  try{
   const data=await loadBible(version.id);
   if(bibleVersion().id!==version.id)return;
   bibleData=data;bibleDataId=version.id;
   fillBibleOptions('bibleBook',WorshipBible.books(mainLanguage()),$('bibleBook').value);updateBibleChapters();
   $('bibleStatus').textContent='Choose a book, chapter and verse range. When editing, selection fills the item for review.';
  }catch(error){$('bibleStatus').textContent=error.message||'Could not load the '+version.id+'.'}
 }
 $('bibleVersion').onchange=()=>prepareBible();$('youVersionId').onchange=()=>{pastedAbbr='';if(captured){captured=null;$('youVersionText').value=''}prepareBible();renderYouVersionPreview()};
 // YouVersion flow: open the passage on bible.com; when the operator copies verses there and comes back,
 // the copied text is picked up, the passage selectors follow what was copied, and a preview shows the slides.
 let youVersionOpenedAt=0,clipboardBefore='',pastedAbbr='';
 async function readClipboard(){
  if(window.worshipDesktop?.readClipboard)return window.worshipDesktop.readClipboard();
  return navigator.clipboard?.readText?navigator.clipboard.readText():'';
 }
 $('openYouVersion').onclick=async()=>{
  if(!bibleData)return;
  const first=Number($('bibleFirst').value),last=Math.max(first,Number($('bibleLast').value));
  const url=WorshipBible.youVersionUrl(youVersion(),$('bibleBook').value,Number($('bibleChapter').value),first,last);
  // Remember what was already on the clipboard so only newly copied verses are picked up.
  try{clipboardBefore=await readClipboard()}catch{clipboardBefore=''}
  youVersionOpenedAt=Date.now();
  // Installed app: fetch the whole chapter from YouVersion in the background; the selectors choose the verses.
  if(window.worshipDesktop?.fetchBible){
   const reference=WorshipBible.bookName($('bibleBook').value)+' '+$('bibleChapter').value+':'+first+(last>first?'-'+last:'');
   $('bibleStatus').textContent='Getting '+reference+' ('+youVersion().abbr+') from YouVersion…';$('openYouVersion').disabled=true;
   try{applyBibleResult(await window.worshipDesktop.fetchBible(url.replace(/\.(\d+)\.\d+(?:-\d+)?\.([A-Za-z0-9]+)$/,'.$1.$2')))}
   catch(error){$('bibleStatus').textContent=cleanError(error)||'Could not get the verses from YouVersion.'}
   finally{$('openYouVersion').disabled=false}
   return;
  }
  $('bibleStatus').textContent='Copy the verses on bible.com, then come back to WorshipUI.';
  if(window.worshipDesktop?.openYouVersion)window.worshipDesktop.openYouVersion(url).catch(error=>{$('bibleStatus').textContent=error.message||'Could not open YouVersion.'});
  else if(!window.open(url,'_blank','noopener'))$('bibleStatus').textContent='Allow pop-ups to open YouVersion.';
 };
 // Put copied text in the box and move the selectors to the passage that was actually copied.
 function useCopiedText(text){
  $('youVersionText').value=text;
  const reference=WorshipBible.youVersionReference(text);
  if(reference&&bibleData){
   $('bibleBook').value=reference.book;updateBibleChapters();
   $('bibleChapter').value=String(reference.chapter);updateBibleVerses();
   $('bibleFirst').value=String(reference.first);updateBibleVerses();$('bibleLast').value=String(reference.last);
   const known=WorshipBible.youVersions.find(v=>v.abbr===reference.abbr);
   if(known){$('youVersionId').value=known.abbr;pastedAbbr=''}else pastedAbbr=reference.abbr;
  }
  return renderYouVersionPreview();
 }
 // Preview of the slides the copied text will make; Add is enabled only when it can be used.
 function renderYouVersionPreview(){
  fillFromCapture();
  const preview=$('youVersionPreview'),text=$('youVersionText').value.trim();
  if(!usingYouVersion()||!text||!bibleData){preview.hidden=true;return false}
  preview.hidden=false;preview.replaceChildren();
  try{
   const result=WorshipBible.passage(bibleData,$('bibleBook').value,Number($('bibleChapter').value),Number($('bibleFirst').value),Number($('bibleLast').value),mainLanguage());
   const pasted=WorshipBible.pastedPassage(text,result.verses.map(v=>v.verse));
   const heading=document.createElement('strong');
   // The "All verses on one slide" layout combines the verses into a single slide.
   const slideCount=pasted.perVerse&&$('bibleLayout').value==='combined'&&pasted.slides.length>1?1:pasted.slides.length;
   heading.textContent=slideCount+(slideCount===1?' slide':' slides')+' · '+result.reference+' · '+mainVersionId();
   preview.append(heading);
   pasted.slides.slice(0,3).forEach((slide,n)=>{const line=document.createElement('p');line.textContent=(pasted.perVerse?result.verseReferences[n]+' — ':'')+(slide.length>110?slide.slice(0,110)+'…':slide);preview.append(line)});
   if(pasted.slides.length>3){const more=document.createElement('p');more.textContent='+ '+(pasted.slides.length-3)+' more';preview.append(more)}
   if(!pasted.perVerse&&result.verses.length>1){const note=document.createElement('p');note.className='subtle';note.textContent='No verse numbers were copied, so the passage becomes one auto-fit slide.';preview.append(note)}
   $('addBiblePassage').disabled=false;return true;
  }catch(error){const problem=document.createElement('p');problem.textContent=error.message;preview.append(problem);$('addBiblePassage').disabled=true;return false}
 }
 $('youVersionText').oninput=()=>{captured=null;const reference=WorshipBible.youVersionReference($('youVersionText').value);if(reference)useCopiedText($('youVersionText').value);else renderYouVersionPreview()};
 function cleanError(error){return String(error?.message||'').replace(/^Error invoking remote method '[^']+': (Error: )?/,'')}
 // Verses brought in from the bible.com window: {book, chapter, abbr, verses:{16:'text',…}}.
 let captured=null;
 // Write the captured verses for the selected range into the box in the "16 text 17 text" form the parser splits.
 function fillFromCapture(){
  if(!captured||!usingYouVersion())return;
  if(captured.book!==$('bibleBook').value||captured.chapter!==Number($('bibleChapter').value)){captured=null;$('youVersionText').value='';return}
  const first=Number($('bibleFirst').value),last=Math.max(first,Number($('bibleLast').value)),parts=[];
  for(let verse=first;verse<=last;verse++)if(captured.verses[verse])parts.push(verse+' '+captured.verses[verse]);
  if(!parts.length)return;
  $('youVersionText').value=parts.join(' ')+'\n'+WorshipBible.bookName(captured.book)+' '+captured.chapter+':'+first+(last>first?'-'+last:'')+' '+captured.abbr;
  const known=WorshipBible.youVersions.find(v=>v.abbr===captured.abbr);
  if(known){$('youVersionId').value=known.abbr;pastedAbbr=''}else pastedAbbr=captured.abbr;
 }
 // Use a chapter fetched from YouVersion: keep its verses, follow its book/chapter, and preview the chosen range.
 function applyBibleResult({url,verses}){
  const page=String(url).match(/bible\/\d+\/([1-3A-Za-z]{3})\.(\d+)(?:\.(\d+)(?:-(\d+))?)?\.([A-Za-z0-9-]+)/i);
  const book=page&&WorshipBible.usfmBook(page[1]);
  if(!book)throw Error('No verses were found for that passage on YouVersion. Check the translation and try again.');
  const chapter=Number(page[2]),prefix=page[1].toUpperCase()+'.'+chapter+'.',chapterVerses={};
  for(const [id,text] of Object.entries(verses))if(id.startsWith(prefix))chapterVerses[Number(id.slice(prefix.length))]=text;
  if(!Object.keys(chapterVerses).length)throw Error('No verses were found for that passage on YouVersion. Check the translation and try again.');
  captured={book,chapter,abbr:page[5].toUpperCase(),verses:chapterVerses};
  if($('bibleBook').value!==book||Number($('bibleChapter').value)!==chapter){$('bibleBook').value=book;updateBibleChapters();$('bibleChapter').value=String(chapter);updateBibleVerses()}
  if(page[3]){$('bibleFirst').value=page[3];updateBibleVerses();$('bibleLast').value=page[4]||page[3]}
  fillFromCapture();
  $('bibleStatus').textContent=renderYouVersionPreview()?'Verses ready. Check the preview, then add the passage.':($('youVersionPreview').lastChild?.textContent||'');
  if(!$('addBiblePassage').disabled)$('addBiblePassage').focus();
 }
 $('pasteYouVersion').onclick=async()=>{
  try{const text=await readClipboard();if(!text.trim()){$('bibleStatus').textContent='The clipboard is empty. Copy the verses on bible.com first.';return}$('bibleStatus').textContent=useCopiedText(text)?'Copied verses added. Check the preview, then add the passage.':$('youVersionPreview').lastChild?.textContent||''}
  catch{$('bibleStatus').textContent='Could not read the clipboard. Paste into the box instead (Ctrl+V).'}
 };
 // Coming back to WorshipUI after opening YouVersion (within 30 minutes) picks up newly copied verses.
 window.addEventListener('focus',async()=>{
  if(!youVersionOpenedAt||Date.now()-youVersionOpenedAt>1800000||!$('itemDialog').open||!usingYouVersion())return;
  let text='';try{text=await readClipboard()}catch{return}
  if(!text.trim()||text===clipboardBefore||text===$('youVersionText').value)return;
  clipboardBefore=text;
  if(useCopiedText(text)){$('bibleStatus').textContent='Copied verses picked up from YouVersion. Check the preview, then add the passage.';$('addBiblePassage').focus()}
  else $('bibleStatus').textContent=$('youVersionPreview').lastChild?.textContent||'Copy the verses on bible.com, then come back to WorshipUI.';
 });
 $('bibleBook').onchange=updateBibleChapters;$('bibleChapter').onchange=updateBibleVerses;
 $('bibleFirst').onchange=updateBibleVerses;$('bibleLast').onchange=()=>renderYouVersionPreview();$('bibleLayout').onchange=()=>renderYouVersionPreview();
 $('addBiblePassage').onclick=async()=>{
  try{
    const versionId=mainVersionId();
    const result=WorshipBible.passage(bibleData,$('bibleBook').value,Number($('bibleChapter').value),Number($('bibleFirst').value),Number($('bibleLast').value),mainLanguage());
    // YouVersion text is pasted; it splits into verses only when the verse numbers came with it.
    let texts=result.slides,perVerse=true;
    if(usingYouVersion()){const pasted=WorshipBible.pastedPassage($('youVersionText').value,result.verses.map(v=>v.verse));texts=pasted.slides;perVerse=pasted.perVerse}
    const title=result.reference+' · '+versionId;
    const verses=perVerse?texts.map((text,index)=>text+'\n'+result.verseReferences[index]+' · '+versionId):[texts[0]+'\n'+result.reference+' · '+versionId];
    const combined=perVerse&&$('bibleLayout').value==='combined'&&verses.length>1,slides=combined?[verses.join('\n')]:verses;
    const fitted=combined||(!perVerse&&result.verses.length>1);
    // Second translation: the same verses from the second-language Bible, aligned slide for slide.
    const second=addSecondLanguage?secondBible():null;let secondVerses=null;
    if(second){
     $('bibleStatus').textContent='Loading the '+second.id+'…';
     secondVerses=WorshipBible.parallel(await loadBible(second.id),result.verses,second.language).map(verse=>verse.text+'\n'+verse.reference+' · '+second.id);
    }
    const secondSlides=secondVerses&&(combined||!perVerse?[secondVerses.join('\n')]:secondVerses);
    if(slides.some(text=>text.length>20000)||secondSlides?.some(text=>text.length>20000)){$('bibleStatus').textContent='The combined passage exceeds 20,000 characters. Choose one verse per slide.';return}
    if(editing){
     $('titleInput').value=title;$('textInput').value=slides.join('\n\n');$('itemPrimaryVersion').value=versionId;
     $('itemSecondaryVersion').value=second?second.id:'';$('itemSecondaryText').value=secondSlides?secondSlides.join('\n\n'):'';
     chosenScriptureFit=fitted;chosenVerseSlides=combined?verses:null;chosenSecondVerseSlides=combined&&secondVerses?secondVerses:null;
     $('bibleStatus').textContent='Selected '+result.reference+'. Review it, then save the item.';
    }else{
     if(($('titleInput').value.trim()||$('textInput').value.trim()||$('itemPrimaryVersion').value.trim()||$('itemSecondaryVersion').value.trim()||$('itemSecondaryText').value.trim())&&!confirm('Add this passage and discard the unsaved item text?'))return;
     const item={title,type:'Scripture',theme:'ember',slides,primaryVersion:versionId,...(fitted?{fitText:true}:{}),...(combined?{verseSlides:verses}:{}),
      ...(second?{secondaryVersion:second.id,secondarySlides:secondSlides,...(combined?{secondaryVerseSlides:secondVerses}:{})}:{})};
     if(window.worshipWorkspace.addItems([item])){
      $('itemDialog').close();$('youVersionText').value='';captured=null;toast(title+(second?' with '+second.id:'')+' added to the service.');
     }
    }
  }catch(error){$('bibleStatus').textContent=error.message||'Could not add that passage.'}
 };
 function openEditor(isEdit){editing=isEdit;chosenSongStyle=null;chosenSongSlides=null;chosenScriptureFit=null;chosenVerseSlides=null;chosenSecondVerseSlides=null;addSecondLanguage=false;captured=null;$('fillSecondStatus').textContent='';const i=isEdit?current():null;$('dialogTitle').textContent=isEdit?'Edit service item':'Add to your service';$('titleInput').value=i?.title||'';$('typeInput').value=i?.type||'Song';$('textInput').value=i?.slides.join('\n\n')||'';$('itemPrimaryVersion').value=i?.primaryVersion||'';$('itemSecondaryVersion').value=i?.secondaryVersion||'';$('itemSecondaryText').value=i?.secondarySlides?.join('\n\n')||'';$('songSecondText').value=i?.type==='Song'?i.secondarySlides?.join('\n\n')||'':'';$('songSearch').value='';$('delete').hidden=!isEdit;fillCountdownFields(i?.type==='Countdown'?i.countdown:null);mediaDraft=i?.type==='Media'?structuredClone(i.media):[];updateItemTranslationFields();renderSongs();$('itemDialog').showModal()}
 $('add').onclick=()=>openEditor(false);$('edit').onclick=()=>openEditor(true);$('cancel').onclick=()=>$('itemDialog').close();
 function updateItemTranslationFields(){const type=$('typeInput').value;$('countdownFields').hidden=type!=='Countdown';$('mediaFields').hidden=type!=='Media';$('textInputRow').hidden=type==='Countdown'||type==='Media';$('textInput').required=type!=='Countdown'&&type!=='Media';renderMediaDraft();renderCountdownFields();$('translationFields').hidden=type!=='Scripture'||ENGLISH_ONLY;$('bibleTools').hidden=type!=='Scripture';$('songTools').hidden=type!=='Song';$('saveSongTemplate').hidden=type!=='Song';$('songLanguageFields').hidden=type!=='Song'||ENGLISH_ONLY;if(type==='Song'&&!ENGLISH_ONLY)renderTranslateButton();$('titleInput').required=type!=='Scripture';$('titleLabel').textContent=type==='Scripture'?'Title (optional)':'Title';if(type==='Scripture')return prepareBible()}
 $('typeInput').onchange=updateItemTranslationFields;
 // Countdown editor: a length of time or a clock time, text above the timer, and what happens at zero.
 function renderCountdownFields(){
  const clock=$('countdownMode').value==='clock';
  $('countdownMinutesRow').hidden=clock;$('countdownSecondsRow').hidden=clock;$('countdownTimeRow').hidden=!clock;
  $('countdownEndMessageRow').hidden=$('countdownEnd').value!=='message';
 }
 // Images & video editor: the chosen files, in order; each becomes a slide named after the file.
 let mediaDraft=[];
 function renderMediaDraft(){
  const list=$('mediaList');list.replaceChildren();
  $('addMedia').disabled=!window.worshipDesktop?.importMedia;$('importPowerPoint').hidden=!window.worshipDesktop?.importPowerPoint;
  if(!window.worshipDesktop?.importMedia)$('mediaStatus').textContent='Images and videos can be added in the installed app.';
  mediaDraft.forEach((entry,n)=>{
   const row=document.createElement('div');row.className='media-row';
   const name=document.createElement('span');name.textContent=(entry.kind==='video'?'▶ ':'🖼 ')+entry.name;
   const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.onclick=()=>{mediaDraft.splice(n,1);renderMediaDraft()};
   row.append(name,remove);list.append(row);
  });
 }
 $('addMedia').onclick=async()=>{
  try{const added=await window.worshipDesktop.importMedia();mediaDraft=[...mediaDraft,...added].slice(0,200);renderMediaDraft();if(added.length)$('mediaStatus').textContent=added.length+' added. Save the item to use them.'}
  catch(error){$('mediaStatus').textContent=String(error.message||'').replace(/^Error invoking remote method '[^']+': (Error: )?/,'')||'Could not add those files.'}
 };
 // PowerPoint: each visible slide is added as an image; the deck name becomes the title if none is set.
 $('importPowerPoint').onclick=async()=>{
  $('mediaStatus').textContent='Opening the presentation in PowerPoint…';$('importPowerPoint').disabled=true;
  try{
   const deck=await window.worshipDesktop.importPowerPoint();
   if(!deck){$('mediaStatus').textContent='';return}
   mediaDraft=[...mediaDraft,...deck.media].slice(0,200);if(!$('titleInput').value.trim())$('titleInput').value=deck.title;renderMediaDraft();
   $('mediaStatus').textContent=deck.media.length+' slides imported from PowerPoint.'+(deck.animated?' '+deck.animated+' had animations, which pictures cannot keep — check those slides.':'')+' Save the item to use them.';
  }catch(error){$('mediaStatus').textContent=String(error.message||'').replace(/^Error invoking remote method '[^']+': (Error: )?/,'')||'Could not import that presentation.'}
  finally{$('importPowerPoint').disabled=false}
 };
 // Offline lyric translation (desktop app with the translator installed): English ↔ Spanish, line by line,
 // in a worker. The result fills the second-language box for the operator to check before saving.
 let translatorDirections=null,translatorWorker=null,translateRequest=0;
 const translateDirection=()=>serviceLanguage()+'-'+secondLanguage().id;
 async function renderTranslateButton(){
  if(translatorDirections===null){translatorDirections=[];try{const response=await fetch('/translate/manifest.json');if(response.ok){const manifest=await response.json();if(Array.isArray(manifest?.directions))translatorDirections=manifest.directions}}catch{}}
  $('translateLyrics').hidden=!(window.worshipTranslate||translatorDirections.length);
  $('translateLyrics').disabled=!(window.worshipTranslate||translatorDirections.includes(translateDirection()));
  if(!$('translateLyrics').hidden&&$('translateLyrics').disabled)$('translateStatus').textContent='Offline translation works between English and Spanish.';
 }
 function workerTranslate(direction,lines,progress){
  translatorWorker=translatorWorker||new Worker('/translate-worker.js',{type:'module'});
  const id=++translateRequest;
  return new Promise((resolve,reject)=>{
   translatorWorker.onmessage=({data})=>{if(data.id!==id)return;if(data.error)reject(Error(data.error));else if(data.result)resolve(data.result);else progress(data.progress,data.total)};
   translatorWorker.onerror=()=>{translatorWorker=null;reject(Error('The translator could not start.'))};
   translatorWorker.postMessage({id,direction,lines});
  });
 }
 $('translateLyrics').onclick=async()=>{
  const slides=$('textInput').value.trim().split(/\n\s*\n/).filter(Boolean);
  if(!slides.length){$('translateStatus').textContent='Enter the lyrics first.';return}
  if($('songSecondText').value.trim()&&!confirm('Replace the second-language lyrics with a new translation?'))return;
  const jobs=WorshipContentImport.lyricLineJobs(slides),translate=window.worshipTranslate||workerTranslate;
  $('translateLyrics').disabled=true;$('translateStatus').textContent='Loading the translator…';
  try{
   const translated=await translate(translateDirection(),jobs.map(job=>job.text),(done,total)=>{$('translateStatus').textContent='Translating line '+Math.min(done+1,total)+' of '+total+'…'});
   $('songSecondText').value=WorshipContentImport.rebuildLyrics(slides,jobs,translated).join('\n\n');
   $('translateStatus').textContent='Translated on this computer. Machine translation can miss the meaning or the rhythm, so read it through before you sing it.';
  }catch(error){$('translateStatus').textContent=error.message||'Could not translate the lyrics.'}
  finally{$('translateLyrics').disabled=false}
 };
 $('countdownMode').onchange=renderCountdownFields;$('countdownEnd').onchange=renderCountdownFields;
 function fillCountdownFields(countdown){
  const c=countdown||{mode:'duration',seconds:300,message:'',end:'zero',endMessage:''};
  $('countdownMode').value=c.mode;$('countdownMinutes').value=String(Math.floor((c.seconds||300)/60));$('countdownSeconds').value=String((c.seconds||300)%60);
  $('countdownTime').value=c.time||'10:30';$('countdownMessage').value=c.message;$('countdownEnd').value=c.end;$('countdownEndMessage').value=c.endMessage;
  renderCountdownFields();
 }
 function countdownFromFields(){
  const base={message:$('countdownMessage').value.trim(),end:$('countdownEnd').value,endMessage:$('countdownEnd').value==='message'?$('countdownEndMessage').value.trim():''};
  if($('countdownMode').value==='clock')return {mode:'clock',time:$('countdownTime').value,...base};
  return {mode:'duration',seconds:Math.max(0,Math.round(Number($('countdownMinutes').value)||0))*60+Math.min(59,Math.max(0,Math.round(Number($('countdownSeconds').value)||0))),...base};
 }
 $('itemForm').onsubmit=e=>{
  e.preventDefault();const type=$('typeInput').value,title=$('titleInput').value.trim()||(type==='Scripture'?'Scripture':type==='Countdown'?'Countdown':'');
  let slides=$('textInput').value.trim().split(/\n\s*\n/).filter(Boolean),countdown=null;
  if(type==='Media'){
   if(!mediaDraft.length){toast('Add at least one image or video.');return}
   slides=mediaDraft.map(entry=>entry.name);
  }
  if(type==='Countdown'){
   countdown=countdownFromFields();
   if(!SlideTemplate.validCountdown(countdown)){toast('Set a countdown between 1 second and 24 hours, or a clock time.');return}
   slides=[(countdown.message?countdown.message+'\n':'')+(countdown.mode==='clock'?countdown.time:SlideTemplate.clockText(countdown.seconds))];
  }
  if(!slides.length||slides.length>200||slides.some(text=>text.length>20000)||!title){toast('Enter a title (optional for Scripture) and 1–200 slides, with fewer than 20,000 characters per slide.');return}
  if(!editing&&service.items.length>=200){toast('This service has reached the 200-item limit.');return}
  const item={title:title||(type==='Media'?'Images & video':''),type,slides,...(countdown?{countdown}:{}),...(type==='Media'?{media:structuredClone(mediaDraft)}:{})};
  if(type==='Song'){
   const source=chosenSongStyle?{slides:chosenSongSlides,sectionLabels:chosenSongStyle.sectionLabels}:editing&&current()?.type==='Song'?current():null;
   const labels=source&&remapSectionLabels(source.slides,source.sectionLabels,slides);
   if(source&&!confirmSectionLoss(source.sectionLabels,labels))return;
   if(labels)item.sectionLabels=labels;
   // Second-language lyrics: one blank-line block per slide, in the same order.
   const second=$('songSecondText').value.trim();
   if(second){
    const blocks=second.split(/\n\s*\n/).filter(Boolean);
    if(blocks.length!==slides.length){toast('The second-language lyrics need one block per slide: '+slides.length+' slides, '+blocks.length+' blocks.');return}
    if(blocks.some(text=>text.length>20000)){toast('Keep each slide under 20,000 characters.');return}
    item.secondarySlides=blocks;item.secondaryVersion=secondLanguage().name;
   }
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
   // Keep the separate verses of a combined passage while its text is unchanged, so it can be split again.
   const existing=editing&&current()?.type==='Scripture'?current():null;
   if(item.fitText&&slides.length===1){
    const verses=chosenVerseSlides||(existing?.verseSlides&&existing.slides[0]===slides[0]?existing.verseSlides:null);
    if(verses){item.verseSlides=verses;if(chosenSecondVerseSlides&&item.secondarySlides?.length===1&&chosenSecondVerseSlides.length===verses.length)item.secondaryVerseSlides=chosenSecondVerseSlides;else if(!chosenVerseSlides&&existing?.secondaryVerseSlides&&item.secondarySlides?.[0]===existing.secondarySlides?.[0])item.secondaryVerseSlides=existing.secondaryVerseSlides}
   }
  }
  if(editing&&current()?.slideScreens&&current().slides.length===item.slides.length)item.slideScreens=current().slideScreens;
  if(editing){const existing=current();Object.assign(existing,item);if(type==='Song'&&chosenSongStyle){existing.theme=chosenSongStyle.theme;if(chosenSongStyle.template)existing.template=chosenSongStyle.template;else delete existing.template}['primaryVersion','secondaryVersion','secondarySlides','sectionLabels','fitText','verseSlides','secondaryVerseSlides','slideScreens','countdown','media'].forEach(key=>{if(item[key]===undefined)delete existing[key]})}
  else{const created={id:crypto.randomUUID(),...item,theme:type==='Song'&&chosenSongStyle?chosenSongStyle.theme:'dusk',...(type==='Song'&&chosenSongStyle?.template?{template:chosenSongStyle.template}:{})};service.items.push(created);selected=created.id}
  index=0;persist();render();$('itemDialog').close()
 };
 $('delete').onclick=()=>{if(!confirm('Remove this item from the service? Your live output will stay unchanged.'))return;service.items=service.items.filter(i=>i.id!==selected);selected=service.items[0]?.id;index=0;persist();render();$('itemDialog').close()};
 $('settings').onclick=()=>{fillBrandingForm(readBranding().branding);$('settingsDialog').showModal()};
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
    item.verseSlides=slides;item.slides=[slides.join('\n')];
    if(item.secondarySlides){item.secondaryVerseSlides=item.secondarySlides;item.secondarySlides=[item.secondarySlides.join('\n')]}
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
 $('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error();const s=JSON.parse(await file.text());if(!valid(s))throw Error();if(!confirm('Replace the current service with this backup? Use Back up first if you want to keep it.'))return;service=s;selected=s.items[0]?.id;index=0;persist();render();toast('Service imported')}catch{toast('Could not import. Choose a valid WorshipUI JSON backup under 5 MB.')}finally{e.target.value=''}};
 // Church branding: edited in Settings, shown in the header and on blackout, shared through sync.js.
 let brandingLogo='',brandingConflict=null;
 function renderBranding(){
  const branding=readBranding().branding;
  $('churchName').textContent=branding.name||'SUNDAY WORKSPACE';
  $('headerLogo').hidden=!branding.logo;if(branding.logo)$('headerLogo').src=branding.logo;
  if(!$('settingsDialog').open)fillBrandingForm(branding);
  $('brandingConflict').hidden=!brandingConflict;
 }
 function fillBrandingForm(branding){
  $('brandName').value=branding.name;$('brandAddress').value=branding.address;$('brandBlackout').checked=branding.showOnBlackout;
  brandingLogo=branding.logo;renderLogoPreview();
 }
 function renderLogoPreview(){
  $('brandLogoPreview').hidden=!brandingLogo;if(brandingLogo)$('brandLogoPreview').src=brandingLogo;
  $('brandLogoEmpty').hidden=!!brandingLogo;$('removeBrandLogo').hidden=!brandingLogo;
 }
 function saveBrandingRecord(record){
  if(!SlideTemplate.validBrandingRecord(record))return false;
  try{workspaceStorage.setItem(BRANDING,JSON.stringify(record))}catch{return false}
  renderBranding();renderOutput();return true;
 }
 $('saveBranding').onclick=()=>{
  const branding={name:$('brandName').value.trim(),address:$('brandAddress').value.trim(),logo:brandingLogo,showOnBlackout:$('brandBlackout').checked};
  if(!SlideTemplate.validBranding(branding)){$('brandingStatus').textContent='Keep the name under 100 characters and the address under 300.';return}
  const record=readBranding();
  if(!saveBrandingRecord({...record,branding})){$('brandingStatus').textContent='Branding could not be saved on this device.';return}
  $('brandingStatus').textContent='Branding saved on this device. It is shared with your other computers when signed in.';
  window.dispatchEvent(new Event('worship:branding'));
 };
 $('removeBrandLogo').onclick=()=>{brandingLogo='';renderLogoPreview();$('brandingStatus').textContent='Logo removed. Choose Save branding to keep this change.'};
 $('brandLogo').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  let bitmap;
  try{
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000)throw Error('Choose a PNG, JPEG or WebP logo under 10 MB.');
   bitmap=await createImageBitmap(file);
   const canvas=document.createElement('canvas'),scale=Math.min(1,800/bitmap.width,800/bitmap.height);
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
   // PNG keeps a transparent logo background; fall back to JPEG for very detailed images.
   let logo=canvas.toDataURL('image/png');
   if(logo.length>1400000)logo=canvas.toDataURL('image/jpeg',0.85);
   if(logo.length>1400000)throw Error('That logo is too detailed. Choose a smaller image.');
   brandingLogo=logo;renderLogoPreview();$('brandingStatus').textContent='Logo ready. Choose Save branding to keep it.';
  }catch(error){$('brandingStatus').textContent=error.message||'Could not read that logo.'}
  finally{bitmap?.close();event.target.value=''}
 };
 $('useSharedBranding').onclick=()=>{
  const remote=brandingConflict;if(!remote)return;
  brandingConflict=null;
  if(saveBrandingRecord({version:1,branding:brandingOf(remote.branding),baseRevision:remote.revision,baseBranding:brandingOf(remote.branding)})){fillBrandingForm(remote.branding);$('brandingStatus').textContent='Using the shared branding.'}
 };
 $('keepLocalBranding').onclick=()=>{
  const remote=brandingConflict;if(!remote)return;
  brandingConflict=null;
  // Rebase onto the shared revision; the next save still checks the revision, so another change conflicts again.
  if(saveBrandingRecord({...readBranding(),baseRevision:remote.revision,baseBranding:brandingOf(remote.branding)})){$('brandingStatus').textContent='Keeping your branding and sharing it.';window.dispatchEvent(new Event('worship:branding'))}
 };
 renderBranding();
 // Opens an output window; in the desktop app, a window with an assigned display moves there in fullscreen.
 function assignedDisplay(view,screen){const saved=readScreens();return view==='stage'?saved.stage?.display:saved.screens[Number(screen)-1].display}
 async function openOutput(view,screen='1'){
  if(window.worshipWorkspace?.role==='editor')return;
  if(!window.open('?view='+view+(view==='audience'?'&screen='+screen:''),'worshipui-'+view+(view==='audience'?'-'+screen:''),'popup,width=1100,height=700')){toast('Allow pop-up windows to open your '+view+' display.');return}
  const display=assignedDisplay(view,screen);
  if(display===undefined||!window.worshipDesktop?.placeOutput)return;
  // The window registers with the desktop app just after it opens, so retry briefly.
  for(let attempt=0;attempt<10;attempt++){
   try{await window.worshipDesktop.placeOutput(view,screen,display);return}
   catch(error){if(!/Open the window first/.test(error.message)){toast(error.message.replace(/^Error invoking remote method '[^']+': (Error: )?/,''));return}await new Promise(resolve=>setTimeout(resolve,200))}
  }
 }
 function saveScreens(change){
  const next=change(readScreens());
  try{workspaceStorage.setItem(SCREENS,JSON.stringify(next));renderOutput();return true}catch{toast('Could not save the screen setting on this device.');return false}
 }
 $('audience').onclick=()=>openOutput('audience','1');$('openScreen1').onclick=()=>openOutput('audience','1');$('openScreen2').onclick=()=>openOutput('audience','2');
 ;['screen1Show','screen2Show'].forEach((id,n)=>{
  $(id).value=readScreens().screens[n].show;
  $(id).onchange=()=>saveScreens(next=>{next.screens[n]={...next.screens[n],show:$(id).value};return next});
 });$('stage').onclick=()=>openOutput('stage');
 // Screen setup dialog (header "Screens"): display per output, what each audience screen shows, identify and open.
 // Outputs that can be placed on a display, and how each is stored in the screen settings.
 const OUTPUTS=[{id:'audience1',name:'Audience 1',get:s=>s.screens[0].display,set:(s,d)=>{const e={show:s.screens[0].show};if(d!==undefined)e.display=d;s.screens[0]=e}},
  {id:'audience2',name:'Audience 2',get:s=>s.screens[1].display,set:(s,d)=>{const e={show:s.screens[1].show};if(d!==undefined)e.display=d;s.screens[1]=e}},
  {id:'stage',name:'Stage',get:s=>s.stage?.display,set:(s,d)=>{if(d!==undefined)s.stage={display:d};else delete s.stage}}];
 // Give one output a display (or none); a display holds one output, so whatever was on it is unassigned.
 function assignDisplay(outputId,display){
  saveScreens(next=>{
   if(display!==undefined)OUTPUTS.forEach(output=>{if(output.id!==outputId&&output.get(next)===display)output.set(next,undefined)});
   OUTPUTS.find(output=>output.id===outputId).set(next,display);return next;
  });
  renderScreenSetup();
 }
 let knownDisplays=[];
 // A to-scale map of the displays as Windows arranges them; each card chooses which output it shows.
 function renderDisplayMap(displays,saved){
  const map=$('displayMap');map.replaceChildren();
  if(!displays.length){const empty=document.createElement('p');empty.className='subtle';empty.textContent=window.worshipDesktop?'No displays detected.':'Display detection is available in the installed app.';map.append(empty);map.style.height='';return}
  const left=Math.min(...displays.map(d=>d.bounds.x)),top=Math.min(...displays.map(d=>d.bounds.y));
  const right=Math.max(...displays.map(d=>d.bounds.x+d.bounds.width)),bottom=Math.max(...displays.map(d=>d.bounds.y+d.bounds.height));
  const width=map.clientWidth||640,scale=Math.min((width-8)/(right-left),190/(bottom-top));
  map.style.height=Math.round((bottom-top)*scale+8)+'px';
  displays.forEach(display=>{
   const card=document.createElement('div');card.className='display-card'+(display.primary?' primary':'');
   Object.assign(card.style,{left:Math.round((display.bounds.x-left)*scale+4)+'px',top:Math.round((display.bounds.y-top)*scale+4)+'px',width:Math.round(display.bounds.width*scale-6)+'px',height:Math.round(display.bounds.height*scale-6)+'px'});
   const number=document.createElement('strong');number.textContent=String(display.number);
   const size=document.createElement('small');size.textContent=display.width+'×'+display.height+(display.primary?' · main':'');
   const use=document.createElement('select');use.setAttribute('aria-label','Display '+display.number+' shows');
   const assigned=OUTPUTS.find(output=>output.get(saved)===display.id);
   [{id:'',name:'Not used'},...OUTPUTS.map(o=>({id:o.id,name:o.name}))].forEach(choice=>{const option=document.createElement('option');option.value=choice.id;option.textContent=choice.name;use.append(option)});
   use.value=assigned?.id||'';
   use.onchange=()=>{if(use.value)assignDisplay(use.value,display.id);else if(assigned)assignDisplay(assigned.id,undefined)};
   card.append(number,size,use);map.append(card);
  });
 }
 async function renderScreenSetup(displays){
  const saved=readScreens(),desktop=!!window.worshipDesktop?.displays;
  if(!displays){displays=[];if(desktop)try{displays=await window.worshipDesktop.displays()}catch{}}
  knownDisplays=displays;
  const connected=new Set(displays.map(d=>d.id));
  const options=[{id:'',name:desktop?'Not assigned':'Drag the window to the projector'},...displays.map(d=>({id:String(d.id),name:'Display '+d.number+' · '+d.width+'×'+d.height+(d.primary?' (main)':'')}))];
  OUTPUTS.forEach(output=>{
   const id=output.id==='stage'?'stageDisplay':output.id+'Display',display=output.get(saved);
   // Keep an assignment to a display that is unplugged right now, so it returns when reconnected.
   const choices=display!==undefined&&!connected.has(display)?[...options,{id:String(display),name:'Disconnected display'}]:options;
   fillBibleOptions(id,choices,display===undefined?'':String(display));$(id).disabled=!desktop;
  });
  $('audience1Show').value=saved.screens[0].show;$('audience2Show').value=saved.screens[1].show;
  $('identifyDisplays').hidden=!desktop;$('detectDisplays').hidden=!desktop;
  renderDisplayMap(displays,saved);
  $('screensStatus').textContent=desktop?(displays.length>1?displays.length+' displays connected.':'Only one display is connected. Connect the projector, then reopen Screen setup.'):'Display placement is available in the installed app. In a browser, drag each window to the projector and choose fullscreen.';
 }
 $('detectDisplays').onclick=()=>renderScreenSetup();
 // Plugging in or removing a projector refreshes the map and says what changed.
 window.worshipDesktop?.onDisplaysChanged?.(displays=>{
  const before=new Set(knownDisplays.map(d=>d.id)),added=displays.filter(d=>!before.has(d.id));
  if(added.length)toast('Display connected: Display '+added[0].number+' · '+added[0].width+'×'+added[0].height+'. Open Screens to assign it.');
  else if(displays.length<knownDisplays.length)toast('A display was disconnected.');
  knownDisplays=displays;
  if($('screensDialog').open)renderScreenSetup(displays);
 });
 window.worshipDesktop?.displays?.().then(displays=>{knownDisplays=displays}).catch(()=>{});
 // Livestream overlay settings (Screens dialog). The installed app serves the overlay page for OBS.
 const STREAM='worshipui.stream.v1',defaultStream={version:1,layout:'lower',show:'both',fontSize:56,background:'band',ccli:true};
 function readStream(){const saved=read(STREAM,null);return saved&&saved.version===1?{...defaultStream,...saved}:{...defaultStream}}
 async function renderStream(){
  const settings=readStream();
  $('streamLayout').value=settings.layout;$('streamShow').value=settings.show;$('streamBackground').value=settings.background;$('streamFontSize').value=String(settings.fontSize);$('streamCcli').checked=settings.ccli;
  let info={error:'The livestream overlay is available in the installed app.'};
  if(window.worshipDesktop?.streamInfo)try{info=await window.worshipDesktop.streamInfo()}catch{}
  $('streamUrl').value=info.url||'';$('copyStreamUrl').disabled=$('previewStream').disabled=!info.url;
  // OBS on another computer: show this computer's network addresses (with the access key), each with Copy.
  $('streamNetwork').checked=!!settings.network;$('streamNetwork').disabled=!info.url&&!settings.network;
  $('streamNetworkBox').hidden=!settings.network;$('streamNetworkUrls').replaceChildren();
  (info.networkUrls||[]).forEach((address,n)=>{
   const row=document.createElement('div');row.className='stream-address';
   const field=document.createElement('input');field.readOnly=true;field.value=address;field.setAttribute('aria-label','Network overlay address');
   const copy=document.createElement('button');copy.type='button';copy.textContent='Copy address';
   copy.onclick=async()=>{try{await window.worshipDesktop.copyStreamUrl(n);$('streamStatus').textContent='Address copied. Paste it into the OBS Browser source on the streaming computer.'}catch{field.select()}};
   row.append(field,copy);$('streamNetworkUrls').append(row);
  });
  $('streamStatus').textContent=info.url?(settings.ccli&&!ccliSettings.streaming?'Add your CCLI Streaming License number in Settings to show it on song slides.':'Ready for OBS.'):info.error;
 }
 // A random access key for network OBS; letters and digits only.
 function newStreamKey(){const bytes=crypto.getRandomValues(new Uint8Array(12));return Array.from(bytes,b=>b.toString(36).padStart(2,'0')).join('').slice(0,20)}
 function saveStream(change={}){
  const previous=readStream();
  const settings={version:1,layout:$('streamLayout').value,show:$('streamShow').value,fontSize:Number($('streamFontSize').value),background:$('streamBackground').value,ccli:$('streamCcli').checked,
   network:$('streamNetwork').checked,networkKey:previous.networkKey||newStreamKey(),...change};
  try{workspaceStorage.setItem(STREAM,JSON.stringify(settings));renderStream()}catch{$('streamStatus').textContent='Could not save the livestream settings on this device.'}
 }
 ['streamLayout','streamShow','streamBackground','streamFontSize','streamCcli','streamNetwork'].forEach(id=>{$(id).onchange=()=>saveStream()});
 $('newStreamKey').onclick=()=>{if(confirm('Make a new key? OBS on the other computer will need the new address.'))saveStream({networkKey:newStreamKey()})};
 $('copyStreamUrl').onclick=async()=>{try{if(window.worshipDesktop?.copyStreamUrl)await window.worshipDesktop.copyStreamUrl();else await navigator.clipboard.writeText($('streamUrl').value);$('streamStatus').textContent='Address copied. Paste it into the OBS Browser source.'}catch{$('streamUrl').select();$('streamStatus').textContent='Press Ctrl+C to copy the selected address.'}};
 $('previewStream').onclick=()=>{if($('streamUrl').value)window.open($('streamUrl').value,'_blank')};
 $('screenSetup').onclick=()=>{$('screensDialog').showModal();renderScreenSetup();renderStream()};
 $('closeScreens').onclick=()=>$('screensDialog').close();
 [['audience1Display','audience1'],['audience2Display','audience2'],['stageDisplay','stage']].forEach(([id,output])=>{$(id).onchange=()=>assignDisplay(output,$(id).value?Number($(id).value):undefined)});
 [['audience1Show',0,'screen1Show'],['audience2Show',1,'screen2Show']].forEach(([id,n,panel])=>{$(id).onchange=()=>{if(saveScreens(next=>{next.screens[n]={...next.screens[n],show:$(id).value};return next}))$(panel).value=$(id).value}});
 $('openAudience1').onclick=()=>openOutput('audience','1');$('openAudience2').onclick=()=>openOutput('audience','2');$('openStageScreen').onclick=()=>openOutput('stage');
 $('identifyDisplays').onclick=()=>window.worshipDesktop?.identifyDisplays().catch(()=>{});
 $('openAllScreens').onclick=async()=>{
  const saved=readScreens(),targets=[];
  if(saved.screens[0].display!==undefined)targets.push(['audience','1']);
  if(saved.screens[1].display!==undefined)targets.push(['audience','2']);
  if(saved.stage?.display!==undefined)targets.push(['stage','1']);
  if(!targets.length){$('screensStatus').textContent='Assign a display to at least one output first.';return}
  for(const [view,screen] of targets)await openOutput(view,screen);
  $('screensStatus').textContent=targets.length+' screen'+(targets.length===1?'':'s')+' opened.';
 };
 document.addEventListener('keydown',e=>{if($('itemDialog').open||$('songSectionDialog').open||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey)return;if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName)&&!(e.target===$('take')&&e.key===' '))return;if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp',' ','b','B'].includes(e.key))e.preventDefault();if(['ArrowRight','ArrowDown'].includes(e.key))move(1);if(['ArrowLeft','ArrowUp'].includes(e.key))move(-1);if(e.key===' '&&!e.repeat)advanceLive();if(e.key.toLowerCase()==='b'){$('blackout').click()}});
 window.worshipWorkspace={
   role:'operator',
   getService:()=>structuredClone(service),valid,
   saveFailed:()=>saveFailed,
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
     try{saveLibrary(next)}catch{toast('Could not save the selected setlist. Use Back up and check storage.');return false}
     service=structuredClone(next.entries[key].service);selected=service.items[0]?.id;index=0;render();return true;
   },
   // Removes a saved dated setlist from this computer (not the one that is open). Its service goes into the
   // recovery copies first, so "Download recovery" can bring it back.
   deleteDate(date){
     if(!library||!validDate(date)||library.active===date||!library.entries[date])return false;
     try{
       const recovery=JSON.parse(workspaceStorage.getItem('worshipui.recovery.v1')||'[]');
       recovery.push({at:new Date().toISOString(),date,service:structuredClone(library.entries[date].service)});
       workspaceStorage.setItem('worshipui.recovery.v1',JSON.stringify(recovery.slice(-5)));
     }catch{toast('Could not save a recovery copy, so the setlist was not deleted.');return false}
     const next=structuredClone(library);delete next.entries[date];
     try{saveLibrary(next)}catch{toast('Could not delete the setlist. Check device storage.');return false}
     return true;
   },
   addItems(items){
     if(!Array.isArray(items)||!items.length||service.items.length+items.length>200){toast('The service can contain at most 200 items.');return false}
     if(items.some(item=>!item||!['Song','Scripture'].includes(item.type)||typeof item.title!=='string'||!item.title.trim()||!Array.isArray(item.slides)||!item.slides.length||item.slides.some(slide=>typeof slide!=='string')||!validTranslations(item))){toast('Imported content is invalid.');return false}
     const additions=items.map(item=>{const addition={id:crypto.randomUUID(),title:item.title.trim(),type:item.type,theme:item.theme||(item.type==='Scripture'?'ember':'dusk'),slides:item.slides};['primaryVersion','secondaryVersion','secondarySlides','fitText','verseSlides','secondaryVerseSlides','template','sectionLabels'].forEach(key=>{if(item[key]!==undefined)addition[key]=item[key]});return addition});
     const candidate=structuredClone(service);candidate.items.push(...additions);
     if(!valid(candidate)){toast('Imported content exceeds the service limits.');return false}
     if(new Blob([JSON.stringify(candidate)]).size>4800000){toast('This service is too large to add the imported content. Use Back up or use smaller files.');return false}
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
   getBranding:()=>structuredClone(readBranding()),
   setBranding:record=>saveBrandingRecord(structuredClone(record)),
   showBrandingConflict(remote){brandingConflict=structuredClone(remote);renderBranding();$('brandingStatus').textContent='Branding changed on another computer · choose which to keep.'},
   renderBranding,
   advanceLive:()=>advanceLive(),
   setRole(role){this.role=role;['take','clear','blackout','audience','stage'].forEach(id=>$(id).disabled=role==='editor'||(id==='take'&&!current()));}
 };
 // Inbox (installed app): emails sent to the church's WorshipUI address. Each one is read as a setlist, a Scripture
 // request or a message; the operator adds it to the service or dismisses it. Email text is only ever shown as text.
 const INBOX_DONE='worshipui.inbox.handled.v1',INBOX_EVERY=180000;
 let inboxMessages=[],inboxAddress='',inboxChecking=false;
 function handledIds(){try{const list=JSON.parse(workspaceStorage.getItem(INBOX_DONE)||'[]');return Array.isArray(list)?list.filter(id=>typeof id==='string'):[]}catch{return []}}
 function markHandled(id){const list=handledIds().filter(other=>other!==id);list.push(id);try{workspaceStorage.setItem(INBOX_DONE,JSON.stringify(list.slice(-1000)))}catch{}}
 function pendingMessages(){const done=new Set(handledIds());return inboxMessages.filter(message=>!done.has(message.id))}
 function renderInboxCount(){
  const count=pendingMessages().length;
  $('inboxButton').hidden=!inboxAddress;$('inboxCount').hidden=!count;$('inboxCount').textContent=count>99?'99+':String(count);
  $('inboxButton').classList?.toggle('has-mail',count>0);
 }
 function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
 function inboxCard(message){
  const request=WorshipEmail.parse(message,WorshipBible.bookId);
  const card=element('article','inbox-card'),head=element('div','inbox-head');
  head.append(element('span','inbox-kind inbox-'+request.kind,{setlist:'Setlist',scripture:'Scripture',note:'Message'}[request.kind]),element('strong',request.subject?'inbox-user':'',request.subject||'(No subject)'));
  card.append(head,element('small','inbox-user',(message.fromName?message.fromName+' · ':'')+message.from+' · '+new Date(message.date).toLocaleString()));
  const body=element('div','inbox-body'),actions=element('div','inbox-actions');let add=null;
  if(request.kind==='setlist'){
   const library=new Map(songs.songs.map(song=>[WorshipEmail.songKey(song.title),song])),boxes=[];
   request.songs.forEach(title=>{
    const row=element('label','check-row'),box=element('input');box.type='checkbox';box.checked=true;boxes.push({box,title});
    row.append(box,element('span','inbox-user',title),element('small','',library.has(WorshipEmail.songKey(title))?'In your song library':'Not in your song library yet'));body.append(row);
   });
   add=()=>{
    const chosen=boxes.filter(entry=>entry.box.checked);if(!chosen.length){toast('Choose at least one song.');return false}
    const missing=[];
    const items=chosen.map(({title})=>{const saved=library.get(WorshipEmail.songKey(title));if(saved){const song=structuredClone(saved);delete song.id;return song}missing.push(title);return {type:'Song',title,slides:[title]}});
    if(!window.worshipWorkspace.addItems(items))return false;
    toast(missing.length?'Added '+items.length+' songs. Add the lyrics for: '+missing.join(', ')+'.':'Added '+items.length+' songs from your song library.');return true;
   };
  }else if(request.kind==='scripture'){
   {const line=element('p','inbox-reference');line.append(element('span','inbox-user',request.referenceText));if(request.verses)line.append(element('span','',' · verses included in the email'));body.append(line)}
   if(request.others.length)body.append(element('p','subtle','Also mentioned: '+request.others.join(', ')+'. Add those from Scripture in the item editor.'));
   if(request.verses)body.append(element('p','inbox-text inbox-user',request.verses.length>400?request.verses.slice(0,400)+'…':request.verses));
   add=async()=>{
    const {book,chapter,first,last}=request.reference;let item;
    if(request.verses){
     const numbers=Array.from({length:last-first+1},(_,n)=>first+n),pasted=WorshipBible.pastedPassage(request.verses,numbers);
     const slides=pasted.slides.slice(0,200).map(text=>text.slice(0,20000));
     item={type:'Scripture',title:request.referenceText,theme:'ember',slides,...(slides.length===1&&numbers.length>1?{fitText:true}:{})};
    }else{
     const version=bibleVersion(),data=await loadBible(version.id),result=WorshipBible.passage(data,book,chapter,first,last,mainLanguage());
     item={type:'Scripture',title:result.reference+' · '+version.id,theme:'ember',primaryVersion:version.id,slides:result.slides.map((text,n)=>text+'\n'+result.verseReferences[n]+' · '+version.id)};
    }
    if(!window.worshipWorkspace.addItems([item]))return false;
    toast(item.title+' added to the service.');return true;
   };
  }else body.append(element('p','inbox-text'+(request.text?' inbox-user':''),request.text.length>1200?request.text.slice(0,1200)+'…':request.text||'(This email has no text.)'));
  if(add){
   const addButton=element('button','primary',request.kind==='setlist'?'Add songs to the service':'Add to the service');addButton.type='button';
   addButton.onclick=async()=>{addButton.disabled=true;try{if(await add()){markHandled(message.id);renderInbox()}}catch(error){toast(error.message||'Could not add that.')}finally{addButton.disabled=false}};
   actions.append(addButton);
  }
  const dismiss=element('button','',request.kind==='note'?'Done':'Dismiss');dismiss.type='button';
  dismiss.onclick=()=>{markHandled(message.id);renderInbox()};
  actions.append(dismiss);card.append(body,actions);return card;
 }
 function renderInbox(){
  renderInboxCount();
  $('inboxAddress').textContent=inboxAddress?'Emails sent to '+inboxAddress+' in the last 30 days.':'';
  const list=pendingMessages();$('inboxList').replaceChildren(...list.map(inboxCard));
  if(!list.length&&!inboxChecking)$('inboxStatus').textContent='No new emails.';
 }
 async function checkInbox(quiet=false){
  if(!inboxAddress||inboxChecking||!window.worshipDesktop?.inboxCheck)return;
  inboxChecking=true;if(!quiet)$('inboxStatus').textContent='Checking the inbox…';
  try{const result=await window.worshipDesktop.inboxCheck();inboxMessages=Array.isArray(result?.messages)?result.messages:[];$('inboxStatus').textContent='Checked at '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.'}
  catch(error){$('inboxStatus').textContent=cleanError(error)||'Could not check the inbox.'}
  finally{inboxChecking=false;renderInbox()}
 }
 function renderInboxSettings(){
  if(inboxAddress)$('inboxAddressInput').value=inboxAddress;$('forgetInbox').hidden=!inboxAddress;
  $('connectInbox').textContent=inboxAddress?'Update inbox':'Connect inbox';
  $('inboxPassword').placeholder=inboxAddress?'Saved · type a new one to change it':'';
 }
 if(window.worshipDesktop?.inboxStatus){
  $('inboxButton').onclick=()=>{renderInbox();$('inboxDialog').showModal();checkInbox(true)};
  $('refreshInbox').onclick=()=>checkInbox();$('closeInbox').onclick=()=>$('inboxDialog').close();
  $('connectInbox').onclick=async()=>{
   const address=$('inboxAddressInput').value.trim(),password=$('inboxPassword').value;
   if(!password){$('inboxSettingsStatus').textContent='Enter the password for that email address.';return}
   $('connectInbox').disabled=true;$('inboxSettingsStatus').textContent='Connecting to '+address+'…';
   try{
    const result=await window.worshipDesktop.inboxConnect(address,password,$('inboxServer').value.trim());
    inboxAddress=result.address;inboxMessages=Array.isArray(result.messages)?result.messages:[];$('inboxPassword').value='';
    $('inboxSettingsStatus').textContent='Connected. New emails appear under Inbox next to the church name.';renderInboxSettings();renderInbox();
   }catch(error){$('inboxSettingsStatus').textContent=cleanError(error)||'Could not connect.'}
   finally{$('connectInbox').disabled=false}
  };
  $('forgetInbox').onclick=async()=>{
   if(!confirm('Disconnect the inbox on this computer? The emails stay in the mailbox.'))return;
   await window.worshipDesktop.inboxForget();inboxAddress='';inboxMessages=[];$('inboxAddressInput').value='';
   $('inboxSettingsStatus').textContent='Inbox disconnected on this computer.';renderInboxSettings();renderInbox();
  };
  window.worshipDesktop.inboxStatus().then(status=>{inboxAddress=status?.address||'';$('inboxServer').value=status?.server||'';renderInboxSettings();renderInboxCount();checkInbox(true)}).catch(()=>{});
  setInterval(()=>checkInbox(true),INBOX_EVERY);
 }else document.querySelector('.inbox-section')?.setAttribute('hidden','');
 persist();render();
}
window.addEventListener('storage',e=>{if(e.key===SCREENS){renderOutput();return}if(e.key===BRANDING){renderOutput();window.worshipWorkspace?.renderBranding();return}if(e.key===LIVE){const o=read(LIVE,null);if(safeOutput(o)){output=o;renderOutput();if(!mode&&window.worshipWorkspace)window.worshipWorkspace.setRole(window.worshipWorkspace.role)}}});
