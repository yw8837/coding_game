'use client';
import {useLanguage} from '@/lib/game/i18n';
import {isDemoComplete} from '@/lib/game/edition';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import type {GameState} from '@/lib/game/engine';
import type {GameProps} from './types';
import {CafeScene} from './CafeScene';

function useDemoCopy(){const lang=useLanguage();return {lang,tr:(ko:string,en:string,ja:string)=>({ko,en,ja})[lang]};}
export function DemoGoal({state}:{state:GameState}){
 const {tr}=useDemoCopy();
 return <section className="campaign-goal demo-goal" data-no-translate><small>{tr('무료 웹 데모','FREE WEB DEMO','無料ウェブデモ')}</small><h3>{tr('모노 카페의 OPEN 간판 켜기','Turn on the café’s OPEN sign','カフェのOPEN看板を点ける')}</h3><p>{tr('메뉴판, 계산대, 주문함을 고치고 오픈 행사까지 함께해요.','Fix the menu board, checkout and order box, then join the opening ceremony.','メニュー、レジ、注文箱を直して開店セレモニーまで。')}</p><strong>{Math.min(3,state.completed.filter(i=>[0,1,2].includes(i)).length)} / 3 · {isDemoComplete(state)?tr('OPEN 완료','OPEN complete','OPEN完了'):tr('OPEN 준비 중','Preparing OPEN','OPEN準備中')}</strong><p>{tr('새 고객 의뢰, 최종 배포, 코드 랩과 연습은 전체판에 포함됩니다.','Client contracts, the final release, Code Lab and practice jobs are included in the full edition.','新規顧客の依頼、最終公開、コードラボ、練習は製品版に含まれます。')}</p></section>;
}
export function DemoBoundary(){const {tr}=useDemoCopy();return <div className="campaign-ending" data-no-translate><h1>{tr('전체판에서 이어지는 이야기','Continue in the full edition','製品版へ続く物語')}</h1><p>{tr('웹 데모는 카페 3장과 OPEN 행사까지 플레이할 수 있어요. 바탕화면에서 카페 작업을 이어가세요.','The web demo includes three café chapters and the OPEN ceremony. Continue your café work from the desktop.','ウェブデモではカフェ全3章とOPENセレモニーを遊べます。デスクトップからカフェの作業を続けましょう。')}</p></div>;}
export function DemoSummary(props:GameProps){
 const {lang,tr}=useDemoCopy();
 return <div className="campaign-ending" data-testid="demo-summary" data-no-translate><span className="eyebrow-text">{tr('카페 데모 완료','CAFÉ DEMO COMPLETE','カフェデモ完了')}</span><h1>{tr('모노 카페가 문을 열었습니다.','Mono Café is open.','モノカフェが開店しました。')}</h1><p>{tr('내가 고친 화면, 계산 규칙과 서버가 카페를 움직였어요. 저장된 코드와 보상은 그대로 남아 있어요.','Your screen edits, calculation rule and server made the café work. Your code and rewards remain saved.','自分で直した画面、計算ルール、サーバーでカフェが動きました。コードと報酬は保存されています。')}</p><CafeScene completed={props.state.completed} opened/><DemoGoal state={props.state}/><div className="ending-actions"><button className="primary-button" onClick={()=>props.onNavigate('https://mono.cafe')}>{tr('완성한 카페 다시 보기','Revisit your café','完成したカフェを見る')}</button><button className="outline-button" onClick={props.onBackup}>{tr('저장 파일 백업','Back up your save','セーブをバックアップ')}</button><button className="outline-button" onClick={()=>props.onOpen('desktop')}>{tr('바탕화면으로','Back to desktop','デスクトップへ')}</button><a className="text-button" href={lang==='ko'?'/about':'/about/'+lang}>{tr('게임 소개와 전체판 계획','About the game and full edition','ゲーム紹介と製品版の予定')} ↗</a></div></div>;
}
export function DemoComplete({open,onClose,onBackup}:{open:boolean;onClose:()=>void;onBackup:()=>void}){
 const {lang,tr}=useDemoCopy();
 return <Dialog open={open} onOpenChange={value=>{if(!value)onClose();}}><DialogContent className="reward-dialog" data-testid="demo-complete" closeLabel={tr('닫기','Close','閉じる')} data-no-translate><DialogHeader><DialogTitle data-testid="demo-badge">{tr('카페 데모를 완주했어요!','You completed the café demo!','カフェデモをクリアしました！')}</DialogTitle><DialogDescription>{tr('세 의뢰와 OPEN 행사를 마쳤어요. 카페를 다시 살펴보고 저장 파일을 백업할 수 있어요.','Three cases and the OPEN ceremony are complete. Revisit the café and back up your save.','3つの依頼とOPENセレモニーを終えました。カフェを振り返り、セーブをバックアップできます。')}</DialogDescription></DialogHeader><button className="primary-button" onClick={onClose}>{tr('카페와 작업실 다시 보기','Revisit the café and workspace','カフェと作業場を振り返る')}</button><button className="outline-button" onClick={onBackup}>{tr('설정에서 저장 백업','Back up your save in Settings','設定でセーブをバックアップ')}</button><a className="text-button" href={lang==='ko'?'/about':'/about/'+lang}>{tr('게임 소개와 전체판 계획','About the game and full edition','ゲーム紹介と製品版の予定')} ↗</a></DialogContent></Dialog>;
}
