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
   (value.motion===undefined||motions.some(m=>m.id===value.motion))&&(value.motionPaused===undefined||typeof value.motionPaused==='boolean')&&Number.isInteger(value.fontSize)&&value.fontSize>=24&&value.fontSize<=200;
 }
 function normalize(value){return validTemplate(value)&&value?{...defaults,...value}:{...defaults}}
 const api={fonts,bundledFonts,motions,defaults,validTemplate,normalize};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SlideTemplate=api;
})(globalThis);
