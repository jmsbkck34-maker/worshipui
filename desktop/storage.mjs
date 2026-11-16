import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {validService} from '../server.mjs';
const KEYS=new Set(['worshipui.service.v1','worshipui.sync.v1','worshipui.recovery.v1','worshipui.ccli.v1','worshipui.setlists.v1','worshipui.songs.v1']);
const CCLI_FIELDS=['churchCopyright','streaming','streamingPlus','rehearsal'];
function validCcliSettings(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===CCLI_FIELDS.length&&CCLI_FIELDS.every(key=>typeof value[key]==='string'&&value[key].length<=80)}
function validDate(value){if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value}
function validLibrary(value){
 return value&&value.version===1&&typeof value.active==='string'&&value.entries&&typeof value.entries==='object'&&!Array.isArray(value.entries)&&Object.hasOwn(value.entries,value.active)&&
  Object.entries(value.entries).every(([date,entry])=>(date==='undated'||validDate(date))&&entry&&validService(entry.service)&&Number.isInteger(entry.baseRevision)&&entry.baseRevision>=0&&(entry.baseService===null||validService(entry.baseService)));
}
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
   if(typeof value!=='string'||Buffer.byteLength(value)>(key==='worshipui.setlists.v1'?50_000_000:10_000_000))throw Error('Invalid or oversized local data');
   if(key==='worshipui.live.v1'){JSON.parse(value);memory.set(key,value);return}
   if(!KEYS.has(key))throw Error('Unknown workspace key');
   const parsed=JSON.parse(value);
   if(key==='worshipui.service.v1'&&!validService(parsed))throw Error('Invalid service');
   if(key==='worshipui.ccli.v1'&&!validCcliSettings(parsed))throw Error('Invalid CCLI settings');
   if(key==='worshipui.setlists.v1'&&!validLibrary(parsed))throw Error('Invalid setlist library');
   if(key==='worshipui.songs.v1'&&(!parsed||parsed.version!==1||!Array.isArray(parsed.songs)||parsed.songs.length>10000||new Set(parsed.songs.map(song=>song?.id)).size!==parsed.songs.length||parsed.songs.some(song=>!song||song.type!=='Song'||!validService({title:'',items:[song]}))))throw Error('Invalid song library');
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
