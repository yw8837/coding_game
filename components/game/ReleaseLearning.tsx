'use client';
import {localizedCopy} from '@/lib/game/zh';
import {useCallback,useEffect,useState} from 'react';
import {useLanguage} from '@/lib/game/i18n';
import {evaluateRelease} from '@/lib/game/release';
import {releaseLearningEdit} from '@/lib/game/release-learning-edit';
import {changedSource} from '@/lib/game/learning-display';
export function ReleaseLearning({files,onEdit,requireProject=false}:{files:Record<string,string>;onEdit:(file:string,content:string)=>void;requireProject?:boolean}){
 const lang=useLanguage(),tr=useCallback((ko:string,en:string,ja:string,zh?:string)=>localizedCopy(ko,en,ja,zh)[lang],[lang]);
 const evaluation=evaluateRelease(files,requireProject),index=evaluation.checks.findIndex(c=>!c.passed);
 const [value,setValue]=useState(''),[help,setHelp]=useState(false),[error,setError]=useState('');
 const [pending,setPending]=useState<{file:string;content:string;code:string;index:number}|null>(null),[saved,setSaved]=useState<{file:string;content:string;code:string}|null>(null);
 // eslint-disable-next-line react-hooks/set-state-in-effect -- An external release-check transition resets the previous task answer, help and validation message.
 useEffect(()=>{setValue('');setHelp(false);setError('');},[index]);
 // eslint-disable-next-line react-hooks/set-state-in-effect -- Confirm the engine's saved files before showing a change or its check result.
 useEffect(()=>{if(!pending)return;if(files[pending.file]===pending.content){setSaved(pending);setError(evaluateRelease(files,requireProject).checks[pending.index]?.passed?'':tr('파일은 저장됐어요. 현재 화면과 요청을 비교해 다른 값을 시험해 보세요.','The file was saved. Compare the current screen with the request and try another value.','ファイルを保存しました。現在の画面と依頼を比べ、別の値を試してください。'));}else {setSaved(null);setError(tr('파일을 저장하지 못했어요. 수정 가능한 프로젝트인지 확인해 주세요.','The file could not be saved. Check that the project can still be edited.','ファイルを保存できませんでした。作品が編集可能か確認してください。'));}setPending(null);},[files,pending,tr,requireProject]);
 const tasks=[
  {file:'index.html',label:tr('내 프로그램 이름','Name your app','アプリの名前'),prompt:tr('제목을 직접 정하고, 위 콘텐츠 작성에서 내 소개와 목록도 저장해 주세요.','Name your app, then write your description and items in the project content form above.','名前を自分で決め、上の内容フォームで紹介と一覧も保存しましょう。'),before:'<h1>',after:'</h1>',hint:tr('누가 무엇에 쓸 작품인지 떠올려 내 이름을 지어 보세요.','Think of who will use your project and give it a name.','使う人を思い浮かべて自分の作品に名前をつけましょう。','想想谁会使用这个作品，给它取个名字。')},
  {file:'style.css',label:tr('휴대폰에 맞는 너비','A width that fits a phone','スマホに合う幅'),prompt:tr('좁은 화면에서 가로로 넘치지 않을 너비를 써 보세요. 전체 코드에서는 최대 너비와 여백도 함께 조절할 수 있어요.','Choose a width that fits narrow screens. In full code you can also combine maximum width and padding.','小さな画面からはみ出さない幅を選びましょう。コード全体では最大幅と余白も組み合わせられます。'),before:'.portal { width: ',after:'; }',hint:tr('px는 고정 너비, %는 화면에 따라 달라지는 비율이에요.','px is a fixed width. A percentage follows the available width.','pxは固定幅、%は画面に応じた割合です。','px 是固定宽度，% 会随可用空间变化。')},
  {file:'server.json',label:tr('장소 목록으로 연결','Connect the place list','場所一覧につなぐ'),prompt:tr('미리보기에서 장소 목록을 불러오면 어느 주소로 요청하나요? 그 요청을 받을 수 있게 연결하세요.','Load places in the preview. Which address does it request? Connect that address.','プレビューで場所を読み込み、リクエスト先のアドレスをつないでください。','在预览里加载地点，看看请求发往哪个地址，再连接该地址。'),before:'"route": "',after:'"',hint:tr('미리보기에서 장소를 불러 보고 요청 주소를 확인하세요.','Load the places in the preview and check the requested address.','プレビューで場所を読み込んでリクエスト先を確認しましょう。','在预览中加载地点并查看请求地址。')},
  {file:'server.json',label:tr('문의가 남게 하기','Keep inquiries','問い合わせを残す'),prompt:tr('문의가 응답 뒤에도 남도록 보관 설정을 켜 주세요. 입력 모양이 생각나지 않으면 힌트를 열 수 있어요.','Enable storage so inquiries remain after the response. Open a hint if you need the input format.','応答後も問い合わせが残るよう保存をオンにしましょう。入力の形を思い出せなければヒントを開けます。'),before:'"saveRequests": ',after:'',hint:tr('true는 보관을 켜고 false는 꺼요. 문의를 보내 어떤 쪽이 필요한지 확인하세요.','true enables storage and false disables it. Send an inquiry to see which behavior you need.','trueは保存を有効に、falseは無効にします。問い合わせを送って確認しましょう。','true 开启保存，false 关闭保存。发一条咨询看看需要哪种行为。')},
 ];
 const savedSource=saved&&files[saved.file]===saved.content?<div className="release-saved-source" data-testid="release-saved-source"><strong>{tr('내 파일에 저장된 변경','Change saved in my file','ファイルに保存した変更')}</strong><small>{saved.file}</small><pre>{saved.code}</pre></div>:null;
 const task=tasks[index];
 if(!task)return <div className="release-learning-done"><strong>{tr('네 가지가 모두 연결됐어요.','All four pieces are connected.','4つともつながりました。')}</strong><p>{tr('이제 미리보기에서 장소를 불러오고 문의를 보내 보세요. 괜찮으면 아래에서 검사하고 배포합니다.','Load places and send an inquiry in the preview. When it works, run the checks and release below.','プレビューで場所を読み込み、問い合わせを送ってみましょう。動いたら下で検査して公開します。')}</p>{savedSource}</div>;
 const apply=()=>{
  const result=releaseLearningEdit(index,files,value);
  if(!result.ok){
   const messages={
    title:tr('태그와 제어 문자 없이 이름만 1~40자로 써 주세요.','Use a name of 1–40 characters, without tags or control characters.','タグや制御文字を使わず名前だけを1～40文字で書いてください。'),
    width:tr('너비는 숫자와 px 또는 % 단위를 붙여 써 주세요.','Write the width as a number followed by px or %.','幅は数値にpxか%を続けて書いてください。'),
    route:tr('연결 주소는 /로 시작하고 100자 이하여야 해요.','The address must start with / and be at most 100 characters.','アドレスは/で始まり、100文字以内にしてください。'),
    boolean:tr('보관 설정은 소문자 true 또는 false로 써 주세요.','Use lowercase true or false for storage.','保存設定は小文字のtrueかfalseで書いてください。'),
    format:tr('현재 파일 모양을 읽을 수 없어요. 전체 코드에서 파일 형식을 먼저 고쳐 주세요.','The current file format cannot be read. Repair its format in full code first.','現在のファイル形式を読めません。コード全体で形式を先に直してください。'),
    same:tr('저장된 값과 같아요. 현재 화면과 요청을 비교해 보세요.','This is the saved value already. Compare the current screen with the request.','すでに保存されている値です。現在の画面と依頼を比べてみましょう。'),
    size:tr('파일은 20,000자까지 저장할 수 있어요. 전체 코드에서 줄여 주세요.','A file can contain at most 20,000 characters. Shorten it in full code.','ファイルは20,000文字までです。コード全体で短くしてください。'),
   };setError(messages[result.reason]);setSaved(null);return;
  }
  setPending({...result,code:changedSource(files[result.file]??'',result.content),index});onEdit(result.file,result.content);
 };
 return <section className="release-learning" data-testid="release-learning"><div><small>{index+1}/4 · {task.file}</small><h3>{task.label}</h3><p>{task.prompt}</p></div><form onSubmit={e=>{e.preventDefault();apply();}}><label htmlFor="release-token">{task.before}<span> ? </span>{task.after}</label><input id="release-token" data-testid="release-token" value={value} maxLength={80} spellCheck={false} autoComplete="off" onChange={e=>setValue(e.target.value)}/><button className="primary-button" data-testid="release-apply" disabled={!value.trim()||!!pending}>{tr('내 코드에 적용','Apply to my code','自分のコードに反映')}</button></form><button className="coach-text-button" data-testid="release-learning-help" onClick={()=>setHelp(!help)} aria-expanded={help}>{tr('생각 안 나면 힌트','Need a reminder?','思い出せなければヒント')}</button>{help&&<p className="release-token-hint">{task.hint}</p>}{error&&<p className="coach-retry" data-testid="release-learning-error" role="status">{error}</p>}{savedSource}</section>;
}
