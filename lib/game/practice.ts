export type PracticeLanguage='ko'|'en'|'ja';
export type PracticeCopy=Record<PracticeLanguage,string>;
const copy=(ko:string,en:string,ja:string):PracticeCopy=>({ko,en,ja});
export const PRACTICE_IDS=['total','discount','stock','delivery','route','width'] as const;
export type PracticeId=typeof PRACTICE_IDS[number];
export type PracticeValue=number|string|boolean;
export type PracticeCase={input:Record<string,PracticeValue>;expected:PracticeValue};
export type PracticeCaseResult=PracticeCase&{actual:PracticeValue;passed:boolean};
export type PracticeProof={answer:string;passed:boolean;cases:PracticeCaseResult[];error:'syntax'|'unknown'|null};
export type PracticeProgress={completed:PracticeId[];drafts:Partial<Record<PracticeId,string>>;results:Partial<Record<PracticeId,PracticeProof>>};
export function createPractice():PracticeProgress{return {completed:[],drafts:{},results:{}};}
export type PracticeJob={id:PracticeId;title:PracticeCopy;goal:PracticeCopy;guide:PracticeCopy;consequence:PracticeCopy;variables:Record<string,PracticeCopy>;initial:string;credits:number;xp:number;cases:PracticeCase[]};
export const PRACTICE_JOBS:readonly PracticeJob[]=[
 {id:'total',title:copy('계산대의 이상한 합계','The strange checkout total','レジの変な合計'),
  goal:copy('커피 가격과 잔 수로 주문 합계를 계산해 주세요. 0잔이면 0원이에요.','Calculate the order total from the price and cup count. Zero cups cost zero.','コーヒーの価格と杯数から合計を計算してください。0杯なら0です。'),
  guide:copy('형식: price 기호 quantity. + 더하기, - 빼기, * 곱하기, / 나누기. 숫자의 뜻을 보고 기호를 바꿔 보세요.','Format: price operator quantity. + adds, - subtracts, * multiplies, / divides. Choose a rule that fits the meaning of the numbers.','形式: price 演算子 quantity。+ は足し算、- は引き算、* は掛け算、/ は割り算。数の意味から記号を変えてみましょう。'),
  consequence:copy('합계가 맞으면 손님이 주문한 만큼만 돈을 내요.','A correct total charges customers for exactly what they ordered.','正しい合計なら、注文した分だけ支払えます。'),
  variables:{price:copy('한 잔 가격','Price per cup','1杯の価格'),quantity:copy('잔 수','Cup count','杯数')},initial:'price + quantity',credits:25,xp:12,
  cases:[{input:{price:4500,quantity:3},expected:13500},{input:{price:4500,quantity:0},expected:0},{input:{price:3200,quantity:2},expected:6400},{input:{price:1800,quantity:1},expected:1800}]},
 {id:'discount',title:copy('만원부터 할인','Discounts start at 10,000','10,000から割引'),
  goal:copy('합계가 10,000원 이상이면 할인 대상이에요. 딱 10,000원도 포함해 주세요.','Orders of 10,000 or more qualify for a discount. Include exactly 10,000.','合計が10,000以上なら割引対象です。ちょうど10,000も含めてください。'),
  guide:copy('형식: total 비교기호 숫자. > 초과, >= 이상, < 미만, <= 이하, == 같음, != 다름.','Format: total comparison number. > greater, >= at least, < less, <= at most, == equal, != different.','形式: total 比較記号 数字。> はより大きい、>= は以上、< は未満、<= は以下、== は等しい、!= は等しくない。'),
  consequence:copy('경계 금액의 손님도 약속한 할인을 받아요.','Customers at the boundary amount receive the promised discount too.','境界の金額のお客さんも約束した割引を受けられます。'),
  variables:{total:copy('주문 합계','Order total','注文合計')},initial:'total > 10000',credits:25,xp:12,
  cases:[{input:{total:9999},expected:false},{input:{total:10000},expected:true},{input:{total:10001},expected:true},{input:{total:5000},expected:false}]},
 {id:'stock',title:copy('마지막 쿠키 한 개','The last cookie','最後のクッキー'),
  goal:copy('남은 수량이 주문 수량보다 많거나 같으면 주문할 수 있어요. 마지막 한 개도 팔아 주세요.','An order is available when stock is at least the requested quantity. Let customers buy the last cookie too.','在庫が注文数以上なら注文できます。最後の1個も販売してください。'),
  guide:copy('형식: stock 비교기호 requested. >, >=, <, <=, ==, != 중 하나를 입력하세요.','Format: stock comparison requested. Enter one of >, >=, <, <=, ==, !=.','形式: stock 比較記号 requested。>, >=, <, <=, ==, != のいずれかを入力します。'),
  consequence:copy('재고가 충분한 주문은 받고, 부족한 주문은 막아요.','Accept orders that have enough stock and stop orders that do not.','在庫が足りる注文を受け付け、足りない注文を防ぎます。'),
  variables:{stock:copy('남은 수량','Stock left','在庫数'),requested:copy('주문 수량','Requested quantity','注文数')},initial:'stock > requested',credits:25,xp:12,
  cases:[{input:{stock:1,requested:1},expected:true},{input:{stock:3,requested:4},expected:false},{input:{stock:5,requested:2},expected:true},{input:{stock:0,requested:1},expected:false}]},
 {id:'delivery',title:copy('거리만큼 배달비','Delivery fees by distance','距離に応じた配送料'),
  goal:copy('1km마다 배달비가 500원이에요. 거리가 0km면 배달비도 0원이에요.','Delivery costs 500 per kilometer. A distance of zero costs zero.','1kmごとに配送料は500です。距離が0kmなら配送料も0です。'),
  guide:copy('형식: distance 기호 숫자. +, -, *, / 중 하나와 0~100000의 숫자를 사용하세요. 나누는 수는 0일 수 없어요.','Format: distance operator number. Use +, -, *, / and a number from 0 to 100000. A divisor cannot be zero.','形式: distance 演算子 数字。+, -, *, / と0〜100000の数字を使います。0では割れません。'),
  consequence:copy('거리가 달라도 손님에게 같은 km당 요금을 적용해요.','Apply the same per-kilometer rate at every distance.','どの距離でも同じ1kmあたりの料金を適用します。'),
  variables:{distance:copy('거리 · km','Distance · km','距離 · km')},initial:'distance + 500',credits:20,xp:10,
  cases:[{input:{distance:0},expected:0},{input:{distance:1},expected:500},{input:{distance:3},expected:1500},{input:{distance:6},expected:3000}]},
 {id:'route',title:copy('메뉴가 도착할 주소','The menu destination','メニューの送り先'),
  goal:copy('손님 앱이 /api/menu로 메뉴를 요청해요. 그 주소에는 200, 다른 주소에는 404가 나오게 연결해 주세요.','The customer app requests /api/menu. Connect that address to return 200, and other addresses to return 404.','お客さんのアプリは/api/menuを要求します。そのアドレスは200、別のアドレスは404になるようにしてください。'),
  guide:copy('형식: /로 시작하는 주소 하나. 영문·숫자·/·-·_를 사용할 수 있어요. 200은 찾음, 404는 못 찾음이에요.','Format: one address starting with /. Use letters, numbers, /, - or _. 200 means found; 404 means not found.','形式: /で始まるアドレスを1つ入力。英字、数字、/、-、_が使えます。200は見つかった、404は見つからないという意味です。'),
  consequence:copy('주소가 일치해야 손님 앱에 메뉴가 도착해요.','The addresses must match for the customer app to receive the menu.','アドレスが一致すると、お客さんのアプリにメニューが届きます。'),
  variables:{url:copy('요청 주소','Requested address','要求アドレス')},initial:'/menu',credits:20,xp:10,
  cases:[{input:{url:'/api/menu'},expected:200},{input:{url:'/menu'},expected:404},{input:{url:'/api/orders'},expected:404}]},
 {id:'width',title:copy('어떤 화면에도 맞는 메뉴','A menu for every screen','どの画面にも合うメニュー'),
  goal:copy('메뉴 너비를 화면의 사용 가능한 너비와 같게 해 주세요. 휴대폰에서도 옆으로 넘치면 안 돼요.','Make the menu match the available screen width. It must fit on a phone too.','メニューの幅を画面の使用可能な幅と同じにしてください。スマホでもはみ出さないようにしましょう。'),
  guide:copy('형식: 숫자 뒤에 px 또는 %. px는 고정 크기, %는 화면 너비에 대한 비율이에요. 예: 600px, 50%.','Format: a number followed by px or %. px is a fixed size; % is a share of the screen width. Examples: 600px, 50%.','形式: 数字の後にpxまたは%。pxは固定サイズ、%は画面の幅に対する割合です。例: 600px、50%。'),
  consequence:copy('너비가 맞으면 모든 화면에서 메뉴가 잘리지 않아요.','A matching width keeps the menu from being cut off on any screen.','幅が合えば、どの画面でもメニューが切れません。'),
  variables:{viewport:copy('사용 가능한 너비 · px','Available width · px','使用可能な幅 · px')},initial:'960px',credits:25,xp:12,
  cases:[{input:{viewport:360},expected:360},{input:{viewport:768},expected:768},{input:{viewport:1024},expected:1024}]},
];

