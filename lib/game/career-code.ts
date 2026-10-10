import {CAREER_JOBS,L,type Localized} from './career-content.ts';
import {runCode,type CodeValue,type CodeError,type CodeResult} from './code-lab-runtime.ts';
import type {CareerCheck,CareerEvaluation} from './career-evaluation.ts';

export const CAREER_CODE_IDS=['bakery-price','library-loans','contacts-clean','delivery-fees','photo-cache','transit-logs','archive-backup','tutor-timezone','festival-report'] as const;
export const CAREER_CODE_FILE='solution.js',CAREER_CODE_MODE_FILE='solution-mode.json';
export type CareerCodeMode='config'|'javascript';
type Spec={contract:Localized;hint:Localized;starter:string;sample:CodeValue};
const specs:Record<string,Spec>={
 'bakery-price':{contract:L('input.quantity: 0~1,000 사이의 정수. 출력: 합계 숫자. 빵 6개 묶음은 10,000원, 나머지 낱개는 1,800원입니다.','input.quantity: integer 0–1,000. Return the numeric total: each six-roll box costs 10,000; leftover singles cost 1,800.','input.quantity: 0〜1,000の整数。合計数値を返します。6個入りは10,000、残りの単品は1,800です。'),hint:L('몫과 나머지로 상자와 낱개를 나누거나, 6개씩 빼는 반복문을 써 보세요.','Split boxes and singles with division and remainder, or subtract six in a loop.','商と余りで箱と単品を分けるか、6個ずつ引くループを使います。'),starter:'function solve(input) {\n  return input.quantity * 1800;\n}\n',sample:{quantity:8}},
 'library-loans':{contract:L('input.borrowed, requested: 0~50 정수. overdueDays: 0~365 정수. 출력: boolean. 합계가 3권 이하이고 연체일이 0이면 true입니다.','input.borrowed and requested: integers 0–50; overdueDays: integer 0–365. Return true only when the total is at most three books and there are zero overdue days.','input.borrowedとrequested: 0〜50の整数。overdueDays: 0〜365の整数。合計3冊以下で延滞0日のときだけtrueを返します。'),hint:L('권수 경계는 3도 포함합니다. 연체 조건과 권수 조건을 함께 확인하세요.','The boundary includes three. Combine the book limit with the overdue condition.','境界は3も含みます。冊数条件と延滞条件を合わせます。'),starter:'function solve(input) {\n  return input.borrowed + input.requested < 3;\n}\n',sample:{borrowed:2,requested:1,overdueDays:0}},
 'contacts-clean':{contract:L('input.emails: 최대 30개의 문자열. 출력: 문자열 배열. 앞뒤 공백 제거→소문자→빈 주소 제거→중복 제거. 첫 등장 순서를 유지합니다.','input.emails: up to 30 strings. Return an array: trim, lowercase, remove blanks and duplicates, retaining first-occurrence order.','input.emails: 最大30の文字列。前後空白を除去→小文字化→空欄と重複を除去した配列を、初出順で返します。'),hint:L('trim()과 toLowerCase()를 적용한 뒤, includes()로 이미 넣은 주소인지 확인해 보세요.','Use trim() and toLowerCase(), then includes() to check whether an address is already in the output.','trim()とtoLowerCase()後、includes()で出力済みか確認します。'),starter:'function solve(input) {\n  return input.emails;\n}\n',sample:{emails:[' LUNA@Example.test ','luna@example.test','','Jun@example.test']}},
 'delivery-fees':{contract:L('input.km: 0~100 숫자, total: 0~100,000 정수. 출력: 요금 숫자 또는 "unavailable". 10km 초과는 거절; 나머지는 20,000원 이상 무료, 아니면 2,000+300×km.','input.km: number 0–100; total: integer 0–100,000. Return a numeric fee or "unavailable": reject over 10km first; otherwise free at 20,000 or more, or 2,000 + 300 × km.','input.km: 0〜100の数値、total: 0〜100,000の整数。10km超は"unavailable"、範囲内で20,000以上は0、それ以外は2,000+300×kmを返します。'),hint:L('무료 조건보다 거리 한도를 먼저 확인하세요. 10km와 20,000원은 포함됩니다.','Check distance before free delivery. Both 10km and 20,000 are inclusive boundaries.','無料条件より先に距離を確認します。10kmと20,000は境界に含みます。'),starter:'function solve(input) {\n  return 2000 + input.km * 300;\n}\n',sample:{km:10,total:20000}},
 'photo-cache':{contract:L('공유 캐시가 저장해 둔 응답을 다시 줄지 판정합니다. input.cacheControl: Cache-Control 값(쉼표로 구분, 지시어는 각각 한 번). input.vary: Vary 값(빈 문자열 가능). input.age: 저장 후 지난 초, 0~10,000,000 정수. input.sameUser: 저장할 때와 같은 사용자인지 boolean. 출력: {maxAge, action}. 지시어 이름은 대소문자와 앞뒤 공백을 무시합니다. no-store·no-cache·private 중 하나라도 있으면 maxAge는 0, 아니면 s-maxage=N, 없으면 max-age=N, 둘 다 없으면 0입니다. age < maxAge이고 Vary에 Authorization이 있다면 sameUser도 true일 때만 "reuse", 그 밖에는 "refetch"입니다.','Decide whether a shared cache may reuse a stored response. input.cacheControl: the Cache-Control value (comma-separated; each directive at most once). input.vary: the Vary value (may be empty). input.age: seconds since storage, integer 0–10,000,000. input.sameUser: boolean, whether the same user stored it. Return {maxAge, action}. Directive names ignore case and surrounding spaces. If no-store, no-cache or private appears, maxAge is 0; otherwise use s-maxage=N, else max-age=N, else 0. action is "reuse" only when age < maxAge and, if Vary lists Authorization, sameUser is true; otherwise it is "refetch".','共有キャッシュが保存済みの応答を再利用できるか判定します。input.cacheControl: Cache-Controlの値(カンマ区切り、各ディレクティブは1回まで)。input.vary: Varyの値(空文字可)。input.age: 保存からの秒数、0〜10,000,000の整数。input.sameUser: 保存時と同じ利用者かのboolean。{maxAge, action}を返します。ディレクティブ名は大文字小文字と前後の空白を無視します。no-store・no-cache・privateのどれかがあればmaxAgeは0、なければs-maxage=N、それもなければmax-age=N、どちらもなければ0です。age < maxAgeで、VaryにAuthorizationがあればsameUserもtrueのときだけ"reuse"、それ以外は"refetch"です。'),hint:L('toLowerCase()와 split(","), trim()으로 지시어 목록을 만들고, "max-age=600"은 split("=")으로 이름과 숫자를 나누세요. s-maxage=0이어도 max-age보다 먼저 씁니다. age가 maxAge와 같으면 이미 만료예요.','Build the directive list with toLowerCase(), split(",") and trim(), then split "max-age=600" on "=" into a name and a Number. Even s-maxage=0 takes priority over max-age. An age equal to maxAge is already stale.','toLowerCase()とsplit(",")、trim()でディレクティブ一覧を作り、"max-age=600"はsplit("=")で名前と数値に分けます。s-maxage=0でもmax-ageより優先です。ageがmaxAgeと同じならすでに期限切れです。'),starter:'function solve(input) {\n  const directives = input.cacheControl.split(\',\').map(part => part.trim());\n  return {maxAge: 0, action: \'refetch\'};\n}\n',sample:{cacheControl:'private, max-age=600',vary:'Authorization',age:30,sameUser:false}},
 'transit-logs':{contract:L('input.logs: 최대 40행 {time:"HH:MM", level:"INFO"|"WARN"|"ERROR", route:"/주소", status:100~599 정수}. 여러 서버 로그를 합쳐서 시간순이 아닐 수 있어요. input.level·status·from·to는 찾을 조건입니다. 출력: {count, byRoute, first, last}. level과 status가 같고 시각이 from 이상 to 이하인 행만 셉니다. byRoute는 일치한 주소별 건수(일치한 주소만), first/last는 일치한 행의 가장 이른/늦은 시각이며 없으면 null입니다.','input.logs: up to 40 rows {time:"HH:MM", level:"INFO"|"WARN"|"ERROR", route:"/path", status: integer 100–599}, merged from several servers and possibly out of order. input.level, status, from and to are the search conditions. Return {count, byRoute, first, last}: count rows whose level and status match and whose time is between from and to inclusive. byRoute maps each matching route to its count (matching routes only); first/last are the earliest/latest matching times, or null when nothing matches.','input.logs: 最大40行{time:"HH:MM", level:"INFO"|"WARN"|"ERROR", route:"/パス", status:100〜599の整数}。複数サーバーのログを合わせたため時刻順とは限りません。input.level・status・from・toが検索条件です。{count, byRoute, first, last}を返します。levelとstatusが一致し、時刻がfrom以上to以下の行だけを数えます。byRouteは一致したアドレスごとの件数(一致したアドレスのみ)、first/lastは一致した行の最も早い/遅い時刻で、なければnullです。'),hint:L('"HH:MM" 문자열은 <=, >=로 바로 비교할 수 있어요. 주소별 건수는 처음 본 주소를 배열에 기록하고 0으로 만든 뒤 더하세요. 가장 이른 시각은 첫 행이 아니라 비교로 찾습니다.','"HH:MM" strings compare correctly with <= and >=. For per-route counts, record each new route in an array and start it at 0 before adding. Find the earliest time by comparison, not by taking the first row.','"HH:MM"の文字列は<=や>=でそのまま比較できます。アドレス別件数は、初めてのアドレスを配列に記録して0から足します。最も早い時刻は先頭行ではなく比較で求めます。'),starter:'function solve(input) {\n  const matches = input.logs.filter(log => log.level === input.level);\n  return {count: matches.length, byRoute: {}, first: null, last: null};\n}\n',sample:{logs:[{time:'09:04',level:'ERROR',route:'/arrivals',status:503},{time:'09:01',level:'ERROR',route:'/arrivals',status:503},{time:'09:02',level:'WARN',route:'/tickets',status:404}],level:'ERROR',status:503,from:'09:00',to:'09:30'}},
 'archive-backup':{contract:L('input.copies: 최대 40개 {name, daysOld:0~3650 정수, sizeMB:0~100,000 정수}, 이름은 서로 다릅니다. input.maxDays: 0~3650 정수. 출력: {keep:[이름], totalMB}. daysOld가 maxDays 이하인 사본을 입력 순서대로 남기고, 남긴 사본의 sizeMB를 합칩니다. 단, 사본이 있는데 모두 만료됐다면 daysOld가 가장 작은 사본 하나(같으면 먼저 나온 것)는 남깁니다.','input.copies: up to 40 {name, daysOld: integer 0–3650, sizeMB: integer 0–100,000} with unique names; input.maxDays: integer 0–3650. Return {keep:[names], totalMB}: keep copies whose daysOld is at most maxDays, in input order, and sum their sizeMB. If copies exist but all have expired, keep the single youngest copy (the earliest listed on a tie).','input.copies: 最大40件{name, daysOld:0〜3650の整数, sizeMB:0〜100,000の整数}、名前は重複しません。input.maxDays: 0〜3650の整数。{keep:[名前], totalMB}を返します。daysOldがmaxDays以下のコピーを入力順に残し、残したコピーのsizeMBを合計します。ただしコピーがあるのに全部期限切れなら、daysOldが最小のコピー1つ(同じなら先のもの)を残します。'),hint:L('maxDays와 같은 날의 사본도 남겨요. 먼저 filter로 남길 사본을 고르고, 결과가 비었을 때만 가장 어린 사본을 찾으세요. 합계는 reduce로 구할 수 있어요.','A copy exactly maxDays old is kept. Filter first; only when the result is empty, look for the youngest copy. reduce can produce the total.','maxDaysちょうどのコピーも残します。まずfilterで選び、結果が空のときだけ最も新しいコピーを探します。合計はreduceで求められます。'),starter:'function solve(input) {\n  const kept = input.copies.filter(copy => copy.daysOld < input.maxDays);\n  return {keep: kept.map(copy => copy.name), totalMB: 0};\n}\n',sample:{copies:[{name:'today',daysOld:0,sizeMB:12},{name:'weekly',daysOld:7,sizeMB:14},{name:'old',daysOld:8,sizeMB:15}],maxDays:7}},
 'tutor-timezone':{contract:L('input.utc: 강사가 올린 UTC 시각 "HH:MM". input.offsetMinutes: 학생 지역의 UTC 시차(분), -720~840 사이 15의 배수. 출력: "D+1 08:00" 형식 문자열. D 뒤는 날짜 이동(-1, +0, +1), 그 뒤는 두 자리 시·분입니다.','input.utc: the teacher’s UTC time "HH:MM". input.offsetMinutes: the student’s UTC offset in minutes, a multiple of 15 from -720 to 840. Return a string such as "D+1 08:00": the day shift (-1, +0 or +1) after D, then a two-digit hour and minute.','input.utc: 講師が登録したUTC時刻"HH:MM"。input.offsetMinutes: 生徒の地域のUTC時差(分)、-720〜840の15の倍数。"D+1 08:00"形式の文字列を返します。Dの後は日付の移動(-1、+0、+1)、その後に2桁の時・分です。'),hint:L('분 단위로 바꿔 시차를 더한 뒤, 날짜는 Math.floor(합계 / 1440), 시각은 ((합계 % 1440) + 1440) % 1440으로 구하세요. 음수 나머지와 한 자리 숫자 앞의 "0"을 조심하세요(padStart는 지원하지 않아요).','Convert to minutes and add the offset. The day is Math.floor(total / 1440); the time of day is ((total % 1440) + 1440) % 1440. Watch for negative remainders, and pad single digits with "0" yourself (padStart is not supported).','分に直して時差を足し、日付はMath.floor(合計 / 1440)、時刻は((合計 % 1440) + 1440) % 1440で求めます。負の余りと、1桁の数字の前の"0"に注意してください(padStartは未対応です)。'),starter:'function solve(input) {\n  const parts = input.utc.split(\':\');\n  const hour = Number(parts[0]) + input.offsetMinutes / 60;\n  return \'D+0 \' + hour + \':\' + parts[1];\n}\n',sample:{utc:'23:00',offsetMinutes:540}},
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
type Log={time:string;level:string;route:string;status:number};
type Copy={name:string;daysOld:number;sizeMB:number};
const CLOCK=/^(?:[01]\d|2[0-3]):[0-5]\d$/,CACHE_FLAGS=['public','private','no-cache','no-store','must-revalidate','immutable'];
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
/** Each directive at most once; seconds directives carry digits only. An all-blank header has no directives. */
function cacheHeader(value:unknown):boolean {
 if(typeof value!=='string'||value.length>200)return false;if(!value.trim())return true;
 const seen:string[]=[];
 return value.split(',').every(part=>{
  const text=part.trim().toLowerCase(),seconds=text.match(/^(max-age|s-maxage|stale-while-revalidate)=(\d{1,8})$/),name=seconds?seconds[1]:text;
  if(seconds?Number(seconds[2])>10000000:!CACHE_FLAGS.includes(text))return false;if(seen.includes(name))return false;seen.push(name);return true;
 });
}
function validInput(id:string,input:unknown):input is CodeValue {
 if(!input||typeof input!=='object'||Array.isArray(input))return false;
 const x=input as Record<string,unknown>,integer=(v:unknown,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=max;
 const clock=(v:unknown)=>typeof v==='string'&&CLOCK.test(v);
 if(id==='photo-cache')return cacheHeader(x.cacheControl)&&typeof x.vary==='string'&&x.vary.length<=100&&(!x.vary.trim()||x.vary.split(',').every(name=>/^[A-Za-z][A-Za-z-]{0,40}$/.test(name.trim())))&&integer(x.age,10000000)&&typeof x.sameUser==='boolean';
 if(id==='transit-logs')return Array.isArray(x.logs)&&x.logs.length<=40&&typeof x.level==='string'&&['INFO','WARN','ERROR'].includes(x.level)&&typeof x.status==='number'&&Number.isInteger(x.status)&&x.status>=100&&x.status<=599&&clock(x.from)&&clock(x.to)&&(x.from as string)<=(x.to as string)&&x.logs.every(value=>record(value)&&clock(value.time)&&typeof value.level==='string'&&['INFO','WARN','ERROR'].includes(value.level)&&typeof value.route==='string'&&/^\/[A-Za-z0-9/_-]{0,40}$/.test(value.route)&&typeof value.status==='number'&&Number.isInteger(value.status)&&value.status>=100&&value.status<=599);
 if(id==='archive-backup')return Array.isArray(x.copies)&&x.copies.length<=40&&integer(x.maxDays,3650)&&x.copies.every(value=>record(value)&&typeof value.name==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,30}$/.test(value.name)&&integer(value.daysOld,3650)&&integer(value.sizeMB,100000))&&new Set(x.copies.map(value=>(value as Copy).name)).size===x.copies.length;
 if(id==='tutor-timezone')return clock(x.utc)&&typeof x.offsetMinutes==='number'&&Number.isInteger(x.offsetMinutes)&&x.offsetMinutes>=-720&&x.offsetMinutes<=840&&x.offsetMinutes%15===0;
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
 if(id==='photo-cache'){
  const directives=new Map<string,number|null>();
  for(const part of (x.cacheControl as string).toLowerCase().split(',')){const [name,value]=part.trim().split('=');if(name)directives.set(name,value===undefined?null:Number(value));}
  const maxAge=['no-store','no-cache','private'].some(name=>directives.has(name))?0:directives.get('s-maxage')??directives.get('max-age')??0;
  const varyAuth=(x.vary as string).toLowerCase().split(',').map(name=>name.trim()).includes('authorization');
  return {maxAge,action:(x.age as number)<maxAge&&(x.sameUser||!varyAuth)?'reuse':'refetch'};
 }
 if(id==='transit-logs'){
  const byRoute:Record<string,CodeValue>={};let count=0,first:string|null=null,last:string|null=null;
  for(const log of x.logs as Log[]){
   if(log.level!==x.level||log.status!==x.status||log.time<(x.from as string)||log.time>(x.to as string))continue;
   byRoute[log.route]=((byRoute[log.route] as number)??0)+1;count++;if(first===null||log.time<first)first=log.time;if(last===null||log.time>last)last=log.time;
  }
  return {count,byRoute,first,last};
 }
 if(id==='archive-backup'){
  const copies=x.copies as Copy[];let kept=copies.filter(copy=>copy.daysOld<=(x.maxDays as number));
  if(!kept.length&&copies.length)kept=[copies.reduce((youngest,copy)=>copy.daysOld<youngest.daysOld?copy:youngest)];
  return {keep:kept.map(copy=>copy.name),totalMB:kept.reduce((sum,copy)=>sum+copy.sizeMB,0)};
 }
 if(id==='tutor-timezone'){
  const [hour,minute]=(x.utc as string).split(':').map(Number),total=hour*60+minute+(x.offsetMinutes as number),day=Math.floor(total/1440),rest=((total%1440)+1440)%1440;
  const two=(n:number)=>String(n).padStart(2,'0');
  return `D${day<0?'-':'+'}${Math.abs(day)} ${two(Math.floor(rest/60))}:${two(rest%60)}`;
 }
 const totals:Record<string,CodeValue>={};let paidCount=0;
 for(const row of x.sales as Sale[]){if(row.status!=='paid')continue;totals[row.booth]=((totals[row.booth] as number)??0)+row.quantity*row.unit;paidCount++;}
 return {totals,paidCount};
}
/** `diagnosis` is a localized next step for a failed run; null when the run passed. */
export type CareerCodeRun={input:CodeValue|null;expected:CodeValue|null;actual:CodeValue|null;error:CodeError|null;steps:number;passed:boolean;diagnosis:Localized|null};
const INPUT_HINT=L('입력이 JSON 형식이 아니거나 위 계약의 필드·범위와 달라요. 따옴표, 필드 이름, 숫자 범위, 문자열 형식을 확인하세요.','The input is not valid JSON or does not match the contract above. Check quotes, field names, numeric ranges and string formats.','入力がJSON形式でないか、上の契約のフィールド・範囲と違います。引用符、フィールド名、数値の範囲、文字列の形式を確認してください。');
const failure=(error:CodeError)=>`${error.kind}${error.line?' · line '+error.line:''}: ${error.message}`;
/** Interpreter faults map to the construct to change; messages keep their English detail in `error`. */
function faultHint(error:CodeError):Localized {
 const m=error.message;
 if(error.kind==='syntax')return L('문법 오류예요. 표시된 줄 근처에서 괄호·중괄호·따옴표의 짝과 쉼표를 확인하세요.','Syntax error. Check paired brackets, braces and quotes, and the commas near the reported line.','構文エラーです。表示された行の近くで、括弧・波括弧・引用符の対応とカンマを確認してください。');
 if(error.kind==='budget')return L('실행 단계 한도를 넘었어요. 반복문이 끝나는 조건과, 반복문 안에서 배열 전체를 다시 도는 코드가 있는지 확인하세요.','The step budget ran out. Check that every loop ends, and avoid scanning the whole array again inside a loop.','実行ステップの上限を超えました。ループの終了条件と、ループ内で配列全体をもう一度走査していないか確認してください。');
 if(/^Unknown variable/.test(m))return L('이 실행기에는 input과 직접 선언한 변수만 있어요. console, Object, Date 같은 전역 값은 쓸 수 없어요.','Only input and variables you declare exist here. Globals such as console, Object and Date are unavailable.','この実行環境にあるのはinputと自分で宣言した変数だけです。console、Object、Dateなどのグローバル値は使えません。');
 if(/^(?:String|Array|Math)\.|^Method |^Function /.test(m))return L('지원하지 않는 함수예요. 문자열은 trim·toLowerCase·split·includes, 배열은 push·includes·slice·map·filter·reduce·join, Math는 min·max·floor·round, 그리고 Number·String을 쓸 수 있어요.','That function is unavailable. Strings support trim, toLowerCase, split and includes; arrays push, includes, slice, map, filter, reduce and join; Math min, max, floor and round; plus Number and String.','未対応の関数です。文字列はtrim・toLowerCase・split・includes、配列はpush・includes・slice・map・filter・reduce・join、Mathはmin・max・floor・round、ほかにNumber・Stringが使えます。');
 if(/TemplateLiteral/.test(m))return L('템플릿 문자열(`...`)은 지원하지 않아요. 문자열과 값을 +로 이어 붙이세요.','Template literals (`...`) are unsupported. Join strings and values with +.','テンプレート文字列(`...`)は未対応です。文字列と値を+でつなげてください。');
 if(/^Object has no own property/.test(m))return L('객체에 아직 없는 키를 읽었어요. 처음 보는 키는 먼저 0이나 빈 값으로 만든 뒤 더하세요. 만든 키 이름을 배열에 기록하고 includes()로 확인하면 안전해요.','The code read a key the object does not have yet. Create a new key with 0 or an empty value before adding to it; recording created keys in an array and checking includes() is a safe pattern.','オブジェクトにまだないキーを読みました。初めてのキーは先に0や空の値で作ってから足します。作ったキー名を配列に記録しincludes()で確認すると安全です。');
 if(/^No own item/.test(m))return L('배열이나 문자열의 범위 밖 위치, 또는 지원하지 않는 속성을 읽었어요. 인덱스를 length와 비교하세요.','The code read past the end of an array or string, or an unsupported property. Compare indexes with length.','配列や文字列の範囲外、または未対応のプロパティを読みました。インデックスをlengthと比べてください。');
 if(/^Property access requires|^Compare numbers or strings/.test(m))return L('null이나 숫자에서 속성을 읽거나 크기를 비교했어요. 아직 값이 없을 수 있는 변수는 === null로 먼저 확인하세요.','The code read a property of, or compared, a null or non-object value. Check variables that may still be null with === null first.','nullや数値のプロパティを読んだり大小比較したりしました。まだ値がないかもしれない変数は、先に=== nullで確認してください。');
 if(/finite number/.test(m))return L('숫자가 아닌 값으로 계산했어요. 문자열 숫자는 Number()로 바꾸고, 0으로 나누지 않았는지 확인하세요.','A calculation used a non-number. Convert numeric strings with Number() and check for division by zero.','数値以外で計算しました。数字の文字列はNumber()で変換し、0で割っていないか確認してください。');
 if(/^Cannot reassign const/.test(m))return L('const로 만든 변수는 바꿀 수 없어요. 값을 바꿀 변수는 let으로 선언하세요.','A const variable cannot change. Declare variables you update with let.','constの変数は変更できません。値を変える変数はletで宣言してください。');
 if(/return/i.test(m))return L('모든 경우에 값을 return해야 해요. if 분기와 콜백마다 return이 있는지 확인하세요.','Every path must return a value. Check each if branch and callback for a return.','すべての場合で値をreturnする必要があります。ifの分岐やコールバックごとにreturnがあるか確認してください。');
 if(error.kind==='unsupported')return L('이 실행기가 지원하지 않는 문법이에요. 오류 메시지가 권하는 형태(const/let, 화살표 함수, 값을 if로 먼저 확인하기 등)로 바꿔 보세요.','This syntax is unsupported here. Rewrite it in the form the message suggests, such as const/let, arrow functions or an if check first.','この実行環境で未対応の構文です。メッセージが勧める形(const/let、アロー関数、先にifで確認するなど)に書き換えてください。');
 return L('실행 중 멈췄어요. 표시된 줄에서 다루는 값이 숫자·문자열·배열·객체 중 무엇인지 확인하세요.','Execution stopped. Check whether the value used on the reported line is a number, string, array or object.','実行中に止まりました。表示された行で扱う値が数値・文字列・配列・オブジェクトのどれか確認してください。');
}
/** Wrong-answer patterns for the CR-04 jobs. Points at the rule, never at a full solution. */
function answerHint(id:string,input:CodeValue,want:CodeValue,actual:CodeValue|null):Localized|null {
 const x=input as Record<string,CodeValue>;
 if(id==='photo-cache'){
  const target=want as {maxAge:number;action:string},header=x.cacheControl as string;
  if(!record(actual)||typeof actual.maxAge!=='number'||!['reuse','refetch'].includes(actual.action as string))return L('{maxAge: 숫자, action: "reuse" 또는 "refetch"} 형태로 반환하세요.','Return {maxAge: number, action: "reuse" or "refetch"}.','{maxAge: 数値, action: "reuse"または"refetch"}の形で返してください。');
  if(actual.maxAge!==target.maxAge){
   if(/no-store|no-cache|private/i.test(header))return L('no-store·no-cache·private 중 하나가 있으면 공유 캐시의 maxAge는 0이에요.','With no-store, no-cache or private present, a shared cache uses maxAge 0.','no-store・no-cache・privateのどれかがあれば、共有キャッシュのmaxAgeは0です。');
   if(/s-maxage/i.test(header))return L('공유 캐시는 s-maxage가 있으면 max-age보다 먼저 써요. s-maxage=0이어도 마찬가지예요.','A shared cache prefers s-maxage over max-age, even when s-maxage=0.','共有キャッシュはs-maxageがあればmax-ageより優先します。s-maxage=0でも同じです。');
   if(header!==header.toLowerCase())return L('지시어 이름은 대소문자를 구분하지 않아요. 비교하기 전에 toLowerCase()로 바꾸세요.','Directive names are case-insensitive. Apply toLowerCase() before comparing.','ディレクティブ名は大文字小文字を区別しません。比較する前にtoLowerCase()をかけてください。');
   return L('지시어 앞뒤 공백을 trim()으로 지우고, "max-age=600"은 split("=") 뒤 Number()로 숫자를 만드세요. 초 단위 지시어가 없으면 0이에요.','Trim spaces around each directive and turn "max-age=600" into a number with split("=") and Number(). Without a seconds directive, maxAge is 0.','各ディレクティブの前後の空白をtrim()で除き、"max-age=600"はsplit("=")とNumber()で数値にします。秒数のディレクティブがなければ0です。');
  }
  if(x.age===target.maxAge)return L('age가 maxAge와 같으면 이미 만료예요. age < maxAge일 때만 "reuse"입니다.','An age equal to maxAge is already stale. Only age < maxAge allows "reuse".','ageがmaxAgeと同じならすでに期限切れです。age < maxAgeのときだけ"reuse"です。');
  if(!x.sameUser)return target.action==='refetch'?L('Vary에 Authorization이 있으면 다른 사용자에게 저장본을 주면 안 돼요. Vary 값도 소문자로 바꾸고 trim()해서 확인하세요.','When Vary lists Authorization, never give the stored copy to a different user. Lowercase and trim the Vary names too.','VaryにAuthorizationがあれば、別の利用者に保存版を渡してはいけません。Varyの値も小文字にしてtrim()で確認します。'):L('Vary에 Authorization이 없으면 사용자가 달라도 같은 저장본을 다시 쓸 수 있어요.','Without Authorization in Vary, a different user may receive the same stored copy.','VaryにAuthorizationがなければ、利用者が違っても同じ保存版を再利用できます。');
  return L('action은 age < maxAge인지부터 확인하세요. maxAge가 0이면 항상 "refetch"예요.','Decide action from age < maxAge first. With maxAge 0 it is always "refetch".','actionはまずage < maxAgeかで決めます。maxAgeが0なら常に"refetch"です。');
 }
 if(id==='transit-logs'){
  const target=want as {count:number;byRoute:Record<string,CodeValue>},logs=x.logs as Log[];
  if(!record(actual)||typeof actual.count!=='number'||!record(actual.byRoute)||!Object.hasOwn(actual,'first')||!Object.hasOwn(actual,'last'))return L('{count, byRoute, first, last} 객체를 반환하세요. 일치하는 행이 없으면 byRoute는 {}, first와 last는 null이에요.','Return {count, byRoute, first, last}. With no matching rows, byRoute is {} and first and last are null.','{count, byRoute, first, last}を返してください。一致する行がなければbyRouteは{}、firstとlastはnullです。');
  if(actual.count!==target.count){
   if(logs.some(log=>log.level===x.level&&log.status===x.status&&(log.time===x.from||log.time===x.to)))return L('시각이 from이나 to와 같은 행도 포함해요. 경계는 <=, >=로 비교하세요.','Rows exactly at from or to count too. Compare the boundaries with <= and >=.','時刻がfromやtoと同じ行も含めます。境界は<=、>=で比較してください。');
   if(logs.some(log=>(log.level===x.level)!==(log.status===x.status)))return L('level과 status가 둘 다 같아야 해요. 하나만 맞는 행은 세지 않습니다.','Both level and status must match; rows matching only one do not count.','levelとstatusの両方が一致する必要があります。片方だけ合う行は数えません。');
   return L('시각이 from~to 밖인 행은 빼야 해요. "HH:MM" 문자열끼리 크기를 비교할 수 있어요.','Leave out rows outside from–to. "HH:MM" strings can be compared directly.','時刻がfrom〜toの外にある行は除きます。"HH:MM"の文字列同士で大小比較できます。');
  }
  if(!equal(actual.byRoute as CodeValue,target.byRoute))return Object.values(actual.byRoute).includes(0)?L('byRoute에는 한 번 이상 일치한 주소만 넣어요. 0건인 주소는 빼세요.','byRoute lists only routes with at least one match; leave out zero counts.','byRouteには1回以上一致したアドレスだけを入れます。0件のアドレスは除きます。'):L('byRoute는 일치한 행만 주소별로 셉니다. 처음 본 주소는 0으로 만든 뒤 1씩 더하세요.','byRoute counts matching rows per route. Start each new route at 0, then add 1.','byRouteは一致した行だけをアドレス別に数えます。初めてのアドレスは0にしてから1ずつ足します。');
  return L('로그가 시간순이 아닐 수 있어요. first와 last는 첫 행·마지막 행이 아니라, 일치한 행의 시각을 비교해 가장 이른/늦은 값을 찾으세요. 없으면 null이에요.','Logs may be out of order. Find first and last by comparing matching times, not by taking the first and last rows; use null when nothing matches.','ログは時刻順とは限りません。firstとlastは先頭・末尾の行ではなく、一致した行の時刻を比べて最も早い/遅い値を求めます。なければnullです。');
 }
 if(id==='archive-backup'){
  const target=want as {keep:string[]},copies=x.copies as Copy[];
  if(!record(actual)||!Array.isArray(actual.keep)||typeof actual.totalMB!=='number')return L('{keep: 이름 배열, totalMB: 숫자} 형태로 반환하세요.','Return {keep: array of names, totalMB: number}.','{keep: 名前の配列, totalMB: 数値}の形で返してください。');
  const keep=actual.keep;
  if(!equal(keep,target.keep)){
   if(copies.length&&!copies.some(copy=>copy.daysOld<=(x.maxDays as number)))return L('모든 사본이 만료됐어요. 이때도 daysOld가 가장 작은 사본 하나(같으면 먼저 나온 것)는 남겨야 해요.','Every copy has expired. Still keep the one with the smallest daysOld (the earliest listed on a tie).','すべてのコピーが期限切れです。それでもdaysOldが最小のコピー1つ(同じなら先のもの)は残します。');
   if(copies.some(copy=>copy.daysOld===x.maxDays)&&!target.keep.every(name=>keep.includes(name)))return L('daysOld가 maxDays와 같은 사본도 보관해요. < 대신 <=로 비교하세요.','Copies exactly maxDays old are kept. Compare with <= instead of <.','daysOldがmaxDaysと同じコピーも保管します。<ではなく<=で比較してください。');
   if(keep.length===target.keep.length&&target.keep.every(name=>keep.includes(name)))return L('keep은 입력 순서를 그대로 유지해요. 정렬하지 마세요.','keep must follow the input order; do not reorder it.','keepは入力順のままにします。並べ替えないでください。');
   return L('daysOld가 maxDays 이하인 사본의 name만 keep에 넣으세요.','Put only the names of copies with daysOld at most maxDays in keep.','daysOldがmaxDays以下のコピーのnameだけをkeepに入れてください。');
  }
  return L('totalMB는 keep에 남긴 사본의 sizeMB만 더한 값이에요. 남긴 사본이 없으면 0이에요.','totalMB sums sizeMB for the kept copies only; it is 0 when nothing is kept.','totalMBはkeepに残したコピーのsizeMBだけを足した値です。残したものがなければ0です。');
 }
 if(id==='tutor-timezone'){
  const wrap=L('시각이 음수가 되거나 24시를 넘었어요. 분 단위 합계를 ((합계 % 1440) + 1440) % 1440으로 하루 안에 감싸세요.','The time went negative or past 24:00. Wrap the total minutes into one day with ((total % 1440) + 1440) % 1440.','時刻が負になったか24時を超えました。分の合計を((合計 % 1440) + 1440) % 1440で1日の範囲に収めてください。');
  if(typeof actual!=='string')return L('"D+1 08:00"처럼 문자열 하나를 반환하세요.','Return a single string such as "D+1 08:00".','"D+1 08:00"のような文字列を1つ返してください。');
  const clockText=actual.slice(actual.indexOf(' ')+1),shape=actual.match(/^D([+-]\d+) (\d{2}):(\d{2})$/),goal=(want as string).match(/^D([+-]\d+) (\d{2}):(\d{2})$/)!;
  if(clockText.includes('-')||shape&&(Number(shape[2])>23||Number(shape[3])>59))return wrap;
  if(!shape)return L('"D+0 05:30"처럼 D 뒤에 부호(+ 또는 -)와 날짜 이동, 공백, 두 자리 시:분을 쓰세요. 한 자리 숫자 앞에는 "0"을 붙여요(padStart는 지원하지 않아요).','Use the form "D+0 05:30": a sign (+ or -) and day shift after D, a space, then two-digit hours:minutes. Prefix single digits with "0" (padStart is unsupported).','"D+0 05:30"のように、Dの後に符号(+か-)と日付の移動、空白、2桁の時:分を書きます。1桁の数字には"0"を付けます(padStartは未対応です)。');
  if(shape[2]!==goal[2]||shape[3]!==goal[3])return (x.offsetMinutes as number)%60?L('시차에 30분·45분 같은 분 단위가 있어요. 시와 분을 모두 분으로 바꿔 더한 뒤, 다시 시와 분으로 나누세요.','This offset includes 30 or 45 minutes. Convert hours and minutes to total minutes, add, then split back into hours and minutes.','時差に30分・45分のような分があります。時と分をすべて分に直して足し、もう一度時と分に分けてください。'):wrap;
  return goal[1]==='-1'?L('합계가 0보다 작으면 전날(D-1)이에요. Math.floor(합계 / 1440)는 음수도 올바르게 내림합니다.','A negative total means the previous day (D-1). Math.floor(total / 1440) rounds negative values down correctly.','合計が0未満なら前日(D-1)です。Math.floor(合計 / 1440)は負の値も正しく切り下げます。'):L('합계가 1440 이상이면 다음 날이에요. 날짜는 Math.floor(합계 / 1440)이고, 0일 때도 "D+0"처럼 + 부호를 붙여요.','A total of 1440 or more is the next day. The day is Math.floor(total / 1440); write "D+0" with a plus sign for zero too.','合計が1440以上なら翌日です。日付はMath.floor(合計 / 1440)で、0のときも"D+0"のように+を付けます。');
 }
 return null;
}
function diagnose(id:string,input:CodeValue,want:CodeValue,result:CodeResult):Localized {
 if(result.error)return faultHint(result.error);
 return answerHint(id,input,want,result.value)??L('반환값이 기대값과 달라요. 이 입력을 "다른 입력으로 직접 실행"에 넣고 반환값과 기대값을 비교해 보세요.','The return value differs from the expected value. Paste this input into "Try another input" and compare the two.','戻り値が期待値と違います。この入力を「別の入力で試す」に入れて、戻り値と期待値を比べてみましょう。');
}
function run(id:string,source:string,input:CodeValue):CareerCodeRun {
 const result=runCode(source,input),want=expected(id,input),passed=!result.error&&equal(result.value,want);
 return {input,expected:want,actual:result.value,error:result.error,steps:result.steps,passed,diagnosis:passed?null:diagnose(id,input,want,result)};
}
export function runCareerCode(id:string,source:string,inputText:string):CareerCodeRun {
 try{
  if(!specs[id]||inputText.length>4000)throw Error('Choose a supported job and at most 4,000 input characters.');
  const input:unknown=JSON.parse(inputText);if(!validInput(id,input))throw Error('Input does not match this job’s documented fields and limits.');
  return run(id,source,input);
 }catch(error){return {input:null,expected:null,actual:null,error:{kind:'runtime',message:error instanceof Error?error.message:'Invalid input'},steps:0,passed:false,diagnosis:INPUT_HINT};}
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
 // A scene check inherits the diagnosis of the run it summarizes; source-integrity checks pass null.
 let last:CareerCodeRun|null=null;
 const add=(ko:string,en:string,ja:string,want:unknown,actual:unknown,from:CareerCodeRun|null=last)=>{
  const passed=display(want)===display(actual),hint=passed?null:from?.diagnosis??null;
  checks.push({name:L(ko,en,ja),expected:display(want),actual:display(actual),passed,...(hint?{hint}:{})});
 };
 const result=(input:CodeValue)=>{last=run(id,source,input);return last.error?failure(last.error):last.actual;};
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
  add('원본 연락처 표 유지','Keep original contact table','元の連絡先表を維持',true,sameRows(rows,original,['name','email']),null);
  for(const emails of [[],['  '],[' Other@Example.test ','other@example.test',' N@Example.test '],['B@x.test','A@x.test','b@x.test'],['X@x.test','','  ','x@x.test'],['new@x.test'],rows.map(row=>row.email),Array.from({length:12},(_,i)=>` User${i%4}@Example.test `)])cases.push({emails});
  cases.push({emails:Array.from({length:30},(_,i)=>` Unique${i}@Example.test `)});
 }else if(id==='delivery-fees'){
  add('3km · 5,000원 주문','3km · order 5,000','3km · 注文5,000',2900,result({km:3,total:5000}));add('10km · 20,000원 주문','10km · order 20,000','10km · 注文20,000',0,result({km:10,total:20000}));
  add('11km · 30,000원 주문','11km · order 30,000','11km · 注文30,000','unavailable',result({km:11,total:30000}));add('0km · 1,000원 주문','0km · order 1,000','0km · 注文1,000',2000,result({km:0,total:1000}));
  add('3km · 19,999원 주문','3km · order 19,999','3km · 注文19,999',2900,result({km:3,total:19999}));
  add('최대 배달 거리 km','Maximum delivery distance km','最大配達距離km',10,result({km:10,total:0})===5000&&result({km:10.01,total:20000})==='unavailable'?10:'invalid boundary');
  for(const km of [0,0.5,2,9.5,10,10.01,11,17])for(const total of [0,19999,20000,20001])cases.push({km,total});
 }else if(id==='photo-cache'){
  const field=(output:unknown,key:string)=>typeof output==='string'?output:record(output)&&Object.hasOwn(output,key)?output[key]:'missing';
  const login={cacheControl:'max-age=600',vary:'Authorization',age:30};
  add('공개 로고 보관 초','Public logo cache seconds','公開ロゴ保存秒',86400,field(result({cacheControl:'public, max-age=86400',vary:'',age:0,sameUser:false}),'maxAge'));
  add('개인 화면 보관 초','Private page cache seconds','個人画面保存秒',0,field(result({cacheControl:'private, max-age=86400',vary:'Authorization',age:0,sameUser:true}),'maxAge'));
  const lio=field(result({...login,sameUser:false}),'action');add('Lio 로그인 화면','Lio login screen','Lioログイン画面','Lio',lio==='reuse'?'Mina':lio==='refetch'?'Lio':lio);
  const same=field(result({...login,sameUser:true}),'action'),other=field(result({...login,sameUser:false}),'action');
  add('사용자 구분','Separate users','利用者区別',true,typeof same==='string'&&!['reuse','refetch'].includes(same)?same:same==='reuse'&&other==='refetch');
  for(const [cacheControl,vary,age,sameUser] of [['Public, MAX-AGE=60','',10,false],['max-age=60, s-maxage=300','',200,false],['s-maxage=0, max-age=600','',0,true],['no-store, max-age=600','',0,true],['NO-CACHE','',0,true],['','',0,true],['private, max-age=600','',1,true],['max-age=120, stale-while-revalidate=600','',300,true],['max-age=120','',120,true],['max-age=120','',119,true],['max-age=600','Accept-Encoding, authorization',5,false],['max-age=600','Accept-Encoding',5,false],['  must-revalidate ,max-age=900 , immutable ','AUTHORIZATION',5,true],['public, s-maxage=86400','Authorization',86399,false]] as const)cases.push({cacheControl,vary,age,sameUser});
 }else if(id==='transit-logs'){
  const lines=files['service.log'].trim().split(/\r?\n/);
  const logs=lines.map(line=>{const m=line.match(/^(\d{2}:\d{2}) (INFO|WARN|ERROR) (\/[A-Za-z0-9/_-]+) (\d{3})$/);if(!m||!CLOCK.test(m[1]))throw Error('unsupported log line');return {time:m[1],level:m[2],route:m[3],status:Number(m[4])};});
  const day={logs,level:'ERROR',status:503,from:'00:00',to:'23:59'};if(!validInput(id,day))throw Error('Log data is outside the documented contract');
  const output=result(day),report=record(output)?output:null,byRoute:Record<string,unknown>=report&&record(report.byRoute)?report.byRoute:{};
  add('선택한 장애 수','Selected outage count','選んだ障害数',3,typeof output==='string'?output:report?.count??'missing');
  add('/arrivals 장애','/arrivals outages','/arrivals障害',2,typeof output==='string'?output:byRoute['/arrivals']??0);add('/tickets 장애','/tickets outages','/tickets障害',1,typeof output==='string'?output:byRoute['/tickets']??0);
  add('원본 로그 모두 유지','Keep every original log entry','元ログをすべて維持',JSON.stringify(CAREER_JOBS.find(job=>job.id===id)!.files['service.log'].trim().split(/\r?\n/).sort()),JSON.stringify([...lines].sort()),null);
  const entry=(time:string,level:string,route:string,status:number)=>({time,level,route,status}),routes=['/arrivals','/tickets','/stops','/maps'];
  cases.push({logs:[],level:'ERROR',status:503,from:'00:00',to:'23:59'},{...day,from:'09:02',to:'09:04'});
  cases.push({logs:[entry('08:59','ERROR','/stops',503),entry('09:00','ERROR','/stops',503),entry('09:30','ERROR','/maps',503),entry('09:31','ERROR','/maps',503)],level:'ERROR',status:503,from:'09:00',to:'09:30'});
  cases.push({logs:[entry('10:05','ERROR','/tickets',503),entry('09:10','ERROR','/arrivals',503),entry('09:55','ERROR','/tickets',503),entry('07:00','INFO','/tickets',200)],level:'ERROR',status:503,from:'06:00',to:'12:00'});
  cases.push({logs:[entry('12:00','ERROR','/arrivals',500),entry('12:01','WARN','/arrivals',503),entry('12:02','ERROR','/arrivals',503),entry('12:03','INFO','/maps',200)],level:'ERROR',status:503,from:'00:00',to:'23:59'});
  cases.push({logs:[entry('13:15','WARN','/tickets',404),entry('13:10','WARN','/maps',404),entry('13:20','ERROR','/tickets',404),entry('13:12','WARN','/tickets',404)],level:'WARN',status:404,from:'13:12',to:'13:15'});
  cases.push({logs:[entry('23:59','ERROR','/stops',503),entry('00:00','ERROR','/stops',503)],level:'ERROR',status:503,from:'23:59',to:'23:59'});
  cases.push({logs:Array.from({length:40},(_,i)=>entry(`${String(8+i%3).padStart(2,'0')}:${String(i*37%60).padStart(2,'0')}`,['ERROR','WARN','INFO','ERROR'][i%4],routes[i*7%4],[503,503,404,500,200][i%5])),level:'ERROR',status:503,from:'08:30',to:'09:45'});
 }else if(id==='archive-backup'){
  const columns=['name','daysOld','sizeMB'],rows=csv(files['copies.csv'],columns),original=csv(CAREER_JOBS.find(job=>job.id===id)!.files['copies.csv'],columns);
  const copies=rows.map(row=>{if(!/^\d+(?:\.\d+)?$/.test(row.daysOld)||!/^\d+(?:\.\d+)?$/.test(row.sizeMB))throw Error('invalid numeric cell');return {name:row.name,daysOld:Number(row.daysOld),sizeMB:Number(row.sizeMB)};});
  const week={copies,maxDays:7};if(!validInput(id,week))throw Error('Copy records are outside the documented contract');
  const output=result(week),report=record(output)?output:null,keep=report&&Array.isArray(report.keep)?report.keep:null;
  const kept=(name:string)=>typeof output==='string'?output:keep?keep.includes(name):'missing';
  add('오늘 사본 보관','Keep today copy','今日のコピー保管',true,kept('today'));add('7일 사본 보관','Keep seven-day copy','7日コピー保管',true,kept('weekly'));add('8일 사본 보관','Keep eight-day copy','8日コピー保管',false,kept('old'));
  add('보관 크기 MB','Retained size MB','保管サイズMB',39,typeof output==='string'?output:report?.totalMB??'missing');
  add('원본 사본 기록 유지','Keep original copy records','元のコピー記録を維持',true,sameRows(rows,original,columns,['daysOld','sizeMB']),null);
  const copy=(name:string,daysOld:number,sizeMB:number)=>({name,daysOld,sizeMB});
  cases.push({copies:[],maxDays:7},{copies:[copy('a',6,10),copy('b',7,20),copy('c',8,40)],maxDays:7},{copies:[copy('now',0,5),copy('also',0,6),copy('day',1,7)],maxDays:0});
  cases.push({copies:[copy('old',30,5),copy('older',12,9),copy('tie',12,4)],maxDays:7},{copies:[copy('only',400,123)],maxDays:30},{copies:[copy('e',5,1),copy('f',1,2),copy('g',9,3),copy('h',3,4)],maxDays:4});
  cases.push({copies:[copy('blank',2,0),copy('full',3,100000)],maxDays:3650},{copies:[copy('x',3650,1),copy('y',3649,2)],maxDays:3649});
  cases.push({copies:Array.from({length:40},(_,i)=>copy('copy'+i,i*13%50,i*97%1000+1)),maxDays:20});
 }else if(id==='tutor-timezone'){
  [23,2,18].forEach((hour,i)=>{const utc=String(hour).padStart(2,'0')+':00';add(`UTC ${utc}`,`UTC ${utc}`,`UTC ${utc}`,['D+1 08:00','D+0 11:00','D+1 03:00'][i],result({utc,offsetMinutes:540}));});
  for(const [utc,offsetMinutes] of [['00:00',-720],['00:15',-570],['11:59',0],['12:00',-720],['23:59',15],['23:30',840],['05:00',330],['20:20',345],['09:00',-210],['01:45',-120],['14:00',540],['15:00',540],['10:00',765],['00:00',0]] as const)cases.push({utc,offsetMinutes});
 }else{
  const columns=['booth','quantity','unit','status'],rows=csv(files['sales.csv'],columns),original=csv(CAREER_JOBS.find(job=>job.id===id)!.files['sales.csv'],columns);
  const sales=rows.map(row=>{if(!/^\d+(?:\.\d+)?$/.test(row.quantity)||!/^\d+(?:\.\d+)?$/.test(row.unit))throw Error('invalid numeric cell');return {...row,quantity:Number(row.quantity),unit:Number(row.unit)};});
  if(!validInput(id,{sales}))throw Error('Sales data is outside the documented contract');
  const output=result({sales}) as CodeValue,report=output&&typeof output==='object'&&!Array.isArray(output)?output as Record<string,CodeValue>:null,totals=report?.totals&&typeof report.totals==='object'&&!Array.isArray(report.totals)?report.totals as Record<string,CodeValue>:{};
  add('bread 받은 돈','bread money received','bread受取額',8000,typeof output==='string'?output:totals.bread??0);add('craft 받은 돈','craft money received','craft受取額',10000,typeof output==='string'?output:totals.craft??0);
  add('전체 받은 돈','Total money received','全受取額',18000,typeof output==='string'?output:Object.values(totals).reduce<number>((sum,n)=>typeof n==='number'?sum+n:NaN,0));add('결제된 행 수','Paid row count','支払済行数',3,typeof output==='string'?output:report?.paidCount??0);
  add('환불·미결제 포함 원본 표 유지','Keep original table including refunds and pending','返金・未払いを含む元表を維持',true,sameRows(rows,original,columns,['quantity','unit']),null);
  cases.push({sales:[]},{sales});
  for(let i=0;i<10;i++)cases.push({sales:[{booth:i%2?'tea':'music',quantity:i,unit:137+i*23,status:'paid'},{booth:'art',quantity:9,unit:9000,status:i%2?'refunded':'pending'},{booth:i%2?'tea':'music',quantity:2,unit:41,status:'paid'}]});
  cases.push({sales:[{booth:'tea',quantity:0,unit:10,status:'paid'}]},{sales:[{booth:'bread',quantity:1,unit:4,status:'pending'}]});
  cases.push({sales:Array.from({length:30},(_,i)=>({booth:'stall'+i%5,quantity:i%7,unit:19+i,status:i%4===0?'pending':'paid'}))});
 }
 for(const [index,input] of cases.entries()){
  const row=run(id,source,input),actual=row.error?failure(row.error):row.actual;
  checks.push({name:L(`변경 입력 ${index+1} · ${JSON.stringify(input)}`,`Varied input ${index+1} · ${JSON.stringify(input)}`,`別の入力 ${index+1} · ${JSON.stringify(input)}`),expected:display(row.expected),actual:display(actual),passed:row.passed,...(row.diagnosis?{hint:row.diagnosis}:{})});
  // One bounded failure is sufficient; avoid repeating a budget failure 32 times.
  if(row.error)break;
 }
 return {passed:checks.every(check=>check.passed),checks,preview:checks.map(check=>({label:check.name,value:check.actual}))};
}
