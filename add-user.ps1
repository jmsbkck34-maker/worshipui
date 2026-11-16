param([Parameter(Mandatory=$true)][string]$Username,[ValidateSet('editor','operator')][string]$Role='editor')
# Run on the server while Worship UI is stopped. No password is printed or passed in arguments.
$accountRuntime=Get-Command node -ErrorAction SilentlyContinue
if($accountRuntime){$accountExecutable=$accountRuntime.Source}
else{
 $accountExecutable=Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe'
 if(!(Test-Path -LiteralPath $accountExecutable)){throw 'Install Node.js 22 or later before creating accounts.'}
 $env:ELECTRON_RUN_AS_NODE='1'
}
$accountSecret=Read-Host 'New account password (at least 12 characters)' -AsSecureString
$accountPointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($accountSecret)
try {
 $accountText=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($accountPointer)
 @{username=$Username;password=$accountText;role=$Role} | ConvertTo-Json -Compress | & $accountExecutable (Join-Path $PSScriptRoot 'server-run.mjs') add-user
}finally{
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($accountPointer)
 $accountText=$null
 if(!$accountRuntime){Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue}
}
