export type ReleaseEditResult={ok:true;file:string;content:string}|{ok:false;reason:'title'|'width'|'boolean'|'route'|'format'|'same'|'size'};
/** Build a bounded draft only. The UI must confirm that the engine saved it. */
export function releaseLearningEdit(index:number,files:Record<string,string>,value:string):ReleaseEditResult {
 const file=index===0?'index.html':index===1?'style.css':'server.json',v=value.trim();let content=files[file]??'';
 if(index===0){
  if(!v||Array.from(v).length>40||/[<>\x00-\x1f\x7f]/.test(v))return {ok:false,reason:'title'};
  if(!/^\s*<h1>[^<>]*<\/h1>\s*$/i.test(content))return {ok:false,reason:'format'};
  content=content.replace(/(<h1>)[\s\S]*?(<\/h1>)/i,(_match,open,close)=>open+v+close);
 }else if(index===1){
  if(!/^\d+(?:\.\d+)?(?:px|%)$/.test(v)||Number.parseFloat(v)>10000)return {ok:false,reason:'width'};
  if(!parseReleaseStyle(content).valid)return {ok:false,reason:'format'};
  content=content.replace(/([;{]\s*width\s*:\s*)[^;}]+/,'$1'+v);
 }else{
  if(index===2&&(!v||v.length>100||!v.startsWith('/')))return {ok:false,reason:'route'};
  if(index===3&&v!=='true'&&v!=='false')return {ok:false,reason:'boolean'};
  let data;try{data=JSON.parse(content);}catch{return {ok:false,reason:'format'};}
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==2||typeof data.route!=='string'||typeof data.saveRequests!=='boolean')return {ok:false,reason:'format'};
  if(index===2)data.route=v;else data.saveRequests=v==='true';content=JSON.stringify(data,null,2)+'\n';
 }
 if(content.length>20000)return {ok:false,reason:'size'};
 if(content===files[file])return {ok:false,reason:'same'};
 return {ok:true,file,content};
}
export function releaseItemLines(items:ReleaseItem[]):string {
 const escape=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\|/g,'\\|');
 return items.map(item=>[item.name,item.detail,item.category].map(escape).join(' | ')).join('\n');
}
function itemCells(line:string):string[]{
 const cells:string[]=[];let cell='';
 for(let index=0;index<line.length;index++){
  const ch=line[index];if(ch==='\\'&&(line[index+1]==='\\'||line[index+1]==='|')){cell+=line[++index];continue;}
  if(ch==='|'){cells.push(cell.trim());cell='';}else cell+=ch;
 }
 cells.push(cell.trim());return cells;
}
export function releaseAuthoringEdit(draft:{kind:ReleaseProduct['kind'];description:string;items:string;accent:ReleaseProduct['accent'];layout:ReleaseProduct['layout']}):{ok:true;content:string}|{ok:false;reason:'description'|'items'|'choice'}{
 if(!draft.description.trim()||Array.from(draft.description.trim()).length>240||/[\x00-\x1f\x7f]/.test(draft.description))return {ok:false,reason:'description'};
 const lines=draft.items.split('\n').filter(line=>line.trim());if(!lines.length||lines.length>12)return {ok:false,reason:'items'};
 const items=[];for(const line of lines){const cells=itemCells(line);if(cells.length<1||cells.length>3)return {ok:false,reason:'items'};items.push({name:cells[0],detail:cells[1]??'',category:cells[2]??''});}
 const content=JSON.stringify({kind:draft.kind,description:draft.description.trim(),items,accent:draft.accent,layout:draft.layout},null,2)+'\n';
 if(!parseReleaseProduct(content).valid)return {ok:false,reason:['directory','events','portfolio'].includes(draft.kind)&&['sage','ocean','amber'].includes(draft.accent)&&['list','cards'].includes(draft.layout)?'items':'choice'};
 return {ok:true,content};
}
import {parseReleaseStyle,parseReleaseProduct,type ReleaseProduct,type ReleaseItem} from './release-product.ts';
