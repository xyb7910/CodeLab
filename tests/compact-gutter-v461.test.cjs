'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','renderer');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const debug=fs.readFileSync(path.join(root,'live-debug.js'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');

test('editor reserves just the dynamic-width line-number gutter',()=>{
 assert.match(app,/foldGutter:false,gutters:\['CodeMirror-linenumbers'\]/);
 assert.doesNotMatch(app,/setGutterMarker\([^,]+,'yanpb-errors-gutter'/);
 assert.match(css,/\.editor-pane \.CodeMirror-gutters \{[\s\S]*?min-width:0!important/);
 assert.match(css,/\.editor-pane \.CodeMirror-linenumber \{[\s\S]*?min-width:1ch!important/);
});
test('breakpoints and diagnostics decorate existing line numbers rather than adding columns',()=>{
 assert.match(debug,/yanpb-breakpoint-number/);
 assert.match(debug,/gutter!=='CodeMirror-linenumbers'/);
 assert.match(debug,/event\?\.altKey/);
 assert.match(app,/yanpb-diag-gutter-/);
 assert.match(css,/yanpb-diag-gutter-error/);
 assert.match(app,/diagnosticGutterHandles/);
});
