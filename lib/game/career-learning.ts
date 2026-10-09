import {CAREER_JOBS,L,type Localized} from './career-content.ts';

type Value=string|number|boolean|string[];
type Target={kind:'json';path:string[]}|{kind:'csv';key:string;row:string;column:string}|{kind:'html';tag:'label'|'input'|'button';attribute:string}|{kind:'css';property:string};
export type CareerLearningStep={id:string;file:string;target:Target;correct:Value;choices:Value[];title:Localized;why:Localized;expression?:{correct:string;wrong:string}};
const j=(file:string,key:string,correct:Value,wrong:Value,title:Localized,why:Localized,expression?:CareerLearningStep['expression']):CareerLearningStep=>({id:key,file,target:{kind:'json',path:key.split('.')},correct,choices:[wrong,correct],title,why,expression});
const c=(file:string,key:string,row:string,column:string,correct:Value,wrong:Value,title:Localized,why:Localized):CareerLearningStep=>({id:row+'-'+column,file,target:{kind:'csv',key,row,column},correct,choices:[correct,wrong],title,why});
const h=(tag:'label'|'input'|'button',attribute:string,correct:Value,wrong:Value,title:Localized,why:Localized):CareerLearningStep=>({id:tag+'-'+attribute,file:'booking.html',target:{kind:'html',tag,attribute},correct,choices:[wrong,correct],title,why});
const css=(property:string,correct:string,wrong:string,title:Localized,why:Localized):CareerLearningStep=>({id:property,file:'gallery.css',target:{kind:'css',property},correct,choices:[correct,wrong],title,why});

