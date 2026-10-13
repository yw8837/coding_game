export const workflowRows=String.raw`
의뢰 읽기¦Read the request¦依頼を読む
작업 준비¦Prepare your tools¦作業の準備
문제 고치기¦Find and fix¦問題を直す
결과 확인¦Check the result¦結果を確認
의뢰 전달¦Deliver the work¦修正を届ける
내 PC로 돌아오기¦Return to your PC¦自分のPCに戻る
exit는 서버 접속을 끝내요. 수정한 파일은 내 PC에 있어요.¦exit ends the server connection. Your edited files are on your PC.¦exitでサーバーへの接続を終えます。編集したファイルは自分のPCにあります。
프로젝트 폴더로 이동¦Open the project folder¦プロジェクトのフォルダーへ移動
cd는 폴더를 여는 명령이에요. 아래 명령을 넣고 Enter를 누르세요.¦cd moves into a folder. Insert the command, then press Enter.¦cdはフォルダーに移動するコマンドです。コマンドを入れてEnterを押しましょう。
수정한 파일을 기록에 담기¦Stage the edited files¦修正したファイルを記録に入れる
git add .은 바꾼 파일을 다음 기록에 담아요. 아직 다른 사람에게 전달되지는 않아요.¦git add . selects changed files for the next record. It does not send them yet.¦git add .で変更したファイルを次の記録に入れます。まだ相手には届きません。
수정 내용을 기록하기¦Record your changes¦修正内容を記録する
commit은 지금의 파일을 한 묶음으로 기록해요. 따옴표 안에는 수정한 내용을 적을 수 있어요.¦commit records the files as a snapshot. The text in quotes describes your changes.¦commitは今のファイルをひとまとまりで記録します。引用符の中に変更内容を書けます。
CatHub에 수정본 보내기¦Send your changes to CatHub¦修正版をCatHubへ送る
push는 내 기록을 CatHub로 보내요. 전송 뒤 브라우저에서 검토할 수 있어요.¦push sends your record to CatHub. You can then review it in the browser.¦pushで記録をCatHubへ送ります。その後ブラウザーで確認できます。
지우의 다음 메시지 받기¦Read Jiwoo’s next message¦ジウの次のメッセージを読む
의뢰가 전달됐어요. 다음 메시지를 열어 이어서 도와주세요.¦Your work has been delivered. Open the next message to continue.¦修正版が届きました。次のメッセージを開いて続けましょう。
카페의 세 가지 준비가 끝났어요. 초대장을 열고 문을 열어 주세요.¦All three jobs are done. Open the invitation and turn on the OPEN sign.¦三つの準備ができました。招待状を開き、OPENの看板をつけましょう。
지우의 의뢰 읽고 수락하기¦Read and accept Jiwoo’s request¦ジウの依頼を読んで受ける
메시지 앱에서 부탁을 읽고 의뢰 수락 버튼을 누르세요.¦Read the request in Messages and select Accept request.¦メッセージで内容を読み「依頼を受ける」を押しましょう。
브라우저에서 프로젝트 열기¦Open the project in the browser¦ブラウザーでプロジェクトを開く
지우가 보낸 CatHub에는 카페 파일이 모여 있어요. 먼저 열어 보세요.¦Jiwoo’s CatHub project holds the cafe files. Open it first.¦ジウのCatHubにカフェのファイルがあります。まず開いてみましょう。
카페 파일을 내 PC로 가져오기¦Copy the cafe files to your PC¦カフェのファイルをPCにコピー
clone은 프로젝트를 복사해 오는 명령이에요. 명령 넣기를 누르고 터미널에서 Enter를 누르세요.¦clone copies a project. Select Insert command, then press Enter in the terminal.¦cloneはプロジェクトをコピーするコマンドです。「コマンドを入れる」を押し、ターミナルでEnterを押しましょう。
도구 목록 새로 받기¦Get the tool list¦ツールの一覧を取得
프로젝트를 켜려면 실행 도구가 필요해요. 먼저 설치할 수 있는 도구 목록을 받아요.¦The project needs tools to run. First, get the list of available tools.¦プロジェクトを動かすにはツールが必要です。まずインストールできるツールの一覧を取得します。
사이트 실행 도구 설치¦Install the site tools¦サイトの実行ツールを入れる
Node와 npm은 이 카페 사이트를 켜는 도구예요. 명령을 실행하면 설치돼요.¦Node and npm run the cafe site. Execute the command to install them.¦Nodeとnpmはカフェのサイトを動かすツールです。コマンドを実行して入れましょう。
프로젝트 준비물 받기¦Get the project dependencies¦プロジェクトの必要なものを取得
npm install은 카페 프로젝트에 필요한 파일을 준비해요.¦npm install gets the files needed by the cafe project.¦npm installでカフェのプロジェクトに必要なファイルをそろえます。
카페 미리보기 켜기¦Start the cafe preview¦カフェのプレビューを起動
npm run dev를 실행하면 브라우저에서 카페를 볼 수 있어요.¦Run npm run dev to view the cafe in your browser.¦npm run devを実行するとブラウザーでカフェを見られます。
브라우저에서 고장 난 메뉴판 보기¦Inspect the broken menu in the browser¦ブラウザーで壊れたメニューを見る
계산대에서 커피 3잔 담아 보기¦Try ordering three coffees¦コーヒーを3杯入れてみる
360px 버튼을 눌러 휴대폰 화면을 보세요. 이름과 잘린 메뉴를 확인한 뒤 문제 확인 버튼을 누르세요.¦Select 360px to see the phone view. Check the name and clipped menu, then select Problem found.¦360pxを押してスマホの画面を見ましょう。名前と切れたメニューを確認し「問題を確認」を押します。
수량의 + 버튼으로 3잔을 담아 보세요. 13,500원이 나오는지 확인하고 문제 확인 버튼을 누르세요.¦Use + to add three cups. Check whether the total is 13,500 KRW, then select Problem found.¦＋で3杯にしましょう。合計が13,500ウォンか確認し「問題を確認」を押します。
index.html에서 카페 이름 바꾸기¦Change the name in index.html¦index.htmlで店名を変更
고칠 글자 찾기를 누르세요. 선택된 글자를 모노 카페로 바꾸면 돼요. <h1>과 </h1>은 남겨 주세요.¦Select Find text to edit. Replace the selected text with Mono Cafe. Keep the <h1> and </h1> tags.¦「直す文字を選ぶ」を押し、選択された文字を「モノカフェ」に変更します。<h1>と</h1>は残しましょう。
style.css에서 메뉴 너비 고치기¦Fix the menu width in style.css¦style.cssでメニューの幅を直す
고칠 글자 찾기로 960px을 선택한 뒤 100%를 입력하세요. 화면 너비에 맞춘다는 뜻이에요.¦Select Find text to edit, then replace 960px with 100%. This fits the menu to the available width.¦「直す文字を選ぶ」で960pxを選び、100%に変更します。画面の幅に合わせる意味です。
app.js에서 합계 계산 고치기¦Fix the total in app.js¦app.jsで合計計算を直す
price는 한 잔 가격, quantity는 잔 수예요. return 줄의 +를 곱셈 기호 *로 바꿔 보세요.¦price is the cost per cup; quantity is the cup count. Replace + with the multiplication symbol * on the return line.¦priceは1杯の価格、quantityは杯数です。returnの行の＋を掛け算の記号*に変えましょう。
server.py에서 메뉴 주소 연결¦Connect the menu address in server.py¦server.pyでメニューのアドレスをつなぐ
MENU_PATH는 메뉴를 찾는 주소예요. /menu를 /api/menu로 바꾸세요. 따옴표는 남겨 주세요.¦MENU_PATH is the address for the menu. Replace /menu with /api/menu. Keep the quotes.¦MENU_PATHはメニューを探すアドレスです。/menuを/api/menuに変更し、引用符は残しましょう。
server.py에서 주문 보관 켜기¦Keep orders in server.py¦server.pyで注文の保存を有効に
SAVE_ORDERS는 주문 보관 스위치예요. False를 True로 바꾸세요. 첫 글자는 대문자예요.¦SAVE_ORDERS switches order storage on or off. Replace False with True, with a capital T.¦SAVE_ORDERSは注文保存のスイッチです。FalseをTrueに変えましょう。最初のTは大文字です。
서버 앱에서 컴퓨터 준비¦Prepare a computer in Server¦サーバーアプリでPCを準備
내 PC 밖에서 주문을 받으려면 다른 컴퓨터가 필요해요. 서버 앱의 Ubuntu 설치를 누르세요.¦Another computer will receive orders outside your PC. Select Install Ubuntu in Server.¦自分のPCの外で注文を受けるため、別のPCを用意します。サーバーアプリの「Ubuntuをインストール」を押しましょう。
카페 서버에 접속하기¦Connect to the cafe server¦カフェのサーバーに接続
ssh는 다른 컴퓨터에 접속하는 명령이에요. 실행 뒤 터미널의 이름이 mono-server로 바뀌어요.¦ssh connects to another computer. The terminal name will change to mono-server.¦sshで別のPCに接続します。ターミナルの名前がmono-serverに変わります。
서버의 도구 목록 받기¦Get the server tool list¦サーバーのツール一覧を取得
새 컴퓨터에도 도구가 필요해요. 설치할 수 있는 목록부터 받아요.¦The new computer needs tools too. Start by getting the list.¦新しいPCにもツールが必要です。まず一覧を取得しましょう。
서버 실행 도구 설치¦Install the server tools¦サーバーの実行ツールを入れる
Python은 주문 프로그램을 실행하고, pip는 필요한 준비물을 받아요.¦Python runs the order program. pip gets the things it needs.¦Pythonで注文プログラムを動かし、pipで必要なものを取得します。
서버로 카페 파일 가져오기¦Copy the cafe files to the server¦サーバーにカフェのファイルをコピー
CatHub에 보낸 수정본을 이 컴퓨터에도 복사해요.¦Copy the changes you sent to CatHub onto this computer too.¦CatHubに送った修正版をこのPCにもコピーします。
서버의 프로젝트 폴더 열기¦Open the server project folder¦サーバーのプロジェクトを開く
서버에도 menu-site 폴더가 생겼어요. 그 안으로 이동하세요.¦The server now has a menu-site folder. Move into it.¦サーバーにもmenu-siteフォルダーができました。中に移動しましょう。
서버의 파일을 최신으로 받기¦Update the server files¦サーバーのファイルを更新
git pull은 CatHub의 최신 기록을 가져와요.¦git pull gets the latest record from CatHub.¦git pullでCatHubの最新の記録を取得します。
주문 프로그램 준비물 받기¦Prepare the order program¦注文プログラムを準備
requirements.txt에 적힌 준비물을 설치해요.¦Install the requirements listed in requirements.txt.¦requirements.txtに書かれた必要なものをインストールします。
이전 주문 프로그램 종료¦Stop the old order program¦古い注文プログラムを終了
수정한 파일로 다시 켜기 위해 이전 프로그램을 종료해요.¦Stop the old program so you can restart with your changed files.¦修正したファイルで再起動するため、古いプログラムを終了します。
주문 프로그램 실행¦Start the order program¦注文プログラムを起動
python3 server.py를 실행하세요. 8000번 주소에서 주문을 기다리기 시작해요.¦Run python3 server.py. It will listen for orders on port 8000.¦python3 server.pyを実行します。8000番ポートで注文を待ち始めます。
API 앱에서 메뉴 요청 보내기¦Request the menu in API¦APIアプリでメニューを取得
API 앱에서 주문 한 건 보내기¦Send an order in API¦APIアプリで注文を送る
메뉴 가져오기를 선택하고 전송을 누르세요. 200 OK는 메뉴를 받았다는 뜻이에요.¦Select Get menu, then Send. 200 OK means the menu arrived.¦「メニュー取得」を選んで「送信」を押します。200 OKはメニューが届いた意味です。
주문 보내기를 선택하고 전송을 누르세요. 201 Created와 서버 주문 기록을 확인해 보세요.¦Select Send order, then Send. Look for 201 Created and check the server order records.¦「注文送信」を選んで「送信」を押します。201 Createdとサーバーの注文記録を確認しましょう。
수정한 결과 검사하기¦Test your changes¦修正結果をテスト
에디터의 검사 실행을 누르세요. 실패한 항목은 이유를 읽고 고친 뒤 다시 검사할 수 있어요.¦Select Run checks in the editor. Read any failed checks, fix the problem, and try again.¦エディターの「チェック実行」を押します。失敗した項目の理由を読み、直して再確認できます。
브라우저에서 검토 요청¦Request a review in the browser¦ブラウザーでレビューを依頼
CatHub의 PR 만들기 · 검토 요청을 누르세요. 지우에게 보낼 버전이 조건을 만족하는지 확인해요.¦Select Create PR · Request review in CatHub to check the version you will send to Jiwoo.¦CatHubの「PR作成・レビュー依頼」を押します。ジウに送る版が条件を満たすか確認します。
승인된 수정본 확정하기¦Confirm the approved changes¦承認された修正版を確定
PR 병합을 누르면 검토한 수정본이 공개할 버전으로 정해져요.¦Select Merge PR to make the approved changes the version to publish.¦「PRをマージ」で確認済みの修正版を公開する版に決めます。
카페에 수정본 전달하기¦Deliver the changes to the cafe¦カフェに修正版を届ける
검토한 버전 배포를 누르세요. 카페에 수정본이 전달되면 의뢰 보상을 받아요.¦Select Deploy reviewed version. You earn the reward when the cafe receives your work.¦「確認済みの版を公開」を押しましょう。カフェに修正版が届くと報酬を受け取れます。
명령 넣기¦Insert command¦コマンドを入れる
해당 앱 열기¦Open app¦アプリを開く
명령을 넣은 뒤 Enter로 실행하세요.¦Press Enter to run the inserted command.¦コマンドを入れたらEnterで実行します。
현재 행동 안내¦Current action guide¦今の操作ガイド
고칠 글자 찾기¦Find text to edit¦直す文字を選ぶ
360px를 눌러 이름과 잘린 메뉴를 확인하세요.¦Select 360px to check the name and clipped menu.¦360pxを押して名前と切れたメニューを確認しましょう。
커피를 3잔 담고 합계를 확인하세요. 13,500원이 맞아요.¦Add three coffees and check the total. It should be 13,500 KRW.¦コーヒーを3杯入れて合計を確認。13,500ウォンが正解です。
문제 확인 · 파일 고치기¦Problem found · Edit files¦問題を確認・ファイルを直す
의뢰 수락¦Accept request¦依頼を受ける
프로젝트 열기¦Open project¦プロジェクトを開く
작업 시작하기¦Start working¦作業を始める
좋아요. 파일을 열어서 확인해 볼게요!¦Sure. I’ll open the files and take a look!¦わかりました。ファイルを開いて確認します！
모노 카페 사장 지우예요. 메뉴판에 다른 이름이 떠요. 휴대폰에서는 메뉴도 잘리고요. 카페 파일을 보낼 테니 고쳐 주실래요? 의뢰를 수락하면 오른쪽에 할 일이 표시돼요.¦I’m Jiwoo, the owner of Mono Cafe. The menu shows the wrong name, and it gets cut off on phones. Can you fix the files? Accept the request and your tasks will appear on the right.¦モノカフェの店主ジウです。メニューに違う名前が表示され、スマホではメニューも切れています。ファイルを送るので直してもらえますか？依頼を受けると右側にやることが出ます。
모든 앱 표시¦Show all apps¦すべてのアプリを表示
아직 이야기에서 열리지 않은 서버와 API 앱도 표시해요.¦Also show Server and API before they appear in the story.¦物語でまだ登場していないサーバーとAPIアプリも表示します。
모노 카페 이야기 · 0.6¦The Mono Cafe story · 0.6¦モノカフェの物語 · 0.6
파일을 고치고, 주문을 연결하고, 가게 문을 열자.¦Fix the files, connect the orders, and open the cafe.¦ファイルを直し、注文をつなぎ、店を開こう。
코딩을 몰라도 괜찮아요. 바탕화면에서 메시지를 열어 시작하세요.¦New to coding? Start by opening Messages on the desktop.¦コードを知らなくても大丈夫。デスクトップのメッセージを開いて始めましょう。
이 파일 처음 상태로¦Restore this file¦このファイルを元に戻す
고칠 줄을 찾지 못했어요. 이 파일을 처음 상태로 되돌려 다시 해볼 수 있어요. 실행 취소로 복원도 가능해요.¦The line to edit is missing. Restore this file to try again. Undo can bring your edits back.¦直す行が見つかりません。このファイルを元に戻してやり直せます。「元に戻す」で編集内容も復元できます。
선택된 글자만 입력해서 바꿔 보세요. 나머지 코드는 그대로 두세요.¦Type to replace the selected text. Leave the rest of the code as it is.¦選んだ文字だけ入力して変更しましょう。他のコードはそのままにします。
대화상자 닫기¦Close dialog¦ダイアログを閉じる
이 결과는 수정 전 기록이에요. 다시 검사해 주세요.¦This result is from before your edit. Run checks again.¦これは修正前の結果です。もう一度チェックしてください。
합계를 계산하는 코드 찾아 고치기¦Find and fix the total calculation code¦合計を計算するコードを探して直す
3잔이 4,503원이 됐어요. 계산을 맡은 파일을 탐색기에서 직접 찾아 여세요. 컴퓨터 앱의 파일 설명이 단서예요. 찾았다면: price는 한 잔 가격, quantity는 잔 수예요. return 줄의 +를 곱셈 기호 *로 바꿔 보세요.¦Three cups became 4,503 KRW. Find and open the file handling the calculation in Files. The file description in Computer is your clue. Once found: price is the cost per cup, quantity is the cup count. Replace + with the multiplication symbol * on the return line.¦3杯で4,503ウォンになりました。計算を行うファイルをファイル管理で直接探して開いてください。コンピューターアプリのファイル説明が手がかりです。見つけたら：priceは1杯の価格、quantityは杯数です。returnの行の＋を掛け算の記号*に変えてみましょう。
주문 서버 코드에서 메뉴 주소 연결¦Connect menu address in order server code¦注文サーバーコードでメニューアドレスを接続
메뉴와 주문을 받는 서버 프로그램 파일을 탐색기에서 직접 찾아 여세요. MENU_PATH는 메뉴를 찾는 주소예요. /menu를 /api/menu로 바꾸세요. 따옴표는 남겨 주세요.¦Find and open the server program file that handles menus and orders in Files. MENU_PATH is the address for fetching menus. Change /menu to /api/menu. Keep the quotes.¦メニューと注文を受けるサーバープログラムファイルをファイル管理で直接探して開いてください。MENU_PATHはメニューを探すアドレスです。/menuを/api/menuに変えましょう。引用符は残してください。
주문 서버 코드에서 주문 보관 켜기¦Enable order storage in order server code¦注文サーバーコードで注文保存を有効化
SAVE_ORDERS는 주문 보관 스위치예요. False를 True로 바꾸세요. 첫 글자는 대문자예요.¦SAVE_ORDERS is the switch for storing orders. Change False to True with a capital T.¦SAVE_ORDERSは注文を保存するスイッチです。False를 Trueに変えてください。最初の文字は大文字です。
`;
