'use strict';
const path=require('node:path');
const fs=require('node:fs/promises');
const {checkName}=require('../renderer/file-actions.js');
async function verifiedFile(filePath){
 if(typeof filePath!=='string'||!path.isAbsolute(filePath))throw Error('Expected an absolute file path');
 const info=await fs.lstat(filePath);
 if(!info.isFile()||info.isSymbolicLink())throw Error('Not a regular source file');
 if(!/\.(?:cpp|cc|cxx|c|h|hpp|txt)$/i.test(filePath))throw Error('Only C/C++ source files may be modified');
 return filePath;
}
async function renameFile(oldPath,newName){
 await verifiedFile(oldPath);
 const valid=checkName(newName),dest=path.join(path.dirname(oldPath),valid);
 if(path.resolve(oldPath)===path.resolve(dest))return {name:valid,fullPath:oldPath};
 // Do not silently overwrite files even if the only difference is case on Windows.
 try{await fs.lstat(dest);throw Error('目标文件已经存在 / Target file already exists');}
 catch(err){if(err.code!=='ENOENT')throw err;}
 await fs.rename(oldPath,dest);
 return {name:valid,fullPath:dest};
}
async function trashFile(filePath,trashItem){
 await verifiedFile(filePath);
 if(typeof trashItem!=='function')throw Error('Recycle Bin is unavailable');
 await trashItem(filePath);
 return true;
}
module.exports={verifiedFile,renameFile,trashFile};
