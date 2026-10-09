import {CAREER_JOBS,L,type Localized} from './career-content.ts';
import {careerCodeMode,careerCodeSpec,evaluateCareerCode} from './career-code.ts';
export type CareerCheck={name:Localized;passed:boolean;expected:string;actual:string};
export type CareerEvaluation={passed:boolean;checks:CareerCheck[];preview:{label:Localized;value:string}[]};
type Row=Record<string,string>;
function display(value:unknown):string{return typeof value==='string'?value:JSON.stringify(value)??'null';}
function proof(cases:{name:Localized;expected:unknown;actual:unknown}[]):CareerEvaluation {
 const checks=cases.map(c=>({name:c.name,expected:display(c.expected),actual:display(c.actual),passed:display(c.expected)===display(c.actual)}));
 return {passed:checks.length>=3&&checks.every(c=>c.passed),checks,preview:checks.map(c=>({label:c.name,value:c.actual}))};
}
function bad(message:string):CareerEvaluation {
 return proof([
  {name:L('파일 형식','File format','ファイル形式'),expected:'readable supported format',actual:message},
  {name:L('계산 실행','Calculation','計算'),expected:'valid input',actual:'not run'},
  {name:L('전달 준비','Ready to deliver','納品準備'),expected:'all cases pass',actual:'not ready'},
 ]);
}
function numeric(value:unknown,min=0,max=10000000):number {
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new Error('invalid number');
 return value;
}
function integer(value:unknown,min=0,max=10000000):number {const n=numeric(value,min,max);if(!Number.isInteger(n))throw new Error('whole number required');return n;}
function text(value:unknown,allowed?:string[]):string {if(typeof value!=='string'||value.length>500||(allowed&&!allowed.includes(value)))throw new Error('unsupported text value');return value;}
function flag(value:unknown):boolean {if(typeof value!=='boolean')throw new Error('true or false required');return value;}
function obj(value:unknown):Record<string,unknown> {if(!value||Array.isArray(value)||typeof value!=='object')throw new Error('object required');return value as Record<string,unknown>;}
function json(files:Record<string,string>,path:string):Record<string,unknown>{return obj(JSON.parse(files[path]));}
function csvNumber(value:string):number {if(!/^\d+(?:\.\d+)?$/.test(value))throw new Error('invalid numeric cell');return numeric(Number(value));}
/** Bounded CSV: quoted commas and doubled quotes are supported; multiline cells are not. */
function csv(files:Record<string,string>,path:string,required:string[]):Row[] {
 const lines=files[path].split(/\r?\n/);while(lines.at(-1)==='')lines.pop();if(lines.length<2||lines.length>101)throw new Error('CSV needs 1–100 rows');
 const cells=(line:string):string[]=>{
  const output:string[]=[];let cell='',quoted=false,closed=false;
  for(let i=0;i<line.length;i++){
   const ch=line[i];
   if(quoted){if(ch==='"'){if(line[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=ch;}
   else if(ch===','){output.push(cell);cell='';closed=false;}
   else if(ch==='"'){if(cell||closed)throw new Error('misplaced quote');quoted=true;}
   else{if(closed&&ch.trim())throw new Error('text after quote');if(!closed)cell+=ch;}
  }
  if(quoted)throw new Error('unclosed quote');output.push(cell);return output;
 };
 const headers=cells(lines[0]);if(new Set(headers).size!==headers.length||!headers.every(h=>/^[A-Za-z][A-Za-z0-9]*$/.test(h))||!required.every(h=>headers.includes(h)))throw new Error('missing CSV columns');
 return lines.slice(1).map(line=>{const values=cells(line);if(values.length!==headers.length)throw new Error('CSV column count');return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));});
}
function row(rows:Row[],field:string,value:string):Row {const matches=rows.filter(r=>r[field]===value);if(matches.length!==1)throw new Error('missing or duplicate record');return matches[0];}
function sameRecords(actual:Row[],expected:Row[],columns:string[],numbers:string[]=[]):boolean {
 const signature=(rows:Row[])=>JSON.stringify(rows.map(r=>JSON.stringify(columns.map(column=>numbers.includes(column)?csvNumber(r[column]):r[column]))).sort());
 return signature(actual)===signature(expected);
}
function time(value:string):number {const m=value.match(/^(\d{2}):(\d{2})$/);if(!m||+m[1]>23||+m[2]>59)throw new Error('HH:MM required');return +m[1]*60 + +m[2];}
function attributes(tag:string):Record<string,string> {
 const attrs:Record<string,string>={};const body=tag.replace(/^<\w+\s*|\/?\s*>$/g,'');
 const re=/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;let match:RegExpExecArray|null;
 while((match=re.exec(body))){const name=match[1].toLowerCase();if(Object.hasOwn(attrs,name))throw new Error('duplicate HTML attribute');attrs[name]=match[2]??match[3]??match[4]??'';}
 return attrs;
}
/** Pure, bounded interpreters only. User files are data, never executable JS/Python/HTML. */
export function evaluateCareer(id:string,files:Record<string,string>):CareerEvaluation {
 const job=CAREER_JOBS.find(j=>j.id===id);if(!job)return bad('unknown job');
 try{
  if(!files||typeof files!=='object'||Array.isArray(files))throw new Error('file map required');
  for(const path of Object.keys(job.files))if(typeof files[path]!=='string'||files[path].length>20000)throw new Error('missing or oversized file');
  if(careerCodeSpec(id)&&careerCodeMode(files)==='javascript')return evaluateCareerCode(id,files);
  const cases:{name:Localized;expected:unknown;actual:unknown}[]=[];
  const add=(ko:string,en:string,ja:string,expected:unknown,actual:unknown)=>cases.push({name:L(ko,en,ja),expected,actual});
  const unchanged=(path:string,columns:string[],numbers:string[]=[])=>sameRecords(csv(files,path,columns),csv(job.files,path,columns),columns,numbers);
  switch(id){
   case 'bakery-price':{
    const c=json(files,'pricing.json'),unit=numeric(c.unitPrice),size=integer(c.packSize,1,100),pack=numeric(c.packPrice);
    const total=(n:number)=>Math.floor(n/size)*pack+(n%size)*unit;
    [0,6,8].forEach((n,i)=>add(`${n}개 합계`,`${n} rolls total`,`${n}個合計`,[0,10000,13600][i],total(n)));
    add('낱개 1개','One single','単品1個',1800,total(1));
    add('상자 미만 3개','Three singles below a full box','1箱未満の単品3個',5400,total(3));
    // Keep prior check indices stable for the playable customer scene.
    add('상자 하나의 빵 수','Rolls in one box','1箱のパンの個数',6,size);
    add('상자 하나의 가격','Price of one box','1箱の価格',10000,pack);
    add('상자 미만 5개','Five singles below a full box','1箱未満の単品5個',9000,total(5));
    add('10개 합계','Ten rolls total','10個合計',17200,total(10));break;
   }
   case 'library-loans':{
    const c=json(files,'policy.json'),limit=integer(c.limit,1,20),inclusive=flag(c.inclusive),overdue=flag(c.allowOverdue);
    const eligible=(borrowed:number,requested:number,days:number)=>(inclusive?borrowed+requested<=limit:borrowed+requested<limit)&&(overdue||days===0);
    add('2권 + 1권, 연체 없음','2 + 1 books, no overdue','2冊+1冊、延滞なし',true,eligible(2,1,0));
    add('3권 + 1권, 연체 없음','3 + 1 books, no overdue','3冊+1冊、延滞なし',false,eligible(3,1,0));
    add('0권 + 1권, 연체 1일','0 + 1 books, one day overdue','0冊+1冊、延滞1日',false,eligible(0,1,1));break;
   }
   case 'florist-stock':{
    const rows=csv(files,'inventory.csv',['name','stock','reserved']);
    for(const [name,want] of [['rose',7],['tulip',8],['lily',0]] as const){const r=row(rows,'name',name),stock=csvNumber(r.stock),reserved=csvNumber(r.reserved);if(reserved>stock)throw new Error('reservation exceeds stock');add(`${name} 판매 가능`,`${name} available`,`${name}販売可能`,want,stock-reserved);}
    add('꽃 종류와 총 재고 유지','Keep flower kinds and total stock','花の種類と総在庫を維持',true,unchanged('inventory.csv',['name','stock'],['stock']));
    for(const [name,want] of [['rose',5],['tulip',0],['lily',3]] as const)add(`${name} 예약 수량`,`${name} reservations`,`${name}予約数`,want,csvNumber(row(rows,'name',name).reserved));break;
   }
   case 'bike-hours':{
    const c=json(files,'hours.json'),opens=integer(c.opens,0,23),closes=integer(c.closes,1,24),last=integer(c.lastEntry,0,23);
    if(!Array.isArray(c.closedDays)||!c.closedDays.every(d=>typeof d==='string'&&['mon','tue','wed','thu','fri','sat','sun'].includes(d))||opens>=closes)throw new Error('invalid opening hours');
    const closedDays=c.closedDays as string[];
    const accepts=(day:string,hour:number)=>!closedDays.includes(day)&&hour>=opens&&hour<=closes&&hour<=last;
    add('월요일 08시','Monday 08:00','月曜08時',false,accepts('mon',8));
    add('월요일 17시','Monday 17:00','月曜17時',true,accepts('mon',17));
    add('월요일 18시','Monday 18:00','月曜18時',false,accepts('mon',18));
    add('일요일 12시','Sunday 12:00','日曜12時',false,accepts('sun',12));
    for(const day of ['mon','tue','wed','thu','fri','sat'])add(`${day} 09시 접수`,`${day} 09:00 drop-off`,`${day} 09時受付`,true,accepts(day,9));
    add('영업 종료 시각','Business closing hour','営業時間の終了',18,closes);break;
   }
   case 'contacts-clean':{
    const c=json(files,'clean.json'),trim=flag(c.trim),lower=flag(c.lowercase),dedupe=flag(c.deduplicate),skip=flag(c.skipBlank);
    let emails=csv(files,'contacts.csv',['name','email']).map(r=>trim?r.email.trim():r.email).map(s=>lower?s.toLowerCase():s);
    if(skip)emails=emails.filter(Boolean);if(dedupe)emails=[...new Set(emails)];
    add('Luna 정리한 주소','Luna normalized address','Lunaの整理したアドレス','luna@example.test',emails.find(email=>email==='luna@example.test')??'missing');
    add('Jun 정리한 주소','Jun normalized address','Junの整理したアドレス','jun@example.test',emails.find(email=>email==='jun@example.test')??'missing');
    add('발송 대상 수','Recipient count','宛先数',2,emails.length);
    add('빈 주소 포함','Contains blank address','空欄を含む',false,emails.some(e=>!e.trim()));
    add('원본 연락처 표 유지','Keep original contact table','元の連絡先表を維持',true,unchanged('contacts.csv',['name','email']));break;
   }
   case 'clinic-form':{
    const html=files['booking.html'];
    if(/<\s*(script|iframe|object|embed|style)\b|\bon\w+\s*=|javascript\s*:|<\s*link\b/i.test(html))throw new Error('active HTML is not supported');
    // Supported teaching grammar: one form containing one label, input and
    // button in that order. No nested forms, fieldsets or inline CSS semantics.
    const inert=html.replace(/<!--[\s\S]*?-->/g,'');
    const form=inert.match(/^\s*<form\b([^>]*)>([\s\S]*)<\/form\s*>\s*$/i);
    const controls=form?.[2].match(/^\s*(<label\b[^>]*>[^<]+<\/label\s*>)\s*(<input\b[^>]*>)\s*(<button\b[^>]*>[^<]+<\/button\s*>)\s*$/i);
    if(!form||!controls)throw new Error('supported form requires one label, input and button inside the same form');
    const label=controls[1].match(/<label\b([^>]*)>([^<]+)<\/label\s*>/i)!,button=controls[3].match(/<button\b([^>]*)>([^<]+)<\/button\s*>/i)!;
    const input=attributes(controls[2]),labelAttrs=attributes(`<label ${label[1]}>`),buttonAttrs=attributes(`<button ${button[1]}>`),formAttrs=attributes(`<form ${form[1]}>`);
    if([input,labelAttrs,buttonAttrs,formAttrs].some(attrs=>Object.hasOwn(attrs,'style')))throw new Error('inline CSS is outside the supported form grammar');
    const belongs=(attrs:Record<string,string>)=>!Object.hasOwn(attrs,'form')||!!formAttrs.id&&attrs.form===formAttrs.id;
    const visibleForm=!Object.hasOwn(formAttrs,'hidden'),usableInput=visibleForm&&belongs(input)&&!Object.hasOwn(input,'disabled')&&!Object.hasOwn(input,'hidden');
    const validation=!Object.hasOwn(formAttrs,'novalidate')&&!Object.hasOwn(buttonAttrs,'formnovalidate');
    add('라벨과 이름 칸 연결','Label links to name input','ラベルと名前欄の接続',true,usableInput&&!!input.id&&labelAttrs.for===input.id&&input.name==='name'&&!!label[2].trim());
    add('빈 이름 거절','Reject empty name','空の名前を断る',true,usableInput&&validation&&!Object.hasOwn(input,'readonly')&&Object.hasOwn(input,'required')&&(input.type??'text')==='text');
    add('예약 제출 버튼','Booking submits','予約送信ボタン',true,visibleForm&&belongs(buttonAttrs)&&!Object.hasOwn(buttonAttrs,'disabled')&&!Object.hasOwn(buttonAttrs,'hidden')&&buttonAttrs.type==='submit'&&!!button[2].trim());break;
   }
   case 'market-filter':{
    const c=json(files,'filter.json'),field=text(c.field,['stock']),operator=text(c.operator,['>','>=']),value=numeric(c.value),fresh=flag(c.requireFresh);
    const rows=csv(files,'products.csv',['name','stock','fresh']);for(const r of rows){csvNumber(r.stock);text(r.fresh,['true','false']);}
    const selected=rows.filter(r=>(operator==='>'?csvNumber(r[field])>value:csvNumber(r[field])>=value)&&(!fresh||r.fresh==='true')).map(r=>r.name);
    ['apple','carrot','bread'].forEach(name=>add(`${name} 판매 가능`,`${name} available`,`${name}販売可能`,name,selected.find(item=>item===name)??'missing'));
    add('판매 상품 수','Available item count','販売商品数',3,selected.length);
    add('원본 상품 기록 유지','Keep original product records','元の商品記録を維持',true,unchanged('products.csv',['name','stock','fresh'],['stock']));break;
   }
   case 'school-sort':{
    const c=json(files,'sort.json'),field=text(c.field,['score']),direction=text(c.direction,['asc','desc']),tie=text(c.tie,['name']);
    const compare=(a:Row,b:Row)=>{const difference=csvNumber(a[field])-csvNumber(b[field]);return (direction==='desc'?-difference:difference)||(a[tie]<b[tie]?-1:a[tie]>b[tie]?1:0);};
    const scores=csv(files,'scores.csv',['name','score']);scores.forEach(r=>csvNumber(r.score));const sorted=[...scores].sort(compare);
    ['Mina','Jo','Ari'].forEach((name,i)=>add(`순위 ${i+1}`,`Rank ${i+1}`,`順位${i+1}`,name,sorted[i]?.name??'missing'));
    const tied=[{name:'Zed',score:'80'},{name:'Ari',score:'80'}].sort(compare);add('80점 동점 순서','Tie at 80','80点同点の順番','Ari,Zed',tied.map(r=>r.name).join(','));
    add('원본 이름과 점수 유지','Keep original names and scores','元の名前と点数を維持',true,unchanged('scores.csv',['name','score'],['score']));break;
   }
   case 'workshop-slots':{
    const rows=csv(files,'schedule.csv',['id','start','end']),slots=['A','B','C'].map(id=>{const r=row(rows,'id',id),start=time(r.start),end=time(r.end);if(end<=start)throw new Error('end must follow start');return {id,start,end};});
    slots.forEach(s=>add(`${s.id} 수업 길이`,`${s.id} class duration`,`${s.id}講座の長さ`,60,s.end-s.start));
    const overlap=(a:typeof slots[number],b:typeof slots[number])=>Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start));
    add('A/B 겹친 분','A/B overlapping minutes','A/B重複分',0,overlap(slots[0],slots[1]));
    add('B/C 겹친 분','B/C overlapping minutes','B/C重複分',0,overlap(slots[1],slots[2]));
    add('A는 09시 이후 시작','A starts at or after 09:00','Aは09時以降に開始',true,slots[0].start>=9*60);add('C는 13시까지 종료','C ends by 13:00','Cは13時までに終了',true,slots[2].end<=13*60);
    add('A 다음에 B','B follows A','Aの次にB',true,slots[1].start>=slots[0].end);add('B 다음에 C','C follows B','Bの次にC',true,slots[2].start>=slots[1].end);
    add('수업 수','Class count','講座数',3,rows.length);break;
   }
   case 'delivery-fees':{
    const c=json(files,'delivery.json'),base=integer(c.base),per=integer(c.perKm),free=integer(c.freeAt),max=numeric(c.maxKm);
    const fee=(km:number,total:number)=>km>max?'unavailable':total>=free?0:base+per*km;
    add('3km · 5,000원 주문','3km · order 5,000','3km · 注文5,000',2900,fee(3,5000));
    add('10km · 20,000원 주문','10km · order 20,000','10km · 注文20,000',0,fee(10,20000));
    add('11km · 30,000원 주문','11km · order 30,000','11km · 注文30,000','unavailable',fee(11,30000));
    add('0km · 1,000원 주문','0km · order 1,000','0km · 注文1,000',2000,fee(0,1000));
    add('3km · 19,999원 주문','3km · order 19,999','3km · 注文19,999',2900,fee(3,19999));
    add('최대 배달 거리 km','Maximum delivery distance km','最大配達距離km',10,max);break;
   }
   case 'museum-layout':{
    const source=files['gallery.css'].replace(/\/\*[\s\S]*?\*\//g,'');const match=source.match(/^\s*\.gallery\s*\{([^{}]*)\}\s*$/);if(!match)throw new Error('one .gallery rule required');
    const declarations:Record<string,string>={};for(const part of match[1].split(';').filter(s=>s.trim())){const m=part.match(/^\s*(width|max-width|padding|box-sizing)\s*:\s*([^:;]+)\s*$/);if(!m)throw new Error('unsupported CSS declaration');declarations[m[1]]=m[2].trim();}
    const width=declarations.width?.match(/^(\d+(?:\.\d+)?)\s*(px|%)$/),cap=declarations['max-width']?.match(/^(\d+(?:\.\d+)?)\s*px$/),padding=(declarations.padding??'0px').match(/^(\d+(?:\.\d+)?)\s*px$/);
    if(!width||!cap||!padding)throw new Error('supported width, max-width and padding required');const model=text(declarations['box-sizing'],['border-box','content-box']),amount=numeric(+width[1]),maximum=numeric(+cap[1]),pad=numeric(+padding[1]);
    [320,768,1200].forEach((available,i)=>{const base=width[2]==='%'?available*amount/100:amount;add(`${available}px 전체 너비`,`${available}px total width`,`${available}px全幅`,[320,768,900][i],Math.min(base,maximum)+(model==='content-box'?2*pad:0));});
    add('안쪽 여백','Inner padding','内側余白',16,pad);break;
   }
   case 'bookstore-invoice':{
    const c=json(files,'invoice.json'),minimum=integer(c.discountMin),discount=integer(c.discount),rate=numeric(c.taxRate,0,1),before=flag(c.discountBeforeTax);
    const subtotal=csv(files,'items.csv',['item','quantity','unit']).reduce((sum,r)=>sum+csvNumber(r.quantity)*csvNumber(r.unit),0);
    const reduction=(sum:number)=>sum>=minimum?Math.min(discount,sum):0;
    const final=(sum:number)=>{const off=reduction(sum);return sum-off+Math.floor((before?sum-off:sum)*rate);};
    add('상품 소계','Item subtotal','商品小計',17600,subtotal);add('할인 금액','Discount amount','割引額',2000,reduction(subtotal));add('최종 청구','Final invoice','最終請求',17160,final(subtotal));
    add('15,000원 경계 청구','Invoice at 15,000 boundary','15,000境界の請求',14300,final(15000));add('0개 청구','Empty invoice','0個の請求',0,final(0));
    add('14,999원 할인 없음','No discount at 14,999','14,999では割引なし',0,reduction(14999));
    add('세율 10%','Tax rate 10%','税率10%',0.1,rate);
    add('원본 상품 수량과 단가 유지','Keep original quantities and unit prices','元の数量と単価を維持',true,unchanged('items.csv',['item','quantity','unit'],['quantity','unit']));break;
   }
   case 'community-api':{
    const c=json(files,'routes.json'),read=obj(c.read),write=obj(c.write),persist=flag(c.persist);
    const routes=[{path:text(read.path),method:text(read.method,['GET','POST']),status:200},{path:text(write.path),method:text(write.method,['GET','POST']),status:201}];
    const request=(path:string,method:string)=>routes.find(r=>r.path===path&&r.method===method)?.status??404;
    add('행사 목록 GET','Events GET','行事一覧GET',200,request('/api/events','GET'));add('신청 POST','Registration POST','申込POST',201,request('/api/rsvp','POST'));
    add('신청 보관 수','Stored registrations','保存申込数',1,request('/api/rsvp','POST')===201&&persist?1:0);
    add('없는 주소','Missing address','ないアドレス',404,request('/api/missing','GET'));add('목록 POST 거절','Reject POST to list','一覧POSTを断る',404,request('/api/events','POST'));break;
   }
   case 'photo-cache':{
    const c=json(files,'cache.json'),asset=integer(c.assetMaxAge),privateAge=integer(c.privateMaxAge),vary=flag(c.varyAuth);
    add('공개 로고 보관 초','Public logo cache seconds','公開ロゴ保存秒',86400,asset);add('개인 화면 보관 초','Private page cache seconds','個人画面保存秒',0,privateAge);
    add('Lio 로그인 화면','Lio login screen','Lioログイン画面','Lio',privateAge>0&&!vary?'Mina':'Lio');add('사용자 구분','Separate users','利用者区別',true,vary);break;
   }
   case 'transit-logs':{
    const c=json(files,'report.json'),level=text(c.level,['INFO','WARN','ERROR']),status=integer(c.status,100,599),group=text(c.groupBy,['route','level']);
    const logLines=files['service.log'].trim().split(/\r?\n/);
    const entries=logLines.map(line=>{const m=line.match(/^(\d{2}:\d{2}) (INFO|WARN|ERROR) (\/[A-Za-z0-9/_-]+) (\d{3})$/);if(!m)throw new Error('unsupported log line');time(m[1]);return {level:m[2],route:m[3],status:+m[4]};});if(entries.length>100)throw new Error('log limit');
    const selected=entries.filter(r=>r.level===level&&r.status===status),counts:Record<string,number>=Object.create(null);for(const r of selected){const key=group==='route'?r.route:r.level;counts[key]=(counts[key]??0)+1;}
    add('선택한 장애 수','Selected outage count','選んだ障害数',3,selected.length);add('/arrivals 장애','/arrivals outages','/arrivals障害',2,counts['/arrivals']??0);add('/tickets 장애','/tickets outages','/tickets障害',1,counts['/tickets']??0);
    add('원본 로그 모두 유지','Keep every original log entry','元ログをすべて維持',JSON.stringify(job.files['service.log'].trim().split(/\r?\n/).sort()),JSON.stringify([...logLines].sort()));break;
   }
   case 'archive-backup':{
    const c=json(files,'retention.json'),max=integer(c.maxDays,0,3650),inclusive=flag(c.inclusive),rows=csv(files,'copies.csv',['name','daysOld','sizeMB']);
    const kept=rows.filter(r=>{const age=csvNumber(r.daysOld);csvNumber(r.sizeMB);return inclusive?age<=max:age<max;});
    add('오늘 사본 보관','Keep today copy','今日のコピー保管',true,kept.some(r=>r.name==='today'));add('7일 사본 보관','Keep seven-day copy','7日コピー保管',true,kept.some(r=>r.name==='weekly'));add('8일 사본 보관','Keep eight-day copy','8日コピー保管',false,kept.some(r=>r.name==='old'));
    add('보관 크기 MB','Retained size MB','保管サイズMB',39,kept.reduce((sum,r)=>sum+csvNumber(r.sizeMB),0));
    add('원본 사본 기록 유지','Keep original copy records','元のコピー記録を維持',true,unchanged('copies.csv',['name','daysOld','sizeMB'],['daysOld','sizeMB']));break;
   }
   case 'tutor-timezone':{
    const c=json(files,'timezone.json'),offset=integer(c.offsetHours,-12,14),carry=flag(c.carryDay);
    const local=(hour:number)=>{const shifted=hour+offset,day=carry?Math.floor(shifted/24):0,h=((shifted%24)+24)%24;return `D${day>=0?'+':''}${day} ${String(h).padStart(2,'0')}:00`;};
    [23,2,18].forEach((hour,i)=>add(`UTC ${String(hour).padStart(2,'0')}:00`,`UTC ${String(hour).padStart(2,'0')}:00`,`UTC ${String(hour).padStart(2,'0')}:00`,['D+1 08:00','D+0 11:00','D+1 03:00'][i],local(hour)));break;
   }
   case 'festival-report':{
    const c=json(files,'summary.json'),include=text(c.includeStatus,['paid','pending','refunded','all']),operation=text(c.operation,['add','multiply']),group=text(c.groupBy,['booth','status']);
    const rows=csv(files,'sales.csv',['booth','quantity','unit','status']);for(const r of rows){csvNumber(r.quantity);csvNumber(r.unit);text(r.status,['paid','pending','refunded']);}
    const selected=rows.filter(r=>include==='all'||r.status===include),totals:Record<string,number>=Object.create(null);for(const r of selected){const quantity=csvNumber(r.quantity),unit=csvNumber(r.unit),value=operation==='multiply'?quantity*unit:quantity+unit;totals[r[group]]=(totals[r[group]]??0)+value;}
    add('bread 받은 돈','bread money received','bread受取額',8000,totals.bread??0);add('craft 받은 돈','craft money received','craft受取額',10000,totals.craft??0);add('전체 받은 돈','Total money received','全受取額',18000,Object.values(totals).reduce((sum,n)=>sum+n,0));add('결제된 행 수','Paid row count','支払済行数',3,selected.length);
    add('환불·미결제 포함 원본 표 유지','Keep original table including refunds and pending','返金・未払いを含む元表を維持',true,unchanged('sales.csv',['booth','quantity','unit','status'],['quantity','unit']));break;
   }
   default:return bad('unsupported job');
  }
  return proof(cases);
 }catch(error){return bad(error instanceof Error?error.message:'invalid source');}
}
/** Only call after an explicit player request to see an answer. Never used by evaluation. */
export function exampleSolution(id:string):Record<string,string> {
 const job=CAREER_JOBS.find(j=>j.id===id);if(!job)return {};
 const files={...job.files};const set=(path:string,value:unknown)=>{files[path]=JSON.stringify(value,null,2)+'\n';};
 switch(id){
  case 'bakery-price':set('pricing.json',{unitPrice:1800,packSize:6,packPrice:10000});break;
  case 'library-loans':set('policy.json',{limit:3,inclusive:true,allowOverdue:false});break;
  case 'florist-stock':files['inventory.csv']='name,stock,reserved\nrose,12,5\ntulip,8,0\nlily,3,3\n';break;
  case 'bike-hours':set('hours.json',{opens:9,closes:18,lastEntry:17,closedDays:['sun']});break;
  case 'contacts-clean':set('clean.json',{trim:true,lowercase:true,deduplicate:true,skipBlank:true});break;
  case 'clinic-form':files['booking.html']='<form>\n  <label for="name">Name</label>\n  <input id="name" name="name" type="text" required>\n  <button type="submit">Book</button>\n</form>\n';break;
  case 'market-filter':set('filter.json',{field:'stock',operator:'>',value:0,requireFresh:true});break;
  case 'school-sort':set('sort.json',{field:'score',direction:'desc',tie:'name'});break;
  case 'workshop-slots':files['schedule.csv']='id,start,end\nA,09:00,10:00\nB,10:00,11:00\nC,11:00,12:00\n';break;
  case 'delivery-fees':set('delivery.json',{base:2000,perKm:300,freeAt:20000,maxKm:10});break;
  case 'museum-layout':files['gallery.css']='.gallery {\n  width: 100%;\n  max-width: 900px;\n  padding: 16px;\n  box-sizing: border-box;\n}\n';break;
  case 'bookstore-invoice':set('invoice.json',{discountMin:15000,discount:2000,taxRate:0.1,discountBeforeTax:true});break;
  case 'community-api':set('routes.json',{read:{path:'/api/events',method:'GET'},write:{path:'/api/rsvp',method:'POST'},persist:true});break;
  case 'photo-cache':set('cache.json',{assetMaxAge:86400,privateMaxAge:0,varyAuth:true});break;
  case 'transit-logs':set('report.json',{level:'ERROR',status:503,groupBy:'route'});break;
  case 'archive-backup':set('retention.json',{maxDays:7,inclusive:true});break;
  case 'tutor-timezone':set('timezone.json',{offsetHours:9,carryDay:true});break;
  case 'festival-report':set('summary.json',{includeStatus:'paid',operation:'multiply',groupBy:'booth'});break;
 }
 return files;
}
