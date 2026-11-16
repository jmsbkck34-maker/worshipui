/* Worship UI: local-first, dependency-free service workspace. */
const workspaceStorage=window.worshipStorage||localStorage;
const KEY='worshipui.service.v1', LIVE='worshipui.live.v1';
const themes=['dusk','ocean','ember','midnight'];
const demo={title:'Sunday gathering',items:[{id:'welcome',title:'Welcome home',type:'Announcement',theme:'dusk',slides:['Welcome home\nWe’re glad you’re here.','Take a moment.\nPrepare your heart for worship.']},{id:'grace',title:'Amazing Grace',type:'Song',theme:'ocean',slides:['Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.','’Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.','Through many dangers, toils and snares,\nI have already come;\n’Tis grace hath brought me safe thus far,\nAnd grace will lead me home.']},{id:'psalm',title:'Psalm 100:1–2 · KJV',type:'Scripture',theme:'ember',slides:['Make a joyful noise unto the LORD,\nall ye lands.\n\nPsalm 100:1 · KJV','Serve the LORD with gladness:\ncome before his presence with singing.\n\nPsalm 100:2 · KJV']},{id:'message',title:'A heart of gratitude',type:'Sermon',theme:'midnight',slides:['A heart of gratitude\nSunday message']}]};
const $=id=>document.getElementById(id);
function read(key,fallback){try{return JSON.parse(workspaceStorage.getItem(key))||fallback}catch{return fallback}}
function valid(s){return s&&typeof s.title==='string'&&s.title.length<=100&&Array.isArray(s.items)&&s.items.length<=200&&s.items.every(i=>i&&typeof i.id==='string'&&typeof i.title==='string'&&i.title.length<=100&&['Song','Scripture','Announcement','Sermon'].includes(i.type)&&themes.includes(i.theme)&&SlideTemplate.validTemplate(i.template)&&Array.isArray(i.slides)&&i.slides.length>0&&i.slides.length<=200&&i.slides.every(t=>typeof t==='string'&&t.length<=20000))&&new Set(s.items.map(i=>i.id)).size===s.items.length}
let service=read(KEY,null);if(!valid(service))service=structuredClone(demo);
let selected=service.items[0]?.id,index=0,editing=false,output=read(LIVE,{text:'',next:'',theme:'midnight',black:false,clear:false});
const mode=new URLSearchParams(location.search).get('view');
function safeOutput(o){return o&&typeof o.text==='string'&&typeof o.next==='string'&&themes.includes(o.theme)&&typeof o.black==='boolean'&&typeof o.clear==='boolean'&&SlideTemplate.validTemplate(o.template)}
if(!safeOutput(output))output={text:'',next:'',theme:'midnight',black:false,clear:false};
function paint(el,text,theme,black=false,template){
 const style=SlideTemplate.normalize(template);
 el.className='screen '+(black?'':theme)+(!black&&style.backgroundType==='motion'?' motion-background motion-'+style.motion+(style.motionPaused?' motion-paused':''):'');
 el.style.backgroundImage='';el.style.backgroundColor='';
 el.style.setProperty('--slide-font-size',String(style.fontSize));
 el.style.fontFamily='"'+style.font+'", sans-serif';
 if(!black&&style.backgroundType==='color'){el.style.backgroundImage='none';el.style.backgroundColor=style.color}
 if(!black&&style.backgroundType==='image')el.style.backgroundImage='url("'+style.image+'")';
 const textNode=document.createElement('span');textNode.className='slide-text';textNode.textContent=black?'':text;
 el.replaceChildren(textNode);
}
function toast(t){$('toast').textContent=t;$('toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').style.display='none',3500)}
function persist(){window.dispatchEvent(new Event('worship:changed'));try{workspaceStorage.setItem(KEY,JSON.stringify(service));$('saveState').textContent='Saved on this device'}catch{$('saveState').textContent='Not saved — export a backup';toast('Storage unavailable. Export your service to keep a copy.')}}
function current(){return service.items.find(i=>i.id===selected)}
function renderOutput(){if(mode==='audience'){paint($('outputText'),output.clear?'':output.text,output.theme,output.black,output.template)}else if(mode==='stage'){$('current').textContent=output.text||'Waiting for the first slide';$('upNext').textContent=output.next||'End of item';$('stageState').textContent=output.black?'AUDIENCE BLACKED OUT':output.clear?'AUDIENCE LYRICS CLEARED':'CURRENT SLIDE'}else{paint($('live'),output.clear?'':output.text,output.theme,output.black,output.template);$('liveStatus').textContent=output.black?'BLACKOUT':output.clear?'TEXT CLEARED':output.text?'ON SCREEN':'READY';$('blackout').setAttribute('aria-pressed',String(output.black));}}
if(mode==='audience'||mode==='stage'){
 document.body.className=mode==='audience'?'output-mode':'stage-mode';document.body.replaceChildren();
 const root=document.createElement('div');root.innerHTML=mode==='audience'?'<div id="outputText"></div><button class="fullscreen">Enter fullscreen</button>':'<h2 id="stageState">CURRENT SLIDE</h2><div id="current"></div><h2>UP NEXT</h2><div id="upNext"></div><button class="fullscreen">Enter fullscreen</button>';document.body.append(root);document.querySelector('.fullscreen').onclick=()=>document.documentElement.requestFullscreen().catch(()=>{});renderOutput();
}else{
 function render(){const item=current();$('serviceTitle').value=service.title;$('itemCount').textContent=service.items.length+' ITEMS';$('order').replaceChildren();service.items.forEach((i,n)=>{const row=document.createElement('div'),b=document.createElement('button');b.className='order-item'+(i.id===selected?' active':'');b.setAttribute('aria-current',String(i.id===selected));const num=document.createElement('span');num.className='number';num.textContent=String(n+1).padStart(2,'0');const txt=document.createElement('span'),title=document.createElement('strong'),meta=document.createElement('small');title.textContent=i.title;meta.textContent=i.type+' · '+i.slides.length+' slides';txt.append(title,meta);b.append(num,txt);b.onclick=()=>{selected=i.id;index=0;render()};row.append(b);if(i.id===selected){const controls=document.createElement('div');controls.className='reorder';[-1,1].forEach(dir=>{const move=document.createElement('button');move.textContent=dir<0?'↑ Move up':'↓ Move down';move.disabled=n+dir<0||n+dir>=service.items.length;move.onclick=()=>{[service.items[n],service.items[n+dir]]=[service.items[n+dir],service.items[n]];persist();render()};controls.append(move)});row.append(controls)}$('order').append(row)});$('selectedTitle').textContent=item?.title||'Build your service';$('itemType').textContent=item?.type||'Start with a song or welcome';$('edit').disabled=!item;$('take').disabled=!item;$('slides').replaceChildren();if(item)item.slides.forEach((text,n)=>{const b=document.createElement('button');b.className='slide-card'+(index===n?' selected':'');b.setAttribute('aria-label','Preview slide '+(n+1));b.setAttribute('aria-pressed',String(index===n));const s=document.createElement('div');paint(s,text,item.theme,false,item.template);const caption=document.createElement('div');caption.className='slide-caption';caption.textContent='SLIDE '+String(n+1).padStart(2,'0')+(index===n?' · SELECTED':'');b.append(s,caption);b.onclick=()=>{index=n;render()};$('slides').append(b)});paint($('preview'),item?.slides[index]||'Add your first service item',item?.theme||'midnight',false,item?.template);$('themes').replaceChildren();themes.forEach(theme=>{const b=document.createElement('button');b.className=theme+(item?.theme===theme?' chosen':'');b.title=theme;b.setAttribute('aria-label',theme+' background');b.disabled=!item;b.onclick=()=>{item.theme=theme;item.template={...SlideTemplate.normalize(item.template),backgroundType:'preset'};persist();render()};$('themes').append(b)});$('ready').textContent=service.items.length?service.items.length+' items · '+service.items.reduce((n,i)=>n+i.slides.length,0)+' slides saved locally. Check text size and your projector before starting.':'Your service is empty. Add an item to begin.';renderTemplateControls(item);renderOutput();if(window.worshipWorkspace)window.worshipWorkspace.setRole(window.worshipWorkspace.role)}
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
  try{workspaceStorage.setItem(KEY,JSON.stringify(service))}catch{item.template=previous;toast('Unable to save the template. Export a backup or use a smaller image.');return false}
  persist();render();return true;
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
 function take(){if(window.worshipWorkspace?.role==='editor')return;const i=current();if(!i)return;output={text:i.slides[index],next:i.slides[index+1]||'',theme:i.theme,template:SlideTemplate.normalize(i.template),black:false,clear:false};broadcast()}
 function move(dir){const i=current();if(!i)return;if(index+dir>=0&&index+dir<i.slides.length){index+=dir}else{const n=service.items.indexOf(i)+dir;if(n<0||n>=service.items.length)return;selected=service.items[n].id;index=dir>0?0:service.items[n].slides.length-1}render()}
 $('take').onclick=take;$('next').onclick=()=>move(1);$('previous').onclick=()=>move(-1);$('clear').onclick=()=>{if(window.worshipWorkspace?.role==='editor')return;output.clear=!output.clear;broadcast()};$('blackout').onclick=()=>{if(window.worshipWorkspace?.role==='editor')return;output.black=!output.black;broadcast()};
 $('serviceTitle').oninput=e=>{service.title=e.target.value;persist()};
 function openEditor(isEdit){editing=isEdit;const i=isEdit?current():null;$('dialogTitle').textContent=isEdit?'Edit service item':'Add to your service';$('titleInput').value=i?.title||'';$('typeInput').value=i?.type||'Song';$('textInput').value=i?.slides.join('\n\n')||'';$('delete').hidden=!isEdit;$('itemDialog').showModal()}
 $('add').onclick=()=>openEditor(false);$('edit').onclick=()=>openEditor(true);$('cancel').onclick=()=>$('itemDialog').close();
 $('itemForm').onsubmit=e=>{e.preventDefault();const slides=$('textInput').value.trim().split(/\n\s*\n/).filter(Boolean);if(!slides.length||slides.length>200||slides.some(t=>t.length>20000)||!$('titleInput').value.trim()){toast('Enter a title and 1–200 slides, with fewer than 20,000 characters per slide.');return}if(!editing&&service.items.length>=200){toast('This service has reached the 200-item limit.');return}if(editing){Object.assign(current(),{title:$('titleInput').value.trim(),type:$('typeInput').value,slides})}else{const i={id:crypto.randomUUID(),title:$('titleInput').value.trim(),type:$('typeInput').value,theme:'dusk',slides};service.items.push(i);selected=i.id}index=0;persist();render();$('itemDialog').close()};
 $('delete').onclick=()=>{if(!confirm('Remove this item from the service? Your live output will stay unchanged.'))return;service.items=service.items.filter(i=>i.id!==selected);selected=service.items[0]?.id;index=0;persist();render();$('itemDialog').close()};
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(service,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='worshipui-service.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw Error();const s=JSON.parse(await file.text());if(!valid(s))throw Error();if(!confirm('Replace the current service with this backup? Export first if you want to keep it.'))return;service=s;selected=s.items[0]?.id;index=0;persist();render();toast('Service imported')}catch{toast('Could not import. Choose a valid Worship UI JSON backup under 5 MB.')}finally{e.target.value=''}};
 function openOutput(view){if(window.worshipWorkspace?.role==='editor')return;if(!window.open('?view='+view,'worshipui-'+view,'popup,width=1100,height=700'))toast('Allow pop-up windows to open your '+view+' display.')}
 $('audience').onclick=()=>openOutput('audience');$('stage').onclick=()=>openOutput('stage');
 document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName)||$('itemDialog').open||e.ctrlKey||e.metaKey||e.altKey)return;if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp',' ','b','B'].includes(e.key))e.preventDefault();if(['ArrowRight','ArrowDown'].includes(e.key))move(1);if(['ArrowLeft','ArrowUp'].includes(e.key))move(-1);if(e.key===' ')take();if(e.key.toLowerCase()==='b'){$('blackout').click()}});
 window.worshipWorkspace={
   role:'operator',
   getService:()=>structuredClone(service),valid,
   editing:()=>!!$('itemDialog').open||!!$('templateDialog')?.open||document.activeElement===$('serviceTitle')||!!$('reviewDialog')?.open||!!$('historyDialog')?.open,
   replace(next){
     if(!valid(next))return false;
     try{workspaceStorage.setItem(KEY,JSON.stringify(next))}catch{return false}
     service=structuredClone(next);if(!service.items.some(i=>i.id===selected))selected=service.items[0]?.id;
     index=Math.min(index,Math.max(0,(current()?.slides.length||1)-1));render();return true;
   },
   setRole(role){this.role=role;['take','clear','blackout','audience','stage'].forEach(id=>$(id).disabled=role==='editor'||(id==='take'&&!current()));}
 };
 persist();render();
}
window.addEventListener('storage',e=>{if(e.key===LIVE){const o=read(LIVE,null);if(safeOutput(o)){output=o;renderOutput();if(!mode&&window.worshipWorkspace)window.worshipWorkspace.setRole(window.worshipWorkspace.role)}}});
