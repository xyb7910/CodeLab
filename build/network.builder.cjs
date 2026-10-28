'use strict';
/**
 * electron-builder v26 network-aware config.
 * Keep the same desktop resources, only override Electron download source.
 * Never disable checksums or TLS verification.
 */
const path = require('node:path');
const base = require('../package.json').build;
const config = {...base};
const mirror = String(process.env.YANPB_ELECTRON_MIRROR || '').trim();
const localZipDir = String(process.env.YANPB_ELECTRON_DIST_DIR || '').trim();
if (mirror && localZipDir) throw new Error('Choose Electron mirror OR verified local zip, not both');
if (localZipDir) {
  if (!path.isAbsolute(localZipDir)) throw new Error('Electron local ZIP directory must be absolute');
  config.electronDist = path.resolve(localZipDir);
} else if (mirror) {
  if (!/^https:\/\//i.test(mirror)) throw new Error('Electron mirror must use HTTPS');
  // Electron-builder 26 accepts the legacy electronDownload.mirror config;
  // electron-builder 27 changes this to electronGet.mirrorOptions.mirror.
  config.electronDownload = {mirror: mirror.endsWith('/') ? mirror : mirror + '/'};
}
module.exports = config;
