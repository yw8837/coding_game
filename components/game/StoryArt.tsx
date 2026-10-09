'use client';
import Image from 'next/image';
import {useLanguage} from '@/lib/game/i18n';
export function CharacterPortrait({name,className=''}:{name:string;className?:string}){
 return <span className={`character-portrait ${name==='민서'?'minseo':'jiwoo'} ${className}`} aria-hidden="true"/>;
}
export function StudioScene({upgrades=[],ending=false}:{upgrades?:string[];ending?:boolean}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 return <div className={'studio-scene '+(ending?'studio-finished':'')}>
  <Image unoptimized src="/game-art/studio-evening.png" alt={tr('저녁 불빛이 들어오는 나의 작업실','Your desk in the evening light','夕方の光が差し込む作業場')} width={1672} height={941} loading="eager"/>
  <div className="studio-possessions">
   {upgrades.includes('recovery-kit')&&<span className="studio-item notebook"><b>↶</b>{tr('복구 노트','Recovery notebook','復元ノート')}</span>}
   {upgrades.includes('second-screen')&&<span className="studio-item monitor"><b>▣ ▣</b>{tr('보조 화면 연결됨','Second display connected','サブ画面を接続')}</span>}
   {upgrades.includes('studio-sign')&&<span className="studio-item sign">{tr('독립 작업실','INDEPENDENT STUDIO','独立した作業場')}</span>}
  </div>
 </div>;
}
