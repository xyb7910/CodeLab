'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('browser bridge is a separately versioned Chrome and Edge MV3 extension',()=>{
 const manifest=JSON.parse(read('oj/submit-extension/manifest.json'));
 assert.equal(manifest.manifest_version,3);assert.equal(manifest.version,'2.0.0');assert.equal(manifest.minimum_chrome_version,'120');
 assert.ok(manifest.host_permissions.includes('http://127.0.0.1:10045/*'));
 assert.ok(fs.existsSync(path.join(root,'oj/submit-extension/README.md')));
});
test('release workflow publishes a standalone extension zip and checksum',()=>{
 const workflow=read('.github/workflows/windows-build.yml');
 assert.match(workflow,/Standalone Chrome \+ Edge extension/);
 assert.match(workflow,/Yanpb-OJ-Result-Bridge-\$\{version\}\.zip/);
 assert.match(workflow,/SHA256SUMS-Browser-Extension\.txt/);
 assert.match(workflow,/needs: \[browser_extension, windows, macos\]/);
});
test('extension popup exposes pairing, diagnostics, version and security boundary',()=>{
 const html=read('oj/submit-extension/popup.html'),js=read('oj/submit-extension/popup.js');
 for(const id of ['version','status','diagnostics','pairArea','pin','pair','retry','notifyVerdicts'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(js,/chrome\.runtime\.getManifest\(\)\.version/);assert.match(html,/不读取密码、Cookie/);
});
