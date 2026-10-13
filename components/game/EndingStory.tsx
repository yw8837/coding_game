'use client';
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {ArrowLeft,ArrowRight,Pause,Play,SkipForward} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import {useLanguage} from '@/lib/game/i18n';
import {endingStoryScenes} from '@/lib/game/ending-story';
import '@/app/ending-story.css';

function reducedMotion(){return typeof window==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.gameReducedMotion==='true';}
function subscribeMotion(change:()=>void){
 const media=window.matchMedia('(prefers-reduced-motion: reduce)'),observer=new MutationObserver(change);
 media.addEventListener('change',change);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-game-reduced-motion']});
 return ()=>{media.removeEventListener('change',change);observer.disconnect();};
}

export type EndingStoryProps={serviceTitle?:string;serviceKind?:string;servicePurpose?:string;serviceImage?:string;version?:string;onCredits:()=>void;onClose:()=>void};
/** A presentation only. Ending progress is recorded by the parent, never by slide controls. */
export function EndingStory({serviceTitle,serviceKind,servicePurpose,serviceImage,version='1.0.0',onCredits,onClose}:EndingStoryProps){
 const language=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[language];
 const title=serviceTitle?.trim()||tr('나의 첫 작품','My first project','自分の最初の作品');
 const scenes=endingStoryScenes(title,serviceKind),[index,setIndex]=useState(0),[paused,setPaused]=useState(false);
 const reduce=useSyncExternalStore(subscribeMotion,reducedMotion,()=>true),ended=useRef(false),callbacks=useRef({onCredits,onClose});
 useEffect(()=>{callbacks.current={onCredits,onClose};},[onCredits,onClose]);
 const scene=scenes[index];
 const finish=useCallback(()=>{if(ended.current)return;ended.current=true;callbacks.current.onCredits();},[]);
 const dismiss=()=>{if(ended.current)return;ended.current=true;callbacks.current.onClose();};
 const next=useCallback(()=>{if(index===2)finish();else setIndex(value=>Math.min(2,value+1));},[index,finish,setIndex]);
 useEffect(()=>{
  if(paused||reduce)return;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const schedule=()=>{clearTimeout(timer);if(!document.hidden)timer=setTimeout(next,9000);};
  schedule();document.addEventListener('visibilitychange',schedule);
  return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',schedule);};
 },[index,next,paused,reduce]);
 return <Dialog open onOpenChange={open=>{if(!open)dismiss();}}><DialogContent className="ending-story" data-testid="ending-story" data-scene={scene.id} data-paused={paused||reduce} data-auto={!(paused||reduce)} data-no-translate showCloseButton={false} onEscapeKeyDown={event=>{event.preventDefault();finish();}} onKeyDown={event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||event.nativeEvent.isComposing)return;
  if(['ArrowRight','PageDown'].includes(event.key)){event.preventDefault();next();}
  else if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();setIndex(value=>Math.max(0,value-1));}
  else if(event.key==='Home'){event.preventDefault();setIndex(0);}
  else if(event.key==='End'){event.preventDefault();finish();}
  else if(event.key.toLowerCase()==='p'||event.key===' '&&!(event.target as HTMLElement).closest('button')){event.preventDefault();setPaused(value=>!value);}
 }}>
  <header className="ending-story-heading"><div><span>v{version}</span><DialogTitle>{tr('내가 만든 것이 쓰이는 날','The day your work finds its people','自分の作品が使われる日')}</DialogTitle></div><span className="ending-story-position" data-testid="ending-story-position">{index+1} / {scenes.length}</span><DialogDescription className="sr-only">{tr('세 장면을 지나 크레딧으로 이어집니다. 화살표로 장면 이동, P로 정지, Esc로 크레딧에 바로 이동합니다.','Three scenes lead to the credits. Arrow keys move between scenes, P pauses, and Escape goes straight to the credits.','3つの場面からクレジットへ進みます。矢印で場面を移動、Pで停止、Escでクレジットへ進みます。')}</DialogDescription></header>
  <div className="ending-story-content">
   <div className="ending-story-art" aria-hidden="true">{scenes.map((item,position)=><div key={item.id} className="ending-story-layer" data-active={position===index}><Image unoptimized fill sizes="(max-width:720px) 100vw, 1000px" src={item.image} alt="" priority={position===0}/></div>)}</div>
   <section className="ending-story-caption" aria-live="polite" aria-atomic="true"><h2 data-testid="ending-story-scene-title">{scene.heading[language]}</h2><p data-testid="ending-story-text">{scene.body[language]}</p>{index===0&&servicePurpose?.trim()&&<blockquote className="ending-story-purpose" data-testid="ending-story-purpose">{servicePurpose}</blockquote>}</section>
   {index===0&&serviceImage&&<figure className="ending-story-project"><Image unoptimized src={serviceImage} width={240} height={140} alt={title}/><figcaption>{title}</figcaption></figure>}
  </div>
  <footer className="ending-story-footer"><div className="ending-story-controls"><button type="button" className="outline-button" data-testid="ending-story-back" disabled={index===0} onClick={()=>setIndex(value=>Math.max(0,value-1))}><ArrowLeft size={16}/>{tr('이전 장면','Previous scene','前の場面')}</button><button type="button" className="outline-button" data-testid="ending-story-pause" disabled={reduce} aria-pressed={paused||reduce} onClick={()=>setPaused(value=>!value)}>{paused||reduce?<Play size={15}/>:<Pause size={15}/>}<span>{reduce?tr('직접 넘기기','Advance manually','手動で進む'):paused?tr('자동 넘기기 재개','Resume automatic advance','自動送りを再開'):tr('잠깐 멈추기','Pause here','ここで止める')}</span></button><button type="button" className="primary-button" data-testid="ending-story-next" onClick={next}>{index===2?tr('엔딩 크레딧 보기','View ending credits','クレジットを見る'):tr('다음 장면','Next scene','次の場面')}<ArrowRight size={16}/></button></div><div className="ending-story-footnote"><p>{paused||reduce?tr('읽고 나서 다음 장면을 눌러 주세요.','Take your time, then choose Next scene.','読み終えてから次の場面へ進みましょう。'):tr('장면마다 9초 · 언제든 멈추거나 직접 넘길 수 있어요.','9 seconds per scene · pause or advance at any time.','1場面9秒 · いつでも停止や手動送りができます。')}</p><button type="button" className="ending-story-skip" data-testid="ending-story-skip" onClick={finish}><SkipForward size={15}/>{tr('이야기 건너뛰기 · 크레딧으로','Skip the story · go to credits','物語をスキップ · クレジットへ')}</button></div><div key={index+':'+paused+':'+reduce} className="ending-story-timing" data-running={!(paused||reduce)} aria-hidden="true"><span/></div></footer>
 </DialogContent></Dialog>;
}
