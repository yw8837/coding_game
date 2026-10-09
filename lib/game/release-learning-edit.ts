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
  if(!/^\s*\.portal\s*\{\s*width\s*:\s*\d+(?:\.\d+)?\s*(px|%)\s*;?\s*\}\s*$/.test(content))return {ok:false,reason:'format'};
  content=content.replace(/(width\s*:\s*)[^;}]+/,'$1'+v);
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
