import {PRACTICE_CUSTOMERS} from './customers.ts';
import {HOME, PROJECT, REPO_URL, INITIAL_FILES, MISSIONS} from './content.ts';
import {createGameplay,COSMETICS,DESIGN_CHOICES,gameMessages,canClaimColor,type Gameplay,type DesignId} from './gameplay.ts';
import {createPractice,evaluatePractice,practiceJob} from './practice.ts';
import {applyCareer,type CareerAction} from './career.ts';

export type Files = Record<string,string>;
export type MachineId = 'local'|'server';
export type Check = {name:string;passed:boolean;detail?:string};
export type Snapshot = {id:string;message:string;files:Files;mission:number;hash:string};
export type Machine = {cwd:string;tools:string[];updated:boolean;files:Files;dirs:string[];dependencies:string[];pythonDeps:string[];processes:{frontend:boolean;backend:boolean};frontendRoot:string|null;backendRoot:string|null;backendSource:string|null;cloned:boolean};
export type GameState = {
 gameplay:Gameplay;
 version:1;mission:number;accepted:boolean;credits:number;xp:number;completed:number[];badges:string[];
 machine:MachineId;machines:Record<MachineId,Machine>;serverReady:boolean;
 discovered:{search:boolean;repo:boolean;preview:boolean};
 repo:null|{root:string;staged:Record<string,string|null>;commits:Snapshot[];remote:Snapshot;merged:Snapshot;deployed:Snapshot;pr:null|{commit:Snapshot;status:'changes-requested'|'approved'|'merged';feedback:string}};
 tests:null|{hash:string;mission:number;checks:Check[]};testRequest:number;
 orders:{id:number;item:string;quantity:number}[];localOrders:{id:number;item:string;quantity:number}[];apiEvidence:{menu:boolean;order:boolean};
 notice:string;logs:string[];history:{command:string;output:string;error:boolean;machine:MachineId;cwd:string}[];
};
export type Action = CareerAction|{type:'practice-submit'|'practice-draft';id:string;answer:string}|{type:'inspect-preview';mobile:boolean;quantity:number}|{type:'serve-customer';customer:number;quantity:number}|{type:'celebrate-opening'}|{type:'accept'}|{type:'discover';what:'search'|'repo'|'preview'}|{type:'edit';path:string;content:string}|{type:'test-result';hash:string;checks:Check[];designChoice?:DesignId|null;designPassed?:boolean}|{type:'open-pr'}|{type:'merge-pr'}|{type:'deploy'}|{type:'next-mission'}|{type:'install-server'}|{type:'request-tests'}|{type:'clear-notice'}|{type:'read-message';id:string}|{type:'claim-bonus';id:string}|{type:'buy-cosmetic';id:string}|{type:'equip-cosmetic';id:string}|{type:'choose-design';id:string};
export type CommandResult={state:GameState;output:string;error:boolean};

