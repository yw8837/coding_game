import test from 'node:test';
import assert from 'node:assert/strict';
import {translate,catalog} from './translations.ts';
import {CHAPTERS,CAMPAIGN_GOAL} from './story.ts';
import {LEARNING_NOTES} from './learning-notes.ts';
import {gameMessages} from './gameplay.ts';
import {createGame} from './engine.ts';

test('English and Japanese cover the story, choices, hints and all NPC messages',()=>{
 const s=createGame();s.mission=2;s.completed=[0,1,2];s.accepted=true;
 const messages=gameMessages(s);
 for(const language of ['en','ja'] as const){
  for(const text of [CAMPAIGN_GOAL,...CHAPTERS.flatMap(c=>Object.values(c)),...LEARNING_NOTES.flatMap(n=>[n.title,n.body]),...messages.flatMap(m=>[m.subject,m.body,m.role])]){
   assert.notEqual(translate(text,language),text,language+': '+text);
  }
  for(const row of Object.values(catalog))assert.ok(row[language==='en'?0:1].length);
 }
});
test('language changes preserve source code and format dynamic amounts and badges',()=>{
 assert.equal(translate('return price * quantity;','ja'),'return price * quantity;');
 assert.equal(translate('13,500원','en'),'13,500 KRW');
 assert.equal(translate('시험 주문 2건 도착','ja'),'テスト注文2件到着');
 assert.equal(translate('첫 배포 달성!','en'),'First Release earned!');
 assert.equal(translate('  메시지  ','ja'),'  メッセージ  ');
});