/** Authored one-value edits, never a whole answer applied behind a button. */
export const CAREER_LEARNING:Record<string,CareerLearningStep[]>={
 'bakery-price':[
  j('pricing.json','packSize',6,5,L('상자 하나에 빵을 몇 개 담을까요?','How many rolls fit in one box?','1箱にパンを何個入れますか？'),L('6개씩 묶으면 8개는 상자 하나와 낱개 둘이 됩니다. packSize는 묶는 개수예요.','Boxes of six turn eight rolls into one box and two singles. packSize is the number in a box.','6個ずつなら8個は1箱と単品2個です。packSizeは箱の個数です。')),
  j('pricing.json','packPrice',10000,10800,L('한 상자의 가격을 입력해 주세요.','Enter the price of a box.','1箱の価格を入力しましょう。'),L('상자 가격 10,000원에 남은 낱개 가격만 더합니다. packPrice는 낱개 가격과 별도예요.','Start with the 10,000 box price and add only the remaining singles. packPrice is separate from the single price.','箱の10,000に残りの単品だけを足します。packPriceは単品価格とは別です。')),
 ],
 'library-loans':[
  j('policy.json','inclusive',true,false,L('딱 3권도 빌릴 수 있게 할까요?','Allow exactly three books too?','ちょうど3冊も借りられるようにしますか？'),L('true는 이 규칙을 켭니다. inclusive를 켜면 총 3권까지 허용해요.','true turns this rule on. inclusive includes the limit of three.','trueはこのルールを有効にします。inclusiveなら上限3冊も含みます。')),
  j('policy.json','allowOverdue',false,true,L('연체 중에도 새 책을 빌려 줄까요?','Allow new loans while overdue?','延滞中も新しく貸し出しますか？'),L('false는 허용하지 않는다는 뜻입니다. 연체 중 새 대출을 막되 기존 기록은 남아요.','false means do not allow it. It blocks new overdue loans while keeping the records.','falseは許可しないという意味です。延滞中の新しい貸出を防ぎ、記録は残します。')),
 ],
 'florist-stock':[
  c('inventory.csv','name','rose','reserved',5,1,L('장미 12송이 중 예약한 5송이를 남겨 주세요.','Reserve five of the twelve roses.','バラ12本のうち予約の5本を残しましょう。'),L('판매 가능한 수량은 stock에서 reserved를 뺍니다. 12 − 5 = 7송이예요.','Available stock is stock minus reserved: 12 − 5 = 7.','販売可能数はstockからreservedを引きます。12 − 5 = 7本です。')),
  c('inventory.csv','name','lily','reserved',3,0,L('백합 3송이는 모두 예약됐어요. 몇 송이를 남길까요?','All three lilies are reserved. How many stay aside?','ユリ3本はすべて予約済み。何本残しますか？'),L('3 − 3 = 0. 총 재고를 지우지 않고 예약 칸만 바꾸면 예약과 판매를 구분할 수 있어요.','3 − 3 = 0. Changing reservations keeps total stock and separates reserved flowers from sales.','3 − 3 = 0。総在庫を消さず予約欄だけを変えると、予約と販売を分けられます。')),
 ],
 'bike-hours':[
  j('hours.json','lastEntry',17,18,L('폐점 한 시간 전, 마지막 접수는 몇 시일까요?','Last drop-off is one hour before closing. What hour?','閉店1時間前、最終受付は何時ですか？'),L('17은 오후 5시입니다. lastEntry를 바꾸면 18시에 접수하지 않고 17시까지 받습니다.','17 means 5 pm. lastEntry accepts arrivals through 17:00 and stops 18:00 drop-offs.','17は午後5時です。lastEntryを変えると17時まで受付し、18時は断ります。')),
  j('hours.json','closedDays',['sun'],[],L('일요일에는 쉬도록 정해 주세요.','Make Sunday a closed day.','日曜日を休みにしましょう。'),L('목록에 sun을 넣으면 일요일의 모든 접수가 닫힙니다. 다른 요일은 그대로예요.','Putting sun in the list closes every Sunday drop-off. Other days stay open.','一覧にsunを入れると日曜の受付が閉じます。他の曜日はそのままです。')),
 ],
 'contacts-clean':[
  j('clean.json','trim',true,false,L('주소 앞뒤의 빈칸을 지울까요?','Remove spaces around addresses?','アドレス前後の空白を消しますか？'),L('trim은 앞뒤 공백만 지웁니다. 주소 안의 글자는 그대로 남아요.','trim removes only surrounding spaces. Characters inside the address stay unchanged.','trimは前後の空白だけを消します。中の文字は変わりません。')),
  j('clean.json','lowercase',true,false,L('대문자와 소문자를 같은 주소로 맞출까요?','Normalize uppercase and lowercase addresses?','大文字と小文字を同じ表記にしますか？'),L('소문자로 맞추면 LUNA와 luna를 같은 연락처로 비교할 수 있어요.','Lowercasing lets LUNA and luna compare as the same contact.','小文字にそろえるとLUNAとlunaを同じ連絡先として比べられます。')),
  j('clean.json','deduplicate',true,false,L('같은 주소에는 한 번만 보낼까요?','Send just once to the same address?','同じアドレスには1回だけ送りますか？'),L('deduplicate는 정리한 주소가 겹치면 한 개만 남깁니다. 원본 명단은 지우지 않아요.','deduplicate keeps one normalized address per contact. The source list is not deleted.','deduplicateは同じ整理済みアドレスを1つだけ残します。元の名簿は消しません。')),
  j('clean.json','skipBlank',true,false,L('주소가 없는 행은 발송에서 뺄까요?','Skip rows without an address?','アドレスのない行を送信から除きますか？'),L('빈 주소를 제외하면 실제 보낼 수 있는 두 사람만 남습니다.','Skipping blanks leaves the two contacts you can actually reach.','空欄を除くと、実際に送れる2人だけが残ります。')),
 ],
 'clinic-form':[
  h('label','for','name','guest',L('이름표를 name 입력 칸에 연결해 주세요.','Connect the label to the name input.','名前ラベルをname入力欄につなげましょう。'),L('label의 for와 input의 id가 같으면 이름표가 해당 칸을 가리킵니다.','Matching label for and input id connects the label to its field.','labelのforとinputのidが同じなら、そのラベルが入力欄を指します。')),
  h('input','required',true,false,L('이름이 비어 있으면 예약을 멈출까요?','Stop bookings when the name is empty?','名前が空なら予約を止めますか？'),L('required는 이 칸이 필수라는 표시입니다. 빈 이름은 제출할 수 없어요.','required marks a mandatory field. An empty name cannot be submitted.','requiredは必須欄の印です。空の名前では送信できません。')),
  h('button','type','submit','button',L('예약 버튼을 제출하는 버튼으로 바꿔 주세요.','Make the booking button submit the form.','予約ボタンを送信ボタンにしましょう。'),L('submit은 폼을 제출합니다. button은 혼자 누를 수 있지만 폼 제출을 맡지 않아요.','submit sends the form. button can be clicked but does not submit it.','submitはフォームを送信します。buttonは押せても送信は担当しません。')),
 ],
 'market-filter':[
  j('filter.json','operator','>','>=',L('재고가 0보다 큰 상품만 남기려면 어떤 기호일까요?','Which symbol keeps stock greater than zero?','在庫が0より多い商品を残す記号は？'),L('>는 초과입니다. stock > 0이면 재고 0인 milk가 빠집니다.','> means greater than. stock > 0 excludes milk with no stock.','>はより大きいという意味。stock > 0なら在庫0のmilkを除けます。')),
  j('filter.json','requireFresh',true,false,L('신선한 상품 조건도 켜 주세요. true 또는 false를 입력하세요.','Enable the fresh-only condition. Enter true or false.','新鮮な商品だけにします。trueかfalseを入力しましょう。'),L('두 조건을 모두 만족해야 합니다. 재고가 있어도 신선하지 않은 candy는 빠져요.','Both conditions must hold. Candy is excluded even with stock because it is not fresh.','両方の条件が必要です。在庫があっても新鮮でないcandyは除きます。')),
 ],
 'school-sort':[
  j('sort.json','direction','desc','asc',L('높은 점수부터: desc 또는 asc 중 하나를 입력하세요.','Highest scores first: enter desc or asc.','高い点数から並べます。descかascを入力しましょう。'),L('desc는 큰 값부터 줄어드는 순서입니다. 동점일 때는 기존 name 규칙을 씁니다.','desc orders large values first. The existing name rule breaks ties.','descは大きい値から減る順です。同点では既存のnameルールを使います。')),
 ],
 'workshop-slots':[
  c('schedule.csv','id','B','start','10:00','09:45',L('A가 끝나는 10:00에 B를 시작해 주세요.','Start B at 10:00, when A ends.','Aが終わる10:00にBを始めましょう。'),L('끝나는 시각과 시작하는 시각이 같으면 겹치지 않습니다. B는 10:00부터 11:00까지 60분이에요.','Matching an end and a start avoids overlap. B runs 60 minutes from 10:00 to 11:00.','終了と開始が同じなら重なりません。Bは10:00から11:00まで60分です。')),
 ],
 'delivery-fees':[
  j('delivery.json','freeAt',20000,25000,L('무료 배달을 시작하는 주문 금액을 입력하세요.','Enter the order amount for free delivery.','無料配達になる注文額を入力しましょう。'),L('freeAt 이상인 주문은 배달비가 0입니다. 딱 20,000원도 포함해요.','Orders at or above freeAt cost zero for delivery, including exactly 20,000.','freeAt以上なら配達料は0です。ちょうど20,000も含みます。')),
  j('delivery.json','maxKm',10,20,L('배달 가능한 마지막 거리를 km로 입력하세요.','Enter the maximum delivery distance in km.','配達できる最長距離をkmで入力しましょう。'),L('10km까지는 받고 11km는 거절합니다. 무료 주문도 거리 한도를 먼저 확인해요.','Accept through 10km and reject 11km. Check the distance cap even for free orders.','10kmまでは受け、11kmは断ります。無料注文も先に距離上限を確認します。')),
 ],
 'museum-layout':[
  css('width','100%','960px',L('화면에 맞도록 너비 빈칸에 100%를 입력하세요.','Fill the width with 100% to fit the screen.','画面に合う幅として100%を入力しましょう。'),L('%는 사용할 수 있는 화면 너비의 비율입니다. 작은 화면에서는 작은 너비가 됩니다.','% is a share of available screen width. A smaller screen produces a smaller width.','%は使える画面幅の割合です。小さい画面なら幅も小さくなります。')),
  css('box-sizing','border-box','content-box',L('여백을 너비 안에 포함하려면 border-box를 입력하세요.','Enter border-box to include padding inside the width.','余白を幅に含めるためborder-boxを入力しましょう。'),L('border-box는 여백을 이미 정한 너비에 포함합니다. 여백 때문에 화면 밖으로 더 커지지 않아요.','border-box includes padding in the chosen width. Padding no longer adds extra overflow.','border-boxは余白を指定幅に含めます。余白で画面外に広がらなくなります。')),
 ],
 'bookstore-invoice':[
  j('invoice.json','discountMin',15000,18000,L('할인을 시작할 금액을 입력하세요.','Enter the amount at which the discount starts.','割引を始める金額を入力しましょう。'),L('15,000원 이상이면 2,000원을 할인합니다. 할인액 자체는 이미 맞아요.','At 15,000 or more, subtract 2,000. The discount amount is already correct.','15,000以上なら2,000引きます。割引額自体は合っています。')),
  j('invoice.json','discountBeforeTax',true,false,L('할인 후에 세금을 계산할까요? true 또는 false.','Calculate tax after the discount? true or false.','割引後に税を計算しますか？trueかfalse。'),L('할인을 먼저 빼야 실제로 낸 금액에 세금이 붙습니다. 계산 순서도 결과를 바꿔요.','Subtract the discount first so tax applies to the paid amount. Calculation order changes results.','先に割引を引くと、支払う額に税が付きます。計算の順序も結果を変えます。')),
 ],
 'community-api':[
  j('routes.json','read.path','/api/events','/events',L('read 안의 JSON 한 줄: "path": "/api/events"','One JSON property inside read: "path": "/api/events"','read内のJSON1行: "path": "/api/events"'),L('클라이언트가 요청하는 주소와 서버 설정의 주소가 같아야 목록을 찾을 수 있어요.','The requested address must match the server setting to find the list.','要求するアドレスとサーバー設定が同じなら一覧が見つかります。')),
  j('routes.json','read.method','GET','POST',L('read 안의 읽기 방법: "method": "GET"','Reading method inside read: "method": "GET"','read内の読み取り方法: "method": "GET"'),L('GET은 읽기, POST는 보내기입니다. 같은 주소라도 목적에 맞는 방법을 골라야 해요.','GET reads and POST sends. Even at one address, the method must match the purpose.','GETは読み取り、POSTは送信です。同じアドレスでも目的に合う方法が必要です。')),
  j('routes.json','persist',true,false,L('신청을 남기는 JSON: "persist": true','Keep registrations in JSON: "persist": true','申込を残すJSON: "persist": true'),L('응답 성공과 보관 성공은 다릅니다. persist가 켜져야 받은 신청을 남깁니다.','A successful reply is different from storage. persist keeps accepted registrations.','応答成功と保存成功は別です。persistで受けた申込を残します。')),
 ],
 'photo-cache':[
  j('cache.json','privateMaxAge',0,86400,L('개인 화면은 남기지 않기: "privateMaxAge": 0','Do not keep private pages: "privateMaxAge": 0','個人画面を残さない: "privateMaxAge": 0'),L('0초는 개인 화면을 재사용하지 않겠다는 뜻입니다. 공개 로고의 86,400초는 그대로 둡니다.','Zero seconds avoids reusing private pages. Keep the public logo at 86,400 seconds.','0秒は個人画面を再利用しないという意味です。公開ロゴの86,400秒はそのままです。')),
  j('cache.json','varyAuth',true,false,L('로그인한 사람 구분: "varyAuth": true','Separate signed-in users: "varyAuth": true','ログインした人を区別: "varyAuth": true'),L('같은 주소라도 사용자별로 결과를 나눠야 다른 사람 사진이 섞이지 않아요.','Separate results by user even at the same address to avoid mixing people’s photos.','同じアドレスでも利用者別に分けると他人の写真が混ざりません。')),
 ],
 'transit-logs':[
  j('report.json','level','ERROR','WARN',L('실패 등급 고르기: "level": "ERROR"','Select failure level: "level": "ERROR"','失敗等級を選ぶ: "level": "ERROR"'),L('ERROR 행만 세면 단순 경고 WARN과 실제 실패를 구분합니다.','Counting ERROR rows separates real failures from WARN warnings.','ERRORだけを数えると、WARNの注意と実際の失敗を分けられます。')),
  j('report.json','status',503,404,L('일시 장애 코드: "status": 503','Temporary outage code: "status": 503','一時障害の番号: "status": 503'),L('등급과 상태를 함께 걸러야 찾으려던 세 번의 장애만 남습니다. 원본 로그는 유지해요.','Filter both level and status to keep the three relevant outages. Preserve the original log.','等級と状態の両方で選ぶと、探していた3回の障害だけが残ります。元ログは保持します。')),
 ],
 'archive-backup':[
  j('retention.json','inclusive',true,false,L('7일도 포함하는 식: daysOld <= 7','Include day seven: daysOld <= 7','7日も含める式: daysOld <= 7'),L('<=는 이하입니다. 일주일째 사본은 남고 8일 전 사본은 빠집니다. 이 식이 inclusive를 켭니다.','<= means at most. Keep the seventh-day copy, exclude day eight. This expression enables inclusive.','<=は以下です。7日前を残し8日前を除きます。この式はinclusiveを有効にします。'),{correct:'daysOld <= 7',wrong:'daysOld < 7'}),
 ],
 'tutor-timezone':[
  j('timezone.json','offsetHours',9,0,L('UTC에 더할 시간: "offsetHours": 9','Hours added to UTC: "offsetHours": 9','UTCに足す時間: "offsetHours": 9'),L('UTC 23시에 9시간을 더하면 32시입니다. 시각만 보면 다음 날 08시가 돼요.','UTC 23 plus nine is 32. On the clock it becomes 08:00 the next day.','UTC23時に9時間を足すと32時です。時計では翌日の08時になります。')),
  j('timezone.json','carryDay',true,false,L('넘긴 날짜도 옮기기: "carryDay": true','Carry the date too: "carryDay": true','日付も繰り越す: "carryDay": true'),L('24시간을 넘겼다면 날짜를 하루 더합니다. 시각과 날짜를 함께 옮겨야 수업을 놓치지 않아요.','Crossing 24 hours advances the date. Shift the hour and date together to keep the lesson time.','24時間を超えたら日付を1日進めます。時刻と日付を一緒に動かすと授業時間が合います。')),
 ],
 'festival-report':[
  j('summary.json','includeStatus','paid','all',L('받은 돈만 선택: "includeStatus": "paid"','Choose received money: "includeStatus": "paid"','受取金だけを選ぶ: "includeStatus": "paid"'),L('환불과 미결제는 받은 돈이 아닙니다. paid 행만 합쳐야 실제 수입이 나와요.','Refunds and pending payments are not received money. Sum paid rows for actual income.','返金と未払いは受取金ではありません。paid行だけで実際の収入を出します。')),
  j('summary.json','operation','multiply','add',L('한 행의 금액을 구하는 식: quantity * unit','Amount per row: quantity * unit','1行の金額を求める式: quantity * unit'),L('수량 × 단가가 한 행의 금액입니다. 그 금액을 booth별로 더하면 전체 18,000원이 됩니다.','Quantity × unit price is each row’s amount. Sum by booth to get a total of 18,000.','数量 × 単価が1行の金額です。booth別に足すと全体18,000になります。'),{correct:'quantity * unit',wrong:'quantity + unit'}),
 ],
};

