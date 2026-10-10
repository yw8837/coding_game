import {act,runCommand,projectFiles,sourceHash,dirtyFiles,isProjectServerRunning,type GameState} from './engine.ts';
import {REPO_URL,PROJECT,MISSIONS} from './content.ts';
import type {GameEdition} from './edition.ts';

export type AssistAction = 'prepare'|'title-cafe'|'title-bakery'|'width-fit'|'width-wide'|'width-small'|'multiply'|'add'|'subtract'|'route-menu'|'route-home'|'keep-orders'|'discard-orders'|'trial'|'publish';
function command(s:GameState,line:string,edition:GameEdition):GameState {
 const result=runCommand(s,line,edition);
 if(result.error)throw new Error(result.output);
 return result.state;
}
export function prepareWorkspace(state:GameState,edition:GameEdition='full'):GameState {
 let s=act(state,{type:'accept'},edition);
 if(s.machine==='server')s=command(s,'exit',edition);
 s=act(s,{type:'discover',what:'repo'},edition);
 if(!s.repo){s=command(s,'cd ~',edition);s=command(s,'git clone '+REPO_URL,edition);}
 if(!s.machines.local.updated)s=command(s,'sudo apt update',edition);
 if(!s.machines.local.tools.includes('npm'))s=command(s,'sudo apt install nodejs npm',edition);
 s=command(s,'cd "'+s.repo!.root+'"',edition);
 if(!s.machines.local.dependencies.includes(s.repo!.root))s=command(s,'npm install',edition);
 if(!isProjectServerRunning(s)){
  if(s.machines.local.processes.frontend)s=command(s,'pkill node',edition);
  s=command(s,'npm run dev',edition);
 }
 s.notice='수리 도구가 준비됐어요. 카페 화면에서 직접 고쳐 보세요.';
 return s;
}
function sendWork(state:GameState,edition:GameEdition):GameState {
 let s=state;
 if(s.machine==='server')s=command(s,'exit',edition);
 s=command(s,'cd "'+s.repo!.root+'"',edition);
 // Stage the whole current snapshot even when an earlier staged edit was reverted.
 s=command(s,'git add .',edition);
 if(dirtyFiles(s).length)s=command(s,'git commit -m "Complete chapter '+(s.mission+1)+'"',edition);
 return command(s,'git push',edition);
}
export function prepareTrial(state:GameState,edition:GameEdition='full'):GameState {
 let s=prepareWorkspace(state,edition);
 if(s.mission!==2)return s;
 s=sendWork(s,edition);s=act(s,{type:'install-server'},edition);
 s=command(s,'ssh dev@mono-server',edition);
 if(!s.machines.server.updated)s=command(s,'sudo apt update',edition);
 s=command(s,'sudo apt install git python3 python3-pip',edition);
 if(!s.machines.server.cloned){s=command(s,'cd ~',edition);s=command(s,'git clone '+REPO_URL,edition);}
 s=command(s,'cd '+PROJECT,edition);s=command(s,'git pull',edition);
 if(!s.machines.server.pythonDeps.includes(PROJECT))s=command(s,'pip install -r requirements.txt',edition);
 if(s.machines.server.processes.backend)s=command(s,'pkill python3',edition);
 s=command(s,'python3 server.py',edition);
 return command(s,'exit',edition);
}
export function assist(state:GameState,action:AssistAction,edition:GameEdition='full'):GameState {
 if(action==='prepare')return prepareWorkspace(state,edition);
 if(action==='trial')return prepareTrial(state,edition);
 if(!state.repo)return {...state,notice:'먼저 의뢰를 시작해 주세요.'};
 if(action==='publish'){
  const hash=sourceHash(projectFiles(state)),checks=state.tests;
  if(!checks||checks.mission!==state.mission||checks.hash!==hash||checks.checks.length!==MISSIONS[state.mission].checkNames.length||checks.checks.some(c=>!c.passed))return {...state,notice:'손님 테스트를 모두 통과하면 전달할 수 있어요.'};
  let s=sendWork(state,edition);
  for(const type of ['open-pr','merge-pr','deploy'] as const)s=act(s,{type},edition);
  return s;
 }
 if(state.completed.includes(state.mission))return state;
 const fs=projectFiles(state);
 const edit=(path:string,content:string)=>act(state,{type:'edit',path,content},edition);
 if(state.mission===0){
  if(action==='title-cafe'||action==='title-bakery')return edit('index.html',fs['index.html'].replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i,'$1'+(action==='title-cafe'?'모노 카페':'달빛 빵집')+'$2'));
  const widths:Record<string,string>={'width-fit':'100%','width-wide':'960px','width-small':'180px'};const width=widths[action];
  if(width)return edit('style.css',fs['style.css'].replace(/(\.menu-grid\s*\{[^}]*?\bwidth\s*:)\s*[^;]+;/,`$1 ${width};`));
 }
 if(state.mission===1&&['multiply','add','subtract'].includes(action)){
  const op=action==='multiply'?'*':action==='add'?'+':'-';
  return edit('app.js',fs['app.js'].replace(/(return\s+price\s*)[+*\/-](\s*quantity)/,'$1'+op+'$2'));
 }
 if(state.mission===2){
  if(action==='route-menu'||action==='route-home')return edit('server.py',fs['server.py'].replace(/^MENU_PATH\s*=.*$/m,'MENU_PATH = "'+(action==='route-menu'?'/api/menu':'/menu')+'"'));
  if(action==='keep-orders'||action==='discard-orders')return edit('server.py',fs['server.py'].replace(/^SAVE_ORDERS\s*=.*$/m,'SAVE_ORDERS = '+(action==='keep-orders'?'True':'False')));
 }
 return state;
}
