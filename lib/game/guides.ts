import {DOCS} from './content';
import type {Language} from './translations';
const guides:Record<string,{en:[string,string,string];ja:[string,string,string]}>= {
 terminal:{en:['Finding your way in the terminal','pwd, ls and cd show where you are and what is nearby.',`Commands run from your current folder.

pwd                 Show current folder
ls                  List files and folders
cd menu-site        Enter the project
cd ..               Go up one folder
cat README.md       Read the guide
mkdir practice      Create a folder

Put quotes around paths containing spaces. Linux is an operating system; this window uses shell commands.`],ja:['ターミナルで道を探す','pwd・ls・cdで現在地とファイルを確認します。',`コマンドは現在のフォルダーを基準に実行します。

pwd                 現在地を表示
ls                  ファイルとフォルダーの一覧
cd menu-site        プロジェクトに移動
cd ..               一つ上のフォルダーへ
cat README.md       説明書を読む
mkdir practice      フォルダーを作成

空白を含むパスは引用符で囲みます。LinuxはOSで、この画面ではシェルのコマンドを使います。`]},
 npm:{en:['Why does npm not run?','Check installed tools, project dependencies and your current folder.',`1. Install tools on this computer
sudo apt update
sudo apt install nodejs npm

2. Enter the project
cd ~/menu-site

3. Install dependencies listed in package.json
npm install

4. Start the dev server
npm run dev

Command not found: the tool is missing.
ENOENT: a required file is not in this folder.
vite: not found: install project dependencies.

These commands only change the simulated game computer.`],ja:['npmが動かないとき','ツール、プロジェクトの依存関係、現在地を確認します。',`1. このコンピューターにツールを用意
sudo apt update
sudo apt install nodejs npm

2. プロジェクトに移動
cd ~/menu-site

3. package.jsonの依存関係を用意
npm install

4. 開発サーバーを起動
npm run dev

Command not found：ツールがありません。
ENOENT：このフォルダーに必要なファイルがありません。
vite: not found：プロジェクトの依存関係を確認します。

コマンドはゲーム内の仮想コンピューターだけを変更します。`]},
 css:{en:['Repair the first page','Change the title and make the menu width flexible.',`In index.html, change the text between <h1> and </h1> to the client's name:
<h1>모노 카페</h1>

The code keeps the original cafe name. The preview translates it for you.
HTML provides structure. CSS controls appearance.

In style.css, replace width: 960px with width: 100%.
.menu-grid {
  width: 100%;
}

The existing media query puts cards in one column on small screens.
@media (max-width: 600px) {
  .menu-grid { grid-template-columns: 1fr; }
}

Run the checks to test 360px and 1024px screens. Hiding menu cards will not pass.`],ja:['最初のページを直す','タイトルを変え、メニューの幅を画面に合わせます。',`index.htmlの<h1>と</h1>の間を、依頼人のカフェ名に変更します。
<h1>모노 카페</h1>

コード内の店名は元の表記を使います。プレビューでは翻訳して表示します。
HTMLは構造、CSSは見た目を担当します。

style.cssのwidth: 960pxをwidth: 100%へ変更。
.menu-grid {
  width: 100%;
}

小さな画面で1列にするメディアクエリーは用意されています。
@media (max-width: 600px) {
  .menu-grid { grid-template-columns: 1fr; }
}

確認を実行すると360pxと1024pxの画面を検査します。メニューを隠すと合格できません。`]},
 git:{en:['From your workspace to CatHub','Edit → stage → commit → push → review → release.',`Clone the repository:
git clone https://cathub.dev/mono/menu-site.git

Inspect changes:
git status

Stage current files:
git add .

Save a snapshot with a message:
git commit -m "Fix mobile menu"

Send it to CatHub:
git push origin main

Later edits do not change an existing commit. Add, commit and push again. A PR reviews one specific remote commit. This game's simplified workflow reviews changes on main before releasing them.`],ja:['作業室からCatHubへ','編集 → ステージ → コミット → push → 確認 → 公開。',`リポジトリを複製：
git clone https://cathub.dev/mono/menu-site.git

変更を確認：
git status

現在のファイルをステージ：
git add .

説明を付けて状態を記録：
git commit -m "Fix mobile menu"

CatHubへ送信：
git push origin main

あとで編集しても過去のコミットは変わりません。再度add、commit、pushが必要です。PRはリモートの特定コミットを確認します。このゲームではmainの変更を確認して公開する簡略化した流れです。`]},
 javascript:{en:['Total from price and quantity','Try changing function inputs, return values and operators.',`calculateTotal(price, quantity) receives two numbers and returns a total.

+  addition
-  subtraction
*  multiplication
/  division

function calculateTotal(price, quantity) {
  return price * quantity;
}

return sends back the result. Check quantities 0, 1 and 3, and more than one price.

The game evaluator supports numbers, arithmetic, parentheses, const/let and return. Loops, DOM and asynchronous code are outside this simulation.`],ja:['価格と数量から合計を求める','関数の入力、戻り値、演算子を試します。',`calculateTotal(price, quantity)は二つの数を受け取り、合計を返します。

+  足し算
-  引き算
*  掛け算
/  割り算

function calculateTotal(price, quantity) {
  return price * quantity;
}

returnで結果を返します。数量0、1、3や別の価格でも確認しましょう。

ゲームの実行器は数値、四則演算、括弧、const/let、returnに対応。ループ、DOM、非同期処理は対象外です。`]},
 server:{en:['Run the API on Ubuntu','Configure Python, prepare the virtual server and send HTTP requests.',`MENU_PATH is the menu address. SAVE_ORDERS controls order storage.

MENU_PATH = "/api/menu"
SAVE_ORDERS = True

Save, add, commit and push your local files. Prepare Ubuntu in the Server app, then:

ssh dev@mono-server
sudo apt update
sudo apt install git python3 python3-pip
git clone https://cathub.dev/mono/menu-site.git
cd menu-site
pip install -r requirements.txt
python3 server.py

Use git pull to receive later changes. The running API uses a startup snapshot: stop with pkill python3 and restart after editing. Use exit to return to your PC.

Send GET http://mono-server:8000/api/menu and POST /api/orders in the API app.

The game simulates the two settings in this template, not a general Python interpreter. Orders live in server memory and clear when the process restarts.`],ja:['UbuntuでAPIを動かす','Pythonの設定、仮想サーバーの準備、HTTPの確認。',`MENU_PATHはメニューのアドレス、SAVE_ORDERSは注文を保存する設定です。

MENU_PATH = "/api/menu"
SAVE_ORDERS = True

ローカルで保存、add、commit、push。サーバーアプリでUbuntuを準備し、次を実行：

ssh dev@mono-server
sudo apt update
sudo apt install git python3 python3-pip
git clone https://cathub.dev/mono/menu-site.git
cd menu-site
pip install -r requirements.txt
python3 server.py

変更を受け取るにはgit pull。APIは起動時のコードを使うため、pkill python3で停止して再起動します。exitで自分のPCへ戻ります。

APIアプリでGET http://mono-server:8000/api/menuとPOST /api/ordersを送ります。

ゲームはテンプレートの二つの設定を再現します。一般的なPython実行環境ではありません。注文はメモリーに保存され、再起動すると消えます。`]},
};
export function getGuides(language:Language){return language==='ko'?DOCS:DOCS.map(doc=>{const [title,summary,body]=guides[doc.id][language];return {...doc,title,summary,body};});}
