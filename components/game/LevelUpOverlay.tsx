'use client';
import {useEffect,useId,useRef,type CSSProperties} from 'react';
import {ArrowRight,Keyboard,Music,Palette,Sparkles,TerminalSquare,Trophy,type LucideIcon} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {SLOT_NAMES,type LevelUp,type LoadoutSlot} from '@/lib/game/progression';
import type {Achievement} from '@/lib/game/achievements';

const SLOT_ICONS:Record<LoadoutSlot,LucideIcon>={theme:Palette,terminal:TerminalSquare,keys:Keyboard,bgm:Music};
// Deterministic burst so render stays pure; CSS turns it off under reduced motion.
const SPARKS=Array.from({length:22},(_,i)=>({angle:i*(360/22)+(i%2?6:-4),dist:130+(i%4)*42,size:4+(i%3)*2,delay:(i%5)*40,tone:i%3}));

/** Full-screen celebration for one level gained. Render with key={level.level} to replay for chained level-ups. */
export function LevelUpOverlay({level,onClose,onEquip}:{level:LevelUp;onClose:()=>void;onEquip?:()=>void}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang],uid=useId();
 const dialog=useRef<HTMLDivElement>(null),confirm=useRef<HTMLButtonElement>(null),close=useRef(onClose);
 useEffect(()=>{close.current=onClose;});
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  confirm.current?.focus();
  return()=>{if(previous?.isConnected)previous.focus();};
 },[]);
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current();return;}
   if(e.key!=='Tab'||!dialog.current)return;
   const items=Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled)'));if(!items.length)return;
   const first=items[0],last=items[items.length-1],active=document.activeElement;
   if(!dialog.current.contains(active)){e.preventDefault();first.focus();}
   else if(e.shiftKey&&active===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&active===last){e.preventDefault();first.focus();}
  };
  window.addEventListener('keydown',onKey,true);return()=>window.removeEventListener('keydown',onKey,true);
 },[]);
 const from=Math.max(1,level.level-1);
 return <div className="prog-lvup" data-testid="level-up-overlay" data-no-translate onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
  <div className="prog-lvup-burst" aria-hidden="true"><span className="prog-lvup-rays"/><span className="prog-lvup-ring"/><span className="prog-lvup-ring is-late"/>{SPARKS.map((s,i)=><i key={i} data-tone={s.tone} style={{'--a':s.angle+'deg','--d':s.dist+'px','--s':s.size+'px','--delay':s.delay+'ms'} as CSSProperties}/>)}</div>
  <div ref={dialog} className="prog-lvup-card" role="dialog" aria-modal="true" aria-labelledby={uid+'-title'} aria-describedby={uid+'-desc'}>
   <p className="prog-lvup-kicker">{tr('레벨이 올랐어요','You leveled up','レベルが上がりました')}</p>
   <h2 id={uid+'-title'} className="prog-lvup-title" data-text="LEVEL UP!">LEVEL UP!</h2>
   <div className="prog-lvup-levels" role="img" aria-label={`Lv.${from} → Lv.${level.level}`}><span className="prog-lvup-from">Lv.{from}</span><ArrowRight size={26} className="prog-lvup-arrow"/><span className="prog-lvup-to"><small>Lv.</small><b>{level.level}</b></span></div>
   <div id={uid+'-desc'} className="prog-lvup-copy"><small>{tr('새 칭호','New title','新しい称号')}</small><strong>{level.title[lang]}</strong></div>
   {level.unlocks.length>0?<section className="prog-lvup-unlocks" aria-labelledby={uid+'-unlocks'}>
    <h3 id={uid+'-unlocks'}>{tr('새로 열린 보상','New unlocks','新しく解放された報酬')}</h3>
    <ul>{level.unlocks.map((item,i)=>{const Icon=SLOT_ICONS[item.slot];return <li key={item.slot+item.id} style={{'--i':i} as CSSProperties}><span className="prog-lvup-item-icon" aria-hidden="true"><Icon size={18}/></span><span><small>{SLOT_NAMES[item.slot][lang]}</small><strong>{item.name[lang]}</strong><em>{item.detail[lang]}</em></span></li>;})}</ul>
   </section>:<p className="prog-lvup-none">{tr('새 칭호를 얻었어요. 다음 레벨에 더 많은 보상이 기다려요!','You earned a new title. More rewards wait at the next level!','新しい称号を手に入れました。次のレベルにはもっと報酬が待っています！')}</p>}
   <div className="prog-lvup-actions">
    {onEquip&&level.unlocks.length>0&&<button type="button" className="prog-btn" onClick={onEquip}><Sparkles size={15} aria-hidden="true"/>{tr('장착하러 가기','Go equip','装備しに行く')}</button>}
    <button ref={confirm} type="button" className="prog-btn prog-btn-primary" onClick={onClose}>{tr('확인','OK','OK')}</button>
   </div>
  </div>
 </div>;
}

/** Steam/Xbox-style toast. Calls onDone after ~4.2s; render with key={achievement.id} for queued toasts. */
export function AchievementToast({achievement,onDone}:{achievement:Achievement;onDone:()=>void}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang],done=useRef(onDone);
 useEffect(()=>{done.current=onDone;});
 useEffect(()=>{const timer=window.setTimeout(()=>done.current(),4200);return()=>window.clearTimeout(timer);},[achievement.id]);
 return <div className="prog-ach-toast" role="status" data-testid="achievement-toast" data-no-translate>
  <span className="prog-ach-toast-icon" aria-hidden="true"><Trophy size={26}/></span>
  <span className="prog-ach-toast-copy"><small>{tr('업적 달성','Achievement unlocked','実績解除')}</small><strong lang="en">{achievement.title}</strong><span>{achievement.description[lang]}</span></span>
  <i aria-hidden="true"/>
 </div>;
}
