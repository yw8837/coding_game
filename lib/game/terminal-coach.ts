import {localizedCopy} from './zh.ts';
import {HOME} from './content.ts';
import {guidedSetupCommand,setupReadiness} from './setup.ts';
import type {GameState} from './engine.ts';
import type {CoachStage} from './coach.ts';
import type {Localized} from './career-content.ts';

/** 카페 의뢰를 터미널에서 직접 진행하게 돕는 코치. 실행은 항상 플레이어가 Enter로 한다. */
export type CoachConcept='exit'|'cd'|'clone'|'apt-update'|'apt-install'|'npm-install'|'npm-dev'|'pkill';
export type CoachCommand={command:string;concept:CoachConcept;lesson:Localized};

export const SETUP_GOALS:Record<CoachConcept,Localized>={
 exit:localizedCopy('카페 파일은 내 PC에서 준비해야 해요. 접속 중인 서버에서 내 작업공간으로 돌아오세요.','The café files belong on your PC. Return there from the connected server.','カフェの準備は自分のPCで行います。接続先のサーバーから戻りましょう。','咖啡馆的文件需要放在自己的电脑上。从服务器返回本机。'),
 cd:localizedCopy('작업 위치를 옮기세요. 터미널 프롬프트에서 현재 폴더를 확인할 수 있어요.','Change your working folder. The prompt shows where you are now.','作業フォルダーを移りましょう。プロンプトで現在地を確認できます。','切换工作目录。提示符会显示你当前所在的位置。'),
 clone:localizedCopy('지우가 CatHub에 올린 menu-site를 내 PC로 가져오세요. 복사되면 새 폴더가 보여요.','Bring Jiwoo’s menu-site project from CatHub onto your PC. Look for a new folder afterwards.','ジウがCatHubに置いたmenu-siteを自分のPCに取り込みましょう。終わると新しいフォルダーが見えます。','把智友的 menu-site 项目从 CatHub 复制到自己的电脑上，再检查新出现的文件夹。'),
 'apt-update':localizedCopy('설치 관리자가 최신 프로그램 목록을 갖도록 새로 받아 오세요.','Refresh the package manager’s list of available software.','パッケージ管理ツールで入手できるソフトの一覧を更新しましょう。','刷新软件包管理器的可用软件列表。'),
 'apt-install':localizedCopy('이 PC에서 카페 사이트를 실행하려면 Node.js와 npm이 필요해요. 빠진 도구를 설치하세요.','The café site needs Node.js and npm on this PC. Install the missing tools.','カフェのサイトにはNode.jsとnpmが必要です。足りないツールをインストールしましょう。','咖啡馆网站需要 Node.js 和 npm。安装缺少的工具。'),
 'npm-install':localizedCopy('프로젝트 폴더에서 package.json에 적힌 라이브러리를 받아 오세요.','Get the libraries listed in the project’s package.json from inside its folder.','プロジェクト内でpackage.jsonに書かれたライブラリを用意しましょう。','在项目目录里安装 package.json 中列出的依赖。'),
 'npm-dev':localizedCopy('카페의 미리보기 서버를 켜고 손님의 화면이 열리는지 확인하세요.','Start the café preview server so you can see what a customer sees.','プレビューサーバーを起動し、お客さんが見る画面を開きましょう。','启动预览服务器，看看顾客会看到什么。'),
 pkill:localizedCopy('다른 프로젝트가 미리보기 포트를 쓰고 있어요. 먼저 그 서버를 멈추세요.','Another project is using the preview port. Stop its server first.','別のプロジェクトがポートを使用中です。先にそのサーバーを止めましょう。','另一个项目占用了预览端口。先停止那个服务器。'),
};

