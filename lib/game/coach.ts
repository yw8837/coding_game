import {type GameState,projectFiles} from './engine.ts';
import {lessonFacts} from './lesson.ts';
import {setupReadiness} from './setup.ts';
export type CoachStage='prepare'|'inspect'|'sign'|'size'|'rule'|'serve'|'route'|'keep'|'connect'|'menu'|'order'|'trial'|'deliver'|'complete';
/** Navigation is always reconstructed from real files, services and evidence. */
export function coachStage(s:GameState):CoachStage {
 if(s.completed.includes(s.mission))return 'complete';
 if(!setupReadiness(s).ready)return 'prepare';
 const f=lessonFacts(s);
 if(s.mission<2&&!s.gameplay.inspected.includes(s.mission))return 'inspect';
 if(s.mission===0){if(!f.sign)return 'sign';if(!f.size)return 'size';}
 if(s.mission===1){if(!f.rule)return 'rule';if(!f.serve)return 'serve';}
 if(s.mission===2){
  if(!f.route)return 'route';if(!f.keep)return 'keep';
  const m=s.machines.server;
  if(!s.serverReady||!m.processes.backend||m.backendSource!==projectFiles(s)['server.py'])return 'connect';
  if(!s.apiEvidence.menu)return 'menu';
  if(!s.apiEvidence.order||!s.orders.length)return 'order';
 }
 return f.trial?'deliver':'trial';
}
export const COACH_COPY:Record<CoachStage,[string,string,string]>={
 prepare:['카페 화면을 켜 보자','Open the cafe screen','カフェの画面を開こう'],
 inspect:['어디가 이상할까?','What looks wrong?','どこがおかしいかな？'],
 sign:['카페에 간판 달기','Put up the cafe sign','カフェの看板をつけよう'],
 size:['휴대폰에 메뉴판 맞추기','Fit the menu on a phone','スマホにメニューを収めよう'],
 rule:['세 잔 값을 계산해 보자','Work out the price of three cups','3杯の値段を計算しよう'],
 serve:['내 계산대로 손님 맞기','Serve customers with your checkout','直したレジで接客しよう'],
 route:['손님과 메뉴판 연결하기','Connect the customer to the menu','お客さんとメニューをつなごう'],
 keep:['주문서를 남겨 두자','Keep the order slip','注文票を残そう'],
 connect:['카페 밖에서도 주문받기','Take orders from outside','お店の外からも注文を受けよう'],
 menu:['손님에게 메뉴 보내기','Send the menu to a customer','お客さんにメニューを届けよう'],
 order:['주문 한 장 받아 보기','Receive an order slip','注文票を1枚受け取ろう'],
 trial:['손님처럼 직접 써 보기','Try it as a customer','お客さんとして試そう'],
 deliver:['지우에게 고친 카페 보내기','Send your repairs to Jiwoo','直したカフェをジウに届けよう'],
 complete:['카페의 다음 이야기','The cafe’s next chapter','カフェの次のお話'],
};
