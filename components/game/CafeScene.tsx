'use client';
import {localizedCopy} from '@/lib/game/zh';
import Image from 'next/image';
import {useLanguage} from '@/lib/game/i18n';
import {Check,Lock,Coffee} from 'lucide-react';
/** Authored storefront art; overlays reflect real saved progress. */
export function CafeScene({completed,opened=false}:{completed:number[];opened?:boolean}){
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string,zh?:string)=>localizedCopy(ko,en,ja,zh)[lang];
 const labels=[tr('메뉴판','Menu','メニュー'),tr('계산대','Checkout','レジ'),tr('주문함','Orders','注文箱')];
 return <div className={'cafe-art-scene '+(opened?'is-open':'')} aria-label={tr(`모노 카페. ${completed.length}/3 오픈 준비 완료.`,`Mono Cafe. ${completed.length}/3 preparations complete.`,`モノカフェ。開店準備 ${completed.length}/3 完了。`,`莫诺咖啡馆。开业准备已完成${completed.length}/3。`)}>
  <Image unoptimized src="/game-art/mono-cafe.png" alt="" width={1672} height={941} loading="eager"/>
  <div className="cafe-art-sign"><Coffee size={20}/><span>MONO CAFE</span></div>
  <div className={'cafe-open-sign '+(opened?'lit':'')}>{opened?'OPEN':tr('오픈 준비 중','OPENING SOON','開店準備中')}</div>
  <div className="cafe-art-progress">{labels.map((label,i)=><span className={completed.includes(i)?'ready':''} key={i}>{completed.includes(i)?<Check size={15}/>:<Lock size={13}/>} {label}</span>)}</div>
 </div>;
}
