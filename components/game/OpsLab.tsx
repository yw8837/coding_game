'use client';

import {useId,useMemo,useState,type CSSProperties,type JSX} from 'react';
import {Bell,Check,ChevronRight,Coins,FileCode2,FileText,FolderDown,Heart,Lightbulb,Lock,Mail,Play,RotateCcw,Sparkles,SquareTerminal,Target,Trophy,Truck,Wrench} from 'lucide-react';
import {useLanguage,type Language} from '@/lib/game/i18n';
import {opsJobs,opsFolder,opsDataFiles,type OpsJob,type OpsScene} from '@/lib/game/ops-content';
import {createOps,opsDone,opsHash,opsJobUnlocked,opsTrackUnlocked,SQL_UNLOCK_PYTHON} from '@/lib/game/ops';
import {runPython} from '@/lib/game/py-runtime';
import {workCommandSeen} from '@/lib/game/work-context';
import {executeSql,formatSqlCell} from '@/lib/game/sql-engine';
import type {GameProps} from './types';

/** Curriculum stages 3–4. The terminal does the work; this app shows the job,
 * the next commands and the client's world reacting to the player's real output. */
type Tr=(ko:string,en:string,ja:string)=>string;
type Outcome={ok:boolean;lines:string[];columns:string[];rows:string[][];error:string|null};
type Mode='idle'|'live'|'goal';
type SceneProps={job:OpsJob;out:Outcome;goal:Outcome;start:Outcome;mode:Mode;done:boolean;tr:Tr;lang:Language};
type Step={label:string;commands:string[];done:boolean};
type Vars=CSSProperties&Record<`--${string}`,string|number>;

function outcome(job:OpsJob,source:string):Outcome{
 try{
  if(job.track==='python'){
   const run=runPython(source,{files:job.data[0],filename:job.main}),lines=run.stdout.split('\n').map(line=>line.replace(/\s+$/,''));
   while(lines.length&&lines.at(-1)==='')lines.pop();
   const error=run.error?`${run.error.type}: ${run.error.message}${run.error.line?` (line ${run.error.line})`:''}`:null;
   return {ok:run.ok,lines,columns:[],rows:[],error};
  }
  const result=executeSql(job.data[0],source),last=result.results.filter(item=>item.columns.length).at(-1);
  const rows=last?last.rows.map(row=>row.map(formatSqlCell)):[];
  return {ok:result.ok,lines:rows.map(row=>row.join(' | ')),columns:last?.columns??[],rows,error:result.ok?null:result.error};
 }catch(error){return {ok:false,lines:[],columns:[],rows:[],error:error instanceof Error?error.message:String(error)};}
}
const sameResult=(job:OpsJob,a:Outcome,b:Outcome)=>{const x=[...a.lines],y=[...b.lines];if(job.track==='sql'&&!job.ordered){x.sort();y.sort();}return a.ok&&a.columns.length===b.columns.length&&x.join('\n')===y.join('\n');};
const num=(text:string|undefined)=>Number((text??'').replace(/[^\d.-]/g,''))||0;
const money=(value:number)=>value.toLocaleString('en-US');
const hue=(text:string)=>{let h=0;for(const ch of text)h=(h*31+ch.charCodeAt(0))%360;return h;};
const home=(path:string)=>path.replace(/^\/home\/dev(?=\/|$)/,'~');
const column=(out:Outcome,names:readonly string[],fallback=-1)=>{const index=out.columns.findIndex(name=>names.includes(name.toLowerCase()));return index>=0?index:fallback<out.columns.length?fallback:-1;};
/** Live rows glow mint when they already match the goal and amber when they still differ. */
const lineMark=(job:OpsJob,goal:Outcome,mode:Mode)=>(line:string,index:number)=>mode!=='live'?'':(job.track==='sql'&&!job.ordered?goal.lines.includes(line):goal.lines[index]===line)?' is-ok':' is-off';
function csvRows(text:string):Record<string,string>[]{
 const cells=(line:string)=>{const out:string[]=[];let cell='',quoted=false;for(const ch of line){if(ch==='"')quoted=!quoted;else if(ch===','&&!quoted){out.push(cell);cell='';}else cell+=ch;}out.push(cell);return out;};
 const [head='',...lines]=text.trim().split('\n'),keys=cells(head);
 return lines.map(line=>{const values=cells(line);return Object.fromEntries(keys.map((key,index)=>[key,values[index]??'']));});
}
function dbRows(job:OpsJob,table:string):Record<string,string>[]{
 if(job.track!=='sql')return [];
 const out=outcome(job,`SELECT * FROM ${table};`);
 return out.rows.map(row=>Object.fromEntries(out.columns.map((name,index)=>[name,row[index]??''])));
}

function Empty({out,tr}:{out:Outcome;tr:Tr}){return <p className="ops-scene-empty">{out.error?tr('결과 대신 오류가 났어요.','An error happened instead of a result.','結果の代わりにエラーが出ました。'):tr('아직 출력이 없어요.','No output yet.','まだ出力がありません。')}</p>;}
function RawRows({out,tr}:{out:Outcome;tr:Tr}){
 if(!out.rows.length)return <Empty out={out} tr={tr}/>;
 return <div className="ops-raw"><table><thead><tr>{out.columns.map((name,index)=><th key={index} scope="col">{name}</th>)}</tr></thead><tbody>{out.rows.slice(0,12).map((row,index)=><tr key={index}>{row.map((cell,i)=><td key={i}>{cell}</td>)}</tr>)}</tbody></table>{out.rows.length>12&&<small>+{out.rows.length-12}</small>}</div>;
}

function ReceiptScene({job,out,goal,mode,done,tr}:SceneProps){
 const mark=lineMark(job,goal,mode),paid=done&&mode!=='goal';
 return <div className={'ops-receipt'+(paid?' is-paid':'')}>
  <div className="ops-printer"><span className="ops-led" aria-hidden="true"/><b>DAWN BAKERY</b><small>{tr('영수증 프린터','Receipt printer','レシートプリンター')}</small></div>
  <div className="ops-slot"><div className="ops-paper" key={out.lines.join('\n')+mode}>
   {out.lines.length?out.lines.map((line,index)=><div key={index} style={{'--i':index} as Vars} className={'ops-paper-line'+(line.startsWith('TOTAL')?' is-total':'')+mark(line,index)}>{line||' '}</div>):<Empty out={out} tr={tr}/>}
   {paid&&<span className="ops-stamp" aria-hidden="true">PAID ✓</span>}
  </div></div>
 </div>;
}

