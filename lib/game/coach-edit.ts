import {projectFiles,type Action,type GameState} from './engine.ts';
import {coachRepair,type CoachStage} from './coach.ts';

export type CoachEdit='sign'|'size'|'rule'|'route'|'keep';
/** Direct controls edit one real source token; they never complete a mission. */
export function coachEdit(state:GameState,key:CoachEdit,value:string):Extract<Action,{type:'edit'}>|null {
 const files=projectFiles(state);
 const replace=(path:string,pattern:RegExp,change:(...match:string[])=>string)=>{
  const source=files[path];if(!source||!pattern.test(source))return null;
  return {type:'edit' as const,path,content:source.replace(pattern,change)};
 };
 if(key==='sign'){
  if(!value.trim()||value.length>60||/[\r\n]/.test(value))return null;
  const text=value.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return replace('index.html',/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i,(_all,start,end)=>start+text+end);
 }
 if(key==='size'){
  if(!/^\d{2,3}%$/.test(value)||parseInt(value)<50||parseInt(value)>180)return null;
  return replace('style.css',/(\.menu-grid\s*\{[^}]*?\bwidth\s*:)\s*[^;]+;/,(_all,start)=>start+' '+value+';');
 }
 if(key==='rule'){
  if(!['*','+','-','/'].includes(value))return null;
  return replace('app.js',/(return\s+price\s*)[+*\/-](\s*quantity)/,(_all,start,end)=>start+value+end);
 }
 if(key==='route'){
  if(!/^\/[a-zA-Z0-9/_-]{1,60}$/.test(value))return null;
  return replace('server.py',/^MENU_PATH\s*=.*$/m,()=>`MENU_PATH = "${value}"`);
 }
 if(!['True','False'].includes(value))return null;
 return replace('server.py',/^SAVE_ORDERS\s*=.*$/m,()=>`SAVE_ORDERS = ${value}`);
}
export type CoachEditIssue='multiply-sign'|'route-slash';
/** Names the most common beginner slip behind a rejected value. It explains; it never rewrites the value. */
export function coachEditIssue(key:CoachEdit,value:string):CoachEditIssue|null {
 const typed=value.trim();
 if(key==='rule'&&['×','x','X','✕'].includes(typed))return 'multiply-sign';
 if(key==='route'&&typed&&!typed.startsWith('/'))return 'route-slash';
 return null;
}

/** Saving a repair never chooses an answer: the submitted source is the player's complete draft. */
export function coachDraftEdit(state:GameState,stage:CoachStage,draft:string):Extract<Action,{type:'edit'}>|null {
 const repair=coachRepair(stage);if(!repair||typeof draft!=='string'||draft.length>60000)return null;
 const source=projectFiles(state)[repair.file];
 if(source===undefined||source===draft)return null;
 return {type:'edit',path:repair.file,content:draft};
}
/** Locating selects existing source only, so it works without writing a solution. */
export function coachRepairSelection(stage:CoachStage,source:string):[number,number]|null {
 const pattern=stage==='sign'?/<h1\b[^>]*>([^<]*)<\/h1>/i:stage==='size'?/\.menu-grid\s*\{[^}]*?\bwidth\s*:\s*([^;]+)/:stage==='rule'?/return\s+([^;\n}]+)/:stage==='route'?/^MENU_PATH\s*=\s*(.*)$/m:stage==='keep'?/^SAVE_ORDERS\s*=\s*(.*)$/m:null;
 const match=pattern?.exec(source);if(!match)return null;
 const start=match.index+match[0].lastIndexOf(match[1]);return [start,start+match[1].length];
}
