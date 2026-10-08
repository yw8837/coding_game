'use client';
import {localizeUI} from '@/lib/game/i18n';
import {Check,CheckCircle2,Mail,Coins,Flame,Trophy,BookOpen,Rocket,Globe,Code2,Terminal,X,Palette,Coffee} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {MISSIONS} from '@/lib/game/content';
import {missionSteps} from '@/lib/game/engine';
import {OpeningEnding} from './Ending';
import {CHAPTERS} from '@/lib/game/story';
import {demoGuide} from '@/lib/game/demo';
import type {GameProps,AppId} from './types';

export function MissionsView(props:GameProps){
 const {state,onOpen,onAssist}=props,m=MISSIONS[state.mission],story=CHAPTERS[state.mission];
 return localizeUI(<div className="missions-view"><div className="section-heading"><span className="eyebrow-text">의뢰서 / {state.mission+1} OF 3</span><h1>{story.title}</h1><p>{story.goal}</p></div><article className="contract-letter"><header><span className="avatar amber">지</span><div><b>{m.client}</b><p>온라인 오픈 준비</p></div></header><h2>{story.problem}</h2><p className="letter-body">{m.body}</p><div className="contract-criteria"><h3>완료 조건</h3>{m.checkNames.map(n=><div key={n}><CheckCircle2 size={17}/>{n}</div>)}</div><footer><span>{m.reward} cr · {m.xp} XP · {m.badge} 배지</span><button className="primary-button" onClick={()=>{if(!state.repo)onAssist('prepare');onOpen('repair');}}>수리 화면 열기</button></footer></article></div>);
}

export function AchievementsView(props:GameProps){
 const {state,onOpen,onNavigate}=props;
 const done=state.completed.length===MISSIONS.length;
 if(done)return localizeUI(<OpeningEnding {...props}/>);
 return localizeUI(<div className="campaign-ending"><span className="eyebrow-text">나의 해결사 수첩</span><h1>오픈까지 남은 일</h1><p>모노 카페의 세 의뢰를 해결하고 오픈까지 함께해 주세요.</p><div className="career-summary"><div><span>해결한 의뢰</span><strong>{state.completed.length}<small> / 3</small></strong></div><div><span>경험치</span><strong>{state.xp}<small> XP</small></strong></div><div><span>크레딧</span><strong>{state.credits}<small> cr</small></strong></div></div><div className="campaign-track">{MISSIONS.map((m,i)=><article key={m.id}>{state.completed.includes(i)?<CheckCircle2 size={25}/>:<Trophy size={25}/>}<div><h3>{CHAPTERS[i].title}</h3><p>{state.completed.includes(i)?CHAPTERS[i].lesson:'이야기를 이어가며 발견해 보세요.'}</p></div><small>{state.completed.includes(i)?m.badge:'아직 미완료'}</small></article>)}</div><div className="earned-badges">{state.badges.map(b=><span key={b}><Trophy size={16}/>{b}</span>)}</div><button className="primary-button" onClick={()=>onOpen('repair')}>이야기 이어 하기</button></div>);
}
