'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'renderer/index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'renderer/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'renderer/style.css'),'utf8');
test('The sample input exists on the right, not in the left explorer',()=>{
 assert.doesNotMatch(html,/id="sampleDock"/);
 assert.match(html,/id="caseInput"/);
 assert.match(css,/body #casesPanel #caseInput\{display:block!important\}/);
});
test('History rail was removed without deleting version history tool',()=>{
 assert.doesNotMatch(html,/data-nav="history"/);
 assert.match(html,/id="versionsBtn"/);
 assert.match(html,/id="fileFilter"/);
});
test('CodeMirror remains entirely locally bundled with the IDE surface',()=>{
 assert.match(html,/src="vendor\/codemirror\/codemirror.js"/);
 assert.doesNotMatch(html,/src="editor-surface.js"/);
 assert.doesNotMatch(html,/id="editorMinimap"/);
 assert.match(html,/id="problemsTab"/);
 assert.match(html,/src="diagnostic-engine.js"/);
});
test('Safe edits require explicit preview and do not silently auto-apply',()=>{
 assert.match(app,/function previewDiagnosticFix/);
 assert.match(app,/confirm\(/);
 assert.match(app,/validateFix\(fix,editor.getLine/);
});
