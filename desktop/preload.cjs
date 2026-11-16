const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('worshipDesktop',{
 getConnection:()=>ipcRenderer.sendSync('wui:connection'),
 configure:origin=>ipcRenderer.invoke('wui:configure',origin)
});
contextBridge.exposeInMainWorld('worshipStorage',{
 getItem:key=>{const result=ipcRenderer.sendSync('wui:read',key);if(result.error)throw Error(result.error);return result.value},
 setItem:(key,value)=>{const result=ipcRenderer.sendSync('wui:write',key,value);if(result.error)throw Error(result.error)}
});
ipcRenderer.on('wui:storage',(_event,data)=>{
 window.dispatchEvent(new StorageEvent('storage',{key:data.key,newValue:data.value}));
});
