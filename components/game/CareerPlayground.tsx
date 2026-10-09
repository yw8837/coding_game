'use client';
import {useState} from 'react';
import {Play,Check,RotateCcw,ReceiptText,DoorOpen,ListChecks,Clock,Monitor,Radio} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {careerScenarios} from '@/lib/game/career-playground';
import type {CareerJob} from '@/lib/game/career-content';

export function CareerPlayground({job,files,completed=false,compact=false}:{job:CareerJob;files:Record<string,string>;completed?:boolean;compact?:boolean}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const scene=careerScenarios(job.id,files);
 const [selected,setSelected]=useState(()=>Math.max(0,scene?.cases.findIndex(check=>!check.passed)??0));
 const [run,setRun]=useState<{source:string;selected:number;actual:string;passed:boolean}|null>(null);
 const [expanded,setExpanded]=useState(!compact);
 if(!scene)return null;
 const index=Math.min(selected,scene.cases.length-1),check=scene.cases[index];if(!check)return null;
 const source=JSON.stringify(files),fresh=run?.source===source&&run.selected===index;
 const Icon=({receipt:ReceiptText,access:DoorOpen,list:ListChecks,schedule:Clock,screen:Monitor,network:Radio})[scene.scene];
 const value=(raw:string)=>raw==='true'?tr('예','Yes','はい'):raw==='false'?tr('아니요','No','いいえ'):raw==='missing'?tr('목록에 없음','Not in list','一覧にありません'):raw==='unavailable'?tr('접수 불가','Unavailable','受付不可'):/^-?\d+$/.test(raw)?Number(raw).toLocaleString(lang):raw;
 return <section className={'career-playground scene-'+scene.scene} data-testid="career-playground" aria-label={scene.title[lang]}>
  <header><Icon size={22}/><div><small>{completed?tr('내가 전달한 버전','Your delivered version','提出した版'):tr('고객의 화면 · 현재 파일로 실행','Client screen · run current files','お客さんの画面 · 現在のファイルで実行')}</small><h3>{scene.title[lang]}</h3></div><button type="button" className="outline-button" data-testid="career-scenario-toggle" aria-expanded={expanded} aria-controls={'scene-content-'+job.id} onClick={()=>setExpanded(!expanded)}>{expanded?tr('접기','Collapse','閉じる'):tr('직접 시험하기','Try it','自分で試す')}</button></header>
  <div id={'scene-content-'+job.id} className="career-scenario-layout" hidden={!expanded}><div className="career-scenario-controls"><label htmlFor={'scenario-'+job.id}>{tr('시험할 상황','Situation to try','試す場面')}</label><select id={'scenario-'+job.id} data-testid="career-scenario-select" value={index} onChange={event=>setSelected(Number(event.target.value))}>{scene.cases.map((item,i)=><option key={i} value={i}>{item.name[lang]}</option>)}</select><p>{tr('다른 상황도 골라 보세요. 파일은 그대로 두고 결과만 확인합니다.','Try another situation too. This checks the result without changing your files.','別の場面も試しましょう。ファイルを変えずに結果だけ確認します。')}</p><button type="button" className="primary-button" data-testid="career-scenario-run" disabled={scene.unavailable} onClick={()=>setRun({source,selected:index,actual:check.actual,passed:check.passed})}><Play size={15}/>{scene.action[lang]}</button></div>
   <div className={'career-scenario-ticket '+(fresh?(run!.passed?'matched':'mismatched'):'')} data-testid="career-scenario-result" aria-live="polite"><small>{check.name[lang]}</small><div><span>{tr('고객이 기대하는 결과','Client expects','お客さんの期待')}</span><strong>{value(check.expected)}</strong></div><div><span>{tr('현재 파일의 결과','Your file returns','現在のファイルの結果')}</span><strong data-testid="career-scenario-actual">{fresh?value(run!.actual):'—'}</strong></div><p>{scene.unavailable?tr('파일을 읽을 수 없어요. 편집 화면에서 파일 형식을 먼저 고쳐 주세요.','The file could not be read. Repair its format in the editor first.','ファイルを読めません。編集画面で形式を先に直してください。'):fresh?run!.passed?<><Check size={16}/>{tr('이 상황은 해결됐어요. 다른 상황과 전체 검사도 확인하세요.','This situation works. Try the others and run all checks.','この場面は直りました。他の場面と全体の検査も確認しましょう。')}</>:tr('요청과 달라요. 파일을 고친 뒤 같은 상황을 다시 실행해 보세요.','The result differs. Edit the file, then run this same situation again.','依頼と違います。ファイルを直して同じ場面をもう一度実行しましょう。'):run?<><RotateCcw size={15}/>{tr('파일이나 상황이 바뀌었어요. 다시 실행해 주세요.','The file or situation changed. Run it again.','ファイルか場面が変わりました。再実行してください。')}</>:tr('상황을 고르고 실행하면 여기에 결과가 나와요.','Choose a situation and run it to see the result here.','場面を選んで実行するとここに結果が出ます。')}</p></div></div>
 </section>;
}
