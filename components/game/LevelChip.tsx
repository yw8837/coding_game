'use client';
import {useLanguage} from '@/lib/game/i18n';
import {levelInfo} from '@/lib/game/progression';

/** Compact top-bar level readout. Everything is derived from saved XP. */
export function LevelChip({xp,onClick}:{xp:number;onClick:()=>void}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const info=levelInfo(xp),max=info.next===null,pct=Math.round(info.progress*100),title=info.title[lang],n=(v:number)=>v.toLocaleString('en-US');
 const label=max
  ?tr(`레벨 ${info.level} ${title} · 최고 레벨 · 내 성장 열기`,`Level ${info.level} ${title} · Max level · Open Growth`,`レベル${info.level} ${title} · 最高レベル · 成長を開く`)
  :tr(`레벨 ${info.level} ${title} · ${n(xp)} / ${n(info.next??0)} XP · 다음 레벨까지 ${n(info.remaining)} XP · 내 성장 열기`,`Level ${info.level} ${title} · ${n(xp)} / ${n(info.next??0)} XP · ${n(info.remaining)} XP to next level · Open Growth`,`レベル${info.level} ${title} · ${n(xp)} / ${n(info.next??0)} XP · 次のレベルまで ${n(info.remaining)} XP · 成長を開く`);
 return <button type="button" className={'pc-level-chip'+(max?' is-max':'')} onClick={onClick} aria-label={label} title={label} data-level={info.level} data-testid="level-chip" data-no-translate>
  <span className="pc-level-chip-badge">Lv.{info.level}</span>
  <span className="pc-level-chip-meta" aria-hidden="true"><span className="pc-level-chip-title">{title}</span><span className="pc-level-chip-bar"><span style={{width:pct+'%'}}/></span></span>
 </button>;
}
