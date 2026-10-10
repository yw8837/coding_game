import type {Language} from './translations.ts';

// ISO 3166-1 alpha-2. Unknown/special CF values (XX, T1) use browser fallback.
const COUNTRIES=new Set(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));
export function countryLanguage(country:unknown):Language|null{
 if(typeof country!=='string')return null;
 const code=country.trim().toUpperCase();
 if(!COUNTRIES.has(code))return null;
 return code==='KR'?'ko':code==='JP'?'ja':'en';
}

/** Read only Cloudflare's trusted request metadata, never a client-supplied header. */
export function regionLocaleResponse(request:Request):Response{
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, max-age=0','CDN-Cache-Control':'no-store','Vary':'*','X-Content-Type-Options':'nosniff'};
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 const language=countryLanguage((request as Request&{cf?:{country?:unknown}}).cf?.country);
 return new Response(request.method==='HEAD'?null:JSON.stringify({language}),{headers});
}

type FetchLocale=(url:string,init:RequestInit)=>Promise<Response>;
export const REGION_LOCALE_TIMEOUT_MS=1200;
/** Cloudflare owns this same-origin diagnostic path. Read only the country field;
 * never persist or return its diagnostic body (which can also contain an IP). */
export function traceLanguage(body:string):Language|null{
 if(body.length>4096)return null;
 const countries=[...body.matchAll(/^loc=([A-Z]{2})\r?$/gm)];
 return countries.length===1?countryLanguage(countries[0][1]):null;
}
/** Same-origin lookup. Timeout/abort resolve to browser fallback even if fetch ignores abort. */
export async function fetchRegionLanguage(fetchLocale:FetchLocale,signal:AbortSignal,timeoutMs=REGION_LOCALE_TIMEOUT_MS):Promise<Language|null>{
 if(signal.aborted)return null;
 const controller=new AbortController();let finish!:(value:null)=>void;
 const stopped=new Promise<null>(resolve=>{finish=resolve;});
 const cancel=()=>{controller.abort();finish(null);};
 signal.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(cancel,timeoutMs);
 try{
  const result=await Promise.race([stopped,(async()=>{
   const init:RequestInit={method:'GET',cache:'no-store',credentials:'same-origin',redirect:'error',signal:controller.signal};
   try{
    const response=await fetchLocale('/api/locale',init);
    if(response.ok){
     const value:unknown=await response.json();
     const language=value&&typeof value==='object'&&!Array.isArray(value)?(value as {language?:unknown}).language:null;
     if(language==='ko'||language==='en'||language==='ja')return language;
    }
   }catch{/* Some hosting proxies omit request.cf. Use the visitor's edge below. */}
   if(controller.signal.aborted)return null;
   // Fetch in the browser: a server-side trace would locate the server instead.
   const edge=await fetchLocale('/cdn-cgi/trace',init);
   return edge.ok&&edge.headers.get('Content-Type')?.startsWith('text/plain')?traceLanguage(await edge.text()):null;
  })()]);
  return signal.aborted?null:result;
 }catch{return null;}finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);}
}
