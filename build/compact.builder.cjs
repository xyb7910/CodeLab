'use strict';
// This overrides only installer compression. All paths/resources are identical
// to the fast-release configuration in package.json.
const config = require('./network.builder.cjs');
module.exports = {
 ...config,
 compression: 'maximum',
 nsis: {...config.nsis, useZip:false, differentialPackage:false,
  artifactName:'Yanpb-CodeLab-Compact-Setup-${version}-${arch}.${ext}'}
};
