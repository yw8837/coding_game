export type AboutLanguage = 'ko' | 'en' | 'ja';

type Chapter = { title: string; problem: string; action: string; code: string };
type AboutCopy = {
  title: string; description: string; nav: [string, string, string]; navLabel: string;
  languageLabel: string; skip: string; workingTitle: string; hero: string; lead: string;
  play: string; facts: { label: string; value: string }[]; overviewTitle: string;
  overview: string; chaptersTitle: string; chapters: Chapter[]; howTitle: string;
  how: string; helpTitle: string; help: string; controlsTitle: string;
  controls: { key: string; action: string }[]; requirementsTitle: string;
  requirements: string[]; faqTitle: string; faq: { question: string; answer: string }[];
  footer: string;
};

export const aboutCopy: Record<AboutLanguage, AboutCopy> = {
  ko: {
    title: 'CODE:SHIFT 게임 소개 | 브라우저 코딩 퍼즐',
    description: '가상 바탕화면에서 앱을 직접 조작하고 모노 카페의 메뉴판, 계산대, 주문 연결을 고치는 3장 브라우저 코딩 퍼즐. 현재 웹 버전은 무료이며 가입이 필요 없습니다.',
    nav: ['세 가지 의뢰', '플레이 방법', '자주 묻는 질문'], navLabel: '게임 소개 메뉴',
    languageLabel: '소개 페이지 언어', skip: '소개 내용으로 건너뛰기', workingTitle: '게임 소개 · CODE:SHIFT는 작업명입니다',
    hero: '세 가지 의뢰로 카페의 문을 열어 주세요.',
    lead: '브라우저, 터미널, 에디터를 직접 열고 모노 카페의 고장 난 메뉴판과 계산대, 주문 연결을 고쳐 보세요.',
    play: '플레이하기',
    facts: [{ label: '현재 브라우저 버전', value: '무료, 가입 없이' }, { label: '이야기', value: '세 의뢰와 OPEN 엔딩' }, { label: 'UI 언어', value: '한국어 / English / 日本語' }],
    overviewTitle: '컴퓨터를 조작하는 코딩 퍼즐',
    overview: 'CODE:SHIFT는 모노 카페의 온라인 오픈을 돕는 브라우저 게임입니다. Windows를 연상시키는 가상 바탕화면에서 메시지를 읽고, 프로젝트를 열고, 파일의 작은 값을 바꾼 뒤 결과를 확인합니다. 터미널 명령, 저장소, 서버와 API는 게임 안의 가상 환경에서 동작합니다.',
    chaptersTitle: '카페에 필요한 세 가지 수리',
    chapters: [
      { title: '휴대폰 안에 메뉴판 담기', problem: '카페 이름이 다르고, 메뉴판이 휴대폰 화면 밖으로 삐져나옵니다.', action: 'HTML의 간판 이름과 CSS의 너비를 고치고 브라우저에서 바뀐 화면을 확인하세요.', code: 'width: 960px; → width: 100%;' },
      { title: '수상한 계산대 고치기', problem: '4,500원짜리 커피 세 잔의 합계가 4,503원으로 표시됩니다.', action: 'JavaScript의 계산 연산자를 바꾸고 잔 수에 따라 합계가 맞는지 검사하세요.', code: 'price + quantity → price * quantity' },
      { title: '사라진 주문 연결하기', problem: '손님이 주문했는데 카운터에는 주문서가 도착하지 않습니다.', action: '메뉴 주소와 주문 보관 설정을 고친 뒤 가상 서버를 켜고 API 요청을 보내세요.', code: '/menu → /api/menu' },
    ],
    howTitle: '읽고, 고치고, 확인하고, 전달하기',
    how: '메시지 앱에서 의뢰를 수락하고 브라우저로 문제를 살펴보세요. 터미널에서 프로젝트를 준비하고 에디터에서 값을 수정합니다. 검사에 통과한 파일을 기록·전송한 뒤 CatHub에서 검토와 배포를 진행하면 다음 의뢰로 이어집니다.',
    helpTitle: '다음 행동은 화면에 남아 있습니다',
    help: '안내가 지금 열 앱과 명령, 고칠 글자를 보여 줍니다. “명령 넣기”는 입력을 준비하고 실행은 플레이어가 Enter로 수행합니다. 고칠 글자 선택, 자동완성, 실행 취소와 파일 복원도 사용할 수 있습니다. 틀리거나 힌트를 사용해도 생명·자금이 줄지 않습니다.',
    controlsTitle: '주요 조작', controls: [
      { key: '클릭', action: '바탕화면 앱 열기, 작업 표시줄로 앱 전환' },
      { key: 'X / Esc', action: '앱 창 닫기. 작업 표시줄에서 다시 열 수 있습니다' },
      { key: 'Enter', action: '터미널 입력 실행' },
      { key: 'Tab / Ctrl+Space', action: '에디터 자동완성. 터미널에서는 Tab으로 명령·경로 완성' },
      { key: 'Ctrl+Enter', action: '에디터에서 수정한 파일 검사' },
    ],
    requirementsTitle: '플레이 환경과 저장', requirements: [
      'JavaScript와 브라우저 저장을 사용할 수 있는 최신 브라우저가 필요합니다. 데스크톱 Chrome에서 진행을 확인했으며 모든 브라우저·기기의 동작을 보장하지 않습니다.',
      '키보드와 마우스가 있는 컴퓨터를 권장합니다. 작은 화면용 배치도 제공하며 일부 조작은 터치로 할 수 있습니다. 게임패드 지원은 포함하지 않습니다.',
      '페이지를 불러오려면 인터넷 연결이 필요합니다. 게임 안의 설치·Git·네트워크 명령이 실제 컴퓨터에 프로그램을 설치하거나 실제 서버를 변경하지 않습니다.',
      '진행은 현재 브라우저의 localStorage에 자동 저장됩니다. 사이트 데이터를 지우면 진행이 사라질 수 있으며 다른 기기로 자동 동기화되지 않습니다.',
    ],
    faqTitle: '자주 묻는 질문', faq: [
      { question: '코딩을 몰라도 시작할 수 있나요?', answer: '코딩을 처음 접하는 플레이어를 목표로 현재 행동과 수정 위치를 안내합니다. 실제 초보자의 이해도, 교육 효과나 완주율을 측정한 결과는 아직 없습니다.' },
      { question: '무료인가요? 가입해야 하나요?', answer: '현재 브라우저 버전은 무료로 플레이할 수 있고 회원 가입이 필요 없습니다. 게임의 크레딧은 플레이 안에서 쓰는 가상 자금입니다.' },
      { question: '어떤 언어를 지원하나요?', answer: '타이틀 또는 설정에서 한국어, 영어, 일본어 UI를 선택할 수 있습니다. 코드와 명령, 파일 이름은 원래 표기를 유지합니다.' },
      { question: '내 컴퓨터에서 코드가 실행되나요?', answer: '터미널과 서버는 게임 상태를 바꾸는 가상 환경입니다. HTML/CSS 미리보기와 제한된 계산·설정 판정을 제공하며 범용 개발 환경이나 실제 운영체제는 아닙니다. 외부 AI/LLM을 호출하지 않습니다.' },
      { question: '플레이 시간이나 이용 등급이 정해져 있나요?', answer: '초보자 대상 플레이 시간을 아직 측정하지 않았습니다. 코딩을 모르는 15세 전후 플레이어를 디자인 대상으로 삼지만 공식 이용 등급을 받았다는 의미는 아닙니다.' },
    ],
    footer: 'CODE:SHIFT는 작업명입니다. 현재 브라우저 캠페인의 범위와 조작을 소개합니다.',
  },
  en: {
    title: 'About CODE:SHIFT | Browser Coding Puzzle Game',
    description: 'Use a virtual desktop to fix Mono Café’s menu, checkout, and orders across three chapters. The current browser version is free to play with no signup.',
    nav: ['The requests', 'How to play', 'Questions'], navLabel: 'Game information navigation',
    languageLabel: 'Information page language', skip: 'Skip to game information', workingTitle: 'Game information · CODE:SHIFT is a working title',
    hero: 'Three requests. One café to open.',
    lead: 'Open the browser, terminal, and editor to fix Mono Café’s menu, checkout, and order connection.',
    play: 'Play',
    facts: [{ label: 'Current browser version', value: 'Free, no signup' }, { label: 'Story', value: 'Three requests and an OPEN ending' }, { label: 'Interface languages', value: '한국어 / English / 日本語' }],
    overviewTitle: 'A coding puzzle on a virtual desktop',
    overview: 'CODE:SHIFT is a browser game about helping Mono Café open online. Read messages, open a project, change small values in its files, and check the results on a Windows-like virtual desktop. Terminal commands, repositories, servers, and API traffic operate inside the game’s simulated environment.',
    chaptersTitle: 'Three repairs for the café',
    chapters: [
      { title: 'Fit the menu on a phone', problem: 'The café has the wrong name, and its menu spills beyond the phone screen.', action: 'Change the HTML sign and CSS width, then inspect the updated page in the browser.', code: 'width: 960px; → width: 100%;' },
      { title: 'Fix the suspicious total', problem: 'Three coffees priced at 4,500 won each produce a total of 4,503 won.', action: 'Change the JavaScript operator and check the total with different quantities.', code: 'price + quantity → price * quantity' },
      { title: 'Connect the missing orders', problem: 'A customer places an order, but nothing arrives at the counter.', action: 'Fix the menu route and order-storage setting, start the simulated server, and send an API request.', code: '/menu → /api/menu' },
    ],
    howTitle: 'Read, repair, check, and deliver',
    how: 'Accept a request in Messages and inspect the problem in the browser. Prepare the project in the terminal and edit a value in the editor. Check your files, record and send the changes, then request review and deployment in CatHub to move to the next request.',
    helpTitle: 'Your next action stays on screen',
    help: 'Guidance shows the app, command, and text to change. Insert command prepares the input; you press Enter to run it. Text selection, autocomplete, undo, and file restoration help with editing. Mistakes and hints do not cost lives or funds.',
    controlsTitle: 'Main controls', controls: [
      { key: 'Click', action: 'Open desktop apps and switch apps from the taskbar' },
      { key: 'X / Esc', action: 'Close an app window; reopen it from the taskbar' },
      { key: 'Enter', action: 'Run the terminal input' },
      { key: 'Tab / Ctrl+Space', action: 'Editor autocomplete; Tab completes terminal commands and paths' },
      { key: 'Ctrl+Enter', action: 'Check the edited files from the editor' },
    ],
    requirementsTitle: 'Browser and saving', requirements: [
      'Use a current browser with JavaScript and browser storage enabled. The campaign has been checked in desktop Chrome; every browser and device combination has not been verified.',
      'A computer with a keyboard and mouse is recommended. A small-screen layout is available and some controls support touch. Gamepad support is not included.',
      'An internet connection is required to load the page. In-game installation, Git, and network commands do not install software on your computer or change real servers.',
      'Progress saves automatically to this browser’s localStorage. Clearing site data may remove it. Progress does not automatically sync to another device.',
    ],
    faqTitle: 'Questions before you play', faq: [
      { question: 'Can I start without knowing code?', answer: 'The game is designed for newcomers and provides guidance for the next action and edit location. We have not yet measured novice understanding, educational outcomes, or completion rates.' },
      { question: 'Is it free? Do I need an account?', answer: 'The current browser version is free to play with no signup. Credits are simulated funds used inside the game.' },
      { question: 'Which languages are supported?', answer: 'Choose Korean, English, or Japanese UI from the title screen or Settings. Code, commands, and filenames keep their original spelling.' },
      { question: 'Does it run commands on my computer?', answer: 'The terminal and servers modify simulated game state. The game provides an HTML/CSS preview and limited arithmetic and configuration checks, rather than a general development environment or operating system. It does not call an external AI/LLM service.' },
      { question: 'How long is it? Is there an age rating?', answer: 'Play time for complete beginners has not been measured. The design targets coding newcomers around age 15; that does not represent an official age classification.' },
    ],
    footer: 'CODE:SHIFT is a working title. This page describes the current browser campaign and its controls.',
  },
  ja: {
    title: 'CODE:SHIFT ゲーム紹介 | ブラウザのコーディングパズル',
    description: '仮想デスクトップのアプリを操作し、モノカフェのメニュー、会計、注文を直す全3章のブラウザパズル。現在のブラウザ版は無料で、登録不要です。',
    nav: ['3つの依頼', '遊び方', 'よくある質問'], navLabel: 'ゲーム紹介メニュー',
    languageLabel: '紹介ページの言語', skip: 'ゲーム紹介へスキップ', workingTitle: 'ゲーム紹介 · CODE:SHIFTは仮タイトルです',
    hero: '3つの依頼を直して、カフェを開こう。',
    lead: 'ブラウザ、ターミナル、エディターを開いて、モノカフェのメニュー、会計、注文の接続を直します。',
    play: 'プレイする',
    facts: [{ label: '現在のブラウザ版', value: '無料・登録不要' }, { label: '物語', value: '3つの依頼とOPENエンディング' }, { label: 'UIの言語', value: '한국어 / English / 日本語' }],
    overviewTitle: '仮想デスクトップで解くコーディングパズル',
    overview: 'CODE:SHIFTはモノカフェのオンライン開店を手伝うブラウザゲームです。Windows風の仮想デスクトップでメッセージを読み、プロジェクトを開き、ファイルの小さな値を変えて結果を確認します。コマンド、リポジトリ、サーバー、API通信はゲーム内の仮想環境で動作します。',
    chaptersTitle: 'カフェに必要な3つの修理',
    chapters: [
      { title: 'スマホに収まるメニューに', problem: 'カフェの名前が違い、メニューがスマホ画面からはみ出しています。', action: 'HTMLの看板とCSSの幅を直して、ブラウザで変わった画面を確認します。', code: 'width: 960px; → width: 100%;' },
      { title: 'おかしな合計を直す', problem: '1杯4,500ウォンのコーヒー3杯が、合計4,503ウォンになっています。', action: 'JavaScriptの演算子を変えて、杯数ごとの合計を検査します。', code: 'price + quantity → price * quantity' },
      { title: '届かない注文をつなぐ', problem: 'お客さんが注文しても、カウンターに注文書が届きません。', action: 'メニューのアドレスと注文保存の設定を直し、仮想サーバーを起動してAPIリクエストを送ります。', code: '/menu → /api/menu' },
    ],
    howTitle: '読んで、直して、確かめて、届ける',
    how: 'メッセージで依頼を受け、ブラウザで問題を見ます。ターミナルでプロジェクトを準備し、エディターで値を修正します。検査に通ったファイルを記録・送信し、CatHubでレビューと公開を進めると次の依頼へつながります。',
    helpTitle: '次の操作は画面に残ります',
    help: '案内に開くアプリ、入力するコマンド、直す文字が表示されます。「コマンドを挿入」は入力の準備で、実行はプレイヤーがEnterで行います。文字の選択、補完、取り消し、ファイル復元も利用できます。間違いやヒントでライフ・資金は減りません。',
    controlsTitle: '主な操作', controls: [
      { key: 'クリック', action: 'デスクトップのアプリを開く。タスクバーでアプリを切り替える' },
      { key: 'X / Esc', action: 'アプリのウィンドウを閉じる。タスクバーから再び開けます' },
      { key: 'Enter', action: 'ターミナルに入力したコマンドを実行する' },
      { key: 'Tab / Ctrl+Space', action: 'エディターで補完。ターミナルではTabでコマンド・パスを補完' },
      { key: 'Ctrl+Enter', action: 'エディターから修正したファイルを検査する' },
    ],
    requirementsTitle: 'ブラウザとセーブ', requirements: [
      'JavaScriptとブラウザ保存を利用できる最新のブラウザが必要です。デスクトップChromeで進行を確認していますが、すべてのブラウザ・端末を検証したわけではありません。',
      'キーボードとマウスのあるパソコンを推奨します。小さい画面用のレイアウトがあり、一部の操作はタッチでも利用できます。ゲームパッドには対応していません。',
      'ページの読み込みにはインターネット接続が必要です。ゲーム内のインストール、Git、通信コマンドで実際のソフトをインストールしたり、実際のサーバーを変更したりすることはありません。',
      '進行は現在のブラウザのlocalStorageに自動保存されます。サイトデータを削除すると失われる場合があります。別の端末には自動同期されません。',
    ],
    faqTitle: 'プレイ前によくある質問', faq: [
      { question: 'コードを知らなくても始められますか？', answer: '初めてコードに触れる人を想定し、次の操作と編集位置を案内します。初心者の理解度、教育効果、クリア率はまだ測定していません。' },
      { question: '無料ですか？登録は必要ですか？', answer: '現在のブラウザ版は無料で遊べて、登録は不要です。クレジットはゲームの中で使う仮想の資金です。' },
      { question: 'どの言語を選べますか？', answer: 'タイトル画面または設定から韓国語、英語、日本語のUIを選べます。コード、コマンド、ファイル名の表記は元のままです。' },
      { question: '自分のパソコンでコマンドが動きますか？', answer: 'ターミナルとサーバーはゲームの仮想状態を変更します。HTML/CSSのプレビューと限定された計算・設定の判定を提供し、汎用開発環境や実際のOSではありません。外部のAI/LLMサービスは呼び出しません。' },
      { question: 'プレイ時間や年齢区分はありますか？', answer: '完全な初心者のプレイ時間はまだ測定していません。15歳前後のコード未経験者をデザインの対象にしていますが、公式の年齢区分を取得したという意味ではありません。' },
    ],
    footer: 'CODE:SHIFTは仮タイトルです。現在のブラウザキャンペーンの内容と操作を紹介しています。',
  },
};
