import {app,BrowserWindow,ipcMain,dialog,shell,screen,clipboard,Menu,safeStorage} from 'electron';
import {signIn as googleSignIn,createTokens,createDrive,createGoogleApi} from './google.mjs';
import {readFileSync,writeFileSync,existsSync,renameSync,mkdirSync,rmSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDeviceStore,sharedOrigin} from './storage.mjs';
import {createDesktopHost} from './host.mjs';
import {createStreamServer,streamState} from './stream.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
// Keep the original "Worship UI" data folder in AppData so existing services survive the rename.
app.setPath('userData',path.join(app.getPath('appData'),'Worship UI'));
app.setName('WorshipUI');
if(process.platform==='win32')app.setAppUserModelId('com.worshipui.church');
const single=app.requestSingleInstanceLock();
if(!single)app.quit();
else {
 let main,host,store,settingsFile,settings={origin:''},closing=false;
 const windows=new Set();
 const preferences={preload:path.join(here,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true};
 const trusted=event=>!!host&&windows.has(BrowserWindow.fromWebContents(event.sender))&&event.senderFrame?.url.startsWith(host.origin+'/');
 app.on('second-instance',()=>{if(main){if(main.isMinimized())main.restore();main.show();main.focus()}});
 app.whenReady().then(async()=>{
  settingsFile=path.join(app.getPath('userData'),'connection.json');
  if(existsSync(settingsFile))settings={origin:sharedOrigin(JSON.parse(readFileSync(settingsFile,'utf8')).origin||'')};
  store=openDeviceStore(path.join(app.getPath('userData'),'workspace'));
  host=await createDesktopHost(root,settings.origin);
  // Home sync with Google. The church's Google Cloud OAuth client (desktop/google-client.json, see GOOGLE-SETUP.md)
  // enables it; the saved sign-in is encrypted with the operating system's protection (safeStorage).
  const googleClient=(()=>{try{const c=JSON.parse(readFileSync(path.join(here,'google-client.json'),'utf8'));return typeof c.client_id==='string'&&c.client_id?c:null}catch{return null}})();
  const googleFile=path.join(app.getPath('userData'),'google-signin.json');
  let googleEmail='';
  function useGoogle(refreshToken,email,initial=null){
   googleEmail=email;host.setLocalApi(createGoogleApi(createDrive(createTokens(googleClient,refreshToken,{initial})),email));
  }
  if(googleClient&&existsSync(googleFile)&&safeStorage.isEncryptionAvailable()){
   try{const saved=JSON.parse(readFileSync(googleFile,'utf8'));useGoogle(safeStorage.decryptString(Buffer.from(saved.token,'base64')),saved.email)}catch{}
  }
  ipcMain.handle('wui:google-status',event=>{if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');return {configured:!!googleClient,email:googleEmail}});
  ipcMain.handle('wui:google-signin',async event=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   if(!googleClient)throw Error('Google sign-in is not set up in this copy of WorshipUI yet. See GOOGLE-SETUP.md.');
   if(!safeStorage.isEncryptionAvailable())throw Error('This computer cannot store the Google sign-in securely.');
   const result=await googleSignIn(googleClient,url=>shell.openExternal(url));
   writeFileSync(googleFile,JSON.stringify({email:result.email,token:safeStorage.encryptString(result.refreshToken).toString('base64')}),{mode:0o600});
   useGoogle(result.refreshToken,result.email,result);main.focus();
   return {email:result.email};
  });
  ipcMain.handle('wui:google-signout',event=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   rmSync(googleFile,{force:true});googleEmail='';host.setLocalApi(null);
  });
  // Livestream overlay for OBS, fed from the live slide, the stream settings and the CCLI numbers.
  const stored=key=>{try{return JSON.parse(store.getItem(key)||'null')}catch{return null}};
  let stream=null,streamError='',streamKey='';
  const overlayFont=readFileSync(path.join(root,'assets','fonts','Inter.ttf'));
  // (Re)start the overlay server; it listens on the network only when "Allow OBS on another computer" is on.
  async function startStream(){
   const settings=stored('worshipui.stream.v1'),key=settings?.network&&settings.networkKey?settings.networkKey:'';
   if(stream&&key===streamKey)return;
   stream?.close();stream=null;streamKey=key;
   try{stream=await createStreamServer(()=>streamState(stored('worshipui.live.v1'),stored('worshipui.stream.v1'),stored('worshipui.ccli.v1')),{font:overlayFont,networkKey:key});streamError=''}
   catch(error){streamError=error.message}
  }
  await startStream();
  app.on('before-quit',()=>stream?.close());
  // Copies the overlay address: this computer's, or (index ≥ 0) one of the network addresses.
  ipcMain.handle('wui:copy-stream-url',(event,which=-1)=>{if(!trusted(event)||event.sender!==main.webContents||!stream)throw Error('Untrusted window');clipboard.writeText(which>=0?stream.networkUrls[which]||stream.url:stream.url)});
  ipcMain.handle('wui:stream-info',async event=>{if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');await startStream();return stream?{url:stream.url,networkUrls:stream.networkUrls}:{error:streamError}});
  ipcMain.on('wui:read',(event,key)=>{try{if(!trusted(event))throw Error('Untrusted window');event.returnValue={value:store.getItem(key)}}catch{event.returnValue={error:'Unable to read local workspace'}}});
  ipcMain.on('wui:write',(event,key,value)=>{
   try{if(!trusted(event)||event.sender!==main.webContents)throw Error('Read-only display');store.setItem(key,value);event.returnValue={ok:true};if(['worshipui.live.v1','worshipui.stream.v1','worshipui.ccli.v1'].includes(key))stream?.update();for(const window of windows)if(!window.isDestroyed()&&window.webContents!==event.sender)window.webContents.send('wui:storage',{key,value})}
   catch{event.returnValue={error:'Unable to save local workspace. Use Back up.'}}
  });
  ipcMain.on('wui:connection',(event)=>{event.returnValue=trusted(event)?{origin:settings.origin}:{} });
  const songDirectory=()=>{const directory=path.join(app.getPath('userData'),'songs');mkdirSync(directory,{recursive:true});return directory};
  ipcMain.handle('wui:archive-song',(event,name,text)=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   if(typeof name!=='string'||typeof text!=='string'||Buffer.byteLength(text)>5_000_000||!/\.(txt|pro|chopro|chordpro|xml|csv)$/i.test(name))throw Error('Invalid song file.');
   const originalExtension=path.extname(name),extension=originalExtension.toLowerCase();
   const stem=path.basename(name,originalExtension).replace(/[^a-zA-Z0-9._ -]/g,'_').replace(/^\.+/,'').slice(0,90);
   if(!stem)throw Error('Invalid song file name.');
   writeFileSync(path.join(songDirectory(),stem+'-'+randomUUID()+extension),text,{encoding:'utf8',mode:0o600,flag:'wx'});
  });
  // Opens only bible.com passage links (built by WorshipBible.youVersionUrl) in the system browser.
  ipcMain.handle('wui:open-youversion',async(event,url)=>{
   if(!trusted(event))throw Error('Untrusted window');
   if(typeof url!=='string'||!/^https:\/\/www\.bible\.com\/bible\/[0-9]{1,5}\/[1-3A-Z]{3}\.[0-9]{1,3}\.[0-9]{1,3}(?:-[0-9]{1,3})?\.[A-Z0-9]{2,10}$/.test(url))throw Error('Unsupported YouVersion link');
   await shell.openExternal(url);
  });
  // Scripture from YouVersion: load the bible.com chapter in a hidden window (own browsing session, no preload,
  // bible.com only), read the verses on the page, then close it. One page load per request from the operator.
  const bibleUrl=/^https:\/\/www\.bible\.com\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?bible\/[0-9]{1,5}\/[1-3A-Z]{3}\.[0-9]{1,3}(?:\.[0-9]{1,3}(?:-[0-9]{1,3})?)?\.[A-Za-z0-9-]{2,12}$/i;
  // Each verse is an element with data-usfm="JHN.3.16"; its text is in "*_content" parts, footnotes in "*_note".
  const readVerses=`(()=>{const out={};for(const verse of document.querySelectorAll('[data-usfm]')){const id=verse.getAttribute('data-usfm');if(!/^[1-3A-Z]{3}\\.\\d+\\.\\d+$/.test(id))continue;let text='';for(const part of verse.querySelectorAll('[class$="_content"]')){if(!part.closest('[class$="_note"]'))text+=part.textContent}out[id]=((out[id]||'')+' '+text).replace(/\\s+/g,' ').trim()}return out})()`;
  ipcMain.handle('wui:fetch-bible',async(event,url)=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   if(typeof url!=='string'||!bibleUrl.test(url))throw Error('Unsupported YouVersion link');
   const hidden=new BrowserWindow({show:false,width:1000,height:800,webPreferences:{partition:'persist:bible',sandbox:true,contextIsolation:true,nodeIntegration:false}});
   hidden.webContents.setWindowOpenHandler(()=>({action:'deny'}));
   hidden.webContents.on('will-navigate',(navigation,target)=>{if(!/^https:\/\/www\.bible\.com\//.test(target))navigation.preventDefault()});
   const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
   try{
    await Promise.race([hidden.loadURL(url),wait(20000).then(()=>{throw Error('YouVersion did not respond. Check the internet connection and try again.')})]);
    // The page may still be filling in its verses after it loads, so look for them for a few seconds.
    for(let attempt=0;attempt<40;attempt++){
     const verses=await hidden.webContents.executeJavaScript(readVerses);
     const clean={};for(const [id,text] of Object.entries(verses||{}))if(typeof text==='string'&&text&&Object.keys(clean).length<500)clean[id]=text.slice(0,5000);
     if(Object.keys(clean).length)return {url:hidden.webContents.getURL(),verses:clean};
     await wait(250);
    }
    throw Error('No verses were found for that passage on YouVersion. Check the translation and try again.');
   }finally{if(!hidden.isDestroyed())hidden.destroy()}
  });
  // Licensed Bible versions the church adds in Settings: stored only on this computer (app data "bibles" folder),
  // never in services, sync or exports. bibles.json lists them; each text is a verse-per-line file.
  await import('../bible-search.js');
  const bibleDirectory=()=>{const directory=path.join(app.getPath('userData'),'bibles');mkdirSync(directory,{recursive:true});return directory};
  const bibleIndexFile=()=>path.join(bibleDirectory(),'bibles.json');
  const readBibleIndex=()=>{try{const list=JSON.parse(readFileSync(bibleIndexFile(),'utf8'));return Array.isArray(list)?list:[]}catch{return []}};
  const writeBibleIndex=list=>{writeFileSync(bibleIndexFile()+'.tmp',JSON.stringify(list),{mode:0o600});renameSync(bibleIndexFile()+'.tmp',bibleIndexFile())};
  const validBibleId=id=>typeof id==='string'&&/^[A-Z0-9]{2,12}$/.test(id)&&!globalThis.WorshipBible.versions.some(v=>v.id===id);
  const mainOnly=event=>{if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window')};
  ipcMain.handle('wui:list-bibles',event=>{mainOnly(event);return readBibleIndex()});
  ipcMain.handle('wui:read-bible',(event,id)=>{
   mainOnly(event);if(!readBibleIndex().some(v=>v.id===id))throw Error('That Bible version is not on this computer.');
   return readFileSync(path.join(bibleDirectory(),id+'.vpl.txt'),'utf8');
  });
  ipcMain.handle('wui:save-bible',(event,version,source)=>{
   mainOnly(event);
   if(!version||!validBibleId(version.id))throw Error('Use 2–12 capital letters or numbers for the abbreviation, different from KJV, WEB and RVR1909.');
   if(typeof version.name!=='string'||!version.name.trim()||version.name.length>80)throw Error('Enter the version name (up to 80 characters).');
   if(!/^[a-z]{2}$/.test(version.language))throw Error('Choose the version language.');
   if(typeof source!=='string'||source.length>20_000_000)throw Error('Choose a Bible text file under 20 MB.');
   const lines=globalThis.WorshipBible.toVerseLines(source);globalThis.WorshipBible.parse(lines);
   writeFileSync(path.join(bibleDirectory(),version.id+'.vpl.txt'),lines,{encoding:'utf8',mode:0o600});
   const entry={id:version.id,name:version.name.trim(),language:version.language};
   writeBibleIndex([...readBibleIndex().filter(v=>v.id!==entry.id),entry]);
   return entry;
  });
  ipcMain.handle('wui:delete-bible',(event,id)=>{
   mainOnly(event);if(!validBibleId(id))throw Error('Unknown Bible version.');
   writeBibleIndex(readBibleIndex().filter(v=>v.id!==id));
   rmSync(path.join(bibleDirectory(),id+'.vpl.txt'),{force:true});
  });
  // Clipboard text for the YouVersion step (the page asks only while that step is active).
  ipcMain.handle('wui:read-clipboard',async event=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   // readText may return a promise in newer Electron versions, so await it and coerce to text.
   const text=await clipboard.readText();
   return String(text??'').slice(0,100000);
  });
  ipcMain.handle('wui:open-song-folder',async event=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   const error=await shell.openPath(songDirectory());if(error)throw Error('Could not open the song folder: '+error);
  });
  ipcMain.handle('wui:configure',(event,value)=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   const meta=JSON.parse(store.getItem('worshipui.sync.v1')||'{}');if(meta.live)throw Error('Leave Live mode before changing the shared server.');
   const origin=sharedOrigin(value);
   const savedLibrary=store.getItem('worshipui.setlists.v1');
   if(savedLibrary){
    const library=JSON.parse(savedLibrary);
    for(const entry of Object.values(library.entries)){entry.baseRevision=0;entry.baseService=null}
    store.setItem('worshipui.setlists.v1',JSON.stringify(library));
   }
   writeFileSync(settingsFile+'.tmp',JSON.stringify({origin}),{mode:0o600});renameSync(settingsFile+'.tmp',settingsFile);
   host.setRemote(origin);settings={origin};
   store.setItem('worshipui.sync.v1',JSON.stringify({baseRevision:0,baseService:null,live:false,role:'operator'}));
   return {origin};
  });
  // Output screen setup: list displays, move an Audience/Stage window onto a display in fullscreen, and identify displays.
  const outputs=new Map();
  const displayList=()=>{const primary=screen.getPrimaryDisplay().id;return screen.getAllDisplays().map((display,index)=>({id:display.id,number:index+1,width:Math.round(display.size.width*display.scaleFactor),height:Math.round(display.size.height*display.scaleFactor),primary:display.id===primary,label:display.label||'',bounds:display.bounds}))};
  // Tell the workspace when a projector or monitor is connected, removed or rearranged.
  const displaysChanged=()=>{if(main&&!main.isDestroyed())main.webContents.send('wui:displays-changed',displayList())};
  screen.on('display-added',displaysChanged);screen.on('display-removed',displaysChanged);screen.on('display-metrics-changed',displaysChanged);
  ipcMain.handle('wui:displays',event=>{if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');return displayList()});
  ipcMain.handle('wui:place-output',(event,view,screenNumber,displayId)=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   const display=screen.getAllDisplays().find(d=>d.id===displayId);if(!display)throw Error('That display is not connected.');
   const target=[...outputs].find(([window,output])=>!window.isDestroyed()&&output.view===view&&(view!=='audience'||output.screen===screenNumber));
   if(!target)throw Error('Open the window first.');
   const window=target[0];window.setFullScreen(false);window.setBounds(display.bounds);window.setFullScreen(true);
  });
  ipcMain.handle('wui:identify-displays',event=>{
   if(!trusted(event)||event.sender!==main.webContents)throw Error('Untrusted window');
   displayList().forEach(info=>{
    const bounds=screen.getAllDisplays().find(d=>d.id===info.id).bounds,width=420,height=260;
    const badge=new BrowserWindow({x:Math.round(bounds.x+(bounds.width-width)/2),y:Math.round(bounds.y+(bounds.height-height)/2),width,height,frame:false,alwaysOnTop:true,skipTaskbar:true,focusable:false,resizable:false,backgroundColor:'#101217',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
    const html='<body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#101217;color:#fff;font-family:Segoe UI,sans-serif"><div style="font-size:150px;font-weight:700;line-height:1">'+info.number+'</div><div style="font-size:20px;color:#a5b5ce">'+info.width+' × '+info.height+(info.primary?' · main':'')+'</div></body>';
    badge.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));
    setTimeout(()=>{if(!badge.isDestroyed())badge.destroy()},3000);
   });
  });
  function protect(window){
   windows.add(window);window.on('closed',()=>windows.delete(window));
   window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(host.origin+'/'))event.preventDefault()});
   window.webContents.on('will-attach-webview',event=>event.preventDefault());
   window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  }
  // macOS needs an application menu for Cmd+C/V/X/A, Cmd+Q and window shortcuts; Windows keeps the menu bar hidden.
  if(process.platform==='darwin')Menu.setApplicationMenu(Menu.buildFromTemplate([{role:'appMenu'},{role:'editMenu'},{role:'windowMenu'}]));
  main=new BrowserWindow({title:'WorshipUI — Church workspace',width:1440,height:950,minWidth:800,minHeight:600,backgroundColor:'#101217',webPreferences:preferences});
  main.setMenuBarVisibility(false);protect(main);
  main.webContents.setWindowOpenHandler(({url})=>{
   const target=new URL(url);
   // Links in Settings to SongSelect and Bible licensing/provider sites open in the system browser; nothing else does.
   const externalHosts=['songselect.ccli.com','docs.api.bible','api.bible','api.esv.org','ebible.org','www.biblica.com','www.crossway.org','www.tyndale.com','www.harpercollinschristian.com','www.lockman.org'];
   // The overlay preview opens in the system browser too.
   if(stream&&target.href===stream.url){shell.openExternal(target.href).catch(()=>{});return {action:'deny'}}
   if(target.protocol==='https:'&&externalHosts.includes(target.hostname)){shell.openExternal(target.href).catch(error=>dialog.showErrorBox('Unable to open the link',error.message));return {action:'deny'}}
   if(target.origin!==host.origin||target.pathname!=='/'||!['audience','stage'].includes(target.searchParams.get('view')))return {action:'deny'};
   return {action:'allow',overrideBrowserWindowOptions:{width:1100,height:720,autoHideMenuBar:true,backgroundColor:'#000000',webPreferences:preferences}};
  });
  main.webContents.on('did-create-window',(window,details)=>{
   protect(window);window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
   const url=new URL(details.url);outputs.set(window,{view:url.searchParams.get('view'),screen:url.searchParams.get('screen')||'1'});
   window.on('closed',()=>outputs.delete(window));
  });
  main.on('close',event=>{
   const live=JSON.parse(store.getItem('worshipui.sync.v1')||'{}').live;
   if(live&&!closing){const choice=dialog.showMessageBoxSync(main,{type:'question',buttons:['Keep presenting','Close app and displays'],defaultId:0,cancelId:0,message:'Live mode is active. Close WorshipUI and its audience screens?'});if(choice===0){event.preventDefault();return}}
   closing=true;for(const window of windows)if(window!==main)window.destroy();
  });
  await main.loadURL(host.origin+'/');
 }).catch(error=>{dialog.showErrorBox('WorshipUI could not start',error.message);app.quit()});
 app.on('window-all-closed',()=>{host?.server.close();app.quit()});
}
