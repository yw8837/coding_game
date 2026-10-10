import type {Action,GameState} from './engine.ts';
import type {TerminalInput} from './terminal-shell.ts';

/** Edition is chosen by the entry point, never by a save or platform bridge. */
export type GameEdition='full'|'demo';
export const DEMO_LOCKED_MESSAGE='Web demo: Café chapters 1–3 and the OPEN ceremony are available. Client contracts, the final release, Code Lab and practice jobs belong to the full edition.';
export function demoLockedMessage(language:'ko'|'en'|'ja'):string{return language==='ko'?'웹 데모에서는 카페 1~3장과 OPEN 행사를 플레이할 수 있어요. 동네 의뢰, 최종 프로젝트, 코드 실험실과 연습 의뢰는 본편 콘텐츠입니다.':language==='ja'?'Webデモではカフェの第1〜3章と開店イベントを遊べます。まちの依頼、最後のプロジェクト、コード実験室と練習の依頼は本編の内容です。':DEMO_LOCKED_MESSAGE;}
const PRIVATE_ROOTS=['/home/dev/jobs','/home/dev/studio','/home/dev/code-lab'];
export function editionPath(cwd:string,path:string):string{
 let value=path||'/home/dev';
 if(value==='~'||value.startsWith('~/'))value='/home/dev'+value.slice(1);
 if(!value.startsWith('/'))value=cwd+'/'+value;
 const parts:string[]=[];for(const part of value.split('/')){if(!part||part==='.')continue;if(part==='..')parts.pop();else parts.push(part);}
 return '/'+parts.join('/');
}
export function editionAllowsPath(edition:GameEdition='full',path:string,cwd='/home/dev'):boolean{
 const resolved=editionPath(cwd,path);
 return edition!=='demo'||!PRIVATE_ROOTS.some(root=>resolved===root||resolved.startsWith(root+'/'));
}
export function editionAllowsProject(edition:GameEdition='full',root:string):boolean{
 const path=editionPath('/home/dev',root);
 return editionAllowsPath(edition,path)&&(edition!=='demo'||!PRIVATE_ROOTS.some(privateRoot=>privateRoot.startsWith(path==='/'?'/':path+'/')));
}
export function editionAllowsApp(edition:GameEdition='full',app:string):boolean{return edition!=='demo'||!['career','challenges'].includes(app);}
export function isDemoComplete(s:GameState):boolean{return [0,1,2].every(i=>s.completed.includes(i))&&s.gameplay.openingCelebrated;}
export function editionAllowsAction(s:GameState,action:Action,edition:GameEdition='full'):boolean{
 if(edition!=='demo')return true;
 if(/^(career|lab|practice)-/.test(action.type))return false;
 if(action.type==='genericfile-edit')return editionAllowsPath(edition,action.path,s.machines.local.cwd);
 if(action.type==='edit')return !s.repo||editionAllowsProject(edition,s.repo.root)&&editionAllowsPath(edition,action.path,s.repo.root);
 // A full save can carry its active repository into the demo.
 if(['open-pr','merge-pr','deploy','next-mission','request-tests','test-result'].includes(action.type)&&s.repo&&!editionAllowsProject(edition,s.repo.root))return false;
 return true;
}
export function editionAllowsCommand(s:GameState,args:readonly string[],redirect:TerminalInput['redirect'],edition:GameEdition='full'):boolean{
 if(edition!=='demo')return true;
 const [cmd,...operands]=args,cwd=s.machines[s.machine].cwd;
 if(redirect&&!editionAllowsPath(edition,redirect.target,cwd))return false;
 if(cmd==='node'&&!(['--version','-v'].includes(operands[0])&&operands.length===1))return false;
 if(['cat','ls','cd','code','mkdir','touch','cp','mv','rm','python3'].includes(cmd)){
  if(operands.some(p=>!editionAllowsPath(edition,p,cwd)))return false;
  if(cmd==='cd'&&operands[0]==='-'){
   const previous=s.history.findLast(h=>!h.error&&h.machine===s.machine&&h.cwd!==cwd&&/^cd(?:\s|$)/.test(h.command.trim()))?.cwd;
   if(previous&&!editionAllowsPath(edition,previous))return false;
  }
 }
 if((cmd==='cp'||cmd==='mv')&&operands.length===2){
  const from=editionPath(cwd,operands[0]),destination=editionPath(cwd,operands[1]);
  const final=s.machines[s.machine].dirs.includes(destination)?destination+'/'+from.split('/').at(-1):destination;
  if(!editionAllowsPath(edition,final))return false;
 }
 if(cmd==='git'){
  if(operands[0]==='clone'&&operands[2]&&!editionAllowsPath(edition,operands[2],cwd))return false;
  if(operands[0]==='add'&&operands.slice(1).some(p=>!editionAllowsPath(edition,p,cwd)))return false;
  if(operands[0]!=='clone'&&s.repo&&!editionAllowsProject(edition,s.repo.root))return false;
 }
 // Imported private cwd stays saved intact. Explicit cd/exit may leave it.
 if(!editionAllowsPath(edition,cwd)&&!['cd','exit','pwd','help','man','clear','whoami','uname'].includes(cmd)&&!(operands.length===1&&['--version','-v'].includes(operands[0])))return false;
 if(redirect&&!editionAllowsPath(edition,cwd)&&!redirect.target.startsWith('/')&&!redirect.target.startsWith('~/'))return false;
 return true;
}
