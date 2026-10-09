export type ReleaseItem={name:string;detail:string;category:string};
export type ReleaseProduct={kind:'directory'|'events'|'portfolio';description:string;items:ReleaseItem[];accent:'sage'|'ocean'|'amber';layout:'list'|'cards'};
export const RELEASE_PROJECT_START:ReleaseProduct={kind:'directory',description:'',items:[],accent:'sage',layout:'list'};
export const RELEASE_PROJECT_SOURCE=JSON.stringify(RELEASE_PROJECT_START,null,2)+'\n';
const exact=(value:unknown,keys:string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const text=(value:unknown,max:number)=>typeof value==='string'&&Array.from(value).length<=max&&!/[\x00-\x1f\x7f]/.test(value);
/** Optional legacy data stays absent; every rendered new field is bounded, inert text. */
export function parseReleaseProduct(source:string|undefined):{present:boolean;valid:boolean;authored:boolean;product:ReleaseProduct}{
 const fallback={...RELEASE_PROJECT_START,items:[]};
 if(source===undefined)return {present:false,valid:true,authored:true,product:fallback};
 let data;try{if(source.length>20000)throw Error();data=JSON.parse(source);}catch{return {present:true,valid:false,authored:false,product:fallback};}
 const valid=exact(data,['kind','description','items','accent','layout'])&&typeof data.kind==='string'&&['directory','events','portfolio'].includes(data.kind)&&text(data.description,240)&&typeof data.accent==='string'&&['sage','ocean','amber'].includes(data.accent)&&typeof data.layout==='string'&&['list','cards'].includes(data.layout)&&Array.isArray(data.items)&&data.items.length<=12&&data.items.every(item=>exact(item,['name','detail','category'])&&text(item.name,80)&&!!(item.name as string).trim()&&text(item.detail,160)&&text(item.category,32));
 if(!valid)return {present:true,valid:false,authored:false,product:fallback};
 const product:ReleaseProduct={kind:data.kind as ReleaseProduct['kind'],description:(data.description as string).trim(),items:(data.items as ReleaseItem[]).map(item=>({name:item.name.trim(),detail:item.detail.trim(),category:item.category.trim()})),accent:data.accent as ReleaseProduct['accent'],layout:data.layout as ReleaseProduct['layout']};
 return {present:true,valid:true,authored:!!product.description&&product.items.length>=1,product};
}
export function filterReleaseItems(items:ReleaseItem[],query:string,category:string):ReleaseItem[]{
 const needle=query.trim().slice(0,120).toLocaleLowerCase();return items.filter(item=>(!category||item.category===category)&&(!needle||[item.name,item.detail,item.category].some(value=>value.toLocaleLowerCase().includes(needle))));
}
export type ReleaseStyle={width:string;maxWidth?:string;boxSizing:'border-box'|'content-box';padding:number;margin?:string};
/** Interpret only a single inert portal rule, never execute or inject arbitrary CSS. */
export function parseReleaseStyle(source:string):{valid:boolean;responsive:boolean;style:ReleaseStyle}{
 const style:ReleaseStyle={width:'',boxSizing:'border-box',padding:16};
 if(typeof source!=='string'||source.length>20000)return {valid:false,responsive:false,style};
 const rule=/^\s*\.portal\s*\{([^{}]*)\}\s*$/.exec(source);if(!rule)return {valid:false,responsive:false,style};
 const seen=new Set<string>();
 for(const declaration of rule[1].split(';')){
  if(!declaration.trim())continue;const part=/^\s*([a-z-]+)\s*:\s*([^:]+)\s*$/.exec(declaration);if(!part||seen.has(part[1]))return {valid:false,responsive:false,style};const key=part[1],value=part[2].trim();seen.add(key);
  if(key==='width'||key==='max-width'){
   if(value==='auto'&&key==='width'){style.width='auto';continue;}
   const size=/^(\d+(?:\.\d+)?)(px|%)$/.exec(value);if(!size||Number(size[1])>10000||Number(size[1])<=0)return {valid:false,responsive:false,style};
   if(key==='width')style.width=Number(size[1])+size[2];else style.maxWidth=Number(size[1])+size[2];
  }else if(key==='box-sizing'&&(value==='border-box'||value==='content-box'))style.boxSizing=value;
  else if(key==='padding'&&/^(?:0|\d+(?:\.\d+)?px)$/.test(value)&&Number.parseFloat(value)<=48)style.padding=Number.parseFloat(value);
  else if(key==='margin'&&(value==='0'||value==='0 auto'))style.margin=value;
  else return {valid:false,responsive:false,style};
 }
 if(!style.width)return {valid:false,responsive:false,style};
 const pixels=(value:string,viewport:number)=>value==='auto'?viewport:value.endsWith('%')?viewport*Number.parseFloat(value)/100:Number.parseFloat(value);
 const responsive=[320,360,960].every(viewport=>{
  const extra=style.boxSizing==='content-box'?style.padding*2:0;
  // An auto content box shrinks its content width to leave room for padding.
  const base=style.width==='auto'?Math.max(0,viewport-extra):pixels(style.width,viewport);
  const width=Math.min(base,style.maxWidth?pixels(style.maxWidth,viewport):Infinity)+extra;
  return width>=Math.min(viewport*.8,640)&&width<=viewport+.01;
 });
 return {valid:true,responsive,style};
}
