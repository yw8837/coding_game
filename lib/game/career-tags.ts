import {CAREER_JOBS,L,type CareerJob,type Localized} from './career-content.ts';
import {CAREER_CODE_IDS,careerCodeMode} from './career-code.ts';
import {careerActReady} from './career-progress.ts';

/** Display-only job metadata. Rewards, unlocks and endings never read these tags. */
export type CareerTrack='interface'|'data'|'logic'|'server';
export type CareerFormat='JSON'|'CSV'|'HTML'|'CSS'|'LOG';
export const CAREER_TRACKS:readonly CareerTrack[]=['interface','data','logic','server'];
export const CAREER_TRACK_LABELS:Record<CareerTrack,Localized>={
 interface:L('화면·UI','Interface','画面・UI'),
 data:L('데이터 정리','Data cleanup','データ整理'),
 logic:L('규칙·계산','Logic & rules','ルール・計算'),
 server:L('서버·운영','Server & ops','サーバー・運用'),
};
const TRACKS:Record<string,CareerTrack>={
 'bakery-price':'logic','library-loans':'logic','florist-stock':'data','bike-hours':'logic','contacts-clean':'data','clinic-form':'interface',
 'market-filter':'data','school-sort':'data','workshop-slots':'logic','delivery-fees':'logic','museum-layout':'interface','bookstore-invoice':'logic',
 'community-api':'server','photo-cache':'server','transit-logs':'server','archive-backup':'server','tutor-timezone':'logic','festival-report':'data',
};
const CONCEPTS:Record<string,Localized>={
 'bundle-pricing':L('묶음 가격 계산','Bundle pricing','まとめ売りの計算'),
 'loan-policy':L('대출 한도 조건','Loan limit rules','貸出上限の条件'),
 'stock-ledger':L('재고 표 정리','Stock table','在庫表の整理'),
 'opening-hours':L('영업시간 경계','Opening-hour boundaries','営業時間の境界'),
 'contact-normalization':L('연락처 중복 정리','Contact dedupe','連絡先の重複整理'),
 'accessible-form':L('누구나 쓰는 입력 폼','Accessible form','使いやすい入力フォーム'),
 'csv-filter':L('조건으로 거르기','Filtering rows','条件で絞り込む'),
 'csv-sort':L('정렬 순서','Sort order','並べ替えの順番'),
 'schedule-overlap':L('일정 겹침','Schedule overlap','日程の重なり'),
 'delivery-policy':L('조건 확인 순서','Condition order','条件を確かめる順番'),
 'responsive-box':L('반응형 화면 너비','Responsive width','レスポンシブな幅'),
 'invoice-pipeline':L('할인·세금 계산 순서','Discount and tax order','割引と税の計算順'),
 'api-routing':L('API 주소와 방식','API routes and methods','APIのアドレスと方式'),
 'cache-isolation':L('사용자별 캐시','Per-user cache','ユーザー別キャッシュ'),
 'log-inference':L('로그 읽기','Reading logs','ログを読む'),
 'backup-retention':L('백업 보관 기간','Backup retention','バックアップの保管期間'),
 'timezone-carry':L('시간대 변환','Time zones','タイムゾーン変換'),
 'grouped-report':L('그룹별 집계','Grouped totals','グループ別の集計'),
};
const FORMATS:Record<string,CareerFormat>={json:'JSON',csv:'CSV',html:'HTML',css:'CSS',log:'LOG'};
export type CareerTags={track:CareerTrack;concept:Localized;formats:CareerFormat[];javascript:boolean};
export function careerTags(job:CareerJob):CareerTags {
 const formats=[...new Set(Object.keys(job.files).map(file=>FORMATS[file.split('.').pop()??'']).filter((format):format is CareerFormat=>!!format))];
 return {track:TRACKS[job.id]??'logic',concept:CONCEPTS[job.kind]??L(job.kind,job.kind,job.kind),formats,javascript:(CAREER_CODE_IDS as readonly string[]).includes(job.id)};
}
/** Tracks and file formats the player has already delivered, for "new field" hints. */
export function careerExperience(completed:readonly string[]):{tracks:Set<CareerTrack>;formats:Set<CareerFormat>} {
 const tags=CAREER_JOBS.filter(job=>completed.includes(job.id)).map(careerTags);
 return {tracks:new Set(tags.map(tag=>tag.track)),formats:new Set(tags.flatMap(tag=>tag.formats))};
}
/**
 * A browsing suggestion only; `careerNext` stays the quest/workflow pointer.
 * Order: districts still short of four, an untried field, an untried file format, then authored order.
 */
export function careerRecommend(completed:readonly string[],available:readonly CareerJob[]):CareerJob|null {
 const seen=careerExperience(completed),candidates=available.filter(job=>!completed.includes(job.id));
 const score=(job:CareerJob)=>{const tags=careerTags(job);return [careerActReady(completed,job.act)?0:1,seen.tracks.has(tags.track)?0:1,tags.formats.some(format=>!seen.formats.has(format))?1:0];};
 const better=(a:number[],b:number[])=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]>b[i];return false;};
 let best:CareerJob|null=null,bestScore:number[]=[];
 for(const job of candidates){const value=score(job);if(!best||better(value,bestScore)){best=job;bestScore=value;}}
 return best;
}
/** Strict: a malformed or missing mode marker never counts as a JavaScript delivery. */
export function careerSolvedWithCode(id:string,files:Record<string,string>):boolean {
 if(!(CAREER_CODE_IDS as readonly string[]).includes(id))return false;
 try{return careerCodeMode(files)==='javascript';}catch{return false;}
}
export type CareerFootprint={jobs:CareerJob[];javascript:string[];tracks:Record<CareerTrack,number>;totals:Record<CareerTrack,number>;lead:CareerTrack|null};
/** Lead field = highest share of that field's jobs; ties go to the larger count, then CAREER_TRACKS order. */
export function careerFootprint(ids:readonly string[],filesFor:(id:string)=>Record<string,string>):CareerFootprint {
 const jobs=CAREER_JOBS.filter(job=>ids.includes(job.id));
 const tracks=Object.fromEntries(CAREER_TRACKS.map(track=>[track,jobs.filter(job=>careerTags(job).track===track).length])) as Record<CareerTrack,number>;
 const totals=Object.fromEntries(CAREER_TRACKS.map(track=>[track,CAREER_JOBS.filter(job=>careerTags(job).track===track).length])) as Record<CareerTrack,number>;
 let lead:CareerTrack|null=null;
 for(const track of CAREER_TRACKS){
  if(!tracks[track])continue;
  if(!lead){lead=track;continue;}
  const share=tracks[track]*totals[lead],best=tracks[lead]*totals[track];
  if(share>best||share===best&&tracks[track]>tracks[lead])lead=track;
 }
 return {jobs,javascript:jobs.filter(job=>careerSolvedWithCode(job.id,filesFor(job.id))).map(job=>job.id),tracks,totals,lead};
}
