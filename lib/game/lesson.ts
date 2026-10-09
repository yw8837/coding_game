import {isCafeName} from './cafe-name.ts';
import {calculateTotal,parseBackend,projectFiles,sourceHash,type GameState} from './engine.ts';
import type {AssistAction} from './assisted.ts';
import {MISSIONS} from './content.ts';

export type LessonStep='sign'|'size'|'rule'|'serve'|'route'|'keep'|'trial'|'deliver';
export const LESSON_STEPS:LessonStep[][]=[['sign','size','trial','deliver'],['rule','serve','trial','deliver'],['route','keep','trial','deliver']];
type Choice={id:AssistAction;label:string;note:string};
type Lesson={label:string;title:string;request:string;hint:string;success:string;retry:string;choices:Choice[]};
export const LESSONS:Record<LessonStep,Lesson>={
 serve:{label:'주문 맞추기',title:'이제 내가 카페 직원! 세 손님을 맞아 봐요.',request:'지우: 계산대는 준비됐어요. 주문서에 맞춰 음료를 건네 볼래요?',hint:'주문서의 잔 수를 보고 +와 −로 맞춰요. ‘음료 건네기’를 누르면 다음 손님이 와요. 틀려도 다시 해 볼 수 있어요.',success:'세 손님 모두 받았어요! 내가 고친 계산대로 주문을 마쳤어요.',retry:'주문서의 잔 수와 준비한 잔 수를 다시 비교해 봐요.',choices:[]},
 sign:{label:'간판',title:'우리 카페의 간판을 골라 주세요.',request:'지우: 가게 이름은 ‘모노 카페’예요. 지금은 다른 이름이 붙어 있어요.',hint:'두 간판 중 ‘모노 카페’를 눌러요. 이름이 바뀌는지 바로 볼 수 있어요.',success:'맞아요! 이제 손님이 우리 카페를 찾을 수 있어요.',retry:'이 간판은 빵집 이름이에요. 지우가 말한 카페 이름을 다시 골라 봐요.',choices:[{id:'title-bakery',label:'달빛 빵집',note:'갓 구운 빵을 파는 곳'},{id:'title-cafe',label:'모노 카페',note:'지우가 운영하는 카페'}]},
 size:{label:'메뉴판',title:'휴대폰 안에 메뉴판을 넣어 주세요.',request:'지우: 메뉴판이 너무 커서 옆이 잘려요. 작은 화면에서도 전부 보이면 좋겠어요.',hint:'‘화면에 딱 맞게’를 눌러요. 휴대폰 속 메뉴가 잘리지 않는지 살펴봐요.',success:'메뉴가 쏙 들어왔어요. 이제 손님을 불러 확인해 봐요.',retry:'너무 넓으면 잘리고, 너무 좁으면 읽기 어려워요. 화면 크기에 맞는 방법을 골라요.',choices:[{id:'width-wide',label:'커다란 메뉴판',note:'휴대폰 밖으로 삐져나와요'},{id:'width-fit',label:'화면에 딱 맞게',note:'휴대폰 크기에 따라 늘고 줄어요'},{id:'width-small',label:'아주 작은 메뉴판',note:'메뉴가 좁은 곳에 몰려요'}]},
 rule:{label:'계산대',title:'세 잔 값이 이상해요. 계산 규칙을 바꿔 봐요.',request:'손님: 한 잔에 4,500원이니까, 세 잔은 13,500원이죠?',hint:'4,500원을 세 번 더하면 13,500원이에요. ‘가격 × 잔 수’를 골라요. +와 − 버튼으로 다른 잔 수도 확인할 수 있어요.',success:'영수증이 맞아요! 잔 수를 바꿔도 같은 규칙으로 계산돼요.',retry:'가격에 숫자 3을 더하면 4,503원이 돼요. 한 잔 가격을 잔 수만큼 반복해야 해요.',choices:[{id:'add',label:'가격 + 잔 수',note:'4,500 + 3 = 4,503'},{id:'multiply',label:'가격 × 잔 수',note:'4,500 + 4,500 + 4,500 = 13,500'},{id:'subtract',label:'가격 − 잔 수',note:'4,500 − 3 = 4,497'}]},
 route:{label:'메뉴 연결',title:'손님이 누를 버튼을 메뉴판에 연결해요.',request:'손님: 메뉴 보기 버튼을 눌렀는데 아무것도 안 떠요!',hint:'‘지금 메뉴판으로 연결’을 골라요. 손님의 버튼과 가게 메뉴판 사이에 길이 생겨요.',success:'길이 연결됐어요! 손님의 휴대폰에 메뉴가 도착해요.',retry:'예전 메뉴판은 문을 닫았어요. 지금 사용하는 메뉴판으로 연결해 봐요.',choices:[{id:'route-home',label:'예전 메뉴판으로 연결',note:'더 이상 사용하지 않는 곳'},{id:'route-menu',label:'지금 메뉴판으로 연결',note:'손님 앱에서 찾는 메뉴판'}]},
 keep:{label:'주문함',title:'주문서를 어디에 둘까요?',request:'지우: 주문 알림은 왔는데, 무슨 음료를 만들지 볼 수가 없어요.',hint:'‘주문함에 꽂아 두기’를 골라요. 주문서를 남겨야 지우가 음료를 만들 수 있어요.',success:'주문서가 남았어요. 지우가 주문을 보고 음료를 만들 수 있어요.',retry:'알림만 확인하면 주문 내용이 사라져요. 주문함에 남기는 방법을 골라 봐요.',choices:[{id:'discard-orders',label:'읽고 치우기',note:'알림은 확인했지만 주문서는 사라져요'},{id:'keep-orders',label:'주문함에 꽂아 두기',note:'만들 음료를 나중에도 볼 수 있어요'}]},
 trial:{label:'손님 초대',title:'손님을 불러 직접 써 보게 해요.',request:'민서: 우리가 고친 카페를 손님들이 써 볼 차례야. 아래 버튼을 눌러 봐.',hint:'‘손님 불러 보기’를 눌러요. 불편한 점이 남았다면 ‘고치러 돌아가기’로 다시 고칠 수 있어요.',success:'손님들이 모두 잘 사용했어요. 이제 지우에게 알려 줘요!',retry:'아직 불편한 점이 남았어요. 빨간 항목을 보고 다시 고쳐 봐요.',choices:[]},
 deliver:{label:'지우에게 전달',title:'다 고쳤어요! 지우에게 알려 줄까요?',request:'지우: 어떻게 됐나요? 고친 결과가 정말 궁금해요.',hint:'‘다 고쳤어요!’를 누르면 보상과 다음 이야기가 열려요.',success:'',retry:'바뀐 내용으로 손님 확인을 한 번 더 해 주세요.',choices:[]},
};
export function lessonFacts(s:GameState){
 const fs=projectFiles(s);let rule=false,route=false,keep=false;
 try{rule=[[4500,3],[5000,2],[4500,0],[5500,1]].every(([p,q])=>calculateTotal(fs['app.js']??'',p,q)===p*q);}catch{}
 try{const b=parseBackend(fs['server.py']??'');route=b.route==='/api/menu';keep=b.save;}catch{}
 const fresh=s.tests?.mission===s.mission&&s.tests.hash===sourceHash(fs);
 const trial=!!fresh&&s.tests!.checks.length===MISSIONS[s.mission].checkNames.length&&s.tests!.checks.every(c=>c.passed);
 return {sign:isCafeName(/<h1\b[^>]*>([^<]*)<\/h1>/i.exec(fs['index.html']??'')?.[1]??''),size:/\.menu-grid\s*\{[^}]*width:\s*100%/.test(fs['style.css']??''),rule,serve:rule&&s.gameplay.servedCustomers===3,route,keep,trial,deliver:s.completed.includes(s.mission),fresh:!!fresh};
}
export function resumeLesson(s:GameState):LessonStep{
 const facts=lessonFacts(s);
 return LESSON_STEPS[s.mission].find(step=>!facts[step])??'deliver';
}
