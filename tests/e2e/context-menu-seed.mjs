import {mkdir,writeFile} from 'node:fs/promises';
import {createGame,runCommand} from '../../lib/game/engine.ts';
import {writeSave} from '../../lib/game/save.ts';

let state=createGame();
for(const command of ['sudo apt update','sudo apt install nodejs npm','git clone https://cathub.dev/mono/menu-site.git','cd menu-site','npm install']) {
  const result=runCommand(state,command);
  if(result.error)throw new Error(result.output);
  state=result.state;
}
let raw;
writeSave({setItem:(_key,value)=>{raw=value;}},state);
const output=new URL('../../output/context-menu-qa/',import.meta.url);
await mkdir(output,{recursive:true});
await writeFile(new URL('seed.json',output),raw);
