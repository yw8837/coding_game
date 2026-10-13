import authoredRuntime from '../../desktop/authored-runtime.json' with {type:'json'};
export const AUTHORED_RUNTIME=authoredRuntime.source;
export const AUTHORED_RUNTIME_SHA256=authoredRuntime.sha256;
import {parseReleaseProduct,RELEASE_PROJECT_START,type ReleaseProduct} from './release-product.ts';

export type AuthoredFormat='website'|'webapp';
export type AuthoredLanguage='ko'|'en'|'ja';
export type AuthoredAsset={name?:string;dataUrl:string;alt?:string};
export const MAX_IMAGE_DATA_TOTAL=480000;
export const MAX_ASSETS_SOURCE=500000;
export const MAX_ASSETS=3;
export const MAX_AUTHORED_HTML_BYTES=512*1024;
export const AUTHORED_NONCE='codeshift-authored-v1';
export const AUTHORED_CSP=`default-src 'none'; script-src 'nonce-${AUTHORED_NONCE}'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'`;
const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const safeText=(value:unknown,max:number):value is string=>typeof value==='string'&&value.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);

/** Explicit opt-in only. An absent format retains byte-for-byte legacy interpretation. */
export function authoredProjectFormat(files:Record<string,string>):AuthoredFormat|null{
 try{const data=JSON.parse(files['project.json']);return object(data)&&['website','webapp'].includes(String(data.format))?data.format as AuthoredFormat:null;}catch{return null;}
}
export function authoredStartFiles(format:AuthoredFormat,language:AuthoredLanguage='ko'):Record<string,string>{
 const words={ko:{title:'내 프로젝트',body:'여기에 나만의 소개를 써 주세요.'},en:{title:'My project',body:'Write your own introduction here.'},ja:{title:'私のプロジェクト',body:'ここに自分の紹介を書いてください。'}}[language];
 return {'index.html':`<!doctype html>\n<html lang="${language}">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${words.title}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="portal">\n    <h1>${words.title}</h1>\n    <p>${words.body}</p>\n${format==='webapp'?'    <section data-app="items"></section>\n    <section data-app="inquiry"></section>\n':''}  </main>\n</body>\n</html>\n`,'style.css':'body { margin: 0; font-family: system-ui, sans-serif; background: #f5f3ed; color: #24332d; }\n.portal { width: 100%; max-width: 960px; margin: 0 auto; padding: 24px; box-sizing: border-box; }\nh1 { color: #356553; }\np { line-height: 1.7; }\n','server.json':JSON.stringify({route:format==='webapp'?'/api/places':'/places',saveRequests:format==='webapp'},null,2)+'\n','project.json':JSON.stringify({...RELEASE_PROJECT_START,version:1,format,language},null,2)+'\n'};
}

