# Repair previously installed Yanpb CodeLab v3.3.0 without recompiling Electron.
# This creates a directory junction (not a copy) and prints the compiler path
# to enter in CodeLab -> Compiler Settings. No administrator rights expected.
$ErrorActionPreference = 'Stop'
$Toolchain = Join-Path $env:LOCALAPPDATA 'Programs\Yanpb CodeLab Local\resources\toolchain\mingw64'
$AliasDir = Join-Path $env:LOCALAPPDATA 'YanpbCL-GCC\repair'
try {
  if (-not (Test-Path (Join-Path $Toolchain 'bin\g++.exe'))) { throw "GCC was not found at $Toolchain" }
  if ($env:LOCALAPPDATA.Contains(' ')) { throw 'LOCALAPPDATA contains spaces. Reinstall to a path without spaces, e.g. C:\YanpbCodeLab.' }
  New-Item -ItemType Directory -Force -Path (Split-Path $AliasDir -Parent) | Out-Null
  if (-not (Test-Path $AliasDir)) { New-Item -ItemType Junction -Path $AliasDir -Target $Toolchain | Out-Null }
  $Actual = (Get-Item -LiteralPath $AliasDir).Target
  if ($Actual -is [array]) { $Actual = $Actual[0] }
  if ($Actual -ne $Toolchain) { throw "Existing alias points somewhere else: $Actual" }
  $Gcc = Join-Path $AliasDir 'bin\g++.exe'
  & $Gcc --version | Select-Object -First 1
  if ($LASTEXITCODE -ne 0) {throw 'Could not run the linked compiler'}
  Write-Host ''
  Write-Host 'Alias created successfully.' -ForegroundColor Green
  Write-Host 'Open Yanpb CodeLab -> Compiler Settings -> set compiler path to:' -ForegroundColor Yellow
  Write-Host $Gcc -ForegroundColor Cyan
  Write-Host 'Restart CodeLab, then compile a hello-world program.'
} catch {
  Write-Host "Repair failed: $_" -ForegroundColor Red
  exit 1
}
