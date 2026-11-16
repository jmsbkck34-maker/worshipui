(function(root){
  const bundledFonts={'Inter':'Inter','Montserrat':'Montserrat','Lato':'Lato','Merriweather':'Merriweather','Playfair Display':'PlayfairDisplay','Oswald':'Oswald','Poppins':'Poppins','Source Sans 3':'SourceSans3'};
 const fonts=[...Object.keys(bundledFonts),'Segoe UI','Arial','Arial Black','Calibri','Cambria','Candara','Century Gothic','Comic Sans MS','Consolas','Constantia','Corbel','Courier New','Franklin Gothic Medium','Garamond','Georgia','Impact','Palatino Linotype','Tahoma','Times New Roman','Trebuchet MS','Verdana'];
 const motions=[{id:'aurora',name:'Aurora Drift'},{id:'ocean',name:'Ocean Flow'},{id:'glow',name:'Warm Glow'},{id:'clouds',name:'Quiet Clouds'},{id:'stars',name:'Starfield'},{id:'rays',name:'Light Rays'}];
 const defaults={backgroundType:'preset',color:'#28334f',image:'',font:'Segoe UI',fontSize:80,motion:'aurora',motionPaused:false};
 function validTemplate(value){
  if(value===undefined)return true;
  return value&&typeof value==='object'&&!Array.isArray(value)&&
   ['preset','color','image','motion'].includes(value.backgroundType)&&/^#[0-9a-f]{6}$/i.test(value.color)&&
   typeof value.image==='string'&&(value.image===''||(/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(value.image)&&value.image.length<=1400000))&&
   (value.backgroundType!=='image'||value.image!=='')&&fonts.includes(value.font)&&
   (value.motion===undefined||motions.some(m=>m.id===value.motion))&&(value.motionPaused===undefined||typeof value.motionPaused==='boolean')&&Number.isInteger(value.fontSize)&&value.fontSize>=24&&value.fontSize<=200&&
   // Optional text box position: centre point and width as percentages of the slide.
   inRange(value.textX,0,100)&&inRange(value.textY,0,100)&&inRange(value.textWidth,20,100);
 }
 function inRange(number,min,max){return number===undefined||Number.isInteger(number)&&number>=min&&number<=max}
 function textPosition(template){
  const value=normalize(template);
  return value.textX===undefined&&value.textY===undefined&&value.textWidth===undefined?null:{x:value.textX??50,y:value.textY??50,width:value.textWidth??90};
 }
 function normalize(value){return validTemplate(value)&&value?{...defaults,...value}:{...defaults}}
 // Church branding shared across computers: name, address, logo, and whether the logo shows during blackout.
 const emptyBranding={name:'',address:'',logo:'',showOnBlackout:true};
 const brandingKeys=Object.keys(emptyBranding);
 function validBranding(value){
  return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===brandingKeys.length&&brandingKeys.every(key=>Object.hasOwn(value,key))&&
   typeof value.name==='string'&&value.name.length<=100&&typeof value.address==='string'&&value.address.length<=300&&
   typeof value.logo==='string'&&(value.logo===''||(/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(value.logo)&&value.logo.length<=1400000))&&
   typeof value.showOnBlackout==='boolean';
 }
 // Local record: current branding plus the last shared revision it was based on.
 function validBrandingRecord(value){
  return !!value&&value.version===1&&validBranding(value.branding)&&Number.isInteger(value.baseRevision)&&value.baseRevision>=0&&(value.baseBranding===null||validBranding(value.baseBranding));
 }
 const api={fonts,bundledFonts,motions,defaults,validTemplate,normalize,textPosition,emptyBranding,validBranding,validBrandingRecord};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SlideTemplate=api;
})(globalThis);
