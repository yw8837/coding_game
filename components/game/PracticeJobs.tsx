'use client';
import {useState} from 'react';
import {AlertCircle,ArrowRight,CheckCircle2,FlaskConical,Play,RotateCcw} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {PRACTICE_JOBS,createPractice,type PracticeId,type PracticeValue} from '@/lib/game/practice';
import type {GameProps} from './types';

/** Drafts/proofs/rewards live in game state; hiding or closing a window cannot clear them. */
export function PracticeJobs({state,onAction}:Pick<GameProps,'state'|'onAction'>){
 const language=useLanguage(),tr=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='en'?en:ja;
 const [selected,setSelected]=useState<PracticeId>('total');
 const practice=state.gameplay.practice??createPractice();
 const job=PRACTICE_JOBS.find(item=>item.id===selected)!;
 const answer=practice.drafts[job.id]??job.initial;
 const proof=practice.results[job.id];
 const completed=practice.completed.includes(job.id);
 const currentProof=proof?.answer===answer?proof:undefined;
 const firstFailure=currentProof?.cases.find(result=>!result.passed);
 const value=(item:PracticeValue)=>typeof item==='boolean'?(item?tr('예','Yes','はい'):tr('아니요','No','いいえ')):item==='undefined'?tr('계산 불가','Undefined','計算できません'):typeof item==='number'?item.toLocaleString(language==='ko'?'ko-KR':language==='ja'?'ja-JP':'en-US'):item;
 const inputText=(input:Record<string,PracticeValue>)=>Object.entries(input).map(([key,item])=>`${key} = ${value(item)}`).join(' · ');
 const draft=(next:string)=>onAction({type:'practice-draft',id:job.id,answer:next});
 const nextJob=PRACTICE_JOBS.find(item=>!practice.completed.includes(item.id)&&item.id!==job.id);
 return <div className="practice-app" data-no-translate>
  <header className="practice-header"><div className="practice-brand"><FlaskConical size={25}/><div><h1>{tr('규칙 실험실','Rule laboratory','ルール実験室')}</h1><p>{tr('작은 오류를 발견하고, 직접 바꾼 규칙을 시험해 보세요.','Find small mistakes and test a rule you changed yourself.','小さな間違いを見つけ、自分で変えたルールを試しましょう。')}</p></div></div><span className="practice-progress">{practice.completed.length} / {PRACTICE_JOBS.length}<small>{tr('첫 성공','first successes','初成功')}</small></span></header>
  <div className="practice-layout">
   <nav className="practice-job-list" aria-label={tr('선택 연습 문제','Optional practice jobs','選択練習問題')}>
    <p className="practice-list-label">{tr('어디부터 해도 좋아요','Start anywhere','どこからでもどうぞ')}</p>
    {PRACTICE_JOBS.map((item,index)=><button type="button" className={'practice-job '+(selected===item.id?'is-selected':'')} aria-current={selected===item.id?'page':undefined} key={item.id} onClick={()=>setSelected(item.id)}><span className="practice-job-number">{practice.completed.includes(item.id)?<CheckCircle2 size={18}/>:String(index+1).padStart(2,'0')}</span><span><strong>{item.title[language]}</strong><small>{practice.completed.includes(item.id)?tr('보상 받음 · 다시 연습 가능','Reward received · replay available','報酬受取済み · 再練習可能'):`${item.credits} cr · ${item.xp} XP`}</small></span><ArrowRight size={14}/></button>)}
    <p className="practice-optional">{tr('의뢰와 별개인 선택 연습이에요. 시간 제한과 실패 페널티는 없어요.','These optional exercises are separate from your quests. There is no timer or failure penalty.','依頼とは別の選択練習です。制限時間や失敗ペナルティはありません。')}</p>
   </nav>
   <main className="practice-workbench" aria-labelledby="practice-job-title">
    <div className="practice-goal"><span className="practice-kicker">{tr('오늘의 작은 문제','A small problem to solve','小さな問題')}</span><h2 id="practice-job-title">{job.title[language]}</h2><p>{job.goal[language]}</p><div className="practice-consequence"><ArrowRight size={15}/><span>{job.consequence[language]}</span></div></div>
    <section className="practice-evidence" aria-labelledby="practice-tests-title"><header><h3 id="practice-tests-title">{tr('입력과 기대 결과','Inputs and expected outputs','入力と期待する結果')}</h3><span>{tr('모든 입력에서 맞아야 해요','Every case must match','すべての入力で一致させます')}</span></header>
     <div className="practice-table-scroll"><table><thead><tr><th scope="col">{tr('입력','Input','入力')}</th><th scope="col">{tr('기대 결과','Expected','期待する結果')}</th><th scope="col">{tr('내 규칙의 결과','My rule returned','自分のルールの結果')}</th></tr></thead><tbody>{job.cases.map((sample,index)=>{const result=currentProof?.cases[index];return <tr className={result?(result.passed?'case-passed':'case-failed'):''} key={index}><td>{Object.entries(sample.input).map(([name,item])=><div className="practice-input-pair" key={name}><span>{job.variables[name]?.[language]??name}</span><code>{name} = {value(item)}</code></div>)}</td><td><strong>{value(sample.expected)}</strong></td><td>{result?<span className="practice-case-result">{result.passed?<CheckCircle2 size={15}/>:<AlertCircle size={15}/>}<strong>{value(result.actual)}</strong></span>:<span className="practice-unrun">{tr('검사 전','Not tested','未検査')}</span>}</td></tr>;})}</tbody></table></div>
    </section>
    <form className="practice-rule-form" onSubmit={event=>{event.preventDefault();onAction({type:'practice-submit',id:job.id,answer});}}>
     <label htmlFor="practice-rule">{tr('내가 고칠 규칙','The rule I will fix','修正するルール')}</label>
     <div className="practice-rule-row"><input id="practice-rule" name="rule" value={answer} maxLength={80} autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="practice-syntax-guide" onChange={event=>draft(event.target.value)}/><button className="primary-button" type="submit"><Play size={16}/>{tr('규칙 검사','Test rule','ルールを検査')}</button></div>
     <p id="practice-syntax-guide" className="practice-syntax-guide">{job.guide[language]}</p>
     <div className="practice-rule-footer"><button type="button" onClick={()=>draft(job.initial)}><RotateCcw size={13}/>{tr('처음 규칙으로','Restore starting rule','最初のルールに戻す')}</button><small>{completed?tr('첫 성공 보상은 이미 받았어요. 재검사는 연습이에요.','Your first-success reward has been received. Further tests are practice.','初成功の報酬は受取済みです。再検査は練習です。'):tr('모두 통과하면 한 번 지급:','All cases pass → one reward:','すべて通過すると1回だけ報酬:')+` ${job.credits} cr · ${job.xp} XP`}</small></div>
    </form>
    <div className="practice-feedback" aria-live="polite" aria-atomic="true">
     {currentProof?.error?<div className="practice-feedback-box needs-work"><AlertCircle size={21}/><div><strong>{tr('규칙의 형식을 확인해 주세요.','Check the rule format.','ルールの形式を確認してください。')}</strong><p>{tr('위의 형식 안내에 있는 짧은 규칙만 입력해 주세요. 값을 바꾸고 다시 검사할 수 있어요.','Enter only a short rule using the format above. Change it and test again.','上の形式に従った短いルールだけを入力してください。変更して再検査できます。')}</p></div></div>:currentProof?.passed?<div className="practice-feedback-box is-success"><CheckCircle2 size={24}/><div><strong>{tr('모든 입력에서 정확해요!','Every input gives the right result!','すべての入力で正しい結果です！')}</strong><p>{tr('성공 기록이 저장됐어요. 다른 규칙을 시험하거나 다음 문제에 도전해 보세요.','Your success is saved. Try another rule or tackle the next problem.','成功記録を保存しました。別のルールを試したり、次の問題に挑戦しましょう。')}</p>{nextJob&&<button type="button" onClick={()=>setSelected(nextJob.id)}>{tr('다음 미해결 문제','Next unsolved problem','次の未解決問題')}<ArrowRight size={14}/></button>}</div></div>:firstFailure?<div className="practice-feedback-box needs-work"><AlertCircle size={21}/><div><strong>{tr('이 입력에서 결과가 달라요.','This input gives a different result.','この入力で結果が違います。')}</strong><code>{inputText(firstFailure.input)}</code><p>{tr('기대','Expected','期待')} <b>{value(firstFailure.expected)}</b> · {tr('실제','Actual','実際')} <b>{value(firstFailure.actual)}</b></p><p>{tr('실패한 입력을 보고 기호나 값을 바꾼 뒤 다시 검사해 보세요.','Use this case to change an operator or value, then test again.','この入力を見て記号や値を変え、再検査してください。')}</p></div></div>:<p className="practice-ready">{tr('기대 결과를 살펴보고 규칙을 고친 뒤 검사를 실행해 보세요.','Inspect the expected results, edit the rule, then run the tests.','期待する結果を確認してルールを修正し、検査を実行しましょう。')}</p>}
    </div>
   </main>
  </div>
 </div>;
}
