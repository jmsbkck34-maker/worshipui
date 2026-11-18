import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
export async function offlineTests(){
 const listeners={},responses=new Map();let fetched=null,checks=0;
 const cache={async addAll(files){files.forEach(file=>responses.set(file,{file}))},async match(key){return responses.get(key)}};
 const context={URL,Promise,self:{location:{origin:'https://worship.test'},addEventListener:(type,fn)=>listeners[type]=fn},caches:{open:async()=>cache,keys:async()=>['worshipui-shell-v1','worshipui-shell-v5','worshipui-shell-v6'],delete:async()=>true},fetch:async()=>{throw Error('Network offline')}};
 vm.runInNewContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),context);
 let installed;listeners.install({waitUntil:promise=>installed=promise});await installed;
 for(const file of ['/','/index.html','/app.js','/content-import.js','/email-requests.js','/bible-search.js','/assets/bibles/kjv.vpl.txt','/assets/bibles/web.vpl.txt','/assets/bibles/rv1909.vpl.txt','/style.css','/sync-core.js','/sync.js','/i18n.js','/desktop-ui.js','/slide-template.cjs','/assets/fonts/Inter.ttf','/assets/fonts/Montserrat.ttf','/assets/fonts/Lato.ttf','/assets/fonts/Merriweather.ttf','/assets/fonts/PlayfairDisplay.ttf','/assets/fonts/Oswald.ttf','/assets/fonts/Poppins.ttf','/assets/fonts/SourceSans3.ttf']){assert.ok(responses.has(file));checks++}
 for(const suffix of ['/','/?view=audience','/?view=stage','/app.js']){
   fetched=null;listeners.fetch({request:{method:'GET',url:'https://worship.test'+suffix},respondWith:promise=>fetched=promise});assert.ok(await fetched);checks++;
 }
 fetched=null;listeners.fetch({request:{method:'GET',url:'https://worship.test/api/service'},respondWith:promise=>fetched=promise});assert.equal(fetched,null);checks++;
 return checks;
}
