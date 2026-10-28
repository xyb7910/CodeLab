'use strict';
// Model shared by the GDB service and the renderer's local debugger UI.
const MAX_STDIN_BYTES=256*1024, MAX_WATCHES=16, MAX_ARRAY_VIEWS=8, MAX_ARRAY_ELEMENTS=40;
function cleanExpression(expression){
 if(typeof expression!=='string')throw Error('Expression must be text');
 const s=expression.trim();
 if(!s||s.length>180||/[\u0000-\u001f;]/.test(s))throw Error('Invalid or overlong C++ expression');
 return s;
}
function cleanCondition(input){
 const s=cleanExpression(input);
 // Avoid GDB command injection; note: a valid C++ expression may execute code.
 if(/\b(?:system|fork|execv|popen)\s*\(/.test(s))throw Error('Potentially unsafe breakpoint condition');
 return s;
}
function normalizeWatches(input){
 if(!Array.isArray(input))return [];
 if(input.length>MAX_WATCHES)throw Error('Maximum 16 watch expressions');
 return [...new Set(input.map(cleanExpression))];
}
function normalizeArrays(input){
 if(!Array.isArray(input))return [];
 if(input.length>MAX_ARRAY_VIEWS)throw Error('Maximum 8 array views');
 return input.map(x=>{
  if(!x||typeof x!=='object')throw Error('Invalid array view');
  const expression=cleanExpression(x.expression);
  const start=Number(x.start??0),length=Number(x.length??10);
  if(!Number.isSafeInteger(start)||start<0||start>1000000||!Number.isSafeInteger(length)||length<1||length>MAX_ARRAY_ELEMENTS)throw Error('Array bounds must be within 1–40 elements');
  // Indexing C++ arrays/vector uses a side-effect-free simple lvalue path.
  if(!/^[A-Za-z_]\w*(?:(?:\.|->)[A-Za-z_]\w*|\[(?:\d+|[A-Za-z_]\w*)\])*$/u.test(expression))throw Error('Array view accepts variable, member or subscript expression only');
  return {expression,start,length};
 });
}
function normalizeConditions(value,breakpoints=[]){
 const result={};if(!value||typeof value!=='object'||Array.isArray(value))return result;
 for(const [line,s] of Object.entries(value)){
  const n=Number(line);if(!Number.isInteger(n)||!breakpoints.includes(n))continue;
  if(s&&String(s).trim())result[n]=cleanCondition(s);
 }return result;
}
function runCommand(hasInput){return hasInput?'-interpreter-exec console "run < yanpb-debug-input.txt"':'-exec-run';}
function numericBars(items){
 const nums=items.map(x=>Number(x.value));const finite=nums.filter(Number.isFinite);
 if(!finite.length)return items.map(x=>({...x,percent:0,numeric:false}));
 const limit=Math.max(...finite.map(Math.abs),1);
 return items.map((x,i)=>({...x,percent:Number.isFinite(nums[i])?Math.max(1,Math.round(Math.abs(nums[i])*100/limit)):0,numeric:Number.isFinite(nums[i]),negative:nums[i]<0}));
}
module.exports={MAX_STDIN_BYTES,MAX_ARRAY_ELEMENTS,cleanExpression,cleanCondition,normalizeWatches,normalizeArrays,normalizeConditions,runCommand,numericBars};
