'use strict';
// Work around binutils issue 34395: WinLibs may pass an unquoted absolute
// default-manifest.o path to ld when GCC is installed in a directory with spaces.
// A Windows directory junction preserves the toolchain's relative layout without
// copying gigabytes of files or relying on 8.3 short names.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

function hasSpaces(p) { return /\s/.test(p); }
function getAliasPlan(compiler, localAppData = process.env.LOCALAPPDATA) {
  if(typeof compiler!=='string' || !compiler || !path.win32.isAbsolute(compiler)) throw Error('Invalid bundled GCC path');
  const root=path.win32.dirname(path.win32.dirname(compiler));
  const parent=localAppData || path.win32.join(os.homedir(),'AppData','Local');
  if(hasSpaces(parent)) throw Error(`No space-free alias directory: ${parent}. Install CodeLab to a path without spaces, such as C:\\YanpbCodeLab.`);
  const key=crypto.createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,14);
  const alias=path.win32.join(parent,'YanpbCL-GCC','gcc-'+key);
  return {root,alias,compiler:path.win32.join(alias,'bin','g++.exe')};
}
async function resolveBundledCompiler(compiler,options={}) {
  if(process.platform!=='win32' || !hasSpaces(compiler)) return compiler;
  const plan=getAliasPlan(compiler,options.localAppData);
  await fs.mkdir(path.dirname(plan.alias),{recursive:true});
  try { await fs.symlink(plan.root,plan.alias,'junction'); }
  catch(err){if(err.code!=='EEXIST') throw Error(`Cannot create GCC junction: ${err.message}. Reinstall to C:\\YanpbCodeLab or configure a space-free compiler.`);}
  const [target,realRoot]=await Promise.all([fs.realpath(plan.alias),fs.realpath(plan.root)]);
  if(path.win32.normalize(target).toLowerCase()!==path.win32.normalize(realRoot).toLowerCase()) {
    throw Error('Existing GCC junction targets an unexpected directory: '+plan.alias);
  }
  await fs.access(plan.compiler);
  return plan.compiler;
}
module.exports={hasSpaces,getAliasPlan,resolveBundledCompiler};
