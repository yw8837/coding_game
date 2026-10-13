'use client';
import {useState} from 'react';
import {useLanguage} from '@/lib/game/i18n';
import type {AuthoredFormat} from '@/lib/game/release-authored';
import type {GameProps} from './types';

export function ProjectUpgrade({props,disabled}:{props:GameProps;disabled:boolean}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const [open,setOpen]=useState(false),[format,setFormat]=useState<AuthoredFormat>('website');
 return <section className="authored-checks" data-testid="studio-upgrade">
  <h3>{tr('내 HTML·CSS와 사진으로 더 만들기','Create with your own HTML, CSS and photos','自分のHTML・CSS・写真でもっと作る')}</h3>
  <p>{tr('기존 작품을 자유 제작 초안으로 옮길 수 있어요. 첫 배포본은 그대로 보관합니다.','Move this project into a freely editable draft. Your first release stays intact.','作品を自由に編集できる下書きへ移せます。最初の公開版はそのまま残ります。')}</p>
  {!open?<button className="outline-button" data-testid="studio-upgrade-open" disabled={disabled} onClick={()=>setOpen(true)}>{tr('자유 제작으로 확장','Expand creative editing','自由な編集に拡張')}</button>:<div className="project-actions"><label>{tr('만들 작품','Project type','作品の種類')} <select data-testid="studio-upgrade-format" value={format} onChange={event=>setFormat(event.target.value as AuthoredFormat)}><option value="website">{tr('웹사이트 (추천) · 글과 사진','Website (Recommended) · text and photos','ウェブサイト（おすすめ）· 文章と写真')}</option><option value="webapp">{tr('웹앱 · 검색과 문의','Web app · search and inquiries','ウェブアプリ · 検索と問い合わせ')}</option></select></label><p>{tr('현재 초안은 HTML·CSS 자유 제작 형식으로 바뀝니다. 변경 전 초안을 버전 기록에 남깁니다.','This draft will become editable HTML and CSS. A snapshot of the current draft will be kept.','下書きを自由に編集できるHTML・CSS形式に変えます。変更前の版を記録に残します。')}</p><button className="outline-button" onClick={()=>setOpen(false)}>{tr('현재 초안 유지','Keep current draft','今の下書きを維持')}</button><button className="primary-button" data-testid="studio-upgrade-confirm" disabled={disabled} onClick={()=>props.onAction({type:'career-studio-upgrade',format,language:lang,confirmLoss:true})}>{tr('초안 변환','Convert draft','下書きを変換')}</button></div>}
  {disabled&&<small>{tr('먼저 현재 파일 검사를 통과해 주세요.','Pass the current file checks first.','先に現在のファイル検査に合格してください。')}</small>}
 </section>;
}
