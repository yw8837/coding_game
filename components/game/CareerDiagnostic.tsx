'use client';
import type {CareerFeedback,CareerSourceTarget} from '@/lib/game/career-feedback';
import type {Language} from '@/lib/game/i18n';

export function CareerDiagnostic({model,language,onOpen,onChecks}:{model:CareerFeedback;language:Language;onOpen:(target:CareerSourceTarget|null)=>void;onChecks:()=>void}){
 const text=(ko:string,en:string,ja:string)=>({ko,en,ja})[language],failure=model.firstFailure;
 return <section className={'career-diagnostic '+model.status} data-testid="career-diagnostic" data-status={model.status} aria-label={text('현재 파일의 검사 상태','Check status of current files','現在のファイルの検査状態')}>
  <header role="status"><strong data-testid="career-check-count">{model.status==='checked'?`${model.passed} / ${model.total} ${model.formatBlocked?text('파일 형식 검사 통과 · 계산 미실행','file-format checks passed · calculation not run','ファイル形式検査通過 · 計算未実行'):text('검사 통과','checks passed','検査通過')}`:model.status==='draft'?text('저장하지 않은 코드 · 검사 필요','Unsaved code · check required','未保存コード · 検査が必要'):model.status==='stale'?text('파일 변경 · 다시 검사 필요','Files changed · check again','ファイル変更 · 再検査が必要'):text('현재 파일 · 검사 전','Current files · not checked','現在のファイル · 未検査')}</strong>
   {model.status==='checked'&&<button type="button" className="career-text-button" data-testid="career-diagnostic-checks" onClick={onChecks}>{text('모든 검사 기록','All test results','すべての検査記録')}</button>}
  </header>
  {model.status!=='checked'?<p>{model.status==='draft'?text('JavaScript 초안을 저장한 뒤 현재 파일을 검사하세요. 이전 검사 통과는 이 초안을 검증하지 않습니다.','Save the JavaScript draft, then check the current files. An earlier pass does not verify this draft.','JavaScriptの下書きを保存してから現在のファイルを検査してください。以前の通過はこの下書きを検証しません。'):text('수정한 파일을 검사하면 실제 통과 수와 첫 실패 결과가 표시됩니다.','Check the edited files to see the real passed count and first failing result.','編集したファイルを検査すると、実際の通過数と最初の失敗結果が表示されます。')}</p>:failure?<>
   <h3 data-testid="career-first-failure">{text('먼저 확인할 검사','First check to review','最初に確認する検査')} · {failure.name[language]}</h3>
   <dl className="career-diagnostic-values"><div><dt>{text('기대 결과','Expected','期待する結果')}</dt><dd data-testid="career-failure-expected"><code>{failure.expected}</code></dd></div><div><dt>{text('실제 결과','Actual','実際の結果')}</dt><dd data-testid="career-failure-actual"><code>{failure.actual}</code></dd></div></dl>
   <footer><p data-testid="career-failure-source">{model.target?`${text('확인할 파일','File to review','確認するファイル')}: ${model.target.file}${model.target.line?` · ${text('줄','line','行')} ${model.target.line}`:''}`:text('이 검사에서 오류 파일을 특정하지 못했습니다. 프로젝트 파일의 형식을 확인하세요.','This check does not identify the error file. Review the project file formats.','この検査ではエラーファイルを特定できません。プロジェクトのファイル形式を確認してください。')}</p><button type="button" className="outline-button" data-testid="career-failure-open-file" onClick={()=>onOpen(model.target)}>{model.target?`${model.target.file} ${text('열기','open','を開く')}`:text('프로젝트 파일 열기','Open project files','プロジェクトファイルを開く')}</button></footer>
  </>:<p>{text('현재 파일의 모든 검사를 통과했습니다. 고객 답장을 고른 뒤 전달할 수 있습니다.','All current checks passed. Choose a client reply to deliver the work.','現在の検査はすべて通過しました。お客さんへの返事を選んで提出できます。')}</p>}
 </section>;
}
