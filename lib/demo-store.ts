import 'server-only';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {dashboardOwnerAllowed} from './demo-metrics';

export function metricsDb():D1Database {
 if(!env.DB)throw Error('Metrics unavailable');
 return env.DB;
}
export async function isDashboardOwner(){return dashboardOwnerAllowed(await getChatGPTUser(),env.DASHBOARD_OWNER_EMAIL);}
export async function allowMetricWrite(request:Request,kind:'visit'|'feedback'|'pulse') {
 if(!env.DEMO_METRICS_SALT)return false;
 const hour=Math.floor(Date.now()/3600000);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.DEMO_METRICS_SALT),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 // Store only an hourly, keyed abuse bucket; never the raw address or user agent.
 const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${hour}:${kind}:${request.headers.get('cf-connecting-ip')??'unavailable'}`));
 const bucket=Array.from(new Uint8Array(signature),b=>b.toString(16).padStart(2,'0')).join('');
 const limit=kind==='visit'?60:kind==='feedback'?12:1200;
 const result=await metricsDb().prepare('INSERT INTO demo_limits (bucket, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(bucket,(hour+2)*3600000,limit).first<{count:number}>();
 return !!result;
}
export function metricResponse(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
export async function boundedMetricBody(request:Request):Promise<unknown>{
 const origin=request.headers.get('origin');
 const validOrigin=!!origin&&['https://code.yeolmaeapps.kr','https://codeshift-lab.bsfire1237.chatgpt.site','http://127.0.0.1:5173','http://127.0.0.1:4173'].includes(origin)&&origin===new URL(request.url).origin;
 const validType=request.headers.get('content-type')?.split(';',1)[0].trim()==='application/json';
 const reader=request.body?.getReader();if(!reader)throw Error('Body');
 let length=0,raw='';const decoder=new TextDecoder();
 // Consume bounded request bodies before rejecting them so the local Worker proxy
 // does not reuse a connection whose previous upload is still unread. The stream
 // limit also covers chunked requests without a trustworthy Content-Length.
 try{
  while(true){
   const {value,done}=await reader.read();if(done)break;
   length+=value.byteLength;if(length>6000)throw Error('Size');
   raw+=decoder.decode(value,{stream:true});
  }
  if(!validOrigin)throw Error('Origin');
  if(!validType)throw Error('Type');
  raw+=decoder.decode();return JSON.parse(raw);
 }finally{await reader.cancel();}
}
