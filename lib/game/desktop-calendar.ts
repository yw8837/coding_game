import {resolvePath,tokenize,type GameState} from './engine.ts';
import {parseTerminalInput} from './terminal-shell.ts';

export const DESKTOP_LOCALES={ko:'ko-KR',en:'en-US',ja:'ja-JP'} as const;
export type CalendarDay={date:Date;inMonth:boolean;today:boolean};

export function calendarMonth(date:Date,offset=0):Date{
 return new Date(date.getFullYear(),date.getMonth()+offset,1,12);
}

/** Calendar arithmetic uses local noon so daylight-saving changes do not shift dates. */
export function calendarWeeks(month:Date,today:Date):CalendarDay[][]{
 const first=calendarMonth(month),start=1-first.getDay();
 return Array.from({length:6},(_,week)=>Array.from({length:7},(_,day)=>{
  const date=new Date(first.getFullYear(),first.getMonth(),start+week*7+day,12);
  return {date,inMonth:date.getMonth()===first.getMonth(),today:date.getFullYear()===today.getFullYear()&&date.getMonth()===today.getMonth()&&date.getDate()===today.getDate()};
 }));
}

/** Only actual successful local editor commands qualify; removed files are omitted. */
export function recentEditorFiles(history:GameState['history'],files:Record<string,string>):string[]{
 const paths:string[]=[];
 for(let i=history.length-1;i>=0&&paths.length<3;i--){
  const entry=history[i];if(entry.error||entry.machine!=='local')continue;
  try{
   const input=parseTerminalInput(entry.command,tokenize),[command,...args]=tokenize(input.command);
   if(input.redirect||command!=='code'||args.length!==1||!args[0])continue;
   const path=resolvePath(entry.cwd,args[0]);
   if(entry.output!==`Opening ${path}`||!Object.hasOwn(files,path)||paths.includes(path))continue;
   paths.push(path);
  }catch{/* Invalid imported history is never offered as a file shortcut. */}
 }
 return paths;
}
