import {beginnerRows} from './beginner-translations.ts';
export type Language='ko'|'en'|'ja';
// Each row is Korean ¦ English ¦ Japanese. Source/code and commands are never translated.
const rows=String.raw`
바탕화면 바로가기¦Desktop shortcuts¦デスクトップのショートカット
메시지¦Messages¦メッセージ
수리 의뢰¦Repairs¦修理の依頼
해결사 수첩¦My journal¦解決ノート
작업실 꾸미기¦Customize desktop¦デスクトップを飾る
CODE:SHIFT / 모노 카페 이야기¦CODE:SHIFT / The Mono Cafe story¦CODE:SHIFT / モノカフェの物語
우리 동네에 불이 켜졌다.¦The cafe is open.¦カフェがオープンしました。
작은 카페의 큰 시작.¦A new start for Mono Cafe.¦モノカフェの新しい一歩。
/ 3 준비 완료 ·¦/ 3 preparations done ·¦/ 3 準備完了 ·
메시지 아이콘을 눌러 이야기를 시작하세요.¦Open Messages to begin.¦メッセージを開いて始めましょう。
해결한 일이 바탕화면 속 카페에 남아요.¦Your repairs change the cafe on your desktop.¦直したところが背景のカフェにも反映されます。
지¦J¦ジ
민¦M¦ミ
지우 ·¦Jiwoo ·¦ジウ ·
새 메시지 1개¦1 new message¦新着メッセージ 1件
오픈 초대장¦Opening invitation¦オープンへの招待
진행 중인 의뢰¦Current request¦進行中の依頼
우리 카페를 도와줄 수 있나요?¦Could you help our cafe?¦カフェを手伝ってくれませんか？
커피 한잔하러 오세요!¦Come over for a coffee!¦コーヒーを飲みに来てください！
이제 OPEN 간판을 켜 주세요!¦Time to light the OPEN sign!¦OPENの看板に明かりを！
눌러서 메시지 읽기¦Click to read¦クリックして読む
오픈 기념 보기¦Visit the opening¦オープンを見に行く
눌러서 이야기 이어 하기¦Click to continue¦クリックして続きを遊ぶ
닫은 창 다시 열기¦Reopen last window¦閉じたウィンドウを開く
아이콘을 한 번 클릭해 열기 · Tab으로 이동 · Enter로 선택 · Esc로 창 닫기¦Click an icon to open · Tab to move · Enter to select · Esc to close¦アイコンをクリック · Tabで移動 · Enterで選択 · Escで閉じる
수리 의뢰로 돌아가기¦Back to repairs¦修理に戻る
좋아요, 제가 해볼게요!¦Sure, I'll help!¦はい、やってみます！
보너스 과제 보기¦View bonus tasks¦ボーナス課題を見る
그롬에서 화면 확인¦Preview in Grome¦Gromeで確認
내 성취 보기¦View achievements¦実績を見る
지우¦Jiwoo¦ジウ
민서¦Minseo¦ミンソ
나¦You¦自分
읽지 않은 메시지¦Unread message¦未読メッセージ
게임 캐릭터와 나누는 메시지¦Messages from game characters¦ゲーム内のキャラクターとの会話
모노 카페와 나눈 이야기¦Conversations with Mono Cafe¦モノカフェとの会話
좋아요. 제 첫 프로젝트로 만들어 볼게요!¦Sure. Let's make this my first project!¦はい、最初のプロジェクトにします！
의뢰 보상 지급 완료¦Reward received¦報酬を受け取りました
350 cr · 120 XP · 첫 배포 배지¦350 cr · 120 XP · First Release badge¦350 cr · 120 XP · 初リリースバッジ
쉬는 시간¦Take a break¦ひと休み
보너스와 꾸미기¦Bonus tasks and themes¦ボーナスと模様替え
원할 때 도전하는 보너스예요. 첫 의뢰는 이 과제를 하지 않아도 완료할 수 있어요.¦Optional tasks. You can finish the story without them.¦自由に挑戦できる課題です。やらなくても物語を完了できます。
보너스 01¦Bonus 01¦ボーナス 01
터미널 탐험가¦Terminal Explorer¦ターミナル探検家
복제한 프로젝트 폴더에서 위치, 파일 목록, 안내 문서를 확인해 보세요.¦In the project folder, check your location, list the files and read the guide.¦プロジェクトフォルダーで現在地、ファイル一覧、説明書を確認しましょう。
내 위치 확인¦Check my location¦現在地を確認
파일 목록 둘러보기¦List the files¦ファイル一覧を見る
프로젝트 안내 읽기¦Read the project guide¦説明書を読む
먼저 프로젝트 가져오기¦Get the project first¦まずプロジェクトを取得
프로젝트 폴더로 이동하기¦Go to the project folder¦プロジェクトフォルダーへ移動
20 XP · 탐험가 배지¦20 XP · Explorer badge¦20 XP · 探検家バッジ
보상 받음¦Reward received¦受取済み
보상 받기¦Claim reward¦報酬を受け取る
보너스 02¦Bonus 02¦ボーナス 02
컬러 실험가¦Color Explorer¦カラー実験家
민서의 연습 과제예요. 원하는 색을 골라 주문 버튼의 배경색을 직접 바꿔 보세요.¦Minseo's task: choose a color and repaint the order buttons.¦ミンソの課題。好きな色を選び、注文ボタンを塗り替えましょう。
의¦'s¦の
안에 있는¦inside¦にある
를 바꾸세요.¦can be changed.¦を変更しましょう。
이 색으로 칠하기¦Apply this color¦この色にする
직접 편집¦Edit code¦コードを編集
검사 중…¦Checking…¦確認中…
색상 · 화면 검사¦Check color and layout¦色と画面を確認
선택한 색과 화면 검사 모두 통과!¦Color and layout checks passed!¦色と画面の確認に合格！
수정한 색과 화면 조건을 확인하고 다시 검사해 주세요.¦Check the color and layout, then try again.¦色と画面の条件を見直して、もう一度確認しましょう。
개발 서버를 켜고, 제목·너비와 함께 검사해요.¦Start the dev server, then check the title and width too.¦開発サーバーを起動し、名前と幅も確認します。
30 XP · 실험가 배지¦30 XP · Color Explorer badge¦30 XP · カラー実験家バッジ
게임 크레딧으로 테마를 구입해요. 가진 테마는 언제든 바꿀 수 있어요.¦Spend game credits on themes. Switch owned themes whenever you like.¦ゲーム内のクレジットでテーマを購入。持っているテーマは自由に変更できます。
사용 중¦Equipped¦使用中
이 테마 적용¦Use this theme¦このテーマを使う
내 배지 모아 보기¦View my badges¦バッジを見る
이전 페이지¦Back¦前のページ
다음 페이지¦Forward¦次のページ
페이지 새로고침¦Refresh page¦ページを更新
그롬 주소창¦Grome address bar¦Gromeのアドレス欄
가상 인터넷¦Simulated internet¦ゲーム内のインターネット
COOCLE 홈¦COOCLE home¦COOCLEホーム
개발자 문서¦Developer docs¦開発者ドキュメント
모노 카페¦Mono Cafe¦モノカフェ
개발자 가이드¦Developer guide¦開発ガイド
프로젝트와 도움말 검색¦Search projects and help¦プロジェクトとヘルプを検索
COOCLE 검색어¦COOCLE query¦COOCLE検索語
프로젝트, 오류 메시지, 궁금한 개념 검색¦Search projects, errors or concepts¦プロジェクト、エラー、用語を検索
COOCLE 검색¦Search COOCLE¦COOCLEで検索
추천 검색¦Suggested searches¦おすすめの検索
npm 설치¦Install npm¦npmのインストール
반응형 CSS¦Responsive CSS¦レスポンシブCSS
코드가 모이는 곳¦Project repositories¦コードの保管場所
막힐 땐 여기서¦Help when you're stuck¦困ったときに
첫 클라이언트¦Your first client¦最初の依頼人
작업실 네트워크¦Workspace network¦作業室のネットワーク
프로젝트 · 도움말 · 카페 미리보기¦Projects · Help · Cafe preview¦プロジェクト · ヘルプ · カフェの確認
검색어 수정¦Edit search query¦検索語を変更
다시 검색¦Search again¦もう一度検索
전체¦All¦すべて
프로젝트와 문서¦Projects and docs¦プロジェクトと文書
게임 내 문서에서 “¦Search game docs for “¦ゲーム内の文書で「
” 검색¦”¦」を検索
mono / menu-site — 모노 카페 메뉴 사이트¦mono / menu-site — Mono Cafe menu¦mono / menu-site — モノカフェのメニュー
작은 카페의 온라인 메뉴. HTML · CSS · JavaScript. README, 실행 안내, 열린 이슈를 확인하세요.¦A small cafe's online menu. HTML, CSS and JavaScript. See the README, setup guide and issues.¦小さなカフェのオンラインメニュー。HTML・CSS・JavaScript。README、起動方法、課題を確認できます。
공개 저장소¦Public repository¦公開リポジトリ
Issue #1: 카페 이름을 넣고 화면을 맞춰 주세요¦Issue #1: Add the cafe name and fix the layout¦Issue #1: カフェ名と画面サイズの修正
COOCLE 개발자 문서¦COOCLE developer docs¦COOCLE開発者ドキュメント
정확히 일치하는 문서가 없어, 사용 가능한 학습 문서를 보여 드려요.¦No exact match. Here are the available guides.¦一致する文書がないため、利用できるガイドを表示します。
작은 개발자 문서¦Pocket developer guide¦小さな開発ガイド
왼쪽에서 궁금한 문서를 선택하세요.¦Choose a guide on the left.¦左側から読みたい文書を選んでください。
문서는 언제든 다시 볼 수 있어요. 암기보다 직접 확인해 보는 게 중요해요.¦You can return to these guides whenever you need them.¦いつでも読み返せます。覚えるより、実際に確かめましょう。
이 주소는 가상 인터넷에 없어요.¦This address isn't on the game network.¦このアドレスはゲーム内のネットワークにありません。
COOCLE에서 프로젝트나 필요한 문서를 찾아보세요.¦Find projects and guides on COOCLE.¦COOCLEでプロジェクトやガイドを探しましょう。
COOCLE 열기¦Open COOCLE¦COOCLEを開く
복제 명령 가져오기¦Get clone command¦複製コマンドを取得
프로젝트 안내¦Project guide¦プロジェクトの説明
스타일¦Styles¦スタイル
API 서버¦API server¦APIサーバー
프로젝트 파일¦Project files¦プロジェクトのファイル
원격 저장소¦Remote repository¦リモートリポジトリ
프로젝트 저장소¦Project repository¦プロジェクトの保管場所
커피 한 잔에서 시작하는¦A small web project¦コーヒーから始まる
작은 웹 프로젝트.¦for a neighborhood cafe.¦小さなWebプロジェクト。
배포 대기¦Waiting for release¦公開待ち
최근 검토한 버전¦Last reviewed version¦最後に確認した版
첫 수정을 기다리고 있어요¦Waiting for your first change¦最初の修正を待っています
내 PC에서 수정한 파일은¦Local changes appear here after¦ローカルの修正は
후 이곳에 나타나요.¦.¦後にここへ反映されます。
클라이언트¦Client¦依頼人
확인할 조건¦Requirements¦確認する条件
에디터 열기¦Open editor¦エディターを開く
배포 검토¦Release review¦公開前の確認
원격 저장소에 올라온 특정 커밋을 검토합니다.¦Review the commit uploaded to the remote repository.¦リモートリポジトリに送ったコミットを確認します。
최신 커밋 다시 검토¦Review latest commit¦最新のコミットを再確認
PR 만들기 · 검토 요청¦Create PR · Request review¦PRを作成・確認を依頼
수정 요청¦Changes requested¦修正が必要
병합 완료¦Merged¦マージ済み
검사 통과 · 승인됨¦Checks passed · Approved¦確認合格・承認済み
PR 병합¦Merge PR¦PRをマージ
배포 완료¦Released¦公開済み
검토한 버전 배포¦Release reviewed version¦確認済みの版を公開
첫 번째 변경을 기다리고 있어요.¦Waiting for your first change.¦最初の修正を待っています。
에디터에서 검사를 통과한 파일을 커밋하고 push한 뒤¦Commit and push the files that passed your checks, then¦確認に合格したファイルをコミットしてpushし、
이곳에서 리뷰를 요청해 보세요.¦request a review here.¦ここで確認を依頼しましょう。
의뢰 완료! +¦Request complete! +¦依頼完了！ +
배지를 획득했어요.¦badge earned.¦バッジを獲得しました。
의뢰 확인¦View request¦依頼を見る
원격 변경 기록¦Remote commit history¦リモートの変更履歴
push 전의 로컬 커밋은 아직 이 목록에 보이지 않아요.¦Local commits appear here after you push them.¦ローカルのコミットはpushすると表示されます。
원¦ KRW¦ウォン
계산 오류¦Calculation error¦計算エラー
다른 프로젝트의 서버가 실행 중이에요.¦Another project's server is running.¦別のプロジェクトのサーバーが起動中です。
실행 경로:¦Running from:¦実行パス：
로 종료하고 menu-site 폴더에서¦to stop it, then in menu-site run¦で終了し、menu-siteフォルダーで
를 실행해 주세요.¦.¦を実行してください。
터미널 열기¦Open terminal¦ターミナルを開く
사이트에 연결할 수 없어요.¦Cannot connect to the site.¦サイトに接続できません。
에서 연결을 거부했습니다.¦refused the connection.¦で接続が拒否されました。
개발 서버가 실행 중인지 확인해 보세요.¦Check that the dev server is running.¦開発サーバーが起動しているか確認してください。
배포된 서비스¦Published site¦公開中のサイト
내 PC · 개발 서버¦My PC · Dev server¦自分のPC・開発サーバー
PC 화면¦Desktop view¦PC表示
모바일 360px¦Mobile 360px¦モバイル360px
배포된 모노 카페¦Published Mono Cafe¦公開中のモノカフェ
모노 카페 실시간 미리보기¦Mono Cafe live preview¦モノカフェのプレビュー
수량 줄이기¦Decrease quantity¦数量を減らす
수량 늘리기¦Increase quantity¦数量を増やす
app.js 계산 결과¦Result from app.js¦app.jsの計算結果
OPEN 간판에 불이 켜지고 손님들이 찾아왔어요.¦The OPEN sign is lit and guests have arrived.¦OPENの看板が光り、お客さんが来ました。
아직 오픈 준비 중이에요.¦Still preparing to open.¦オープン準備中です。
좋은 아침, 우리 동네.¦Good morning, neighbors.¦おはよう、みんな。
작은 변화가 모이는 곳.¦Getting ready to open.¦オープン準備中。
메뉴 준비 중¦Menu coming soon¦メニュー準備中
계산대 ✓¦Register ✓¦レジ ✓
준비 중¦Preparing¦準備中
주문 도착 ✓¦Order received ✓¦注文到着 ✓
주문함 대기 중¦Orders offline¦注文受付待ち
다음 행동 안내¦Next action guide¦次の操作ガイド
도움말 닫기¦Close help¦ヘルプを閉じる
개발 도구 · 다음 한 걸음¦Developer tools · Next step¦開発ツール・次の手順
입력 후 Enter로 실행¦Press Enter to run¦Enterで実行
아직 열린 프로젝트가 없어요.¦No project is open yet.¦まだプロジェクトを開いていません。
CatHub에서 저장소를 찾고, 터미널에서 복제해 보세요.¦Find the repository on CatHub and clone it in the terminal.¦CatHubでリポジトリを探し、ターミナルで複製しましょう。
복제한 파일이 이곳에 나타납니다.¦Cloned files appear here.¦複製したファイルがここに表示されます。
CatHub에서 프로젝트 찾기¦Find project on CatHub¦CatHubで探す
수정¦modified¦変更
로컬 파일¦Local files¦ローカルファイル
자동 저장¦Autosaved¦自動保存
수리 화면으로 돌아가기¦Back to repairs¦修理画面へ戻る
간판과 메뉴판 크기를 바꿔 보세요.¦Change the name and menu width.¦看板とメニューの幅を変更しましょう。
가격과 잔 수로 합계를 구해 보세요.¦Calculate the total from price and quantity.¦価格と杯数から合計を計算しましょう。
메뉴 주소와 주문 보관을 설정해 보세요.¦Set the menu address and order storage.¦メニューのアドレスと注文の保存を設定しましょう。
실행 취소¦Undo¦元に戻す
다시 실행¦Redo¦やり直す
자동완성¦Complete¦自動補完
Tab 들여쓰기 · Ctrl+Enter 검사¦Tab indent · Ctrl+Enter test¦Tabで字下げ・Ctrl+Enterで確認
줄¦lines¦行
Shift+Tab 이동¦Shift+Tab move focus¦Shift+Tabで移動
그롬에서 보기¦View in Grome¦Gromeで見る
검사 실행¦Run checks¦確認を実行
의뢰 검사¦Request checks¦依頼の確認
수정됨 · 다시 검사 필요¦Modified · Run checks again¦変更あり・再確認が必要
모든 항목 통과¦All checks passed¦すべて合格
수정할 항목 있음¦Some fixes needed¦修正が必要
통과¦Passed¦合格
아직 조건을 만족하지 못했어요.¦The requirement isn't met yet.¦まだ条件を満たしていません。
코드를 수정하고 검사를 실행해 보세요.¦Edit the code, then run the checks.¦コードを変更して確認を実行しましょう。
현재 의뢰의 실제 결과를 확인합니다.¦Checks use your current project files.¦現在のファイルで結果を確認します。
완료 기준¦Completion criteria¦完了条件
관련 문서 읽기¦Read related guide¦関連ガイドを読む
여러 답이 있어요.¦There is more than one solution.¦答えは一つではありません。
원하는 결과를 만들어 보세요.¦Try making the result you want.¦欲しい結果を作ってみましょう。
엔딩 · 동네 해결사¦Ending · Neighborhood Helper¦エンディング・街の助っ人
마지막 이야기 · 오픈 초대장¦Final chapter · Opening invitation¦最後の物語・オープンへの招待
모노 카페가 문을 열었습니다.¦Mono Cafe is open.¦モノカフェがオープンしました。
오픈 준비가 끝났어요.¦Everything is ready to open.¦オープンの準備が整いました。
메뉴판, 계산대, 주문함. 세 의뢰를 모두 해결했어요.¦Menu, register, orders. All three requests are complete.¦メニュー、レジ、注文。三つの依頼をすべて解決しました。
메뉴판, 계산대, 주문함이 모두 준비됐어요. 지우와 민서가 기다리고 있어요.¦The menu, register and orders are ready. Jiwoo and Minseo are waiting.¦メニュー、レジ、注文の準備ができました。ジウとミンソが待っています。
지우: “혼자였다면 시작도 못 했을 거예요.¦Jiwoo: “I couldn't have done this alone.¦ジウ：「一人では始められなかったと思います。
우리 카페의 첫 오픈, 당신이 해 주실래요?”¦Would you open the cafe for us?”¦最初のオープン、お願いできますか？」
OPEN 간판 켜기¦Light the OPEN sign¦OPENの看板をつける
세 의뢰의 마지막 순간 · 누르면 엔딩이 저장돼요¦One final step · Your ending will be saved¦最後の一歩・押すとエンディングを保存します
첫 손님¦First customer¦最初のお客さん
“메뉴가 잘 보이네요. 커피 두 잔, 9,000원 맞죠?”¦“The menu looks great. Two coffees, 9,000 won, right?”¦「見やすいメニューですね。コーヒー2杯、9,000ウォンですね？」
“네! 주문도 잘 들어왔어요. 따뜻하게 내려 드릴게요.”¦“Yes! Your order came through. I'll brew them now.”¦「はい！注文も届いています。今、淹れますね。」
“처음엔 몰라도 괜찮았지? 보고, 바꾸고, 다시 해보면 돼.”¦“You didn't need to know everything. Try, check, and try again.”¦「最初は知らなくても大丈夫。試して、確かめて、また直せばいいんだよ。」
최종 배지 획득¦Final badge earned¦最後のバッジ獲得
동네 해결사¦Neighborhood Helper¦街の助っ人
끝까지 함께한 당신에게.¦For seeing it through.¦最後まで手伝ってくれたあなたへ。
화면을 고치다¦Fix a page¦画面を直す
규칙을 만들다¦Write a rule¦ルールを作る
컴퓨터를 연결하다¦Connect computers¦コンピューターをつなぐ
해결한 의뢰¦Requests completed¦解決した依頼
누적 경험치¦Total experience¦累積経験値
모은 배지¦Badges earned¦獲得バッジ
개¦total¦個
모노 카페 이야기 · 끝¦The Mono Cafe story · The End¦モノカフェの物語・おしまい
플레이해 주셔서 감사합니다.¦Thank you for playing.¦遊んでくれてありがとうございます。
나의 바탕화면으로¦Back to my desktop¦デスクトップへ
남은 보너스 즐기기¦Try the bonus tasks¦ボーナスを楽しむ
내가 완성한 카페 보기 →¦Visit the cafe I built →¦完成させたカフェを見る →
모노 카페 — 동네 해결사¦Mono Cafe — Repairs¦モノカフェ — 修理の依頼
서버¦Server¦サーバー
가상 서버¦Virtual server¦仮想サーバー
요청 실험실¦Request lab¦リクエスト実験室
그롬¦Grome¦Grome
그롬 — 가상 인터넷¦Grome — Game network¦Grome — ゲーム内ネットワーク
에디터¦Editor¦エディター
Code Editor — 작업실¦Code Editor — Workspace¦Code Editor — 作業室
터미널¦Terminal¦ターミナル
Shift Shell — 터미널¦Shift Shell — Terminal¦Shift Shell — ターミナル
의뢰함¦Requests¦依頼一覧
의뢰함 — Mono Cafe¦Requests — Mono Cafe¦依頼一覧 — モノカフェ
Shift Messenger — 지우와 민서¦Shift Messenger — Jiwoo and Minseo¦Shift Messenger — ジウとミンソ
보너스¦Bonus¦ボーナス
보너스 과제와 작업실 꾸미기¦Bonus tasks and desktop themes¦ボーナス課題と模様替え
성취¦Achievements¦実績
개발 기록 — 성취와 배지¦Journal — Achievements and badges¦記録 — 実績とバッジ
저장 기록을 읽지 못해 새 작업실로 시작했어요.¦Couldn't read the save. A new workspace was opened.¦保存を読み込めなかったため、新しい作業室を開きました。
달성!¦earned!¦達成！
터미널 탐험가 달성!¦Terminal Explorer earned!¦ターミナル探検家を達成！
컬러 실험가 달성!¦Color Explorer earned!¦カラー実験家を達成！
명령어는 3,000자까지 입력할 수 있어요.¦Commands may contain up to 3,000 characters.¦コマンドは3,000文字まで入力できます。
먼저 CatHub 저장소를 복제해 주세요.¦Clone the CatHub repository first.¦まずCatHubのリポジトリを複製してください。
프로젝트 폴더에서 개발 서버를 켜 주세요. 다른 폴더의 서버는 pkill node로 종료할 수 있어요.¦Start the dev server in the project folder. Use pkill node to stop other servers.¦プロジェクト内で開発サーバーを起動してください。他のサーバーはpkill nodeで終了できます。
검사 중 파일이 바뀌었어요. 다시 검사해 주세요.¦Files changed during the check. Please run it again.¦確認中にファイルが変わりました。もう一度確認してください。
CODE SHIFT 작업실로¦CODE SHIFT desktop¦CODE SHIFTデスクトップへ
개발 레벨¦Player level¦プレイヤーレベル
작업 표시줄¦Taskbar¦タスクバー
바탕화면¦Desktop¦デスクトップ
게임 설정¦Game settings¦ゲーム設定
설정¦Settings¦設定
작업실¦Desktop¦作業室
홈¦Home¦ホーム
도움말¦Help¦ヘルプ
의뢰¦Quest¦依頼
접기¦Collapse¦閉じる
펼치기¦Expand¦開く
창¦window¦ウィンドウ
최소화¦Minimize¦最小化
창 최소화¦Minimize window¦ウィンドウを最小化
집중 모드¦Focus mode¦集中モード
창 닫기 (Esc)¦Close window (Esc)¦ウィンドウを閉じる（Esc）
창 닫기¦Close window¦ウィンドウを閉じる
닫기¦Close¦閉じる
내 PC¦My PC¦自分のPC
명령어로 작업하기¦Use commands¦コマンドで操作
터미널 패널 닫기¦Close terminal panel¦ターミナルパネルを閉じる
의뢰 패널 밖을 눌러 닫기¦Close quest panel¦依頼パネルを閉じる
가상 환경¦Game environment¦ゲーム内の環境
menu-site 연결됨¦menu-site connected¦menu-site接続済み
새로운 작업을 기다리는 중¦Waiting for a request¦依頼を待っています
localhost:5173 실행 중¦localhost:5173 running¦localhost:5173起動中
개발 서버 꺼짐¦Dev server stopped¦開発サーバー停止中
자동 저장 · 이 브라우저¦Autosave · This browser¦自動保存・このブラウザー
자동 저장 실패 · 마지막 저장 보존¦Save failed · Previous save kept¦保存失敗・前回の保存を保持
작업실 설정¦Workspace settings¦作業室の設定
모노 카페 이야기 0.4 · 제목은 작업명입니다.¦Mono Cafe story 0.4 · Working title¦モノカフェの物語 0.4・タイトルは仮称です
효과음¦Sound effects¦効果音
선택, 테스트 결과, 배지와 오픈을 짧은 소리로 알려줘요.¦Short sounds for choices, checks, rewards and the opening.¦選択、確認、報酬、オープンを短い音で知らせます。
켜짐¦On¦オン
꺼짐¦Off¦オフ
개발 도구 표시¦Show developer tools¦開発ツールを表示
브라우저, 코드 편집기, 터미널을 직접 다뤄 보고 싶을 때 켜세요.¦Enable to use the browser, code editor and terminal yourself.¦ブラウザー、エディター、ターミナルを自分で操作できます。
창 닫기와 다시 열기¦Close and reopen windows¦ウィンドウの開閉
X 또는 Esc로 작업실에 돌아가세요. 앱 아이콘을 누르면 다시 열립니다. 도움말과 의뢰 패널도 각각 닫을 수 있어요.¦Use X or Esc to return to the desktop. Click an app to reopen it. Help and quests can be closed separately.¦XまたはEscでデスクトップへ。アイコンで再度開けます。ヘルプや依頼も個別に閉じられます。
저장 위치¦Save location¦保存先
현재 브라우저에 자동 저장됩니다. 다른 기기와 동기화되지 않습니다.¦Progress saves in this browser. It does not sync between devices.¦このブラウザーに自動保存します。別の端末とは同期しません。
민서의 도움말¦Minseo's hints¦ミンソのヒント
힌트는 언제든 볼 수 있어요. 사용해도 보상이 줄어들지 않아요.¦Hints are always available and never reduce your reward.¦ヒントはいつでも見られます。報酬は減りません。
설정 닫기¦Close settings¦設定を閉じる
진행 기록 초기화¦Reset progress¦進行をリセット
직접 해낸 결과가 내 개발 기록에 남았어요.¦Your achievement is now in your journal.¦達成したことがノートに残りました。
보상 지급 완료 · 배지는 성취 창에서 확인할 수 있어요.¦Reward received · See your badge in Achievements.¦報酬受取済み・実績画面でバッジを確認できます。
이야기 계속하기¦Continue story¦物語を続ける
작업실로 돌아가기¦Back to desktop¦デスクトップへ戻る
새 작업실에서 다시 시작할까요?¦Start over in a new workspace?¦新しい作業室でやり直しますか？
이 브라우저에 저장된 코드, 의뢰 진행, 크레딧과 배지가 초기화됩니다.¦This resets the code, progress, credits and badges in this browser.¦このブラウザーのコード、進行、クレジット、バッジがリセットされます。
취소¦Cancel¦キャンセル
새 이야기가 준비됐어요.¦Your new story is ready.¦新しい物語を始められます。
초기화하고 다시 시작¦Reset and restart¦リセットして再開
언어 / Language / 言語¦Language / 언어 / 言語¦言語 / 언어 / Language
언어를 바꿔도 의뢰와 코드는 유지됩니다.¦Changing language keeps your progress and code.¦言語を変えても進行とコードは保持されます。
의뢰서 /¦Request /¦依頼書 /
온라인 오픈 준비¦Online opening preparations¦オンライン開店の準備
완료 조건¦Requirements¦完了条件
배지¦badge¦バッジ
수리 화면 열기¦Open repairs¦修理画面を開く
나의 해결사 수첩¦My journal¦自分の解決ノート
오픈까지 남은 일¦Before we open¦オープンまでにすること
모노 카페의 세 의뢰를 해결하고 오픈까지 함께해 주세요.¦Complete three requests and help Mono Cafe open.¦三つの依頼を解決し、モノカフェのオープンを手伝いましょう。
경험치¦Experience¦経験値
크레딧¦Credits¦クレジット
이야기를 이어가며 발견해 보세요.¦Discover this in the next chapter.¦物語を進めて発見しましょう。
아직 미완료¦Not complete¦未完了
이야기 이어 하기¦Continue story¦物語を続ける
완성한 카페 둘러보기¦Visit the finished cafe¦完成したカフェを見る
메뉴 가져오기¦Get menu¦メニューを取得
주문 보내기¦Send order¦注文を送る
메서드는 행동,¦The method is the action;¦メソッドは動作、
주소는 대상을 나타내요.¦the address is the destination.¦アドレスは送信先です。
API 문서 읽기¦Read API guide¦APIガイドを読む
메뉴와 주문 요청 보내기¦Send menu and order requests¦メニューと注文のリクエスト
가상 서버의 실행 상태와 코드가 응답을 결정해요.¦The virtual server's code and running state determine its response.¦仮想サーバーのコードと状態が応答を決めます。
HTTP 메서드¦HTTP method¦HTTPメソッド
API 요청 주소¦API request address¦APIリクエストのアドレス
전송¦Send¦送信
요청 본문¦Request body¦リクエスト本文
JSON 요청 본문¦JSON request body¦JSONリクエスト本文
GET 요청에는 본문이 필요하지 않아요.¦GET requests don't need a body.¦GETリクエストに本文は不要です。
응답¦Response¦応答
서버 주문 기록¦Server order log¦サーバーの注文記録
연결 실패¦Connection failed¦接続失敗
주소를 확인하고 첫 요청을 보내 보세요.¦Check the address and send a request.¦アドレスを確認してリクエストを送ってみましょう。
mono-server의 메모리에 보관된 주문입니다. Python 프로세스를 재시작하면 비워집니다.¦Orders stored in mono-server memory. Restarting Python clears them.¦mono-serverのメモリーに保存した注文です。Pythonを再起動すると消去されます。
메뉴¦Menu¦メニュー
수량¦Quantity¦数量
보관된 주문이 없어요. SAVE_ORDERS 설정을 확인해 보세요.¦No stored orders. Check SAVE_ORDERS.¦保存された注文がありません。SAVE_ORDERSを確認してください。
카페 서버¦Cafe server¦カフェのサーバー
내 PC와 다른 컴퓨터입니다. 필요한 도구도 따로 준비해야 해요.¦This is a separate computer. Install its tools separately.¦自分のPCとは別のコンピューターです。必要なツールも別に用意します。
운영체제 없음¦No operating system¦OSなし
가상 서버 준비됨¦Virtual server ready¦仮想サーバー準備完了
세 번째 의뢰에서 지급¦Available in chapter three¦第3章で使用可能
설치 준비¦Ready to install¦インストールの準備
메모리¦Memory¦メモリー
스토리지¦Storage¦ストレージ
호스트¦Host¦ホスト
게임 안의 가상 사양입니다.¦Simulated specifications for the game.¦ゲーム内の仮想スペックです。
Ubuntu 설치¦Install Ubuntu¦Ubuntuをインストール
터미널 접속¦Connect terminal¦ターミナル接続
서비스 상태¦Service status¦サービスの状態
실행 중¦Running¦実行中
중지됨¦Stopped¦停止中
설치된 도구¦Installed tools¦インストールしたツール
설치됨¦Installed¦インストール済み
미설치¦Not installed¦未インストール
설치부터 실행까지 문서 읽기¦Read setup and startup guide¦準備から起動までのガイド
서비스 로그¦Service logs¦サービスログ
가상 컴퓨터의 실행과 요청 기록¦Virtual computer activity and requests¦仮想コンピューターの実行・リクエスト記録
지우의 메시지 열기¦Open Jiwoo's message¦ジウのメッセージを開く
다음 의뢰 받기¦Get next request¦次の依頼を受ける
손님 테스트 시작¦Start customer test¦お客さんテストを開始
지우에게 전달하기¦Deliver to Jiwoo¦ジウに届ける
첫 의뢰 시작¦Start first request¦最初の依頼を始める
수리 화면에서 해보기¦Go to repairs¦修理画面で試す
현재 퀘스트¦Current quest¦現在のクエスト
퀘스트 상세 접기¦Collapse quest details¦クエスト詳細を閉じる
이야기¦Chapter¦物語
완료한 단계¦Steps completed¦完了した手順
지금 할 일¦Current task¦今すること
다음 행동¦Next action¦次の操作
동네 해결사 엔딩 달성!¦Neighborhood Helper ending reached!¦街の助っ人エンディング達成！
오픈 행사에 초대받았어요!¦You're invited to the opening!¦オープンに招待されました！
의뢰 해결!¦Request complete!¦依頼を解決！
손님들이 시험 중…¦Customers are testing…¦お客さんがテスト中…
한 단계씩 해보세요.¦Take it one step at a time.¦一つずつ進めましょう。
틀려도 언제든 다시 고칠 수 있어요.¦You can always change your choices.¦間違えても、いつでも直せます。
현재 목표로 돌아가기¦Return to current task¦今の目標へ戻る
지금 할 일 ·¦Current task ·¦今すること ·
의뢰 해결! 다음 이야기로¦Request complete! Next chapter¦依頼解決！次の物語へ
엔딩 달성 · 동네 해결사¦Ending reached · Neighborhood Helper¦エンディング達成・街の助っ人
마지막 할 일 · OPEN 간판 켜기¦Final task · Light the OPEN sign¦最後の作業・OPENの看板をつける
모노 카페 · 첫 번째 이야기¦Mono Cafe · Chapter one¦モノカフェ・最初の物語
오늘부터, 동네 해결사.¦Your first day as a helper.¦今日から、街の助っ人。
카페 사장 지우에게 도움이 필요해요.¦Jiwoo, the cafe owner, needs your help.¦カフェの店主ジウが助けを待っています。
코드는 몰라도 괜찮아요. 보고, 고르고, 시험해 보세요.¦No coding knowledge needed. Look, choose and try.¦コードを知らなくても大丈夫。見て、選んで、試しましょう。
시간 제한 없이 · 틀려도 다시 도전 · 자동 저장¦No time limit · Try again anytime · Autosave¦時間制限なし・何度でも挑戦・自動保存
모노 카페 / 이야기¦Mono Cafe / Chapter¦モノカフェ / 物語
이야기 진행¦Chapter progress¦物語の進行
모노 카페 사장¦Mono Cafe owner¦モノカフェの店主
의뢰 해결¦Request complete¦依頼解決
배지 · 보상 지급 완료¦badge · Reward received¦バッジ・報酬受取済み
다음 이야기:¦Next chapter:¦次の物語：
카페 오픈 행사로 가기¦Go to the cafe opening¦カフェのオープンへ
잠깐 쉬며 작업실 꾸미기¦Take a break and customize¦休憩して模様替え
수리 방법 고르기¦Choose a repair¦修理方法を選ぶ
01. 어떤 간판을 달까요?¦01. Which sign belongs here?¦01. どの看板にしますか？
달빛 빵집¦Moonlight Bakery¦月明かりベーカリー
빵 냄새가 나는 이름¦A name for a bakery¦パン屋さんの名前
지우가 의뢰한 가게 이름¦The name of Jiwoo's cafe¦ジウが依頼したお店の名前
02. 메뉴판의 크기는?¦02. How wide should the menu be?¦02. メニューの幅は？
언제나 넓게¦Always wide¦いつも広く
큰 화면에 맞춘 고정 크기¦Fixed width for a large screen¦大きな画面に合わせた固定幅
화면에 맞추기¦Fit the screen¦画面に合わせる
작은 화면에서는 함께 작아져요¦Shrinks with a smaller screen¦小さな画面では一緒に小さくなります
아주 작게¦Very narrow¦とても狭く
어떤 화면에서도 좁게 유지해요¦Stays narrow on every screen¦どの画面でも狭いままです
한 잔 가격과 잔 수를 어떻게 계산할까요?¦How should price and cup count combine?¦1杯の価格と杯数をどう計算しますか？
가격에 잔 수 더하기¦Add cup count to price¦価格に杯数を足す
잔 수만큼 가격 반복하기¦Multiply price by cup count¦杯数の分だけ価格を繰り返す
가격에서 잔 수 빼기¦Subtract cup count from price¦価格から杯数を引く
01. 손님의 메뉴 요청은 어디로?¦01. Where does the menu request go?¦01. メニューのリクエスト先は？
예전 메뉴판¦Old menu address¦以前のメニュー
주소: /menu¦Address: /menu¦アドレス：/menu
손님 앱의 메뉴판¦Customer app menu¦お客さんのアプリのメニュー
주소: /api/menu¦Address: /api/menu¦アドレス：/api/menu
02. 도착한 주문서는 어떻게?¦02. What happens to incoming orders?¦02. 届いた注文はどうしますか？
확인만 하고 넘기기¦Acknowledge and discard¦確認して流す
받았다는 응답만 보내요¦Only reply that it arrived¦受け取ったと返信するだけ
카운터에 보관하기¦Keep at the counter¦カウンターに保存
주문 내역에 남겨 두어요¦Save it in the order log¦注文履歴に残します
힌트 접기¦Hide hint¦ヒントを閉じる
민서에게 힌트 받기¦Ask Minseo for a hint¦ミンソにヒントを聞く
불이익 없음¦No penalty¦ペナルティなし
손님의 휴대폰¦Customer's phone¦お客さんのスマホ
계산대에서 직접 주문해 보기¦Try an order at the register¦レジで注文を試す
주문 배달 경로¦Order delivery route¦注文が届く道すじ
선택하면 바로 바뀌어요¦Changes as you choose¦選ぶとすぐ変わります
수리 중인 카페 메뉴판¦Cafe menu under repair¦修理中のカフェメニュー
아메리카노 · 4,500원¦Americano · 4,500 KRW¦アメリカーノ・4,500ウォン
카페 라테 · 5,000원¦Cafe latte · 5,000 KRW¦カフェラテ・5,000ウォン
바닐라 라테 · 5,500원¦Vanilla latte · 5,500 KRW¦バニララテ・5,500ウォン
한 잔 빼기¦Remove one cup¦1杯減らす
잔¦cups¦杯
한 잔 더하기¦Add one cup¦1杯増やす
계산대에 표시된 금액¦Amount shown on the register¦レジに表示された金額
계산 불가¦Cannot calculate¦計算できません
이 주문은 정확해요. 다른 잔 수도 시험해 볼까요?¦This order is correct. Try another cup count.¦この注文は正確です。別の杯数も試しましょう。
손님의 앱¦Customer app¦お客さんのアプリ
메뉴 요청: /api/menu¦Menu request: /api/menu¦メニューのリクエスト：/api/menu
↓ 길이 연결됐어요¦↓ Connected¦↓ つながりました
× 주소가 서로 달라요¦× Addresses don't match¦× アドレスが違います
카페 메뉴판¦Cafe menu¦カフェのメニュー
주소를 읽을 수 없어요¦Cannot read address¦アドレスを読めません
↓ 주문을 기록해요¦↓ Saving orders¦↓ 注文を記録します
× 주문이 남지 않아요¦× Orders are discarded¦× 注文が残りません
카운터의 주문함¦Counter order tray¦カウンターの注文箱
손님 테스트에서 배달을 확인해요¦Run the customer test to check delivery¦お客さんテストで届くか確認します
손님 테스트 통과!¦Customer test passed!¦お客さんテスト合格！
손님이 써 보면 어떨까요?¦Ready for a customer to try it?¦お客さんに使ってもらいましょう
수리한 결과를 지우에게 전달하면 의뢰가 끝나요.¦Deliver your repairs to Jiwoo to finish this request.¦修理の結果をジウに届けると依頼完了です。
아직 불편한 점이 있어요. 선택을 바꾸고 다시 시험해 보세요.¦Something still needs work. Change your choices and test again.¦まだ直すところがあります。選び直してテストしましょう。
방법을 고른 뒤 시험해 보세요. 실패해도 잃는 것은 없어요.¦Choose a method and test it. A failed test costs nothing.¦方法を選んでテストしましょう。失敗しても何も失いません。
가게 이름을 찾았어요¦Cafe name found¦お店の名前を確認
휴대폰에서 메뉴가 다 보여요¦Menu fits a phone¦スマホでメニューが見える
큰 화면에서도 메뉴가 잘 보여요¦Menu fits a large screen¦大きな画面でも見える
세 잔 주문¦Three cups¦3杯の注文
다른 메뉴 두 잔¦Two cups of another drink¦別のメニューを2杯
주문을 취소하면 0원¦Zero cups costs zero¦キャンセルすると0ウォン
한 잔 주문¦One cup¦1杯の注文
메뉴판에 도착했어요¦Menu reached¦メニューに到着
주문을 보냈어요¦Order sent¦注文を送信
카운터에 주문이 남았어요¦Order kept at the counter¦カウンターに注文が残る
성공¦Success¦成功
간판과 메뉴판 크기를 다시 살펴봐요.¦Check the sign and menu width again.¦看板とメニューの幅を見直しましょう。
주소와 주문 보관 방법을 다시 살펴봐요.¦Check the address and order storage.¦アドレスと注文の保存方法を見直しましょう。
민서의 원리 노트 · 더 궁금할 때¦Minseo's notes · How it works¦ミンソのノート・仕組みを知る
AI_6스터디:¦AI_6 Study:¦AI_6スタディ：
코드 접기¦Hide code¦コードを閉じる
내 선택이 어떤 코드가 됐을까?¦What code did my choice create?¦選択がどんなコードになった？
직접 입력할 필요는 없어요. 선택한 방법이 아래 규칙으로 바뀌었어요.¦No typing needed. Your choices became these rules.¦入力は不要です。選んだ方法がこのルールになりました。
직접 편집해 보기¦Try editing the code¦自分で編集してみる
코드 자동완성 후보¦Code completions¦コード補完候補
터미널 출력¦Terminal output¦ターミナル出力
실제 컴퓨터에는 영향을 주지 않아요.¦This terminal only affects the game.¦実際のコンピューターには影響しません。
로 명령어를 확인하세요.¦lists the available commands.¦でコマンドを確認できます。
명령어 자동완성 후보¦Command completions¦コマンド補完候補
명령어 입력 · Tab으로 완성¦Type a command · Tab to complete¦コマンド入力・Tabで補完
가상 터미널 명령어¦Virtual terminal command¦仮想ターミナルのコマンド
자동완성 (Tab)¦Complete (Tab)¦自動補完（Tab）
명령어 자동완성¦Complete command¦コマンドを補完
명령 실행¦Run command¦コマンドを実行
↑↓ 기록 · Tab 완성 · Ctrl+L 정리 · Shift+Tab 이동¦↑↓ history · Tab complete · Ctrl+L clear · Shift+Tab focus¦↑↓履歴・Tab補完・Ctrl+L消去・Shift+Tab移動
모노 카페의 온라인 오픈을 완성하세요.¦Get Mono Cafe ready for online orders.¦モノカフェのオンライン開店を完成させましょう。
작은 카페의 큰 첫날¦A cafe's first day¦カフェの最初の一日
“우리 카페인데 이름이 달라요. 휴대폰에서는 메뉴가 밖으로 삐져나와요!”¦“The cafe name is wrong, and the menu overflows on my phone!”¦「うちのカフェなのに名前が違います。スマホだとメニューがはみ出してしまって！」
간판을 달고, 휴대폰 안에 메뉴를 담아 주세요.¦Fix the sign and fit the menu onto a phone screen.¦看板を直し、スマホの画面にメニューを収めましょう。
간판에는 의뢰인의 카페 이름을 써요. 메뉴판은 고정된 크기보다 화면에 맞춰 늘고 줄면 좋겠죠?¦Use the cafe's name. A menu should shrink or grow with the screen, rather than stay one fixed size.¦看板には依頼人のカフェ名を。メニューは固定幅より画面に合わせて伸び縮みすると便利ですね。
이제 손님들이 휴대폰으로 메뉴를 볼 수 있어요!¦Customers can now read the menu on their phones!¦お客さんがスマホでメニューを見られるようになりました！
이름과 모양을 바꾸는 것도 코딩이에요. 방금 HTML과 CSS를 고쳤어요.¦Changing names and layouts is coding too. You just edited HTML and CSS.¦名前や見た目を変えるのもコーディング。今、HTMLとCSSを直しました。
휴대폰 메뉴판¦Phone menu¦スマホのメニュー
메뉴판 준비¦Menu ready¦メニュー準備
수상한 계산대¦The strange register¦おかしなレジ
“커피 세 잔인데 4,503원? 손님도 저도 고개를 갸웃했어요.”¦“Three coffees for 4,503 won? That can't be right.”¦「コーヒー3杯で4,503ウォン？お客さんも私も首をかしげました。」
몇 잔을 골라도 가격이 맞는 계산대를 만들어 주세요.¦Make the register total any number of cups correctly.¦何杯選んでも正しく計算するレジにしましょう。
4,500원짜리 세 잔은 4,500 + 4,500 + 4,500원이에요. 잔 수만큼 가격을 반복하는 방법은 무엇일까요?¦Three cups at 4,500 won means 4,500 + 4,500 + 4,500. Which operation repeats the price for every cup?¦4,500ウォンの3杯は4,500＋4,500＋4,500。杯数の分だけ価格を繰り返す計算は？
세 잔은 13,500원! 계산대가 정확해졌어요.¦Three cups: 13,500 won! The register is fixed.¦3杯で13,500ウォン！レジが正確になりました。
컴퓨터에게 계산 규칙을 알려줬어요. 이 규칙을 함수라고 불러요.¦You gave the computer a calculation rule. We call this a function.¦コンピューターに計算のルールを教えました。このルールを関数と呼びます。
정확한 계산대¦Accurate register¦正確なレジ
계산대 준비¦Register ready¦レジ準備
사라진 주문을 찾아서¦The missing orders¦消えた注文を探して
“손님은 주문했다는데 카운터에 아무것도 안 와요. 주문서가 어디로 간 걸까요?”¦“Customers placed orders, but nothing reached the counter. Where did the orders go?”¦「お客さんは注文したのに、カウンターに届きません。どこに行ったのでしょう？」
메뉴판으로 길을 연결하고, 도착한 주문서를 보관해 주세요.¦Connect the menu route and keep incoming orders.¦メニューへの道をつなぎ、届いた注文を保存しましょう。
손님 앱의 목적지는 /api/menu예요. 주소를 같게 맞추고 주문서를 보관해야 카운터에서 볼 수 있어요.¦The app requests /api/menu. Match that address and keep the orders so the counter can see them.¦アプリの行き先は/api/menu。アドレスを合わせ、注文を保存するとカウンターで確認できます。
카운터에 주문이 도착했어요. 오픈 준비 완료!¦The order reached the counter. Ready to open!¦カウンターに注文が届きました。オープン準備完了！
서로 다른 컴퓨터가 요청과 응답을 주고받았어요. 이것이 API예요.¦Two computers exchanged a request and a response. That's an API.¦別々のコンピューターがリクエストと応答を交換しました。これがAPIです。
온라인 주문함¦Online orders¦オンライン注文
주문함 준비¦Orders ready¦注文準備
미드나잇 민트¦Midnight Mint¦ミッドナイトミント
첫 작업실의 차분한 초록빛¦The original green desktop¦最初の作業室の落ち着いた緑
골든 아워¦Golden Hour¦ゴールデンアワー
야근도 따뜻하게, 노을빛 작업실¦A warm amber desktop¦夕焼け色の作業室
네온 라일락¦Neon Lilac¦ネオンライラック
나만의 리듬으로, 보랏빛 작업실¦A soft violet desktop¦紫色の作業室
햇살 앰버¦Sunlit Amber¦サンライトアンバー
오션 블루¦Ocean Blue¦オーシャンブルー
우리 카페의 첫 홈페이지를 부탁해요.¦Our cafe needs its first website.¦カフェの最初のホームページをお願いします。
안녕하세요, 골목의 모노 카페 사장 지우예요. 손님이 줄어서 온라인 주문을 시작해 보려고 해요. 메뉴판, 계산대, 주문함까지 준비되면 함께 OPEN 간판을 켜요! 우선 첫 번째 부탁이에요. 카페 이름이 틀리고 휴대폰에서 메뉴가 삐져나와요. 보기 좋게 고쳐 주실래요? 보상은 350 cr예요. 코드를 몰라도 민서와 함께 고를 수 있어요.¦Hi, I'm Jiwoo from Mono Cafe. Business has been slow, so I want to try online orders. Once the menu, register and orders are ready, we'll open together! First, the cafe name is wrong and the menu overflows on phones. Could you fix it? The reward is 350 cr. No coding knowledge needed—Minseo will help you choose.¦こんにちは、モノカフェのジウです。お客さんが減ったので、オンライン注文を始めたいんです。メニュー、レジ、注文の準備ができたら、一緒にOPENの看板をつけましょう！最初のお願いです。カフェ名が違い、スマホでメニューがはみ出します。直してくれませんか？報酬は350 cr。コードを知らなくてもミンソと一緒に選べます。
옆자리 개발자¦Your developer neighbor¦隣の開発者
막혀도 괜찮아. 네 작업실이니까.¦Stuck? We can work it out.¦困っても大丈夫。一緒に考えよう。
오류가 떠도 의뢰가 날아가지는 않아. 내용을 읽고 한 단계씩 해결해 보자. 여유가 생기면 보너스 과제도 해봐! 프로젝트를 탐색하고 버튼 색을 바꾸면 추가 크레딧과 배지를 받을 수 있어.¦An error won't cancel your request. Read it and fix one thing at a time. When you want a break, explore the project or change the button color for bonus credits and badges.¦エラーが出ても依頼はなくならないよ。読んで、一つずつ直そう。余裕ができたらプロジェクトの探索やボタンの色変更で追加クレジットとバッジももらえるよ。
프로젝트 도착! 안에 뭐가 들었을까?¦Project received! What's inside?¦プロジェクト到着！中には何が？
파일을 가져왔네! 프로젝트 폴더에서 pwd로 위치를 확인하고, ls로 목록을 보고, cat README.md로 안내를 읽어 봐. 세 가지를 모두 해보면 터미널 탐험가 배지를 받을 수 있어.¦You've got the files! In the project folder, use pwd for your location, ls for files and cat README.md for the guide. Try all three for the Terminal Explorer badge.¦ファイルが届いたね！フォルダーでpwdで現在地、lsで一覧、cat README.mdで説明を読もう。三つとも試すとターミナル探検家バッジがもらえるよ。
휴대폰으로도 메뉴가 잘 보이면 좋겠어요.¦The menu should work on phones too.¦スマホでもメニューが見やすいと嬉しいです。
메뉴 세 가지와 주문 버튼이 화면 안에 모두 보이면 돼요. 그롬에서 PC와 360px 화면을 번갈아 확인해 주세요. 직접 바꾼 코드가 화면으로 나타나는 게 신기하네요!¦All three drinks and their order buttons should fit. Check desktop and 360px views in Grome. Your code changes the page!¦三つのメニューと注文ボタンが画面に収まれば大丈夫。GromeでPCと360pxを確認してください。変えたコードが画面になるんですね！
첫 손님에게 홈페이지를 보여드렸어요!¦Our first customer saw the website!¦最初のお客さんにページを見せました！
이제 모노 카페 이름도 보이고 휴대폰으로 메뉴도 잘 읽혀요. 정말 고마워요! 약속한 350 cr를 보냈어요. 첫 배포 배지도 잘 받으셨죠? 다음에 또 함께 일해요.¦The name is right and the menu reads well on phones. Thank you! I've sent 350 cr and your First Release badge. Let's work together again.¦名前も直り、スマホでも読みやすくなりました。ありがとう！350 crと初リリースバッジを送りました。また一緒にお願いします。
새 계산대가 조금 이상해요.¦The new register seems wrong.¦新しいレジが少し変なんです。
홈페이지가 생겨서 손님이 늘었어요! 새 계산대를 연결했는데 커피 세 잔이 4,503원으로 보여요. 계산 방법을 함께 살펴봐 주실래요?¦The website brought more customers! But our new register shows 4,503 won for three coffees. Could you look at its calculation?¦ページのおかげでお客さんが増えました！でも新しいレジだと3杯で4,503ウォンになります。計算方法を見てもらえますか？
이제 잔돈까지 딱 맞아요!¦Now the totals are right!¦これで計算がぴったりです！
커피를 몇 잔 주문해도 금액이 정확해요. 약속한 500 cr를 보냈어요. 마지막으로 밖에서도 주문할 수 있으면 카페를 정식 오픈할 수 있겠어요.¦Every cup count totals correctly now. I've sent 500 cr. If we can accept orders from outside, we're ready for our grand opening.¦何杯でも正しく計算できました。500 crを送りました。あとは外から注文できれば正式オープンできます。
주문서는 어디로 갔을까?¦Where did the orders go?¦注文はどこへ？
손님 앱의 메뉴 주소와 카페 쪽 주소가 같은지 살펴봐. 그다음 주문서를 보관하도록 해보자. 손님 테스트에서 실제로 주문 한 건을 보내 볼 거야.¦Check that the customer app and cafe use the same menu address. Then keep the orders. The customer test will send a real simulated order.¦アプリとカフェのメニューのアドレスが同じか見よう。それから注文を保存。テストではゲーム内で本当に注文を送るよ。
모노 카페, 오늘 정식 오픈해요!¦Mono Cafe officially opens today!¦モノカフェ、本日オープン！
휴대폰 메뉴판도, 계산도, 주문 배달도 잘 돼요. 처음부터 끝까지 함께해 줘서 고마워요. 카페 한쪽에 당신의 첫 배포 배지를 걸어 둘게요. 우리 동네 해결사님, 커피 마시러 오세요!¦The phone menu, register and orders all work. Thank you for helping from start to finish. Your First Release badge will hang in our cafe. Come over for a coffee, neighborhood helper!¦スマホのメニューも計算も注文も動いています。最初から最後までありがとう。初リリースバッジをお店に飾りますね。街の助っ人さん、コーヒーを飲みに来てください！
바꾼 뒤에는 결과를 확인해요¦Check the result after each change¦変えたら結果を確認
이름을 바꾸면 간판을 보고, 크기를 바꾸면 작은 화면에서 살펴봐요. 컴퓨터에게 일을 시킨 다음 결과를 확인하는 습관은 터미널에서도 같아요.¦After changing the name, look at the sign. After changing width, check a small screen. The same habit helps when using terminal commands: run, then check.¦名前を変えたら看板を、幅を変えたら小さな画面を確認。ターミナルでも、実行したあとに結果を見る習慣は同じです。
리눅스 기초 실습¦Linux basics (Korean blog)¦Linux基礎実習（韓国語ブログ）
가격과 잔 수는 값의 이름표예요¦Price and quantity are labels for values¦価格と杯数は値の名札
price는 한 잔 가격, quantity는 잔 수에 붙인 이름이에요. 이런 이름표가 변수예요. 두 수를 곱하는 규칙을 정하면 어떤 메뉴와 잔 수에도 쓸 수 있어요. 블로그의 예제 언어는 Python이고, 이 계산대는 JavaScript로 같은 원리를 써요.¦price names the cost per cup; quantity names the cup count. These labels are variables. Multiplying them works for any drink or quantity. The blog uses Python; this register uses the same idea in JavaScript.¦priceは1杯の価格、quantityは杯数の名前。この名札が変数です。二つを掛けるルールはどのメニューにも使えます。ブログはPython、レジはJavaScriptで同じ原理を使います。
파이썬 기초 · 변수와 연산자¦Python variables and operators (Korean blog)¦Python基礎・変数と演算子（韓国語ブログ）
손님은 요청하고 카페는 응답해요¦The customer requests; the cafe responds¦お客さんが要求し、カフェが応答
메뉴를 보여 달라는 요청은 GET, 새 주문을 보내는 요청은 POST예요. 받는 주소가 맞아야 요청이 도착하고, 주문을 보관해야 나중에 다시 볼 수 있어요.¦GET asks to see the menu. POST sends a new order. The address must match for a request to arrive, and orders must be saved to view them later.¦メニューを見せてほしい要求はGET、新しい注文を送るのはPOST。正しいアドレスに送り、注文を保存すればあとで確認できます。
네트워크 개론 · HTTP¦Network basics and HTTP (Korean blog)¦ネットワーク基礎・HTTP（韓国語ブログ）
바탕화면에서 지우의 메시지 열기¦Open Jiwoo's message on the desktop¦デスクトップでジウのメッセージを開く
지우의 첫 의뢰 시작하기¦Start Jiwoo's first request¦ジウの最初の依頼を始める
모노 카페 간판 달기¦Put up the Mono Cafe sign¦モノカフェの看板をつける
휴대폰에 메뉴판 크기 맞추기¦Fit the menu to a phone¦スマホにメニューを合わせる
몇 잔이든 맞는 계산 방법 고르기¦Choose a rule that works for any cup count¦何杯でも正しい計算方法を選ぶ
손님 앱과 메뉴판 주소 연결하기¦Connect the app to the menu address¦アプリとメニューのアドレスをつなぐ
주문서를 카운터에 보관하기¦Keep orders at the counter¦カウンターに注文を保存
손님 테스트 통과하기¦Pass the customer test¦お客さんテストに合格
지우에게 결과 전달하기¦Deliver the result to Jiwoo¦ジウに結果を届ける
첫 배포¦First Release¦初リリース
버그 헌터¦Bug Hunter¦バグハンター
풀스택 입문¦Full Stack Beginner¦フルスタック入門
수리 도구가 준비됐어요. 이제 어떤 방법이 좋을지 골라 보세요.¦Tools are ready. Choose how to repair it.¦道具の準備ができました。修理方法を選びましょう。
손님 테스트를 모두 통과하면 전달할 수 있어요.¦Pass all customer checks before delivering.¦すべてのテストに合格すると届けられます。
의뢰 완료! 보상과 배지가 지급되었습니다.¦Request complete! Credits and badge awarded.¦依頼完了！報酬とバッジを獲得しました。
모노 카페, 정식 오픈! 동네 해결사 배지를 받았어요.¦Mono Cafe is open! Neighborhood Helper badge earned.¦モノカフェオープン！街の助っ人バッジを獲得しました。
검사를 통과했어요. 변경을 커밋하고 CatHub로 보내세요.¦Checks passed. Deliver the repair or commit and push to CatHub.¦確認に合格。修理を届けるか、コミットしてCatHubへ送りましょう。
화면 검사를 통과했어요.¦Checks passed.¦確認に合格しました。
아직 해결할 항목이 있어요. 검사 결과를 확인해 보세요.¦Some checks failed. Review the results.¦未解決の項目があります。結果を確認しましょう。
이미 완료한 의뢰예요. 보너스 과제도 도전해 보세요.¦This request is already complete. Try a bonus task.¦この依頼は完了済みです。ボーナスにも挑戦できます。
메뉴 요청 GET 200¦Menu request GET 200¦メニュー取得 GET 200
주문 요청 POST 201¦Order request POST 201¦注文送信 POST 201
주문 보관¦Order storage¦注文の保存
`;
const additional=String.raw`
우리 동네 카페¦Our neighborhood cafe¦街のカフェ
오늘도 당신의 속도로. 모노에서 잠깐 쉬어 가세요.¦Coffee and a quiet break at Mono Cafe.¦モノカフェでコーヒーとひと休み。
아메리카노¦Americano¦アメリカーノ
카페 라테¦Cafe latte¦カフェラテ
바닐라 라테¦Vanilla latte¦バニララテ
고소하고 깔끔한 매일의 커피¦A smooth, clean everyday coffee¦香ばしくすっきりとしたコーヒー
부드러운 우유와 진한 에스프레소¦Soft milk and rich espresso¦まろやかなミルクと濃いエスプレッソ
달콤한 바닐라가 필요한 오후¦Espresso with sweet vanilla¦甘いバニラ入りのコーヒー
담기¦Add¦追加
서버 온라인¦Server Online¦サーバー開通
지우 · 모노 카페¦Jiwoo · Mono Cafe¦ジウ・モノカフェ
내 첫 홈페이지¦My first website¦初めてのホームページ
카페 이름을 넣고 화면을 맞춰 주세요¦Fix the cafe name and layout¦カフェ名と画面サイズを直してください
커피 3잔이 4,503원이래요¦Three coffees cost 4,503 won?¦コーヒー3杯で4,503ウォン？
새 주문 API를 열어 주세요¦Open the order API¦注文APIを使えるようにしてください
큰 제목에 모노 카페 표시¦Show Mono Cafe in the heading¦見出しにモノカフェを表示
360px에서 메뉴를 숨김 없이 표시¦Show all menu items at 360px¦360pxでメニューを隠さず表示
PC에서도 메뉴 3개 표시¦Show all three items on desktop¦PCでも三つのメニューを表示
4,500원 × 3잔 = 13,500원¦4,500 KRW × 3 cups = 13,500 KRW¦4,500ウォン × 3杯 = 13,500ウォン
5,000원 × 2잔 = 10,000원¦5,000 KRW × 2 cups = 10,000 KRW¦5,000ウォン × 2杯 = 10,000ウォン
0잔 주문 = 0원¦0 cups = 0 KRW¦0杯 = 0ウォン
1잔 주문 = 메뉴 가격¦1 cup = menu price¦1杯 = メニューの価格
서버의 GET /api/menu → 200¦Server GET /api/menu → 200¦サーバーのGET /api/menu → 200
주문 기록에 요청 데이터 보관¦Store request data in the order log¦注文履歴にリクエストを保存
HTML의 큰 제목에 카페 이름이 표시돼요.¦The cafe name is visible in the heading.¦見出しにカフェ名が表示されています。
index.html의 h1 태그 사이에 모노 카페를 넣어 주세요.¦Put 모노 카페 between the h1 tags in index.html.¦index.htmlのh1タグの間に모노 카페を入れてください。
PC에서 세 메뉴가 같은 줄에 있습니다.¦All three menu items share one row on desktop.¦PCで三つのメニューが同じ行にあります。
PC에서는 메뉴를 세 열로 유지해 주세요.¦Keep three menu columns on desktop.¦PCではメニューを3列にしてください。
선택한 버튼 색상¦Selected button color¦選択したボタンの色
모든 주문 버튼의 실제 배경색을 확인합니다.¦Checks the actual background of all order buttons.¦すべての注文ボタンの背景色を確認します。
의뢰를 해결했어요!¦Request complete!¦依頼を解決しました！
수리 화면에서 다음 문제를 해결해요¦Continue in the repair window¦修理画面で次の問題を解決
잔 수에 따라 금액이 어떻게 달라지는지 시험해 보세요.¦Try different cup counts and watch the total.¦杯数を変えて金額を確かめましょう。
메뉴 주소를 연결하고 주문을 보관해 주세요.¦Connect the menu address and keep orders.¦メニューのアドレスをつなぎ、注文を保存しましょう。
수리 화면으로¦Go to repairs¦修理画面へ
명령어 넣기¦Insert command¦コマンドを入力
첫 사이트를 공개했어요!¦Your first site is live!¦最初のサイトを公開しました！
HTML 제목과 CSS 너비를 바꾸고, 변경 기록을 남겨 배포까지 마쳤어요.¦You fixed HTML and CSS, recorded the changes and released the site.¦HTMLとCSSを直し、変更を記録して公開しました。
내 결과 보기¦View my results¦結果を見る
카페의 첫 의뢰를 받아 볼까요?¦Ready for the cafe's first request?¦カフェの最初の依頼を受けますか？
오늘은 제목 한 줄과 너비 한 줄을 고쳐요. 설치와 명령어는 전부 게임 안에서만 작동해요.¦Fix a title and a width. All commands and installations stay inside the game.¦タイトルと幅を直します。インストールとコマンドはゲーム内だけで動きます。
입문 데모 시작¦Start the request¦依頼を始める
COOCLE에서 프로젝트 찾기¦Find the project on COOCLE¦COOCLEでプロジェクトを探す
검색창에 mono cafe를 입력하고, 검색 결과의 CatHub 저장소를 열어 보세요.¦Search for mono cafe and open the CatHub result.¦mono cafeを検索し、CatHubの結果を開きましょう。
프로젝트를 내 작업실로 가져오기¦Bring the project to your workspace¦作業室にプロジェクトを取得
설치할 도구 목록 확인하기¦Refresh the tool list¦ツールの一覧を更新
Node.js와 npm 준비하기¦Prepare Node.js and npm¦Node.jsとnpmを用意
프로젝트에 필요한 도구 준비하기¦Install project dependencies¦プロジェクトに必要なツールを準備
다른 폴더의 서버 종료하기¦Stop the other server¦別のサーバーを停止
미리보기 서버 켜기¦Start the preview server¦プレビューサーバーを起動
① HTML의 큰 제목 바꾸기¦1. Change the HTML heading¦1. HTMLの見出しを変更
제목 고치러 가기¦Edit the heading¦見出しを直す
② CSS 너비를 고치고 검사하기¦2. Fix the CSS width and test¦2. CSSの幅を直して確認
에디터의 style.css에서 width: 960px을 width: 100%로 바꾸세요. 저장은 자동이에요.¦In style.css, change width: 960px to width: 100%. It saves automatically.¦style.cssのwidth: 960pxをwidth: 100%に変更。自動保存されます。
수정한 파일을 기록할 준비하기¦Stage your changed files¦変更したファイルを記録する準備
첫 커밋 남기기¦Create your first commit¦最初のコミットを作る
CatHub로 내 기록 보내기¦Send your commit to CatHub¦CatHubへコミットを送る
마지막으로 사이트 배포하기¦Release the site¦サイトを公開
승인된 변경을 병합하기¦Merge approved changes¦承認済みの変更をマージ
CatHub에서 검토받기¦Request a CatHub review¦CatHubで確認してもらう
CatHub 검토 열기¦Open CatHub review¦CatHubの確認画面を開く
민서에게 물어보기¦Ask Minseo¦ミンソに聞く
모노 카페 이야기 · 0.4¦Mono Cafe story · 0.4¦モノカフェの物語 · 0.4
타이틀로 돌아가기¦Return to title¦タイトルへ戻る
타이틀 화면¦Title screen¦タイトル画面
모노 카페 이야기¦The Mono Cafe story¦モノカフェの物語
다시 문을¦The day we¦もう一度、
여는 날.¦open again.¦お店を開く日。
골목의 작은 카페에서 메시지가 도착했다.¦A neighborhood cafe has sent you a message.¦路地の小さなカフェからメッセージが届いた。
내 컴퓨터로 할 수 있는 일이 있을까?¦What could you do with your computer?¦このパソコンで、何かできるだろうか。
이어하기¦Continue¦つづきから
시작하기¦Start¦はじめる
새로 시작¦New game¦最初から
/ 3 · 자동 저장된 이야기¦/ 3 · Saved story¦/ 3 · 保存された物語
마우스로 선택 · Tab / Enter로 조작¦Click to select · Tab / Enter to navigate¦クリックで選択 · Tab / Enterで操作
price는 한 잔 가격, quantity는 잔 수에 붙인 이름이에요. 이런 이름표가 변수예요. 두 수를 곱하는 규칙을 정하면 어떤 메뉴와 잔 수에도 쓸 수 있어요.¦price names the cost per cup, and quantity names the cup count. These labels are variables. Multiplying the two works for any drink and quantity.¦priceは1杯の価格、quantityは杯数の名前。この名札が変数です。二つを掛けるルールはどのメニューにも使えます。
`;
export const catalog:Record<string,[string,string]>=Object.fromEntries((rows+additional+beginnerRows).trim().split('\n').filter(Boolean).map(row=>{const [ko,en,ja]=row.split('¦');if(!ko||en===undefined||ja===undefined)throw new Error('Invalid translation: '+row);return [ko,[en,ja]];}));
export function translate(input:string,language:Language):string{
 if(language==='ko')return input;
 const index=language==='en'?0:1,key=input.trim().replace(/\s+/g,' ');
 const found=catalog[key]??catalog[input.trim()];
 if(found)return input.replace(input.trim(),found[index]);
 const patterns:[RegExp,(m:RegExpMatchArray)=>[string,string]][]=[
  [/^모노 카페\. (\d+)\/3 오픈 준비 완료\. (.+)$/,m=>[`Mono Cafe. ${m[1]}/3 ready. ${translate(m[2],'en')}`,`モノカフェ。${m[1]}/3準備完了。${translate(m[2],'ja')}`]],
  [/^화면 360px \/ 콘텐츠 (\d+)px · 메뉴 (\d+)개$/,m=>[`Screen 360px / content ${m[1]}px · ${m[2]} items`,`画面360px / 内容${m[1]}px・メニュー${m[2]}個`]],
  [/^([\d,]+)원$/,m=>[`${m[1]} KRW`,`${m[1]}ウォン`]],
  [/^손님이 기대한 금액은 ([\d,]+)원이에요\.$/,m=>[`The customer expects ${m[1]} KRW.`,`お客さんの予想は${m[1]}ウォンです。`]],
  [/^시험 주문 (\d+)건 도착$/,m=>[`${m[1]} test order(s) received`,`テスト注文${m[1]}件到着`]],
  [/^(\d+) cr · 크레딧 부족$/,m=>[`${m[1]} cr · Not enough credits`,`${m[1]} cr・クレジット不足`]],
  [/^(\d+) cr로 구입$/,m=>[`Buy for ${m[1]} cr`,`${m[1]} crで購入`]],
  [/^(.+) 달성!$/,m=>[`${translate(m[1],'en')} earned!`,`${translate(m[1],'ja')}達成！`]],
  [/^(.+) 창$/,m=>[`${translate(m[1],'en')} window`,`${translate(m[1],'ja')}ウィンドウ`]],
  [/^(.+) 코드 편집$/,m=>[`${m[1]} code editor`,`${m[1]}コードエディター`]],
 ];
 for(const [pattern,format] of patterns){const match=key.match(pattern);if(match)return format(match)[index];}
 return input;
}
