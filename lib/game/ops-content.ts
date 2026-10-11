/** Python automation and SQL database jobs (curriculum stages 3 and 4).
 * Every person, record and amount below belongs to the simulation. */
import type {SqlDatabase} from './sql-engine.ts';

export type OpsLanguage='ko'|'en'|'ja';
export type OpsCopy=Record<OpsLanguage,string>;
export type OpsTrack='python'|'sql';
export type OpsScene='receipt'|'shelf'|'contacts'|'chart'|'notices'|'menu'|'flyer'|'podium'|'queue'|'dashboard';
type OpsBase={id:string;track:OpsTrack;client:OpsCopy;title:OpsCopy;brief:OpsCopy;goal:OpsCopy;concepts:OpsCopy;hints:OpsCopy[];thanks:OpsCopy;scene:OpsScene;credits:number;xp:number;main:string;reference:string;files:Record<string,string>};
export type PythonJob=OpsBase&{track:'python';data:Record<string,string>[]};
export type SqlJob=OpsBase&{track:'sql';db:string;data:SqlDatabase[];ordered:boolean};
export type OpsJob=PythonJob|SqlJob;
const c=(ko:string,en:string,ja:string):OpsCopy=>({ko,en,ja});
export const OPS_ROOTS:Record<OpsTrack,string>={python:'/home/dev/automation',sql:'/home/dev/database'};
export const DB_MARKER='#lh-db:';
/** A simulated database file: readable text that points sqlite3 at authored tables. */
export const dbFile=(id:string,name:string)=>`SQLite format 3\n(binary database. Open it with: sqlite3 ${name})\n${DB_MARKER}${id}\n`;

const csv=(header:string,rows:(string|number)[][])=>header+'\n'+rows.map(row=>row.map(String).join(',')).join('\n')+'\n';
const RECEIPT_REFERENCE=`import csv

total = 0
with open('orders.csv', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        line = int(row['price']) * int(row['qty'])
        total += line
        print(f"{row['item']} x{row['qty']} = {line:,}")
print(f"TOTAL {total:,}")
`;
const RESTOCK_REFERENCE=`import csv

LOW = 5
count = 0
with open('stock.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

for row in rows:
    if int(row['stock']) < LOW:
        print(f"ORDER {row['name']} ({row['stock']} left)")
        count += 1

print(f"{count} flowers to order")
`;
const CONTACTS_REFERENCE=`emails = []
with open('signups.txt', encoding='utf-8') as f:
    for line in f:
        email = line.strip().lower()
        if email == '':
            continue
        if email not in emails:
            emails.append(email)

print(f"{len(emails)} members")
for email in emails:
    print(email)
`;
const TALLY_REFERENCE=`import csv

totals = {}
with open('sales.csv', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        booth = row['booth']
        totals[booth] = totals.get(booth, 0) + int(row['amount'])

ranking = sorted(totals.items(), key=lambda pair: pair[1], reverse=True)
rank = 1
for booth, amount in ranking:
    print(f"{rank}. {booth} {amount:,}")
    rank += 1
`;
const OVERDUE_REFERENCE=`import csv

def late_fee(days):
    if days <= 0:
        return 0
    elif days <= 7:
        fee = days * 100
    else:
        fee = 700 + (days - 7) * 200
    return min(fee, 3000)

with open('loans.csv', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        days = int(row['days_late'])
        fee = late_fee(days)
        if fee > 0:
            print(f"NOTICE {row['name']}: '{row['title']}' is {days} days late. Fee {fee:,}")
`;