function machine():Machine{return {cwd:HOME,tools:['git'],updated:false,files:{[HOME+'/welcome.txt']:'CODE:SHIFT 작업실에 오신 것을 환영합니다.\nhelp로 지원 명령을 확인하세요.\n'},dirs:['/','/home',HOME],dependencies:[],pythonDeps:[],processes:{frontend:false,backend:false},frontendRoot:null,backendRoot:null,backendSource:null,cloned:false};}
export function createGame():GameState{return {gameplay:createGameplay(),version:1,mission:0,accepted:false,credits:120,xp:0,completed:[],badges:[],machine:'local',machines:{local:machine(),server:{...machine(),tools:[]}},serverReady:false,discovered:{search:false,repo:false,preview:false},repo:null,tests:null,testRequest:0,orders:[],localOrders:[],apiEvidence:{menu:false,order:false},notice:'',logs:['[system] 워크스테이션이 시작되었습니다.'],history:[]};}
export function clone<T>(data:T):T{return JSON.parse(JSON.stringify(data));}
export function sourceHash(files:Files):string {const str=Object.keys(files).sort().map(k=>k+'\0'+files[k]).join('\0');let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
export function resolvePath(cwd:string,path:string):string {let p=path||HOME;if(p==='~'||p.startsWith('~/'))p=HOME+p.slice(1);if(!p.startsWith('/'))p=cwd+'/'+p;const out:string[]=[];for(const part of p.split('/')){if(!part||part==='.')continue;if(part==='..')out.pop();else out.push(part);}return '/'+out.join('/');}
const MAX_STORED_PATH=300,MAX_STORED_FILE=60000;
function storedPath(path:string):string{if(path.length>MAX_STORED_PATH)throw new Error('ENAMETOOLONG: Path exceeds 300 characters.');return path;}
function storedFile(path:string,content:string):void{storedPath(path);if(content.length>MAX_STORED_FILE)throw new Error('EFBIG: File exceeds 60,000 characters.');}
function commandPath(cwd:string,path:string):string{return storedPath(resolvePath(cwd,path));}
function validateFiles(root:string,files:Files):void{storedPath(root);for(const [p,c] of Object.entries(files))storedFile(root+'/'+p,c);}
export function filesAt(m:Machine,root:string):Files{const r:Files={};for(const [p,c] of Object.entries(m.files))if(p.startsWith(root+'/'))r[p.slice(root.length+1)]=c;return r;}
export function projectFiles(state:GameState):Files{return state.repo?filesAt(state.machines.local,state.repo.root):{};}
export function isProjectServerRunning(state:GameState):boolean{return !!state.repo&&state.machines.local.processes.frontend&&state.machines.local.frontendRoot===state.repo.root;}
export function dirtyFiles(s:GameState):string[]{if(!s.repo)return [];const f=projectFiles(s),base=s.repo.commits.at(-1)!.files;return [...new Set([...Object.keys(f),...Object.keys(base)])].filter(k=>f[k]!==base[k]);}
function putFiles(m:Machine,root:string,files:Files){validateFiles(root,files);m.dirs.push(...[root,...Object.keys(files).filter(f=>f.includes('/')).map(f=>root+'/'+f.slice(0,f.lastIndexOf('/')))].filter(x=>!m.dirs.includes(x)));for(const [p,c] of Object.entries(files))m.files[root+'/'+p]=c;}
function log(s:GameState,line:string){s.logs.push(line);s.logs=s.logs.slice(-60);}
function snapshot(files:Files,message:string,id:string,mission:number):Snapshot{return {id,message,files:clone(files),mission,hash:sourceHash(files)};}
export function tokenize(input:string):string[]{const parts:string[]=[];let part='',quote='',active=false,escape=false;for(const c of input.trim()){if(escape){part+=c;escape=false;active=true;continue;}if(c==='\\'&&quote!=="'"){escape=true;continue;}if(quote){if(c===quote)quote='';else part+=c;active=true;continue;}if(c==='"'||c==="'"){quote=c;active=true;continue;}if(/\s/.test(c)){if(active){parts.push(part);part='';active=false;}}else{part+=c;active=true;}}if(quote||escape)throw new Error('따옴표 또는 역슬래시가 닫히지 않았어요.');if(active)parts.push(part);return parts;}

export function calculateTotal(code:string,price:number,quantity:number):number{
 const clean=code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').trim();
 const match=clean.match(/^function\s+calculateTotal\s*\(\s*price\s*,\s*quantity\s*\)\s*\{([\s\S]*)\}\s*;?$/);
 if(!match)throw new Error('지원 범위: calculateTotal(price, quantity) 함수, 숫자·사칙연산·변수·return.');
 const vars:Record<string,number>={price,quantity};let returned=false,result=0;
 const expr=(src:string):number=>{const tokens=src.match(/(?:\d+(?:\.\d*)?|\.\d+)|[A-Za-z_$][\w$]*|[()+\-*/%]/g)||[];if(tokens.join('')!==src.replace(/\s/g,''))throw new Error('지원하지 않는 연산 또는 문법입니다.');let i=0;
  const atom=():number=>{const t=tokens[i++];if(t==='('){const n=sum();if(tokens[i++]!==')')throw new Error('닫는 괄호가 필요합니다.');return n;}if(t==='-')return -atom();if(t==='+')return atom();if(t&&/^\d|^\./.test(t))return Number(t);if(t&&Object.hasOwn(vars,t))return vars[t];throw new Error(`정의되지 않은 값: ${t??'빈 표현식'}`);};
  const product=():number=>{let n=atom();while(['*','/','%'].includes(tokens[i])){const op=tokens[i++],b=atom();n=op==='*'?n*b:op==='/'?n/b:n%b;}return n;};
  const sum=():number=>{let n=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],b=product();n=op==='+'?n+b:n-b;}return n;};
  const n=sum();if(i!==tokens.length||!Number.isFinite(n))throw new Error('유효한 숫자 결과가 필요합니다.');return n;};
 const statements=match[1].trim().split(';').map(x=>x.trim()).filter(Boolean);
 if(statements.length>20)throw new Error('이 실습에서는 20개 이하의 문장을 지원합니다.');
 for(const st of statements){if(returned)throw new Error('return 다음 문장은 이 실습에서 지원하지 않습니다.');const decl=st.match(/^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]+)$/);if(decl){if(Object.hasOwn(vars,decl[1]))throw new Error('이미 선언한 변수입니다.');vars[decl[1]]=expr(decl[2]);continue;}const ret=st.match(/^return\s+([\s\S]+)$/);if(ret){result=expr(ret[1]);returned=true;continue;}throw new Error('지원 범위: const/let 변수 선언과 return 산술식.');}
 if(!returned)throw new Error('return으로 합계를 돌려주세요.');return result;
}

