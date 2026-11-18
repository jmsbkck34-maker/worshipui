const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('worshipDesktop',{
 getConnection:()=>ipcRenderer.sendSync('wui:connection'),
 configure:origin=>ipcRenderer.invoke('wui:configure',origin),
 archiveSong:(name,text)=>ipcRenderer.invoke('wui:archive-song',name,text),
 openSongFolder:()=>ipcRenderer.invoke('wui:open-song-folder'),
 openYouVersion:url=>ipcRenderer.invoke('wui:open-youversion',url),
 readClipboard:()=>ipcRenderer.invoke('wui:read-clipboard'),
 fetchBible:url=>ipcRenderer.invoke('wui:fetch-bible',url),
 streamInfo:()=>ipcRenderer.invoke('wui:stream-info'),
 edition:process.argv.includes('--wui-edition=english')?'english':'bilingual',
 importMedia:()=>ipcRenderer.invoke('wui:import-media'),
 ...(process.platform==='win32'?{importPowerPoint:()=>ipcRenderer.invoke('wui:import-powerpoint')}:{}),
 setlistFolder:()=>ipcRenderer.invoke('wui:setlist-folder'),
 chooseSetlistFolder:()=>ipcRenderer.invoke('wui:choose-setlist-folder'),
 listSetlistFiles:()=>ipcRenderer.invoke('wui:list-setlist-files'),
 readSetlistFile:name=>ipcRenderer.invoke('wui:read-setlist-file',name),
 saveSetlistFile:(name,text)=>ipcRenderer.invoke('wui:save-setlist-file',name,text),
 googleStatus:()=>ipcRenderer.invoke('wui:google-status'),
 googleSignIn:()=>ipcRenderer.invoke('wui:google-signin'),
 googleSignOut:()=>ipcRenderer.invoke('wui:google-signout'),
 copyStreamUrl:which=>ipcRenderer.invoke('wui:copy-stream-url',which),
 listBibles:()=>ipcRenderer.invoke('wui:list-bibles'),
 readBible:id=>ipcRenderer.invoke('wui:read-bible',id),
 saveBible:(version,text)=>ipcRenderer.invoke('wui:save-bible',version,text),
 deleteBible:id=>ipcRenderer.invoke('wui:delete-bible',id),
 displays:()=>ipcRenderer.invoke('wui:displays'),
 placeOutput:(view,screen,display)=>ipcRenderer.invoke('wui:place-output',view,screen,display),
 identifyDisplays:()=>ipcRenderer.invoke('wui:identify-displays'),
 onDisplaysChanged:callback=>ipcRenderer.on('wui:displays-changed',(_event,displays)=>callback(displays))
});
contextBridge.exposeInMainWorld('worshipStorage',{
 getItem:key=>{const result=ipcRenderer.sendSync('wui:read',key);if(result.error)throw Error(result.error);return result.value},
 setItem:(key,value)=>{const result=ipcRenderer.sendSync('wui:write',key,value);if(result.error)throw Error(result.error)}
});
ipcRenderer.on('wui:storage',(_event,data)=>{
 window.dispatchEvent(new StorageEvent('storage',{key:data.key,newValue:data.value}));
});
