'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {MAX_APP_BYTES, MAX_ARCHIVE_BYTES, exportName, validateApp, validateArchive, writeApp, writeArchive, exportAppDocument, exportArchiveDocument} = require('../export-app.cjs');

const html = '<!doctype html><html lang="ko"><title>내 앱 日本語</title><body>☕</body></html>';
test('app export validates type, document marker, NUL and UTF-8 byte limit', () => {
  for (const invalid of [null, {}, [], 4, '<script>alert(1)</script>', html+'\0', '<!doctype html>'+'가'.repeat(MAX_APP_BYTES/2)]) {
    assert.throws(() => validateApp(invalid));
  }
  assert.doesNotThrow(() => validateApp(html));
  const exact = '<!doctype html>' + ' '.repeat(MAX_APP_BYTES - Buffer.byteLength('<!doctype html>'));
  assert.doesNotThrow(() => validateApp(exact));
  assert.throws(() => validateApp(exact+' '));
});

test('app export preserves Unicode and replaces only the chosen HTML destination atomically', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeshift-app-export-'));
  t.after(() => fs.rm(dir, {recursive:true, force:true}));
  const file = path.join(dir, '작품.HTML');
  await fs.writeFile(file, 'old app');
  await writeApp(file, html);
  assert.equal(await fs.readFile(file, 'utf8'), html);
  assert.deepEqual(await fs.readdir(dir), ['작품.HTML']);
  for (const target of ['relative.html', path.join(dir,'wrong.exe'), path.join(dir,'wrong.html.exe')]) {
    await assert.rejects(writeApp(target, html));
  }
  await assert.rejects(writeApp(file, '<!doctype html>'+'x'.repeat(MAX_APP_BYTES)));
  assert.equal(await fs.readFile(file,'utf8'), html);
});

test('failed replacement cleans its temporary file and preserves the existing destination', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeshift-app-export-fail-'));
  t.after(() => fs.rm(dir, {recursive:true, force:true}));
  const destination = path.join(dir,'occupied.html');
  await fs.mkdir(destination);
  await fs.writeFile(path.join(destination,'keep.txt'),'keep');
  await assert.rejects(writeApp(destination,html));
  assert.deepEqual(await fs.readdir(dir), ['occupied.html']);
  assert.equal(await fs.readFile(path.join(destination,'keep.txt'),'utf8'),'keep');
});

test('native export cancellation, concurrent calls and close state do not write', async () => {
  let busy=false, closing=false, resolveDialog, dialogs=0, writes=0;
  const services={isBusy:()=>busy||closing,setBusy:value=>{busy=value;},words:{appExportInvalid:'invalid',appExportFailed:'failed'},
    choose:()=>{dialogs++;return new Promise(resolve=>{resolveDialog=resolve;});},
    write:async()=>{writes++;}};
  const first=exportAppDocument(html,services);
  assert.equal(busy,true);
  assert.deepEqual(await exportAppDocument(html,services),{ok:false,canceled:true});
  assert.equal(dialogs,1);
  resolveDialog({canceled:true});
  assert.deepEqual(await first,{ok:false,canceled:true});
  assert.equal(busy,false);
  assert.equal(writes,0);
  closing=true;
  assert.deepEqual(await exportAppDocument(html,services),{ok:false,canceled:true});
  assert.equal(dialogs,1);
});

test('native export never reports a failed write as saved and releases the dialog gate', async () => {
  let busy=false, dialogs=0;
  const selected=path.join(os.tmpdir(),'chosen-app.html');
  const services={isBusy:()=>busy,setBusy:value=>{busy=value;},words:{appExportInvalid:'invalid',appExportFailed:'failed'},
    choose:async()=>{dialogs++;return {filePath:selected};},
    write:async(file,content)=>{assert.equal(file,selected);assert.equal(content,html);throw Error('disk full');}};
  assert.deepEqual(await exportAppDocument(null,services),{ok:false,error:'invalid'});
  assert.equal(dialogs,0);
  assert.deepEqual(await exportAppDocument(html,services),{ok:false,error:'failed'});
  assert.equal(busy,false);
  assert.deepEqual(await exportAppDocument(html,{...services,write:async()=>{}}),{ok:true});
  assert.equal(dialogs,2);
  assert.equal(busy,false);
});

const zip = Uint8Array.from([0x50,0x4b,0x03,0x04,...new Array(40).fill(0)]);
test('archive export accepts only bounded ZIP bytes and allow-listed suggested names', async t => {
  for (const invalid of [null, 'PK', [0x50,0x4b,3,4], new Uint8Array(10), Uint8Array.from([0x4d,0x5a,0,0,...new Array(40).fill(0)]), new Uint8Array(MAX_ARCHIVE_BYTES+1).fill(0x50)]) {
    assert.throws(() => validateArchive(invalid));
  }
  assert.doesNotThrow(() => validateArchive(zip));
  assert.equal(exportName('zip','my-mono-cafe.zip'),'my-mono-cafe.zip');
  assert.equal(exportName('html','my-mono-cafe.html'),'my-mono-cafe.html');
  for (const hostile of ['../evil.zip', 'C:\\Windows\\x.zip', undefined, 'my-mono-cafe.exe']) assert.equal(exportName('zip',hostile),'my-neighborhood-app.zip');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeshift-archive-export-'));
  t.after(() => fs.rm(dir, {recursive:true, force:true}));
  const file = path.join(dir, '내 카페.zip');
  await writeArchive(file, zip);
  assert.deepEqual(new Uint8Array(await fs.readFile(file)), zip);
  await assert.rejects(writeArchive(path.join(dir,'wrong.html'), zip));
  assert.deepEqual(await fs.readdir(dir), ['내 카페.zip']);
});

test('native archive export shares the busy gate and reports failures honestly', async () => {
  let busy=false, dialogs=0;
  const words={archiveExportInvalid:'invalid',archiveExportFailed:'failed'};
  const services={isBusy:()=>busy,setBusy:value=>{busy=value;},words,choose:async()=>{dialogs++;return {filePath:path.join(os.tmpdir(),'x.zip')};},write:async()=>{throw Error('disk full');}};
  assert.deepEqual(await exportArchiveDocument('nope',services),{ok:false,error:'invalid'});
  assert.equal(dialogs,0);
  assert.deepEqual(await exportArchiveDocument(zip,services),{ok:false,error:'failed'});
  assert.equal(busy,false);
  assert.deepEqual(await exportArchiveDocument(zip,{...services,write:async()=>{}}),{ok:true});
  busy=true;
  assert.deepEqual(await exportArchiveDocument(zip,services),{ok:false,canceled:true});
  assert.equal(dialogs,2);
});
