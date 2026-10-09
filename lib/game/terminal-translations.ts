import {tokenize} from './engine.ts';
import type {Language} from './translations.ts';

// Exact authored lines only. Paths, commands, code and user messages are opaque.
const lines:Record<string,readonly [string,string]>={
 'pwd를 뜻했나요? /는 절대경로를 시작합니다.':['Did you mean pwd? / starts an absolute path.','pwdの意味ですか？ / は絶対パスの先頭です。'],
 'help로 지원 명령과 사용법을 확인하세요.':['Use help to see supported commands and usage.','helpで対応コマンドと使い方を確認してください。'],
 '작업 저장소가 이미 있습니다. 기존 프로젝트를 사용하세요.':['A working repository already exists. Use the existing project.','作業リポジトリはすでにあります。既存のプロジェクトを使用してください。'],
 '지원 명령: git clone / status / diff / add / commit -m / push / pull / log':['Supported commands: git clone / status / diff / add / commit -m / push / pull / log','対応コマンド: git clone / status / diff / add / commit -m / push / pull / log'],
 'shell: 따옴표 또는 역슬래시가 닫히지 않았어요.':['shell: A quote or backslash is not closed.','shell: 引用符またはバックスラッシュが閉じられていません。'],
 '도구가 이 컴퓨터에 설치되어 있지 않습니다.':['This tool is not installed on this computer.','このコンピューターにツールがインストールされていません。'],
 'LINUX  pwd · ls · cd <경로> · cat <파일> · mkdir <폴더> · cp · mv · touch · clear':['LINUX  pwd · ls · cd <path> · cat <file> · mkdir <folder> · cp · mv · touch · clear','LINUX  pwd · ls · cd <パス> · cat <ファイル> · mkdir <フォルダー> · cp · mv · touch · clear'],
 'GIT    git clone <주소> · status · diff · add <파일|.> · commit -m "설명" · push · pull · log':['GIT    git clone <URL> · status · diff · add <file|.> · commit -m "description" · push · pull · log','GIT    git clone <URL> · status · diff · add <ファイル|.> · commit -m "説明" · push · pull · log'],
 'CHECK  curl <가상 주소> · ps · pkill node · pkill python3':['CHECK  curl <simulated URL> · ps · pkill node · pkill python3','CHECK  curl <仮想URL> · ps · pkill node · pkill python3'],
 '지원하는 학습용 명령만 실행합니다. 실제 PC에 설치하거나 외부 인터넷에 접속하지 않습니다.':['Only supported learning commands run here. They do not install software on your PC or access the public internet.','対応する学習用コマンドだけが動作します。実際のPCへのインストールや外部インターネットへの接続は行いません。'],
 '이 실습의 sudo는 apt 명령을 지원합니다.':['In this simulator, sudo supports apt commands.','このシミュレーターのsudoはaptコマンドに対応しています。'],
 '패키지 목록을 갱신했습니다. [게임 내 시뮬레이션]':['Package lists updated. [game simulation]','パッケージ一覧を更新しました。[ゲーム内シミュレーション]'],
 'E: 패키지 이름을 입력하세요.':['E: Enter a package name.','E: パッケージ名を入力してください。'],
 'E: 이 실습에서는 nodejs, npm, git, python3, python3-pip을 지원합니다.':['E: This simulator supports nodejs, npm, git, python3 and python3-pip.','E: このシミュレーターはnodejs、npm、git、python3、python3-pipに対応しています。'],
 '가상 컴퓨터의 설치 상태가 갱신되었습니다.':['The simulated computer’s installed tools have been updated.','仮想コンピューターのインストール状態を更新しました。'],
 '지원 명령: sudo apt update / install / list':['Supported commands: sudo apt update / install / list','対応コマンド: sudo apt update / install / list'],
 '이 실습에서는 node --version과 npm 스크립트를 사용하세요.':['Use node --version or npm scripts in this simulator.','このシミュレーターではnode --versionとnpmスクリプトを使用してください。'],
 '이 실습은 package.json의 의존성을 설치하는 npm install을 지원합니다.':['This simulator supports npm install to install the dependencies in package.json.','このシミュレーターはpackage.jsonの依存関係をインストールするnpm installに対応しています。'],
 'npm ERR! 이 프로젝트는 devDependencies.vite가 필요합니다.':['npm ERR! This project requires devDependencies.vite.','npm ERR! このプロジェクトにはdevDependencies.viteが必要です。'],
 '[게임] 이 프로젝트의 의존성이 준비됐습니다.':['[game] This project’s dependencies are ready.','[ゲーム] このプロジェクトの依存関係を準備しました。'],
 '지원 명령: npm install / run dev / test / run build':['Supported commands: npm install / run dev / test / run build','対応コマンド: npm install / run dev / test / run build'],
 '프로젝트에서 npm install을 먼저 실행하세요.':['Run npm install in the project folder first.','先にプロジェクトのフォルダーでnpm installを実行してください。'],
 '이 실습에서는 dev 스크립트의 vite 실행을 지원합니다.':['This simulator supports vite as the dev script.','このシミュレーターのdevスクリプトはviteに対応しています。'],
 '[게임] 서버는 백그라운드에서 실행됩니다. pkill node로 종료.':['[game] The server runs in the background. Stop it with pkill node.','[ゲーム] サーバーはバックグラウンドで動作します。pkill nodeで停止します。'],
 '현재 저장한 파일을 검사합니다. 검사 결과 패널을 확인하세요.':['Checking the currently saved files. See the test results panel.','現在保存されているファイルを検査します。検査結果パネルを確認してください。'],
 '이 실습에서 지원하지 않는 npm 스크립트입니다.':['This npm script is not supported by the simulator.','このnpmスクリプトはシミュレーターで対応していません。'],
 'CatHub 저장소의 복제 주소를 확인하세요.':['Check the CatHub repository’s clone URL.','CatHubリポジトリのコピー用URLを確認してください。'],
 '이 서버 실습은 ~/menu-site 경로를 사용합니다. cd ~ 후 복제해 주세요.':['This server exercise uses ~/menu-site. Run cd ~ before cloning.','このサーバー実習は~/menu-siteを使用します。cd ~を実行してからコピーしてください。'],
 '이 첫 버전은 하나의 작업 저장소를 지원합니다. 기존 프로젝트를 사용하세요.':['This version supports one working repository. Use the existing project.','このバージョンは一つの作業リポジトリに対応しています。既存のプロジェクトを使用してください。'],
 '실행 중인 Python 프로세스는 재시작해야 수정본을 읽습니다.':['Restart the running Python process to load the updated files.','更新したファイルを読み込むには、実行中のPythonプロセスを再起動してください。'],
 '서버 사본은 git pull로 갱신합니다.':['Update the server copy with git pull.','サーバーのコピーはgit pullで更新します。'],
 '서버 사본에서는 git pull / status를 지원합니다. 수정·커밋은 내 PC에서 진행하세요.':['The server copy supports git pull / status. Edit and commit on your PC.','サーバーのコピーはgit pull / statusに対応しています。編集とコミットは自分のPCで行ってください。'],
 '사용법: git commit -m "변경 설명"':['Usage: git commit -m "description of changes"','使用方法: git commit -m "変更の説明"'],
 '변경이 로컬 기록에 저장되었습니다. CatHub에는 push 후 반영됩니다.':['Changes were saved to local history. Run push to send them to CatHub.','変更をローカルの履歴に保存しました。pushを実行するとCatHubに反映されます。'],
 'CatHub의 원격 저장소가 갱신되었습니다.':['The remote CatHub repository has been updated.','CatHubのリモートリポジトリを更新しました。'],
 '이 입문 버전은 main 브랜치에서 clone, status, diff, add, commit, push, pull, log를 지원합니다.':['This beginner version supports clone, status, diff, add, commit, push, pull and log on main.','この入門版はmainブランチでclone、status、diff、add、commit、push、pull、logに対応しています。'],
 '서버 앱에서 Ubuntu를 먼저 준비하세요.':['Prepare Ubuntu in the Server app first.','先にサーバーアプリでUbuntuを準備してください。'],
 'ssh: Could not resolve hostname. 지원 주소: dev@mono-server':['ssh: Could not resolve hostname. Supported address: dev@mono-server','ssh: ホスト名を解決できません。対応アドレス: dev@mono-server'],
 'Connected to mono-server. exit로 내 PC에 돌아갑니다.':['Connected to mono-server. Use exit to return to your PC.','mono-serverに接続しました。exitで自分のPCに戻ります。'],
 '작업실을 종료하려면 창을 닫으세요. 진행 상황은 자동 저장됩니다.':['Close the window to leave the workspace. Progress is saved automatically.','作業を終えるにはウィンドウを閉じてください。進行状況は自動保存されます。'],
 '지원 명령: pip install -r requirements.txt':['Supported command: pip install -r requirements.txt','対応コマンド: pip install -r requirements.txt'],
 '이 실습에서는 python3 server.py를 지원합니다.':['This simulator supports python3 server.py.','このシミュレーターはpython3 server.pyに対応しています。'],
 'Port 8000 is in use. pkill python3로 종료하세요.':['Port 8000 is in use. Stop the process with pkill python3.','ポート8000は使用中です。pkill python3でプロセスを停止してください。'],
 '[게임] 백그라운드 실행. pkill python3로 종료.':['[game] Running in the background. Stop it with pkill python3.','[ゲーム] バックグラウンドで実行中です。pkill python3で停止します。'],
 'SyntaxError: MENU_PATH 문자열과 SAVE_ORDERS의 True/False 값을 확인하세요.':['SyntaxError: Check the MENU_PATH string and the True/False value of SAVE_ORDERS.','SyntaxError: MENU_PATHの文字列とSAVE_ORDERSのTrue/Falseを確認してください。'],
 '이 실습의 Python 실행기는 제공된 템플릿의 MENU_PATH, SAVE_ORDERS 설정만 지원합니다.':['This simulator’s Python runner supports only the supplied template’s MENU_PATH and SAVE_ORDERS settings.','このシミュレーターのPython実行機能は、提供されたテンプレートのMENU_PATHとSAVE_ORDERSの設定だけに対応しています。'],
 '지원 명령: pkill node / pkill python3':['Supported commands: pkill node / pkill python3','対応コマンド: pkill node / pkill python3'],
 '사용법: curl http://mono-server:8000/api/menu':['Usage: curl http://mono-server:8000/api/menu','使用方法: curl http://mono-server:8000/api/menu'],
 '(변경 없음)':['(no changes)','(変更なし)'],
 '이 첫 버전에서 지원하는 명령은 help로 확인하세요.':['Use help to see the commands supported in this version.','helpでこのバージョンの対応コマンドを確認してください。'],
};

