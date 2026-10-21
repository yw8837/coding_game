import {resolvePath,tokenize,type GameState} from './engine.ts';
import {commandCompletions} from './input-tools.ts';

export function visibleTerminalHistory(history:GameState['history']):GameState['history']{
 const clear=history.findLastIndex(h=>{if(h.error)return false;try{const args=tokenize(h.command);return args.length===1&&args[0]==='clear';}catch{return false;}});
 return history.slice(clear+1);
}

/** Complete only the current argument, preserving options and earlier paths. */
export function terminalCompletions(state:GameState,input:string):string[]{
 const fixed=['cd -','cd /home/dev/code-lab','ls -la','ls -lh','echo ','echo -n ','cat ','grep -n ','cp ','mv ','rm ','rm -r ','rmdir ','touch ','mkdir -p ','code ','node run.cjs ','node --test '];
 const candidates=[...commandCompletions(state,input),...fixed.filter(c=>c.startsWith(input)&&c!==input)];
 let quote='',escape=false,start=0;
 for(let i=0;i<input.length;i++){
  const c=input[i];if(escape){escape=false;continue;}if(c==='\\'&&quote!=="'"){escape=true;continue;}
  if(quote){if(c===quote)quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if(/\s/.test(c))start=i+1;
 }
 if(!start)return [...new Set(candidates)].slice(0,12);
 const prefix=input.slice(0,start),partial=input.slice(start);let before:string[],token:string;
 try{before=tokenize(prefix);token=tokenize(partial+(quote||''))[0]??'';}catch{return [...new Set(candidates)].slice(0,12);}
 const command=before[0],redirection=/>>?\s*$/.test(prefix);
 const pathCommand=['cd','cat','grep','ls','cp','mv','rm','rmdir','touch','mkdir','python3','node','code'].includes(command)||command==='git'&&before[1]==='add'||command==='pip'&&before[1]==='install';
 if(!redirection&&!pathCommand)return [...new Set(candidates)].slice(0,12);
 if(token.startsWith('-'))return [...new Set(candidates)].slice(0,12);
 const slash=token.lastIndexOf('/'),base=slash<0?'':token.slice(0,slash+1),fragment=token.slice(slash+1),machine=state.machines[state.machine],folder=resolvePath(machine.cwd,base||'.'),root=folder==='/'?'/':folder+'/';
 for(const path of [...machine.dirs,...(['cd','rmdir'].includes(command)?[]:Object.keys(machine.files))]){
  if(!path.startsWith(root)||path===folder)continue;
  const rest=path.slice(root.length);if(rest.includes('/')||!rest.startsWith(fragment))continue;
  const value=base+rest+(machine.dirs.includes(path)?'/':'');
  const quoted=/[\s'"\\<>|&;$`]/.test(value)?"'"+value.replace(/'/g,"'\\''")+"'":value;
  const suggestion=prefix+quoted;if(suggestion!==input)candidates.push(suggestion);
 }
 return [...new Set(candidates)].slice(0,12);
}

export type TerminalCompletion={value:string;caret:number};

/** Replace the active shell token, leaving subsequent operands exactly as typed. */
export function terminalCompletionsAtCursor(state:GameState,input:string,caret=input.length):TerminalCompletion[]{
 const cursor=Math.max(0,Math.min(input.length,Math.trunc(caret)));
 let quote='',escape=false,end=cursor;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(i>=cursor&&!quote&&!escape&&/[\s<>|&;]/.test(c)){end=i;break;}
  if(escape)escape=false;
  else if(c==='\\'&&quote!=="'")escape=true;
  else if(quote){if(c===quote)quote='';}
  else if(c==='"'||c==="'")quote=c;
  end=i+1;
 }
 const tail=input.slice(end);
 return terminalCompletions(state,input.slice(0,cursor)).map(value=>({value:value+tail,caret:value.length}));
}
