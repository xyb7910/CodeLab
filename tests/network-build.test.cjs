'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pkg = require('../package.json');
function invoke(env = {}) {
  const r = cp.spawnSync(process.execPath, ['-e', 'const x=require("./build/network.builder.cjs");console.log(JSON.stringify({mirror:x.electronDownload?.mirror||"",dist:x.electronDist||"",appId:x.appId,extraResources:x.extraResources.length}))'], {
    cwd: root, encoding:'utf8', timeout:10000,
    env:{...process.env,YANPB_ELECTRON_MIRROR:'',YANPB_ELECTRON_DIST_DIR:'',...env}
  });
  return r;
}
test('builder v26 uses dynamic build config', () => {
  assert.equal(pkg.version,'5.10.7');
  for (const target of ['build:win','build:installer','build:portable']) {
    assert.match(pkg.scripts[target], /--config build\/network.builder.cjs/);
    assert.match(pkg.scripts[target], /--publish never/);
  }
});
test('mirrored build must use electronDownload.mirror with HTTPS', () => {
  const r = invoke({YANPB_ELECTRON_MIRROR:'https://npmmirror.com/mirrors/electron'});
  assert.equal(r.status,0,r.stderr);
  const result = JSON.parse(r.stdout.trim());
  assert.equal(result.mirror,'https://npmmirror.com/mirrors/electron/');
  assert.ok(result.extraResources >= 4);
});
test('official GitHub mode does not retain a mirror', () => {
  const r = invoke();assert.equal(r.status,0,r.stderr);
  assert.equal(JSON.parse(r.stdout).mirror, '');
});
test('verified local archive directory avoids Electron remote download option', () => {
  const r=invoke({YANPB_ELECTRON_DIST_DIR:path.resolve(root,'.cache-electron-verified')});
  assert.equal(r.status,0,r.stderr);
  const got=JSON.parse(r.stdout);
  assert.equal(got.dist,path.resolve(root,'.cache-electron-verified'));
  assert.equal(got.mirror,'');
});
test('rejects mixed sources and insecure mirrors', () => {
  assert.notEqual(invoke({YANPB_ELECTRON_MIRROR:'http://untrusted.local/'}).status,0);
  assert.notEqual(invoke({YANPB_ELECTRON_MIRROR:'https://mirror.local/',YANPB_ELECTRON_DIST_DIR:path.resolve(root)}).status,0);
});