/** Decode bytes without Node APIs so validation is identical in the client and evaluator. */
function dataBytes(base64:string):Uint8Array|null{
 if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)||!base64)return null;
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',out:number[]=[];
 for(let i=0;i<base64.length;i+=4){const a=alphabet.indexOf(base64[i]),b=alphabet.indexOf(base64[i+1]),c=alphabet.indexOf(base64[i+2]),d=alphabet.indexOf(base64[i+3]);out.push((a<<2)|(b>>4));if(c>=0)out.push(((b&15)<<4)|(c>>2));if(d>=0)out.push(((c&3)<<6)|d);}
 return new Uint8Array(out);
}
function pngDimensions(bytes:Uint8Array):{width:number;height:number}|null{
 if(bytes.length<45||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return null;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let offset=8,width=0,height=0,hasData=false,chunks=0;
 while(offset+12<=bytes.length&&chunks++<1000){
  const size=view.getUint32(offset),name=String.fromCharCode(...bytes.slice(offset+4,offset+8)),end=offset+12+size;if(end>bytes.length||!/^[A-Za-z]{4}$/.test(name))return null;
  if(offset===8){if(name!=='IHDR'||size!==13)return null;width=view.getUint32(offset+8);height=view.getUint32(offset+12);if(!width||!height||width>4096||height>4096)return null;}
  else if(name==='IHDR')return null;
  if(name==='IDAT'&&size>0)hasData=true;
  if(name==='IEND')return size===0&&hasData?{width,height}:null;
  offset=end;
 }
 return null;
}
function jpegDimensions(bytes:Uint8Array):{width:number;height:number}|null{
 if(bytes.length<20||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)return null;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let position=2,width=0,height=0;
 const frames=new Set([192,193,194,195,197,198,199,201,202,203,205,206,207]);
 while(position+4<bytes.length){
  if(bytes[position++]!==255)return null;while(bytes[position]===255)position++;const marker=bytes[position++];
  if(marker===217)return null;if(marker===1||marker>=208&&marker<=215)continue;
  if(position+2>bytes.length)return null;const length=view.getUint16(position);if(length<2||position+length>bytes.length)return null;
  if(frames.has(marker)){if(length<8)return null;height=view.getUint16(position+3);width=view.getUint16(position+5);if(!width||!height||width>4096||height>4096)return null;}
  if(marker===218)return width&&height&&position+length<bytes.length-2?{width,height}:null;
  position+=length;
 }
 return null;
}

function webpDimensions(bytes:Uint8Array):{width:number;height:number}|null{
 if(bytes.length<30||![82,73,70,70].every((n,i)=>bytes[i]===n)||![87,69,66,80].every((n,i)=>bytes[8+i]===n))return null;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(view.getUint32(4,true)+8!==bytes.length)return null;
 let width=0,height=0,hasFrame=false;
 for(let offset=12;offset+8<=bytes.length;){
  const name=String.fromCharCode(...bytes.slice(offset,offset+4)),size=view.getUint32(offset+4,true),payload=offset+8;
  if(size<1||payload+size>bytes.length)return null;
  if(name==='VP8 '){if(size<10||(bytes[payload]&1)!==0||bytes[payload+3]!==157||bytes[payload+4]!==1||bytes[payload+5]!==42)return null;width=view.getUint16(payload+6,true)&16383;height=view.getUint16(payload+8,true)&16383;hasFrame=true;}
  if(name==='VP8L'){if(size<5||bytes[payload]!==47)return null;const bits=view.getUint32(payload+1,true);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;hasFrame=true;}
  if(name==='VP8X'){if(size!==10)return null;const w=bytes[payload+4]|bytes[payload+5]<<8|bytes[payload+6]<<16,h=bytes[payload+7]|bytes[payload+8]<<8|bytes[payload+9]<<16;if(w+1>4096||h+1>4096)return null;}
  offset=payload+size+(size%2);if(offset>bytes.length)return null;
 }
 return hasFrame&&width>=1&&height>=1&&width<=4096&&height<=4096?{width,height}:null;
}

export function validateAuthoredAssets(source:string|undefined):{valid:boolean;assets:Record<string,AuthoredAsset>;diagnostics:string[]}{
 const assets:Record<string,AuthoredAsset>={},bad=(message:string)=>({valid:false,assets:{},diagnostics:[message]});
 if(source===undefined)return {valid:true,assets,diagnostics:[]};
 if(!safeText(source,MAX_ASSETS_SOURCE))return bad('assets.json must fit within 500,000 characters.');
 let data:unknown;try{data=JSON.parse(source);}catch{return bad('assets.json must contain an image map.');}
 if(!object(data)||Object.keys(data).length>MAX_ASSETS)return bad('Import at most three images.');
 let total=0;
 for(const [id,asset] of Object.entries(data)){
  if(!/^[a-z][a-z0-9_-]{0,39}$/.test(id)||!object(asset)||!Object.keys(asset).every(key=>['name','dataUrl','alt'].includes(key))||!safeText(asset.dataUrl,MAX_IMAGE_DATA_TOTAL)||asset.name!==undefined&&!safeText(asset.name,160)||asset.alt!==undefined&&!safeText(asset.alt,240))return bad('Each image needs a short asset id and bounded name/alt text.');
  const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(asset.dataUrl);if(!match)return bad('Images must be embedded PNG, JPEG or WebP data.');
  const bytes=dataBytes(match[2]);if(!bytes||bytes.length<12)return bad('The image data is incomplete.');
  const png=pngDimensions(bytes)!==null;
  const jpeg=jpegDimensions(bytes)!==null;
  const webp=webpDimensions(bytes)!==null;
  if(!(match[1]==='png'&&png||match[1]==='jpeg'&&jpeg||match[1]==='webp'&&webp))return bad('Image bytes do not match the declared image type.');
  if(png){const view=new DataView(bytes.buffer),width=view.getUint32(16),height=view.getUint32(20);if(!width||!height||width>4096||height>4096)return bad('Image dimensions must be between 1 and 4096 pixels.');}
  total+=asset.dataUrl.length;if(total>MAX_IMAGE_DATA_TOTAL)return bad('The combined image data is too large.');
  Object.defineProperty(assets,id,{value:asset as AuthoredAsset,enumerable:true});
 }
 return {valid:true,assets,diagnostics:[]};
}

const TAGS=new Set('html head body title meta link main header footer nav section article aside div span h1 h2 h3 h4 h5 h6 p strong em b i small blockquote pre code ul ol li dl dt dd figure figcaption img a br hr time address details summary'.split(' '));
const VOID=new Set(['meta','link','img','br','hr']);
const ATTRIBUTES=new Set(['id','class','title','lang','dir','role','aria-label','aria-labelledby','aria-describedby','aria-hidden','data-app','alt','src','width','height','loading','href','rel','charset','name','content','datetime','open']);
const textEntities=(value:string)=>value.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity:string)=>{if(entity[0]==='#'){const n=entity[1].toLowerCase()==='x'?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '} as Record<string,string>)[entity.toLowerCase()];});
type HtmlResult={valid:boolean;bodyHtml:string;title:string;text:string;widgets:Set<string>;diagnostics:string[]};
/** Strict tokenization plus canonical serialization. No original markup reaches the browser. */
function passiveHtml(source:string,assets:Record<string,AuthoredAsset>):HtmlResult{
 const bad=(message:string):HtmlResult=>({valid:false,bodyHtml:'',title:'',text:'',widgets:new Set(),diagnostics:[message]});
 if(!safeText(source,20000))return bad('index.html must fit within 20,000 characters.');
 let position=0,html='',title='',text='',inHead=false,inTitle=false,bodySeen=false,bodyClosed=false;const stack:string[]=[],widgets=new Set<string>();
 while(position<source.length){
  if(source[position]!=='<') {const end=source.indexOf('<',position),value=textEntities(source.slice(position,end<0?source.length:end));if(inTitle)title+=value;else if(!inHead){html+=escape(value);text+=value+' ';}position=end<0?source.length:end;continue;}
  if(source.startsWith('<!--',position)){const end=source.indexOf('-->',position+4);if(end<0)return bad('Close the HTML comment with -->.');position=end+3;continue;}
  const doctype=/^<!doctype\s+html\s*>/i.exec(source.slice(position));if(doctype){if(position!==source.search(/\S/))return bad('Place the HTML doctype at the start.');position+=doctype[0].length;continue;}
  const closing=/^<\/([a-z][a-z0-9]*)\s*>/i.exec(source.slice(position));
  if(closing){const tag=closing[1].toLowerCase();if(stack.pop()!==tag)return bad('Close HTML tags in order: '+tag+'.');if(tag==='head')inHead=false;if(tag==='title')inTitle=false;if(tag==='body')bodyClosed=true;if(!['head','title','body','html'].includes(tag)&&!inHead)html+=`</${tag}>`;position+=closing[0].length;continue;}
  const start=/^<([a-z][a-z0-9]*)/i.exec(source.slice(position));if(!start)return bad('Use ordinary HTML tags; escape a literal < as &lt;.');const tag=start[1].toLowerCase();if(!TAGS.has(tag))return bad('Unsupported passive HTML tag: '+tag+'.');position+=start[0].length;
  const attrs:Record<string,string>={};let finished=false;
  while(position<source.length){const whitespace=/^\s*/.exec(source.slice(position))![0];position+=whitespace.length;const end=/^\/?\>/.exec(source.slice(position));if(end){if(end[0]==='/>'&&!VOID.has(tag))return bad('Use a closing tag for '+tag+'.');position+=end[0].length;finished=true;break;}
   if(!whitespace)return bad('Separate HTML attributes with spaces.');const attribute=/^([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/i.exec(source.slice(position));if(!attribute)return bad('Use quoted HTML attribute values.');const name=attribute[1].toLowerCase(),value=textEntities(attribute[2]??attribute[3]??attribute[4]??'');if(!ATTRIBUTES.has(name)||Object.hasOwn(attrs,name)||value.length>240||/[\x00-\x1f\x7f]/.test(value))return bad('Unsupported or duplicate HTML attribute: '+name+'.');attrs[name]=value;position+=attribute[0].length;
  }
  if(!finished)return bad('Close the HTML tag with >.');
  if(attrs.id==='authored-app-data')return bad('The id authored-app-data is reserved for the game-provided app runtime.');
  if(tag==='head'){if(stack.at(-1)!=='html'||bodySeen)return bad('Put head before body.');inHead=true;}
  if(tag==='body'){if(bodySeen||stack.at(-1)!=='html')return bad('Use one body inside html.');bodySeen=true;}
  if(bodyClosed&&tag!=='html')return bad('Put content inside body.');
  if(['title','meta','link'].includes(tag)&&!inHead)return bad('Put title, meta and link inside head.');
  if(inHead&&!['head','title','meta','link'].includes(tag))return bad('Only passive metadata belongs in head.');
  if(tag==='title')inTitle=true;
  if(attrs['data-app']!==undefined){if(!['items','inquiry'].includes(attrs['data-app'])||tag!=='section'||widgets.has(attrs['data-app']))return bad('Use one section each for data-app="items" and "inquiry".');widgets.add(attrs['data-app']);}
  if(attrs.href!==undefined&&!(tag==='a'&&/^#[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(attrs.href)||tag==='link'&&attrs.href==='style.css'&&attrs.rel==='stylesheet'))return bad('Links may point to a local section (#id), or the style.css stylesheet.');
  if(tag==='link'&&(attrs.rel!=='stylesheet'||attrs.href!=='style.css'))return bad('Use only <link rel="stylesheet" href="style.css">.');
  if(tag==='meta'&&!((attrs.charset??'').toLowerCase()==='utf-8'&&Object.keys(attrs).length===1||['viewport','description'].includes(attrs.name)&&safeText(attrs.content,240)&&Object.keys(attrs).every(key=>['name','content'].includes(key))))return bad('Only UTF-8, viewport and description metadata are supported.');
  if(attrs.src!==undefined){if(tag!=='img'||!/^asset:[a-z][a-z0-9_-]{0,39}$/.test(attrs.src))return bad('Images use src="asset:image-id" from assets.json.');const id=attrs.src.slice(6);if(!Object.hasOwn(assets,id))return bad('Image asset not found: '+id+'.');attrs.src=assets[id].dataUrl;if(!Object.hasOwn(attrs,'alt'))attrs.alt=assets[id].alt??'';}
  if(tag==='img'&&!attrs.src)return bad('Give the image an asset: source.');
  for(const key of ['width','height'])if(attrs[key]!==undefined&&!/^[1-9][0-9]{0,3}$/.test(attrs[key]))return bad('Image width and height must be positive pixels.');
  if(!VOID.has(tag))stack.push(tag);if(stack.length>32)return bad('HTML nesting is too deep.');
  if(!inHead&&!['html','body'].includes(tag))html+='<'+tag+Object.entries(attrs).map(([name,value])=>' '+name+'="'+escape(value)+'"').join('')+'>';
  if(html.length>MAX_AUTHORED_HTML_BYTES-20000)return bad('The rendered images and HTML are too large. Use each photo once, or import smaller images.');
 }
 if(stack.length)return bad('Close every HTML tag.');
 // Body fragments also work, keeping standard HTML visible without mandatory boilerplate.
 const heading=/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/.exec(html);if(!heading)return bad('Add an <h1> with your own project title.');const headingText=textEntities(heading[1].replace(/<[^>]*>/g,'')).trim();
 if(!headingText||headingText.length>120)return bad('Use a project title of 1–120 characters.');
 return {valid:true,bodyHtml:html,title:headingText||title.trim(),text:text.trim(),widgets,diagnostics:[]};
}

const CSS_PROPERTIES=new Set('color background background-color font-family font-size font-weight font-style line-height letter-spacing text-align text-decoration text-transform white-space overflow-wrap word-break width max-width min-width height min-height max-height margin margin-top margin-right margin-bottom margin-left margin-block margin-inline padding padding-top padding-right padding-bottom padding-left padding-block padding-inline display flex flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-content align-self justify-content gap row-gap column-gap grid-template-columns grid-template-rows grid-column grid-row border border-color border-width border-style border-top border-right border-bottom border-left border-radius box-shadow opacity box-sizing overflow overflow-x overflow-y list-style list-style-type object-fit object-position aspect-ratio cursor position top right bottom left inset z-index transform transform-origin vertical-align text-indent border-collapse border-spacing table-layout'.split(' '));
/** CSS is a grammar of selectors, declarations and bounded value tokens; no URL/string escapes. */
export function validateAuthoredCss(source:string):{valid:boolean;responsive:boolean;css:string;diagnostics:string[]}{
 const bad=(message:string)=>({valid:false,responsive:false,css:'',diagnostics:[message]});
 if(!safeText(source,20000))return bad('style.css must fit within 20,000 characters.');
 const clean=source.replace(/\/\*[\s\S]*?\*\//g,'').trim();if(!clean)return bad('Add CSS for your page.');
 let responsive=true,rules=0;
 function parseRules(input:string,minimumViewport=320,depth=0):string{
  if(depth>3)throw Error('Use at most three nested media queries.');
  let position=0,css='';
  while(position<input.length){
   const next=input.indexOf('{',position);if(next<0)throw Error('Each CSS selector needs { declarations }.');
   const selector=input.slice(position,next).trim();let nesting=1,end=next+1;
   while(end<input.length&&nesting){if(input[end]==='{')nesting++;if(input[end]==='}')nesting--;end++;}
   if(nesting)throw Error('Close each CSS rule with }.');
   const inner=input.slice(next+1,end-1);
   if(selector.startsWith('@media')){
    const media=/^@media\s+\((min|max)-width\s*:\s*([1-9][0-9]{1,3})px\)$/.exec(selector);
    if(!media)throw Error('Media queries support (min-width: Npx) or (max-width: Npx).');
    css+=selector+' {\n'+parseRules(inner,media[1]==='min'?Math.max(minimumViewport,Number(media[2])):minimumViewport,depth+1)+'}\n';
   }else{
    if(!selector||!/^[:.#a-zA-Z0-9_\s,>+*()\[\]="'-]+$/.test(selector)||selector.length>240)throw Error('Use simple HTML, class or id CSS selectors.');
    const selectorWithoutAttributes=selector.replace(/\[data-app=(?:"(?:items|inquiry)"|'(?:items|inquiry)')\]/g,'');
    if(/[\[\]="']/.test(selectorWithoutAttributes))throw Error('Only [data-app="items"] and [data-app="inquiry"] attribute selectors are supported.');
    if(/[{}]/.test(inner))throw Error('Nested CSS belongs inside an @media query.');
    let declarations='';
    for(const declaration of inner.split(';')){
     if(!declaration.trim())continue;
     const match=/^\s*((?:--)?[a-z][a-z0-9-]*)\s*:\s*(.*?)\s*$/.exec(declaration);
     if(!match||!CSS_PROPERTIES.has(match[1])&&!/^--[a-z][a-z0-9-]{0,39}$/.test(match[1]))throw Error('Unsupported CSS property: '+(match?.[1]??declaration.trim())+'.');
     const [,key,value]=match;
     if(!value||value.length>240||!/^[-#a-zA-Z0-9\s.,%()+*/"']+$/.test(value))throw Error('Use plain colors, sizes and layout values for '+key+'.');
     // Quoted font names are allowed; all other value tokens use the same closed grammar.
     const withoutStrings=value.replace(/"[^"]*"|'[^']*'/g,'font');
     if(/["']/.test(withoutStrings)||key!=='font-family'&&withoutStrings!==value)throw Error('Quoted strings are only supported in font-family.');
     const functions=[...withoutStrings.matchAll(/([a-zA-Z-]+)\s*\(/g)].map(m=>m[1].toLowerCase());
     if(functions.some(name=>!['rgb','rgba','hsl','hsla','min','max','minmax','clamp','repeat','calc','var','linear-gradient','radial-gradient','translate','translatex','translatey','scale','rotate'].includes(name)))throw Error('Unsupported CSS function in '+key+'.');
     let parentheses=0;
     for(const char of withoutStrings){if(char==='(')parentheses++;if(char===')'&&--parentheses<0)throw Error('Balance CSS parentheses.');}
     if(parentheses!==0)throw Error('Balance CSS parentheses.');
     if(['width','min-width'].includes(key)){
      const fixed=/^(\d+(?:\.\d+)?)(px|rem|em|vw|%)$/.exec(value);
      if(fixed){const size=Number(fixed[1]);if(fixed[2]==='px'&&size>minimumViewport||['rem','em'].includes(fixed[2])&&size*16>minimumViewport||['vw','%'].includes(fixed[2])&&size>100)responsive=false;}
     }
     if(key==='white-space'&&value==='nowrap')responsive=false;
     declarations+=key+': '+value+'; ';
    }
    css+=selector+' { '+declarations+'}\n';rules++;if(rules>100)throw Error('Use at most 100 CSS rules.');
   }
   position=end;while(position<input.length&&/\s/.test(input[position]))position++;
  }
  return css;
 }
 let css='';try{css=parseRules(clean);}catch(error){return bad(error instanceof Error?error.message:'Check CSS rules.');}
 return {valid:true,responsive,css,diagnostics:responsive?[]:['Use responsive widths (100%, auto, max-width) so narrow screens can fit the page.']};
}

export type AuthoredEvaluation={valid:boolean;authored:boolean;htmlValid:boolean;cssValid:boolean;responsive:boolean;assetsValid:boolean;projectValid:boolean;title:string;bodyHtml:string;css:string;diagnostics:string[];format:AuthoredFormat;product:ReleaseProduct;widgetsReady:boolean};
export function validateAuthoredRelease(files:Record<string,string>,expectedFormat?:AuthoredFormat):AuthoredEvaluation{
 const format=expectedFormat??authoredProjectFormat(files)??'website',assets=validateAuthoredAssets(files['assets.json']),html=passiveHtml(files['index.html']??'',assets.assets),css=validateAuthoredCss(files['style.css']??'');
 let data:Record<string,unknown>={};try{const value=JSON.parse(files['project.json']);if(object(value))data=value;}catch{/* Report below. */}
 const {format:declaredFormat,version,language,...productData}=data;
 const parsed=parseReleaseProduct(JSON.stringify(productData));
 const projectValid=declaredFormat===format&&version===1&&['ko','en','ja'].includes(String(language))&&parsed.valid;
 const starterTitles=['내 프로젝트','My project','私のプロジェクト','Untitled'];
 const starterBodies=['여기에 나만의 소개를 써 주세요.','Write your own introduction here.','ここに自分の紹介を書いてください。'];
 const ownText=starterBodies.reduce((text,placeholder)=>text.replaceAll(placeholder,''),html.text.replace(html.title,''));
 const authored=html.valid&&!starterTitles.some(title=>title.toLowerCase()===html.title.toLowerCase())&&(ownText.trim().length>0||/<img\s/.test(html.bodyHtml)&&assets.valid||format==='webapp'&&parsed.authored);
 const widgetsReady=format==='website'||html.widgets.has('items')&&html.widgets.has('inquiry')&&parsed.authored;
 const exportFits=new TextEncoder().encode(html.bodyHtml+css.css+JSON.stringify(parsed.product)).byteLength<=MAX_AUTHORED_HTML_BYTES-12000;
 const diagnostics=[...(!exportFits?['The HTML, CSS and photos exceed the portable export limit. Import smaller images or use fewer repeated photos.']:[]),...html.diagnostics,...css.diagnostics,...assets.diagnostics,...(!projectValid?['project.json needs version 1, format, language and the supported project fields.']:[]),...(!authored?['Write your own title and some body content, or add your own photo.']:[]),...(!widgetsReady?['Web apps need authored items and sections with data-app="items" and data-app="inquiry".']:[])];
 return {valid:html.valid&&css.valid&&css.responsive&&assets.valid&&projectValid&&authored&&widgetsReady&&exportFits,authored,htmlValid:html.valid&&exportFits,cssValid:css.valid,responsive:css.responsive,assetsValid:assets.valid&&exportFits,projectValid,title:html.title,bodyHtml:html.bodyHtml,css:css.css,diagnostics,format,product:parsed.product,widgetsReady};
}

const APP_WORDS={ko:{search:'목록 검색',category:'분류',all:'모두',empty:'조건에 맞는 항목이 없어요.',inquiry:'문의',save:'문의 보관',saved:'이 브라우저에 보관했습니다.',memory:'브라우저 저장소를 사용할 수 없어 이 미리보기 동안만 보관됩니다.',corrupt:'저장된 문의 형식을 읽을 수 없습니다. 기존 자료를 덮어쓰지 않았습니다.',invalid:'공백이 아닌 1~1,000자의 문의를 써 주세요.',limit:'문의 보관함이 가득 찼습니다 (최대 50개).',message:'문의 내용'},en:{search:'Search items',category:'Category',all:'All',empty:'No items match.',inquiry:'Inquiry',save:'Keep inquiry',saved:'Kept in this browser.',memory:'Browser storage is unavailable. Kept only during this preview.',corrupt:'Stored inquiries could not be read. Existing data was not overwritten.',invalid:'Write a nonblank message of 1–1,000 characters.',limit:'The inquiry box is full (maximum 50).',message:'Your message'},ja:{search:'一覧を検索',category:'分類',all:'すべて',empty:'条件に合う項目がありません。',inquiry:'問い合わせ',save:'問い合わせを保存',saved:'このブラウザに保存しました。',memory:'保存領域を使えないため、このプレビュー中だけ保持します。',corrupt:'保存された問い合わせを読めません。既存のデータは上書きしていません。',invalid:'空白以外の1～1,000文字で書いてください。',limit:'問い合わせが上限に達しました（最大50件）。',message:'問い合わせ内容'}};
const scriptJson=(value:unknown)=>JSON.stringify(value).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
/** One compiler serves iframe previews and exports. Only the game-owned runtime can execute. */
export function buildAuthoredHtml(files:Record<string,string>,language:AuthoredLanguage,appId='0000000000000000',extras?:{csp:string;head:string;tail:string},options?:{draft?:boolean;format?:AuthoredFormat}):string{
 const parsed=validateAuthoredRelease(files,options?.format);if(!parsed.valid&&!options?.draft)throw Error(parsed.diagnostics.join('\n'));if(!Object.hasOwn(APP_WORDS,language)||!/^[a-f0-9]{16}$/.test(appId))throw Error('Invalid authored export identity or language');
 const data={items:parsed.product.items,words:APP_WORDS[language],key:'codeshift-app-'+appId};
 const csp=extras?.csp?extras.csp.replace(/script-src ([^;]*)/,(_match,policy:string)=>'script-src '+policy.replace("'unsafe-inline'","'nonce-"+AUTHORED_NONCE+"'")):AUTHORED_CSP;
 const tail=extras?.tail?.replaceAll('<script>','<script nonce="'+AUTHORED_NONCE+'">')??'';
 const script=parsed.format==='webapp'&&parsed.htmlValid&&parsed.projectValid&&parsed.widgetsReady?`<script nonce="${AUTHORED_NONCE}" id="authored-app-data" type="application/json">${scriptJson(data)}</script><script nonce="${AUTHORED_NONCE}">${AUTHORED_RUNTIME}</script>`:'';
 const result=`<!doctype html>\n<html lang="${language}">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escape(csp)}"><title>${escape(parsed.title)}</title>${extras?.head??''}<style>* { box-sizing: border-box; } img { max-width: 100%; height: auto; } h1,h2,h3,p,li { overflow-wrap: anywhere; } ${parsed.css}</style></head>\n<body>${parsed.htmlValid?parsed.bodyHtml:'<main><p>'+escape(parsed.diagnostics[0]??'Check your HTML.')+'</p></main>'}${script}${tail}</body>\n</html>\n`;
 if(new TextEncoder().encode(result).byteLength>MAX_AUTHORED_HTML_BYTES){if(options?.draft)return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escape(AUTHORED_CSP)}"></head><body><p>The preview exceeds 512 KiB. Import smaller images or shorten the content.</p></body></html>`;throw Error('The exported HTML exceeds 512 KiB. Import smaller images or shorten the content.');}
 return result;
}
