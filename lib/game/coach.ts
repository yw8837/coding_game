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

type CoachRepair={file:string;goal:[string,string,string];hints:[[string,string,string],[string,string,string]]};
const REPAIRS:Partial<Record<CoachStage,CoachRepair>>={
 sign:{file:'index.html',goal:['간판을 지우가 부탁한 카페 이름으로 고쳐 주세요. 아래 파일에서 제목을 찾고, 직접 쓴 코드를 저장해 결과를 확인해요.','Change the sign to the café name Jiwoo requested. Find the heading below, save your own source change and inspect the result.','看板をジウが頼んだ店名に直しましょう。下のファイルで見出しを探し、自分で書いたコードを保存して結果を確かめます。'],hints:[['h1은 페이지의 큰 제목이에요. 태그는 두고 그 사이의 글자를 바꿔 보세요.','h1 is the main heading. Keep the tags and change the text between them.','h1は大きな見出しです。タグは残して間の文字を変えます。'],['<h1>Mono Cafe</h1>처럼 쓸 수 있어요. 모노 카페와 モノカフェ도 카페 이름으로 인정해요.','You can write <h1>Mono Cafe</h1>. The Korean and Japanese café names also work.','<h1>モノカフェ</h1>のように書けます。韓国語・英語の店名でも大丈夫です。']]},
 size:{file:'style.css',goal:['휴대폰에서 잘린 메뉴를 모두 볼 수 있게 고쳐 주세요. 화면이 커져도 메뉴가 자연스럽게 채워져야 해요.','Make every drink visible on a phone. The menu should also fill a larger screen naturally.','スマホで切れたメニューをすべて見えるように直しましょう。大きな画面でも自然に広がる必要があります。'],hints:[['고정된 픽셀 너비는 작은 화면에서도 그대로예요. .menu-grid의 너비가 부모 화면을 따라가게 해 보세요.','A fixed pixel width stays the same on a small screen. Make .menu-grid follow its parent width.','固定のピクセル幅は小さい画面でも変わりません。.menu-gridを親の幅に合わせてみましょう。'],['width: 100%;는 부모 너비를 채워요. 코드에서 값을 바꾸고 휴대폰·큰 화면 검사를 실행해 보세요.','width: 100%; fills the parent width. Change the source and run both phone and desktop checks.','width: 100%;は親の幅を満たします。コードを直してスマホと大きな画面を検査しましょう。']]},
 rule:{file:'app.js',goal:['가격과 잔 수가 달라져도 올바른 합계가 나오는 규칙을 만들어 주세요. 0잔 주문은 0원이어야 해요.','Write a rule that works when the price or cup count changes. An order for zero cups must cost zero.','値段や杯数が変わっても正しい合計を出すルールを作りましょう。0杯の注文は0です。'],hints:[['한 잔 가격을 주문한 잔 수만큼 반복하면 전체 값이 돼요. 한 주문의 숫자만 정답으로 쓰면 다른 손님에서 실패해요.','Repeat the unit price for each ordered cup. Returning one order’s total will fail for other customers.','1杯の値段を注文の杯数だけ繰り返すと合計になります。1つの注文の金額を答えにすると別の注文で失敗します。'],['코드의 곱하기 기호는 *예요. return price * quantity; 또는 같은 결과를 내는 산술식을 쓸 수 있어요.','Multiplication in code is *. Use return price * quantity; or an arithmetic expression with the same result.','コードの掛け算は*です。return price * quantity;または同じ結果になる計算式を書けます。']]},
 route:{file:'server.py',goal:['손님이 요청한 주소로 메뉴를 보내 주세요. 왼쪽의 요청 주소와 현재 서버 응답을 비교하고, 연결이 끊긴 원인을 고쳐요.','Send the menu at the address the customer requests. Compare that address with the current server response and repair the missing connection.','お客さんが頼んだアドレスにメニューを返しましょう。左の行き先と今の応答を比べ、接続が切れた原因を直します。'],hints:[['메뉴 요청이 도착할 경로는 MENU_PATH에 있어요. 같은 서버여도 경로가 다르면 메뉴를 찾지 못해요.','MENU_PATH controls where menu requests arrive. A different path on the same server still misses the menu.','MENU_PATHがメニューの行き先を決めます。同じサーバーでもパスが違うと見つかりません。'],['손님 주소는 /api/menu예요. MENU_PATH = "/api/menu"처럼 경로를 문자열로 저장해 보세요.','The customer requests /api/menu. Store that path as a string, for example MENU_PATH = "/api/menu".','お客さんの行き先は/api/menu。MENU_PATH = "/api/menu"のように文字列で保存します。']]},
 keep:{file:'server.py',goal:['주문에 응답한 뒤에도 카페에 주문서가 남도록 고쳐 주세요. 주문을 보내고 주문함에 실제로 남는지 확인해야 해요.','Keep an order slip at the café after responding to an order. Send a real order and verify the slip stays in the box.','注文に応答した後もお店に注文票が残るように直しましょう。実際に送って注文箱に残るか確かめます。'],hints:[['create_order 함수 안에서 주문을 orders에 넣는 부분을 찾아보세요. 어떤 조건일 때 그 줄이 실행될까요?','Find where create_order adds an order to orders. What condition allows that line to run?','create_orderでordersに注文を入れる部分を探しましょう。どの条件でその行が動きますか？'],['SAVE_ORDERS가 True일 때 orders.append(order)가 실행돼요. 설정을 바꾼 뒤 새 서버에서 주문을 시험해 보세요.','When SAVE_ORDERS is True, orders.append(order) runs. Change the setting and test an order on the updated server.','SAVE_ORDERSがTrueのときorders.append(order)が動きます。設定を直し、新しいサーバーで注文を試しましょう。']]}
};
export function coachRepair(stage:CoachStage):CoachRepair|null{return REPAIRS[stage]??null;}
export const COACH_COPY:Record<CoachStage,[string,string,string]>={
 prepare:['카페 화면을 켜 보자','Open the cafe screen','カフェの画面を開こう'],
 inspect:['손님처럼 카페 써 보기','Try the cafe as a customer','お客さんとしてカフェを使おう'],
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
