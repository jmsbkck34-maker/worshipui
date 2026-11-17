// PowerPoint import (Windows with PowerPoint installed): PowerPoint itself saves each slide as a PNG, 1920 pixels
// wide with the deck's own shape. Paths reach PowerShell through environment variables, never through the command.
import {execFile} from 'node:child_process';
import {mkdtempSync,readdirSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const script=`
$ErrorActionPreference='Stop'
try{$ppt=New-Object -ComObject PowerPoint.Application}catch{Write-Output 'ERROR:NOPOWERPOINT';exit 0}
$pres=$ppt.Presentations.Open($env:WUI_PPT_IN,-1,0,0)
try{
 $width=1920;$height=[int][math]::Round(1920*$pres.PageSetup.SlideHeight/$pres.PageSetup.SlideWidth)
 $animated=0;$n=0
 foreach($slide in $pres.Slides){
  $n++
  if($slide.SlideShowTransition.Hidden){continue}
  if($slide.TimeLine.MainSequence.Count -gt 0){$animated++}
  $slide.Export((Join-Path $env:WUI_PPT_OUT ('slide-{0:D4}.png' -f $n)),'PNG',$width,$height)
 }
 Write-Output ('OK:'+$animated)
}finally{$pres.Close();if($ppt.Presentations.Count -eq 0){$ppt.Quit()}}
`;

// Returns {files:[absolute PNG paths in slide order], animated:number of slides with animations, folder:temporary folder}.
export function convertPowerPoint(file,{timeout=300000}={}){
 const folder=mkdtempSync(path.join(os.tmpdir(),'worshipui-ppt-'));
 return new Promise((resolve,reject)=>{
  execFile('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command',script],{env:{...process.env,WUI_PPT_IN:file,WUI_PPT_OUT:folder},timeout,windowsHide:true},(error,stdout)=>{
   const output=String(stdout||'').trim().split(/\r?\n/).pop()||'';
   if(output==='ERROR:NOPOWERPOINT'){rmSync(folder,{recursive:true,force:true});return reject(Error('PowerPoint is not installed on this computer. In PowerPoint or Google Slides, save the slides as pictures and add them with Add images or videos.'))}
   if(error||!output.startsWith('OK:')){rmSync(folder,{recursive:true,force:true});return reject(Error('PowerPoint could not open that file. Check that it opens in PowerPoint, then try again.'))}
   const files=readdirSync(folder).filter(name=>/^slide-\d{4}\.png$/.test(name)).sort().map(name=>path.join(folder,name));
   resolve({files,animated:Number(output.slice(3))||0,folder});
  });
 });
}
