import {build} from 'esbuild';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const contents=`
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {TerminalView} from './components/game/Terminal';
import {setLanguage} from './lib/game/i18n';
import {prepareWorkspace} from './lib/game/assisted';
import {createGame,runCommand,act,projectFiles,sourceHash} from './lib/game/engine';
import {checkLayout} from './lib/game/preview';
export function mount(language){
 setLanguage(language);
 function Harness(){
  const [state,setState]=useState(()=>prepareWorkspace(createGame(),'full',language));
  const [testing,setTesting]=useState(false),[opened,setOpened]=useState('');
  const command=async(input)=>{
   const result=runCommand(state,input,'full',language);setState(result.state);
   if(result.state.testRequest!==state.testRequest){
    setTesting(true);const checks=await checkLayout(projectFiles(result.state));
    setState(current=>act(current,{type:'test-result',hash:sourceHash(projectFiles(result.state)),checks}));setTesting(false);
   }
  };
  window.terminalQaState=()=>state;
  return <><TerminalView state={state} onCommand={command} openFile={setOpened} testing={testing} queued="" onQueued={()=>{}}/><output id="opened-file">{opened}</output></>;
 }
 createRoot(document.getElementById('root')).render(<Harness/>);
}
`;
const bundle=await build({stdin:{contents,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,loader:{'.css':'empty'},format:'iife',globalName:'TerminalQA',define:{'process.env.NODE_ENV':'"production"'}});
const child=spawn('python',[fileURLToPath(new URL('./terminal-checks.py',import.meta.url))],{stdio:['pipe','inherit','inherit'],env:process.env});
child.stdin.end(JSON.stringify({script:bundle.outputFiles[0].text}));
child.on('error',error=>{throw error;});
child.on('exit',code=>{process.exitCode=code??1;});
