import {dirtyFiles,projectFiles,sourceHash,type GameState} from './engine.ts';
import {lessonFacts} from './lesson.ts';
import {PROJECT,REPO_URL,MISSIONS} from './content.ts';
import {setupReadiness} from './setup.ts';

export type Task={id:string;phase:number;title:string;detail:string;app:'messages'|'browser'|'computer'|'editor'|'terminal'|'server'|'api'|'achievements';command?:string;url?:string;file?:string;find?:string;next?:boolean};
export const PHASES=['의뢰 읽기','작업 준비','문제 고치기','결과 확인','의뢰 전달'];
const step=(id:string,phase:number,title:string,detail:string,app:Task['app'],extra:Partial<Task>={}):Task=>({id,phase,title,detail,app,...extra});
const shell=(id:string,phase:number,title:string,detail:string,command:string)=>step(id,phase,title,detail,'terminal',{command});
function upload(s:GameState,phase:number):Task|null{
 const r=s.repo!,fs=projectFiles(s),dirty=dirtyFiles(s);
 if(!dirty.length&&r.remote.id===r.commits.at(-1)!.id)return null;
 if(s.machine!=='local')return shell('exit',phase,'내 PC로 돌아오기','exit는 서버 접속을 끝내요. 수정한 파일은 내 PC에 있어요.','exit');
 if(s.machines.local.cwd!==r.root)return shell('cd',phase,'프로젝트 폴더로 이동','cd는 폴더를 여는 명령이에요. 아래 명령을 넣고 Enter를 누르세요.','cd "'+r.root+'"');
 if(dirty.length){
  if(dirty.some(k=>r.staged[k]!==(fs[k]??null))||Object.keys(r.staged).some(k=>r.staged[k]!==(fs[k]??null)))return shell('stage',phase,'수정한 파일을 기록에 담기','git add .은 바꾼 파일을 다음 기록에 담아요. 아직 다른 사람에게 전달되지는 않아요.','git add .');
  return shell('commit',phase,'수정 내용을 기록하기','commit은 지금의 파일을 한 묶음으로 기록해요. 따옴표 안에는 수정한 내용을 적을 수 있어요.','git commit -m "Fix cafe chapter '+(s.mission+1)+'"');
 }
 if(r.remote.id!==r.commits.at(-1)!.id)return shell('push',phase,'CatHub에 수정본 보내기','push는 내 기록을 CatHub로 보내요. 전송 뒤 브라우저에서 검토할 수 있어요.','git push');
 return null;
}
export function currentTask(s:GameState):Task{
 const m=s.mission,r=s.repo,server=s.machines.server,fs=projectFiles(s),facts=lessonFacts(s);
 if(s.completed.includes(m))return step('complete',5,m<2?'지우의 다음 메시지 받기':s.gameplay.openingCelebrated?'동네 해결사 엔딩 달성!':'마지막 할 일 · OPEN 간판 켜기',m<2?'의뢰가 전달됐어요. 다음 메시지를 열어 이어서 도와주세요.':s.gameplay.openingCelebrated?'카페가 문을 열었어요. 성취를 확인하거나 연습 의뢰에 도전해 보세요.':'카페의 세 가지 준비가 끝났어요. 초대장을 열고 문을 열어 주세요.',m<2?'messages':'achievements',{next:m<2});
 const message=['welcome','chapter-two','chapter-three'][m];
 if(!s.gameplay.readMessages.includes(message)||!s.accepted)return step('message',0,'지우의 의뢰 읽고 수락하기','메시지 앱에서 부탁을 읽고 의뢰 수락 버튼을 누르세요.','messages');
 if(!s.discovered.repo)return step('repo',1,'브라우저에서 프로젝트 열기','지우가 보낸 CatHub에는 카페 파일이 모여 있어요. 먼저 열어 보세요.','browser',{url:'https://cathub.dev/mono/menu-site'});
 if(!r||!setupReadiness(s).ready)return step('setup',1,'내 PC에서 카페 사이트 준비하기','컴퓨터에서 프로젝트 복사 → 준비물 받기 → 미리보기 켜기를 차례로 누르세요.','computer');
 // Setup is complete; terminal users can keep their current folder and machine.
 // Source edits always target the local project, and upload restores its cwd.
 if(m<2&&!s.gameplay.inspected.includes(m))return step('inspect',2,m===0?'브라우저에서 고장 난 메뉴판 보기':'계산대에서 커피 3잔 담아 보기',m===0?'360px 버튼을 눌러 휴대폰 화면을 보세요. 이름과 잘린 메뉴를 확인한 뒤 문제 확인 버튼을 누르세요.':'수량의 + 버튼으로 3잔을 담아 보세요. 13,500원이 나오는지 확인하고 문제 확인 버튼을 누르세요.','browser',{url:'http://localhost:5173'});
 if(m===0&&!facts.sign)return step('sign',2,'index.html에서 카페 이름 바꾸기','고칠 글자 찾기를 누르세요. 선택된 글자를 모노 카페로 바꾸면 돼요. <h1>과 </h1>은 남겨 주세요.','editor',{file:'index.html',find:'heading'});
 if(m===0&&!facts.size)return step('size',2,'style.css에서 메뉴 너비 고치기','고칠 글자 찾기로 960px을 선택한 뒤 100%를 입력하세요. 화면 너비에 맞춘다는 뜻이에요.','editor',{file:'style.css',find:'width'});
 if(m===1&&!facts.rule)return step('rule',2,'app.js에서 합계 계산 고치기','price는 한 잔 가격, quantity는 잔 수예요. return 줄의 +를 곱셈 기호 *로 바꿔 보세요.','editor',{file:'app.js',find:'operator'});
 if(m===2&&!facts.route)return step('route',2,'server.py에서 메뉴 주소 연결','MENU_PATH는 메뉴를 찾는 주소예요. /menu를 /api/menu로 바꾸세요. 따옴표는 남겨 주세요.','editor',{file:'server.py',find:'route'});
 if(m===2&&!facts.keep)return step('keep',2,'server.py에서 주문 보관 켜기','SAVE_ORDERS는 주문 보관 스위치예요. False를 True로 바꾸세요. 첫 글자는 대문자예요.','editor',{file:'server.py',find:'keep'});
 if(m===2){
  const transfer=upload(s,3);if(transfer)return transfer;
  if(!s.serverReady)return step('server',3,'서버 앱에서 컴퓨터 준비','내 PC 밖에서 주문을 받으려면 다른 컴퓨터가 필요해요. 서버 앱의 Ubuntu 설치를 누르세요.','server');
  const needsServer=!server.updated||!server.tools.includes('python3-pip')||!server.cloned||server.files[PROJECT+'/server.py']!==fs['server.py']||!server.pythonDeps.includes(PROJECT)||!server.processes.backend||server.backendSource!==fs['server.py'];
  if(needsServer){
   if(s.machine!=='server')return shell('ssh',3,'카페 서버에 접속하기','ssh는 다른 컴퓨터에 접속하는 명령이에요. 실행 뒤 터미널의 이름이 mono-server로 바뀌어요.','ssh dev@mono-server');
   if(!server.updated)return shell('server-update',3,'서버의 도구 목록 받기','새 컴퓨터에도 도구가 필요해요. 설치할 수 있는 목록부터 받아요.','sudo apt update');
   if(!server.tools.includes('python3-pip'))return shell('python',3,'서버 실행 도구 설치','Python은 주문 프로그램을 실행하고, pip는 필요한 준비물을 받아요.','sudo apt install git python3 python3-pip');
   if(!server.cloned&&server.cwd!=='/home/dev')return shell('server-home',3,'서버의 프로젝트 폴더 열기','서버에도 menu-site 폴더가 생겼어요. 그 안으로 이동하세요.','cd ~');
   if(!server.cloned)return shell('server-clone',3,'서버로 카페 파일 가져오기','CatHub에 보낸 수정본을 이 컴퓨터에도 복사해요.','git clone '+REPO_URL);
   if(server.cwd!==PROJECT)return shell('server-cd',3,'서버의 프로젝트 폴더 열기','서버에도 menu-site 폴더가 생겼어요. 그 안으로 이동하세요.','cd '+PROJECT);
   if(server.files[PROJECT+'/server.py']!==fs['server.py'])return shell('pull',3,'서버의 파일을 최신으로 받기','git pull은 CatHub의 최신 기록을 가져와요.','git pull');
   if(!server.pythonDeps.includes(PROJECT))return shell('pip',3,'주문 프로그램 준비물 받기','requirements.txt에 적힌 준비물을 설치해요.','pip install -r requirements.txt');
   if(server.processes.backend&&server.backendSource!==fs['server.py'])return shell('stop-api',3,'이전 주문 프로그램 종료','수정한 파일로 다시 켜기 위해 이전 프로그램을 종료해요.','pkill python3');
   return shell('start-api',3,'주문 프로그램 실행','python3 server.py를 실행하세요. 8000번 주소에서 주문을 기다리기 시작해요.','python3 server.py');
  }
  if(!s.apiEvidence.menu||!s.apiEvidence.order||!s.orders.length)return step('api',3,!s.apiEvidence.menu?'API 앱에서 메뉴 요청 보내기':'API 앱에서 주문 한 건 보내기',!s.apiEvidence.menu?'메뉴 가져오기를 선택하고 전송을 누르세요. 200 OK는 메뉴를 받았다는 뜻이에요.':'주문 보내기를 선택하고 전송을 누르세요. 201 Created와 서버 주문 기록을 확인해 보세요.','api');
 }
 const tested=s.tests?.mission===m&&s.tests.hash===sourceHash(fs)&&s.tests.checks.length===MISSIONS[m].checkNames.length&&s.tests.checks.every(c=>c.passed);
 if(!tested)return step('test',3,'수정한 결과 검사하기','에디터의 검사 실행을 누르세요. 실패한 항목은 이유를 읽고 고친 뒤 다시 검사할 수 있어요.','editor',{file:MISSIONS[m].file});
 const transfer=upload(s,4);if(transfer)return transfer;
 const pr=r.pr;
 if(!pr||pr.commit.id!==r.remote.id||pr.status==='changes-requested')return step('review',4,'브라우저에서 검토 요청','CatHub의 PR 만들기 · 검토 요청을 누르세요. 지우에게 보낼 버전이 조건을 만족하는지 확인해요.','browser',{url:'https://cathub.dev/mono/menu-site?tab=pr'});
 if(pr.status==='approved')return step('merge',4,'승인된 수정본 확정하기','PR 병합을 누르면 검토한 수정본이 공개할 버전으로 정해져요.','browser',{url:'https://cathub.dev/mono/menu-site?tab=pr'});
 return step('deploy',4,'카페에 수정본 전달하기','검토한 버전 배포를 누르세요. 카페에 수정본이 전달되면 의뢰 보상을 받아요.','browser',{url:'https://cathub.dev/mono/menu-site?tab=pr'});
}

/** Finds a small editable token without changing or solving the source. */
export function taskSelection(task:Task,source:string):[number,number]|null{
 const patterns:Record<string,RegExp>={heading:/<h1\b[^>]*>([^<]*)<\/h1>/i,width:/\.menu-grid\s*\{[^}]*?\bwidth\s*:\s*([^;]+);/,operator:/return\s+price\s*([+*\/-])\s*quantity/,route:/^MENU_PATH\s*=\s*["']([^"']+)["']/m,keep:/^SAVE_ORDERS\s*=\s*(True|False)/m};
 const pattern=patterns[task.find??''];if(!pattern)return null;const match=pattern.exec(source);if(!match)return null;
 const start=match.index+match[0].lastIndexOf(match[1]);return [start,start+match[1].length];
}
