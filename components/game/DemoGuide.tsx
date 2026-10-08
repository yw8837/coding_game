'use client';
import {localizeUI} from '@/lib/game/i18n';
import {Lightbulb,TerminalSquare,CheckCircle2,X} from 'lucide-react';
import {demoGuide} from '@/lib/game/demo';
import type {GameProps} from './types';

export function DemoGuide(props:GameProps&{onClose:()=>void}){
 const {state,onAction,onNavigate,onOpen,onTest,queueCommand,testing,onClose}=props;
 const step=demoGuide(state);
 const perform=()=>{if(step.command){queueCommand(step.command);return;}switch(step.target){case'repair':onOpen('repair');break;case'accept':onAction({type:'accept'});onNavigate('https://coocle.game/');break;case'search':onNavigate('https://coocle.game/');break;case'repo':onNavigate('https://cathub.dev/mono/menu-site');break;case'editor':onOpen('editor');break;case'check':onTest();onOpen('editor');break;case'review':onNavigate('https://cathub.dev/mono/menu-site?tab=pr');break;case'finish':onOpen('achievements');break;}}
 return localizeUI(<section className={'demo-guide '+(state.completed.includes(state.mission)?'complete':'')} aria-label="다음 행동 안내"><button className="guide-close" onClick={onClose} aria-label="도움말 닫기" title="도움말 닫기"><X size={19}/></button><span className="demo-guide-icon">{state.completed.includes(state.mission)?<CheckCircle2 size={22}/>:<Lightbulb size={22}/>}</span><div className="demo-guide-copy"><span className="demo-kicker">개발 도구 · 다음 한 걸음</span><h2>{step.title}</h2><p>{step.body}</p>{step.command&&<code>{step.command}</code>}</div><div className="demo-guide-actions"><button className="primary-button" onClick={perform} disabled={step.target==='check'&&testing}>{step.command&&<TerminalSquare size={16}/>} {testing&&step.target==='check'?'검사 중…':step.label}</button>{step.target==='check'&&<button className="text-button" onClick={()=>onOpen('editor')}>에디터 열기</button>}{step.command&&<small>입력 후 Enter로 실행</small>}</div></section>);
}
