import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog,translate} from './translations.ts';
import {zhCatalog} from './zh-catalog.ts';

test('every shared display row has a Simplified Chinese entry',()=>{
 for(const key of Object.keys(catalog)){
  assert.ok(Object.hasOwn(zhCatalog,key)&&zhCatalog[key].trim(),key);
  assert.doesNotMatch(translate(key,'zh'),/[가-힣]/u,key);
 }
});

test('Chinese display text keeps numeric values, asset names and exact code intact',()=>{
 assert.equal(translate('실제 결과: 13,500원','zh'),'实际结果：13,500 韩元');
 assert.equal(translate('화면 360px / 콘텐츠 384px · 메뉴 3개','zh'),'屏幕 360px / 内容 384px · 3 项菜单');
 assert.equal(translate('example.js 코드 편집','zh'),'example.js 代码编辑器');
 for(const language of ['en','ja','zh'] as const){
  for(const value of ['constructor','toString','<h1>My title</h1>','return price * quantity;']){
   assert.equal(translate(value,language),value);
  }
 }
});
