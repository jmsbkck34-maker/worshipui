import {app,BrowserWindow,ipcMain,dialog,shell} from 'electron';
import {readFileSync,writeFileSync,existsSync,renameSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDeviceStore,sharedOrigin} from './storage.mjs';
import {createDesktopHost} from './host.mjs';
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
  ipcMain.on('wui:read',(event,key)=>{try{if(!trusted(event))throw Error('Untrusted window');event.returnValue={value:store.getItem(key)}}catch{event.returnValue={error:'Unable to read local workspace'}}});
  ipcMain.on('wui:write',(event,key,value)=>{
   try{if(!trusted(event)||event.sender!==main.webContents)throw Error('Read-only display');store.setItem(key,value);event.returnValue={ok:true};for(const window of windows)if(!window.isDestroyed()&&window.webContents!==event.sender)window.webContents.send('wui:storage',{key,value})}
   catch{event.returnValue={error:'Unable to save local workspace. Export a backup.'}}
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
  function protect(window){
   windows.add(window);window.on('closed',()=>windows.delete(window));
   window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(host.origin+'/'))event.preventDefault()});
   window.webContents.on('will-attach-webview',event=>event.preventDefault());
   window.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  }
  main=new BrowserWindow({title:'WorshipUI — Church workspace',width:1440,height:950,minWidth:800,minHeight:600,backgroundColor:'#101217',webPreferences:preferences});
  main.setMenuBarVisibility(false);protect(main);
  main.webContents.setWindowOpenHandler(({url})=>{
   const target=new URL(url);
   if(target.href==='https://songselect.ccli.com/'){shell.openExternal(target.href).catch(error=>dialog.showErrorBox('Unable to open SongSelect',error.message));return {action:'deny'}}
   if(target.origin!==host.origin||target.pathname!=='/'||!['audience','stage'].includes(target.searchParams.get('view')))return {action:'deny'};
   return {action:'allow',overrideBrowserWindowOptions:{width:1100,height:720,autoHideMenuBar:true,backgroundColor:'#000000',webPreferences:preferences}};
  });
  main.webContents.on('did-create-window',window=>{protect(window);window.webContents.setWindowOpenHandler(()=>({action:'deny'}))});
  main.on('close',event=>{
   const live=JSON.parse(store.getItem('worshipui.sync.v1')||'{}').live;
   if(live&&!closing){const choice=dialog.showMessageBoxSync(main,{type:'question',buttons:['Keep presenting','Close app and displays'],defaultId:0,cancelId:0,message:'Live mode is active. Close WorshipUI and its audience screens?'});if(choice===0){event.preventDefault();return}}
   closing=true;for(const window of windows)if(window!==main)window.destroy();
  });
  await main.loadURL(host.origin+'/');
 }).catch(error=>{dialog.showErrorBox('WorshipUI could not start',error.message);app.quit()});
 app.on('window-all-closed',()=>{host?.server.close();app.quit()});
}
