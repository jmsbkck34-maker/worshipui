param([int]$Port=8091)
$taskRuntime=Get-Command node -ErrorAction SilentlyContinue
if($taskRuntime){$taskExecutable=$taskRuntime.Source}
else {
  $taskExecutable=Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe'
  if(!(Test-Path -LiteralPath $taskExecutable)){throw 'Install Node.js 22 or later, then run npm start.'}
  $env:ELECTRON_RUN_AS_NODE='1'
}
$env:PORT=[string]$Port
try{& $taskExecutable (Join-Path $PSScriptRoot 'server-run.mjs')}
finally{if(!$taskRuntime){Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue}}
