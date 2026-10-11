'use client';
import {useId} from 'react';
import {ArrowRight,Bug,Check,Coins,Crown,Database,FileCode2,Gift,GitCommitHorizontal,Globe,Keyboard,Layers,Lock,Map as MapIcon,Music,Palette,Rocket,Route,Server,Sparkles,Store,TerminalSquare,Trophy,type LucideIcon} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {LEVELS,LOADOUT_ITEMS,LOADOUT_SLOTS,MAX_LEVEL,SLOT_NAMES,effectiveLoadout,itemUnlocked,levelInfo,loadoutItem,unlocksAt,type LoadoutSlot} from '@/lib/game/progression';
import {ACHIEVEMENTS,earnedAchievements,type AchievementIcon} from '@/lib/game/achievements';
import {curriculum} from '@/lib/game/curriculum';
import type {GameProps} from './types';

const ACHIEVEMENT_ICONS:Record<AchievementIcon,LucideIcon>={git:GitCommitHorizontal,globe:Globe,bug:Bug,server:Server,store:Store,map:MapIcon,python:FileCode2,database:Database,rocket:Rocket,layers:Layers,crown:Crown};
const SLOT_ICONS:Record<LoadoutSlot,LucideIcon>={theme:Palette,terminal:TerminalSquare,keys:Keyboard,bgm:Music};
const RING=2*Math.PI*20;
const n=(v:number)=>v.toLocaleString('en-US');

