/** Friendly typo correction for the simulated shell. Suggestions are only text:
 * the player still decides to run them (Tab fills the input, nothing executes). */
export const KNOWN_COMMANDS=['clear','help','man','pwd','whoami','uname','echo','ls','cd','cat','grep','mkdir','touch','rm','rmdir','cp','mv','sudo','apt','code','node','npm','git','ssh','exit','pip','pip3','python3','ps','pkill','curl','sqlite3'] as const;
const SUBCOMMANDS:Record<string,readonly string[]>={git:['clone','status','diff','add','commit','push','pull','log'],npm:['install','test','run'],apt:['update','install','list']};
// Habits from other shells and common shorthand.
const ALIASES:Record<string,string>={python:'python3',py:'python3',sqlite:'sqlite3',dir:'ls',cls:'clear',type:'cat',copy:'cp',move:'mv',del:'rm',md:'mkdir',vim:'code',vi:'code',nano:'code',open:'code'};

/** Optimal string alignment distance: insertions, deletions, substitutions and adjacent swaps cost 1. */
export function editDistance(a:string,b:string):number{
 const d=Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  const cost=a[i-1]===b[j-1]?0:1;
  d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }
 return d[a.length][b.length];
}
function closest(word:string,candidates:readonly string[]):string|null{
 const lower=word.toLowerCase();if(!lower||lower.length>24)return null;
 if(candidates.includes(lower))return lower===word?null:lower;
 const limit=lower.length<=4?1:2;let best:string|null=null,score=limit+1;
 for(const candidate of candidates){const distance=editDistance(lower,candidate);if(distance<score){best=candidate;score=distance;}}
 return best;
}
/** Returns a corrected full command line, or null when nothing plausible fits. */
export function suggestCommand(input:string):string|null{
 const text=input.trim();if(!text||text.length>300)return null;
 const glued=/^cd(\.\.?|~)(\/.*)?$/.exec(text);
 if(glued)return 'cd '+glued[1]+(glued[2]??'');
 const match=/^(\S+)(\s+[\s\S]*)?$/.exec(text);if(!match)return null;
 const [,word,rest='']=match;
 const known=(KNOWN_COMMANDS as readonly string[]).includes(word);
 if(!known){
  const fixed=ALIASES[word.toLowerCase()]??closest(word,KNOWN_COMMANDS);
  return fixed?fixed+rest:null;
 }
 const subs=SUBCOMMANDS[word],sub=/^\s+(\S+)([\s\S]*)$/.exec(rest);
 if(!subs||!sub||sub[1].startsWith('-')||subs.includes(sub[1]))return null;
 const fixed=closest(sub[1],subs);
 return fixed?`${word} ${fixed}${sub[2]}`:null;
}
export const SUGGESTION_PREFIX='혹시 이거였나요? → ';
export const SUGGESTION_SUFFIX='  (Tab 키로 채우기)';
export function suggestionLine(input:string):string|null{const fixed=suggestCommand(input);return fixed?SUGGESTION_PREFIX+fixed+SUGGESTION_SUFFIX:null;}
