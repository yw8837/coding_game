import type {GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
export function earnedSteamAchievements(s:GameState):string[]{
 const ids:string[]=[];
 for(const [i,id] of ['CAFE_FIRST_DEPLOY','CAFE_BILL_FIXED','CAFE_ORDERS_ONLINE'].entries())if(s.completed.includes(i))ids.push(id);
 if(s.gameplay.openingCelebrated)ids.push('CAFE_OPEN');
 if(s.gameplay.practice.completed.length===6)ids.push('PRACTICE_ALL');
 for(const act of [1,2,3])if(CAREER_JOBS.filter(j=>j.act===act).every(j=>s.gameplay.career.completed.includes(j.id)))ids.push('CAREER_ACT_'+act);
 if(s.gameplay.career.ending)ids.push('CAREER_ENDING');
 return ids;
}