export const PYTHON_JOBS:readonly PythonJob[]=[
 {id:'bakery-receipts',track:'python',scene:'receipt',credits:220,xp:100,main:'receipt.py',
  client:c('해나 · 새벽빵집','Hana · Dawn Bakery','ハナ · 夜明けベーカリー'),
  title:c('밤마다 손으로 쓰는 영수증','Receipts written by hand every night','毎晩手書きのレシート'),
  brief:c('매일 밤 주문서를 영수증에 손으로 옮겨 적느라 잠을 못 자요. 민서가 만들어 둔 receipt.py를 돌리면 금액이 이상하게 나와요. 크루아상 3개는 3,500 × 3 = 10,500원인데 3,503원이래요. 합계도 마지막 줄 값만 나오고요.','I copy every order onto receipts by hand each night. Minseo left receipt.py, but its amounts are strange: three croissants should be 3,500 × 3 = 10,500, yet it prints 3,503. The total only shows the last line, too.','毎晩、注文書を手でレシートに写していて眠れません。ミンソが作ったreceipt.pyを動かすと金額が変です。クロワッサン3個は3,500 × 3 = 10,500なのに3,503と出ます。合計も最後の行の金額だけです。'),
  goal:c('각 줄은 가격 × 수량, 마지막 TOTAL은 모든 줄의 합이 되게 receipt.py를 고치고 python3 receipt.py로 실행하세요.','Make each line price × quantity and TOTAL the sum of every line, then run python3 receipt.py.','各行を価格 × 数量に、最後のTOTALを全行の合計にしてpython3 receipt.pyで実行します。'),
  concepts:c('변수 · for 반복 · 누적 합계(+=)','Variables · for loops · running totals (+=)','変数 · for繰り返し · 累積合計(+=)'),
  hints:[c('먼저 cat orders.csv로 주문서를 보고, python3 receipt.py로 지금 결과를 확인해 보세요.','Read the orders with cat orders.csv, then run python3 receipt.py to see the current result.','まずcat orders.csvで注文書を見て、python3 receipt.pyで今の結果を確かめましょう。'),c('한 줄 금액은 price와 qty를 더하는 게 아니라 곱해야 해요. 파이썬의 곱하기는 *예요.','A line amount multiplies price and qty instead of adding them. Python multiplies with *.','1行の金額はpriceとqtyを足すのではなく掛けます。Pythonの掛け算は*です。'),c('total = line은 매번 덮어써요. 반복할 때마다 더하려면 total += line이에요.','total = line overwrites the value each time. Use total += line to keep adding.','total = lineは毎回上書きします。足し続けるにはtotal += lineです。')],
  thanks:c('영수증이 줄줄 출력돼요! 오늘은 일찍 잘 수 있겠어요. 내일 첫 크루아상은 당신 거예요.','The receipts just print themselves! I can finally sleep early. Tomorrow’s first croissant is yours.','レシートがどんどん出てきます！今日は早く眠れそう。明日の最初のクロワッサンはあなたの分です。'),
  reference:RECEIPT_REFERENCE,
  files:{'receipt.py':RECEIPT_REFERENCE.replace("int(row['price']) * int(row['qty'])","int(row['price']) + int(row['qty'])").replace('total += line','total = line')},
  data:[
   {'orders.csv':csv('item,price,qty',[['Croissant',3500,3],['Baguette',4200,1],['Cream bun',2800,4],['"Milk bread, large"',5000,2]])},
   {'orders.csv':csv('item,price,qty',[['Bagel',2600,5],['"Pretzel, salted"',3100,2],['Scone',2900,1]])},
   {'orders.csv':csv('item,price,qty',[['Sourdough',7800,2],['Madeleine',1500,6],['Croissant',3500,0],['Pain au chocolat',3900,3],['Muffin',3300,1]])},
  ]},
 {id:'florist-restock',track:'python',scene:'shelf',credits:240,xp:110,main:'restock.py',
  client:c('솔 · 꽃가게','Sol · Flower Shop','ソル · 花屋'),
  title:c('떨어지기 전에 주문하기','Order before it runs out','なくなる前に注文'),
  brief:c('재고가 5송이 미만인 꽃만 도매상에 주문하고 싶어요. 그런데 restock.py가 오히려 넉넉한 꽃만 주문 목록에 올리고, 마지막 줄엔 늘 "0 flowers to order"라고 나와요.','I want to reorder only flowers with fewer than five stems left. restock.py lists the plentiful flowers instead, and its last line always says "0 flowers to order".','在庫が5本未満の花だけを卸に注文したいんです。でもrestock.pyは余っている花ばかり並べて、最後の行はいつも「0 flowers to order」です。'),
  goal:c('재고가 5 미만인 꽃만 ORDER 줄로 출력하고, 마지막 줄에 주문할 꽃의 개수를 세어 출력하세요.','Print an ORDER line only for flowers with stock below 5, and count them on the last line.','在庫が5未満の花だけORDER行に出し、最後の行に注文する花の数を数えて出力します。'),
  concepts:c('if 조건문 · 비교 연산자(<, >) · 개수 세기','if statements · comparisons (<, >) · counting','if条件文 · 比較演算子(<, >) · 数を数える'),
  hints:[c('cat stock.csv로 재고를 보고, 어떤 꽃이 5송이보다 적은지 먼저 손으로 세어 보세요.','Look at cat stock.csv and count by hand which flowers have fewer than five.','cat stock.csvで在庫を見て、5本より少ない花を先に手で数えましょう。'),c('"미만"은 작다(<)예요. 지금 조건은 크다(>)로 되어 있어요.','"Below" means less than (<). The condition currently says greater than (>).','「未満」は小なり(<)です。今の条件は大なり(>)になっています。'),c('count는 0으로 시작만 하고 늘어나지 않아요. if 안에서 count += 1을 해 주세요. 들여쓰기도 if 블록과 맞춰요.','count starts at 0 but never grows. Add count += 1 inside the if, indented like the other lines in that block.','countは0から始まるだけで増えません。ifの中でcount += 1を。インデントもifブロックに揃えます。')],
  thanks:c('비어 가던 선반이 다시 꽉 찼어요! 이번 주말 결혼식 꽃다발도 문제없어요.','The empty shelves are full again! This weekend’s wedding bouquets are safe.','空になりかけた棚がまたいっぱいです！今週末の結婚式のブーケも大丈夫です。'),
  reference:RESTOCK_REFERENCE,
  files:{'restock.py':RESTOCK_REFERENCE.replace("int(row['stock']) < LOW","int(row['stock']) > LOW").replace("\n        count += 1\n","\n")},
  data:[
   {'stock.csv':csv('name,stock',[['rose',12],['tulip',3],['lily',0],['freesia',7],['peony',4]])},
   {'stock.csv':csv('name,stock',[['daisy',5],['orchid',1],['carnation',9]])},
   {'stock.csv':csv('name,stock',[['sunflower',2],['iris',6],['lavender',4],['ranunculus',3],['camellia',8],['anemone',0]])},
  ]},
 {id:'club-contacts',track:'python',scene:'contacts',credits:260,xp:120,main:'contacts.py',
  client:c('루나 · 별빛동아리','Luna · Starlight Club','ルナ · 星あかりクラブ'),
  title:c('같은 사람에게 세 번 간 초대장','Three invitations to one person','同じ人に3通の招待状'),
  brief:c('가입 신청서를 그대로 메일 목록으로 쓰니 같은 사람이 초대장을 세 통씩 받아요. 앞뒤 공백, 대소문자만 다른 주소, 빈 줄이 섞여 있거든요. contacts.py로 정리하면 빈 줄이 잔뜩 끼고 중복도 그대로예요.','We mail straight from the signup sheet, so one person got three invitations. The sheet has stray spaces, the same address in different letter cases and blank lines. contacts.py prints extra blank lines and keeps the duplicates.','申込書をそのままメールリストにしたら、同じ人に招待状が3通届きました。前後の空白、大文字小文字だけ違うアドレス、空行が混ざっているんです。contacts.pyで整理すると空行だらけで重複もそのままです。'),
  goal:c('주소의 앞뒤 공백을 지우고 소문자로 바꾼 뒤, 빈 줄은 건너뛰고 처음 나온 순서대로 한 번씩만 출력하세요. 첫 줄은 인원수예요.','Strip spaces and lowercase each address, skip blank lines, and print each address once in first-seen order. The first line is the member count.','前後の空白を消して小文字にし、空行は飛ばして、最初に出た順に一度ずつ出力します。1行目は人数です。'),
  concepts:c('문자열 메서드(strip, lower) · 리스트 · in 검사','String methods (strip, lower) · lists · in checks','文字列メソッド(strip, lower) · リスト · in判定'),
  hints:[c('cat signups.txt로 원본을 보세요. 같은 사람인데 글자가 조금씩 달라요.','Read the source with cat signups.txt. The same person is written slightly differently.','cat signups.txtで元を見ましょう。同じ人なのに少しずつ違います。'),c('파일에서 읽은 줄에는 끝에 줄바꿈이 붙어 있어요. line.strip()은 앞뒤 공백과 줄바꿈을 지우고, .lower()는 소문자로 바꿔요.','Lines read from a file end with a newline. line.strip() removes surrounding spaces and newlines; .lower() makes it lowercase.','ファイルから読んだ行の末尾には改行が付いています。line.strip()は前後の空白と改行を消し、.lower()は小文字にします。'),c('정리한 값이 빈 문자열이면 continue로 다음 줄로 넘어가세요.','If the cleaned value is an empty string, use continue to skip to the next line.','整理した値が空文字ならcontinueで次の行へ進みます。')],
  thanks:c('이번엔 모두에게 딱 한 통씩 갔어요! 별 보러 오는 날, 루나표 핫초코 대접할게요.','This time everyone got exactly one! Come stargazing — the hot chocolate is on me.','今回はみんなにちょうど1通ずつ届きました！星を見に来る日はルナ特製ココアをごちそうします。'),
  reference:CONTACTS_REFERENCE,
  files:{'contacts.py':CONTACTS_REFERENCE.replace('email = line.strip().lower()','email = line').replace("        if email == '':\n            continue\n","")},
  data:[
   {'signups.txt':'  Luna@Moon.club\nmina@photo.club\nluna@moon.club  \nMINA@PHOTO.CLUB\n\njun@library.town\n'},
   {'signups.txt':'ari@class.online\n\n  Ari@Class.Online\nharu@bus.town\n'},
   {'signups.txt':'sol@flower.shop\nSOL@FLOWER.SHOP\n\n\n doyun@bike.fix\nraon@museum.art \ndoyun@bike.fix\n'},
  ]},
 {id:'festival-tally',track:'python',scene:'chart',credits:300,xp:130,main:'tally.py',
  client:c('지우 · 동네 축제 위원회','Jiwoo · Festival committee','ジウ · まち祭り委員会'),
  title:c('어느 부스가 1등일까?','Which booth came first?','どのブースが1位？'),
  brief:c('축제 판매 기록을 부스별로 합쳐 순위를 발표해야 해요. 그런데 tally.py는 부스마다 마지막 판매 한 건만 남기고, 순위도 꼴찌부터 나와요. 무대에서 거꾸로 발표할 뻔했어요!','We need to total sales per booth and announce the ranking. tally.py keeps only each booth’s last sale and ranks from the bottom. I almost announced it upside down on stage!','祭りの販売記録をブースごとに合計して順位を発表したいんです。でもtally.pyはブースごとに最後の1件しか残さず、順位も最下位から出ます。舞台で逆に発表するところでした！'),
  goal:c('부스별 판매액을 모두 더한 뒤, 합계가 큰 순서대로 "1. 부스 합계" 형식으로 출력하세요.','Add up every sale per booth, then print "1. Booth total" lines from the largest total down.','ブースごとに販売額をすべて足し、合計の大きい順に「1. ブース 合計」の形式で出力します。'),
  concepts:c('딕셔너리 · get()으로 누적 · sorted(reverse=True)','Dictionaries · accumulate with get() · sorted(reverse=True)','辞書 · get()で累積 · sorted(reverse=True)'),
  hints:[c('cat sales.csv를 보면 같은 부스가 여러 줄 나와요. 줄마다 더해야 해요.','cat sales.csv shows the same booth on several rows. Add each row.','cat sales.csvを見ると同じブースが何行も出ます。行ごとに足します。'),c('totals[booth] = 값은 덮어쓰기예요. totals.get(booth, 0) + 값은 "지금까지 합계 + 이번 판매"예요.','totals[booth] = value overwrites. totals.get(booth, 0) + value means "total so far + this sale".','totals[booth] = 値は上書きです。totals.get(booth, 0) + 値は「今までの合計 + 今回の販売」です。'),c('sorted는 기본이 작은 것부터예요. 큰 것부터 보려면 reverse=True를 더하세요.','sorted goes from smallest by default. Add reverse=True for largest first.','sortedは標準で小さい順です。大きい順にはreverse=Trueを足します。')],
  thanks:c('떡볶이 부스 사장님이 1등 트로피를 들고 울었어요. 완벽한 발표였어요!','The tteokbokki owner cried holding the trophy. A perfect announcement!','トッポッキのブースの店主がトロフィーを持って泣いていました。完璧な発表でした！'),
  reference:TALLY_REFERENCE,
  files:{'tally.py':TALLY_REFERENCE.replace("totals.get(booth, 0) + int(row['amount'])","int(row['amount'])").replace(', reverse=True','')},
  data:[
   {'sales.csv':csv('booth,amount',[['Tteokbokki',12000],['Lemonade',4000],['Tteokbokki',18000],['Photo booth',9000],['Lemonade',6000],['Tteokbokki',7000],['Photo booth',15000]])},
   {'sales.csv':csv('booth,amount',[['Hotteok',5000],['Bracelets',12000],['Hotteok',9000],['Bracelets',1000],['Face paint',8000]])},
   {'sales.csv':csv('booth,amount',[['Corn dogs',4500],['Corn dogs',4500],['Bingsu',16000],['Balloons',3000],['Corn dogs',9000],['Balloons',2500]])},
  ]},
 {id:'library-overdue',track:'python',scene:'notices',credits:340,xp:150,main:'overdue.py',
  client:c('준 · 동네도서관','Jun · Neighborhood Library','ジュン · まちの図書館'),
  title:c('연체 알림은 정중하게, 금액은 정확하게','Polite notices, exact fees','延滞のお知らせは丁寧に、金額は正確に'),
  brief:c('연체 알림 문자를 자동으로 만들려는데 overdue.py가 실행하자마자 TypeError로 멈춰요. 규칙은 이래요: 연체 1~7일은 하루 100원, 8일째부터는 하루 200원, 한 권에 최대 3,000원. 연체가 없으면 알림을 보내지 않아요.','I want overdue texts generated automatically, but overdue.py crashes with a TypeError right away. The rule: 100 per day for days 1–7, 200 per day from day 8, at most 3,000 per book. No notice when a book is not late.','延滞のお知らせを自動で作りたいのに、overdue.pyは実行するとすぐTypeErrorで止まります。ルール: 延滞1〜7日は1日100、8日目からは1日200、1冊最大3,000。延滞なしならお知らせは送りません。'),
  goal:c('오류를 고치고, 요금 상한 3,000원을 적용해 연체된 책마다 NOTICE 한 줄을 출력하세요.','Fix the error, apply the 3,000 cap and print one NOTICE line for every overdue book.','エラーを直し、上限3,000を適用して延滞した本ごとにNOTICEを1行出力します。'),
  concepts:c('함수(def, return) · 형 변환 int() · if/elif/else · min()','Functions (def, return) · int() conversion · if/elif/else · min()','関数(def, return) · 型変換int() · if/elif/else · min()'),
  hints:[c('TypeError 메시지를 끝까지 읽어 보세요. CSV에서 읽은 값은 숫자처럼 보여도 문자열(str)이에요.','Read the TypeError to the end. Values read from CSV are strings (str), even when they look like numbers.','TypeErrorのメッセージを最後まで読みましょう。CSVから読んだ値は数字に見えても文字列(str)です。'),c("int(row['days_late'])처럼 int()로 감싸면 숫자로 바뀌어요.","Wrap it with int(), like int(row['days_late']), to turn it into a number.","int(row['days_late'])のようにint()で包むと数字になります。"),c('min(fee, 3000)은 둘 중 작은 값이에요. 상한을 넘으면 3000이 돼요.','min(fee, 3000) returns the smaller value, so anything above the cap becomes 3000.','min(fee, 3000)は小さい方の値です。上限を超えると3000になります。')],
  thanks:c('알림이 한 통도 틀리지 않았어요. 하루 만에 책 열두 권이 돌아왔답니다!','Not a single notice was wrong. Twelve books came back in one day!','お知らせは1通も間違っていませんでした。1日で12冊が戻ってきました！'),
  reference:OVERDUE_REFERENCE,
  files:{'overdue.py':OVERDUE_REFERENCE.replace("days = int(row['days_late'])","days = row['days_late']").replace("        fee = days * 100\n    else:\n        fee = 700 + (days - 7) * 200\n    return min(fee, 3000)","        return days * 100\n    else:\n        return 700 + (days - 7) * 200")},
  data:[
   {'loans.csv':csv('name,title,days_late',[['Ari','The Little Prince',3],['Doyun','Bike Repair 101',0],['Mina','Night Photography',12],['Haru','Bus Maps of Korea',25]])},
   {'loans.csv':csv('name,title,days_late',[['Sol','Flowers A to Z',7],['Luna','Star Atlas',8],['Raon','Museum Stories',-2]])},
   {'loans.csv':csv('name,title,days_late',[['Yuri','Market Math',1],['Taeo','Wood and Time',40],['Sea','Paper Trails',15],['Eunho','Town Hall Notes',0]])},
  ]},
];