function ShelfScene({job,out,goal,mode,done,tr}:SceneProps){
 const stock=useMemo(()=>job.track==='python'?csvRows(job.data[0]['stock.csv']??''):[],[job]);
 const mark=lineMark(job,goal,mode),orders=new Map<string,string>();
 out.lines.forEach((line,index)=>{const name=/^ORDER\s+(\S+)/.exec(line)?.[1];if(name)orders.set(name,mark(line,index));});
 const count=out.lines.map(line=>/^(\d+)\s+flowers?\s+to\s+order/.exec(line)?.[1]).find(Boolean),max=Math.max(1,...stock.map(row=>num(row.stock)));
 return <div className="ops-shelf">
  <div className="ops-shelf-head"><span>{tr('도매상 주문서','Wholesale order','卸への注文書')}</span><strong>{count??'?'}</strong><small>{tr('종류','kinds','種類')}</small></div>
  <ul className="ops-shelf-rack">{stock.map((row,index)=>{const left=num(row.stock),order=orders.get(row.name);return <li key={row.name} className={'ops-flower'+(left<5?' is-low':'')+(order!==undefined?' is-ordered'+order:'')} style={{'--ops-hue':hue(row.name),'--i':index} as Vars}>
   <span className="ops-bloom" aria-hidden="true"/><b>{row.name}</b><small>{tr(`${left}송이`,`${left} left`,`${left}本`)}</small><span className="ops-meter" aria-hidden="true"><i style={{width:`${left/max*100}%`}}/></span>{order!==undefined&&<em>ORDER</em>}
  </li>;})}</ul>
  {done&&mode!=='goal'&&<div className="ops-truck"><Truck size={20} aria-hidden="true"/>{tr('도매상 트럭 도착! 선반이 다시 꽉 찼어요.','The wholesale truck is here! The shelves are full again.','卸のトラックが到着！棚がまたいっぱいです。')}</div>}
 </div>;
}

function ContactsScene({job,out,goal,mode,done,tr}:SceneProps){
 const sheet=useMemo(()=>{const seen=new Set<string>(),text=job.track==='python'?job.data[0]['signups.txt']??'':'';return text.replace(/\n$/,'').split('\n').map(line=>{const email=line.trim().toLowerCase(),duplicate=!email||seen.has(email);seen.add(email);return {line,duplicate};});},[job]);
 const mark=lineMark(job,goal,mode),total=out.lines.find(line=>/^\d+\s+members?$/.test(line)),seen=new Map<string,number>();
 const cards=out.lines.map((line,index)=>({line,index})).filter(item=>item.line!==total).map(item=>{const key=item.line.trim().toLowerCase(),times=(seen.get(key)??0)+1;seen.set(key,times);return {...item,repeat:!!key&&times>1};});
 const show=(text:string)=>text.replace(/^ +| +$/g,space=>'·'.repeat(space.length));
 return <div className={'ops-contacts'+(done&&mode!=='goal'?' is-merged':'')}>
  <div className="ops-contacts-sheet"><h4>{tr('가입 신청서','Signup sheet','申込書')}</h4><ul>{sheet.map((item,index)=><li key={index} className={item.duplicate?'is-dup':''}>{item.line.trim()?show(item.line):<i>{tr('(빈 줄)','(blank)','(空行)')}</i>}</li>)}</ul></div>
  <div className="ops-contacts-list"><h4><Mail size={14} aria-hidden="true"/>{tr('초대장 받을 사람','Invitation list','招待状リスト')}<strong>{total?total.split(/\s+/)[0]:'?'}</strong></h4>
   {cards.length?<ul key={out.lines.join('\n')}>{cards.map((card,i)=><li key={card.index} style={{'--i':i} as Vars} className={'ops-envelope'+mark(card.line,card.index)+(card.repeat?' is-repeat':'')+(card.line.trim()?'':' is-blank')}><span>{card.line.trim()?show(card.line):tr('(빈 줄)','(blank)','(空行)')}</span>{card.repeat&&<em>{tr('중복','duplicate','重複')}</em>}</li>)}</ul>:<Empty out={out} tr={tr}/>}
  </div>
 </div>;
}

function ChartScene({job,out,goal,mode,done,tr}:SceneProps){
 const mark=lineMark(job,goal,mode),final=done&&mode!=='goal';
 const bars=out.lines.map((line,index)=>{const match=/^(\d+)\.\s+(.+?)\s+([\d,]+)$/.exec(line);return match?{index,line,rank:match[1],label:match[2],value:num(match[3]),text:match[3]}:null;}).filter((bar):bar is NonNullable<typeof bar>=>bar!==null);
 const max=Math.max(1,...bars.map(bar=>bar.value)),loose=out.lines.filter((_,index)=>!bars.some(bar=>bar.index===index));
 return <div className={'ops-chart'+(final?' is-final':'')}>
  <h4>{tr('부스 매출 순위','Booth ranking','ブース売上ランキング')}</h4>
  {bars.length?<ol key={out.lines.join('\n')+final}>{bars.map((bar,i)=><li key={bar.index} className={'ops-bar-row'+mark(bar.line,bar.index)} style={{'--i':i,'--w':bar.value/max} as Vars}><span className="ops-rank">{bar.rank}</span><b>{bar.label}</b><span className="ops-bar" aria-hidden="true"><i/></span><em>{bar.text}</em>{final&&i===0?<Trophy className="ops-trophy" size={18} aria-label={tr('1등','First place','1位')}/>:<span aria-hidden="true"/>}</li>)}</ol>:<Empty out={out} tr={tr}/>}
  {loose.length>0&&<pre className="ops-loose">{loose.join('\n')}</pre>}
 </div>;
}

