'use strict';
const base=require('../package.json').build;
if(process.platform!=='darwin')throw Error('Build macOS DMG/ZIP on a macOS runner.');
const {extraResources,...shared}=base;
module.exports={...shared,
 directories:{...shared.directories,output:'dist-macos'},
 mac:{category:'public.app-category.developer-tools',icon:'build/icon.icns',
   target:[{target:'dmg',arch:['x64','arm64']},{target:'zip',arch:['x64','arm64']}],
   artifactName:'Yanpb-CodeLab-macOS-${version}-${arch}.${ext}'},
 // Keep only portable resources. Windows MinGW and Windows clangd do not run on macOS.
 extraResources:[
   {from:'mac-compat',to:'mac-compat',filter:['**/*']},
   {from:'oj/submit-extension',to:'oj-submit-extension',filter:['**/*']}
 ]
};
