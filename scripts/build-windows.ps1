# Windows PowerShell 5.1+ / PowerShell 7
# Produces an installer AND portable application with GCC already included.
[CmdletBinding()]
param(
    [string]$Archive = '',
    [switch]$ReinstallToolchain,
    [switch]$Compact,
    [ValidateSet('Auto','Mirror','GitHub','LocalZip')]
    [string]$ElectronSource = 'Auto',
    [string]$ElectronZip = '',
    [string]$ElectronSHA256 = '',
    [string]$ElectronMirror = 'https://npmmirror.com/mirrors/electron/'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ToolchainRoot = Join-Path $Root 'toolchain\mingw64'
$Compiler = Join-Path $ToolchainRoot 'bin\g++.exe'
$Cache = Join-Path $Root '.cache-winlibs'
$Asset = 'winlibs-x86_64-posix-seh-gcc-16.2.0-mingw-w64ucrt-14.0.0-r2.zip'
$Url = 'https://github.com/brechtsanders/winlibs_mingw/releases/download/16.2.0posix-14.0.0-ucrt-r2/' + $Asset
$ExpectedSHA256 = 'd5dbafc4a170e762ca6143151ec918fb9e2c72736fb14cd704abebc6bdd5276a'

function Assert-ExitCode([string]$Label) {
    if ($LASTEXITCODE -ne 0) { throw "$Label failed (exit code $LASTEXITCODE)" }
}
function Install-Toolchain {
    New-Item -ItemType Directory -Force -Path $Cache | Out-Null
    if (-not $Archive) {
        $ArchivePath = Join-Path $Cache $Asset
        if (-not (Test-Path $ArchivePath)) {
            Write-Host '[1/5] Downloading WinLibs GCC 16.2.0 (261 MB)...' -ForegroundColor Cyan
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $Url -OutFile $ArchivePath -UseBasicParsing
        }
    } else {
        $ArchivePath = (Resolve-Path -LiteralPath $Archive -ErrorAction Stop).Path
    }

    Write-Host '[2/5] Checking GCC archive SHA-256...' -ForegroundColor Cyan
    $Hash = (Get-FileHash -LiteralPath $ArchivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($Hash -ne $ExpectedSHA256) {
        if (-not $Archive) { Remove-Item -LiteralPath $ArchivePath -Force -ErrorAction SilentlyContinue }
        throw "Compiler download failed integrity check. Expected $ExpectedSHA256, got $Hash"
    }
    $Extract = Join-Path $Cache 'extract-tmp'
    if (Test-Path $Extract) { Remove-Item -LiteralPath $Extract -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $Extract | Out-Null
    Write-Host '[3/5] Extracting portable GCC...' -ForegroundColor Cyan
    try {
        if (Get-Command tar.exe -ErrorAction SilentlyContinue) {
            & tar.exe -xf $ArchivePath -C $Extract
            Assert-ExitCode 'tar.exe extraction'
        } else {
            Expand-Archive -LiteralPath $ArchivePath -DestinationPath $Extract -Force
        }
        $Extracted = Join-Path $Extract 'mingw64'
        if (-not (Test-Path (Join-Path $Extracted 'bin\g++.exe'))) {
            throw 'Unexpected archive layout: mingw64/bin/g++.exe was not found.'
        }
        if (Test-Path $ToolchainRoot) { Remove-Item -LiteralPath $ToolchainRoot -Recurse -Force }
        New-Item -ItemType Directory -Force -Path (Split-Path $ToolchainRoot -Parent) | Out-Null
        Move-Item -LiteralPath $Extracted -Destination $ToolchainRoot
    } finally {
        if (Test-Path $Extract) { Remove-Item -LiteralPath $Extract -Recurse -Force }
    }
}
function Set-ElectronDownloadSource([string]$Source) {
    # electron-builder v26 uses build.electronDownload.mirror, populated by
    # build/network.builder.cjs from YANPB_ELECTRON_MIRROR. npm install's
    # Electron postinstall uses ELECTRON_MIRROR directly.
    Remove-Item Env:ELECTRON_MIRROR -ErrorAction SilentlyContinue
    Remove-Item Env:YANPB_ELECTRON_MIRROR -ErrorAction SilentlyContinue
    Remove-Item Env:YANPB_ELECTRON_DIST_DIR -ErrorAction SilentlyContinue
    Remove-Item Env:ELECTRON_SKIP_BINARY_DOWNLOAD -ErrorAction SilentlyContinue
    if ($Source -eq 'Mirror') {
        if ($ElectronMirror -notmatch '^https://') {throw 'Electron mirror must use HTTPS.'}
        $Uri = $ElectronMirror.TrimEnd('/') + '/'
        $env:ELECTRON_MIRROR = $Uri
        $env:YANPB_ELECTRON_MIRROR = $Uri
    }
    if ($Source -eq 'LocalZip') {
        # Only skips Electron's npm *postinstall* downloader. It does NOT make
        # electron-builder itself offline; electronDist is used for packaging.
        $env:ELECTRON_SKIP_BINARY_DOWNLOAD = '1'
    }
}
function Initialize-LocalElectronZip {
    if (-not $ElectronZip -or -not $ElectronSHA256) {
        throw 'LocalZip requires -ElectronZip and -ElectronSHA256 (from official SHASUMS256.txt).'
    }
    if ($ElectronSHA256 -notmatch '^[0-9a-fA-F]{64}$') {throw 'SHA256 must have 64 hex characters.'}
    $ArchivePath = (Resolve-Path -LiteralPath $ElectronZip -ErrorAction Stop).Path
    $Expected = $ElectronSHA256.ToLowerInvariant()
    $Actual = (Get-FileHash -LiteralPath $ArchivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($Actual -ne $Expected) {throw "Electron ZIP hash mismatch. Got $Actual, expected $Expected"}
    $ActualVersion = (& node -p 'require("./node_modules/electron/package.json").version').Trim()
    Assert-ExitCode 'Electron package version lookup'
    $CorrectFile = "electron-v$ActualVersion-win32-x64.zip"
    if ((Split-Path $ArchivePath -Leaf) -ne $CorrectFile) {
        throw "Electron ZIP name/version mismatch. Expected $CorrectFile"
    }
    # Put the validated archive in a standalone directory; never overwrite
    # Electron's opaque @electron/get cache structure by hand.
    $VerifiedDir = Join-Path $Root '.cache-electron-verified'
    New-Item -ItemType Directory -Path $VerifiedDir -Force | Out-Null
    $Destination = Join-Path $VerifiedDir $CorrectFile
    if ($ArchivePath -ne $Destination) {Copy-Item -LiteralPath $ArchivePath -Destination $Destination -Force}
    $env:YANPB_ELECTRON_DIST_DIR = $VerifiedDir
    Remove-Item Env:ELECTRON_SKIP_BINARY_DOWNLOAD -ErrorAction SilentlyContinue
    Write-Host "Using checked local Electron ZIP: $CorrectFile" -ForegroundColor Green
}
try {
    Set-Location $Root
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {throw 'Node.js 22+ is required on build computer.'}
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {throw 'npm is required on build computer.'}
    $Major = [int]((& node -p 'process.versions.node').Split('.')[0])
    if ($Major -lt 22) {throw 'Please use Node.js 22+ to build the desktop client.'}

    # Toolchain and language server installation only run once. Existing
    # verified dependencies are reused in subsequent mirror attempts.
    if ($ReinstallToolchain -or -not (Test-Path $Compiler)) { Install-Toolchain }
    Write-Host '[4/5] Preparing clangd and bundled GCC...' -ForegroundColor Cyan
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'scripts/install-clangd.ps1')
    Assert-ExitCode 'Bundled clangd preparation'

    $Sources = if ($ElectronSource -eq 'Auto') { @('Mirror','GitHub') } else { @($ElectronSource) }
    $DependenciesReady = $false
    $TestsPassed = $false
    $BuildFinished = $false
    $LastFailure = ''
    foreach ($Source in $Sources) {
        Set-ElectronDownloadSource $Source
        Write-Host "[4/5] Electron source: $Source" -ForegroundColor Cyan
        if (-not $DependenciesReady) {
            & npm install --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) {
                $LastFailure = "npm install failed using $Source"
                Write-Warning "$LastFailure. Trying next source if available."
                continue
            }
            $DependenciesReady = $true
        }
        if ($Source -eq 'LocalZip') { Initialize-LocalElectronZip }
        if (-not $TestsPassed) {
            & npm test
            Assert-ExitCode 'Unit tests'
            $TestsPassed = $true
        }
        if ($Compact) { & npm run build:compact }
        else { & npm run build:win }
        if ($LASTEXITCODE -eq 0) {
            $BuildFinished = $true
            break
        }
        $LastFailure = "electron-builder failed using $Source"
        Write-Warning "$LastFailure. Existing toolchains and caches were kept."
    }
    if (-not $BuildFinished) {
        throw "Build failed after all selected Electron sources. $LastFailure. See ELECTRON-DOWNLOAD-FIX.md."
    }
    & npm run report:size
    Assert-ExitCode 'Size reporting'
    Write-Host '[5/5] Build completed.' -ForegroundColor Green
    Write-Host "Generated installers: $Root\dist-windows\"
    Get-ChildItem (Join-Path $Root 'dist-windows') -Filter '*.exe' | Select-Object Name,Length | Format-Table
} catch {
    Write-Host 'BUILD FAILED:' $_ -ForegroundColor Red
    exit 1
} finally {
    # Avoid leaking Electron source preferences to other builds in this shell.
    Remove-Item Env:ELECTRON_MIRROR -ErrorAction SilentlyContinue
    Remove-Item Env:YANPB_ELECTRON_MIRROR -ErrorAction SilentlyContinue
    Remove-Item Env:YANPB_ELECTRON_DIST_DIR -ErrorAction SilentlyContinue
    Remove-Item Env:ELECTRON_SKIP_BINARY_DOWNLOAD -ErrorAction SilentlyContinue
}
