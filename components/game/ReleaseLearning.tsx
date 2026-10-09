'use client';
import {useEffect,useState} from 'react';
import {useLanguage} from '@/lib/game/i18n';
import {evaluateRelease} from '@/lib/game/release';
export function ReleaseLearning({files,onEdit}:{files:Record<string,string>;onEdit:(file:string,content:string)=>void}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const evaluation=evaluateRelease(files),index=evaluation.checks.findIndex(c=>!c.passed);
 const [value,setValue]=useState(''),[help,setHelp]=useState(false),[error,setError]=useState('');
 // eslint-disable-next-line react-hooks/set-state-in-effect -- An external release-check transition resets the previous task answer, help and validation message.
 useEffect(()=>{setValue('');setHelp(false);setError('');},[index]);
 const tasks=[
  {file:'index.html',label:tr('내 프로그램 이름','Name your app','アプリの名前'),prompt:tr('카페 간판처럼 제목을 붙여 보세요. 이번에는 내가 정하는 이름입니다.','Give it a heading, just like the cafe sign. This time, you choose its name.','カフェの看板のように見出しをつけましょう。今度は自分で名前を決めます。'),before:'<h1>',after:'</h1>',example:tr('우리 동네 도움판','My neighborhood board','私のまちの案内板')},
  {file:'style.css',label:tr('휴대폰에 맞는 너비','A width that fits a phone','スマホに合う幅'),prompt:tr('카페 메뉴판을 고칠 때 썼던 값은? px 대신 화면에 맞춰 늘어나는 값을 써 보세요.','Remember the cafe menu? Use a width that follows the screen, instead of fixed pixels.','カフェのメニューで使った値を覚えていますか？pxではなく画面に合わせて伸びる値です。'),before:'.portal { width: ',after:'; }',example:'100%'},
  {file:'server.json',label:tr('장소 목록으로 연결','Connect the place list','場所一覧につなぐ'),prompt:tr('이번에 필요한 주소는 /api/places입니다. 미리보기 버튼이 이 주소로 목록을 요청해요.','This time the address is /api/places. The preview button asks for the list at this address.','今回のアドレスは/api/places。プレビューのボタンがここに一覧を頼みます。'),before:'"route": "',after:'"',example:'/api/places'},
  {file:'server.json',label:tr('문의가 남게 하기','Keep inquiries','問い合わせを残す'),prompt:tr('카페에서 True를 써 봤죠? 이 설정 파일에서는 소문자 true로 보관을 켭니다.','You used True at the cafe. This settings file uses lowercase true to keep inquiries.','カフェではTrueでした。この設定ファイルでは小文字のtrueで保存をオンにします。'),before:'"saveRequests": ',after:'',example:'true'},
 ];
 const task=tasks[index];
 if(!task)return <div className="release-learning-done"><strong>{tr('네 가지가 모두 연결됐어요.','All four pieces are connected.','4つともつながりました。')}</strong><p>{tr('이제 미리보기에서 장소를 불러오고 문의를 보내 보세요. 괜찮으면 아래에서 검사하고 배포합니다.','Load places and send an inquiry in the preview. When it works, run the checks and release below.','プレビューで場所を読み込み、問い合わせを送ってみましょう。動いたら下で検査して公開します。')}</p></div>;
 const apply=()=>{
  const v=value.trim();let content=files[task.file]??'';
  if(index===0){if(!v||v.length>40||/[<>]/.test(v)){setError(tr('태그 없이 이름만 1~40자로 써 주세요.','Use a name of 1–40 characters, without tags.','タグを使わず名前だけを1～40文字で書いてください。'));return;}content=content.replace(/(<h1>)[\s\S]*?(<\/h1>)/i,(_match,open,close)=>open+v+close);}
  if(index===1){if(!/^\d+(?:\.\d+)?(?:px|%)$/.test(v)){setError(tr('100%처럼 숫자와 단위를 붙여 써 보세요.','Use a number with its unit, such as 100%.','100%のように数値と単位を続けて書いてください。'));return;}content=content.replace(/(width\s*:\s*)[^;}]+/,'$1'+v);}
  if(index>=2){try{const data=JSON.parse(content);if(index===2)data.route=v;else {if(v!=='true'&&v!=='false')throw Error();data.saveRequests=v==='true';}content=JSON.stringify(data,null,2)+'\n';}catch{setError(tr('소문자 true 또는 false를 확인하세요. 파일이 손상됐다면 전체 코드에서 복원할 수 있어요.','Check lowercase true or false. If the file is damaged, repair it in full code.','小文字のtrueかfalseを確認してください。ファイルが壊れている場合はコード全体で直せます。'));return;}}
  if(content===files[task.file]){setError(tr('아직 같아요. 옆의 현재 화면과 목표를 비교해 보세요.','Nothing changed yet. Compare the current screen with the goal.','まだ同じです。現在の画面と目標を比べてみましょう。'));return;}
  onEdit(task.file,content);const next=evaluateRelease({...files,[task.file]:content});setError(next.checks[index]?.passed?'':tr('화면을 봐요. 목표와 무엇이 다른지 비교하고 다시 바꿔 보세요.','Look at the screen. Compare it with the goal and try another value.','画面を見ましょう。目標との違いを比べ、別の値を試してください。'));
 };
 return <section className="release-learning" data-testid="release-learning"><div><small>{index+1}/4 · {task.file}</small><h3>{task.label}</h3><p>{task.prompt}</p></div><form onSubmit={e=>{e.preventDefault();apply();}}><label htmlFor="release-token">{task.before}<span> ? </span>{task.after}</label><input id="release-token" data-testid="release-token" value={value} maxLength={80} spellCheck={false} autoComplete="off" onChange={e=>setValue(e.target.value)}/><button className="primary-button" data-testid="release-apply" disabled={!value.trim()}>{tr('내 코드에 적용','Apply to my code','自分のコードに反映')}</button></form><button className="coach-text-button" onClick={()=>setHelp(!help)} aria-expanded={help}>{tr('생각 안 나면 힌트','Need a reminder?','思い出せなければヒント')}</button>{help&&<p className="release-token-hint"><code>{task.example}</code><button className="outline-button" onClick={()=>setValue(task.example)}>{tr('빈칸에 넣기','Put in the blank','空欄に入れる')}</button></p>}{error&&<p className="coach-retry" role="status">{error}</p>}</section>;
}
