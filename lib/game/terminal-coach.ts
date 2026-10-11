import {HOME} from './content.ts';
import {guidedSetupCommand,setupReadiness} from './setup.ts';
import type {GameState} from './engine.ts';
import type {CoachStage} from './coach.ts';
import type {Localized} from './career-content.ts';

/** 카페 의뢰를 터미널에서 직접 진행하게 돕는 코치. 실행은 항상 플레이어가 Enter로 한다. */
export type CoachConcept='exit'|'cd'|'clone'|'apt-update'|'apt-install'|'npm-install'|'npm-dev'|'pkill';
export type CoachCommand={command:string;concept:CoachConcept;lesson:Localized};

export const COACH_LESSONS:Record<CoachConcept,Localized>={
 exit:{ko:'exit는 지금 접속한 서버에서 나와 내 PC로 돌아가요.',en:'exit leaves the server you are connected to and returns to your PC.',ja:'exitは接続中のサーバーから出て、自分のPCに戻ります。'},
 cd:{ko:'cd(change directory)는 작업할 폴더로 들어가요. 프롬프트의 경로가 바뀌는지 보세요.',en:'cd (change directory) moves into a folder. Watch the path in the prompt change.',ja:'cd（change directory）は作業するフォルダーに入ります。プロンプトのパスが変わるのを見ましょう。'},
 clone:{ko:'git clone은 CatHub에 있는 프로젝트를 내 PC로 통째로 복사해요. 복사가 끝나면 ls로 menu-site 폴더를 확인할 수 있어요.',en:'git clone copies the whole project from CatHub to your PC. Afterwards, ls shows the new menu-site folder.',ja:'git cloneはCatHubのプロジェクトを丸ごと自分のPCにコピーします。終わったらlsでmenu-siteフォルダーを確認できます。'},
 'apt-update':{ko:'sudo는 관리자 권한으로 실행, apt는 프로그램 설치 관리자예요. update는 설치할 수 있는 목록을 먼저 새로 받아요.',en:'sudo runs as administrator and apt is the package manager. update refreshes the list of installable programs first.',ja:'sudoは管理者権限で実行、aptはプログラムの管理ツールです。updateはまずインストールできる一覧を更新します。'},
 'apt-install':{ko:'apt install은 필요한 프로그램을 설치해요. 웹 화면을 돌리려면 nodejs와 npm이 필요해요.',en:'apt install installs the programs you need. Running the web page needs nodejs and npm.',ja:'apt installは必要なプログラムを入れます。Webページを動かすにはnodejsとnpmが必要です。'},
 'npm-install':{ko:'npm install은 package.json에 적힌 준비물(라이브러리)을 프로젝트에 받아요.',en:'npm install downloads the libraries listed in package.json into the project.',ja:'npm installはpackage.jsonに書かれた部品（ライブラリ）をプロジェクトに入れます。'},
 'npm-dev':{ko:'npm run dev는 미리보기 서버를 켜요. 켜지면 localhost:5173에서 카페 화면이 살아나요.',en:'npm run dev starts the preview server. The cafe page comes alive at localhost:5173.',ja:'npm run devはプレビューサーバーを起動します。localhost:5173でカフェの画面が動き出します。'},
 pkill:{ko:'pkill node는 다른 프로젝트가 쓰던 미리보기 서버를 꺼서 5173번 자리를 비워요.',en:'pkill node stops another project’s preview server to free port 5173.',ja:'pkill nodeは別のプロジェクトのプレビューサーバーを止め、5173番を空けます。'},
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
  {id:'copied',done:r.copied,label:{ko:'프로젝트 복사',en:'Copy project',ja:'プロジェクトをコピー'}},
  {id:'tools',done:r.tools,label:{ko:'도구 설치',en:'Install tools',ja:'ツールを入れる'}},
  {id:'dependencies',done:r.dependencies,label:{ko:'준비물 받기',en:'Get packages',ja:'部品を入れる'}},
  {id:'preview',done:r.preview,label:{ko:'미리보기 켜기',en:'Start preview',ja:'プレビュー起動'}},
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
