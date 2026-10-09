import {CAREER_JOBS} from './career-content.ts';
import {evaluateCareer} from './career-evaluation.ts';

/** Frozen 0.11 attribute behavior; only used to retain already delivered saves. */
function legacyAttributes(tag:string):Record<string,string> {
 const attrs:Record<string,string>={},body=tag.replace(/^<\w+\s*|\/?\s*>$/g,'');
 const re=/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;let match:RegExpExecArray|null;
 while((match=re.exec(body)))attrs[match[1].toLowerCase()]=match[2]??match[3]??match[4]??'';
 return attrs;
}
function legacyBakery(files:Record<string,string>):boolean {
 const c=JSON.parse(files['pricing.json']);if(!c||Array.isArray(c)||typeof c!=='object')return false;
 const {unitPrice:unit,packSize:size,packPrice:pack}=c;
 if([unit,size,pack].some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0||n>10000000)||!Number.isInteger(size)||size<1||size>100)return false;
 const total=(n:number)=>Math.floor(n/size)*pack+(n%size)*unit;
 return [0,6,8,1,3].every((n,i)=>total(n)===[0,10000,13600,1800,5400][i]);
}
function legacyClinic(files:Record<string,string>):boolean {
 const html=files['booking.html'];
 if(/<\s*(script|iframe|object|embed|style)\b|\bon\w+\s*=|javascript\s*:|<\s*link\b/i.test(html))return false;
 const inputTag=html.match(/<input\b[^>]*>/i)?.[0],label=html.match(/<label\b([^>]*)>([^<]+)<\/label\s*>/i),button=html.match(/<button\b([^>]*)>([^<]+)<\/button\s*>/i);
 if(!inputTag||!label||!button||!/<form\b/i.test(html)||!/<\/form\s*>/i.test(html))return false;
 const input=legacyAttributes(inputTag),labelAttrs=legacyAttributes(`<label ${label[1]}>`),buttonAttrs=legacyAttributes(`<button ${button[1]}>`),formAttrs=legacyAttributes(html.match(/<form\b[^>]*>/i)![0]);
 const visibleForm=!Object.hasOwn(formAttrs,'hidden'),usableInput=visibleForm&&!Object.hasOwn(input,'disabled')&&!Object.hasOwn(input,'hidden');
 const validation=!Object.hasOwn(formAttrs,'novalidate')&&!Object.hasOwn(buttonAttrs,'formnovalidate');
 return usableInput&&!!input.id&&labelAttrs.for===input.id&&input.name==='name'&&!!label[2].trim()
  &&validation&&!Object.hasOwn(input,'readonly')&&Object.hasOwn(input,'required')&&(input.type??'text')==='text'
  &&visibleForm&&!Object.hasOwn(buttonAttrs,'disabled')&&!Object.hasOwn(buttonAttrs,'hidden')&&buttonAttrs.type==='submit'&&!!button[2].trim();
}
/** Save compatibility only. Live tests and deliveries always use evaluateCareer.
 * Revision describes local save lineage, not authentication or an anti-cheat boundary.
 * Only the two changed jobs retain their bounded 0.11 acceptance rules. */
export function deliveredCareerValid(id:string,files:Record<string,string>,rulesRevision:1|2):boolean {
 if(rulesRevision!==1||!['bakery-price','clinic-form'].includes(id))return evaluateCareer(id,files).passed;
 const job=CAREER_JOBS.find(j=>j.id===id)!;
 if(!files||typeof files!=='object'||Array.isArray(files)||Object.keys(job.files).some(path=>typeof files[path]!=='string'||files[path].length>20000))return false;
 try{return id==='bakery-price'?legacyBakery(files):legacyClinic(files);}catch{return false;}
}
