'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Module=require('node:module');
const vm=require('node:vm');
const original=Module._load;
Module._load=function(id,parent,...args){if(id==='electron'&&parent?.filename?.endsWith('official-browser.cjs'))return {BrowserWindow:class{},session:{}};return original.call(this,id,parent,...args);};
const {guardedSubmitScript}=require('../oj/official-browser.cjs');Module._load=original;
function run(platform,problemId,{captcha=false,path=null,taskValue=null,language='GNU C++17',hasSource=true,extraButton=false}={}){
  let clicks=0,changes=0;
  const submit={disabled:false,click(){clicks++;}};
  const form={querySelectorAll(){return extraButton?[submit,submit]:[submit];}};
  const task={value:taskValue??(platform==='atcoder'?problemId:problemId.split('/')[1]),closest(){return form;}};
  const langs=[{value:'1',textContent:language}];
  const lang={value:'1',options:langs,get selectedOptions(){return this.options.filter(o=>o.value===this.value);},closest(){return form;},dispatchEvent(){changes++;}};
  const input={value:hasSource?'int main(){}':''};
  const cm=hasSource?{getValue:()=> 'int main(){}'}:null;
  const doc={querySelector(selector){
    if(selector.includes('recaptcha'))return captcha?{}:null;
    if(selector.includes('TaskScreenName')||selector.includes('submittedProblemIndex'))return task;
    if(selector.includes('CodeMirror'))return cm?{CodeMirror:cm}:null;
    if(selector.includes('LanguageId')||selector.includes('programTypeId'))return lang;
    if(selector.includes('textarea'))return input;
    return null;
  }};
  const pathname=path??(platform==='codeforces'?'/contest/'+problemId.split('/')[0]+'/submit':'/contests/'+problemId.replace(/_[^_]+$/,'')+'/submit');
  const result=vm.runInNewContext(guardedSubmitScript(platform,problemId),{location:{pathname},document:doc,Event:class{}},{timeout:1000});
  return {result,clicks,changes};
}
test('One-click actually clicks the Codeforces submit button after matching official task and C++17',()=>{const x=run('codeforces','1976/B');assert.equal(x.result.attempted,true);assert.equal(x.clicks,1);});
test('One-click actually clicks the AtCoder submit button after matching task and language',()=>{const x=run('atcoder','abc371_c',{language:'C++ 17 (GCC 12.2)'});assert.equal(x.result.attempted,true);assert.equal(x.clicks,1);});
test('Wrong contest blocks submit even when task index matches',()=>{const x=run('codeforces','1976/B',{path:'/contest/2000/submit'});assert.equal(x.result.reason,'contest-unverified');assert.equal(x.clicks,0);});
test('Wrong task, captcha or missing C++17 blocks submit',()=>{for(const o of [{taskValue:'A'},{captcha:true},{language:'Python 3'}]){const x=run('codeforces','1976/B',o);assert.equal(x.result.attempted,false);assert.equal(x.clicks,0);}});
test('Blank source or ambiguous submit buttons blocks submit',()=>{for(const o of [{hasSource:false},{extraButton:true}]){const x=run('codeforces','1976/B',o);assert.equal(x.result.attempted,false);assert.equal(x.clicks,0);}});
test('Luogu falls back to manual confirmation, without attempting a submit',()=>{const x=run('luogu','P1001');assert.equal(x.result.reason,'unsupported-platform');assert.equal(x.clicks,0);});
