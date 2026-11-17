/* Shared-service controller. Projection state stays on the church browser. */
(function() {
 if(new URLSearchParams(location.search).has('view'))return;
 const $=id=>document.getElementById(id), core=WorshipSyncCore;
 const META='worshipui.sync.v1', RECOVERY='worshipui.recovery.v1';
 let meta;try{meta=JSON.parse(workspaceStorage.getItem(META))}catch{}
 if(!meta||!Number.isInteger(meta.baseRevision))meta={baseRevision:0,baseService:null,live:false};
 let identity=null,connected=false,busy=false,pending=null,timer,historyVersion=null,reviewed=null;
 const bridge=window.worshipWorkspace;
 const initialEntry=bridge.getDateEntry(bridge.getDate());
 if(initialEntry){meta.baseRevision=initialEntry.baseRevision;meta.baseService=initialEntry.baseService}
 const serviceUrl=date=>date?'/api/setlists/'+date:'/api/service';
 const historyUrl=date=>date?'/api/setlists/'+date+'/versions':'/api/versions';
 const panel=document.createElement('section');panel.className='sync-panel';
 panel.innerHTML='<div class="sync-heading"><div><strong>Shared service</strong><p id="syncStatus" role="status">Local only · connect to share</p></div><button id="connect">Connect</button></div><div class="sync-buttons"><button id="liveMode" aria-pressed="false">Enter Live mode</button><button id="publish" disabled>Publish changes</button><button id="reviewUpdate" hidden>Review update</button><button id="history" disabled>Version history</button><button id="recovery">Download recovery</button></div><p id="offlineStatus">Preparing offline app…</p><p id="syncIdentity"></p>';
 document.querySelector('aside').append(panel);
 const dialog=document.createElement('dialog');dialog.id='syncDialog';
 dialog.innerHTML='<form id="loginForm"><div class="eyebrow">CONNECT YOUR TEAM</div><h2>Same service. Wherever you prepare.</h2><p>Sign in to the same WorshipUI address at home and at church. Your local copy remains available offline.</p><label>Username<input id="syncUsername" autocomplete="username" required></label><label>Password<input id="syncPassword" type="password" autocomplete="current-password" required></label><p id="loginError" role="alert"></p><div class="dialog-actions"><button id="closeLogin" type="button">Cancel</button><button class="primary" type="submit">Sign in</button></div></form>';
 document.body.append(dialog);
 const review=document.createElement('dialog');review.id='reviewDialog';
 review.innerHTML='<div class="eyebrow">REVIEW BEFORE APPLYING</div><h2 id="reviewTitle">Service update</h2><p id="reviewMeta"></p><ul id="changeList"></ul><div class="revision-comparison"><section><h3>Your local copy</h3><pre id="localText"></pre></section><section><h3>Shared version</h3><pre id="remoteText"></pre></section></div><p>Your current projection stays unchanged. A recovery copy is saved before replacing your local service.</p><div class="dialog-actions"><button id="later">Later</button><button id="keepLocal">Keep local & publish</button><button class="primary" id="acceptRemote">Use shared version</button></div>';
 document.body.append(review);
 const history=document.createElement('dialog');history.id='historyDialog';
 history.innerHTML='<div class="eyebrow">VERSION HISTORY</div><h2>Earlier services</h2><p>Restore into your local workspace, then publish as a new revision. Existing history is preserved.</p><div id="versionList"></div><button id="closeHistory">Close</button>';
 document.body.append(history);
 function saveMeta(){
   try{
     const date=bridge.getDate(),entry=bridge.getDateEntry(date);
     if(entry&&!bridge.setDateEntry(date,{...entry,baseRevision:meta.baseRevision,baseService:structuredClone(meta.baseService)}))throw Error('Setlist metadata could not be saved');
     workspaceStorage.setItem(META,JSON.stringify(meta));return true;
   }catch{status('Sync paused: device storage is full. Export a backup.');return false}
 }
 function dirty(){return !meta.baseService||!core.same(bridge.getService(),meta.baseService)}
 function status(text){$('syncStatus').textContent=text}
 function label(){
   $('liveMode').textContent=meta.live?'Live mode · updates held':'Enter Live mode';
   $('liveMode').setAttribute('aria-pressed',String(!!meta.live));
   $('liveMode').disabled=meta.role==='editor';
   $('publish').disabled=!identity||busy||!!pending||!dirty();
   $('reviewUpdate').hidden=!pending;
   $('history').disabled=!identity||busy;
   $('connect').textContent=identity?'Sign out':'Connect';
   $('syncIdentity').textContent=identity?identity.username+' · '+identity.role:(meta.username?'Offline copy · '+meta.username:'');
   $('dateStatus').textContent=bridge.getDate()?'Setlist: '+bridge.getDate():'Undated service';
   renderSetlists();
   bridge.setRole(meta.role||'operator');
 }
 // Saved dated setlists under the calendar, newest first: click to open, × to delete (not the open one).
 function renderSetlists(){
   const entries=bridge.getDateEntries(),active=bridge.getDate(),list=$('savedSetlists');
   const dates=Object.keys(entries).filter(date=>date!=='undated').sort().reverse();
   const locale=window.WorshipI18n?.language()==='es'?'es':'en';
   list.replaceChildren();
   dates.forEach(date=>{
     const row=document.createElement('div');row.className='setlist-row'+(date===active?' active':'');
     const open=document.createElement('button');open.type='button';open.className='setlist-open';
     const day=new Date(date+'T12:00:00').toLocaleDateString(locale,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
     const name=document.createElement('strong');name.textContent=day;
     const title=document.createElement('small');title.textContent=entries[date].service.title||'';
     open.append(name,title);open.title=date;open.disabled=date===active;open.onclick=()=>openDate(date,false);
     row.append(open);
     if(date!==active){
       const remove=document.createElement('button');remove.type='button';remove.className='setlist-delete';remove.textContent='×';
       remove.setAttribute('aria-label','Delete setlist '+date);remove.title='Delete setlist '+date;
       remove.onclick=()=>{
         if(busy){status('Wait for the current sync to finish before changing dates.');return}
         if(!confirm('Delete the setlist for '+day+' from this computer? A recovery copy is kept (Download recovery), and a copy already shared to the server stays there.'))return;
         if(bridge.deleteDate(date)){status('Setlist '+date+' deleted from this computer');label()}
       };
       row.append(remove);
     }
     list.append(row);
   });
 }
 window.addEventListener('worship:language',()=>renderSetlists());
 async function api(url,options={}){
   const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...options.headers},cache:'no-store',signal:AbortSignal.timeout(10000)});
   let body;try{body=await response.json()}catch{throw Error('Shared server unavailable. Local service is ready.')}
   if(response.status===401){identity=null;connected=false;label();}
   if(!response.ok){const error=Error(body.error||'Sync request failed');error.status=response.status;error.body=body;throw error}
   connected=true;return body;
 }
 function backup(){
   try{let versions=JSON.parse(workspaceStorage.getItem(RECOVERY)||'[]');versions.push({at:new Date().toISOString(),service:bridge.getService()});workspaceStorage.setItem(RECOVERY,JSON.stringify(versions.slice(-5)));return true}
   catch{status('Cannot save recovery copy. Export your local service before applying.');return false}
 }
 function apply(version){
   if(!bridge.valid(version.service)||!backup())return false;
   const oldService=bridge.getService(),oldMeta=structuredClone(meta);
   if(!bridge.replace(version.service)){status('Cannot save update on this device. Export a backup.');return false}
   meta.baseRevision=version.revision;meta.baseService=structuredClone(version.service);
   if(!saveMeta()){meta=oldMeta;bridge.replace(oldService);return false}
   pending=null;status('All changes downloaded · revision '+version.revision);label();return true;
 }
 function receive(version){
   if(!version)return;
   if(!bridge.valid(version.service)||!Number.isInteger(version.revision)){status('Server sent an invalid service. Local copy preserved.');return}
   const decision=core.receive({baseRevision:meta.baseRevision,local:bridge.getService(),dirty:dirty(),live:meta.live,editing:bridge.editing()},version);
   if(decision==='ignore')return;
   if(decision==='acknowledge'){
     const old=structuredClone(meta);meta.baseRevision=version.revision;meta.baseService=structuredClone(version.service);
     if(!saveMeta()){meta=old;return}pending=null;status('All changes downloaded · revision '+version.revision);
   }else if(decision==='apply'){apply(version)}else{
     pending=version;status(decision==='conflict'?'Both copies changed · review to resolve':'Update waiting · review when ready');
   }
   label();
 }
 async function publish(){
   if(!identity||busy||pending||!dirty())return;
   const snapshot=bridge.getService();busy=true;label();status('Publishing changes…');
   try{
     const result=await api(serviceUrl(bridge.getDate()),{method:'PUT',body:JSON.stringify({baseRevision:meta.baseRevision,service:snapshot})});
     const old=structuredClone(meta);meta.baseRevision=result.version.revision;meta.baseService=structuredClone(snapshot);
     if(!saveMeta()){meta=old;return}
     status(dirty()?'New local edits waiting to publish':'Shared copy saved · revision '+meta.baseRevision);
   }catch(error){
     if(error.status===409 && error.body.current){pending=error.body.current;status('Another editor saved first · both copies preserved');}
     else status(error.message||'Offline · local changes waiting to publish');
   }finally{busy=false;label()}
 }
 async function sync(){
   if(busy||!identity)return;
   busy=true;label();
   try{
     const result=await api(serviceUrl(bridge.getDate()));
     receive(result.version);
     if(!pending&&!dirty())status('All changes downloaded · revision '+meta.baseRevision);
   }catch(error){connected=false;status(error.message||'Offline · downloaded service ready')}
   finally{busy=false;label()}
   // Only publish automatically outside Live mode and outside an active edit.
   if(connected&&!pending&&dirty()&&!meta.live&&!bridge.editing())await publish();
   if(connected&&!meta.live&&!bridge.editing())await syncInactive();
   if(connected&&!meta.live)await syncBranding();
 }
 // Branding: download newer shared branding, publish local changes, and hand conflicts to Settings.
 let brandingBusy=false;
 async function syncBranding(){
   if(!identity||meta.live||brandingBusy)return;
   brandingBusy=true;
   try{
     const record=bridge.getBranding(),remote=(await api('/api/branding')).version;
     const empty=SlideTemplate.emptyBranding,localChanged=!core.same(record.branding,record.baseBranding||empty);
     if(remote&&!SlideTemplate.validBranding(remote.branding))return;
     if(remote&&remote.revision!==record.baseRevision){
       if(core.same(record.branding,remote.branding)||!localChanged)bridge.setBranding({version:1,branding:remote.branding,baseRevision:remote.revision,baseBranding:remote.branding});
       else bridge.showBrandingConflict(remote);
       return;
     }
     if(!localChanged)return;
     const snapshot=record.branding;
     try{
       const saved=await api('/api/branding',{method:'PUT',body:JSON.stringify({baseRevision:record.baseRevision,branding:snapshot})});
       bridge.setBranding({...bridge.getBranding(),baseRevision:saved.version.revision,baseBranding:snapshot});
     }catch(error){if(error.status===409&&error.body.current)bridge.showBrandingConflict(error.body.current);else throw error}
   }catch(error){status(error.message||'Offline · branding saved on this device')}
   finally{brandingBusy=false}
 }
 window.addEventListener('worship:branding',()=>syncBranding());
 async function syncInactive(){
   if(busy||!identity)return;
   const active=bridge.getDate()||'undated',entries=bridge.getDateEntries();
   const dates=Object.keys(entries).filter(date=>date!==active&&!core.same(entries[date].service,entries[date].baseService));
   if(!dates.length)return;
   busy=true;label();
   try{
     for(const key of dates){
       const entry=entries[key],date=key==='undated'?'':key;
       const result=await api(serviceUrl(date)),remote=result.version;
       if(remote&&core.same(entry.service,remote.service)){
         entry.baseRevision=remote.revision;entry.baseService=structuredClone(remote.service);
       }else if((remote?.revision||0)===entry.baseRevision){
         const saved=await api(serviceUrl(date),{method:'PUT',body:JSON.stringify({baseRevision:entry.baseRevision,service:entry.service})});
         entry.baseRevision=saved.version.revision;entry.baseService=structuredClone(entry.service);
       }else{status('Setlist '+(date||'(undated)')+' has conflicting changes · open it to review');continue}
       if(!bridge.setDateEntry(date,entry))throw Error('Cannot save sync state for '+(date||'the undated service')+'. Export a backup.');
     }
   }catch(error){status(error.message||'Offline · dated setlists are saved on this device')}
   finally{busy=false;label()}
 }
 function readable(service){return service.title+'\n\n'+service.items.map((item,n)=>(n+1)+'. '+item.title+' ['+item.type+']\n'+item.slides.map((text,i)=>'Slide '+(i+1)+'\n'+(item.primaryVersion?item.primaryVersion+'\n':'')+text+(item.secondarySlides?.[i]?'\n\n'+item.secondaryVersion+'\n'+item.secondarySlides[i]:'')).join('\n\n')).join('\n\n────\n\n')}
 function showReview(version,fromHistory=false){
   if(!version)return;
   reviewed=structuredClone(version);historyVersion=fromHistory?version:null;
   $('reviewTitle').textContent=fromHistory?'Restore revision '+version.revision:(dirty()?'Resolve service changes':'Review service update');
   $('reviewMeta').textContent='Revision '+version.revision+' · '+version.author+' · '+new Date(version.savedAt).toLocaleString();
   $('changeList').replaceChildren();core.changed(bridge.getService(),version.service).forEach(change=>{const li=document.createElement('li');li.textContent=change;$('changeList').append(li)});
   $('localText').textContent=readable(bridge.getService());$('remoteText').textContent=readable(version.service);
   $('keepLocal').hidden=fromHistory||!identity;
   $('acceptRemote').textContent=fromHistory?'Restore local copy':'Use shared version';
   review.showModal();
 }
 $('reviewUpdate').onclick=()=>showReview(pending);
 $('later').onclick=()=>{review.close();historyVersion=null};
 $('acceptRemote').onclick=()=>{
   const version=reviewed;if(!version)return;
   if(historyVersion){if(!backup()||!bridge.replace(version.service))return;status('Earlier version restored locally · publish when ready');historyVersion=null;review.close();label();}
   else if(apply(version))review.close();
 };
 $('keepLocal').onclick=async()=>{
   if(!reviewed||!identity||busy||!backup())return;
   // Explicit replacement still uses compare-and-swap; a newer save will conflict again.
   const old=structuredClone(meta);meta.baseRevision=reviewed.revision;meta.baseService=structuredClone(reviewed.service);
   if(!saveMeta()){meta=old;return}pending=null;review.close();await publish();
 };
 $('liveMode').onclick=()=>{
   if(meta.role==='editor')return;
   meta.live=!meta.live;saveMeta();label();
   status(meta.live?'Live mode · incoming updates require review':'Preparation mode · checking for updates');
   if(!meta.live)sync();
 };
 $('publish').onclick=publish;
 $('connect').onclick=async()=>{
   if(identity){
     try{await api('/api/logout',{method:'POST',body:'{}'});identity=null;connected=false;status('Signed out · downloaded service kept on this computer');label()}
     catch{status('Unable to sign out while offline. Retry when connected.')}
   }else dialog.showModal();
 };
 $('closeLogin').onclick=()=>{dialog.close();$('syncPassword').value=''};
 $('loginForm').onsubmit=async event=>{
   event.preventDefault();$('loginError').textContent='Signing in…';
   try{
     const user=await api('/api/login',{method:'POST',body:JSON.stringify({username:$('syncUsername').value,password:$('syncPassword').value})});
     identity=user;meta.username=user.username;meta.role=user.role;if(user.role==='editor')meta.live=false;saveMeta();label();dialog.close();$('syncPassword').value='';await sync();
   }catch(error){$('loginError').textContent=error.message}
 };
 $('history').onclick=async()=>{
   if(busy)return;busy=true;label();
   try{const url=historyUrl(bridge.getDate()),result=await api(url);$('versionList').replaceChildren();if(!result.versions.length)$('versionList').textContent='No shared versions yet.';
     result.versions.forEach(version=>{const button=document.createElement('button');button.className='version-entry';button.textContent='Revision '+version.revision+' · '+version.title+' · '+version.author+' · '+new Date(version.savedAt).toLocaleString();button.onclick=async()=>{try{const full=await api(url+'/'+version.revision);history.close();showReview(full.version,true)}catch(error){status(error.message)}};$('versionList').append(button)});history.showModal();
   }catch(error){status(error.message)}finally{busy=false;label()}
 };
 $('closeHistory').onclick=()=>history.close();
 function confirmLeave(date,copy){
   if(!copy&&date===bridge.getDate())return true;
   const reasons=[];
   if(bridge.saveFailed())reasons.push('Your latest changes could not be saved on this computer. Use Back up first to keep them.');
   if((identity||meta.username)&&meta.baseService&&dirty())reasons.push('This setlist has changes that are not on the shared server yet. They stay saved here and publish when you are connected.');
   if(pending)reasons.push('A shared update for this setlist is waiting for your review.');
   return !reasons.length||confirm(reasons.join('\n\n')+'\n\nSwitch setlists anyway?');
 }
 function openDate(date,copy){
   if(busy){status('Wait for the current sync to finish before changing dates.');return}
   if(meta.live){status('Leave Live mode before changing setlist dates.');return}
   if(bridge.editing()){status('Finish editing before changing setlist dates.');return}
   // Warn before leaving a setlist whose latest edit failed to save, whose changes are not yet on the shared server,
   // or that has a shared update waiting for review. Local edits are otherwise saved and stay with that date.
   if(!confirmLeave(date,copy))return;
   if(copy&&bridge.getDateEntry(date)&&!confirm('Replace the local setlist for this date with a copy of the current service? The shared version may require review.'))return;
   if(!bridge.openDate(date,copy,meta)){status('Choose a valid date and check device storage.');return}
   const entry=bridge.getDateEntry(date);meta.baseRevision=entry.baseRevision;meta.baseService=entry.baseService;
   pending=null;reviewed=null;historyVersion=null;saveMeta();label();
   status(date?'Opened setlist '+date+' · checking for shared changes':'Opened undated service · checking for shared changes');
   if(identity)sync();
 }
 $('openDate').onclick=()=>{if(!$('setlistDate').value){status('Choose a setlist date first.');return}openDate($('setlistDate').value,false)};
 $('copyDate').onclick=()=>{if(!$('setlistDate').value){status('Choose a setlist date first.');return}openDate($('setlistDate').value,true)};
 $('openUndated').onclick=()=>openDate('',false);
 window.addEventListener('worship:changed',()=>{
   if(!identity)return;status(pending?'Both copies changed · review to resolve':'Local changes saved · waiting to publish');label();clearTimeout(timer);
   if(!meta.live)timer=setTimeout(sync,1500);
 });
 window.addEventListener('online',()=>reconnect());
 window.addEventListener('offline',()=>{connected=false;status('Offline · downloaded service ready');label()});
 window.addEventListener('beforeunload',event=>{if(identity&&dirty()){event.preventDefault();event.returnValue=''}});
 async function reconnect(){
   if(busy)return;
   if(!identity&&meta.username){
     busy=true;
     try{identity=await api('/api/me');meta.role=identity.role;meta.username=identity.username;saveMeta()}
     catch{status('Offline or signed out · downloaded service ready')}
     finally{busy=false;label()}
   }
   return sync();
 }
 async function start(){
   label();
   if(window.worshipDesktop){
     $('offlineStatus').textContent='Installed app · service saved on this computer';
   }else if('serviceWorker' in navigator){
     try{
       await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;
       const cache=await caches.open('worshipui-shell-v30');const files=['/','/index.html','/app.js','/content-import.js','/bible-search.js','/assets/bibles/kjv.vpl.txt','/assets/bibles/web.vpl.txt','/assets/bibles/rv1909.vpl.txt','/style.css','/sync-core.js','/sync.js','/i18n.js','/desktop-ui.js','/slide-template.cjs','/assets/fonts/Inter.ttf','/assets/fonts/Montserrat.ttf','/assets/fonts/Lato.ttf','/assets/fonts/Merriweather.ttf','/assets/fonts/PlayfairDisplay.ttf','/assets/fonts/Oswald.ttf','/assets/fonts/Poppins.ttf','/assets/fonts/SourceSans3.ttf'];
       const ready=(await Promise.all(files.map(file=>cache.match(file)))).every(Boolean);
       $('offlineStatus').textContent=ready?'✓ App downloaded · text service available offline':'Offline download incomplete · keep this window open';
     }catch{$('offlineStatus').textContent='Offline app download unavailable · keep this window open'}
   }else $('offlineStatus').textContent='Offline reload unavailable in this browser · keep this window open';
   try{identity=await api('/api/me');meta.username=identity.username;meta.role=identity.role;if(identity.role==='editor')meta.live=false;saveMeta();label();await sync()}
   catch{status(meta.baseRevision?'Offline or signed out · downloaded revision '+meta.baseRevision+' ready':'Local only · connect to share');label()}
   setInterval(reconnect,5000);
 }
 start();
})();
