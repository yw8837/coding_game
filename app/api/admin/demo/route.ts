import {isDashboardOwner,metricsDb,metricResponse} from '@/lib/demo-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!await isDashboardOwner())return metricResponse({error:'Owner access required'},403);
 const days=Number(new URL(request.url).searchParams.get('days')??7);
 if(![1,7,30,90].includes(days))return metricResponse({error:'Invalid range'},400);
 const since=Date.now()-days*86400000;
 try{
  const db=metricsDb();
  const [summary,daily,languages,stages,feedback]=await db.batch([
   db.prepare("SELECT COUNT(*) visits, COALESCE(SUM(started),0) starts, COALESCE(SUM(completed),0) completes, COALESCE(SUM(CASE WHEN mode='new' THEN 1 ELSE 0 END),0) new_starts, COALESCE(SUM(CASE WHEN mode='new' THEN completed ELSE 0 END),0) new_completes, COALESCE(SUM(active_seconds),0) seconds FROM demo_sessions WHERE created_at>=?").bind(since),
   db.prepare("SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch','+9 hours') day, COUNT(*) visits, SUM(started) starts, SUM(completed) completes FROM demo_sessions WHERE created_at>=? GROUP BY day ORDER BY day").bind(since),
   db.prepare('SELECT language, COUNT(*) visits, SUM(started) starts, SUM(completed) completes FROM demo_sessions WHERE created_at>=? GROUP BY language ORDER BY visits DESC').bind(since),
   db.prepare('SELECT t.stage, COUNT(*) sessions, ROUND(AVG(t.active_seconds)) seconds, SUM(CASE WHEN s.stage=t.stage AND s.completed=0 AND s.updated_at<? THEN 1 ELSE 0 END) last_seen FROM demo_stages t JOIN demo_sessions s ON s.id=t.session_id WHERE s.created_at>=? AND s.started=1 GROUP BY t.stage ORDER BY seconds DESC LIMIT 30').bind(Date.now()-30*60000,since),
   db.prepare('SELECT created_at, language, stage, experience, message FROM demo_feedback WHERE created_at>=? ORDER BY created_at DESC LIMIT 100').bind(since),
  ]);
  return metricResponse({days,updatedAt:Date.now(),summary:summary.results[0],daily:daily.results,languages:languages.results,stages:stages.results,feedback:feedback.results});
 }catch{return metricResponse({error:'Dashboard data unavailable'},503);}
}