function NoticesScene({job,out,goal,mode,done,tr}:SceneProps){
 const mark=lineMark(job,goal,mode);
 return <div className="ops-phone"><div className="ops-phone-bar"><span>09:00</span><b>{tr('동네도서관','Library','まちの図書館')}</b><Bell size={13} aria-hidden="true"/></div>
  <div className="ops-feed" key={out.lines.join('\n')+(out.error??'')}>
   {out.lines.map((line,index)=>{const notice=/^NOTICE\s+([^:]+):\s*(.*)$/.exec(line);return <div key={index} style={{'--i':index} as Vars} className={'ops-bubble'+mark(line,index)+(notice?'':' is-system')}>{notice?<><b>{notice[1]}</b><p>{notice[2]}</p></>:<p>{line||' '}</p>}</div>;})}
   {out.error&&<div className="ops-bubble is-error" style={{'--i':out.lines.length} as Vars}><b>{tr('전송 실패','Send failed','送信失敗')}</b><p>{out.error}</p></div>}
   {!out.lines.length&&!out.error&&<Empty out={out} tr={tr}/>}
   {done&&mode!=='goal'&&<p className="ops-feed-done"><Check size={14} aria-hidden="true"/>{tr('모든 알림 전송 완료','All notices sent','すべて送信完了')}</p>}
  </div>
 </div>;
}

function MenuScene({job,out,goal,mode,done,tr}:SceneProps){
 const menu=useMemo(()=>dbRows(job,'menu'),[job]);
 const mark=lineMark(job,goal,mode),nameAt=column(out,['name'],0),priceAt=column(out,['price']);
 const listed=new Map(out.rows.map((row,index)=>[row[nameAt]??'',{price:priceAt>=0?row[priceAt]??null:null,mark:mark(out.lines[index],index)}]));
 const known=menu.some(item=>listed.has(item.name));
 return <div className={'ops-board'+(done&&mode!=='goal'?' is-open':'')}><header><b>MONO CAFE</b><span>{tr('손님 앱 · 오늘의 메뉴','Customer app · today’s menu','お客さんアプリ · 本日のメニュー')}</span></header>
  {known?<ul>{menu.map(item=>{const entry=listed.get(item.name),soldOut=item.available==='0';return <li key={item.name} aria-hidden={entry?undefined:true} className={'ops-menu-item'+(entry?entry.mark:' is-gone')+(entry&&soldOut?' is-soldout':'')}><b>{item.name}</b><span>{entry&&entry.price!==null?`₩${money(num(entry.price))}`:tr('가격 ?','price ?','価格 ?')}</span>{entry&&soldOut&&<em>{tr('품절','SOLD OUT','売り切れ')}</em>}</li>;})}</ul>:<RawRows out={out} tr={tr}/>}
 </div>;
}

function FlyerScene({job,out,goal,mode,done,tr}:SceneProps){
 const products=useMemo(()=>new Map(dbRows(job,'products').map(item=>[item.name,item])),[job]);
 const mark=lineMark(job,goal,mode),nameAt=column(out,['name'],0),priceAt=column(out,['price']),known=out.rows.some(row=>products.has(row[nameAt]??''));
 return <div className={'ops-flyer'+(done&&mode!=='goal'?' is-approved':'')}><header><strong>{tr('주말 특가!','Weekend deals!','週末特価！')}</strong><small>ALLEY MARKET</small></header>
  {known?<ul key={out.lines.join('\n')}>{out.rows.map((row,index)=>{const item=products.get(row[nameAt]??''),real=item?num(item.price):0,price=priceAt>=0?num(row[priceAt]):real;const problem=!item?'':item.stock==='0'?tr('재고 없음','Out of stock','在庫なし'):item.on_sale==='0'?tr('할인 끝','Sale ended','セール終了'):real>3000?tr('3,000 초과','Over 3,000','3,000超え'):'';return <li key={index} style={{'--i':index} as Vars} className={'ops-deal'+mark(out.lines[index],index)+(problem?' is-problem':'')}><b>{row[nameAt]}</b><span>₩{money(price)}</span>{problem&&<em>{problem}</em>}</li>;})}</ul>:<RawRows out={out} tr={tr}/>}
  {done&&mode!=='goal'&&<span className="ops-flyer-stamp" aria-hidden="true">{tr('검수 완료','Approved','検品済み')}</span>}
 </div>;
}

function PodiumScene({job,out,goal,mode,done,tr}:SceneProps){
 const mark=lineMark(job,goal,mode),nameAt=column(out,['student','name'],0),scoreAt=column(out,['score'],out.columns.length-1);
 if(!out.rows.length)return <Empty out={out} tr={tr}/>;
 return <div className={'ops-podium'+(done&&mode!=='goal'?' is-award':'')}><h4>{tr('수학 우수상 시상대','Math award podium','数学優秀賞の表彰台')}</h4>
  <div className="ops-podium-stage" key={out.lines.join('\n')}>{[1,0,2].map(place=>{const row=out.rows[place];return <div key={place} className={'ops-step ops-step-'+(place+1)+(row?mark(out.lines[place],place):' is-empty')} style={{'--i':place} as Vars}><span className="ops-medal">{place+1}</span><b>{row?row[nameAt]:'—'}</b><small>{row&&scoreAt>=0?row[scoreAt]:' '}</small><i aria-hidden="true"/></div>;})}</div>
  {out.rows.length>3&&<p className="ops-podium-rest">{tr('그 외','Also listed','その他')}: {out.rows.slice(3).map(row=>row[nameAt]).join(', ')}</p>}
 </div>;
}

