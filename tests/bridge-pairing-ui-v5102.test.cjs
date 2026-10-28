'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'renderer/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'renderer/index.html'),'utf8');
const main=fs.readFileSync(path.join(root,'electron/main.cjs'),'utf8');
const preload=fs.readFileSync(path.join(root,'electron/preload.cjs'),'utf8');
test('six-digit pairing has an actual UI menu entry wired to an active modal',()=>{
 assert.match(html,/id="moreBrowserBridgeBtn"/);
 assert.match(app,/\$\('moreBrowserBridgeBtn'\)\.onclick=showBrowserBridgeConnection/);
 assert.match(app,/async function showBrowserBridgeConnection\(\)/);
 assert.match(app,/id="bridgeAuthPin"/);
 assert.match(app,/id="bridgeGeneratePin"/);
 assert.match(app,/const current=await refresh\(\);[\s\S]*?if\(current\?\.active&&!current\.connected\)await generate\(\)/);
});
test('desktop menu and preloads expose the same pairing IPC endpoint',()=>{
 assert.match(main,/sendCommand\('browserBridge'\)/);
 assert.match(app,/browserBridge:showBrowserBridgeConnection/);
 assert.match(main,/ipcMain\.handle\('local:browserBridgePair'/);
 assert.match(preload,/browserBridgePair:\(\)=>ipcRenderer\.invoke\('local:browserBridgePair'\)/);
});
