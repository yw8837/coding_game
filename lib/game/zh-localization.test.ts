import test from 'node:test';
import assert from 'node:assert/strict';
import {translate} from './translations.ts';
import {localizedCopy,translateZh} from './zh.ts';
import {createLocaleStore} from './locale.ts';
import {translateTerminalOutput} from './terminal-translations.ts';
import {CAREER_JOBS} from './career-content.ts';
import {OPS_JOBS} from './ops-content.ts';
import {getGuides} from './guides.ts';

test('Simplified Chinese resolves authored interface and chapter copy without rewriting source input',()=>{
 assert.equal(translate('설정','zh'),'设置');
 assert.equal(localizedCopy('새 게임','New game','はじめから').zh,'新游戏');
 for(const key of ['constructor','__proto__','toString'])assert.equal(translateZh(key),key);
 assert.equal(translateZh('플레이어의 사적인 문장','Private text'),'Private text');
 for(const job of CAREER_JOBS){assert.ok(job.title.zh);assert.doesNotMatch(job.title.zh,/[가-힣]/);assert.ok(job.brief.zh);}
 for(const job of OPS_JOBS){assert.ok(job.title.zh);assert.doesNotMatch(job.title.zh,/[가-힣]/);}
 for(const guide of getGuides('zh')){assert.ok(guide.title);assert.doesNotMatch(guide.body,/[가-힣]/);}
});

test('supported Chinese device preference survives remote region detection without a lookup',async()=>{
 let lookups=0;
 const store=createLocaleStore({readPreference:()=>null,writePreference:()=>{},browserLanguages:()=>['zh-CN'],clientContext:()=>({hostname:'code.yeolmaeapps.kr',timeZone:'Asia/Seoul'}),regionLanguage:async()=>{lookups++;return 'ko';}});
 await store.restore();assert.equal(store.getLanguage(),'zh');assert.equal(lookups,0);
 await store.setPreference('ja');assert.equal(store.getLanguage(),'ja');
 await store.setPreference('zh');assert.equal(store.getPreference(),'zh');
});

test('Chinese terminal diagnostics preserve user file output, captured values and commit messages',()=>{
 const user='현재 저장한 파일을 검사합니다. 결과는 이 터미널 아래에 표시됩니다.';
 assert.equal(translateTerminalOutput('cat notes.txt',user,'zh'),user);
 assert.equal(translateTerminalOutput('echo '+user,user,'zh'),user);
 assert.match(translateTerminalOutput('npm test',user,'zh'),/终端/);
 assert.equal(translateTerminalOutput('python3 receipt.py','  기대: 原始 값\n  실제: 任意 값','zh'),'  预期：原始 값\n  实际：任意 값');
 assert.equal(translateTerminalOutput('git commit -m x','[main abc] '+user,'zh'),'[main abc] '+user);
 assert.match(translateTerminalOutput('python3 receipt.py','✔ 공개 데이터 결과 일치\n★ 의뢰 완료! +100 cr · +30 XP','zh'),/可见数据.*结果匹配/);
});