type Rows=(string|number|null)[][];
const table=(name:string,columns:[string,'INTEGER'|'REAL'|'TEXT',boolean?][],rows:Rows)=>({name,columns:columns.map(([column,type,primaryKey])=>primaryKey?{name:column,type,primaryKey}:{name:column,type}),rows});
const MENU_COLUMNS:[string,'INTEGER'|'TEXT',boolean?][]=[['id','INTEGER',true],['name','TEXT'],['category','TEXT'],['price','INTEGER'],['available','INTEGER']];
const PRODUCT_COLUMNS:[string,'INTEGER'|'TEXT',boolean?][]=[['id','INTEGER',true],['name','TEXT'],['price','INTEGER'],['stock','INTEGER'],['on_sale','INTEGER']];
const SCORE_COLUMNS:[string,'INTEGER'|'TEXT',boolean?][]=[['student','TEXT'],['subject','TEXT'],['score','INTEGER']];
const PATIENT_COLUMNS:[string,'INTEGER'|'TEXT',boolean?][]=[['id','INTEGER',true],['name','TEXT'],['dept','TEXT'],['priority','INTEGER'],['arrived','TEXT'],['status','TEXT']];
const SALE_COLUMNS:[string,'INTEGER'|'TEXT',boolean?][]=[['id','INTEGER',true],['booth','TEXT'],['item','TEXT'],['amount','INTEGER']];
const numbered=(rows:Rows)=>rows.map((row,index)=>[index+1,...row]);

