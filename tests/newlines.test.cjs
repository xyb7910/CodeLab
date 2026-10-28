'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeLineEndings}=require('./test-utils.cjs');
const {compareOutput}=require('../runner/local-runner.cjs');

test('Windows CRLF and Unix LF produce equivalent output for strict test assertions',()=>{
  assert.equal(normalizeLineEndings('42\r\n'), '42\n');
  assert.deepEqual(['14\r\n','16\r\n'].map(normalizeLineEndings), ['14\n','16\n']);
  assert.equal(normalizeLineEndings('5\r\n'), '5\n');
  assert.equal(normalizeLineEndings('ready\r\n'), 'ready\n');
});
test('Output normalization must NOT silently ignore trailing blanks',()=>{
  assert.notEqual(normalizeLineEndings('42 \r\n'), '42\n');
  assert.equal(compareOutput('42\r\n','42\n','strict'),true);
  assert.equal(compareOutput('42 \r\n','42\n','strict'),false);
});