export function parseBackend(code:string):{route:string;save:boolean}{
 const strip=(c:string)=>c.replace(/#[^\n]*/g,'').replace(/\s+/g,' ').trim();
 const p=code.match(/^\s*MENU_PATH\s*=\s*(["'])([^"'\n]+)\1\s*$/m),save=code.match(/^\s*SAVE_ORDERS\s*=\s*(True|False)\s*$/m);
 if(!p||!save)throw new Error('SyntaxError: MENU_PATH 문자열과 SAVE_ORDERS의 True/False 값을 확인하세요.');
 const normalize=(c:string)=>strip(c.replace(/^\s*MENU_PATH\s*=.*$/m,'MENU_PATH = ROUTE').replace(/^\s*SAVE_ORDERS\s*=.*$/m,'SAVE_ORDERS = SAVE'));
 if(normalize(code)!==normalize(INITIAL_FILES['server.py']))throw new Error('이 실습의 Python 실행기는 제공된 템플릿의 MENU_PATH, SAVE_ORDERS 설정만 지원합니다.');
 if(!p[2].startsWith('/'))throw new Error('ValueError: URL rule must start with a slash.');return {route:p[2],save:save[1]==='True'};
}

export function act(state:GameState,action:Action):GameState{
 const s=clone(state);s.notice='';
 if(action.type.startsWith('career-')){applyCareer(s,action as CareerAction);return s;}
 if(action.type==='practice-submit'||action.type==='practice-draft'){
  const job=practiceJob(action.id);
  if(!job||typeof action.answer!=='string'||action.answer.length>80)return s;
  const practice=s.gameplay.practice??(s.gameplay.practice=createPractice());
  practice.drafts[job.id]=action.answer;
  if(action.type==='practice-draft'){delete practice.results[job.id];return s;}
  const proof=evaluatePractice(job.id,action.answer);practice.results[job.id]=proof;
  if(proof.passed&&!practice.completed.includes(job.id)){
   practice.completed.push(job.id);s.credits+=job.credits;s.xp+=job.xp;
  }
  return s;
 }
 if(action.type==='celebrate-opening'){if(MISSIONS.every((_,i)=>s.completed.includes(i))&&!s.gameplay.openingCelebrated){s.gameplay.openingCelebrated=true;if(!s.badges.includes('동네 해결사'))s.badges.push('동네 해결사');s.notice='모노 카페, 정식 오픈! 동네 해결사 배지를 받았어요.';}return s;}
 if(action.type==='serve-customer'){
  const order=PRACTICE_CUSTOMERS[s.gameplay.servedCustomers];
  if(s.mission!==1||!s.repo||!order||action.customer!==s.gameplay.servedCustomers)return s;
  if(action.quantity!==order.quantity){s.notice='주문서의 잔 수를 다시 봐 주세요. 다시 건네도 괜찮아요.';return s;}
  try{if(calculateTotal(projectFiles(s)['app.js'],order.price,order.quantity)!==order.price*order.quantity){s.notice='계산 규칙을 먼저 고쳐 주세요.';return s;}}catch{s.notice='계산 규칙을 먼저 고쳐 주세요.';return s;}
  s.gameplay.servedCustomers++;s.notice=s.gameplay.servedCustomers===3?'세 손님 모두 받았어요!':'고마워요! 다음 손님이 왔어요.';return s;
 }
 if(action.type==='inspect-preview'){if(isProjectServerRunning(s)&&((s.mission===0&&action.mobile)||(s.mission===1&&action.quantity===3))&&!s.gameplay.inspected.includes(s.mission))s.gameplay.inspected.push(s.mission);return s;}
 if(action.type==='accept'){s.accepted=true;return s;}
 if(action.type==='clear-notice')return s;
 if(action.type==='read-message'){if(gameMessages(s).some(m=>m.id===action.id)&&!s.gameplay.readMessages.includes(action.id))s.gameplay.readMessages.push(action.id);return s;}
 if(action.type==='choose-design'){const choice=DESIGN_CHOICES.find(c=>c.id===action.id);if(choice&&s.gameplay.designChoice!==choice.id){s.gameplay.designChoice=choice.id;s.gameplay.designEvidence=null;}return s;}
 if(action.type==='buy-cosmetic'||action.type==='equip-cosmetic'){
  const item=COSMETICS.find(c=>c.id===action.id);if(!item)return s;
  const owned=s.gameplay.ownedCosmetics.includes(item.id);
  if(action.type==='equip-cosmetic'){if(owned){s.gameplay.equippedCosmetic=item.id;s.notice=item.name+' 테마를 적용했어요.';}return s;}
  if(owned)return s;
  if(s.credits<item.price){s.notice='크레딧이 부족해요. 의뢰나 보너스 과제를 완성해 보세요.';return s;}
  s.credits-=item.price;s.gameplay.ownedCosmetics.push(item.id);s.gameplay.equippedCosmetic=item.id;s.notice=item.name+' 테마를 구입하고 적용했어요.';return s;
 }
 if(action.type==='claim-bonus'){
  if(s.gameplay.claimedBonuses.includes(action.id))return s;
  const explorer=action.id==='explorer'&&Object.values(s.gameplay.exploration).every(Boolean);
  const color=action.id==='color'&&canClaimColor(s,sourceHash(projectFiles(s)));
  if(!explorer&&!color){s.notice='과제 조건을 먼저 완료해 주세요.';return s;}
  const reward=explorer?40:60,xp=explorer?20:30,badge=explorer?'터미널 탐험가':'컬러 실험가';
  s.gameplay.claimedBonuses.push(action.id);s.credits+=reward;s.xp+=xp;if(!s.badges.includes(badge))s.badges.push(badge);
  s.notice=badge+' 달성! '+reward+' cr와 '+xp+' XP를 받았어요.';return s;
 }
 if(action.type==='discover'){s.discovered[action.what]=true;return s;}
 if(action.type==='edit'){if(!s.repo)return s;if(action.content.length>60000){s.notice='파일은 60,000자까지 편집할 수 있어요.';return s;}if(!Object.hasOwn(projectFiles(s),action.path))return s;s.machines.local.files[s.repo.root+'/'+action.path]=action.content;return s;}
 if(action.type==='request-tests'){s.testRequest++;return s;}
 if(action.type==='test-result'){if(action.hash!==sourceHash(projectFiles(s)))return s;s.tests={hash:action.hash,mission:s.mission,checks:action.checks};if(action.designChoice&&action.designChoice===s.gameplay.designChoice)s.gameplay.designEvidence={hash:action.hash,choice:action.designChoice,passed:action.designPassed===true};s.notice=action.checks.every(c=>c.passed)?(action.designChoice===s.gameplay.designChoice&&action.designChoice?(action.designPassed?'화면과 색상 모두 통과! 보너스 창에서 보상을 받아 보세요.':'의뢰 검사는 통과했어요. 선택한 버튼 색은 아직 달라요.'):'손님 확인을 마쳤어요. 지우에게 알려 주세요.'):'아직 해결할 항목이 있어요. 검사 결과를 확인해 보세요.';return s;}
 if(action.type==='install-server'){if(s.mission<2){s.notice='세 번째 의뢰에서 서버가 지급됩니다.';return s;}s.serverReady=true;log(s,'[mono-server] Ubuntu 24.04 설치 완료 · 가상 서버');return s;}
 if(action.type==='next-mission'){if(!s.completed.includes(s.mission)||s.mission>=MISSIONS.length-1)return s;s.mission++;s.accepted=true;if(s.mission===1&&s.repo)s.machines.local.files[s.repo.root+'/app.js']='// 새 계산대의 오류를 찾아 주세요.\nfunction calculateTotal(price, quantity) {\n  return price + quantity;\n}\n';s.tests=null;s.apiEvidence={menu:false,order:false};if(s.repo)s.repo.pr=null;return s;}
 const r=s.repo;if(!r)return s;
 if(action.type==='open-pr'){
  if(r.remote.id==='c0000'){s.notice='새 커밋을 먼저 CatHub에 push해 주세요.';return s;}
  const evidence=s.tests&&s.tests.mission===s.mission&&s.tests.hash===r.remote.hash&&s.tests.checks.length===MISSIONS[s.mission].checkNames.length&&s.tests.checks.every(c=>c.passed);
  r.pr={commit:clone(r.remote),status:evidence?'approved':'changes-requested',feedback:evidence?'민서: 요청한 조건을 모두 확인했어요. 이 커밋은 병합할 수 있습니다.':'민서: 이 원격 커밋에 대한 통과 기록이 없어요. 최신 파일로 검사를 통과하고, 그 파일을 커밋·push한 뒤 다시 검토해 주세요.'};return s;
 }
 if(action.type==='merge-pr'){if(r.pr?.status!=='approved'){s.notice='먼저 최신 변경의 PR 검토를 통과하세요.';return s;}if(r.pr.commit.id!==r.remote.id){s.notice='PR 뒤에 새 push가 있어요. 다시 검토해 주세요.';return s;}r.merged=clone(r.pr.commit);r.pr.status='merged';return s;}
 if(action.type==='deploy'){
  if(s.completed.includes(s.mission)){s.notice='이미 완료한 의뢰예요. 보너스 과제도 도전해 보세요.';return s;}
  if(r.pr?.status!=='merged'||r.merged.id!==r.pr.commit.id){s.notice='검토를 통과한 PR을 먼저 병합해 주세요.';return s;}
  if(s.mission===2){const m=s.machines.server;if(!m.processes.backend||m.backendSource!==r.merged.files['server.py']||!s.apiEvidence.menu||!s.apiEvidence.order){s.notice='검토한 버전의 서버를 실행하고 API의 메뉴 조회·주문 요청을 확인하세요.';return s;}}
  r.deployed=clone(r.merged);s.completed.push(s.mission);s.credits+=MISSIONS[s.mission].reward;s.xp+=MISSIONS[s.mission].xp;s.badges.push(MISSIONS[s.mission].badge);s.notice='의뢰 완료! 보상과 배지가 지급되었습니다.';log(s,`[release] v1.${s.mission}.0 · ${r.deployed.id} 배포 완료`);return s;
 }
 return s;
}

export function runCommand(state:GameState,input:string):CommandResult{
 let s=clone(state);s.notice='';const origin=s.machine,cwd=s.machines[origin].cwd;let error=false;let output='';
 const fail=(text:string)=>{error=true;output=text;};
 let args:string[];try{args=tokenize(input);}catch(e){args=[];fail('shell: '+(e as Error).message);}
 const m=s.machines[s.machine];const [cmd,...a]=args;const root=s.machine==='local'?(s.repo?.root??PROJECT):PROJECT;
 const protectDelivered=(path:string)=>{if(s.machine==='local'&&s.gameplay.career.completed.some(id=>path==='/home/dev/jobs/'+id||path.startsWith('/home/dev/jobs/'+id+'/')))throw Error('Read-only: this job has already been delivered. Copy it to a different folder to experiment.');};
 const inProject=()=>m.cwd===root||m.cwd.startsWith(root+'/');
 const has=(t:string)=>m.tools.includes(t);
 const requireTool=(t:string)=>{if(!has(t)){fail(`${cmd}: command not found\n도구가 이 컴퓨터에 설치되어 있지 않습니다.`);return false;}return true;};
 const manifest=()=>{const raw=m.files[m.cwd+'/package.json'];if(!raw){fail(`npm ERR! code ENOENT\nnpm ERR! Could not read package.json: ${m.cwd}/package.json`);return null;}try{return JSON.parse(raw);}catch{fail('npm ERR! code EJSONPARSE\npackage.json must be valid JSON.');return null;}};
 try{
 if(!cmd){}else if(cmd==='clear'){s.history=[];return {state:s,output:'',error:false};}
 else if(cmd==='help'||cmd==='man')output='LINUX  pwd · ls · cd <경로> · cat <파일> · mkdir <폴더> · cp · mv · touch · clear\nTOOLS  sudo apt update · sudo apt install nodejs npm git python3 python3-pip\nNODE   node --version · npm --version · npm install · npm run dev · npm test · npm run build\nGIT    git clone <주소> · status · diff · add <파일|.> · commit -m "설명" · push · pull · log\nSERVER ssh dev@mono-server · exit · pip install -r requirements.txt · python3 server.py\nCHECK  curl <가상 주소> · ps · pkill node · pkill python3\n\n지원하는 학습용 명령만 실행합니다. 실제 PC에 설치하거나 외부 인터넷에 접속하지 않습니다.';
 else if(cmd==='pwd')output=m.cwd;
 else if(cmd==='whoami')output='dev';
 else if(cmd==='uname')output='Linux '+(s.machine==='local'?'shift-workstation':'mono-server')+' 6.8.0 x86_64 (simulated)';
 else if(cmd==='echo')output=a.join(' ');
 else if(cmd==='ls'){const path=resolvePath(m.cwd,a.find(x=>!x.startsWith('-'))||'.');if(!m.dirs.includes(path)){if(m.files[path]!==undefined)output=path.split('/').at(-1)!;else fail(`ls: cannot access '${path}': No such file or directory`);}else{const prefix=path==='/'?'/':path+'/';output=[...new Set([...m.dirs.filter(d=>d.startsWith(prefix)&&d!==path).map(d=>d.slice(prefix.length).split('/')[0]+'/'),...Object.keys(m.files).filter(p=>p.startsWith(prefix)).map(p=>p.slice(prefix.length).split('/')[0])])].join('  ')||'(빈 폴더)';}}
 else if(cmd==='cd'){const path=resolvePath(m.cwd,a[0]||'~');if(!m.dirs.includes(path))fail(`bash: cd: ${a[0]}: No such file or directory`);else m.cwd=path;}
 else if(cmd==='cat'){if(!a.length)fail('사용법: cat <파일>');else{const content=m.files[resolvePath(m.cwd,a[0])];if(content===undefined)fail(`cat: ${a[0]}: No such file or directory`);else output=content;}}
 else if(cmd==='mkdir'){const paths=a.filter(x=>!x.startsWith('-')).map(name=>({name,path:commandPath(m.cwd,name)}));if(!paths.length)fail('mkdir: missing operand');for(const {name,path:p} of paths){protectDelivered(p);if(m.dirs.includes(p)&&!a.includes('-p')){fail(`mkdir: cannot create directory '${name}': File exists`);break;}const parent=p.slice(0,p.lastIndexOf('/'))||'/';if(!m.dirs.includes(parent)&&!a.includes('-p')){fail(`mkdir: cannot create directory '${name}': No such file or directory`);break;}const parts=p.split('/').filter(Boolean);parts.forEach((_,i)=>{const d='/'+parts.slice(0,i+1).join('/');if(!m.dirs.includes(d))m.dirs.push(d);});}}
 else if(cmd==='touch'){if(!a[0])fail('touch: missing file operand');else{const p=commandPath(m.cwd,a[0]),parent=p.slice(0,p.lastIndexOf('/'));protectDelivered(p);if(!m.dirs.includes(parent))fail(`touch: cannot touch '${a[0]}': No such file or directory`);else m.files[p]??='';}}
 else if(cmd==='cp'||cmd==='mv'){if(a.length!==2)fail(`사용법: ${cmd} <원본 파일> <대상 파일>`);else{const from=commandPath(m.cwd,a[0]);let to=commandPath(m.cwd,a[1]);if(m.dirs.includes(to))to=storedPath(to+'/'+from.split('/').at(-1));protectDelivered(to);if(cmd==='mv')protectDelivered(from);if(from===to)fail(`${cmd}: '${a[0]}' and '${a[1]}' are the same file`);else if(m.files[from]===undefined)fail(`${cmd}: cannot stat '${a[0]}': No such file or directory`);else if(!m.dirs.includes(to.slice(0,to.lastIndexOf('/'))))fail(`${cmd}: target directory does not exist`);else{if(s.machine==='local'&&to.startsWith('/home/dev/jobs/')&&m.files[from].length>20000)throw Error('Job files can contain up to 20,000 characters.');storedFile(to,m.files[from]);m.files[to]=m.files[from];if(cmd==='mv')delete m.files[from];}}}
 else if(cmd==='sudo'||cmd==='apt'){
  const apt=cmd==='sudo'?a[0]==='apt':true;const sub=cmd==='sudo'?a[1]:a[0],names=cmd==='sudo'?a.slice(2):a.slice(1);
  if(!apt)fail('이 실습의 sudo는 apt 명령을 지원합니다.');
  else if(sub==='update'){m.updated=true;output='Hit:1 http://archive.ubuntu.game noble InRelease\nReading package lists... Done\n패키지 목록을 갱신했습니다. [게임 내 시뮬레이션]';}
  else if(sub==='install'){if(!m.updated)fail('E: Package lists are empty. Run sudo apt update first.');else{const packages=names.filter(x=>!x.startsWith('-'));const supported=['nodejs','npm','git','python3','python3-pip'];if(!packages.length)fail('E: 패키지 이름을 입력하세요.');else if(packages.some(x=>!supported.includes(x)))fail('E: 이 실습에서는 nodejs, npm, git, python3, python3-pip을 지원합니다.');else{const installed=[...packages];if(packages.includes('npm'))installed.push('nodejs');for(const t of installed)if(!m.tools.includes(t))m.tools.push(t);output=packages.map(t=>`Setting up ${t} ... done`).join('\n')+'\n가상 컴퓨터의 설치 상태가 갱신되었습니다.';}}}
  else if(sub==='list')output=m.tools.map(x=>x+' [installed]').join('\n');else fail('지원 명령: sudo apt update / install / list');
 }
 else if(cmd==='node'){if(requireTool('nodejs')){if(a[0]==='--version'||a[0]==='-v')output='v20.11.0 [simulated]';else fail('이 실습에서는 node --version과 npm 스크립트를 사용하세요.');}}
 else if(cmd==='npm'){
  if(requireTool('npm')){if(a[0]==='--version'||a[0]==='-v')output='10.2.4 [simulated]';else{const pkg=manifest();if(pkg){
   if(a[0]==='install'||a[0]==='i'){if(a.length>1)fail('이 실습은 package.json의 의존성을 설치하는 npm install을 지원합니다.');else if(!pkg.devDependencies?.vite)fail('npm ERR! 이 프로젝트는 devDependencies.vite가 필요합니다.');else{if(!m.dependencies.includes(m.cwd))m.dependencies.push(m.cwd);output='added 11 packages, and audited 12 packages\nfound 0 vulnerabilities\n[게임] 이 프로젝트의 의존성이 준비됐습니다.';}}
   else {const script=a[0]==='test'?'test':a[0]==='run'?a[1]:null;if(!script)fail('지원 명령: npm install / run dev / test / run build');else if(!pkg.scripts?.[script])fail(`npm ERR! Missing script: "${script}"`);else if(!m.dependencies.includes(m.cwd))fail('sh: 1: vite: not found\n프로젝트에서 npm install을 먼저 실행하세요.');else if(script==='dev'){if(pkg.scripts.dev!=='vite')fail('이 실습에서는 dev 스크립트의 vite 실행을 지원합니다.');else if(m.processes.frontend)fail('Error: listen EADDRINUSE: port 5173 is already in use');else{m.processes.frontend=true;m.frontendRoot=m.cwd;output='VITE v5.0.0  ready in 128 ms\n\n  Local: http://localhost:5173/\n\n[게임] 서버는 백그라운드에서 실행됩니다. pkill node로 종료.';log(s,'[local:5173] Vite 개발 서버 시작');}}
   else if(script==='test'){s.testRequest++;output='CODE:SHIFT CHECK\n현재 저장한 파일을 검사합니다. 검사 결과 패널을 확인하세요.';}
   else if(script==='build'){output='vite building for production...\n✓ 4 modules transformed.\ndist/index.html       1.64 kB\n✓ built in 184 ms [simulated]';}
   else fail('이 실습에서 지원하지 않는 npm 스크립트입니다.');}
  }}}
 }
 else if(cmd==='git'){
  if(requireTool('git')){if(a[0]==='--version')output='git version 2.43.0 [simulated]';else if(a[0]==='clone'){
   const url=a[1]?.replace(/\/$/,'');if(url!==REPO_URL&&url!==REPO_URL.replace(/\.git$/,''))fail(`fatal: repository '${a[1]??''}' not found\nCatHub 저장소의 복제 주소를 확인하세요.`);
   else{const path=commandPath(m.cwd,a[2]||'menu-site');if(m.dirs.includes(path))fail(`fatal: destination path '${path}' already exists and is not an empty directory.`);else if(s.machine==='server'&&path!==PROJECT)fail('이 서버 실습은 ~/menu-site 경로를 사용합니다. cd ~ 후 복제해 주세요.');else if(s.machine==='local'&&s.repo)fail('이 첫 버전은 하나의 작업 저장소를 지원합니다. 기존 프로젝트를 사용하세요.');else{const fs=s.repo?.remote.files??INITIAL_FILES;putFiles(m,path,fs);m.cloned=true;if(s.machine==='local'){const first=snapshot(INITIAL_FILES,'Initial cafe menu','c0000',0);s.repo={root:path,staged:{},commits:[first],remote:clone(first),merged:clone(first),deployed:clone(first),pr:null};}output=`Cloning into '${path.split('/').at(-1)}'...\nReceiving objects: 100% (8/8), done.\n이제 cd ${path.split('/').at(-1)} 로 폴더에 들어가세요.`;}}
  }else if(!inProject()||!m.cloned)fail('fatal: not a git repository (or any of the parent directories): .git');
  else if(s.machine==='server'){if(a[0]==='pull'){if(s.repo){validateFiles(PROJECT,s.repo.remote.files);for(const p of Object.keys(m.files))if(p.startsWith(PROJECT+'/'))delete m.files[p];putFiles(m,PROJECT,s.repo.remote.files);output=`Updating to ${s.repo.remote.id}\nFast-forward\n실행 중인 Python 프로세스는 재시작해야 수정본을 읽습니다.`;}}else if(a[0]==='status')output='On branch main\n서버 사본은 git pull로 갱신합니다.';else fail('서버 사본에서는 git pull / status를 지원합니다. 수정·커밋은 내 PC에서 진행하세요.');}
  else if(s.repo){const r=s.repo,working=projectFiles(s),head=r.commits.at(-1)!;
   if(a[0]==='status'){const staged=Object.keys(r.staged),dirty=dirtyFiles(s);output='On branch main\n'+(staged.length?'Changes to be committed:\n'+staged.map(k=>'  modified: '+k).join('\n')+'\n':'')+(dirty.filter(k=>working[k]!==r.staged[k]).length?'Changes not staged for commit:\n'+dirty.filter(k=>working[k]!==r.staged[k]).map(k=>'  modified: '+k).join('\n'):'')+(!dirty.length&&!staged.length?'nothing to commit, working tree clean':'');if(head.id!==r.remote.id)output+='\nYour branch is ahead of origin/main.';}
   else if(a[0]==='add'){if(!a[1])fail('Nothing specified, nothing added.');else{const paths=a.slice(1);const scope=m.cwd===r.root?'':m.cwd.slice(r.root.length+1)+'/';const selected=paths.includes('.')?[...new Set([...Object.keys(working),...Object.keys(head.files),...Object.keys(r.staged)])].filter(k=>k.startsWith(scope)):paths.map(p=>resolvePath(m.cwd,p).slice(r.root.length+1));if(selected.some(p=>working[p]===undefined&&head.files[p]===undefined&&!Object.hasOwn(r.staged,p)))fail('fatal: pathspec did not match any existing file');else{selected.forEach(k=>{if(working[k]!==head.files[k])r.staged[k]=working[k]??null;else delete r.staged[k];});output=`${Object.keys(r.staged).length} file(s) staged.`;}}}
   else if(a[0]==='commit'){const i=a.indexOf('-m');if(i<0||!a[i+1])fail('사용법: git commit -m "변경 설명"');else if(!Object.keys(r.staged).length)fail('no changes added to commit (use "git add")');else{const fs={...head.files};for(const [key,value] of Object.entries(r.staged)){if(value===null)delete fs[key];else fs[key]=value;}const commit=snapshot(fs,a[i+1],'c'+String(r.commits.length).padStart(4,'0'),s.mission);r.commits.push(commit);r.staged={};output=`[main ${commit.id}] ${commit.message}\n변경이 로컬 기록에 저장되었습니다. CatHub에는 push 후 반영됩니다.`;}}
   else if(a[0]==='push'){if(a[1]&&a[1]!=='origin')fail(`fatal: '${a[1]}' does not appear to be a git repository`);else if(a[2]&&a[2]!=='main')fail(`error: src refspec ${a[2]} does not match any`);else if(head.id===r.remote.id)output='Everything up-to-date';else{r.remote=clone(head);if(r.pr?.status==='approved')r.pr.status='changes-requested';output=`To ${REPO_URL}\n  ${head.id} main -> main\nCatHub의 원격 저장소가 갱신되었습니다.`;}}
   else if(a[0]==='pull')output='Already up to date.';
   else if(a[0]==='log')output=[...r.commits].reverse().map(c=>`commit ${c.id}\n    ${c.message}`).join('\n\n');
   else if(a[0]==='diff'){const names=dirtyFiles(s);output=names.length?names.map(k=>`diff --git a/${k} b/${k}\n--- committed\n${head.files[k]??''}\n+++ working\n${working[k]??''}`).join('\n'):'(변경 없음)';}
   else fail('이 입문 버전은 main 브랜치에서 clone, status, diff, add, commit, push, pull, log를 지원합니다.');
  }}
 }
 else if(cmd==='ssh'){if(!s.serverReady)fail('ssh: connect to host mono-server port 22: Connection refused\n서버 앱에서 Ubuntu를 먼저 준비하세요.');else if(a[0]!=='dev@mono-server')fail('ssh: Could not resolve hostname. 지원 주소: dev@mono-server');else{s.machine='server';output='Welcome to Ubuntu 24.04 LTS [simulated]\nConnected to mono-server. exit로 내 PC에 돌아갑니다.';}}
 else if(cmd==='exit'){if(s.machine==='server'){s.machine='local';output='Connection to mono-server closed.';}else output='작업실을 종료하려면 창을 닫으세요. 진행 상황은 자동 저장됩니다.';}
 else if(cmd==='pip'||cmd==='pip3'){if(requireTool('python3-pip')){if(a.join(' ')!=='install -r requirements.txt')fail('지원 명령: pip install -r requirements.txt');else if(!m.files[m.cwd+'/requirements.txt'])fail("ERROR: Could not open requirements file: No such file or directory");else{if(!m.pythonDeps.includes(m.cwd))m.pythonDeps.push(m.cwd);output='Successfully installed flask-3.0.0 [simulated]';}}}
 else if(cmd==='python3'){if(requireTool('python3')){if(a[0]==='--version')output='Python 3.12.0 [simulated]';else if(a[0]!=='server.py')fail('이 실습에서는 python3 server.py를 지원합니다.');else if(!m.files[m.cwd+'/server.py'])fail("python3: can't open file 'server.py': [Errno 2] No such file or directory");else if(!m.pythonDeps.includes(m.cwd))fail("ModuleNotFoundError: No module named 'flask'");else if(m.processes.backend)fail('Address already in use\nPort 8000 is in use. pkill python3로 종료하세요.');else{try{parseBackend(m.files[m.cwd+'/server.py']);m.processes.backend=true;m.backendRoot=m.cwd;m.backendSource=m.files[m.cwd+'/server.py'];if(s.machine==='server'){s.orders=[];s.apiEvidence={menu:false,order:false};}else s.localOrders=[];output=` * Running on http://${s.machine==='server'?'mono-server':'localhost'}:8000\n[게임] 백그라운드 실행. pkill python3로 종료.`;log(s,`[${s.machine}:8000] Python API 시작`);}catch(e){fail((e as Error).message);}}}}
 else if(cmd==='ps')output=['PID  COMMAND',...(m.processes.frontend?['1042 node vite --port 5173']:[]),...(m.processes.backend?['2081 python3 server.py']:[])].join('\n');
 else if(cmd==='pkill'){if(a[0]==='node'){m.processes.frontend=false;output='node process stopped. Port 5173 released.';}else if(a[0]==='python3'){m.processes.backend=false;m.backendSource=null;if(s.machine==='server'){s.orders=[];s.apiEvidence={menu:false,order:false};}else s.localOrders=[];output='python3 process stopped. Port 8000 released.';}else fail('지원 명령: pkill node / pkill python3');}
 else if(cmd==='curl'){const url=a.find(x=>x.startsWith('http'));if(!url)fail('사용법: curl http://mono-server:8000/api/menu');else{const result=apiRequest(s,'GET',url,'');s=result.state;output=`HTTP ${result.status||'CONNECTION ERROR'}\n`+JSON.stringify(result.data,null,2);error=result.status===0||result.status>=400;}}
 else fail(`${cmd}: command not found\n이 첫 버전에서 지원하는 명령은 help로 확인하세요.`);
 }catch(e){s=clone(state);s.notice='';fail((e as Error).message);}
 if(!error&&origin==='local'&&s.repo){
  if(cmd==='pwd'&&cwd===s.repo.root)s.gameplay.exploration.pwd=true;
  if(cmd==='ls'&&resolvePath(cwd,a.find(x=>!x.startsWith('-'))||'.')===s.repo.root)s.gameplay.exploration.ls=true;
  if(cmd==='cat'&&a[0]&&resolvePath(cwd,a[0])===s.repo.root+'/README.md')s.gameplay.exploration.readme=true;
 }
 if(input.trim())s.history.push({command:input,output,error,machine:origin,cwd});s.history=s.history.slice(-100);return {state:s,output,error};
}

export function apiRequest(state:GameState,method:string,path:string,body:string):{state:GameState;status:number;data:unknown}{
 const s=clone(state);s.notice='';let url:URL;try{url=new URL(path.startsWith('/')?'http://mono-server:8000'+path:path);}catch{return {state:s,status:0,data:{error:'INVALID_URL'}};}
 const id:MachineId=url.hostname==='mono-server'?'server':'local';const m=s.machines[id];
 if(!['mono-server','localhost','127.0.0.1'].includes(url.hostname)||url.port!=='8000'||!m.processes.backend||!m.backendSource)return {state:s,status:0,data:{error:'ERR_CONNECTION_REFUSED',hint:'해당 가상 컴퓨터의 8000번 포트에 API 서버가 실행 중인지 확인하세요.'}};
 let config;try{config=parseBackend(m.backendSource);}catch{return {state:s,status:500,data:{error:'INVALID_BACKEND_SOURCE'}};}
 let status=404,data:unknown={error:'Not Found',path:url.pathname};
 if(url.pathname===config.route&&method==='GET'){status=200;data=[{id:1,name:'아메리카노',price:4500}];if(id==='server'&&url.pathname==='/api/menu')s.apiEvidence.menu=true;}
 else if(url.pathname==='/api/orders'&&method==='POST'){let order;try{order=JSON.parse(body);}catch{return {state:s,status:400,data:{error:'Invalid JSON'}};}
  if(!order||typeof order.item!=='string'||!order.item.trim()||!Number.isInteger(order.quantity)||order.quantity<1||order.quantity>99)return {state:s,status:422,data:{error:'item 문자열과 1~99 정수 quantity가 필요합니다.'}};
  status=201;const store=id==='server'?s.orders:s.localOrders;const record={id:store.length+1,item:order.item,quantity:order.quantity};data={...record,stored:config.save};if(config.save){store.push(record);if(id==='server')s.apiEvidence.order=true;}
 }else if(url.pathname===config.route||url.pathname==='/api/orders'){status=405;data={error:'Method Not Allowed'};}
 log(s,`[${id}:8000] ${method} ${url.pathname} ${status}`);return {state:s,status,data};
}

export function missionSteps(s:GameState):{label:string;done:boolean;app:string;hint:string}[]{
 const r=s.repo,files=projectFiles(s);const tested=!!s.tests&&s.tests.hash===sourceHash(files)&&s.tests.mission===s.mission&&s.tests.checks.every(c=>c.passed)&&s.tests.checks.length===MISSIONS[s.mission].checkNames.length;
 if(s.mission===0)return [
  {label:'의뢰 수락',done:s.accepted,app:'missions',hint:'지우의 의뢰를 읽고 수락해 주세요.'},
  {label:'COOCLE에서 저장소 찾기',done:s.discovered.repo,app:'browser',hint:'그롬에서 mono cafe를 검색하고 CatHub 저장소를 열어 보세요.'},
  {label:'저장소를 내 PC로 복제',done:!!r,app:'terminal',hint:'CatHub의 복제 주소를 git clone 뒤에 입력하세요. 복제 후 cd menu-site로 이동해요.'},
  {label:'Node.js · npm 준비',done:s.machines.local.tools.includes('npm'),app:'terminal',hint:'npm을 찾지 못한다면 sudo apt update 후 sudo apt install nodejs npm을 실행하세요.'},
  {label:'의존성 설치 · 사이트 실행',done:!!r&&s.machines.local.dependencies.includes(r.root)&&isProjectServerRunning(s),app:'terminal',hint:'프로젝트 폴더에서 npm install, npm run dev를 순서대로 실행해 보세요.'},
  {label:'HTML · CSS 두 곳 수정 · 검사',done:tested,app:'editor',hint:'index.html의 h1 제목에 모노 카페를 넣고, style.css의 width: 960px을 width: 100%로 바꿔 보세요.'},
  {label:'커밋 · CatHub로 push',done:!!r&&r.remote.hash===sourceHash(files)&&r.remote.id!=='c0000',app:'terminal',hint:'git add . → git commit -m "Fix mobile menu" → git push. 세 단계는 서로 다른 상태를 저장해요.'},
  {label:'PR 검토 · 병합 · 배포',done:s.completed.includes(0),app:'browser',hint:'CatHub의 Pull requests에서 PR 검토를 요청하고, 통과하면 병합 후 배포하세요.'},
 ];
 return [
  {label:s.mission===1?'합계 함수 수정':'Python API 설정 수정',done:!!r&&files[MISSIONS[s.mission].file]!==INITIAL_FILES[MISSIONS[s.mission].file],app:'editor',hint:s.mission===1?'price와 quantity를 더하면 4,503이 돼요. 여러 잔의 가격을 구하는 연산은 무엇일까요?':'server.py에서 MENU_PATH와 SAVE_ORDERS를 읽어 보세요. 문서에 두 설정의 역할이 나와 있어요.'},
  ...(s.mission===2?[
   {label:'변경을 원격 저장소로 push',done:!!r&&r.remote.files['server.py']===files['server.py']&&files['server.py']!==INITIAL_FILES['server.py'],app:'terminal',hint:'서버는 CatHub의 원격 파일을 가져와요. 먼저 내 PC에서 변경을 커밋하고 push하세요.'},
   {label:'Ubuntu 서버 준비 · API 실행',done:s.serverReady&&s.machines.server.processes.backend,app:'server',hint:'서버 앱에서 Ubuntu를 준비한 다음, COOCLE 서버 문서의 설치·실행 순서를 따라가 보세요.'},
   {label:'API 조회 · 주문 전송',done:s.apiEvidence.menu&&s.apiEvidence.order,app:'api',hint:'GET /api/menu와 POST /api/orders를 보내 보세요. JSON의 quantity는 숫자여야 합니다.'},
  ]:[]),
  {label:'요구사항 검사 통과',done:tested,app:'editor',hint:'저장한 최신 파일로 검사를 실행하세요. 실패 항목의 실제 결과를 읽어 보세요.'},
  {label:'커밋 · push · PR 검토',done:!!r&&r.pr?.status==='merged'&&r.pr.commit.hash===sourceHash(files),app:'browser',hint:'최신 통과 버전을 add, commit, push한 다음 CatHub에서 검토를 요청하고 병합하세요.'},
  {label:'서비스 배포',done:s.completed.includes(s.mission),app:'browser',hint:'CatHub의 검토한 커밋을 배포하면 의뢰 보상을 받을 수 있어요.'},
 ];
}

export function runCodeChecks(s:GameState):Check[]{const fs=projectFiles(s);if(s.mission===1){return [[4500,3,13500],[5000,2,10000],[4500,0,0],[5500,1,5500]].map(([p,q,want],i)=>{try{const value=calculateTotal(fs['app.js']??'',p,q);return {name:MISSIONS[1].checkNames[i],passed:value===want,detail:`실제 결과: ${value.toLocaleString()}원`};}catch(e){return {name:MISSIONS[1].checkNames[i],passed:false,detail:(e as Error).message};}});}if(s.mission===2){const m=s.machines.server;let config;try{config=parseBackend(fs['server.py']??'');}catch{}const current=!!m.processes.backend&&m.backendSource===fs['server.py'];return [{name:MISSIONS[2].checkNames[0],passed:current&&config?.route==='/api/menu'&&s.apiEvidence.menu,detail:current?'API 클라이언트에서 GET 요청을 확인합니다.':'최신 server.py로 서버를 실행해 주세요.'},{name:MISSIONS[2].checkNames[1],passed:current&&s.apiEvidence.order,detail:'API 클라이언트에서 올바른 주문을 보내 주세요.'},{name:MISSIONS[2].checkNames[2],passed:current&&!!config?.save&&s.orders.length>0,detail:`현재 보관된 주문: ${s.orders.length}건`}];}return [];}
