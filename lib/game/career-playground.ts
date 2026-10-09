import {L,type Localized} from './career-content.ts';
import {evaluateCareer,type CareerCheck} from './career-evaluation.ts';

type Scene='receipt'|'access'|'list'|'schedule'|'screen'|'network';
type ScenarioSpec={scene:Scene;title:Localized;action:Localized;cases:number[]};
const receipt=L('영수증 확인','Print receipt','レシートを確認');
const access=L('접수해 보기','Try the request','受付を試す');
const list=L('목록 만들기','Build the list','一覧を作る');
const schedule=L('일정 확인','Check the schedule','予定を確認');
const network=L('요청 보내기','Send request','リクエスト送信');
/** These are real cases from the same bounded evaluator used by delivery checks. */
export const CAREER_SCENARIOS:Record<string,ScenarioSpec>={
 'bakery-price':{scene:'receipt',title:L('빵집 계산대','Bakery till','パン屋のレジ'),action:receipt,cases:[1,2,3,0]},
 'library-loans':{scene:'access',title:L('도서관 대출 창구','Library loans','図書館の貸出窓口'),action:access,cases:[0,1,2]},
 'florist-stock':{scene:'list',title:L('꽃집 판매대','Flower shop counter','花屋の売り場'),action:list,cases:[0,1,2]},
 'bike-hours':{scene:'schedule',title:L('수리점 접수 시간','Repair shop hours','修理店の受付時間'),action:access,cases:[0,1,2,3]},
 'contacts-clean':{scene:'list',title:L('소식지 발송 목록','Newsletter recipients','お知らせの宛先'),action:list,cases:[0,1,2,3]},
 'clinic-form':{scene:'access',title:L('진료 예약 창구','Clinic booking','診療予約の窓口'),action:access,cases:[0,1,2]},
 'market-filter':{scene:'list',title:L('오늘의 판매대','Today’s market stall','今日の売り場'),action:list,cases:[0,1,2,3]},
 'school-sort':{scene:'list',title:L('학교 게시판','School noticeboard','学校の掲示板'),action:list,cases:[0,1,2,3]},
 'workshop-slots':{scene:'schedule',title:L('공방 수업 시간표','Workshop timetable','工房の時間割'),action:schedule,cases:[3,4,7,8]},
 'delivery-fees':{scene:'receipt',title:L('배달 주문 접수','Delivery orders','配達注文の受付'),action:receipt,cases:[0,1,2,4]},
 'museum-layout':{scene:'screen',title:L('전시 안내 화면','Exhibition screen','展示案内の画面'),action:L('화면 펼치기','Open the screen','画面を開く'),cases:[0,1,2]},
 'bookstore-invoice':{scene:'receipt',title:L('서점 결제','Bookshop checkout','本屋のお会計'),action:receipt,cases:[2,3,4,5]},
 'community-api':{scene:'network',title:L('동네 행사 신청','Neighborhood event signup','まちの行事申込'),action:network,cases:[0,1,2,3,4]},
 'photo-cache':{scene:'network',title:L('사진관 로그인 화면','Photo studio login','写真館のログイン画面'),action:network,cases:[0,1,2,3]},
 'transit-logs':{scene:'network',title:L('버스 안내 관제','Transit service desk','バス案内の管理画面'),action:L('장애 집계','Count outages','障害を集計'),cases:[0,1,2]},
 'archive-backup':{scene:'list',title:L('기록관 복구 목록','Archive recovery list','記録館の復元一覧'),action:list,cases:[0,1,2,3]},
 'tutor-timezone':{scene:'schedule',title:L('온라인 수업 시계','Online lesson clock','オンライン授業の時計'),action:schedule,cases:[0,1,2]},
 'festival-report':{scene:'receipt',title:L('축제 정산대','Festival settlement','祭りの精算台'),action:receipt,cases:[0,1,2,3]},
};
export function careerScenarios(id:string,files:Record<string,string>){
 const spec=CAREER_SCENARIOS[id];if(!spec)return null;
 const evaluation=evaluateCareer(id,files);
 const unavailable=evaluation.checks[0]?.name.en==='File format';
 const cases:CareerCheck[]=unavailable?evaluation.checks.slice(0,1):spec.cases.flatMap(index=>evaluation.checks[index]?[evaluation.checks[index]]:[]);
 return {...spec,cases,unavailable};
}
