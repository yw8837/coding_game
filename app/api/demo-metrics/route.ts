import {metricsDb,allowMetricWrite,boundedMetricBody,metricResponse} from '@/lib/demo-store';
import {validDemoPulse} from '@/lib/demo-metrics';
export const dynamic='force-dynamic';

export async function POST(request:Request){
 let body:unknown;try{body=await boundedMetricBody(request);}catch{return metricResponse({error:'Invalid request'},400);}
 try{
  const db=metricsDb(),now=Date.now();
  if(body&&typeof body==='object'&&'action' in body&&body.action==='visit'){
   const p=body as Record<string,unknown>;
   if(Object.keys(p).some(k=>!['action','language'].includes(k))||!['ko','en','ja'].includes(String(p.language)))return metricResponse({error:'Invalid request'},400);
   if(!await allowMetricWrite(request,'visit'))return metricResponse({error:'Try later'},429);
   const session=crypto.randomUUID();
   await db.batch([
    db.prepare('INSERT INTO demo_sessions (id, created_at, updated_at, language, stage) VALUES (?, ?, ?, ?, ?)').bind(session,now,now,p.language,'title'),
    db.prepare('DELETE FROM demo_limits WHERE bucket IN (SELECT bucket FROM demo_limits WHERE expires_at<? LIMIT 1000)').bind(now),
    db.prepare('DELETE FROM demo_sessions WHERE id IN (SELECT id FROM demo_sessions WHERE created_at<? LIMIT 1000)').bind(now-90*86400000),
    db.prepare('DELETE FROM demo_feedback WHERE id IN (SELECT id FROM demo_feedback WHERE created_at<? LIMIT 1000)').bind(now-90*86400000),
   ]);
   return metricResponse({session});
  }
  if(!validDemoPulse(body))return metricResponse({error:'Invalid event'},400);
  if(!await allowMetricWrite(request,'pulse'))return metricResponse({error:'Try later'},429);
  const p=body;
  // A random session ID is an unguessable write capability; no public read path exists.
  const session=await db.prepare('SELECT updated_at, created_at, started FROM demo_sessions WHERE id=?').bind(p.session).first<{updated_at:number;created_at:number;started:number}>();
  if(!session||session.created_at<now-86400000)return metricResponse({error:'Expired session'},410);
  if(session.updated_at>now-1000)return metricResponse({ok:true,skipped:true});
  const seconds=Math.min(p.seconds,Math.max(0,Math.floor((now-session.updated_at)/1000)));
  await db.batch([
   db.prepare('UPDATE demo_sessions SET updated_at=?, language=?, stage=?, active_seconds=MIN(active_seconds+?,86400), started=MAX(started,?), completed=MAX(completed,?), mode=COALESCE(mode,?) WHERE id=?').bind(now,p.language,p.stage,seconds,p.mode?1:0,p.stage==='complete'&&p.mode?1:0,p.mode,p.session),
   db.prepare('INSERT INTO demo_stages (session_id, stage, active_seconds, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(session_id,stage) DO UPDATE SET active_seconds=MIN(active_seconds+excluded.active_seconds,86400),updated_at=excluded.updated_at').bind(p.session,p.stage,seconds,now),
  ]);
  return metricResponse({ok:true});
 }catch{return metricResponse({error:'Metrics temporarily unavailable'},503);}
}