export const SQL_JOBS:readonly SqlJob[]=[
 {id:'cafe-menu',track:'sql',scene:'menu',credits:240,xp:110,main:'query.sql',db:'cafe.db',ordered:false,
  client:c('지우 · 모노 카페','Jiwoo · Mono Cafe','ジウ · モノカフェ'),
  title:c('품절 메뉴는 메뉴판에서 빼 주세요','Hide sold-out items from the menu','売り切れはメニューから外して'),
  brief:c('손님 앱 메뉴판이 데이터베이스를 읽어 오는데, 품절 메뉴까지 보이고 가격은 아예 안 보여요. 오늘 주문 가능한(available = 1) 메뉴만 이름과 가격으로 보여 주세요.','The customer app reads its menu from the database, but it shows sold-out items and no prices at all. Show only items available today (available = 1), with name and price.','お客さんアプリのメニューがデータベースを読んでいますが、売り切れまで表示され、価格はまったく出ません。今日注文できる(available = 1)メニューだけを名前と価格で見せてください。'),
  goal:c('query.sql을 고쳐 available이 1인 메뉴의 name, price를 조회하고 sqlite3 cafe.db < query.sql로 실행하세요.','Edit query.sql to select name and price for rows where available is 1, then run sqlite3 cafe.db < query.sql.','query.sqlを直してavailableが1のメニューのname, priceを取り出し、sqlite3 cafe.db < query.sqlで実行します。'),
  concepts:c('SELECT 열 고르기 · WHERE 조건','SELECT columns · WHERE filters','SELECTで列を選ぶ · WHERE条件'),
  hints:[c('sqlite3 cafe.db ".schema menu"로 표의 열 이름을 확인하고, sqlite3 cafe.db "SELECT * FROM menu;"로 전체를 보세요.','Check column names with sqlite3 cafe.db ".schema menu", then view everything with sqlite3 cafe.db "SELECT * FROM menu;".','sqlite3 cafe.db ".schema menu"で列名を確認し、sqlite3 cafe.db "SELECT * FROM menu;"で全体を見ましょう。'),c('SELECT 뒤에 보고 싶은 열을 쉼표로 나열해요: SELECT name, price','List the columns you want after SELECT, separated by commas: SELECT name, price','SELECTの後に見たい列をカンマで並べます: SELECT name, price'),c('FROM menu 뒤에 WHERE available = 1을 붙이면 조건에 맞는 행만 남아요.','Add WHERE available = 1 after FROM menu to keep only matching rows.','FROM menuの後にWHERE available = 1を付けると条件に合う行だけ残ります。')],
  thanks:c('메뉴판이 깔끔해졌어요! 품절 메뉴 때문에 사과할 일이 없어졌어요.','The menu looks clean! No more apologizing for sold-out drinks.','メニューがすっきりしました！売り切れで謝ることがなくなりました。'),
  reference:'SELECT name, price FROM menu WHERE available = 1;\n',
  files:{'query.sql':'-- The customer app runs this query.\nSELECT name FROM menu;\n'},
  data:[
   {tables:[table('menu',MENU_COLUMNS,numbered([['Americano','drink',4500,1],['Cafe latte','drink',5000,1],['Vanilla latte','drink',5500,0],['Croissant','bakery',3500,1],['Lemon tea','drink',4800,1],['Cheesecake','dessert',6000,0],['Iced choco','drink',5200,1]]))]},
   {tables:[table('menu',MENU_COLUMNS,numbered([['Flat white','drink',5200,0],['Scone','bakery',3200,1],['Matcha latte','drink',5800,1]]))]},
   {tables:[table('menu',MENU_COLUMNS,numbered([['Espresso','drink',4000,1],['Affogato','dessert',6500,1],['Mocha','drink',5600,0],['Bagel','bakery',3000,0],['Hot choco','drink',5000,1]]))]},
  ]},
 {id:'market-deals',track:'sql',scene:'flyer',credits:260,xp:120,main:'query.sql',db:'market.db',ordered:true,
  client:c('유리 · 골목시장','Yuri · Alley Market','ユリ · 路地市場'),
  title:c('전단지에 실을 진짜 특가','Real deals for the flyer','チラシに載せる本当の特価'),
  brief:c('주말 전단지를 데이터베이스에서 뽑는데, 재고가 없는 상품과 할인이 끝난 상품까지 실려서 항의를 받았어요. 3,000원 이하이고, 재고가 있고(stock > 0), 할인 중인(on_sale = 1) 상품만 싼 것부터 보여 주세요.','The weekend flyer comes from the database, but it listed sold-out items and finished deals, and customers complained. Show only items at 3,000 or less, in stock (stock > 0) and on sale (on_sale = 1), cheapest first.','週末のチラシをデータベースから作っていますが、在庫切れやセール終了の商品まで載って苦情が来ました。3,000以下で、在庫があり(stock > 0)、セール中(on_sale = 1)の商品だけを安い順に見せてください。'),
  goal:c('세 조건을 AND로 모두 걸고 ORDER BY price로 정렬해 name, price를 조회하세요.','Combine all three conditions with AND, sort with ORDER BY price and select name, price.','3つの条件をANDでつなぎ、ORDER BY priceで並べてname, priceを取り出します。'),
  concepts:c('AND로 조건 묶기 · ORDER BY 정렬','Combining conditions with AND · ORDER BY','ANDで条件をつなぐ · ORDER BY'),
  hints:[c('sqlite3 market.db "SELECT * FROM products;"로 어떤 상품이 문제인지 먼저 찾아보세요.','Run sqlite3 market.db "SELECT * FROM products;" and find the problem items first.','sqlite3 market.db "SELECT * FROM products;"で問題の商品を先に探しましょう。'),c('여러 조건은 WHERE price <= 3000 AND stock > 0 처럼 AND로 이어요.','Chain conditions with AND, like WHERE price <= 3000 AND stock > 0.','複数の条件はWHERE price <= 3000 AND stock > 0のようにANDでつなぎます。'),c('정렬은 맨 끝에 ORDER BY price예요. 기본은 작은 값부터예요.','Sorting goes at the end: ORDER BY price. The default is smallest first.','並べ替えは最後にORDER BY priceです。標準は小さい順です。')],
  thanks:c('전단지 보고 오신 손님들이 다 사 가셨어요. 이번엔 항의 대신 단골이 생겼어요!','Everyone who came with the flyer found their deal. This time we got regulars instead of complaints!','チラシを見たお客さんがみんな買っていきました。今回は苦情の代わりに常連ができました！'),
  reference:'SELECT name, price FROM products WHERE price <= 3000 AND stock > 0 AND on_sale = 1 ORDER BY price;\n',
  files:{'query.sql':'-- Weekend flyer: cheap items that are really on sale.\nSELECT name, price FROM products WHERE price <= 3000;\n'},
  data:[
   {tables:[table('products',PRODUCT_COLUMNS,numbered([['Apple',1200,30,1],['Strawberries',6900,12,1],['Tofu',1800,0,1],['Kimchi',8500,5,0],['Eggs (10)',3000,20,1],['Green onion',2500,8,1],['Rice cakes',2900,15,0],['Milk',2700,0,0]]))]},
   {tables:[table('products',PRODUCT_COLUMNS,numbered([['Carrots',1900,4,1],['Bananas',2400,0,1],['Spinach',1500,9,1],['Garlic',3100,6,1]]))]},
   {tables:[table('products',PRODUCT_COLUMNS,numbered([['Pears',2800,3,1],['Seaweed',2200,7,0],['Potatoes',1700,11,1],['Peaches',3000,2,1],['Radish',900,0,1],['Mushrooms',2600,5,1]]))]},
  ]},
 {id:'school-top',track:'sql',scene:'podium',credits:280,xp:130,main:'query.sql',db:'academy.db',ordered:true,
  client:c('민서 · 방과후교실','Minseo · After-school class','ミンソ · 放課後教室'),
  title:c('수학 시상대에 설 세 명','Three on the math podium','数学の表彰台に立つ3人'),
  brief:c('수학 점수 상위 3명에게 상장을 주려는데, 지금 쿼리는 모든 과목을 섞어서 점수가 가장 낮은 세 명을 골라요. 수학(subject = \'math\')만, 높은 점수부터 3명을 뽑아 주세요.','I want to give certificates to the top three in math, but the query mixes every subject and picks the three lowest scores. Only math (subject = \'math\'), highest score first, three students.','数学の上位3人に賞状を渡したいのに、今のクエリは全科目を混ぜて点数の低い3人を選びます。数学(subject = \'math\')だけ、高い点数から3人を選んでください。'),
  goal:c("WHERE subject = 'math'로 거르고, ORDER BY score DESC와 LIMIT 3으로 student, score를 조회하세요.","Filter with WHERE subject = 'math', then use ORDER BY score DESC and LIMIT 3 to select student, score.","WHERE subject = 'math'で絞り、ORDER BY score DESCとLIMIT 3でstudent, scoreを取り出します。"),
  concepts:c('ORDER BY DESC 내림차순 · LIMIT 개수 제한','ORDER BY DESC · LIMIT','ORDER BY DESC 降順 · LIMIT 件数制限'),
  hints:[c('문자열 조건은 작은따옴표로 감싸요: subject = \'math\'','Wrap text values in single quotes: subject = \'math\'','文字列の条件はシングルクォートで囲みます: subject = \'math\''),c('DESC를 붙이면 큰 값부터 정렬해요: ORDER BY score DESC','Add DESC to sort from the largest: ORDER BY score DESC','DESCを付けると大きい順に並びます: ORDER BY score DESC'),c('LIMIT 3은 위에서 세 줄만 남겨요. 항상 쿼리의 맨 끝에 와요.','LIMIT 3 keeps the first three rows. It always comes last.','LIMIT 3は上から3行だけ残します。いつもクエリの最後です。')],
  thanks:c('미나가 상장을 들고 엄마한테 영상통화를 걸었어요. 순서 하나로 하루가 바뀌네요.','Mina video-called her mom holding the certificate. One sort order changed her day.','ミナが賞状を持ってお母さんにビデオ通話していました。並び順ひとつで一日が変わりますね。'),
  reference:"SELECT student, score FROM scores WHERE subject = 'math' ORDER BY score DESC LIMIT 3;\n",
  files:{'query.sql':'-- Math award: the top three students.\nSELECT student, score FROM scores ORDER BY score LIMIT 3;\n'},
  data:[
   {tables:[table('scores',SCORE_COLUMNS,[['Ari','math',88],['Ari','english',95],['Doyun','math',72],['Doyun','english',81],['Mina','math',97],['Mina','english',79],['Haru','math',91],['Haru','english',85],['Jun','math',64],['Jun','english',90],['Sol','math',85],['Sol','english',70]])]},
   {tables:[table('scores',SCORE_COLUMNS,[['Raon','math',79],['Raon','science',99],['Yuri','math',93],['Taeo','math',82],['Taeo','science',61],['Sea','math',58]])]},
   {tables:[table('scores',SCORE_COLUMNS,[['Luna','english',100],['Luna','math',74],['Eunho','math',96],['Ari','math',89],['Mina','math',91],['Jun','english',55],['Haru','math',67]])]},
  ]},
 {id:'clinic-queue',track:'sql',scene:'queue',credits:320,xp:150,main:'query.sql',db:'clinic.db',ordered:true,
  client:c('지민 · 햇살의원','Jimin · Sunny Clinic','ジミン · ひだまり医院'),
  title:c('대기실 호출 화면이 엉망이에요','The waiting-room screen is chaos','待合室の呼び出し画面がめちゃくちゃ'),
  brief:c('대기실 화면이 이미 진료를 마친 분까지 부르고, 숨이 찬 응급 환자는 뒤로 밀려요. 대기 중(status = \'waiting\')인 분만, 우선순위(priority)가 높은 순으로, 같은 우선순위면 먼저 온(arrived) 순으로 다음 5명만 보여 주세요.','The waiting-room screen calls people who are already done, and an urgent patient got pushed to the back. Show only waiting patients (status = \'waiting\'), highest priority first, earlier arrival first within the same priority — just the next five.','待合室の画面が診察済みの方まで呼び、苦しそうな救急の患者さんが後回しになっています。待機中(status = \'waiting\')の方だけ、優先度(priority)の高い順、同じ優先度なら先に来た(arrived)順で次の5人だけ表示してください。'),
  goal:c("WHERE status = 'waiting', ORDER BY priority DESC, arrived, LIMIT 5로 name, dept, priority, arrived를 조회하세요.","Use WHERE status = 'waiting', ORDER BY priority DESC, arrived and LIMIT 5 to select name, dept, priority, arrived.","WHERE status = 'waiting'、ORDER BY priority DESC, arrived、LIMIT 5でname, dept, priority, arrivedを取り出します。"),
  concepts:c('여러 기준 정렬 · WHERE + ORDER BY + LIMIT 조합','Multi-key sorting · WHERE + ORDER BY + LIMIT','複数キーの並べ替え · WHERE + ORDER BY + LIMIT'),
  hints:[c("sqlite3 clinic.db \"SELECT status, COUNT(*) FROM patients GROUP BY status;\"로 대기 인원부터 세어 보세요.","Count who is waiting first: sqlite3 clinic.db \"SELECT status, COUNT(*) FROM patients GROUP BY status;\"","まず待機人数を数えましょう: sqlite3 clinic.db \"SELECT status, COUNT(*) FROM patients GROUP BY status;\""),c('정렬 기준은 쉼표로 여러 개 쓸 수 있어요. 앞의 기준이 같을 때 다음 기준을 봐요: ORDER BY priority DESC, arrived','You can sort by several keys separated by commas; the next key breaks ties: ORDER BY priority DESC, arrived','並べ替えの基準はカンマで複数書けます。前の基準が同じとき次を見ます: ORDER BY priority DESC, arrived'),c('arrived는 "09:05" 같은 글자지만 같은 자릿수라 글자 순서가 곧 시간 순서예요.','arrived is text like "09:05", but with fixed width its text order is time order.','arrivedは「09:05」のような文字列ですが、桁がそろっているので文字の順が時間の順です。')],
  thanks:c('대기 시간이 확 줄었어요. 응급 환자분도 바로 진료받으셨고요. 정말 고마워요!','The wait dropped right away, and the urgent patient was seen immediately. Thank you so much!','待ち時間がぐっと減りました。救急の患者さんもすぐ診察できました。本当にありがとう！'),
  reference:"SELECT name, dept, priority, arrived FROM patients WHERE status = 'waiting' ORDER BY priority DESC, arrived LIMIT 5;\n",
  files:{'query.sql':'-- Waiting-room screen: who should be called next?\nSELECT name, dept, priority, arrived FROM patients ORDER BY arrived;\n'},
  data:[
   {tables:[table('patients',PATIENT_COLUMNS,numbered([['Kim Doyun','ortho',1,'08:52','done'],['Park Ari','pediatrics',2,'09:01','waiting'],['Lee Sol','internal',1,'09:03','waiting'],['Choi Haru','internal',3,'09:10','waiting'],['Jung Mina','ent',1,'09:12','done'],['Han Jun','ortho',2,'09:14','waiting'],['Oh Raon','internal',1,'09:20','waiting'],['Yoon Sea','ent',3,'09:26','waiting'],['Seo Luna','pediatrics',2,'09:31','waiting'],['Kang Taeo','ortho',1,'09:33','waiting'],['Shin Yuri','internal',2,'09:40','done'],['Jo Eunho','ent',1,'09:44','waiting']]))]},
   {tables:[table('patients',PATIENT_COLUMNS,numbered([['Ahn Bora','ent',2,'10:02','waiting'],['Ryu Jin','ortho',3,'10:05','done'],['Moon Hae','internal',1,'10:06','waiting'],['Song Ilo','ent',3,'10:15','waiting']]))]},
   {tables:[table('patients',PATIENT_COLUMNS,numbered([['Baek Nari','pediatrics',1,'13:00','waiting'],['Gu Dami','internal',2,'13:04','waiting'],['Ha Joon','ortho',2,'13:09','waiting'],['Im Seul','ent',3,'13:15','done'],['Jang Woo','internal',1,'13:18','waiting'],['Ko Ara','pediatrics',3,'13:22','waiting'],['Ma Rin','ent',1,'13:30','waiting'],['Na Yeon','ortho',2,'13:41','waiting']]))]},
  ]},
 {id:'festival-sales',track:'sql',scene:'dashboard',credits:360,xp:170,main:'query.sql',db:'festival.db',ordered:true,
  client:c('지우 · 동네 축제 위원회','Jiwoo · Festival committee','ジウ · まち祭り委員会'),
  title:c('내년 축제 부스 선정 회의','Picking next year’s booths','来年のブース選定会議'),
  brief:c('올해 판매 기록 전체가 데이터베이스에 있어요. 부스별 주문 수와 매출 합계를 구하고, 매출이 50,000원 이상인 부스만 많은 순서대로 보여 주세요. 회의 자료로 쓸 거예요.','This year’s full sales log is in the database. For each booth, find the number of orders and the total, then show only booths with a total of 50,000 or more, largest first. It’s for the planning meeting.','今年の販売記録がすべてデータベースにあります。ブースごとの注文数と売上合計を出し、売上50,000以上のブースだけを多い順に見せてください。会議資料に使います。'),
  goal:c('GROUP BY booth로 묶어 booth, COUNT(*), SUM(amount)를 조회하고, HAVING으로 합계 50000 이상만 남긴 뒤 합계 내림차순으로 정렬하세요.','Group by booth to select booth, COUNT(*) and SUM(amount), keep totals of 50000 or more with HAVING, and sort by total descending.','GROUP BY boothでまとめてbooth, COUNT(*), SUM(amount)を取り出し、HAVINGで合計50000以上だけ残して合計の降順に並べます。'),
  concepts:c('GROUP BY 묶기 · COUNT/SUM 집계 · HAVING','GROUP BY · COUNT/SUM aggregates · HAVING','GROUP BYでまとめる · COUNT/SUM集計 · HAVING'),
  hints:[c('GROUP BY booth를 쓰면 같은 부스의 행이 한 줄로 묶이고, COUNT(*)는 묶인 행 수, SUM(amount)는 합계예요.','GROUP BY booth folds each booth into one row; COUNT(*) counts the rows and SUM(amount) adds them.','GROUP BY boothで同じブースの行が1行にまとまり、COUNT(*)は行数、SUM(amount)は合計です。'),c('묶은 뒤의 조건은 WHERE가 아니라 HAVING이에요. 별칭을 쓰면 편해요: SUM(amount) AS total ... HAVING total >= 50000','Conditions after grouping use HAVING, not WHERE. An alias helps: SUM(amount) AS total ... HAVING total >= 50000','まとめた後の条件はWHEREではなくHAVINGです。別名が便利です: SUM(amount) AS total ... HAVING total >= 50000'),c('순서는 GROUP BY → HAVING → ORDER BY total DESC예요.','The order is GROUP BY → HAVING → ORDER BY total DESC.','順番はGROUP BY → HAVING → ORDER BY total DESCです。')],
  thanks:c('회의가 10분 만에 끝났어요! 숫자로 보니 다들 바로 납득하더라고요. 내년 축제도 같이 해요.','The meeting took ten minutes! With the numbers on screen everyone agreed. Let’s do next year’s festival together too.','会議が10分で終わりました！数字で見るとみんなすぐ納得しました。来年の祭りも一緒にやりましょう。'),
  reference:'SELECT booth, COUNT(*) AS orders, SUM(amount) AS total FROM sales GROUP BY booth HAVING total >= 50000 ORDER BY total DESC;\n',
  files:{'query.sql':'-- Planning meeting: booths worth inviting back.\nSELECT booth, amount FROM sales ORDER BY amount DESC;\n'},
  data:[
   {tables:[table('sales',SALE_COLUMNS,numbered([['Tteokbokki','cup',4000],['Lemonade','large',3500],['Tteokbokki','plate',12000],['Hotteok','set',6000],['Photo booth','print',5000],['Tteokbokki','family',24000],['Bracelets','custom',15000],['Hotteok','set',6000],['Lemonade','large',3500],['Photo booth','frame',22000],['Tteokbokki','plate',12000],['Bracelets','pair',28000],['Photo booth','album',30000],['Hotteok','box',18000],['Bracelets','custom',15000],['Hotteok','set',6000]]))]},
   {tables:[table('sales',SALE_COLUMNS,numbered([['Bingsu','bowl',60000],['Corn dogs','set',20000],['Corn dogs','set',20000],['Balloons','bunch',9000],['Corn dogs','party',25000],['Bingsu','cup',8000]]))]},
   {tables:[table('sales',SALE_COLUMNS,numbered([['Face paint','full',40000],['Face paint','small',9000],['Juice','cup',4000],['Kimbap','roll',3000],['Kimbap','box',47000],['Juice','jug',52000],['Face paint','full',40000]]))]},
  ]},
];

export const OPS_JOBS:readonly OpsJob[]=[...PYTHON_JOBS,...SQL_JOBS];
export const OPS_IDS=OPS_JOBS.map(job=>job.id);
export function opsJob(id:string):OpsJob|undefined{return OPS_JOBS.find(job=>job.id===id);}
export function opsJobs(track:OpsTrack):readonly OpsJob[]{return track==='python'?PYTHON_JOBS:SQL_JOBS;}
export function opsFolder(job:OpsJob):string{return OPS_ROOTS[job.track]+'/'+job.id;}
/** Files placed in the job folder when the player accepts it. */
export function opsStartFiles(job:OpsJob):Record<string,string>{
 return job.track==='python'?{...job.data[0],...job.files}:{[job.db]:dbFile(job.id,job.db),...job.files};
}
/** Source data stays read-only so checks and the visible run use the same records. */
export function opsDataFiles(job:OpsJob):string[]{return job.track==='python'?Object.keys(job.data[0]):[job.db];}
