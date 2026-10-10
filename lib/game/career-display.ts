type Lang='ko'|'en'|'ja';
const pick=(lang:Lang,ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
const STAMP=/^D([+-]\d+) (\d{2}:\d{2})$/,LOG_LINE=/^\d{2}:\d{2} (?:INFO|WARN|ERROR) \//;

export function careerDayLabel(day:number,lang:Lang):string {
 const n=Math.abs(day);
 return day===0?pick(lang,'같은 날','Same day','同じ日'):day===1?pick(lang,'다음 날','Next day','翌日'):day===-1?pick(lang,'전날','Previous day','前日')
  :day>0?pick(lang,`${n}일 뒤`,`${n} days later`,`${n}日後`):pick(lang,`${n}일 전`,`${n} days earlier`,`${n}日前`);
}
function lines(raw:string):string[]|null {
 try{const value:unknown=JSON.parse(raw);return Array.isArray(value)&&value.every(item=>typeof item==='string')?value:null;}catch{return null;}
}
/** Display-only wording for evaluator strings. Pass/fail always compares the raw strings, never this text. */
export function careerDisplayValue(raw:string,lang:Lang,expected?:string):string {
 const stamp=STAMP.exec(raw);
 if(stamp)return careerDayLabel(Number(stamp[1]),lang)+' '+stamp[2];
 const want=expected===undefined?null:lines(expected),got=want?.length&&want.every(line=>LOG_LINE.test(line))?lines(raw):null;
 if(want&&got)return raw===expected?pick(lang,`${got.length}줄 모두 유지`,`All ${got.length} lines kept`,`${got.length}行すべて維持`)
  :pick(lang,`${got.length}줄 · 원본 ${want.length}줄과 다름`,`${got.length} lines · differs from the original ${want.length}`,`${got.length}行 · 元の${want.length}行と違います`);
 return raw;
}
