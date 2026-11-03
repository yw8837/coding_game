const test = require('node:test');
const assert = require('node:assert/strict');
const {createTextClipboard} = require('../clipboard.cjs');

test('clipboard bridge accepts bounded text only and requires focus', () => {
  let text = 'hello', focused = true;
  const bridge = createTextClipboard({readText:()=>text,writeText:value=>{text=value;}},()=>focused);
  assert.equal(bridge.read(),'hello');
  bridge.write('한글 日本語');assert.equal(text,'한글 日本語');
  for (const value of [null,{},new Uint8Array(2),'x'.repeat(60001)]) assert.throws(()=>bridge.write(value));
  text = 'x'.repeat(60001);assert.throws(()=>bridge.read());
  focused = false;assert.throws(()=>bridge.write('blocked'));assert.throws(()=>bridge.read());
});
