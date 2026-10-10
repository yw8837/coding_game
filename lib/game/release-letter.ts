import {L,type Localized} from './career-content.ts';
import {CAREER_TRACK_LABELS,type CareerFootprint,type CareerTrack} from './career-tags.ts';
import type {ReleaseProduct} from './release-product.ts';

export type ReleaseEnding='community'|'studio'|'balanced';
export type ReleaseFootprint=CareerFootprint&{clients:Localized[];title:string;product:ReleaseProduct|null};
export type ReleaseLetter={sender:'지우'|'민서';title:Localized;paragraphs:Localized[];director:Localized[]};
type Lang=keyof Localized;
const LANGS:Lang[]=['ko','en','ja'];
const each=(make:(lang:Lang)=>string):Localized=>Object.fromEntries(LANGS.map(lang=>[lang,make(lang)])) as Localized;
/** "해나 · 새벽빵집" → "새벽빵집 해나 씨" / "Hana at Dawn Bakery" / "夜明けベーカリーのハナさん". */
function person(client:Localized):Localized {
 return each(lang=>{const [name,place]=client[lang].split(' · ');return !place?({ko:`${name} 씨`,en:name,ja:`${name}さん`})[lang]:lang==='ko'?`${place} ${name} 씨`:lang==='en'?`${name} at ${place}`:`${place}の${name}さん`;});
}
const KIND:Record<ReleaseProduct['kind'],Localized>={
 directory:L('추천 장소 모음','list of recommended places','おすすめの場所'),
 events:L('행사 안내판','event board','イベント案内'),
 portfolio:L('작품 모음','portfolio','作品集'),
};
const TITLES:Record<ReleaseEnding,Localized>={
 community:L('동네와 함께하는 작업실','A studio for the neighborhood','まちと歩む作業場'),
 studio:L('기준을 세운 독립 작업실','An independent studio with standards','基準を持つ独立した作業場'),
 balanced:L('사람과 도구를 잇는 작업실','A studio connecting people and tools','人と道具をつなぐ作業場'),
};
const OPENINGS:Record<ReleaseEnding,Localized>={
 community:L('처음에는 카페 메뉴 하나였는데, 이제 우리가 매일 쓰는 도구 곳곳에 네 손이 닿았네.','It started with a café menu. Now your work is in the tools we use every day.','始まりはカフェのメニューだったね。今は毎日使う道具のあちこちに、あなたの仕事がある。'),
 studio:L('마지막 빌드를 열어 봤어. 좁은 화면도, 잘못된 주소도 그냥 넘기지 않았더라.','I opened the final build. You checked the narrow screen and the broken address instead of leaving them for later.','最後のビルドを開いたよ。小さな画面も間違ったアドレスも、そのままにしなかったね。'),
 balanced:L('카페 이름을 처음 고치던 날 생각나? 이제는 누군가의 부탁을 듣고, 파일을 고치고, 제대로 되는지 확인해서 내놓을 수 있게 됐네.','Remember fixing the café name? Now you can listen to a request, change the files, check the result and put it out into the world.','初めてカフェの名前を直した日を覚えてる？今はお願いを聞いて、ファイルを直し、確かめてから公開できるんだね。'),
};
const CLIENTS:Record<ReleaseEnding,(a:string,b:string,lang:Lang)=>string>={
 community:(a,b,lang)=>({ko:`${a}랑 ${b}도 네 얘기를 하더라. 자기 말을 끝까지 들어준 사람이라고.`,en:`${a} and ${b} keep talking about you. They say you listened all the way through.`,ja:`${a}も${b}も、あなたの話をしていたよ。最後まで話を聞いてくれた人だって。`})[lang],
 studio:(a,b,lang)=>({ko:`${a}의 첫 의뢰부터 ${b}의 마지막 납품까지 기록을 다 읽었어. 고친 이유와 확인한 결과가 빠짐없이 남아 있더라.`,en:`I read your records, from the first job for ${a} to the last delivery for ${b}. Every change has a reason and a checked result.`,ja:`${a}の最初の依頼から${b}への最後の納品まで、記録を全部読んだよ。直した理由と確かめた結果が、ちゃんと残ってた。`})[lang],
 balanced:(a,b,lang)=>({ko:`${a}랑 ${b}가 카페에 들렀다가 네 안부를 묻더라.`,en:`${a} and ${b} dropped by the café and asked how you were doing.`,ja:`${a}と${b}がカフェに寄って、あなたは元気かって聞いていたよ。`})[lang],
};
const TRACK_LINES:Record<CareerTrack,Localized>={
 interface:L('너는 늘 화면 앞에 앉을 사람부터 생각했지. 처음 들어온 사람도 길을 잃지 않게, 누구나 읽고 누를 수 있는 화면을 만들었어.','You always thought first about the person in front of the screen, so that anyone could read it, press it and find their way.','画面の前に座る人のことを、いつも最初に考えていたね。初めての人でも迷わず読めて押せる画面を作ってくれた。'),
 data:L('엉킨 표와 겹친 목록을 하나씩 풀어 준 덕분에 다들 숫자를 다시 믿게 됐대. 원본은 지키고 결과만 바로잡는 솜씨, 다들 알아봤어.','You untangled messy tables and duplicate lists, and people trust their numbers again. Everyone noticed how you kept the source intact and fixed only the result.','絡まった表や重なったリストを一つずつほどいてくれたから、みんなまた数字を信じられるようになった。元のデータは守って結果だけ正す腕前、ちゃんと伝わってるよ。'),
 logic:L('가격, 한도, 시간처럼 헷갈리던 규칙을 하나하나 분명하게 만들어 줬어. 딱 경계에 걸린 경우까지 확인하는 건 아무나 하는 일이 아니야.','You made confusing rules about prices, limits and time clear, one by one. Checking the exact edge cases too is not something everyone does.','価格や上限、時間みたいなややこしいルールを、一つずつはっきりさせてくれた。ちょうど境目のケースまで確かめるのは、誰にでもできることじゃないよ。'),
 server:L('주소, 캐시, 로그, 백업처럼 눈에 안 보이는 곳을 챙겨 준 사람이 너야. 아무 일도 안 일어난 평범한 하루가 사실 네 덕분이었어.','You looked after the parts nobody sees: addresses, caches, logs and backups. The quiet days when nothing went wrong were your doing.','アドレスやキャッシュ、ログ、バックアップみたいな、目に見えないところを守ってくれたのはあなただよ。何も起きない普通の一日は、実はあなたのおかげだった。'),
};
function codeLine(sender:'지우'|'민서',count:number):Localized {
 const jobs=count===1?'one job':`${count} jobs`;
 if(sender==='민서'){
  if(!count)return L('설정 파일만으로 모든 의뢰를 끝냈지. 몇 줄을 정확히 고치는 것도 실력이야. 다음엔 JS 배지가 붙은 의뢰를 코드로도 풀어 봐.','You finished every job through settings files alone. Changing a few lines exactly is a real skill. Next, try one of the JS-badged jobs in code.','設定ファイルだけで全部の依頼を終えたね。数行を正確に直すのも実力だよ。次はJSバッジの依頼をコードでも解いてみて。');
  if(count<3)return L(`의뢰 ${count}건은 설정 대신 JavaScript 함수를 직접 썼더라. 입력과 출력을 끝까지 맞춘 코드였어.`,`For ${jobs} you wrote a JavaScript function instead of editing settings. The inputs and outputs matched all the way.`,`${count}件の依頼は、設定の代わりにJavaScriptの関数を自分で書いていたね。入力と出力が最後まで合うコードだった。`);
  return L(`의뢰 ${count}건을 JavaScript로 직접 풀었지. 솔직히 놀랐어. 이제 나한테 배우는 사람이 아니라 같이 코드를 읽는 동료야.`,`You solved ${jobs} by writing JavaScript yourself. Honestly, it surprised me. You are not my student anymore; you are a colleague who reads code with me.`,`${count}件の依頼をJavaScriptで自分で解いたね。正直、驚いたよ。もう教わる人じゃなくて、一緒にコードを読む仲間だ。`);
 }
 if(!count)return L('설정 파일 몇 줄을 정확히 고치는 게 얼마나 큰 차이를 만드는지 네가 보여 줬어.','You showed how much a few exact lines in a settings file can change.','設定ファイルの数行を正確に直すだけで、どれだけ変わるか見せてくれたね。');
 if(count<3)return L(`민서가 그러는데, 의뢰 ${count}건은 JavaScript를 직접 써서 풀었다며? 처음 카페 이름을 고치던 사람이 맞나 싶었어.`,`Minseo told me you solved ${jobs} by writing JavaScript yourself. Is this really the person who once renamed the café?`,`ミンソから聞いたよ。${count}件の依頼はJavaScriptを自分で書いて解いたんだって？カフェの名前を直していた人と同じとは思えないな。`);
 return L(`민서가 자랑하더라. 의뢰 ${count}건을 JavaScript로 직접 풀었다고. 이제 코드는 네가 쓰는 말이 됐네.`,`Minseo keeps bragging that you solved ${jobs} in JavaScript yourself. Code has become a language you speak.`,`ミンソが自慢してたよ。${count}件もJavaScriptで自分で解いたって。コードはもう、あなたの言葉になったね。`);
}
function productLine(ending:ReleaseEnding,footprint:ReleaseFootprint):Localized {
 const item=footprint.product?.items[0]?.name,kind=footprint.product?KIND[footprint.product.kind]:null;
 return each(lang=>{
  const title=footprint.title?({ko:`‘${footprint.title}’`,en:`“${footprint.title}”`,ja:`「${footprint.title}」`})[lang]:({ko:'네 첫 버전',en:'your first release',ja:'あなたの最初の版'})[lang];
  const quoted=item&&kind?({ko:`‘${item}’`,en:`“${item}”`,ja:`「${item}」`})[lang]:'',k=kind?.[lang]??'';
  if(ending==='community')return ({ko:`${title} 주소를 이웃들에게 전했어.${quoted?` ${k}에 올린 ${quoted}부터 다들 눌러 보더라.`:''} 누가 만들었냐길래 네 이름을 말해 줬지.`,en:`I shared ${title} with the neighbors.${quoted?` Everyone started with ${quoted} on your ${k}.`:''} When they asked who made it, I said your name.`,ja:`${title}のアドレスを近所のみんなに伝えたよ。${quoted?`${k}に載せた${quoted}から、みんな開いてた。`:''}誰が作ったのって聞かれたから、あなたの名前を言ったよ。`})[lang];
  if(ending==='studio')return ({ko:`오늘 배포한 ${title} 1.0은 네 이름으로 남겨 두자.${quoted?` ${k} 첫 줄의 ${quoted}까지 전부 네 손으로 쓴 거잖아.`:''}`,en:`Let’s keep ${title}, version 1.0, under your name.${quoted?` From ${quoted} at the top of your ${k}, every line is yours.`:''}`,ja:`今日公開した${title}の1.0は、あなたの名前で残そう。${quoted?`${k}の最初の${quoted}まで、全部あなたが書いたものだから。`:''}`})[lang];
  return ({ko:`${title}에서 문의를 보내 봤어. 목록에 바로 남더라.${quoted?` ${k}의 ${quoted}도 벌써 몇 명이 물어봤어.`:''}`,en:`I sent an inquiry through ${title}. It showed up in the list right away.${quoted?` A few people have already asked about ${quoted} on your ${k}.`:''}`,ja:`${title}から問い合わせを送ってみたら、すぐ一覧に残ったよ。${quoted?`${k}の${quoted}のことも、もう何人か聞きに来た。`:''}`})[lang];
 });
}
const CLOSINGS:Record<ReleaseEnding,Localized>={
 community:L('내일 카페에 오면 네 자리 하나 비워 둘게.','There will be a seat for you at the café tomorrow.','明日、カフェに席を空けておくね。'),
 studio:L('다음 버전도 네가 만들 수 있을 거야. 기다릴게.','You can build the next version too. I’ll be waiting.','次の版も、きっと作れるよ。待ってるね。'),
 balanced:L('오늘은 새 의뢰 말고 네 첫 배포를 축하하러 와. 커피는 우리가 살게.','Come over to celebrate your first release, not for a new job. Coffee is on us.','今日は新しい依頼じゃなく、初公開のお祝いに来て。コーヒーは私たちが出すよ。'),
};
const NEXT_STEPS:Record<CareerTrack,Localized>={
 interface:L('게임 밖에서 이어 간다면 HTML의 label·button 같은 의미 있는 태그와 CSS의 max-width·Flexbox부터 살펴보길 권해요.','If you continue outside the game, start with meaningful HTML tags such as label and button, then CSS max-width and Flexbox.','ゲームの外で続けるなら、labelやbuttonのような意味のあるHTMLタグと、CSSのmax-widthやFlexboxから始めるのがおすすめです。'),
 data:L('게임 밖에서 이어 간다면 스프레드시트 필터와 JavaScript 배열의 filter·map·reduce부터 살펴보길 권해요.','If you continue outside the game, start with spreadsheet filters and the JavaScript array methods filter, map and reduce.','ゲームの外で続けるなら、スプレッドシートのフィルターと、JavaScript配列のfilter・map・reduceから始めるのがおすすめです。'),
 logic:L('게임 밖에서 이어 간다면 if 조건문과 경계값 테스트(딱 3권, 딱 10km 같은 경우)를 직접 써 보길 권해요.','If you continue outside the game, write if statements and boundary tests yourself: exactly three books, exactly 10 km.','ゲームの外で続けるなら、if文と境界値のテスト（ちょうど3冊、ちょうど10kmなど）を自分で書いてみるのがおすすめです。'),
 server:L('게임 밖에서 이어 간다면 HTTP 메서드(GET·POST)와 상태 코드, 브라우저 개발자 도구의 네트워크 탭부터 살펴보길 권해요.','If you continue outside the game, start with HTTP methods (GET, POST), status codes and the Network tab in your browser’s developer tools.','ゲームの外で続けるなら、HTTPメソッド（GET・POST）とステータスコード、ブラウザの開発者ツールのネットワークタブから始めるのがおすすめです。'),
};
function directorNote(footprint:ReleaseFootprint):Localized[] {
 const total=footprint.jobs.length,count=footprint.javascript.length,lead=footprint.lead;
 const summary=each(lang=>{
  const base=({ko:`이번 플레이에서 동네 의뢰 ${total}건을 직접 골라 해결했어요.`,en:`This run, you chose and finished ${total} neighborhood ${total===1?'job':'jobs'} yourself.`,ja:`今回のプレイでは、まちの依頼を${total}件、自分で選んで解決しました。`})[lang];
  if(!lead)return base;
  const label=CAREER_TRACK_LABELS[lead][lang],done=footprint.tracks[lead],trackTotal=footprint.totals[lead];
  return base+' '+({ko:`가장 깊이 들어간 분야는 ‘${label}’(${trackTotal}건 중 ${done}건)입니다.`,en:`The field you went deepest into was ${label} (${done} of ${trackTotal}).`,ja:`いちばん深く取り組んだ分野は「${label}」（${trackTotal}件中${done}件）です。`})[lang];
 });
 const code=count?L(`그중 ${count}건은 설정을 고치는 대신 JavaScript 함수를 직접 작성해 통과했어요. 실행기는 게임 속 가상 환경이지만, 문법은 실제 JavaScript 그대로입니다.`,`In ${count} of them you passed by writing your own JavaScript function instead of editing settings. The runner is simulated inside the game, but the syntax is real JavaScript.`,`そのうち${count}件は、設定を直す代わりにJavaScriptの関数を自分で書いて通過しました。実行環境はゲーム内の仮想のものですが、文法は本物のJavaScriptです。`):L('이번에는 모든 의뢰를 설정 파일로 풀었어요. 지도에서 ‘JS’ 배지가 붙은 의뢰는 ‘JavaScript로 직접 풀기’로 코드 풀이에도 도전할 수 있어요.','This time you solved everything through settings files. Jobs with the JS badge on the map can also be solved in code with “Solve with JavaScript”.','今回はすべての依頼を設定ファイルで解きました。地図で「JS」バッジがついた依頼は、「JavaScriptで解く」からコードでも挑戦できます。');
 return [summary,code,...(lead?[NEXT_STEPS[lead]]:[]),L('끝까지 함께해 줘서 고마워요. 당신이 고친 동네는 저장 파일 안에 그대로 남아 있습니다.','Thank you for staying until the end. The neighborhood you repaired stays in your save, just as you left it.','最後まで一緒にいてくれてありがとう。あなたが直したまちは、セーブデータの中にそのまま残っています。')];
}
/** Ending selection stays in careerEndingFor; this only fills the authored letter with the player's own record. */
export function releaseLetter(ending:ReleaseEnding,footprint:ReleaseFootprint):ReleaseLetter {
 const sender=ending==='studio'?'민서':'지우',[first,last]=footprint.clients.map(person);
 const paragraphs=[OPENINGS[ending]];
 if(first&&last)paragraphs.push(each(lang=>CLIENTS[ending](first[lang],last[lang],lang)));
 if(footprint.lead)paragraphs.push(TRACK_LINES[footprint.lead]);
 paragraphs.push(codeLine(sender,footprint.javascript.length),productLine(ending,footprint),CLOSINGS[ending]);
 return {sender,title:TITLES[ending],paragraphs,director:directorNote(footprint)};
}
