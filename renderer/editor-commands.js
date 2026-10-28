'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YanpbEditorCommands=api;})(typeof window!=='undefined'?window:globalThis,()=>{
 function normalizeRange(cm){const s=cm.getCursor('from'),e=cm.getCursor('to');return {first:s.line,last:e.ch===0 && e.line>s.line?e.line-1:e.line};}
 function duplicateLines(cm){
  const {first,last}=normalizeRange(cm),count=last-first+1;
  const lines=[];for(let i=first;i<=last;i++)lines.push(cm.getLine(i));
  cm.operation(()=>{const suffix=last<cm.lastLine()?'\n':'';cm.replaceRange('\n'+lines.join('\n'),{line:last,ch:cm.getLine(last).length});cm.setCursor({line:first+count,ch:0});});
 }
 function deleteLines(cm){
  const {first,last}=normalizeRange(cm),end=last<cm.lastLine()?{line:last+1,ch:0}:{line:last,ch:cm.getLine(last).length};
  const from=last===cm.lastLine()&&first>0?{line:first-1,ch:cm.getLine(first-1).length}:{line:first,ch:0};
  cm.operation(()=>{cm.replaceRange('',from,end);cm.setCursor({line:Math.min(first,cm.lastLine()),ch:0});});
 }
 function moveLines(cm,direction){
  const {first,last}=normalizeRange(cm);
  if(direction===-1 && first===0 || direction===1 && last===cm.lastLine())return false;
  const neighbor=direction<0?first-1:last+1;
  const block=[];for(let i=first;i<=last;i++)block.push(cm.getLine(i));
  const extra=cm.getLine(neighbor);
  const from=Math.min(first,neighbor),to=Math.max(last,neighbor);
  const text=(direction<0?[...block,extra]:[extra,...block]).join('\n');
  cm.operation(()=>{cm.replaceRange(text,{line:from,ch:0},{line:to,ch:cm.getLine(to).length});cm.setSelection({line:first+direction,ch:0},{line:last+direction,ch:cm.getLine(last+direction).length});});
  return true;
 }
 function selectLine(cm){const {first,last}=normalizeRange(cm);cm.setSelection({line:first,ch:0},{line:last,ch:cm.getLine(last).length});}
 function selectNextOccurrence(cm){
  const doc=cm.getDoc(), selection=cm.getSelection();const cursor=cm.getCursor('to');let term=selection;
  if(!term){const word=cm.findWordAt(cursor);term=cm.getRange(word.anchor,word.head);if(!term.trim())return false;cm.setSelection(word.anchor,word.head);return true;}
  const content=doc.getValue(),offset=doc.indexFromPos(cursor);let pos=content.indexOf(term,offset);
  if(pos<0)pos=content.indexOf(term,0);
  if(pos<0)return false;
  const foundFrom=doc.posFromIndex(pos), foundTo=doc.posFromIndex(pos+term.length);
  const prior=doc.listSelections();if(prior.some(x=>doc.indexFromPos(x.anchor)===pos && doc.indexFromPos(x.head)===pos+term.length))return false;
  doc.setSelections([...prior,{anchor:foundFrom,head:foundTo}],prior.length);return true;
 }
 function matches(source,phrase){
  if(!phrase)return [];
  const data=String(source).toLowerCase(),needle=String(phrase).toLowerCase(),found=[];
  for(let at=0;(at=data.indexOf(needle,at))>=0 && found.length<500;at+=needle.length)found.push({start:at,end:at+needle.length});
  return found;
 }
 return {duplicateLines,deleteLines,moveLines,selectLine,selectNextOccurrence,matches};
});
