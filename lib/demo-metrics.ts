/** Public wire format: no code, commands, save files, URL queries or identity. */
export const DEMO_STAGES=['title','desktop','opening','complete',...['0','1','2'].flatMap(chapter=>['prepare','inspect','sign','size','rule','serve','route','keep','connect','menu','order','trial','deliver','complete'].map(step=>`cafe-${chapter}-${step}`))];
export type DemoPulse={session:string;language:'ko'|'en'|'ja';stage:string;seconds:number;mode:'new'|'continue'|null};
export function validDemoPulse(value:unknown):value is DemoPulse {
 if(!value||typeof value!=='object')return false;
 const p=value as Record<string,unknown>;
 return Object.keys(p).every(k=>['session','language','stage','seconds','mode'].includes(k))&&typeof p.session==='string'&&/^[a-f\d-]{36}$/.test(p.session)&&['ko','en','ja'].includes(String(p.language))&&DEMO_STAGES.includes(String(p.stage))&&Number.isInteger(p.seconds)&&Number(p.seconds)>=0&&Number(p.seconds)<=30&&(p.mode===null||p.mode==='new'||p.mode==='continue');
}
export function stageLabel(stage:string):string {
 const fixed:Record<string,string>={title:'타이틀',desktop:'바탕화면 · 첫 메시지',opening:'OPEN 행사',complete:'데모 완료'};
 if(fixed[stage])return fixed[stage];
 const [,chapter,...rest]=stage.split('-');
 const steps:Record<string,string>={prepare:'작업 환경 준비',inspect:'화면 살펴보기',sign:'카페 이름 고치기',size:'버튼 크기 고치기',rule:'가격 계산식',serve:'계산 결과 확인',route:'서버 경로',keep:'주문 저장',connect:'서버 연결',menu:'메뉴 요청',order:'주문 요청',trial:'테스트',deliver:'전달',complete:'의뢰 완료'};
 return `${Number(chapter)+1}장 · ${steps[rest.join('-')]??stage}`;
}
export function dashboardOwnerAllowed(user:{email:string}|null,allowed:string|undefined):boolean {
 return !!user&&!!allowed&&user.email.trim().toLowerCase()===allowed.trim().toLowerCase();
}
