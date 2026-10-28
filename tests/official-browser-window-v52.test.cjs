'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const EventEmitter=require('node:events'),Module=require('node:module');
const events=[],windows=[];
class FakeWebContents extends EventEmitter {
 constructor(win){super();this.win=win;this.current='';this.windowHandler=null;}
 getURL(){return this.current;}
 setWindowOpenHandler(fn){this.windowHandler=fn;}
 async executeJavaScript(script){events.push({event:'evaluate',script});return script.includes('const data=')?{filled:true,message:'test-filled'}:{text:'AC',url:this.current,title:'Official submission'};}
}
class FakeWindow extends EventEmitter{
 constructor(options){super();this.options=options;this.webContents=new FakeWebContents(this);this.dead=false;windows.push(this);}
 getParentWindow(){return this.options.parent;}
 isDestroyed(){return this.dead;}
 async loadURL(url){this.webContents.current=url;this.webContents.emit('did-navigate',null,url);this.webContents.emit('did-finish-load');this.emit('ready-to-show');}
 show(){events.push({event:'show'});}
 close(){this.dead=true;this.emit('closed');}
}
const original=Module._load;
Module._load=function(request,parent,isMain){if(request==='electron' && parent?.filename.endsWith('official-browser.cjs'))return {BrowserWindow:FakeWindow,session:{fromPartition:()=>({setPermissionRequestHandler:()=>{}})}};return original.apply(this,arguments);};
const session=require('../oj/official-browser.cjs');Module._load=original;
const parent={isDestroyed:()=>false,webContents:{send:(name,payload)=>events.push({event:name,payload})}};
test('Official window requires supported OJ URL and has sandboxed isolated session',async()=>{
 const result=session.createOfficialBrowser(parent,{url:'https://atcoder.jp/contests/abc371/tasks/abc371_c',code:'int main(){}'});
 assert.equal(result.platform,'atcoder');const win=windows.at(-1);
 assert.equal(win.options.webPreferences.nodeIntegration,false);
 assert.equal(win.options.webPreferences.contextIsolation,true);
 assert.equal(win.options.webPreferences.sandbox,true);
 assert.match(win.options.webPreferences.partition,/persist:yanpb-oj-atcoder/);
 assert.throws(()=>session.createOfficialBrowser(parent,{url:'https://attacker.example/test',code:'hello'}),/不支持/);
 const rejected=win.webContents.windowHandler({url:'https://outside.example/'});assert.deepEqual(rejected,{action:'deny'});
 const filled=await session.fillSource('atcoder');assert.equal(filled.filled,true);
 assert.ok(events.some(x=>x.event==='evaluate'&&x.script.includes('int main(){}')));
 session.closeAll();
});
test('Official page detail yields status only on a valid submission URL',async()=>{
 session.createOfficialBrowser(parent,{url:'https://www.luogu.com.cn/problem/P1001',code:'int main(){}'});
 const before=await session.inspectCurrent('luogu');assert.equal(before.confirmed,false);
 await session.navigate('luogu','https://www.luogu.com.cn/record/1234');
 const after=await session.inspectCurrent('luogu');assert.equal(after.confirmed,true);assert.equal(after.verdict,'AC');
 await assert.rejects(()=>session.navigate('luogu','https://evil.example/record/1234'));
 session.closeAll();
});
