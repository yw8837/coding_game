export type FeedbackPreferences={master:number;ui:number;events:number;reducedMotion:boolean};
export const FEEDBACK_PREFERENCES_KEY='codeshift-feedback-v1';
export const DEFAULT_FEEDBACK_PREFERENCES:FeedbackPreferences={master:85,ui:80,events:100,reducedMotion:false};

export function readFeedbackPreferences(raw:string|null):FeedbackPreferences {
 const result={...DEFAULT_FEEDBACK_PREFERENCES};
 try {
  const value:unknown=JSON.parse(raw??'null');
  if(!value||typeof value!=='object')return result;
  for(const key of ['master','ui','events'] as const){
   const v=(value as Record<string,unknown>)[key];
   if(typeof v==='number'&&Number.isFinite(v))result[key]=Math.round(Math.max(0,Math.min(100,v)));
  }
  result.reducedMotion=(value as Record<string,unknown>).reducedMotion===true;
 }catch{/* 이전 설정이나 저장소 오류는 기본값으로 복구한다. */}
 return result;
}

/** 0은 완전 무음. 그 외에는 100%에서 0dB, 50%에서 -12dB. */
export function feedbackVolumeGain(value:number):number {
 if(!Number.isFinite(value)||value<=0)return 0;
 return 10**((Math.min(100,value)-100)*.24/20);
}
