import {CAREER_JOBS} from './career-content.ts';
import type {CareerCheck,CareerEvaluation} from './career-evaluation.ts';
import {careerHash} from './career.ts';
import {CAREER_CODE_FILE,careerCodeModeSafe,careerCodeSpec} from './career-code.ts';

export type CareerSourceTarget={file:string;line?:number};
export type CareerFeedback={
 status:'draft'|'unchecked'|'stale'|'checked';passed:number|null;total:number;
 firstFailure:CareerCheck|null;target:CareerSourceTarget|null;candidates:string[];formatBlocked:boolean;
};

const primaryFiles:Record<string,string>={
 'bakery-price':'pricing.json','library-loans':'policy.json','florist-stock':'inventory.csv',
 'bike-hours':'hours.json','contacts-clean':'clean.json','clinic-form':'booking.html',
 'market-filter':'filter.json','school-sort':'sort.json','workshop-slots':'schedule.csv',
 'delivery-fees':'delivery.json','museum-layout':'gallery.css','bookstore-invoice':'invoice.json',
 'community-api':'routes.json','photo-cache':'cache.json','transit-logs':'report.json',
 'archive-backup':'retention.json','tutor-timezone':'timezone.json','festival-report':'summary.json',
};
const sourceChecks:Record<string,Record<string,string>>={
 'contacts-clean':{'Keep original contact table':'contacts.csv'},
 'market-filter':{'Keep original product records':'products.csv'},
 'school-sort':{'Keep original names and scores':'scores.csv'},
 'bookstore-invoice':{'Item subtotal':'items.csv','Keep original quantities and unit prices':'items.csv'},
 'transit-logs':{'Keep every original log entry':'service.log'},
 'archive-backup':{'Keep original copy records':'copies.csv'},
 'festival-report':{'Keep original table including refunds and pending':'sales.csv'},
};

/** Names identify evaluator cases; positions differ between configuration and JavaScript. */
export function careerFailureTarget(id:string,files:Record<string,string>,check:CareerCheck):CareerSourceTarget|null {
 const job=CAREER_JOBS.find(item=>item.id===id);if(!job)return null;
 const javascript=!!careerCodeSpec(id)&&careerCodeModeSafe(files)==='javascript';
 if(check.name.en==='File format'){
  const invalid=Object.keys(job.files).filter(file=>typeof files[file]!=='string'||files[file].length>20000);
  if(invalid.length===1)return {file:invalid[0]};
  // Parse errors do not identify their source. Only a single-file job is unambiguous.
  if(Object.keys(job.files).length===1&&!javascript)return {file:Object.keys(job.files)[0]};
  if(javascript&&/solution\.js/.test(check.actual))return {file:CAREER_CODE_FILE};
  return null;
 }
 const preserved=sourceChecks[id]?.[check.name.en];
 if(preserved)return {file:preserved};
 if(javascript){
  const match=check.actual.match(/^(?:syntax|runtime|budget|unsupported) · line ([1-9]\d*):/);
  return {file:CAREER_CODE_FILE,...(match?{line:Number(match[1])}:{})};
 }
 const file=primaryFiles[id];return file?{file}:null;
}

/** No live success/count is presented as a checked result without matching saved evidence. */
export function careerFeedback(id:string,files:Record<string,string>,evaluation:CareerEvaluation,proof:{hash:string;passed:boolean}|undefined,unsaved=false):CareerFeedback {
 const job=CAREER_JOBS.find(item=>item.id===id),candidates=job?Object.keys(job.files):[];
 const status=unsaved?'draft':!proof?'unchecked':proof.hash!==careerHash(files)?'stale':'checked';
 const formatBlocked=evaluation.checks[0]?.name.en==='File format';
 const executed=formatBlocked?evaluation.checks.slice(0,1):evaluation.checks;
 const checked=status==='checked',firstFailure=checked?executed.find(check=>!check.passed)??null:null;
 return {status,formatBlocked,passed:checked?executed.filter(check=>check.passed).length:null,total:executed.length,
  firstFailure,target:firstFailure?careerFailureTarget(id,files,firstFailure):null,candidates};
}
