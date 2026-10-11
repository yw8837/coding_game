'use client';
import {useLanguage} from '@/lib/game/i18n';
import type {FeedbackPreferences} from '@/lib/game/feedback-preferences';
import type {Feedback} from '@/lib/game/audio-feedback';

export function FeedbackSettings({value,onChange,enabled,onToggle,onPreview}:{value:FeedbackPreferences;onChange:(next:FeedbackPreferences)=>void;enabled:boolean;onToggle:()=>void;onPreview:(cue:Feedback)=>void}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>lang==='ko'?ko:lang==='en'?en:ja;
 const sliders=[['master',tr('전체 음량','Master volume','全体音量')],['ui',tr('조작음','Interface sounds','操作音')],['events',tr('성공·보상음','Success and rewards','成功・報酬音')],['bgm',tr('배경음악','Background music','BGM')]] as const;
 return <section className="feedback-settings" data-testid="audio-settings" data-no-translate>
  <div className="settings-row"><div><strong>{tr('효과음','Sound effects','効果音')}</strong><p>{tr('조작은 가볍게, 성공과 보상은 또렷하게. 끄면 배경음악도 멈춰요.','Quiet controls, clear successes and rewards. Turning this off also stops the music.','操作音は軽く、成功と報酬ははっきり。オフにするとBGMも止まります。')}</p></div><button className="outline-button" aria-label={tr('효과음','Sound effects','効果音')} aria-pressed={enabled} onClick={onToggle}>{enabled?tr('켜짐','On','オン'):tr('꺼짐','Off','オフ')}</button></div>
  <div className="feedback-mixer">{sliders.map(([key,label])=><label key={key}><span>{label}<output>{value[key]}%</output></span><input type="range" min="0" max="100" step="1" aria-label={label} value={value[key]} onChange={e=>onChange({...value,[key]:Number(e.target.value)})}/></label>)}</div>
  <div className="feedback-previews"><span>{tr('미리 듣기','Preview','試聴')}</span>{([['click',tr('조작','Control','操作')],['success',tr('검사 통과','Test passed','テスト成功')],['reward',tr('보상','Reward','報酬')]] as const).map(([cue,label])=><button key={cue} className="outline-button" disabled={!enabled||value.master===0||(cue==='click'?value.ui:value.events)===0} onClick={()=>onPreview(cue)}>{label}</button>)}</div>
  <div className="settings-row"><div><strong>{tr('동작 줄이기','Reduce motion','動きを減らす')}</strong><p>{tr('짧은 보상·창 효과를 줄여요. 시스템 설정도 따릅니다.','Reduce reward and window effects. System preferences also apply.','報酬やウィンドウの演出を減らします。システム設定にも従います。')}</p></div><button className="outline-button" data-testid="reduce-motion" aria-pressed={value.reducedMotion} onClick={()=>onChange({...value,reducedMotion:!value.reducedMotion})}>{value.reducedMotion?tr('켜짐','On','オン'):tr('시스템 설정','System','システム')}</button></div>
 </section>;
}
