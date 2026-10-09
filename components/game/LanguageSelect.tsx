'use client';
import {useLanguage,useLanguagePreference,setLanguagePreference,type LanguagePreference} from '@/lib/game/i18n';

/** This preference changes display text only; game progress stays in its store. */
export function LanguageSelect({className,id,ariaLabel='Language'}:{className?:string;id?:string;ariaLabel?:string}){
 const language=useLanguage(),preference=useLanguagePreference();
 const current={ko:'한국어',en:'English',ja:'日本語'}[language];
 const automatic=language==='ko'?`자동 (현재: ${current})`:language==='ja'?`自動（現在: ${current}）`:`Automatic (current: ${current})`;
 return <select data-no-translate id={id} className={className} aria-label={ariaLabel} value={preference} onChange={event=>setLanguagePreference(event.target.value as LanguagePreference)}>
  <option value="auto">{automatic}</option>
  <option value="ko" lang="ko">한국어</option>
  <option value="en" lang="en">English</option>
  <option value="ja" lang="ja">日本語</option>
 </select>;
}
