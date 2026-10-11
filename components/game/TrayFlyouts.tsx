'use client';
import {forwardRef} from 'react';
import {Volume2,VolumeX,Music,Settings2,Check,Languages} from 'lucide-react';
import {useLanguage,useLanguagePreference,setLanguagePreference,type LanguagePreference} from '@/lib/game/i18n';
import {effectsVolume,withEffectsVolume,type FeedbackPreferences} from '@/lib/game/feedback-preferences';

type SoundProps={value:FeedbackPreferences;onChange:(next:FeedbackPreferences)=>void;enabled:boolean;onToggle:()=>void;onMore:()=>void};
/** 작업 표시줄 스피커에서 여는 빠른 음량 조절. 세부 조작음/보상음 비율은 설정에서 바꾼다. */
export const SoundFlyout=forwardRef<HTMLElement,SoundProps>(function SoundFlyout({value,onChange,enabled,onToggle,onMore},ref){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>lang==='ko'?ko:lang==='en'?en:ja;
 const sliders=[
  {key:'master',label:tr('전체 음량','Master volume','全体音量'),level:value.master,set:(v:number)=>onChange({...value,master:v})},
  {key:'sfx',label:tr('효과음','Sound effects','効果音'),level:effectsVolume(value),set:(v:number)=>onChange(withEffectsVolume(value,v))},
  {key:'bgm',label:tr('배경음악','Background music','BGM'),level:value.bgm,set:(v:number)=>onChange({...value,bgm:v})},
 ];
 return <section ref={ref} id="workspace-sound" className="pc-flyout pc-sound-flyout" data-testid="tray-sound-panel" role="dialog" aria-labelledby="workspace-sound-title" data-no-translate>
  <header><h2 id="workspace-sound-title">{tr('소리','Sound','サウンド')}</h2><button type="button" data-testid="tray-mute" className={'pc-mute '+(enabled?'':'is-muted')} aria-pressed={!enabled} onClick={onToggle}>{enabled?<Volume2 size={16}/>:<VolumeX size={16}/>}{enabled?tr('음소거','Mute','ミュート'):tr('소리 켜기','Unmute','ミュート解除')}</button></header>
  <div className="pc-sound-sliders">{sliders.map(s=><label key={s.key} className={enabled?'':'is-muted'}><span>{s.key==='bgm'?<Music size={14}/>:<Volume2 size={14}/>}{s.label}<output>{s.level}%</output></span><input type="range" min="0" max="100" step="1" data-testid={'tray-volume-'+s.key} aria-label={s.label} value={s.level} onChange={e=>s.set(Number(e.target.value))}/></label>)}</div>
  {!enabled&&<p className="pc-flyout-note">{tr('음소거 중이에요. 음량은 기억해 둘게요.','Muted. Your levels are kept for later.','ミュート中です。音量は保存されています。')}</p>}
  <footer><button type="button" onClick={onMore}><Settings2 size={15}/>{tr('세부 소리 설정','More sound settings','詳しいサウンド設定')}</button></footer>
 </section>;
});

const LANGUAGES:readonly {id:LanguagePreference;label:string;short:string}[]=[{id:'ko',label:'한국어',short:'KO'},{id:'en',label:'English',short:'EN'},{id:'ja',label:'日本語',short:'JA'}];
/** 언어만 바로 바꾼다. 진행 상황과 코드는 그대로 유지된다. */
export const LanguageFlyout=forwardRef<HTMLElement,{onPicked:()=>void}>(function LanguageFlyout({onPicked},ref){
 const lang=useLanguage(),preference=useLanguagePreference(),tr=(ko:string,en:string,ja:string)=>lang==='ko'?ko:lang==='en'?en:ja;
 const pick=(id:LanguagePreference)=>{setLanguagePreference(id);onPicked();};
 return <section ref={ref} id="workspace-language" className="pc-flyout pc-language-flyout" data-testid="tray-language-panel" role="dialog" aria-labelledby="workspace-language-title" data-no-translate>
  <header><h2 id="workspace-language-title"><Languages size={15}/>{tr('언어','Language','言語')}</h2></header>
  <div className="pc-language-options">
   {LANGUAGES.map(l=><button type="button" key={l.id} lang={l.id} data-testid={'tray-language-'+l.id} aria-pressed={preference===l.id} onClick={()=>pick(l.id)}><b>{l.short}</b><span>{l.label}</span>{preference===l.id&&<Check size={15}/>}</button>)}
   <button type="button" data-testid="tray-language-auto" aria-pressed={preference==='auto'} onClick={()=>pick('auto')}><b>AUTO</b><span>{tr('기기 언어 따르기','Match device','端末に合わせる')}</span>{preference==='auto'&&<Check size={15}/>}</button>
  </div>
  <p className="pc-flyout-note">{tr('언어를 바꿔도 의뢰와 코드는 유지돼요.','Switching keeps your jobs and code.','言語を変えても依頼とコードはそのままです。')}</p>
 </section>;
});
