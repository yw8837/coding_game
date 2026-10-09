import {projectFiles,type Action,type GameState} from './engine.ts';

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
