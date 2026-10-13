import type {GameState} from './engine.ts';
import {CAREER_JOBS} from './career-content.ts';
import {careerRouteReady} from './career-progress.ts';
import {opsDone} from './ops.ts';
import {PYTHON_JOBS,SQL_JOBS} from './ops-content.ts';
import {levelForXp,MAX_LEVEL} from './progression.ts';

export function earnedSteamAchievements(s:GameState):string[]{
 const ids:string[]=[];
 for(const [i,id] of ['CAFE_FIRST_DEPLOY','CAFE_BILL_FIXED','CAFE_ORDERS_ONLINE'].entries())if(s.completed.includes(i))ids.push(id);
 if(s.gameplay.openingCelebrated)ids.push('CAFE_OPEN');
 if(s.gameplay.practice.completed.length===6)ids.push('PRACTICE_ALL');
 for(const act of [1,2,3])if(CAREER_JOBS.filter(j=>j.act===act).every(j=>s.gameplay.career.completed.includes(j.id)))ids.push('CAREER_ACT_'+act);
 if(s.gameplay.career.ending)ids.push('CAREER_ENDING');
 for(const achievement of ACHIEVEMENTS)if(achievement.steam&&!ids.includes(achievement.steam)&&achievement.earned(s))ids.push(achievement.steam);
 return ids;
}

/** In-game achievements are derived from saved progress, like the Steam list above. */
type Copy={ko:string;en:string;ja:string};
const c=(ko:string,en:string,ja:string):Copy=>({ko,en,ja});
export type AchievementIcon='git'|'globe'|'bug'|'server'|'store'|'map'|'python'|'database'|'rocket'|'layers'|'crown';
export type Achievement={id:string;icon:AchievementIcon;title:string;description:Copy;steam?:string;earned:(s:GameState)=>boolean};
export const ACHIEVEMENTS:readonly Achievement[]=[
 {id:'first-commit',icon:'git',title:'First Commit',steam:'FIRST_COMMIT',description:c('git commit으로 첫 변경을 기록했다','Recorded your first change with git commit','git commitで最初の変更を記録した'),earned:s=>(s.repo?.commits.length??0)>1},
 {id:'hello-web',icon:'globe',title:'Hello, Web',description:c('카페 홈페이지를 처음으로 배포했다','Deployed the cafe homepage for the first time','カフェのホームページを初めて公開した'),earned:s=>s.completed.includes(0)},
 {id:'bug-squasher',icon:'bug',title:'Bug Squasher',description:c('한 글자로 계산대 버그를 잡았다','Fixed the till with a single character','1文字でレジのバグを退治した'),earned:s=>s.completed.includes(1)},
 {id:'works-on-server',icon:'server',title:'Works on the Server',description:c('내 컴퓨터 밖에서 주문 서버를 띄웠다','Brought the order server online beyond your PC','自分のPCの外で注文サーバーを動かした'),earned:s=>s.completed.includes(2)},
 {id:'grand-opening',icon:'store',title:'Grand Opening',description:c('모노 카페의 오픈을 함께 축하했다','Celebrated Mono Cafe’s opening','モノカフェの開店を一緒に祝った'),earned:s=>s.gameplay.openingCelebrated},
 {id:'neighborhood-hero',icon:'map',title:'Neighborhood Hero',description:c('세 구역에서 의뢰를 4개씩 해결했다','Solved four jobs in each of the three districts','3つの地区で依頼を4件ずつ解決した'),earned:s=>careerRouteReady(s.gameplay.career.completed)},
 {id:'first-script',icon:'python',title:'Hello, Python',description:c('파이썬 스크립트로 첫 의뢰를 자동화했다','Automated your first job with a Python script','Pythonスクリプトで最初の依頼を自動化した'),earned:s=>opsDone(s,'python')>=1},
 {id:'python-automator',icon:'python',title:'Python Automator',steam:'PYTHON_AUTOMATOR',description:c(`파이썬 자동화 의뢰 ${PYTHON_JOBS.length}개를 모두 해결했다`,`Solved all ${PYTHON_JOBS.length} Python automation jobs`,`Python自動化の依頼${PYTHON_JOBS.length}件をすべて解決した`),earned:s=>opsDone(s,'python')===PYTHON_JOBS.length},
 {id:'first-query',icon:'database',title:'SELECT * FROM world',description:c('SQL 쿼리로 첫 의뢰를 해결했다','Solved your first job with a SQL query','SQLクエリで最初の依頼を解決した'),earned:s=>opsDone(s,'sql')>=1},
 {id:'query-master',icon:'database',title:'Query Master',steam:'QUERY_MASTER',description:c(`SQL 데이터베이스 의뢰 ${SQL_JOBS.length}개를 모두 해결했다`,`Solved all ${SQL_JOBS.length} SQL database jobs`,`SQLデータベースの依頼${SQL_JOBS.length}件をすべて解決した`),earned:s=>opsDone(s,'sql')===SQL_JOBS.length},
 {id:'ship-it',icon:'rocket',title:'Ship It! v1.0.0',description:c('내 첫 작품 1.0.0을 배포했다','Published your first creation, version 1.0.0','初めての作品1.0.0を公開した'),earned:s=>!!s.gameplay.career.release.published},
 {id:'fullstack-creator',icon:'layers',title:'Fullstack Creator',steam:'FULLSTACK_CREATOR',description:c('리눅스·웹·파이썬·SQL을 모두 거쳐 내 작품을 게임 밖으로 내보냈다','Went through Linux, web, Python and SQL, then took your creation out of the game','Linux・Web・Python・SQLをすべて経て、自分の作品をゲームの外へ持ち出した'),earned:s=>!!s.gameplay.career.release.published&&(s.gameplay.finale?.exports.length??0)>0&&opsDone(s,'python')===PYTHON_JOBS.length&&opsDone(s,'sql')===SQL_JOBS.length},
 {id:'localhost-hero',icon:'crown',title:'Localhost Hero',steam:'LOCALHOST_HERO',description:c(`레벨 ${MAX_LEVEL}에 도달했다`,`Reached level ${MAX_LEVEL}`,`レベル${MAX_LEVEL}に到達した`),earned:s=>levelForXp(s.xp)>=MAX_LEVEL},
];
export function earnedAchievements(s:GameState):string[]{return ACHIEVEMENTS.filter(a=>a.earned(s)).map(a=>a.id);}
export function newAchievements(before:GameState,after:GameState):Achievement[]{const had=new Set(earnedAchievements(before));return ACHIEVEMENTS.filter(a=>!had.has(a.id)&&a.earned(after));}