function QueueScene({job,out,goal,start,mode,done,tr,lang}:SceneProps){
 const patients=useMemo(()=>new Map(dbRows(job,'patients').map(item=>[item.name,item])),[job]);
 const mark=lineMark(job,goal,mode),nameAt=column(out,['name'],0),deptAt=column(out,['dept']),priorityAt=column(out,['priority']),arrivedAt=column(out,['arrived']);
 const from=mode==='live'?start.rows.length:out.rows.length,to=out.rows.length;
 return <div className={'ops-queue'+(done&&mode!=='goal'?' is-calm':'')}>
  <div className="ops-queue-board"><small>{tr('대기실 호출 화면','Waiting-room screen','待合室の呼び出し画面')}</small>
   <p className="ops-queue-count"><span>{tr('대기','Waiting','待ち')}</span><strong key={`${from}:${to}`} className={'ops-count'+(from!==to?' is-counting':'')} style={{'--ops-from':from,'--ops-to':to} as Vars} aria-hidden="true"/><span>{tr('명','people','人')}</span><span className="ops-sr">{tr(`대기 ${to}명`,`${to} waiting`,`${to}人待ち`)}</span></p>
   {from!==to&&<small className="ops-queue-drop">{from} → {to}</small>}
  </div>
  {out.rows.length?<ol className="ops-called" key={out.lines.join('\n')}>{out.rows.slice(0,6).map((row,index)=>{const patient=patients.get(row[nameAt]??''),urgent=priorityAt>=0?row[priorityAt]==='3':patient?.priority==='3',seen=patient?.status==='done';return <li key={index} style={{'--i':index} as Vars} className={'ops-patient'+mark(out.lines[index],index)+(urgent?' is-urgent':'')+(seen?' is-seen':'')}><span className="ops-ticket">{index+1}</span><b>{row[nameAt]}</b>{deptAt>=0&&<small>{row[deptAt]}</small>}{urgent&&<em>{tr('응급','Urgent','救急')}</em>}{seen&&<em className="is-warn">{tr('이미 진료 끝','Already seen','診察済み')}</em>}{arrivedAt>=0&&<time>{row[arrivedAt]}</time>}</li>;})}</ol>:<Empty out={out} tr={tr}/>}
  {out.rows.length>6&&<p className="ops-more">+{out.rows.length-6}</p>}
  {done&&mode!=='goal'&&<div className="ops-thanks-bubble"><Heart size={16} aria-hidden="true"/><p>{job.thanks[lang]}</p></div>}
 </div>;
}

function DashboardScene({job,out,goal,mode,done,tr}:SceneProps){
 const mark=lineMark(job,goal,mode);
 const numeric=out.columns.map((_,index)=>out.rows.length>0&&out.rows.every(row=>/^-?[\d.,]+$/.test(row[index]??'')));
 const valueAt=numeric.lastIndexOf(true),ordersAt=out.columns.length>=3?numeric.findIndex((flag,index)=>flag&&index!==valueAt):-1,labelAt=numeric.findIndex(flag=>!flag);
 if(!out.rows.length||valueAt<0)return <RawRows out={out} tr={tr}/>;
 const values=out.rows.map(row=>num(row[valueAt])),max=Math.max(1,...values),labels=out.rows.map(row=>labelAt>=0?row[labelAt]:''),repeated=new Set(labels).size<labels.length;
 return <div className={'ops-dash'+(done&&mode!=='goal'?' is-ready':'')}>
  <div className="ops-kpis">
   <div><small>{tr('부스','Booths','ブース')}</small><strong>{out.rows.length}</strong></div>
   <div><small>{tr('주문 수','Orders','注文数')}</small><strong>{ordersAt>=0?money(out.rows.reduce((sum,row)=>sum+num(row[ordersAt]),0)):'—'}</strong></div>
   <div><small>{tr('매출 합계','Revenue','売上合計')}</small><strong>₩{money(values.reduce((sum,value)=>sum+value,0))}</strong></div>
  </div>
  {repeated&&<p className="ops-dash-warn">{tr('같은 부스가 여러 줄로 나와요.','The same booth appears on several rows.','同じブースが複数行に出ています。')}</p>}
  <ol className="ops-dash-bars" key={out.lines.join('\n')+done}>{out.rows.slice(0,8).map((row,index)=><li key={index} className={'ops-bar-row'+mark(out.lines[index],index)} style={{'--i':index,'--w':values[index]/max} as Vars}><b>{labels[index]}</b><span className="ops-bar" aria-hidden="true"><i/></span><em>{money(values[index])}</em></li>)}</ol>
  {out.rows.length>8&&<p className="ops-more">+{out.rows.length-8}</p>}
 </div>;
}

function SceneView(props:SceneProps){
 switch(props.job.scene){
  case 'receipt':return <ReceiptScene {...props}/>;
  case 'shelf':return <ShelfScene {...props}/>;
  case 'contacts':return <ContactsScene {...props}/>;
  case 'chart':return <ChartScene {...props}/>;
  case 'notices':return <NoticesScene {...props}/>;
  case 'menu':return <MenuScene {...props}/>;
  case 'flyer':return <FlyerScene {...props}/>;
  case 'podium':return <PodiumScene {...props}/>;
  case 'queue':return <QueueScene {...props}/>;
  case 'dashboard':return <DashboardScene {...props}/>;
 }
}
const sceneTitle=(scene:OpsScene,tr:Tr)=>({
 receipt:tr('새벽빵집 영수증 프린터','Dawn Bakery receipt printer','夜明けベーカリーのレシートプリンター'),
 shelf:tr('꽃가게 선반','Flower shop shelf','花屋の棚'),
 contacts:tr('별빛동아리 초대장','Starlight Club invitations','星あかりクラブの招待状'),
 chart:tr('축제 순위 발표판','Festival ranking board','祭りの順位ボード'),
 notices:tr('연체 알림 문자','Overdue text messages','延滞のお知らせメッセージ'),
 menu:tr('모노 카페 메뉴판','Mono Cafe menu board','モノカフェのメニューボード'),
 flyer:tr('골목시장 주말 전단지','Alley Market weekend flyer','路地市場の週末チラシ'),
 podium:tr('방과후교실 시상대','After-school podium','放課後教室の表彰台'),
 queue:tr('햇살의원 대기실 화면','Sunny Clinic waiting room','ひだまり医院の待合室'),
 dashboard:tr('축제 부스 회의 자료','Booth meeting dashboard','ブース選定会議の資料'),
})[scene];

