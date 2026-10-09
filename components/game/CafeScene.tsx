import {localizeUI} from '@/lib/game/i18n';
import {Check,Coffee} from 'lucide-react';
import {CHAPTERS} from '@/lib/game/story';

/** A small in-world storefront. Each completed quest visibly restores one part. */
export function CafeScene({completed,opened=false}:{completed:number[];opened?:boolean}){
 return localizeUI(<div className={'cafe-scene '+(opened?'is-open':'')} role="img" aria-label={`모노 카페. ${completed.length}/3 오픈 준비 완료. ${opened?'OPEN 간판에 불이 켜지고 손님들이 찾아왔어요.':'아직 오픈 준비 중이에요.'}`}>
  <div className="scene-sky"><i/><i/><span>{opened?'좋은 아침, 우리 동네.':'작은 변화가 모이는 곳.'}</span></div>
  <div className="scene-store"><div className="store-sign"><Coffee size={23}/>{completed.includes(0)?'MONO CAFE':'MONO ?'}</div><div className="store-awning"/><div className="store-interior"><div className="store-window"><span>{completed.includes(0)?'COFFEE\n4,500':'메뉴 준비 중'}</span>{completed.includes(1)&&<b>계산대 ✓</b>}</div><div className="store-door"><span className={opened?'lit':''}>{opened?'OPEN':'준비 중'}</span><i/></div><div className="store-window"><Coffee size={36}/><small>{completed.includes(2)?'주문 도착 ✓':'주문함 대기 중'}</small></div></div></div>
  <div className="scene-street"><span className="scene-plant">✦</span>{opened&&<div className="scene-guests"><span>지우</span><span>민서</span><span>나</span></div>}<span className="scene-bench"/></div>
  <div className="scene-stamps">{CHAPTERS.map((c,i)=><span key={c.stamp} className={completed.includes(i)?'ready':''}>{completed.includes(i)?<Check size={13}/>:<i/>}{c.stamp}</span>)}</div>
 </div>);
}