export const COACH_LESSONS:Record<CoachConcept,Localized>={
 exit:localizedCopy('exit는 지금 접속한 서버에서 나와 내 PC로 돌아가요.','exit leaves the server you are connected to and returns to your PC.','exitは接続中のサーバーから出て、自分のPCに戻ります。'),
 cd:localizedCopy('cd(change directory)는 작업할 폴더로 들어가요. 프롬프트의 경로가 바뀌는지 보세요.','cd (change directory) moves into a folder. Watch the path in the prompt change.','cd（change directory）は作業するフォルダーに入ります。プロンプトのパスが変わるのを見ましょう。'),
 clone:localizedCopy('git clone은 CatHub에 있는 프로젝트를 내 PC로 통째로 복사해요. 복사가 끝나면 ls로 menu-site 폴더를 확인할 수 있어요.','git clone copies the whole project from CatHub to your PC. Afterwards, ls shows the new menu-site folder.','git cloneはCatHubのプロジェクトを丸ごと自分のPCにコピーします。終わったらlsでmenu-siteフォルダーを確認できます。'),
 'apt-update':localizedCopy('sudo는 관리자 권한으로 실행, apt는 프로그램 설치 관리자예요. update는 설치할 수 있는 목록을 먼저 새로 받아요.','sudo runs as administrator and apt is the package manager. update refreshes the list of installable programs first.','sudoは管理者権限で実行、aptはプログラムの管理ツールです。updateはまずインストールできる一覧を更新します。'),
 'apt-install':localizedCopy('apt install은 필요한 프로그램을 설치해요. 웹 화면을 돌리려면 nodejs와 npm이 필요해요.','apt install installs the programs you need. Running the web page needs nodejs and npm.','apt installは必要なプログラムを入れます。Webページを動かすにはnodejsとnpmが必要です。'),
 'npm-install':localizedCopy('npm install은 package.json에 적힌 준비물(라이브러리)을 프로젝트에 받아요.','npm install downloads the libraries listed in package.json into the project.','npm installはpackage.jsonに書かれた部品（ライブラリ）をプロジェクトに入れます。'),
 'npm-dev':localizedCopy('npm run dev는 미리보기 서버를 켜요. 켜지면 localhost:5173에서 카페 화면이 살아나요.','npm run dev starts the preview server. The cafe page comes alive at localhost:5173.','npm run devはプレビューサーバーを起動します。localhost:5173でカフェの画面が動き出します。'),
 pkill:localizedCopy('pkill node는 다른 프로젝트가 쓰던 미리보기 서버를 꺼서 5173번 자리를 비워요.','pkill node stops another project’s preview server to free port 5173.','pkill nodeは別のプロジェクトのプレビューサーバーを止め、5173番を空けます。'),
};

export function coachConcept(command:string):CoachConcept{
 if(command==='exit')return 'exit';
 if(command.startsWith('cd'))return 'cd';
 if(command.startsWith('git clone'))return 'clone';
 if(command==='sudo apt update')return 'apt-update';
 if(command.startsWith('sudo apt install'))return 'apt-install';
 if(command==='npm install')return 'npm-install';
 if(command.startsWith('pkill'))return 'pkill';
 return 'npm-dev';
}

/** 사람이 실제로 칠 만한 짧은 경로로 바꾼다: 홈에서는 `cd menu-site`, 그 밖에서는 `cd ~/menu-site`. */
export function friendlyCommand(state:GameState,command:string):string{
 const match=/^cd "(.+)"$/.exec(command);if(!match)return command;
 const target=match[1],cwd=state.machines[state.machine].cwd;
 if(target===HOME)return 'cd ~';
 if(/\s/.test(target))return command;
 if(target.startsWith(cwd+'/'))return 'cd '+target.slice(cwd==='/'?1:cwd.length+1);
 if(target.startsWith(HOME+'/'))return 'cd ~/'+target.slice(HOME.length+1);
 return 'cd '+target;
}

export function nextCoachCommand(state:GameState):CoachCommand|null{
 const raw=guidedSetupCommand(state);if(!raw)return null;
 const concept=coachConcept(raw);
 return {command:friendlyCommand(state,raw),concept,lesson:COACH_LESSONS[concept]};
}

export type SetupMilestone={id:'copied'|'tools'|'dependencies'|'preview';done:boolean;label:Localized};
export function setupMilestones(state:GameState):SetupMilestone[]{
 const r=setupReadiness(state);
 return [
  {id:'copied',done:r.copied,label:localizedCopy('프로젝트 복사','Copy project','プロジェクトをコピー')},
  {id:'tools',done:r.tools,label:localizedCopy('도구 설치','Install tools','ツールを入れる')},
  {id:'dependencies',done:r.dependencies,label:localizedCopy('준비물 받기','Get packages','部品を入れる')},
  {id:'preview',done:r.preview,label:localizedCopy('미리보기 켜기','Start preview','プレビュー起動')},
 ];
}

const EXPLORE:Partial<Record<CoachStage,readonly string[]>>={
 sign:['grep -n "<h1" index.html','code index.html'],
 size:['grep -n width style.css','code style.css'],
 rule:['grep -n return app.js','code app.js'],
 serve:['git diff'],
 route:['grep -n MENU_PATH server.py','code server.py'],
 keep:['grep -n SAVE_ORDERS server.py','code server.py'],
 connect:['git status'],
 menu:['curl http://mono-server:8000/api/menu'],
 trial:['npm test'],
 deliver:['git status','git diff'],
 complete:['git log'],
};
/** 단계마다 터미널에서 직접 살펴볼 만한 명령. 프로젝트 밖이면 먼저 돌아오는 명령을 붙인다. */
export function exploreCommands(state:GameState,stage:CoachStage):string[]{
 if(!state.repo||stage==='prepare')return [];
 const list=stage==='inspect'?(state.mission===0?['ls','cat index.html']:['cat app.js']):[...(EXPLORE[stage]??[])];
 if(!list.length)return [];
 const local=stage==='menu'?[]:state.machine==='local'?[]:['exit'];
 const home=state.machine==='local'&&stage!=='menu'&&state.machines.local.cwd!==state.repo.root?[friendlyCommand(state,'cd "'+state.repo.root+'"')]:[];
 return [...local,...home,...list];
}
