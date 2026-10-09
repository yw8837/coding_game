import {resolvePath,type GameState} from './engine.ts';
export function commandCompletions(s:GameState,input:string):string[]{
 const fixed=['help','pwd','ls','cd ~','cd ~/menu-site','cat README.md','sudo apt update','sudo apt install nodejs npm','sudo apt install git python3 python3-pip','npm install','npm run dev','npm test','npm run build','git clone https://cathub.dev/mono/menu-site.git','git status','git diff','git add .','git commit -m "Fix cafe"','git push','git pull','git log','ssh dev@mono-server','exit','pip install -r requirements.txt','python3 server.py','curl http://mono-server:8000/api/menu','ps','pkill node','pkill python3','clear'];
 const candidates=fixed.filter(c=>c.startsWith(input)&&c!==input);
 const match=input.match(/^(cd|cat|ls|git add|python3|pip install -r)\s+([^\n]*)$/);
 if(match){const [,cmd,partial]=match,token=partial.replace(/^"/,''),slash=token.lastIndexOf('/'),base=slash<0?'':token.slice(0,slash+1),fragment=token.slice(slash+1),machine=s.machines[s.machine],folder=resolvePath(machine.cwd,base||'.'),prefix=folder==='/'?'/':folder+'/';
  const paths=[...machine.dirs,...(cmd==='cd'?[]:Object.keys(machine.files))];
  for(const path of paths){if(!path.startsWith(prefix)||path===folder)continue;const rest=path.slice(prefix.length);if(rest.includes('/')||!rest.startsWith(fragment))continue;const value=base+rest+(machine.dirs.includes(path)?'/':'');candidates.push(cmd+' '+(/\s/.test(value)?'"'+value+'"':value));}
 }
 return [...new Set(candidates)].slice(0,12);
}
export type Completion={label:string;text:string;start:number;end:number};
export function codeCompletions(file:string,text:string,position:number):Completion[]{
 const prefix=text.slice(0,position).match(/[\w.-]+$/)?.[0]??'';
 if(!prefix)return [];
 const list=file.endsWith('.css')?['width: 100%;','background: #3678a8;','display: grid;','grid-template-columns: repeat(3, minmax(0, 1fr));','padding: 24px;','margin: 0;','color: #273b31;','border-radius: 12px;']:file.endsWith('.js')?['function','calculateTotal','price','quantity','return','const','let']:file.endsWith('.py')?['MENU_PATH','SAVE_ORDERS','True','False','return','request','jsonify']:file.endsWith('.html')?['h1','class','section','button','article','footer']:[];
 return list.filter(x=>x.startsWith(prefix)&&x!==prefix).map(x=>({label:x,text:x,start:position-prefix.length,end:position}));
}
export function indentSelection(text:string,start:number,end:number,outdent=false):{text:string;start:number;end:number}{
 const lineStart=text.lastIndexOf('\n',start-1)+1;
 if(start===end&&!outdent)return {text:text.slice(0,start)+'  '+text.slice(end),start:start+2,end:start+2};
 const block=text.slice(lineStart,end),lines=block.split('\n');
 const transformed=lines.map(l=>outdent?l.replace(/^( {1,2}|\t)/,''):'  '+l);
 const firstDelta=transformed[0].length-lines[0].length,total=transformed.join('\n');
 return {text:text.slice(0,lineStart)+total+text.slice(end),start:Math.max(lineStart,start+firstDelta),end:Math.max(lineStart,end+total.length-block.length)};
}
