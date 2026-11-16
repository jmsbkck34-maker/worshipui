(function(){
 if(!window.worshipDesktop||new URLSearchParams(location.search).has('view'))return;
 const connection=window.worshipDesktop.getConnection();
 const button=document.createElement('button');button.textContent='Shared server';button.id='desktopSettings';
 document.querySelector('.header-actions').prepend(button);
 const dialog=document.createElement('dialog');
 dialog.innerHTML='<form id="desktopSettingsForm"><div class="eyebrow">CHURCH DESKTOP</div><h2>Connect when you’re ready</h2><p>This installed app and its saved service run on this computer without internet. A shared server lets you receive edits made at home.</p><label>Shared server HTTPS address<input id="serverOrigin" type="url" placeholder="https://worship.example.com"></label><p>Leave blank to use this computer independently. Changing servers keeps your local service and starts a new sync connection. Export a backup first if needed.</p><p id="settingsError" role="alert"></p><div class="dialog-actions"><button type="button" id="cancelSettings">Cancel</button><button class="primary">Save connection</button></div></form>';
 document.body.append(dialog);
 button.onclick=()=>{document.getElementById('serverOrigin').value=connection.origin||'';dialog.showModal()};
 document.getElementById('cancelSettings').onclick=()=>dialog.close();
 document.getElementById('desktopSettingsForm').onsubmit=async event=>{
  event.preventDefault();try{await window.worshipDesktop.configure(document.getElementById('serverOrigin').value.trim());location.reload()}catch(error){document.getElementById('settingsError').textContent=error.message}
 };
})();
