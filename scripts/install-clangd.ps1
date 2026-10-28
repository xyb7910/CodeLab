# Reproducible standalone clangd 22.1.6 x64 package. Hash from Scoop release manifest.
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$target=Join-Path $root 'toolchain-clangd'
$binary=Join-Path $target 'bin\clangd.exe'
$asset='clangd-windows-22.1.6.zip'
$sha='ce54f16e0b4fd76d450eeda9664420b195360b73febcfe40e661108fa57f2ce1'
$cache=Join-Path $root '.cache-clangd'
$archive=Join-Path $cache $asset
if(-not (Test-Path $binary)){
 New-Item -ItemType Directory -Force -Path $cache | Out-Null
 if(-not (Test-Path $archive)){
  Write-Host 'Downloading standalone clangd 22.1.6 (Windows x64)...'
  Invoke-WebRequest -Uri ('https://github.com/clangd/clangd/releases/download/22.1.6/'+$asset) -OutFile $archive -UseBasicParsing
 }
 $digest=(Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
 if($digest -ne $sha){Remove-Item $archive -ErrorAction SilentlyContinue;throw "Invalid clangd SHA256: $digest"}
 $tmp=Join-Path $cache 'unzip';if(Test-Path $tmp){Remove-Item $tmp -Recurse -Force};Expand-Archive -LiteralPath $archive -DestinationPath $tmp -Force
 $source=Join-Path $tmp 'clangd_22.1.6'
 if(-not(Test-Path (Join-Path $source 'bin\clangd.exe'))){throw 'Archive layout changed; clangd.exe missing'}
 if(Test-Path $target){Remove-Item $target -Recurse -Force}
 Move-Item $source $target
 Remove-Item $tmp -Recurse -Force
}
& $binary --version | Select-Object -First 1
if($LASTEXITCODE -ne 0){throw 'Bundled clangd executable failed version check'}
Write-Host 'clangd package verified and ready.'
