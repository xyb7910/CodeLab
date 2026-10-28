'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const test=require('node:test');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'scripts/build-windows.ps1'),'utf8');
test('Windows builder auto-retries Electron source without overwriting toolchains',()=>{
 assert.match(script,/\@\('Mirror','GitHub'\)/);
 assert.match(script,/\$BuildFinished/);
 assert.match(script,/\$DependenciesReady/);
 assert.match(script,/Set-ElectronDownloadSource/);
});
test('manual Electron ZIP requires SHA256 and exact version + arch',()=>{
 assert.match(script,/ElectronSHA256/);
 assert.match(script,/Get-FileHash/);
 assert.match(script,/electron-v\$ActualVersion-win32-x64\.zip/);
 assert.match(script,/YANPB_ELECTRON_DIST_DIR/);
});