function World({job,accepted,completed,passed,stale,missing,current,goal,start,nextCommand,onQueue,tr,lang}:{job:OpsJob;accepted:boolean;completed:boolean;passed:boolean;stale:boolean;missing:boolean;current:Outcome|null;goal:Outcome;start:Outcome;nextCommand:string;onQueue:(command:string)=>void;tr:Tr;lang:Language}){
 const [view,setView]=useState<'now'|'goal'>('now');
 const mode:Mode=view==='goal'?'goal':current?'live':'idle',out=view==='goal'?goal:current??start;
 const match=!!current&&sameResult(job,current,goal),verified=completed&&passed&&!stale&&!missing&&match;
 const status=verified?'done':current?'live':'idle';
 const chip=status==='done'?tr('완료','Delivered','納品済み'):status==='live'?tr('실시간','Live','ライブ'):tr('실행 전','Not run yet','未実行');
 const message=view==='goal'?tr('목표 화면이에요. 공개 데이터로 정답 코드를 돌린 결과예요.','This is the goal: the reference solution run on the visible data.','目標の画面です。公開データで正解コードを動かした結果です。')
  :!accepted?tr('의뢰를 수락하면 이 화면이 내 코드와 연결돼요.','Accept the job to connect this screen to your code.','依頼を受けるとこの画面があなたのコードとつながります。')
  :missing?tr('작업 파일이 사라졌어요. 아래 복구 버튼으로 되살릴 수 있어요.','The job file is missing. Use the restore button below to bring it back.','作業ファイルが消えました。下の復元ボタンで戻せます。')
  :!current?tr('지금은 고장 난 모습이에요. 터미널에서 처음 실행하는 순간부터 이 화면이 실시간으로 바뀌어요.','This is how it looks broken. From your first run in the terminal, this screen updates live.','今は壊れた状態です。ターミナルで最初に実行した瞬間から、この画面がリアルタイムで変わります。')
  :stale?tr('검사 후 코드를 바꿨어요. 현재 코드는 아직 검증되지 않았어요. 터미널에서 다시 실행하세요.','You changed the code after checking. Run it in the terminal to verify this version.','検査後にコードを変更しました。現在のコードをターミナルでもう一度実行して確認しましょう。')
  :current.error?tr('지금 코드는 실행 오류가 있어요. 터미널에서 오류를 확인하세요.','The current code has a runtime error. Check the terminal for details.','現在のコードに実行エラーがあります。ターミナルで詳細を確認しましょう。')
  :verified?tr('납품 완료! 이제 이 화면은 당신의 코드로 움직여요.','Delivered! This screen now runs on your code.','納品完了！この画面はあなたのコードで動いています。')
  :match&&(stale||!passed)?(stale?tr('공개 데이터에서는 목표와 똑같아요! 터미널에서 다시 실행해 납품하세요.','It matches the goal on the visible data! Run it again in the terminal to deliver.','公開データでは目標と同じです！ターミナルでもう一度実行して納品しましょう。'):tr('공개 데이터는 맞지만 숨은 데이터에서 달라요. 터미널의 ✘ 줄을 확인하세요.','The visible data matches, but a hidden dataset differs. Check the ✘ line in the terminal.','公開データは合っていますが、隠しデータで違います。ターミナルの✘行を確認しましょう。'))
  :tr('아직 목표와 달라요. 주황색으로 표시된 부분을 고쳐 보세요.','Not matching the goal yet. Fix the parts marked in amber.','まだ目標と違います。オレンジ色の部分を直しましょう。');
 return <section className={'ops-world is-'+status+(mode==='idle'?' is-idle':'')} aria-label={sceneTitle(job.scene,tr)}>
  <header className="ops-world-head"><h3><Sparkles size={15} aria-hidden="true"/>{sceneTitle(job.scene,tr)}</h3><span className="ops-live"><i aria-hidden="true"/>{chip}</span></header>
  <div className="ops-view" role="group" aria-label={tr('화면 보기','Screen view','画面の表示')}><button type="button" aria-pressed={view==='now'} onClick={()=>setView('now')}>{current?tr('지금 내 코드','My code now','今のコード'):tr('지금 (고장)','Now (broken)','今（故障中）')}</button><button type="button" aria-pressed={view==='goal'} onClick={()=>setView('goal')}>{tr('목표','Goal','目標')}</button></div>
  <div className="ops-stage">
   <div className="ops-scene"><SceneView job={job} out={out} goal={goal} start={start} mode={mode} done={verified} tr={tr} lang={lang}/></div>
   {out.error&&mode!=='idle'&&job.scene!=='notices'&&<p className="ops-scene-error">{out.error}</p>}
   {mode==='idle'&&accepted&&!missing&&<button type="button" className="ops-teaser" onClick={()=>onQueue(nextCommand)}><Play size={22} aria-hidden="true"/><span><b>{tr('터미널에서 실행하면 여기가 바뀌어요','Run it in the terminal and this comes alive','ターミナルで実行するとここが動き出します')}</b><small>{tr('다음 명령을 터미널에 넣기','Put the next command in the terminal','次のコマンドをターミナルに入れる')}</small><code>$ {nextCommand}</code></span></button>}
  </div>
  <p className={'ops-world-status'+(verified?' is-match':'')} aria-live="polite">{message}</p>
 </section>;
}

