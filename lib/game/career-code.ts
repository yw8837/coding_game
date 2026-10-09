import {CAREER_JOBS,L,type Localized} from './career-content.ts';
import {runCode,type CodeValue,type CodeError} from './code-lab-runtime.ts';
import type {CareerCheck,CareerEvaluation} from './career-evaluation.ts';

export const CAREER_CODE_IDS=['bakery-price','library-loans','contacts-clean','delivery-fees','festival-report'] as const;
export const CAREER_CODE_FILE='solution.js',CAREER_CODE_MODE_FILE='solution-mode.json';
export type CareerCodeMode='config'|'javascript';
type Spec={contract:Localized;hint:Localized;starter:string;sample:CodeValue};
const specs:Record<string,Spec>={
 'bakery-price':{contract:L('input.quantity: 0~1,000 사이의 정수. 출력: 합계 숫자. 빵 6개 묶음은 10,000원, 나머지 낱개는 1,800원입니다.','input.quantity: integer 0–1,000. Return the numeric total: each six-roll box costs 10,000; leftover singles cost 1,800.','input.quantity: 0〜1,000の整数。合計数値を返します。6個入りは10,000、残りの単品は1,800です。'),hint:L('몫과 나머지로 상자와 낱개를 나누거나, 6개씩 빼는 반복문을 써 보세요.','Split boxes and singles with division and remainder, or subtract six in a loop.','商と余りで箱と単品を分けるか、6個ずつ引くループを使います。'),starter:'function solve(input) {\n  return input.quantity * 1800;\n}\n',sample:{quantity:8}},
 'library-loans':{contract:L('input.borrowed, requested: 0~50 정수. overdueDays: 0~365 정수. 출력: boolean. 합계가 3권 이하이고 연체일이 0이면 true입니다.','input.borrowed and requested: integers 0–50; overdueDays: integer 0–365. Return true only when the total is at most three books and there are zero overdue days.','input.borrowedとrequested: 0〜50の整数。overdueDays: 0〜365の整数。合計3冊以下で延滞0日のときだけtrueを返します。'),hint:L('권수 경계는 3도 포함합니다. 연체 조건과 권수 조건을 함께 확인하세요.','The boundary includes three. Combine the book limit with the overdue condition.','境界は3も含みます。冊数条件と延滞条件を合わせます。'),starter:'function solve(input) {\n  return input.borrowed + input.requested < 3;\n}\n',sample:{borrowed:2,requested:1,overdueDays:0}},
 'contacts-clean':{contract:L('input.emails: 최대 30개의 문자열. 출력: 문자열 배열. 앞뒤 공백 제거→소문자→빈 주소 제거→중복 제거. 첫 등장 순서를 유지합니다.','input.emails: up to 30 strings. Return an array: trim, lowercase, remove blanks and duplicates, retaining first-occurrence order.','input.emails: 最大30の文字列。前後空白を除去→小文字化→空欄と重複を除去した配列を、初出順で返します。'),hint:L('trim()과 toLowerCase()를 적용한 뒤, includes()로 이미 넣은 주소인지 확인해 보세요.','Use trim() and toLowerCase(), then includes() to check whether an address is already in the output.','trim()とtoLowerCase()後、includes()で出力済みか確認します。'),starter:'function solve(input) {\n  return input.emails;\n}\n',sample:{emails:[' LUNA@Example.test ','luna@example.test','','Jun@example.test']}},
 'delivery-fees':{contract:L('input.km: 0~100 숫자, total: 0~100,000 정수. 출력: 요금 숫자 또는 "unavailable". 10km 초과는 거절; 나머지는 20,000원 이상 무료, 아니면 2,000+300×km.','input.km: number 0–100; total: integer 0–100,000. Return a numeric fee or "unavailable": reject over 10km first; otherwise free at 20,000 or more, or 2,000 + 300 × km.','input.km: 0〜100の数値、total: 0〜100,000の整数。10km超は"unavailable"、範囲内で20,000以上は0、それ以外は2,000+300×kmを返します。'),hint:L('무료 조건보다 거리 한도를 먼저 확인하세요. 10km와 20,000원은 포함됩니다.','Check distance before free delivery. Both 10km and 20,000 are inclusive boundaries.','無料条件より先に距離を確認します。10kmと20,000は境界に含みます。'),starter:'function solve(input) {\n  return 2000 + input.km * 300;\n}\n',sample:{km:10,total:20000}},
 'festival-report':{contract:L('input.sales: 최대 30행 {booth,quantity,unit,status}. quantity 0~100, unit 0~10,000, status는 paid/pending/refunded. 출력: {totals:{부스:받은돈},paidCount:결제행수}. paid만 quantity×unit로 합산하며 행이 없으면 {totals:{},paidCount:0}.','input.sales: up to 30 rows {booth, quantity, unit, status}. quantity 0–100, unit 0–10,000; status paid/pending/refunded. Return {totals:{booth:money},paidCount:number}, summing quantity × unit for paid rows only. Empty input returns {totals:{},paidCount:0}.','input.sales: 最大30行{booth,quantity,unit,status}。quantityは0〜100、unitは0〜10,000、statusはpaid/pending/refunded。paidだけquantity×unitを合計し、{totals:{ブース:金額},paidCount:件数}を返します。空配列なら{totals:{},paidCount:0}。'),hint:L('paid 행만 남긴 뒤 부스별 누계를 만드세요. 새 부스는 0에서 시작하고 빈 목록도 반환해야 합니다.','Filter paid rows and accumulate totals by booth. Start new booths at zero and handle an empty list.','paid行だけ残しブース別に合計します。新しいブースは0から始め、空配列も処理します。'),starter:'function solve(input) {\n  return {totals: {}, paidCount: 0};\n}\n',sample:{sales:[{booth:'bread',quantity:2,unit:2000,status:'paid'},{booth:'bread',quantity:5,unit:2000,status:'pending'}]}},
};
export function careerCodeSpec(id:string):Spec|null{return specs[id]??null;}
export function allowedCareerFile(id:string,path:string):boolean {
 const job=CAREER_JOBS.find(job=>job.id===id);
 return !!job&&(Object.hasOwn(job.files,path)||!!specs[id]&&(path===CAREER_CODE_FILE||path===CAREER_CODE_MODE_FILE));
}
export function careerCodeMode(files:Record<string,string>):CareerCodeMode {
 if(Object.hasOwn(files,CAREER_CODE_MODE_FILE)){
  const marker=JSON.parse(files[CAREER_CODE_MODE_FILE]);
  if(!marker||typeof marker!=='object'||Array.isArray(marker)||Object.keys(marker).length!==1||!['config','javascript'].includes(marker.mode))throw Error('solution-mode.json requires {"mode":"config"} or {"mode":"javascript"}');
  return marker.mode;
 }
 return Object.hasOwn(files,CAREER_CODE_FILE)?'javascript':'config';
}
/** Rendering fallback only; evaluateCareer still rejects malformed mode markers. */
export function careerCodeModeSafe(files:Record<string,string>):CareerCodeMode {
 try{return careerCodeMode(files);}catch{return 'javascript';}
}
function equal(a:CodeValue,b:CodeValue):boolean {
 if(a===b)return true;if(a===null||b===null||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const keys=Object.keys(a).sort(),other=Object.keys(b).sort();
 return keys.length===other.length&&keys.every((key,i)=>key===other[i]&&equal((a as Record<string,CodeValue>)[key],(b as Record<string,CodeValue>)[key]));
}
type Sale={booth:string;quantity:number;unit:number;status:string};
function validInput(id:string,input:unknown):input is CodeValue {
 if(!input||typeof input!=='object'||Array.isArray(input))return false;
 const x=input as Record<string,unknown>,integer=(v:unknown,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=max;
 if(id==='bakery-price')return integer(x.quantity,1000);
 if(id==='library-loans')return integer(x.borrowed,50)&&integer(x.requested,50)&&integer(x.overdueDays,365);
 if(id==='delivery-fees')return typeof x.km==='number'&&Number.isFinite(x.km)&&x.km>=0&&x.km<=100&&integer(x.total,100000);
 if(id==='contacts-clean')return Array.isArray(x.emails)&&x.emails.length<=30&&x.emails.every(email=>typeof email==='string'&&email.length<=80);
 if(id==='festival-report')return Array.isArray(x.sales)&&x.sales.length<=30&&x.sales.every(value=>{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;const row=value as Record<string,unknown>;
  return typeof row.booth==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,30}$/.test(row.booth)&&!Object.getOwnPropertyNames(Object.prototype).includes(row.booth)&&row.booth!=='prototype'&&integer(row.quantity,100)&&integer(row.unit,10000)&&typeof row.status==='string'&&['paid','pending','refunded'].includes(row.status);
 });
 return false;
}
function expected(id:string,input:CodeValue):CodeValue {
 const x=input as Record<string,CodeValue>;
 if(id==='bakery-price'){const n=x.quantity as number;return Math.floor(n/6)*10000+(n%6)*1800;}
 if(id==='library-loans')return (x.borrowed as number)+(x.requested as number)<=3&&x.overdueDays===0;
 if(id==='delivery-fees')return (x.km as number)>10?'unavailable':(x.total as number)>=20000?0:2000+300*(x.km as number);
 if(id==='contacts-clean')return [...new Set((x.emails as string[]).map(email=>email.trim().toLowerCase()).filter(Boolean))];
 const totals:Record<string,CodeValue>={};let paidCount=0;
 for(const row of x.sales as Sale[]){if(row.status!=='paid')continue;totals[row.booth]=((totals[row.booth] as number)??0)+row.quantity*row.unit;paidCount++;}
 return {totals,paidCount};
}
export type CareerCodeRun={input:CodeValue|null;expected:CodeValue|null;actual:CodeValue|null;error:CodeError|null;steps:number;passed:boolean};
function run(id:string,source:string,input:CodeValue):CareerCodeRun {
 const result=runCode(source,input),want=expected(id,input);
 return {input,expected:want,actual:result.value,error:result.error,steps:result.steps,passed:!result.error&&equal(result.value,want)};
}
export function runCareerCode(id:string,source:string,inputText:string):CareerCodeRun {
 try{
  if(!specs[id]||inputText.length>4000)throw Error('Choose a supported job and at most 4,000 input characters.');
  const input:unknown=JSON.parse(inputText);if(!validInput(id,input))throw Error('Input does not match this job’s documented fields and limits.');
  return run(id,source,input);
 }catch(error){return {input:null,expected:null,actual:null,error:{kind:'runtime',message:error instanceof Error?error.message:'Invalid input'},steps:0,passed:false};}
}
/** The same bounded CSV grammar as the config route; rows are data, never code. */
function csv(source:string,columns:string[]):Record<string,string>[] {
 const lines=source.split(/\r?\n/);while(lines.at(-1)==='')lines.pop();if(lines.length<2||lines.length>101)throw Error('CSV needs 1–100 rows');
 const cells=(line:string)=>{const out:string[]=[];let cell='',quoted=false,closed=false;
  for(let i=0;i<line.length;i++){const ch=line[i];if(quoted){if(ch==='"'){if(line[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=ch;}else if(ch===','){out.push(cell);cell='';closed=false;}else if(ch==='"'){if(cell||closed)throw Error('misplaced quote');quoted=true;}else{if(closed&&ch.trim())throw Error('text after quote');if(!closed)cell+=ch;}}
  if(quoted)throw Error('unclosed quote');out.push(cell);return out;};
 const headers=cells(lines[0]);if(new Set(headers).size!==headers.length||!headers.every(h=>/^[A-Za-z][A-Za-z0-9]*$/.test(h))||!columns.every(h=>headers.includes(h)))throw Error('missing CSV columns');
 return lines.slice(1).map(line=>{const values=cells(line);if(values.length!==headers.length)throw Error('CSV column count');return Object.fromEntries(headers.map((h,i)=>[h,values[i]]));});
}
function sameRows(rows:Record<string,string>[],original:Record<string,string>[],columns:string[],numbers:string[]=[]):boolean {
 const signature=(values:Record<string,string>[])=>JSON.stringify(values.map(row=>JSON.stringify(columns.map(key=>numbers.includes(key)?Number(row[key]):row[key]))).sort());return signature(rows)===signature(original);
}
const display=(value:unknown)=>typeof value==='string'?value:JSON.stringify(value)??'null';
/** Builds legacy scene checks first, then behavior checks on varied inputs. */
export function evaluateCareerCode(id:string,files:Record<string,string>):CareerEvaluation {
 if(!specs[id])throw Error('JavaScript mode is unavailable for this job');
 const source=files[CAREER_CODE_FILE];if(typeof source!=='string'||source.length>12000)throw Error('solution.js is required and limited to 12,000 characters');
 const checks:CareerCheck[]=[];
 const add=(ko:string,en:string,ja:string,want:unknown,actual:unknown)=>checks.push({name:L(ko,en,ja),expected:display(want),actual:display(actual),passed:display(want)===display(actual)});
 const result=(input:CodeValue)=>{const value=run(id,source,input);return value.error?`${value.error.kind}${value.error.line?' · line '+value.error.line:''}: ${value.error.message}`:value.actual;};
 const cases:CodeValue[]=[];
 if(id==='bakery-price'){
  [0,6,8].forEach((n,i)=>add(`${n}개 합계`,`${n} rolls total`,`${n}個合計`,[0,10000,13600][i],result({quantity:n})));
  add('낱개 1개','One single','単品1個',1800,result({quantity:1}));add('상자 미만 3개','Three singles below a full box','1箱未満の単品3個',5400,result({quantity:3}));
  for(const quantity of [2,4,5,7,10,11,12,13,17,18,29,37,61,101,1000])cases.push({quantity});
 }else if(id==='library-loans'){
  add('2권 + 1권, 연체 없음','2 + 1 books, no overdue','2冊+1冊、延滞なし',true,result({borrowed:2,requested:1,overdueDays:0}));
  add('3권 + 1권, 연체 없음','3 + 1 books, no overdue','3冊+1冊、延滞なし',false,result({borrowed:3,requested:1,overdueDays:0}));
  add('0권 + 1권, 연체 1일','0 + 1 books, one day overdue','0冊+1冊、延滞1日',false,result({borrowed:0,requested:1,overdueDays:1}));
  for(let i=0;i<18;i++)cases.push({borrowed:i%5,requested:Math.floor(i/5),overdueDays:i%3===0?2:0});cases.push({borrowed:0,requested:3,overdueDays:0},{borrowed:3,requested:0,overdueDays:0},{borrowed:0,requested:0,overdueDays:0},{borrowed:50,requested:50,overdueDays:365});
 }else if(id==='contacts-clean'){
  const rows=csv(files['contacts.csv'],['name','email']),original=csv(CAREER_JOBS.find(job=>job.id===id)!.files['contacts.csv'],['name','email']);
  const output=result({emails:rows.map(row=>row.email)}),emails=Array.isArray(output)?output:[];
  add('Luna 정리한 주소','Luna normalized address','Lunaの整理したアドレス','luna@example.test',typeof output==='string'?output:emails.find(email=>email==='luna@example.test')??'missing');
  add('Jun 정리한 주소','Jun normalized address','Junの整理したアドレス','jun@example.test',typeof output==='string'?output:emails.find(email=>email==='jun@example.test')??'missing');
  add('발송 대상 수','Recipient count','宛先数',2,typeof output==='string'?output:emails.length);add('빈 주소 포함','Contains blank address','空欄を含む',false,typeof output==='string'?output:emails.some(email=>typeof email!=='string'||!email.trim()));
  add('원본 연락처 표 유지','Keep original contact table','元の連絡先表を維持',true,sameRows(rows,original,['name','email']));
  for(const emails of [[],['  '],[' Other@Example.test ','other@example.test',' N@Example.test '],['B@x.test','A@x.test','b@x.test'],['X@x.test','','  ','x@x.test'],['new@x.test'],rows.map(row=>row.email),Array.from({length:12},(_,i)=>` User${i%4}@Example.test `)])cases.push({emails});
  cases.push({emails:Array.from({length:30},(_,i)=>` Unique${i}@Example.test `)});
 }else if(id==='delivery-fees'){
  add('3km · 5,000원 주문','3km · order 5,000','3km · 注文5,000',2900,result({km:3,total:5000}));add('10km · 20,000원 주문','10km · order 20,000','10km · 注文20,000',0,result({km:10,total:20000}));
  add('11km · 30,000원 주문','11km · order 30,000','11km · 注文30,000','unavailable',result({km:11,total:30000}));add('0km · 1,000원 주문','0km · order 1,000','0km · 注文1,000',2000,result({km:0,total:1000}));
  add('3km · 19,999원 주문','3km · order 19,999','3km · 注文19,999',2900,result({km:3,total:19999}));
  add('최대 배달 거리 km','Maximum delivery distance km','最大配達距離km',10,result({km:10,total:0})===5000&&result({km:10.01,total:20000})==='unavailable'?10:'invalid boundary');
  for(const km of [0,0.5,2,9.5,10,10.01,11,17])for(const total of [0,19999,20000,20001])cases.push({km,total});
 }else{
  const columns=['booth','quantity','unit','status'],rows=csv(files['sales.csv'],columns),original=csv(CAREER_JOBS.find(job=>job.id===id)!.files['sales.csv'],columns);
  const sales=rows.map(row=>{if(!/^\d+(?:\.\d+)?$/.test(row.quantity)||!/^\d+(?:\.\d+)?$/.test(row.unit))throw Error('invalid numeric cell');return {...row,quantity:Number(row.quantity),unit:Number(row.unit)};});
  if(!validInput(id,{sales}))throw Error('Sales data is outside the documented contract');
  const output=result({sales}) as CodeValue,report=output&&typeof output==='object'&&!Array.isArray(output)?output as Record<string,CodeValue>:null,totals=report?.totals&&typeof report.totals==='object'&&!Array.isArray(report.totals)?report.totals as Record<string,CodeValue>:{};
  add('bread 받은 돈','bread money received','bread受取額',8000,typeof output==='string'?output:totals.bread??0);add('craft 받은 돈','craft money received','craft受取額',10000,typeof output==='string'?output:totals.craft??0);
  add('전체 받은 돈','Total money received','全受取額',18000,typeof output==='string'?output:Object.values(totals).reduce<number>((sum,n)=>typeof n==='number'?sum+n:NaN,0));add('결제된 행 수','Paid row count','支払済行数',3,typeof output==='string'?output:report?.paidCount??0);
  add('환불·미결제 포함 원본 표 유지','Keep original table including refunds and pending','返金・未払いを含む元表を維持',true,sameRows(rows,original,columns,['quantity','unit']));
  cases.push({sales:[]},{sales});
  for(let i=0;i<10;i++)cases.push({sales:[{booth:i%2?'tea':'music',quantity:i,unit:137+i*23,status:'paid'},{booth:'art',quantity:9,unit:9000,status:i%2?'refunded':'pending'},{booth:i%2?'tea':'music',quantity:2,unit:41,status:'paid'}]});
  cases.push({sales:[{booth:'tea',quantity:0,unit:10,status:'paid'}]},{sales:[{booth:'bread',quantity:1,unit:4,status:'pending'}]});
  cases.push({sales:Array.from({length:30},(_,i)=>({booth:'stall'+i%5,quantity:i%7,unit:19+i,status:i%4===0?'pending':'paid'}))});
 }
 for(const [index,input] of cases.entries()){
  const row=run(id,source,input),actual=row.error?`${row.error.kind}${row.error.line?' · line '+row.error.line:''}: ${row.error.message}`:row.actual;
  checks.push({name:L(`변경 입력 ${index+1} · ${JSON.stringify(input)}`,`Varied input ${index+1} · ${JSON.stringify(input)}`,`別の入力 ${index+1} · ${JSON.stringify(input)}`),expected:display(row.expected),actual:display(actual),passed:row.passed});
  // One bounded failure is sufficient; avoid repeating a budget failure 32 times.
  if(row.error)break;
 }
 return {passed:checks.every(check=>check.passed),checks,preview:checks.map(check=>({label:check.name,value:check.actual}))};
}
