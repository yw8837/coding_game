import {metricsDb,allowMetricWrite,boundedMetricBody,metricResponse} from '@/lib/demo-store';
import {DEMO_STAGES} from '@/lib/demo-metrics';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 let body:unknown;try{body=await boundedMetricBody(request);}catch{return metricResponse({error:'Invalid request'},400);}
 if(!body||typeof body!=='object')return metricResponse({error:'Invalid feedback'},400);
 const p=body as Record<string,unknown>;
 if(Object.keys(p).some(k=>!['language','stage','experience','message','website'].includes(k))||!['ko','en','ja'].includes(String(p.language))||!DEMO_STAGES.includes(String(p.stage))||!['none','some','experienced'].includes(String(p.experience))||typeof p.message!=='string'||p.message.trim().length<5||p.message.length>1000||p.website!=='')return metricResponse({error:'Invalid feedback'},400);
 try{
  if(!await allowMetricWrite(request,'feedback'))return metricResponse({error:'Try later'},429);
  await metricsDb().prepare('INSERT INTO demo_feedback (id, created_at, language, stage, experience, message) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(),Date.now(),p.language,p.stage,p.experience,p.message.trim()).run();
  return metricResponse({ok:true});
 }catch{return metricResponse({error:'Feedback temporarily unavailable'},503);}
}
