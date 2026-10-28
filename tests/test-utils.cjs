'use strict';
/** Normalize Windows CRLF and classic CR to LF without trimming spaces. */
function normalizeLineEndings(value) {
  return String(value).replace(/\r\n?/g, '\n');
}
module.exports = {normalizeLineEndings};
