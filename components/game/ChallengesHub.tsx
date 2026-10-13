'use client';
import {useState} from 'react';
import {useLanguage} from '@/lib/game/i18n';
import {PracticeJobs} from './PracticeJobs';
import {CodeLab} from './CodeLab';
import {defaultWorkContext} from '@/lib/game/work-context';
import type {GameProps} from './types';

export function ChallengesHub(props:GameProps){
 const language=useLanguage(),tr=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='ja'?ja:en;
 const [tab,setTab]=useState<'rules'|'code'>(props.guided===false?'code':'rules');
 return <div className="challenges-hub" data-no-translate>
  <nav className="challenges-tabs" aria-label={tr('실험실 선택','Choose a lab','実験室を選ぶ')}>
   <button data-testid="rules-tab" aria-pressed={tab==='rules'} onClick={()=>{setTab('rules');props.onWorkContext?.(null,'challenges');}}><strong>{tr('작은 규칙부터','Start with a small rule','小さなルールから')}</strong><span>{tr('한 줄씩 · 6가지 실험','One line · 6 experiments','1行ずつ・6つの実験')}</span></button>
   <button data-testid="code-lab-tab" aria-pressed={tab==='code'} onClick={()=>{setTab('code');props.onWorkContext?.(props.workSelections?.challenges??defaultWorkContext(props.state,'challenges'));}}><strong>{tr('코드로 해결하기','Solve it with code','コードで解決')}</strong><span>{tr('함수부터 서비스까지 · 12가지 의뢰','Functions to services · 12 jobs','関数からサービスまで・12の依頼')}</span></button>
  </nav>
  <div className="challenges-content">{tab==='rules'?<PracticeJobs {...props}/>:<CodeLab {...props}/>}</div>
 </div>;
}