export function OpsLabView({props,track}:{props:GameProps;track:'python'|'sql'}):JSX.Element{
 const lang=useLanguage(),tr:Tr=(ko,en,ja)=>({ko,en,ja})[lang];
 const {state,onAction,queueCommand,openFile}=props,titleId=useId();
 const jobs=opsJobs(track),ops=state.gameplay.ops??createOps(),m=state.machines.local;
 const unlocked=opsTrackUnlocked(state,track),doneCount=opsDone(state,track);
 const [picked,setPicked]=useState(()=>(jobs.find(item=>opsJobUnlocked(state,item)&&!(state.gameplay.ops?.completed??[]).includes(item.id))??jobs[0]).id);
 const [hints,setHints]=useState<Record<string,number>>({});
 const remembered=props.workSelections?.[track],selected=remembered?.kind==='ops'?remembered.id:picked;
 const job=jobs.find(item=>item.id===selected)??jobs[0];
 const pick=(id:string)=>{setPicked(id);props.onWorkContext?.({kind:'ops',id});};
 const folder=opsFolder(job),mainPath=folder+'/'+job.main,source=m.files[mainPath];
 const run=ops.runs[job.id],hasRun=!!run,accepted=ops.accepted.includes(job.id),completed=ops.completed.includes(job.id),jobOpen=opsJobUnlocked(state,job);
 const goal=useMemo(()=>outcome(job,job.reference),[job]);
 const start=useMemo(()=>outcome(job,job.files[job.main]??''),[job]);
 const current=useMemo(()=>hasRun&&source!==undefined?outcome(job,source):null,[job,source,hasRun]);
 const stale=!!run&&(source===undefined||opsHash(source)!==run.hash),missing=accepted&&source===undefined;
 const tool=job.track==='python'?'python3':'sqlite3',hasTool=m.tools.includes(tool),local=state.machine==='local',here=local&&m.cwd===folder;
 const dataName=opsDataFiles(job)[0],table=/FROM\s+(\w+)/i.exec(job.reference)?.[1]??'';
 const cdCommand=`cd ${home(folder)}`,runCommand=job.track==='python'?`python3 ${job.main}`:`sqlite3 ${job.db} < ${job.main}`;
 const nextCommand=!local?'exit':!hasTool?(m.updated?`sudo apt install ${tool}`:'sudo apt update'):!here?cdCommand:runCommand;
 const ran=(test:(command:string)=>boolean)=>workCommandSeen(state,folder,test);
 const steps:Step[]=[
  {label:tr('작업 폴더로 이동','Go to the job folder','作業フォルダーへ移動'),commands:[cdCommand],done:here},
  job.track==='python'?{label:tr('데이터 먼저 살펴보기','Look at the data first','まずデータを見る'),commands:[`cat ${dataName}`],done:ran(command=>/^(cat|head|tail|less|more)\s/.test(command)&&command.includes(dataName))}
   :{label:tr('표 구조와 데이터 살펴보기','Look at the table and its data','表の構造とデータを見る'),commands:[`sqlite3 ${job.db} ".schema"`,`sqlite3 ${job.db} "SELECT * FROM ${table};"`],done:ran(command=>command.startsWith('sqlite3 ')&&command.includes(job.db)&&!command.includes('<'))},
  {label:tr(`에디터로 ${job.main} 열어 고치기`,`Open ${job.main} in the editor and fix it`,`エディターで${job.main}を開いて直す`),commands:[`code ${job.main}`],done:ran(command=>/^code\s/.test(command)&&command.includes(job.main))},
  {label:tr('실행해서 결과 확인 · 납품','Run it to check and deliver','実行して確認 · 納品'),commands:[runCommand],done:hasRun&&run.passed&&!stale},
 ];
 const toolSteps:Step[]=[
  {label:tr('패키지 목록 갱신','Refresh the package list','パッケージ一覧を更新'),commands:['sudo apt update'],done:m.updated||hasTool},
  {label:tr(`${tool} 설치`,`Install ${tool}`,`${tool}をインストール`),commands:[`sudo apt install ${tool}`],done:hasTool},
 ];
 const files=[job.main,...opsDataFiles(job)].map(name=>({name,path:folder+'/'+name,exists:m.files[folder+'/'+name]!==undefined,data:name!==job.main}));
 const level=hints[job.id]??0,nextJob=jobs.slice(jobs.indexOf(job)+1).find(item=>!ops.completed.includes(item.id));
 const status=(item:OpsJob)=>ops.completed.includes(item.id)?'done':!opsJobUnlocked(state,item)?'locked':ops.accepted.includes(item.id)?'active':'new';
 const statusText={done:tr('완료','Done','完了'),locked:tr('잠김','Locked','ロック中'),active:tr('진행 중','In progress','進行中'),new:tr('새 의뢰','New','新着')};
 const pythonDone=opsDone(state,'python'),sqlOpen=opsTrackUnlocked(state,'sql'),trackDone=doneCount===jobs.length;
 const avatar=(name:string)=><span className="ops-avatar" style={{'--ops-hue':hue(name)} as Vars} aria-hidden="true">{Array.from(name.trim())[0]??'?'}</span>;
 const stepList=(items:Step[])=>{const next=items.findIndex(item=>!item.done);return <ol className="ops-steps">{items.map((item,index)=><li key={index} className={item.done?'is-done':index===next?'is-next':''}>
  <span className="ops-step-no" aria-hidden="true">{item.done?<Check size={14}/>:index+1}</span>
  <div><p>{item.label}{item.done&&<span className="ops-sr"> · {tr('완료','done','完了')}</span>}</p><div className="ops-cmds">{item.commands.map(command=><button type="button" key={command} className="ops-cmd" onClick={()=>queueCommand(command)} aria-label={tr(`터미널에 넣기: ${command}`,`Put in the terminal: ${command}`,`ターミナルに入れる: ${command}`)}><span aria-hidden="true">$</span><code>{command}</code><SquareTerminal size={14} aria-hidden="true"/></button>)}</div></div>
 </li>)}</ol>;};

 const header=<header className="ops-header">
  <div className="ops-stage-badge"><span>STAGE {track==='python'?3:4}</span><b>{track==='python'?tr('Python 자동화','Python automation','Python自動化'):tr('SQL 데이터베이스','SQL database','SQLデータベース')}</b></div>
  <p className="ops-pitch">{track==='python'?tr('손으로 하던 지겨운 반복 작업을 파이썬 스크립트 한 번으로 끝내 드려요.','Turn tedious chores people do by hand into one Python script.','手作業の面倒な繰り返しをPythonスクリプト一発で片付けます。'):tr('데이터베이스에 정확한 질문(쿼리)을 던져 가게에 꼭 필요한 답만 꺼내 드려요.','Ask the database the right question (a query) and pull out exactly what each shop needs.','データベースに正しい質問（クエリ）をして、お店に必要な答えだけを取り出します。')}</p>
  {track==='python'&&sqlOpen&&<button type="button" className="ops-next-stage" onClick={()=>props.onOpen('sql')}>{tr('STAGE 4 · SQL 열림','STAGE 4 · SQL unlocked','STAGE 4 · SQL解放')}<ChevronRight size={14} aria-hidden="true"/></button>}
  <div className="ops-progress" role="progressbar" aria-valuemin={0} aria-valuemax={jobs.length} aria-valuenow={doneCount} aria-label={tr('완료한 의뢰','Jobs completed','完了した依頼')}><span><i style={{width:`${doneCount/jobs.length*100}%`}}/></span><b>{doneCount}/{jobs.length}</b></div>
 </header>;

 if(!unlocked)return <div className="ops-lab" data-no-translate data-track={track} data-testid={'ops-lab-'+track}>{header}
  <section className="ops-locked"><Lock size={34} aria-hidden="true"/>
   <h2>{track==='python'?tr('Python 자동화 의뢰는 아직 잠겨 있어요','Python automation jobs are still locked','Python自動化の依頼はまだロック中です'):tr('SQL 데이터베이스 의뢰는 아직 잠겨 있어요','SQL database jobs are still locked','SQLデータベースの依頼はまだロック中です')}</h2>
   {!state.gameplay.openingCelebrated?<><p>{tr('먼저 모노 카페의 OPEN 간판을 켜면 동네 가게들이 자동화 의뢰를 보내기 시작해요.','Turn on Mono Cafe’s OPEN sign first. Then neighborhood shops start sending automation jobs.','まずモノカフェのOPEN看板をつけると、まちのお店が自動化の依頼を送ってきます。')}</p><button type="button" className="primary-button" onClick={props.onFollow}>{tr('모노 카페 이야기 이어 하기','Continue the Mono Cafe story','モノカフェの物語を続ける')}</button></>
   :<><p>{tr(`Python 자동화 의뢰를 ${SQL_UNLOCK_PYTHON}개 끝내면 데이터베이스 일이 들어와요. (지금 ${pythonDone}/${SQL_UNLOCK_PYTHON})`,`Finish ${SQL_UNLOCK_PYTHON} Python automation jobs and database work starts coming in. (Now ${pythonDone}/${SQL_UNLOCK_PYTHON})`,`Python自動化の依頼を${SQL_UNLOCK_PYTHON}件終えるとデータベースの仕事が来ます。（現在 ${pythonDone}/${SQL_UNLOCK_PYTHON}）`)}</p><div className="ops-locked-meter" aria-hidden="true"><i style={{width:`${Math.min(1,pythonDone/SQL_UNLOCK_PYTHON)*100}%`}}/></div><button type="button" className="primary-button" onClick={()=>props.onOpen('python')}>{tr('STAGE 3 · Python 자동화 열기','Open STAGE 3 · Python automation','STAGE 3 · Python自動化を開く')}</button></>}
  </section>
 </div>;

 return <div className="ops-lab" data-no-translate data-track={track} data-testid={'ops-lab-'+track}>{header}
  <div className="ops-layout">
   <nav className="ops-jobs" aria-label={tr('의뢰 목록','Jobs','依頼一覧')}><ol>{jobs.map((item,index)=>{const phase=status(item);return <li key={item.id}><button type="button" data-testid={'ops-job-'+item.id} aria-current={item.id===job.id?'true':undefined} className={'ops-job is-'+phase} onClick={()=>pick(item.id)}>
    <span className="ops-job-mark" aria-hidden="true">{phase==='done'?<Check size={13}/>:phase==='locked'?<Lock size={12}/>:index+1}</span>
    <span><strong>{item.title[lang]}</strong><small>{item.client[lang]} · {statusText[phase]}</small></span>
   </button></li>;})}</ol></nav>

   <main className="ops-main" aria-labelledby={titleId}>
    <article className="ops-card">
     <header>{avatar(job.client[lang])}<div><small>{job.client[lang]}</small><h2 id={titleId}>{job.title[lang]}</h2></div><span className="ops-pay">+{job.credits} cr · +{job.xp} XP</span></header>
     <p className="ops-brief">{job.brief[lang]}</p>
     <div className="ops-goal"><Target size={16} aria-hidden="true"/><p><b>{tr('목표','GOAL','目標')}</b>{job.goal[lang]}</p></div>
     <ul className="ops-concepts" aria-label={tr('배우는 개념','Concepts you will use','学ぶ概念')}>{job.concepts[lang].split(' · ').map(concept=><li key={concept}>{concept}</li>)}</ul>
    </article>

    <div className="ops-world-col">
     <World key={job.id} job={job} accepted={accepted} completed={completed} passed={!!run?.passed} stale={stale} missing={missing} current={current} goal={goal} start={start} nextCommand={nextCommand} onQueue={queueCommand} tr={tr} lang={lang}/>
     {completed&&<section className="ops-complete" aria-label={tr('고객의 답장','Client reply','お客さんの返事')}>
      <header>{avatar(job.client[lang])}<div><small>{tr('고객의 답장','Client reply','お客さんの返事')}</small><strong>{job.client[lang]}</strong></div></header>
      <blockquote>{job.thanks[lang]}</blockquote>
      <p className="ops-reward"><Coins size={16} aria-hidden="true"/>+{job.credits} cr · +{job.xp} XP</p>
      {nextJob?<button type="button" className="primary-button" onClick={()=>pick(nextJob.id)}>{tr('다음 의뢰','Next job','次の依頼')}: {nextJob.title[lang]}<ChevronRight size={16} aria-hidden="true"/></button>
       :trackDone&&<div className="ops-clear"><Trophy size={22} aria-hidden="true"/><p>{track==='python'?tr('STAGE 3 클리어! 동네의 반복 작업을 전부 자동화했어요.','STAGE 3 clear! You automated every chore in the neighborhood.','STAGE 3クリア！まちの繰り返し作業をすべて自動化しました。'):tr('STAGE 4 클리어! 이제 데이터에게 원하는 질문을 할 수 있어요.','STAGE 4 clear! Now you can ask data any question you want.','STAGE 4クリア！データに好きな質問ができるようになりました。')}</p>{track==='python'&&sqlOpen&&<button type="button" className="primary-button" onClick={()=>props.onOpen('sql')}>{tr('STAGE 4 · SQL 데이터베이스 열기','Open STAGE 4 · SQL database','STAGE 4 · SQLデータベースを開く')}</button>}</div>}
     </section>}
    </div>

    <div className="ops-work">
     {!accepted?<section className="ops-accept">
      {jobOpen?<><p>{tr(`수락하면 내 PC의 ${home(folder)} 폴더에 작업 파일이 생겨요. 그다음부터는 터미널에서 일해요.`,`Accept to get the work files in ${home(folder)} on your PC. From there, you work in the terminal.`,`受けるとPCの${home(folder)}フォルダーに作業ファイルが届きます。そこからはターミナルで作業します。`)}</p><button type="button" className="primary-button ops-accept-button" data-testid="ops-accept" onClick={()=>{props.onWorkContext?.({kind:'ops',id:job.id});onAction({type:'ops-accept',id:job.id});}}><FolderDown size={18} aria-hidden="true"/>{tr('의뢰 수락 · 작업 폴더 받기','Accept job · get the work folder','依頼を受ける · 作業フォルダーを受け取る')}</button></>
       :<p className="ops-muted"><Lock size={15} aria-hidden="true"/>{tr('바로 앞 의뢰를 끝내면 열려요.','Finish the previous job to unlock this one.','直前の依頼を終えると開きます。')}</p>}
     </section>:<>
      {!hasTool&&<section className="ops-panel ops-tools" aria-label={tr('도구 확인','Tool check','ツール確認')}><h3><Wrench size={16} aria-hidden="true"/>{tr(`도구 확인 · ${tool}이(가) 아직 없어요`,`Tool check · ${tool} is not installed yet`,`ツール確認 · ${tool}がまだありません`)}</h3><p className="ops-muted">{tr('가상 PC에만 설치돼요. 실제 컴퓨터에는 아무것도 설치되지 않아요.','It installs on the virtual PC only. Nothing is installed on your real computer.','仮想PCにだけインストールされます。実際のPCには何も入りません。')}</p>{stepList(toolSteps)}</section>}
      <section className="ops-panel">
       <h3><SquareTerminal size={16} aria-hidden="true"/>{tr('터미널 작업 순서','Terminal steps','ターミナルの作業手順')}{hasTool&&<span className="ops-tool-ok"><Check size={12} aria-hidden="true"/>{tool}</span>}</h3>
       <p className="ops-muted">{tr('버튼은 명령을 터미널 입력칸에 넣기만 해요. Enter는 직접 누르세요.','Buttons only put the command in the terminal input. Press Enter yourself.','ボタンはコマンドをターミナルの入力欄に入れるだけです。Enterは自分で押します。')}</p>
       <p className={'ops-cwd'+(here?' is-here':'')}><span>{tr('터미널 위치','Terminal location','ターミナルの場所')}</span><code>{local?home(m.cwd):'server'}</code>{here&&<Check size={13} aria-label={tr('작업 폴더 안','Inside the job folder','作業フォルダー内')}/>}</p>
       {!local&&<p className="ops-warn">{tr('터미널이 서버에 접속 중이에요. exit 로 내 PC로 돌아오세요.','The terminal is connected to the server. Type exit to return to your PC.','ターミナルはサーバーに接続中です。exitでPCに戻りましょう。')} <button type="button" className="ops-cmd" onClick={()=>queueCommand('exit')}><span aria-hidden="true">$</span><code>exit</code></button></p>}
       {stepList(steps)}
      </section>
      {run&&<section className={'ops-panel ops-run '+(stale?'is-stale':run.passed?'is-pass':'is-fail')} role="status" aria-live="polite">
       <h3><span className="ops-badge">{stale?tr('재검사 필요','Not checked','要再検査'):run.passed?tr('통과','Passed','合格'):tr('다시 확인','Needs a fix','要修正')}</span>{stale?tr('아래는 변경 전 코드의 실행 기록이에요','The output below is from the previous code','以下は変更前のコードの実行記録です'):run.passed?tr('3개 데이터 검사를 모두 통과했어요','All 3 dataset checks passed','3つのデータ検査にすべて合格'):tr('검사에서 다른 결과가 나왔어요','A check found a different result','検査で違う結果が出ました')}</h3>
       <pre>{run.output||tr('(출력 없음)','(no output)','(出力なし)')}</pre>
       {!run.passed&&<p className="ops-muted">{tr('어떤 데이터에서 무엇이 달랐는지는 터미널의 ✘ 줄에 나와요.','The ✘ line in the terminal shows which dataset differed and how.','どのデータで何が違ったかはターミナルの✘行に出ます。')}</p>}
       {stale&&<p className="ops-stale"><RotateCcw size={14} aria-hidden="true"/>{tr('파일이 바뀌었어요 · 다시 실행해 보세요','The file changed · run it again','ファイルが変わりました · もう一度実行しましょう')}<button type="button" className="ops-cmd" onClick={()=>queueCommand(runCommand)}><span aria-hidden="true">$</span><code>{runCommand}</code></button></p>}
      </section>}
      <section className="ops-panel ops-files">
       <h3><FileCode2 size={16} aria-hidden="true"/>{tr('작업 폴더','Job folder','作業フォルダー')}<code>{home(folder)}</code></h3>
       <ul>{files.map(file=><li key={file.name}><button type="button" disabled={!file.exists} onClick={()=>openFile(file.path)}><FileText size={15} aria-hidden="true"/><code>{file.name}</code><small>{!file.exists?tr('없음','missing','なし'):file.data?tr('데이터 · 읽기 전용','data · read-only','データ · 読み取り専用'):tr('내가 고칠 파일','the file you fix','自分で直すファイル')}</small></button></li>)}</ul>
       <button type="button" className={'outline-button ops-restore'+(files.some(file=>!file.exists)?' is-needed':'')} onClick={()=>onAction({type:'ops-restore',id:job.id})}><RotateCcw size={15} aria-hidden="true"/>{tr('빠진 파일 · 원본 데이터 복구','Restore missing files and original data','消えたファイル・元データを復元')}</button>
      </section>
      <section className="ops-panel ops-hints">
       <h3><Lightbulb size={16} aria-hidden="true"/>{tr('힌트','Hints','ヒント')}<small>{tr('힌트를 봐도 보상은 줄지 않아요.','Hints never reduce your reward.','ヒントを見ても報酬は減りません。')}</small></h3>
       <div aria-live="polite">{job.hints.slice(0,level).map((hint,index)=><p key={index} className="ops-hint"><b>{index+1}</b><span>{hint[lang]}</span></p>)}</div>
       {level<job.hints.length&&<button type="button" className="ops-hint-button" onClick={()=>setHints(previous=>({...previous,[job.id]:level+1}))}>{tr(`힌트 ${level+1} 보기`,`Show hint ${level+1}`,`ヒント${level+1}を見る`)}</button>}
      </section>
     </>}
    </div>
   </main>
  </div>
 </div>;
}
