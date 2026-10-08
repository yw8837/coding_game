import {calculateTotal,parseBackend,projectFiles,sourceHash,type GameState} from './engine.ts';
export function questProgress(s:GameState){
 const fs=projectFiles(s),done=s.completed.includes(s.mission),tested=s.tests?.mission===s.mission&&s.tests.hash===sourceHash(fs)&&s.tests.checks.every(c=>c.passed);
 let calculation=false;try{calculation=[[4500,3],[5000,2],[4500,0],[5500,1]].every(([p,q])=>calculateTotal(fs['app.js']??'',p,q)===p*q);}catch{}
 let route=false,keep=false;try{const config=parseBackend(fs['server.py']??'');route=config.route==='/api/menu';keep=config.save;}catch{}
 const tasks=s.mission===0?[
  {label:'바탕화면에서 지우의 메시지 열기',done:s.gameplay.readMessages.includes('welcome')||!!s.repo,kind:'messages'},
  {label:'지우의 첫 의뢰 시작하기',done:!!s.repo,kind:'prepare'},
  {label:'모노 카페 간판 달기',done:/<h1\b[^>]*>[^<]*모노 카페/.test(fs['index.html']??''),kind:'repair'},
  {label:'휴대폰에 메뉴판 크기 맞추기',done:!!(tested||/\.menu-grid\s*\{[^}]*width:\s*100%/.test(fs['style.css']??'')),kind:'repair'},
 ]:s.mission===1?[
  {label:'몇 잔이든 맞는 계산 방법 고르기',done:calculation,kind:'repair'},
 ]:[
  {label:'손님 앱과 메뉴판 주소 연결하기',done:route,kind:'repair'},
  {label:'주문서를 카운터에 보관하기',done:keep,kind:'repair'},
 ];
 tasks.push({label:'손님 테스트 통과하기',done:!!tested,kind:'trial'},{label:'지우에게 결과 전달하기',done,kind:'publish'});
 const steps=tasks.map(t=>({...t,done:done||t.done})),current=steps.find(t=>!t.done);
 return {steps,current,count:steps.filter(t=>t.done).length,complete:done};
}
