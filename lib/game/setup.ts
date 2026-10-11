import {runCommand,isProjectServerRunning,type GameState} from './engine.ts';
import {HOME,REPO_URL} from './content.ts';

export type SetupStep='copy'|'prepare'|'preview';

/** Read the real engine state; saved UI flags never determine readiness. */
export function setupReadiness(state:GameState){
 const local=state.machines.local,root=state.repo?.root;
 const copied=!!root;
 const tools=local.tools.includes('nodejs')&&local.tools.includes('npm');
 const dependencies=!!root&&local.dependencies.includes(root);
 const prepared=copied&&tools&&dependencies;
 const preview=prepared&&isProjectServerRunning(state);
 return {copied,tools,dependencies,prepared,preview,ready:preview};
}

function nextSetupCommand(state:GameState,step:SetupStep):string|null{
 const ready=setupReadiness(state),local=state.machines.local;
 if(step==='copy'&&ready.copied||step==='prepare'&&ready.prepared||step==='preview'&&ready.preview)return null;
 if(step!=='copy'&&!ready.copied||step==='preview'&&!ready.prepared)return null;
 if(state.machine!=='local')return 'exit';
 if(step==='copy'){
  if(!local.tools.includes('git'))return local.updated?'sudo apt install git':'sudo apt update';
  if(local.cwd!==HOME)return 'cd "'+HOME+'"';
  return 'git clone '+REPO_URL;
 }
 if(step==='prepare'&&!ready.tools)return local.updated?'sudo apt install nodejs npm':'sudo apt update';
 if(local.cwd!==state.repo!.root)return 'cd "'+state.repo!.root+'"';
 if(step==='prepare')return 'npm install';
 // A different project may own port 5173. Stop that process before starting ours.
 return local.processes.frontend?'pkill node':'npm run dev';
}

/** Each click performs only its named step, through the same terminal validator.
 * Return the command list for the UI to dispatch with onCommand. Stop on errors
 * so a broken package.json or occupied clone target remains visible to players.
 */
export function runSetupStep(state:GameState,step:SetupStep,edition:import('./edition.ts').GameEdition='full'){
 let next=state;
 const commands:string[]=[];
 let error=false,output='';
 for(let i=0;i<10;i++){
  const command=nextSetupCommand(next,step);if(!command)break;
  const result=runCommand(next,command,edition);
  commands.push(command);next=result.state;output=result.output;error=result.error;
  if(error)break;
 }
 return {state:next,commands,error,output,readiness:setupReadiness(next)};
}

export function setupCommands(state:GameState,step:SetupStep):string[]{return runSetupStep(state,step).commands;}

/** The single next command a player types to get from an empty PC to a running preview. */
export function guidedSetupCommand(state:GameState):string|null{
 for(const step of ['copy','prepare','preview'] as const){const command=nextSetupCommand(state,step);if(command)return command;}
 return null;
}
