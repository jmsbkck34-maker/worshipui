import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {validService} from '../server.mjs';
const KEYS=new Set(['worshipui.service.v1','worshipui.sync.v1','worshipui.recovery.v1']);
export function openDeviceStore(directory){
 mkdirSync(directory,{recursive:true});
 const file=path.join(directory,'device.json');
 let values={};
 if(existsSync(file)){
  try{values=JSON.parse(readFileSync(file,'utf8'))}
  catch{throw Error('The saved workspace could not be read. Your files have been kept. Restore device.previous.json or an exported backup before continuing.')}
 }
 const memory=new Map();
 return {
  getItem(key){if(key==='worshipui.live.v1')return memory.get(key)||null;return Object.hasOwn(values,key)?values[key]:null},
  setItem(key,value){
   if(typeof value!=='string'||Buffer.byteLength(value)>10_000_000)throw Error('Invalid or oversized local data');
   if(key==='worshipui.live.v1'){JSON.parse(value);memory.set(key,value);return}
   if(!KEYS.has(key))throw Error('Unknown workspace key');
   const parsed=JSON.parse(value);
   if(key==='worshipui.service.v1'&&!validService(parsed))throw Error('Invalid service');
   const next={...values,[key]:value};
   const encoded=JSON.stringify(next);
   if(Buffer.byteLength(encoded)>60_000_000)throw Error('Workspace storage limit reached. Export a backup.');
   writeFileSync(file+'.tmp',encoded,{mode:0o600});
   if(existsSync(file)){
    writeFileSync(path.join(directory,'device.previous.json.tmp'),readFileSync(file),{mode:0o600});
    renameSync(path.join(directory,'device.previous.json.tmp'),path.join(directory,'device.previous.json'));
   }
   renameSync(file+'.tmp',file);values=next;
  }
 };
}
export function sharedOrigin(input){
 if(input==='')return '';
 const url=new URL(input);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw Error('Use the HTTPS address only, without a path, password, or query.');
 return url.origin;
}
