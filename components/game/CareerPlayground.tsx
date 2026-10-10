'use client';
import {useId,useRef,useState,type ReactNode} from 'react';
import {Play,Check,RotateCcw,ReceiptText,DoorOpen,ListChecks,Clock,Monitor,Radio,Smartphone,Tablet,Sun,Moon,TriangleAlert} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {careerScenarios} from '@/lib/game/career-playground';
import {careerDayLabel,careerDisplayValue} from '@/lib/game/career-display';
import type {CareerJob} from '@/lib/game/career-content';
import type {CareerCheck} from '@/lib/game/career-evaluation';

type Tr=(ko:string,en:string,ja:string)=>string;
type Shell={verdict:'matched'|'mismatched'|null;runs:number};
type StageProps={cases:CareerCheck[];index:number;onSelect:(index:number)=>void;tr:Tr;lang:ReturnType<typeof useLanguage>;shell:Shell};
type Slot={id:string;start:number;end:number};

const pad2=(n:number)=>String(n).padStart(2,'0'),hm=(m:number)=>pad2(Math.floor(m/60))+':'+pad2(m%60),round=(n:number)=>Math.round(n*10)/10;
/** Display-only readers for the scene pictures. Pass/fail always comes from the bounded evaluator's cases. */
function gallery(css:string){
 const source=css.replace(/\/\*[\s\S]*?\*\//g,''),read=(prop:string)=>source.match(new RegExp('(?:^|[;{\\s])'+prop+'\\s*:\\s*([^;}]+)'))?.[1].trim();
 return {width:read('width')??'—',max:read('max-width')??'—',pad:parseFloat(read('padding')??'0')||0,model:read('box-sizing')??'content-box'};
}
function cells(line:string){
 const out:string[]=[];let cell='',quoted=false;
 for(let i=0;i<line.length;i++){const ch=line[i];if(quoted){if(ch==='"'&&line[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}else if(ch==='"')quoted=true;else if(ch===','){out.push(cell);cell='';}else cell+=ch;}
 out.push(cell);return out;
}
function slots(source:string):Slot[]|null{
 const [head,...rows]=source.split(/\r?\n/).filter(line=>line.trim()).map(cells);if(!head)return null;
 const at=(name:string)=>head.indexOf(name),minutes=(value?:string)=>{const m=value?.match(/^(\d{2}):(\d{2})$/);return m?+m[1]*60 + +m[2]:NaN;};
 const list=['A','B','C'].map(id=>{const row=rows.find(r=>r[at('id')]===id);return {id,start:minutes(row?.[at('start')]),end:minutes(row?.[at('end')])};});
 return list.every(slot=>slot.end>slot.start)?list:null;
}
function zone(source:string){
 try{const c=JSON.parse(source);return typeof c?.offsetHours==='number'&&typeof c?.carryDay==='boolean'?{offset:c.offsetHours as number,carry:c.carryDay as boolean}:null;}catch{return null;}
}
/** Same rule as the tutor-timezone evaluator, used only for hours outside its three cases. */
const shift=(hour:number,{offset,carry}:{offset:number;carry:boolean})=>{const total=hour+offset;return {day:carry?Math.floor(total/24):0,hour:((total%24)+24)%24};};
const stamp=(raw:string)=>{const m=raw.match(/^D([+-]\d+) (\d{2}):00$/);return m?{day:+m[1],hour:+m[2]}:null;};

function StageShell({className,shell,children}:{className:string;shell:Shell;children:ReactNode}){
 return <div className={'career-scene-stage '+className+(shell.verdict?' is-'+shell.verdict:'')} data-testid="career-scene-stage">{children}{shell.verdict&&<span key={shell.runs} className="career-scene-stage-flash" aria-hidden="true"/>}</div>;
}
function Status({ok,children}:{ok:boolean;children:ReactNode}){
 return <p className={'stage-status '+(ok?'ok':'warn')}>{ok?<Check size={15} aria-hidden="true"/>:<TriangleAlert size={15} aria-hidden="true"/>}<span>{children}</span></p>;
}

const VIEWPORTS=[320,768,1200],DEVICES=[Smartphone,Tablet,Monitor];
function MuseumStage({cases,index,onSelect,tr,shell,css}:StageProps&{css:string}){
 const view=VIEWPORTS[index]??1200,total=Number(cases[index]?.actual),expected=Number(cases[index]?.expected);
 if(!Number.isFinite(total))return null;
 const rule=gallery(css),content=Math.max(0,total-2*rule.pad),spill=Math.max(0,total-view),columns=content>=800?3:content>=480?2:1;
 const names=[tr('휴대폰','Phone','スマホ'),tr('태블릿','Tablet','タブレット'),tr('데스크톱','Desktop','デスクトップ')];
 return <StageShell className={'museum-stage'+(spill?' is-spill':'')} shell={shell}>
  <div className="museum-toggles" role="group" aria-label={tr('화면 너비 바꾸기','Change screen width','画面幅を切り替え')}>{VIEWPORTS.map((size,i)=>{const Device=DEVICES[i];return <button key={size} type="button" aria-pressed={i===index} data-testid={'museum-viewport-'+size} onClick={()=>onSelect(i)}><Device size={15} aria-hidden="true"/>{names[i]}<b>{size}px</b></button>;})}</div>
  <div className="museum-canvas" aria-hidden="true"><div className="museum-device" style={{width:view/12.4+'%'}}><span className="museum-device-bar"/><div className="museum-gallery" style={{width:total/view*100+'%',paddingInline:rule.pad/view*100+'%'}}><div className="museum-cards" style={{gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`}}>{[0,1,2].map(i=><i key={i}/>)}</div></div>{spill>0&&<span className="museum-spill" style={{width:spill/view*100+'%'}}>+{round(spill)}px</span>}</div></div>
  <dl className="museum-measure"><div><dt>{tr('화면 너비','Screen width','画面幅')}</dt><dd>{view}px</dd></div><div><dt>{tr('갤러리 전체 너비','Gallery total width','ギャラリー全幅')}</dt><dd>{round(total)}px</dd></div><div><dt>{tr('내용 + 안쪽 여백','Content + padding','内容 + 内側余白')}</dt><dd>{round(content)} + {round(rule.pad)}×2</dd></div></dl>
  <div className="stage-code"><code>width: {rule.width}</code><code>max-width: {rule.max}</code><code>box-sizing: {rule.model}</code><small>{rule.model==='border-box'?tr('border-box는 안쪽 여백을 너비 안에 넣어요.','border-box keeps padding inside the width.','border-boxは内側余白を幅の中に入れます。'):tr('content-box는 안쪽 여백을 너비 바깥에 더해요.','content-box adds padding outside the width.','content-boxは内側余白を幅の外に足します。')}</small></div>
  <Status ok={!spill&&total===expected}>{spill?tr(`화면보다 ${round(spill)}px 넓어서 옆으로 넘쳐요. 손님이 옆으로 밀어야 읽을 수 있어요.`,`It is ${round(spill)}px wider than the screen, so visitors have to scroll sideways.`,`画面より${round(spill)}px広く、横にはみ出します。横に動かさないと読めません。`):total===expected?tr('화면 안에 맞고 요청한 너비와 같아요.','It fits the screen and matches the requested width.','画面に収まり、依頼どおりの幅です。'):tr(`넘치지는 않지만 요청한 ${expected}px와 달라요.`,`It fits, but differs from the requested ${expected}px.`,`はみ出しませんが、依頼の${expected}pxと違います。`)}</Status>
 </StageShell>;
}

type Outcome='focused'|'nofocus'|'blocked'|'empty'|'noop'|'sent';
function ClinicStage({cases,index,onSelect,tr,lang,shell,html,play}:StageProps&{html:string;play:boolean}){
 const [linked,required,submits]=cases.map(check=>check.actual==='true'),sig=cases.map(check=>check.actual).join(),id=useId(),input=useRef<HTMLInputElement>(null);
 const label=html.match(/<label\b[^>]*>([^<]+)<\/label/i)?.[1].trim()||tr('이름','Name','名前'),button=html.match(/<button\b[^>]*>([^<]+)<\/button/i)?.[1].trim()||tr('예약','Book','予約'),sample=tr('민서','Minseo','ミンソ');
 const submit=(value:string):Outcome=>!submits?'noop':value.trim()?'sent':required?'blocked':'empty';
 // Run replays the selected rule once; the stage is remounted per run so this only seeds initial state.
 const [name,setName]=useState(play&&index===2?sample:'');
 const [focused,setFocused]=useState(false);
 const [touched,setTouched]=useState(play&&index===1);
 const [result,setResult]=useState<{kind:Outcome;who:string;sig:string}|null>(()=>!play?null:index===0?{kind:linked?'focused':'nofocus',who:'',sig}:index===1?{kind:required?'blocked':'empty',who:'',sig}:{kind:submits?'sent':'noop',who:sample,sig});
 const shown=result?.sig===sig?result:null,filled=!!name.trim(),blank=!filled&&(touched||shown?.kind==='blocked'||shown?.kind==='empty');
 const field=filled?['ok',tr('이름이 들어왔어요.','Name entered.','名前が入りました。')]:blank?required?['warn',tr('이름을 써야 예약할 수 있어요.','Enter a name to book.','名前を書くと予約できます。')]:['bad',tr('필수 표시가 없어 빈칸도 그냥 넘어가요.','Not marked required, so a blank slips through.','必須の指定がないので空欄も通ります。')]:['neutral',required?tr('필수 칸이에요.','Required field.','必須欄です。'):tr('필수 표시가 없어요.','Not marked required.','必須の指定がありません。')];
 const message:Record<Outcome,string>={
  focused:tr('라벨을 누르니 이름 칸으로 바로 갔어요.','The label moved straight to the name field.','ラベルを押すと名前欄にすぐ移りました。'),
  nofocus:tr('라벨을 눌러도 이름 칸으로 가지 않아요. 라벨과 입력칸이 연결되지 않았어요.','The label does not move to the name field. They are not linked.','ラベルを押しても名前欄に移りません。ラベルと入力欄がつながっていません。'),
  blocked:tr('빈 이름이라 예약을 막았어요. 이름 없는 접수가 생기지 않아요.','Blank name stopped. No nameless booking gets through.','空の名前なので予約を止めました。名前のない受付は起きません。'),
  empty:tr('이름 없이도 예약이 넘어가요.','A booking without a name gets through.','名前がなくても予約が通ります。'),
  noop:tr('버튼을 눌러도 아무 일도 없어요. 제출용 버튼이 아니에요.','Nothing happens. The button does not submit.','押しても何も起きません。送信用のボタンではありません。'),
  sent:tr(`${shown?.who}님 예약이 접수됐어요.`,`Booking received for ${shown?.who}.`,`${shown?.who}さんの予約を受け付けました。`),
 };
 const hints=[tr('이름 글자를 누르면 입력칸으로 가요','Clicking the label moves to the field','ラベルを押すと入力欄へ移ります'),tr('이름이 비어 있으면 예약을 막아요','Blank names are stopped','空の名前は止めます'),tr('버튼이 예약을 보내요','The button sends the booking','ボタンが予約を送ります')];
 return <StageShell className="clinic-stage" shell={shell}><div className="clinic-grid">
  <div className="clinic-form">
   <small>{tr('진료소 예약 화면 · 미리보기','Clinic booking page · preview','診療所の予約画面 · プレビュー')}</small>
   <label htmlFor={linked?id:undefined} className={index===0?'is-target':undefined} onClick={()=>setResult({kind:linked?'focused':'nofocus',who:'',sig})}>{label}</label>
   <input ref={input} id={id} className={[focused||shown?.kind==='focused'?'is-glow':'',index===1?'is-target':''].join(' ').trim()||undefined} value={name} placeholder={tr('예: 민서','e.g. Minseo','例: ミンソ')} aria-label={linked?undefined:label} aria-invalid={blank&&required} aria-describedby={id+'-state'} onChange={event=>setName(event.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>{setFocused(false);setTouched(true);}}/>
   <p id={id+'-state'} className={'clinic-field '+field[0]}>{field[0]==='ok'?<Check size={14} aria-hidden="true"/>:field[0]==='neutral'?null:<TriangleAlert size={14} aria-hidden="true"/>}{field[1]}</p>
   <button type="button" className={'clinic-book'+(index===2?' is-target':'')} onClick={()=>{const kind=submit(name);if(kind==='blocked'){setTouched(true);input.current?.focus();}setResult({kind,who:name.trim(),sig});}}>{button}</button>
   {shown&&<Status ok={['focused','blocked','sent'].includes(shown.kind)}>{message[shown.kind]}</Status>}
  </div>
  <div className="clinic-rules"><small>{tr('예약 규칙 · 현재 파일로 실시간 검사','Booking rules · live check of current file','予約ルール · 現在のファイルでリアルタイム検査')}</small><ol>{cases.map((check,i)=><li key={i}><button type="button" aria-pressed={i===index} className={check.passed?'ok':'warn'} onClick={()=>onSelect(i)}>{check.passed?<Check size={15} aria-hidden="true"/>:<TriangleAlert size={15} aria-hidden="true"/>}<span>{check.name[lang]}</span><small>{hints[i]}</small></button></li>)}</ol></div>
 </div></StageShell>;
}

const OPEN=[540,780],PAIRS=[[0,1],[1,2],[0,1],[1,2]];
function WorkshopStage({index,onSelect,tr,shell,csv}:StageProps&{csv:string}){
 const list=slots(csv);if(!list)return null;
 const lo=Math.min(480,Math.floor(Math.min(...list.map(s=>s.start))/60)*60),hi=Math.max(840,Math.ceil(Math.max(...list.map(s=>s.end))/60)*60);
 const span=(start:number,end:number)=>({left:(start-lo)/(hi-lo)*100+'%',width:(end-start)/(hi-lo)*100+'%'}),overlap=(a:Slot,b:Slot)=>Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start));
 const edges=[...new Set(list.flatMap(s=>[s.start,s.end]))].sort((a,b)=>a-b);
 const uses=edges.slice(1).map((end,i)=>({start:edges[i],end,count:list.filter(s=>s.start<end&&s.end>edges[i]).length})).filter(use=>use.count);
 const used=uses.reduce((sum,use)=>sum+Math.max(0,Math.min(use.end,OPEN[1])-Math.max(use.start,OPEN[0])),0),share=Math.round(used/(OPEN[1]-OPEN[0])*100);
 const step=hi-lo>600?120:60,ticks=Array.from({length:Math.floor((hi-lo)/step)+1},(_,i)=>lo+i*step);
 const [a,b]=PAIRS[index]??PAIRS[0],first=list[a],second=list[b],gap=overlap(first,second);
 const clash=(slot:Slot)=>list.some(other=>other!==slot&&overlap(slot,other)>0),min=tr('분','min','分');
 return <StageShell className="slot-stage" shell={shell}>
  <div className="slot-grid" role="img" aria-label={tr('공방 시간표','Workshop timetable','工房の時間割')+': '+list.map(s=>`${s.id} ${hm(s.start)}–${hm(s.end)}`).join(', ')}>
   <div className="slot-row slot-axis"><span/><div className="slot-track">{ticks.map(t=><i key={t} style={{left:(t-lo)/(hi-lo)*100+'%'}}>{hm(t)}</i>)}</div></div>
   {list.map((slot,i)=><div key={slot.id} className={'slot-row'+(i===a||i===b?' is-focus':'')}><span className="slot-id">{slot.id}</span><div className="slot-track"><span className="slot-open" style={span(OPEN[0],OPEN[1])}/><span className={'slot-bar'+(clash(slot)?' clash':'')+(slot.start<OPEN[0]||slot.end>OPEN[1]?' outside':'')} style={span(slot.start,slot.end)}>{hm(slot.start)}–{hm(slot.end)}</span></div></div>)}
   <div className="slot-row slot-room"><span className="slot-id">{tr('방','Room','部屋')}</span><div className="slot-track"><span className="slot-open" style={span(OPEN[0],OPEN[1])}/>{uses.map(use=><span key={use.start} className={'slot-use '+(use.count>1?'clash':'busy')} style={span(use.start,use.end)}/>)}</div></div>
  </div>
  <div className="slot-summary">
   <span className="slot-share">{tr('방 점유율','Room usage','部屋の使用率')}<span className="slot-meter"><b style={{width:Math.min(100,share)+'%'}}/></span><strong>{share}%</strong><small>{used}/{OPEN[1]-OPEN[0]}{min} · 09:00–13:00</small></span>
   <span className="slot-pairs">{[0,1].map(k=>{const [x,y]=PAIRS[k],m=overlap(list[x],list[y]);return <button key={k} type="button" aria-pressed={index===k} className={m?'clash':'ok'} onClick={()=>onSelect(k)}>{list[x].id}↔{list[y].id} · {m?tr(`${m}분 겹침`,`${m} min overlap`,`${m}分重複`):tr('겹침 없음','No overlap','重複なし')}</button>;})}</span>
  </div>
  <Status ok={!gap&&second.start>=first.end}>{gap?tr(`${first.id}와 ${second.id}가 ${gap}분 겹쳐요. 두 모임이 같은 방을 기다려요.`,`${first.id} and ${second.id} overlap by ${gap} min. Two groups wait for one room.`,`${first.id}と${second.id}が${gap}分重なります。2組が同じ部屋を待ちます。`):second.start<first.end?tr(`${second.id}가 ${first.id}보다 먼저 열려요. ${first.id} → ${second.id} 순서로 맞춰 주세요.`,`${second.id} opens before ${first.id}. Put them in ${first.id} → ${second.id} order.`,`${second.id}が${first.id}より先に始まります。${first.id} → ${second.id}の順にしてください。`):tr(`${first.id}가 ${hm(first.end)}에 끝나고 ${second.id}가 ${hm(second.start)}에 시작해요.`,`${first.id} ends at ${hm(first.end)} and ${second.id} starts at ${hm(second.start)}.`,`${first.id}が${hm(first.end)}に終わり、${second.id}が${hm(second.start)}に始まります。`)}</Status>
 </StageShell>;
}

function ZoneClock({hour,ghost=null,title,city,dayText,tr}:{hour:number;ghost?:number|null;title:string;city:string;dayText:string;tr:Tr}){
 const day=hour>=6&&hour<18,time=pad2(hour)+':00';
 return <figure className={'zone-clock '+(day?'is-day':'is-night')}>
  <figcaption><small>{title}</small><strong>{city}</strong></figcaption>
  <svg viewBox="0 0 120 120" role="img" aria-label={`${city} · ${dayText} ${time}`}>
   <circle className="zone-face" cx="60" cy="60" r="54"/>
   {Array.from({length:12},(_,i)=><line key={i} className="zone-tick" x1="60" y1="11" x2="60" y2={i%3?16:21} transform={`rotate(${i*30} 60 60)`}/>)}
   {ghost!==null&&<line className="zone-ghost" x1="60" y1="60" x2="60" y2="30" transform={`rotate(${ghost%12*30} 60 60)`}/>}
   <line className="zone-minute" x1="60" y1="66" x2="60" y2="17"/>
   <g className="zone-hand" style={{transform:`rotate(${hour%12*30}deg)`}}><line x1="60" y1="66" x2="60" y2="32"/></g>
   <circle className="zone-pin" cx="60" cy="60" r="4"/>
  </svg>
  <div className="zone-digital"><b>{time}</b><span>{day?<Sun size={15} aria-hidden="true"/>:<Moon size={15} aria-hidden="true"/>}{day?tr('낮','Day','昼'):tr('밤','Night','夜')} · {dayText}</span></div>
 </figure>;
}
const UTC_HOURS=[23,2,18];
function ZoneStage({cases,index,tr,lang,shell,json}:StageProps&{json:string}){
 const [scrub,setScrub]=useState<{index:number;hour:number}|null>(null),slider=useId();
 const rule=zone(json),base=UTC_HOURS[index]??0,hour=scrub?.index===index?scrub.hour:base,onCase=hour===base;
 const actual=onCase?stamp(cases[index]?.actual??''):rule?shift(hour,rule):null,expected=onCase?stamp(cases[index]?.expected??''):null;
 if(!rule||!actual)return null;
 // Same words as the result ticket; English is lowercased because it sits mid-sentence here.
 const dayName=(d:number)=>{const label=careerDayLabel(d,lang);return lang==='en'?label.toLowerCase():label;};
 const shown=`${dayName(actual.day)} ${pad2(actual.hour)}:00`,wanted=expected?`${dayName(expected.day)} ${pad2(expected.hour)}:00`:'';
 const missed=!!expected&&(expected.day!==actual.day||expected.hour!==actual.hour);
 return <StageShell className="zone-stage" shell={shell}>
  <div className="zone-grid">
   <ZoneClock tr={tr} hour={hour} title={tr('강사가 올린 시각','Teacher posts at','講師の登録時刻')} city={tr('UTC · 겨울 런던','UTC · London in winter','UTC · 冬のロンドン')} dayText={tr('올린 날','posting day','登録日')}/>
   <div className="zone-link"><span>{tr('시차','Offset','時差')}</span><b>{rule.offset>=0?'+':''}{rule.offset}{tr('시간','h','時間')}</b><small>{rule.carry?tr('날짜 넘김 켬','Date carry on','日付繰越あり'):tr('날짜 넘김 끔','Date carry off','日付繰越なし')}</small></div>
   <ZoneClock tr={tr} hour={actual.hour} ghost={missed?expected!.hour:null} title={tr('학생 화면','Student screen','生徒の画面')} city={tr('서울 · 도쿄','Seoul · Tokyo','ソウル · 東京')} dayText={dayName(actual.day)}/>
  </div>
  <Status ok={!missed}>{!onCase?tr(`미리보기: UTC ${pad2(hour)}:00 → 학생 화면 ${shown}. 검사는 위에서 고른 상황으로 해요.`,`Preview: UTC ${pad2(hour)}:00 → student screen ${shown}. Checks use the situation chosen above.`,`プレビュー: UTC ${pad2(hour)}:00 → 生徒の画面 ${shown}。検査は上で選んだ場面で行います。`):missed?tr(`점선 바늘이 학생이 기다리는 시각(${wanted})이에요. 지금 화면에는 ${shown}로 보여요.`,`The dashed hand is when students expect it (${wanted}). The screen now shows ${shown}.`,`点線の針が生徒の待つ時刻(${wanted})です。今の画面は${shown}です。`):tr(`학생 화면에 ${shown}로 맞게 보여요.`,`Students see ${shown}, as expected.`,`生徒の画面に${shown}と正しく表示されます。`)}</Status>
  <div className="zone-scrub"><label htmlFor={slider}>{tr('강사 시계 돌려 보기','Turn the teacher’s clock','講師の時計を回す')}</label><input id={slider} type="range" min={0} max={23} step={1} value={hour} aria-valuetext={`UTC ${pad2(hour)}:00`} onChange={event=>setScrub({index,hour:Number(event.target.value)})}/><output htmlFor={slider}>UTC {pad2(hour)}:00</output>{!onCase&&<button type="button" className="outline-button" onClick={()=>setScrub(null)}>{tr('고른 상황으로 돌아가기','Back to the chosen situation','選んだ場面に戻る')}</button>}</div>
 </StageShell>;
}

export function CareerPlayground({job,files,completed=false,compact=false}:{job:CareerJob;files:Record<string,string>;completed?:boolean;compact?:boolean}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const scene=careerScenarios(job.id,files);
 const [selected,setSelected]=useState(()=>Math.max(0,scene?.cases.findIndex(check=>!check.passed)??0));
 const [run,setRun]=useState<{source:string;selected:number;actual:string;passed:boolean}|null>(null);
 const [runs,setRuns]=useState(0);
 const [expanded,setExpanded]=useState(!compact);
 if(!scene)return null;
 const index=Math.min(selected,scene.cases.length-1),check=scene.cases[index];if(!check)return null;
 const source=JSON.stringify(files),fresh=run?.source===source&&run.selected===index;
 const Icon=({receipt:ReceiptText,access:DoorOpen,list:ListChecks,schedule:Clock,screen:Monitor,network:Radio})[scene.scene];
 const value=(raw:string)=>raw==='true'?tr('예','Yes','はい'):raw==='false'?tr('아니요','No','いいえ'):raw==='missing'?tr('목록에 없음','Not in list','一覧にありません'):raw==='unavailable'?tr('접수 불가','Unavailable','受付不可'):/^-?\d+$/.test(raw)?Number(raw).toLocaleString(lang):careerDisplayValue(raw,lang,check.expected);
 const stageProps:StageProps={cases:scene.cases,index,onSelect:setSelected,tr,lang,shell:{verdict:fresh?(run!.passed?'matched':'mismatched'):null,runs}};
 const stage=scene.unavailable?null:job.id==='museum-layout'?<MuseumStage {...stageProps} css={files['gallery.css']??''}/>:job.id==='clinic-form'?<ClinicStage key={runs} {...stageProps} html={files['booking.html']??''} play={fresh}/>:job.id==='workshop-slots'?<WorkshopStage {...stageProps} csv={files['schedule.csv']??''}/>:job.id==='tutor-timezone'?<ZoneStage {...stageProps} json={files['timezone.json']??''}/>:null;
 return <section className={'career-playground scene-'+scene.scene} data-testid="career-playground" aria-label={scene.title[lang]}>
  <header><Icon size={22}/><div><small>{completed?tr('내가 전달한 버전','Your delivered version','提出した版'):tr('고객의 화면 · 현재 파일로 실행','Client screen · run current files','お客さんの画面 · 現在のファイルで実行')}</small><h3>{scene.title[lang]}</h3></div><button type="button" className="outline-button" data-testid="career-scenario-toggle" aria-expanded={expanded} aria-controls={'scene-content-'+job.id} onClick={()=>setExpanded(!expanded)}>{expanded?tr('접기','Collapse','閉じる'):tr('직접 시험하기','Try it','自分で試す')}</button></header>
  <div id={'scene-content-'+job.id} className="career-scenario-layout" hidden={!expanded}>{stage}<div className="career-scenario-controls"><label htmlFor={'scenario-'+job.id}>{tr('시험할 상황','Situation to try','試す場面')}</label><select id={'scenario-'+job.id} data-testid="career-scenario-select" value={index} onChange={event=>setSelected(Number(event.target.value))}>{scene.cases.map((item,i)=><option key={i} value={i}>{item.name[lang]}</option>)}</select><p>{tr('다른 상황도 골라 보세요. 파일은 그대로 두고 결과만 확인합니다.','Try another situation too. This checks the result without changing your files.','別の場面も試しましょう。ファイルを変えずに結果だけ確認します。')}</p><button type="button" className="primary-button" data-testid="career-scenario-run" disabled={scene.unavailable} onClick={()=>{setRun({source,selected:index,actual:check.actual,passed:check.passed});setRuns(n=>n+1);}}><Play size={15}/>{scene.action[lang]}</button></div>
   <div className={'career-scenario-ticket '+(fresh?(run!.passed?'matched':'mismatched'):'')} data-testid="career-scenario-result" aria-live="polite"><small>{check.name[lang]}</small><div><span>{tr('고객이 기대하는 결과','Client expects','お客さんの期待')}</span><strong>{value(check.expected)}</strong></div><div><span>{tr('현재 파일의 결과','Your file returns','現在のファイルの結果')}</span><strong data-testid="career-scenario-actual">{fresh?value(run!.actual):'—'}</strong></div><p>{scene.unavailable?tr('파일을 읽을 수 없어요. 편집 화면에서 파일 형식을 먼저 고쳐 주세요.','The file could not be read. Repair its format in the editor first.','ファイルを読めません。編集画面で形式を先に直してください。'):fresh?run!.passed?<><Check size={16}/>{tr('이 상황은 해결됐어요. 다른 상황과 전체 검사도 확인하세요.','This situation works. Try the others and run all checks.','この場面は直りました。他の場面と全体の検査も確認しましょう。')}</>:tr('요청과 달라요. 파일을 고친 뒤 같은 상황을 다시 실행해 보세요.','The result differs. Edit the file, then run this same situation again.','依頼と違います。ファイルを直して同じ場面をもう一度実行しましょう。'):run?<><RotateCcw size={15}/>{tr('파일이나 상황이 바뀌었어요. 다시 실행해 주세요.','The file or situation changed. Run it again.','ファイルか場面が変わりました。再実行してください。')}</>:tr('상황을 고르고 실행하면 여기에 결과가 나와요.','Choose a situation and run it to see the result here.','場面を選んで実行するとここに結果が出ます。')}</p></div></div>
 </section>;
}
