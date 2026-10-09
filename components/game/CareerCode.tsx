'use client';

import {useEffect,useRef,useState} from 'react';
import {useLanguage} from '@/lib/game/i18n';
import {careerCodeModeSafe,careerCodeSpec,runCareerCode,CAREER_CODE_FILE,type CareerCodeMode,type CareerCodeRun} from '@/lib/game/career-code';
import {SmartCodeInput} from './SmartCodeInput';

export type CareerCodeProps={jobId:string;files:Record<string,string>;readOnly:boolean;onMode:(mode:CareerCodeMode)=>void;onEdit:(file:string,content:string)=>void;onTest:()=>void;hasProof?:boolean;onDirtyChange?:(dirty:boolean)=>void;initialDraft?:string;onDraftChange?:(draft:string|null)=>void};
/** Keep mounted in both modes, and key by jobId in the parent. Drafts are local
 * until the explicit Save button; accepted canonical files survive mode switches. */
export function CareerCode({jobId,files,readOnly,onMode,onEdit,onTest,hasProof=false,onDirtyChange,initialDraft,onDraftChange}:CareerCodeProps){
 const language=useLanguage(),spec=careerCodeSpec(jobId),source=files[CAREER_CODE_FILE]??'',mode=careerCodeModeSafe(files);
 const text=(ko:string,en:string,ja:string)=>language==='ko'?ko:language==='en'?en:ja;
 const [draft,setDraft]=useState(initialDraft??source),previousSource=useRef(source);
 const [input,setInput]=useState(()=>JSON.stringify(spec?.sample??{},null,2)),[help,setHelp]=useState(false);
 const [pending,setPending]=useState<string|null>(null),[notice,setNotice]=useState<'saved'|'rejected'|null>(null);
 const [result,setResult]=useState<{source:string;input:string;run:CareerCodeRun}|null>(null);
 const dirty=draft!==source;
 const reportedDirty=useRef<boolean|undefined>(undefined);
 useEffect(()=>{if(reportedDirty.current===dirty)return;reportedDirty.current=dirty;onDirtyChange?.(dirty);},[dirty,onDirtyChange]);
 const reportedDraft=useRef<string|null|undefined>(undefined);
 useEffect(()=>{const value=dirty?draft:null;if(reportedDraft.current===value)return;reportedDraft.current=value;onDraftChange?.(value);},[dirty,draft,source,onDraftChange]);
 useEffect(()=>{if(source!==previousSource.current){if(draft===previousSource.current||pending===source)setDraft(source);previousSource.current=source;}},[source,draft,pending]);
 // eslint-disable-next-line react-hooks/set-state-in-effect -- Report save success only after the engine returns the same canonical file content.
 useEffect(()=>{if(pending===null)return;setNotice(files[CAREER_CODE_FILE]===pending?'saved':'rejected');setPending(null);},[files,pending]);
 if(!spec)return null;
 const output=result&&result.source===source&&result.input===input?result.run:null;
 const save=()=>{if(draft.length>12000)return;setPending(draft);setNotice(null);setResult(null);onEdit(CAREER_CODE_FILE,draft);};
 const switchMode=(next:CareerCodeMode)=>{setNotice(null);setResult(null);onMode(next);};
 return <section className="career-code" data-testid="career-code" aria-label={text('JavaScript로 직접 풀기','Solve with JavaScript','JavaScriptで解く')}>
  <header><h3>{text('풀이 방식','Solution method','解き方')}</h3><p>{text('설정 파일을 고치거나, 직접 쓴 함수로 같은 요청을 해결할 수 있어요. 저장한 두 풀이를 바꿔 가며 쓸 수 있습니다.','Edit the configuration or write your own function for the same request. Both saved approaches remain available when switching.','設定を直すか、自分の関数で同じ依頼を解けます。保存済みの両方の解き方を切り替えられます。')}</p></header>
  <div className="career-code-modes" role="group" aria-label={text('풀이 선택','Select approach','解き方の選択')}>
   <button type="button" data-testid="career-use-config" aria-pressed={mode==='config'} disabled={readOnly||dirty||pending!==null} onClick={()=>switchMode('config')}>{text('설정 파일','Configuration','設定ファイル')}</button>
   <button type="button" data-testid="career-use-javascript" aria-pressed={mode==='javascript'} disabled={readOnly||dirty||pending!==null} onClick={()=>switchMode('javascript')}>{text('JavaScript 직접 작성','Write JavaScript','JavaScriptを書く')}</button>
  </div>
  {dirty&&<p role="status">{text('아직 저장하지 않은 코드가 있어요. 풀이를 바꾸거나 검사하기 전에 저장하세요.','There is an unsaved draft. Save before switching approaches or running checks.','未保存のコードがあります。切り替えや検査の前に保存してください。')}</p>}
  {mode==='javascript'&&<>
   <div className="career-code-contract"><h4>{text('입력과 반환값','Input and return value','入力と戻り値')}</h4><p>{spec.contract[language]}</p><p>{text('function solve(input) 안에 작성하세요. const/let, if, 반복문, 배열 map/filter/reduce와 Math.floor 등을 지원합니다. 함수는 값을 return해야 합니다. 이 화면의 입력과 출력은 게임 속 제한 실행 결과입니다.','Write inside function solve(input). Use const/let, if, loops, array map/filter/reduce and Math.floor. Return a value. Inputs and outputs here run through the game’s limited interpreter.','function solve(input)内に書きます。const/let、if、ループ、map/filter/reduce、Math.floorなどを使えます。値をreturnしてください。この画面はゲーム内の制限付き実行です。')}</p></div>
   <button type="button" className="career-text-button" data-testid="career-code-help" aria-expanded={help} onClick={()=>setHelp(!help)}>{text('힌트 보기','Show hint','ヒントを見る')}</button>
   {help&&<p className="career-code-hint">{spec.hint[language]} {jobId==='festival-report'&&text('없는 키를 읽기 전에 초기화하세요. 이미 추가한 부스 이름을 배열에 기록할 수도 있습니다.','Initialize a key before reading it. You can keep the booth names already added in an array.','キーを読む前に初期化します。追加済みブース名を配列に記録できます。')}</p>}
   <label className="career-code-label">solution.js</label>
   {readOnly?<pre>{source}</pre>:<div className="career-code-draft" data-testid="career-js-editor"><SmartCodeInput file="solution.js" value={draft} onChange={value=>{if(value.length<=12000){setDraft(value);setNotice(null);setResult(null);}}} onScroll={()=>{}} onTest={()=>{if(!dirty&&pending===null)onTest();}}/></div>}
   <div className="career-code-tools"><span>{draft.length.toLocaleString()} / 12,000</span>{!readOnly&&<><button type="button" data-testid="career-code-save" disabled={!dirty||pending!==null} onClick={save}>{text('코드 저장','Save code','コードを保存')}</button><button type="button" data-testid="career-code-test" disabled={dirty||pending!==null||!source} onClick={onTest}>{text('저장한 코드 검사','Check saved code','保存済みコードを検査')}</button></>}</div>
   <p role="status" data-testid="career-code-status">{notice==='rejected'?text('저장이 거절됐어요. 코드를 확인하고 다시 저장해 주세요.','The save was rejected. Review the code and save again.','保存が拒否されました。確認して再保存してください。'):dirty?text('편집 중 · 검사 전 저장 필요','Draft · save before checking','編集中 · 検査前に保存'):hasProof?text('현재 저장한 풀이가 의뢰 검사를 통과했어요.','The current saved approach passed the job checks.','現在の保存済みコードは依頼検査に通過しました。'):notice==='saved'?text('파일에 저장했어요. 이제 검사할 수 있습니다.','Saved to the file. You can run checks now.','ファイルに保存しました。検査できます。'):text('저장된 파일을 검사하면 의뢰 결과가 기록됩니다.','Run checks on the saved file to record the job result.','保存済みファイルを検査すると依頼結果が記録されます。')}</p>
   <div className="career-code-manual"><label htmlFor={'career-code-input-'+jobId}>{text('다른 입력으로 직접 실행 · JSON','Try another input · JSON','別の入力で試す · JSON')}</label><textarea data-testid="career-code-input" id={'career-code-input-'+jobId} value={input} maxLength={4000} spellCheck={false} onChange={event=>{setInput(event.target.value);setResult(null);}}/><button type="button" data-testid="career-code-run" disabled={dirty||pending!==null||!source} onClick={()=>setResult({source,input,run:runCareerCode(jobId,source,input)})}>{text('이 입력으로 실행','Run this input','この入力で実行')}</button>
    <p>{text('이 실행은 전달이나 보상을 지급하지 않습니다. 의뢰 검사는 다른 입력과 경계도 확인합니다.','This run does not deliver the job or award credit. Job checks also cover other inputs and boundaries.','この実行では納品や報酬は発生しません。依頼検査は別の入力と境界も確認します。')}</p>
    {output&&<div className="career-code-output" data-testid="career-code-result" data-passed={output.passed?'true':'false'} role="status"><h4>{text('실행 결과','Run result','実行結果')}</h4><dl><div><dt>{text('입력','Input','入力')}</dt><dd><pre>{JSON.stringify(output.input,null,2)}</pre></dd></div><div><dt>{text('기대값','Expected','期待値')}</dt><dd><pre>{JSON.stringify(output.expected,null,2)}</pre></dd></div><div><dt>{text('반환값','Returned','戻り値')}</dt><dd><pre>{output.error?`${output.error.kind}${output.error.line?' · line '+output.error.line:''}: ${output.error.message}`:JSON.stringify(output.actual,null,2)}</pre></dd></div></dl><p>{output.passed?text('이 입력 통과','This input passed','この入力は通過'):text('이 입력은 다시 확인','This input needs a fix','この入力は要確認')}</p></div>}
   </div>
  </>}
 </section>;
}