function object(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function csvCells(line:string):string[]{const values:string[]=[];let cell='',quoted=false,closed=false;for(let i=0;i<line.length;i++){const ch=line[i];if(quoted){if(ch==='"'){if(line[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=ch;}else if(ch===','){values.push(cell);cell='';closed=false;}else if(ch==='"'){if(cell||closed)throw Error('format');quoted=true;}else{if(closed&&ch.trim())throw Error('format');if(!closed)cell+=ch;}}if(quoted)throw Error('format');values.push(cell);return values;}
const csvCell=(value:string)=>/[",\n]/.test(value)?'"'+value.replaceAll('"','""')+'"':value;
function tag(source:string,name:string):RegExpMatchArray{if(/<\s*(script|iframe|object|embed|style|link)\b|\bon\w+\s*=|javascript\s*:/i.test(source)||!/<form\b/i.test(source)||!/<\/form\s*>/i.test(source))throw Error('format');const found=source.match(new RegExp('<'+name+'\\b[^>]*>','i'));if(!found)throw Error('format');return found;}
function readOrWrite(source:string,step:CareerLearningStep,value?:Value):{value:Value;content:string}{
 if(typeof source!=='string'||source.length>20000)throw Error('format');const target=step.target;
 if(target.kind==='json'){const root:unknown=JSON.parse(source);if(!object(root))throw Error('format');let parent=root;for(const part of target.path.slice(0,-1)){if(!object(parent[part]))throw Error('format');parent=parent[part] as Record<string,unknown>;}const key=target.path.at(-1)!;if(!Object.hasOwn(parent,key))throw Error('format');const current=parent[key];if(Array.isArray(step.correct)?!Array.isArray(current)||!current.every(v=>typeof v==='string'):typeof current!==typeof step.correct)throw Error('format');if(value!==undefined)parent[key]=value;return {value:(value??current) as Value,content:value===undefined?source:JSON.stringify(root,null,2)+'\n'};}
 if(target.kind==='csv'){const lines=source.split(/\r?\n/);if(lines.length>102)throw Error('format');const header=csvCells(lines[0]),key=header.indexOf(target.key),column=header.indexOf(target.column);if(key<0||column<0)throw Error('format');const indexes=lines.map((line,index)=>index&&line&&csvCells(line)[key]===target.row?index:-1).filter(index=>index>=0);if(indexes.length!==1)throw Error('format');const index=indexes[0],cells=csvCells(lines[index]);if(cells.length!==header.length)throw Error('format');const current=typeof step.correct==='number'?Number(cells[column]):cells[column];if(typeof current==='number'&&(!Number.isFinite(current)||!/^\d+$/.test(cells[column])))throw Error('format');if(value!==undefined){cells[column]=String(value);lines[index]=cells.map(csvCell).join(',');}return {value:value??current,content:value===undefined?source:lines.join('\n')};}
 if(target.kind==='css'){if(!/^\s*\.gallery\s*\{[^{}]*\}\s*$/.test(source))throw Error('format');const pattern=new RegExp('([{;]\\s*'+target.property+'\\s*:\\s*)([^;{}]+)(;?)');const found=source.match(pattern);if(!found)throw Error('format');return {value:value??found[2].trim(),content:value===undefined?source:source.replace(pattern,(_,prefix:string,_old:string,end:string)=>prefix+String(value)+end)};}
 const found=tag(source,target.tag),attribute=new RegExp('\\s'+target.attribute+'(?:\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+)))?','i'),match=found[0].match(attribute);
 const current=target.attribute==='required'?!!match:match?.[1]??match?.[2]??match?.[3];if(current===undefined)throw Error('format');
 if(value===undefined)return {value:current,content:source};let changed=found[0].replace(attribute,'');if(target.attribute==='required'){if(value===true)changed=changed.replace(/\/?\s*>$/,' required>');}else{changed=changed.replace(/\/?\s*>$/,' '+target.attribute+'="'+String(value)+'">');}return {value,content:source.slice(0,found.index!)+changed+source.slice(found.index!+found[0].length)};
}

export function careerLearningSteps(id:string):CareerLearningStep[]{return CAREER_LEARNING[id]??[];}
export function learningInput(step:CareerLearningStep,value:Value,act:number):string{if(act===3){if(step.expression)return value===step.correct?step.expression.correct:step.expression.wrong;if(step.target.kind==='json')return JSON.stringify(step.target.path.at(-1))+': '+JSON.stringify(value);if(step.target.kind==='css')return step.target.property+': '+String(value)+';';}return typeof value==='string'?value:JSON.stringify(value);}
export function learningStepState(step:CareerLearningStep,files:Record<string,string>){try{const read=readOrWrite(files[step.file],step);return {supported:true,current:read.value,done:JSON.stringify(read.value)===JSON.stringify(step.correct)};}catch{return {supported:false,current:null,done:false};}}
export function learningProgress(id:string,files:Record<string,string>){const steps=careerLearningSteps(id);const states=steps.map(step=>learningStepState(step,files));return {steps,states,done:states.filter(state=>state.done).length,blockedFiles:[...new Set(steps.filter((_,index)=>!states[index].supported).map(step=>step.file))]};}
function parseInput(step:CareerLearningStep,input:string,act:number):Value{
 let raw=input.trim();if(raw.length>100)throw Error('input');if(act===3){if(step.expression){if(raw===step.expression.correct)return step.correct;if(raw===step.expression.wrong)return step.choices.find(value=>JSON.stringify(value)!==JSON.stringify(step.correct))!;throw Error('input');}if(step.target.kind==='json'){const fragment:unknown=JSON.parse('{'+raw.replace(/,\s*$/,'')+'}'),key=step.target.path.at(-1)!;if(!object(fragment)||Object.keys(fragment).length!==1||!Object.hasOwn(fragment,key))throw Error('input');raw=JSON.stringify(fragment[key]);}else if(step.target.kind==='css'){const match=raw.match(new RegExp('^'+step.target.property+'\\s*:\\s*(.+?);?$'));if(!match)throw Error('input');raw=match[1];}}
 if(typeof step.correct==='boolean'){if(raw==='true')return true;if(raw==='false')return false;throw Error('input');}
 if(typeof step.correct==='number'){if(!/^-?\d+(?:\.\d+)?$/.test(raw))throw Error('input');const value=Number(raw);if(!Number.isFinite(value)||Math.abs(value)>10000000||(Number.isInteger(step.correct)&&!Number.isInteger(value)))throw Error('input');return value;}
 if(Array.isArray(step.correct)){const value:unknown=JSON.parse(raw);if(!Array.isArray(value)||!value.every(v=>typeof v==='string')||value.length>7)throw Error('input');return value;}
 const value=raw.startsWith('"')?JSON.parse(raw):raw;if(typeof value!=='string'||!value||value.length>80||/[\n\r"\\]/.test(value))throw Error('input');if(step.target.kind==='html'&&!/^[A-Za-z][\w-]*$/.test(value))throw Error('input');if(step.target.kind==='css'&&!/^\d+(?:\.\d+)?(?:px|%)$|^(?:content-box|border-box)$/.test(value))throw Error('input');return value;
}
export function applyLearningStep(id:string,stepId:string,files:Record<string,string>,input:string):{ok:true;file:string;content:string;correct:boolean}|{ok:false;reason:'unknown'|'format'|'input'}{
 const job=CAREER_JOBS.find(job=>job.id===id),step=careerLearningSteps(id).find(step=>step.id===stepId);if(!job||!step)return {ok:false,reason:'unknown'};let value:Value;try{value=parseInput(step,input,job.act);}catch{return {ok:false,reason:'input'};}try{const changed=readOrWrite(files[step.file],step,value);if(changed.content.length>20000)return {ok:false,reason:'format'};return {ok:true,file:step.file,content:changed.content,correct:JSON.stringify(value)===JSON.stringify(step.correct)};}catch{return {ok:false,reason:'format'};}
}
export function restoreLearningFile(id:string,file:string):string|null{const job=CAREER_JOBS.find(job=>job.id===id);return job&&Object.hasOwn(job.files,file)?job.files[file]:null;}