/** 내 성장 / Growth / 成長 — level, roadmap, unlock road, loadout and achievements, all derived from the save. */
export function ProfileView(props:GameProps){
 const {state,onAction,onOpen}=props,lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang],uid=useId();
 const info=levelInfo(state.xp),max=info.next===null,pct=Math.round(info.progress*100),nextTitle=LEVELS[info.level]?.title[lang];
 const stages=curriculum(state),stagesDone=stages.filter(s=>s.status==='done').length,currentStage=stages.find(s=>s.status==='active')?.id;
 const loadout=effectiveLoadout(state),earned=new Set(earnedAchievements(state)),earnedCount=ACHIEVEMENTS.filter(a=>earned.has(a.id)).length;
 const status={locked:tr('잠김','Locked','ロック中'),active:tr('진행 중','In progress','進行中'),done:tr('완료','Complete','完了')};
 const xpText=max
  ?tr(`최고 레벨 달성 · 누적 ${n(state.xp)} XP`,`Max level reached · ${n(state.xp)} XP total`,`最高レベル到達 · 累計 ${n(state.xp)} XP`)
  :`${n(state.xp)} / ${n(info.next??0)} XP · `+tr(`다음 레벨까지 ${n(info.remaining)}`,`${n(info.remaining)} to next level`,`次のレベルまで ${n(info.remaining)}`);
 return <div className="prog-profile" data-testid="profile-view" data-no-translate>
  <section className={'prog-hero'+(max?' is-max':'')} aria-labelledby={uid+'-hero'}>
   <div className="prog-hero-badge" aria-hidden="true"><small>LEVEL</small><strong>{info.level}</strong></div>
   <div className="prog-hero-copy">
    <small className="prog-kicker">{tr('내 성장','GROWTH','成長')} · Lv.{info.level} / {MAX_LEVEL}</small>
    <h1 id={uid+'-hero'}>{info.title[lang]}</h1>
    <div className="prog-xp-bar" role="progressbar" aria-label={tr('다음 레벨까지 경험치','XP to next level','次のレベルまでの経験値')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={xpText}><span style={{width:pct+'%'}}/></div>
    <p className="prog-xp-text">{xpText}</p>
    {!max&&nextTitle&&<p className="prog-next-title">{tr('다음 칭호','Next title','次の称号')} · <b>Lv.{info.level+1} {nextTitle}</b></p>}
   </div>
   <div className="prog-hero-credits" title={tr('보유 크레딧','Credits','所持クレジット')}><Coins size={14} aria-hidden="true"/><span>{n(state.credits)} cr</span></div>
  </section>

  <section className="prog-section" aria-labelledby={uid+'-road'}>
   <header className="prog-section-head"><h2 id={uid+'-road'}><Route size={18} aria-hidden="true"/>{tr('커리큘럼 로드맵','Curriculum roadmap','カリキュラム・ロードマップ')}</h2><span className="prog-count">{stagesDone} / {stages.length}</span></header>
   <ol className="prog-path">{stages.map(stage=>{
    const ratio=stage.total?stage.done/stage.total:0,locked=stage.status==='locked',label=stage.status==='done'?tr('다시 보기','Revisit','もう一度見る'):tr('이어서 하기','Continue','続ける');
    return <li key={stage.id} className="prog-stage" data-status={stage.status} data-stage={stage.id} aria-current={stage.id===currentStage?'step':undefined}>
     <div className="prog-stage-node" aria-hidden="true"><svg viewBox="0 0 48 48"><circle className="prog-ring-track" cx="24" cy="24" r="20"/>{ratio>0&&<circle className="prog-ring-fill" cx="24" cy="24" r="20" style={{strokeDasharray:RING,strokeDashoffset:RING*(1-ratio)}}/>}</svg><span>{stage.status==='done'?<Check size={20}/>:locked?<Lock size={16}/>:stage.step}</span></div>
     <div className="prog-stage-body">
      <div className="prog-stage-top"><small>{tr(`${stage.step}단계`,`STEP ${stage.step}`,`STEP ${stage.step}`)}</small><span className="prog-pill" data-status={stage.status}>{status[stage.status]}</span></div>
      <h3>{stage.title[lang]}</h3>
      <p className="prog-stage-skills">{stage.skills[lang]}</p>
      <div className="prog-stage-progress"><span className="prog-mini-bar" aria-hidden="true"><span style={{width:Math.round(ratio*100)+'%'}}/></span><b>{stage.done} / {stage.total}<span className="sr-only">{tr(' 완료',' done',' 完了')}</span></b></div>
      {locked?<p className="prog-stage-unlock"><Lock size={12} aria-hidden="true"/>{stage.unlock[lang]}</p>:<button type="button" className="prog-btn prog-stage-open" onClick={()=>onOpen(stage.app)} aria-label={`${label} · ${stage.title[lang]}`}>{label}<ArrowRight size={14} aria-hidden="true"/></button>}
     </div>
    </li>;
   })}</ol>
  </section>

  <section className="prog-section" aria-labelledby={uid+'-unlock'}>
   <header className="prog-section-head"><h2 id={uid+'-unlock'}><Gift size={18} aria-hidden="true"/>{tr('해금 보상','Level rewards','解放報酬')}</h2><span className="prog-count">Lv.{info.level} / {MAX_LEVEL}</span></header>
   <ol className="prog-levels">{LEVELS.map(row=>{
    const reached=info.level>=row.level,current=info.level===row.level,items=unlocksAt(row.level);
    return <li key={row.level} className="prog-level" data-state={current?'current':reached?'reached':'locked'} aria-current={current?'true':undefined}>
     {current&&<span className="prog-level-now">{tr('현재','NOW','現在')}</span>}
     <header><span className="prog-level-num">Lv.{row.level}</span><strong>{row.title[lang]}</strong>{reached?<Check size={15} aria-hidden="true"/>:<Lock size={14} aria-hidden="true"/>}{reached&&<span className="sr-only">{tr('달성','Reached','到達')}</span>}</header>
     <small className="prog-level-xp">{n(row.xp)} XP</small>
     {items.length>0&&<ul>{items.map(item=>{const Icon=SLOT_ICONS[item.slot];return <li key={item.slot+item.id}><Icon size={13} aria-hidden="true"/><span><small>{SLOT_NAMES[item.slot][lang]}</small>{item.name[lang]}</span></li>;})}</ul>}
     {!reached&&<p className="prog-level-lock"><Lock size={11} aria-hidden="true"/>{tr(`Lv.${row.level}에 해금`,`Unlocks at Lv.${row.level}`,`Lv.${row.level}で解放`)}</p>}
    </li>;
   })}</ol>
  </section>

  <section className="prog-section" aria-labelledby={uid+'-loadout'}>
   <header className="prog-section-head"><h2 id={uid+'-loadout'}><Sparkles size={18} aria-hidden="true"/>{tr('장착','Loadout','装備')}</h2></header>
   <p className="prog-section-lead">{tr('레벨을 올려 얻은 테마·스킨·사운드를 골라 장착하세요. 잠긴 아이템은 표시된 레벨에 열려요.','Equip the themes, skins and sounds you earn by leveling up. Locked items open at the level shown.','レベルアップで手に入れたテーマ・スキン・サウンドを装備しましょう。ロック中のアイテムは表示のレベルで解放されます。')}</p>
   <div className="prog-equipped" role="group" aria-label={tr('현재 장착','Currently equipped','現在の装備')}>{LOADOUT_SLOTS.map(slot=>{const Icon=SLOT_ICONS[slot];return <span key={slot}><Icon size={14} aria-hidden="true"/><small>{SLOT_NAMES[slot][lang]}</small><b>{loadoutItem(slot,loadout[slot])?.name[lang]}</b></span>;})}</div>
   <div className="prog-slots">{LOADOUT_SLOTS.map(slot=>{const Icon=SLOT_ICONS[slot];return <fieldset key={slot} className="prog-slot" data-slot={slot}>
    <legend><Icon size={15} aria-hidden="true"/>{SLOT_NAMES[slot][lang]}</legend>
    <div className="prog-slot-items">{LOADOUT_ITEMS.filter(item=>item.slot===slot).map(item=>{
     const unlocked=itemUnlocked(state.xp,item),equipped=loadout[slot]===item.id;
     return <button key={item.id} type="button" className="prog-item" data-slot={slot} data-item={item.id} aria-pressed={equipped} disabled={!unlocked} onClick={()=>{if(!equipped)onAction({type:'equip-loadout',slot,id:item.id});}}>
      <span className="prog-item-swatch" aria-hidden="true"><Icon size={17}/></span>
      <span className="prog-item-copy"><strong>{item.name[lang]}</strong><small>{item.detail[lang]}</small></span>
      <span className="prog-item-state">{equipped?<><Check size={13} aria-hidden="true"/>{tr('장착 중','Equipped','装備中')}</>:unlocked?tr('장착','Equip','装備'):<><Lock size={12} aria-hidden="true"/>{tr(`Lv.${item.level}에 해금`,`Lv.${item.level} unlock`,`Lv.${item.level}で解放`)}</>}</span>
     </button>;
    })}</div>
   </fieldset>;})}</div>
  </section>

  <section className="prog-section" aria-labelledby={uid+'-ach'}>
   <header className="prog-section-head"><h2 id={uid+'-ach'}><Trophy size={18} aria-hidden="true"/>{tr('업적','Achievements','実績')}</h2><span className="prog-count">{earnedCount} / {ACHIEVEMENTS.length}</span></header>
   <ul className="prog-achievements">{ACHIEVEMENTS.map(a=>{const Icon=ACHIEVEMENT_ICONS[a.icon],got=earned.has(a.id);return <li key={a.id} className="prog-ach" data-earned={got}>
    <span className="prog-ach-icon" aria-hidden="true"><Icon size={22}/></span>
    <span className="prog-ach-copy"><strong lang="en">{a.title}</strong><small>{a.description[lang]}</small><span className="prog-ach-state">{got?<><Check size={12} aria-hidden="true"/>{tr('달성','Unlocked','達成')}</>:<><Lock size={11} aria-hidden="true"/>{tr('미달성','Locked','未達成')}</>}</span></span>
   </li>;})}</ul>
  </section>
 </div>;
}
