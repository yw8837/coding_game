import {isCafeName} from './cafe-name';
import type {Check,Files} from './engine.ts';
import {MISSIONS} from './content.ts';
import {translate,type Language} from './translations.ts';

function safeHtml(html:string,language:Language='ko'):string {
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,iframe,object,embed,link,meta,base,form,video,audio,source,animate,animateMotion,animateTransform,set').forEach(el=>el.remove());
 doc.querySelectorAll('*').forEach(el=>{for(const attr of Array.from(el.attributes)){if(/^on/i.test(attr.localName)||['src','srcset','href','action','formaction'].includes(attr.localName.toLowerCase()))el.removeAttribute(attr.name);}});
 if(language!=='ko'){
  const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node:Node|null;
  while((node=walker.nextNode())){if(node.parentElement?.closest('pre,code,style'))continue;node.textContent=translate(node.textContent??'',language);}
 }
 return doc.body.innerHTML;
}

export function previewDocument(files:Files,language:Language='ko'):string {
 const css=(files['style.css']??'').replace(/<\/style/gi,'<\\/style');
 return '<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src \'none\'; form-action \'none\'; base-uri \'none\'"><style>'+css+'</style></head><body>'+safeHtml(files['index.html']??'',language)+'</body></html>';
}

type Measurement={overflow:boolean;cards:number;visible:boolean;row:boolean;scrollWidth:number;title:boolean;colors:string[]};
function measure(files:Files,width:number):Promise<Measurement>{return new Promise((resolve,reject)=>{
 const frame=document.createElement('iframe');
 frame.setAttribute('sandbox','allow-same-origin');
 frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
 frame.style.cssText=`position:fixed;left:-12000px;top:0;width:${width}px;height:1600px;border:0;visibility:hidden;pointer-events:none;`;
 let ended=false;const timer=window.setTimeout(()=>finish(undefined,new Error('페이지 측정 시간이 초과됐어요. HTML/CSS를 확인해 주세요.')),3000);
 const finish=(result?:Measurement,err?:Error)=>{if(ended)return;ended=true;clearTimeout(timer);frame.remove();if(err)reject(err);else resolve(result!);};
 frame.onload=()=>{try{const doc=frame.contentDocument;if(!doc)throw new Error('미리보기를 읽을 수 없습니다.');const win=frame.contentWindow!;const cards=Array.from(doc.querySelectorAll('.menu-card'));const buttons=Array.from(doc.querySelectorAll('.order-button'));
  // Fractional desktop zoom can report a 44px button as 43.988px.
  const visible=(el:Element)=>{const r=el.getBoundingClientRect(),st=win.getComputedStyle(el);return r.width>=43.5&&r.height>=19.5&&r.left>=-1&&r.right<=width+1&&st.display!=='none'&&st.visibility!=='hidden'&&Number(st.opacity)>0;};
  const boxes=cards.map(el=>el.getBoundingClientRect());const scrollWidth=Math.max(doc.documentElement.scrollWidth,doc.body.scrollWidth);
  const heading=doc.querySelector('h1');
  finish({colors:buttons.map(el=>win.getComputedStyle(el).backgroundColor),title:!!heading&&visible(heading)&&isCafeName(heading.textContent??''),overflow:scrollWidth>width+1,scrollWidth,cards:cards.length,visible:cards.length===3&&buttons.length===3&&cards.every(visible)&&buttons.every(el=>visible(el)&&el.getBoundingClientRect().height>=43.5)&&['아메리카노','카페 라테','바닐라 라테'].every(name=>doc.body.textContent?.includes(name)),row:boxes.length===3&&boxes.every(b=>Math.abs(b.top-boxes[0].top)<2)&&boxes.every(b=>b.width>=149.5)});
 }catch(e){finish(undefined,e as Error);}};
 frame.srcdoc=previewDocument(files);document.body.appendChild(frame);
});}

export async function checkLayout(files:Files,targetColor?:string):Promise<Check[]>{
 try{const [mobile,desktop]=await Promise.all([measure(files,360),measure(files,1024)]);return [
  {name:MISSIONS[0].checkNames[0],passed:mobile.title&&desktop.title,detail:mobile.title&&desktop.title?'HTML의 큰 제목에 카페 이름이 표시돼요.':'index.html의 h1 태그 사이에 모노 카페를 넣어 주세요.'},
  {name:MISSIONS[0].checkNames[1],passed:!mobile.overflow&&mobile.visible,detail:`화면 360px / 콘텐츠 ${mobile.scrollWidth}px · 메뉴 ${mobile.cards}개`},
  {name:MISSIONS[0].checkNames[2],passed:desktop.row&&!desktop.overflow&&desktop.visible,detail:desktop.row?'PC에서 세 메뉴가 같은 줄에 있습니다.':'PC에서는 메뉴를 세 열로 유지해 주세요.'},
 ...(targetColor?[{name:'선택한 버튼 색상',passed:mobile.colors.length===3&&desktop.colors.length===3&&[...mobile.colors,...desktop.colors].every(c=>c===targetColor),detail:'모든 주문 버튼의 실제 배경색을 확인합니다.'}]:[]),
 ];}catch(e){return [...MISSIONS[0].checkNames,...(targetColor?['선택한 버튼 색상']:[])].map(name=>({name,passed:false,detail:(e as Error).message}));}
}