export function practiceJob(id:string):PracticeJob|undefined{return PRACTICE_JOBS.find(job=>job.id===id);}
type Rule={kind:'arithmetic';operator:string;right:'quantity'|number}|{kind:'comparison';operator:string;right:'requested'|number}|{kind:'route';path:string}|{kind:'width';amount:number;unit:'px'|'%'};
function parseRule(id:PracticeId,answer:string):Rule|null{
 const arithmetic=id==='total'||id==='delivery';
 if(arithmetic){
  const match=answer.match(id==='total'?/^price\s*([+*/-])\s*quantity$/:/^distance\s*([+*/-])\s*(\d+(?:\.\d+)?)$/);
  if(!match)return null;
  const right=id==='total'?'quantity':Number(match[2]);
  if(typeof right==='number'&&(right>100000||(match[1]==='/'&&right===0)))return null;
  return {kind:'arithmetic',operator:match[1],right};
 }
 if(id==='discount'||id==='stock'){
  const match=answer.match(id==='discount'?/^total\s*(>=|<=|==|!=|>|<)\s*(\d+(?:\.\d+)?)$/:/^stock\s*(>=|<=|==|!=|>|<)\s*requested$/);
  if(!match)return null;
  const right=id==='stock'?'requested':Number(match[2]);
  if(typeof right==='number'&&right>100000)return null;
  return {kind:'comparison',operator:match[1],right};
 }
 if(id==='route')return /^\/[A-Za-z0-9/_-]*$/.test(answer)?{kind:'route',path:answer}:null;
 const width=answer.match(/^(\d+(?:\.\d+)?)\s*(px|%)$/);
 if(!width||Number(width[1])>100000)return null;
 return {kind:'width',amount:Number(width[1]),unit:width[2] as 'px'|'%'};
}
/** A deliberately small grammar. User input is never JavaScript code. */
export function validatePracticeAnswer(id:string,answer:string):{valid:boolean}{
 const job=practiceJob(id);
 return {valid:!!job&&typeof answer==='string'&&answer.length<=80&&!!parseRule(job.id,answer.trim())};
}
function runRule(rule:Rule,input:PracticeCase['input']):PracticeValue{
 if(rule.kind==='route')return input.url===rule.path?200:404;
 if(rule.kind==='width')return rule.unit==='px'?rule.amount:Number(input.viewport)*rule.amount/100;
 const left=Number(input[rule.kind==='comparison'?(typeof rule.right==='number'?'total':'stock'):(typeof rule.right==='number'?'distance':'price')]);
 const right=typeof rule.right==='number'?rule.right:Number(input[rule.right]);
 if(rule.kind==='arithmetic'){
  if(rule.operator==='+')return left+right;
  if(rule.operator==='-')return left-right;
  if(rule.operator==='*')return left*right;
  return right===0?'undefined':left/right;
 }
 switch(rule.operator){case'>':return left>right;case'>=':return left>=right;case'<':return left<right;case'<=':return left<=right;case'==':return left===right;default:return left!==right;}
}
export function evaluatePractice(id:string,answer:string):PracticeProof{
 const job=practiceJob(id),safeAnswer=typeof answer==='string'?answer.slice(0,80):'';
 const failure=(error:'unknown'|'syntax'):PracticeProof=>({answer:safeAnswer,passed:false,cases:[],error});
 if(!job)return failure('unknown');
 if(!validatePracticeAnswer(id,answer).valid)return failure('syntax');
 const rule=parseRule(job.id,answer.trim())!;
 const cases=job.cases.map(c=>{const actual=runRule(rule,c.input);return {input:{...c.input},expected:c.expected,actual,passed:actual===c.expected};});
 return {answer:safeAnswer,passed:cases.every(c=>c.passed),cases,error:null};
}