/** Localize authored simulator guidance; native-looking technical logs stay raw.
 * Data-producing commands are deliberately opaque, including git log/diff and
 * curl JSON. Commit text and clone destination names are also preserved.
 */
export function translateTerminalOutput(command:string,output:string,language:Language):string{
 if(language==='ko'||!output)return output;
 const translate=(line:string)=>lines[line]?.[language==='en'?0:1]??line;
 let args:string[];
 try{args=tokenize(command);}catch{return translate(output);}
 const [cmd,sub]=args;
 if(cmd==='curl')return output==='사용법: curl http://mono-server:8000/api/menu'?translate(output):output;
 if(cmd==='git'&&sub==='diff')return output==='(변경 없음)'?translate(output):output;
 if(['cat','ls','pwd','echo','whoami','uname','ps'].includes(cmd)||cmd==='git'&&sub==='log')return output;
 if(cmd==='git'){
  if(output.startsWith("fatal: '")||output.startsWith('error: src refspec '))return output;
  // Commit messages may contain arbitrary lines, even ones matching our table.
  if(sub==='commit'&&output.startsWith('[main ')){
   const end=output.lastIndexOf('\n');return end<0?output:output.slice(0,end+1)+translate(output.slice(end+1));
  }
  if(sub==='clone'){
   const match=/^(Cloning into '([\s\S]*)'\.\.\.\nReceiving objects: 100% \(8\/8\), done\.\n)이제 cd \2 로 폴더에 들어가세요\.$/.exec(output);
   if(match)return match[1]+(language==='en'?`Now enter the folder with cd ${match[2]}.`:`cd ${match[2]}でフォルダーに移動してください。`);
   // Clone errors can echo arbitrary destination names. Only its known final
   // guidance can be translated without touching that destination text.
   const end=output.lastIndexOf('\n');return end<0?translate(output):output.slice(0,end+1)+translate(output.slice(end+1));
  }
  if(sub==='status'&&output!=='On branch main\n서버 사본은 git pull로 갱신합니다.')return output;
 }
 if(cmd==='cp'||cmd==='mv'){
  if(output===`사용법: ${cmd} <원본 파일> <대상 파일>`)return language==='en'?`Usage: ${cmd} <source file> <destination file>`:`使用方法: ${cmd} <元のファイル> <コピー先のファイル>`;
  return output;
 }
 // Only help and tool/server commands produce known authored multiline logs.
 if(['help','man','sudo','apt','node','npm','git','ssh','exit','pip','pip3','python3','pkill'].includes(cmd)){
  if(cmd==='npm'&&output.startsWith('npm ERR! code ENOENT'))return output;
  if(cmd==='npm'&&output.startsWith('npm ERR! Missing script: '))return output;
  return output.split('\n').map(translate).join('\n');
 }
 // Unknown commands can include user-controlled text; translate only the
 // terminal's final guidance line, never their echoed command name.
 const end=output.lastIndexOf('\n');return end<0?translate(output):output.slice(0,end+1)+translate(output.slice(end+1));
}
