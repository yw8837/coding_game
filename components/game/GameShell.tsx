'use client';
import {localizeUI,t,useLanguage,getLanguage,restoreLanguage} from '@/lib/game/i18n';
import {TitleScreen} from './StartScreen';
import {DemoFeedbackSettings,useDemoTelemetry} from './DemoTelemetry';
import {coachStage} from '@/lib/game/coach';
import {DemoBoundary,DemoComplete} from './DemoBoundary';
import {editionAllowsApp,editionAllowsPath,editionAllowsProject,isDemoComplete,isDemoCafeComplete,DEMO_SAMPLE_JOB,DEMO_LOCKED_MESSAGE,demoLockedMessage,type GameEdition} from '@/lib/game/edition';
import {DesktopOS,Notepad,useDesktopManager} from './DesktopOS';
import {ComputerView} from './Computer';
import {ChallengesHub} from './ChallengesHub';
import {progressMoment,type ProgressMoment} from '@/lib/game/progress-feedback';
import '@/app/progress-feedback.css';
import {CareerView,type CareerFileTarget} from './CareerView';
import {LanguageSelect} from './LanguageSelect';
import {SaveTools} from './SaveTools';
import {desktopBridge,type PlatformInfo} from '@/lib/game/platform';
import {loadProgress} from '@/lib/game/load-progress';
import {earnedSteamAchievements,newAchievements,type Achievement} from '@/lib/game/achievements';
import {levelUps,effectiveLoadout,type LevelUp} from '@/lib/game/progression';
import {opsJob} from '@/lib/game/ops-content';
import {GAME_BRAND} from '@/lib/game/brand';
import {ProfileView} from './ProfileView';
import {OpsLabView} from './OpsLab';
import {LevelUpOverlay,AchievementToast} from './LevelUpOverlay';
import '@/app/progression.css';
import '@/app/ops-lab.css';
import '@/app/finale.css';
import '@/app/localhost-hero.css';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Trophy,Coins,Flame,BookOpen,Check,Monitor,Rocket} from 'lucide-react';
import {toast} from 'sonner';
import {Toaster} from '@/components/ui/sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {createGame,act,runCommand,apiRequest,projectFiles,sourceHash,runCodeChecks,missionSteps,isProjectServerRunning,type GameState,type Action} from '@/lib/game/engine';
import {currentTask} from '@/lib/game/workflow';
import {defaultWorkContext,workContextApp,workContextForFile,type WorkContext} from '@/lib/game/work-context';
import {useGameFeedback} from './useGameFeedback';
import {useBackgroundMusic} from './useBackgroundMusic';
import {FeedbackSettings} from './FeedbackSettings';
import {DEFAULT_FEEDBACK_PREFERENCES,FEEDBACK_PREFERENCES_KEY,readFeedbackPreferences,type FeedbackPreferences} from '@/lib/game/feedback-preferences';
import '@/app/feedback-settings.css';
import {RepairDesk} from './RepairDesk';
import {CafeCoach} from './CafeCoach';
import {assist,type AssistAction} from '@/lib/game/assisted';
import {ApiView,ServerView} from './Network';
import {checkLayout} from '@/lib/game/preview';
import {SAVE_KEY,readSave,writeSave} from '@/lib/game/save';
import {hasGameProgress} from '@/lib/game/resume-progress';
import {MISSIONS} from '@/lib/game/content';
import {DESIGN_CHOICES} from '@/lib/game/gameplay';
import {BrowserView,START_URL} from './Browser';
import {EditorView} from './Editor';
import {TerminalView} from './Terminal';
import {MissionsView,AchievementsView} from './Missions';
import {MessagesView,WorkbenchView} from './Activities';
import type {AppId,GameProps} from './types';

type ModelContext={registerTool:(tool:{name:string;title?:string;description:string;inputSchema:object;annotations?:object;execute:(input:unknown)=>unknown|Promise<unknown>},options?:{signal?:AbortSignal})=>void|Promise<void>};
type Reward={title:string;credits:number;xp:number};
const ui=(ko:string,en:string,ja:string)=>getLanguage()==='ko'?ko:getLanguage()==='en'?en:ja;

export default function GameShell({edition='full'}:{edition?:GameEdition}){
 const [demoCompleteOpen,setDemoCompleteOpen]=useState(false);
 const language=useLanguage();
 const manager=useDesktopManager(),{app,setApp,close:closeWindow}=manager;
 const [titleOpen,setTitleOpen]=useState(true),[hasSave,setHasSave]=useState(false);
 const [entryMode,setEntryMode]=useState<'new'|'continue'|null>(null);
 const [loading,setLoading]=useState(true),[platform,setPlatform]=useState<PlatformInfo|null>(null);
 const [moment,setMoment]=useState<{id:number;title:string;detail:string;label:string;tier:ProgressMoment['tier'];credits:number;xp:number}|null>(null);
 useEffect(()=>{if(!moment)return;const timer=setTimeout(()=>setMoment(null),3200);return()=>clearTimeout(timer);},[moment]);
 const [careerFocus,setCareerFocus]=useState(0),[toolsFocus,setToolsFocus]=useState(0);
 const [careerTarget,setCareerTarget]=useState<CareerFileTarget|null>(null);
 const [editorTarget,setEditorTarget]=useState<{file:string;token:number}|null>(null);
 const [workContext,setWorkContext]=useState<WorkContext|null>(null);
 const [workSelections,setWorkSelections]=useState<Partial<Record<string,WorkContext>>>({});
 const workSelectionRef=useRef<Partial<Record<string,WorkContext>>>({});
 const noteWorkContext=useCallback((context:WorkContext|null,owner?:string)=>{
  const next={...workSelectionRef.current};
  if(!context&&owner)delete next[owner];
  if(context){const app=workContextApp(context);if(app)next[app]=context;}
  workSelectionRef.current=next;setWorkSelections(next);
  setWorkContext(previous=>previous?.kind===context?.kind&&previous?.id===context?.id?previous:context);
 },[]);
 const [guided,setGuided]=useState(true);
 const [advanced,setAdvanced]=useState(false),[sound,setSound]=useState(true);
 const [feedbackPreferences,setFeedbackPreferences]=useState(DEFAULT_FEEDBACK_PREFERENCES);
 const [state,setState]=useState<GameState>(createGame);
 const loadout=effectiveLoadout(state);
 const feedback=useGameFeedback(sound,feedbackPreferences,loadout.keys);
 useBackgroundMusic(sound,feedbackPreferences,loadout.bgm);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const apply=()=>{document.documentElement.dataset.gameReducedMotion=String(feedbackPreferences.reducedMotion||media.matches);};apply();media.addEventListener('change',apply);return()=>{media.removeEventListener('change',apply);delete document.documentElement.dataset.gameReducedMotion;};},[feedbackPreferences.reducedMotion]);
 const changeFeedbackPreferences=(next:FeedbackPreferences)=>{setFeedbackPreferences(next);try{localStorage.setItem(FEEDBACK_PREFERENCES_KEY,JSON.stringify(next));}catch{}};
 const [url,setUrl]=useState(START_URL),[terminalOpen,setTerminalOpen]=useState(false),[sidebarOpen,setSidebarOpen]=useState(true),[queued,setQueued]=useState(''),[testing,setTesting]=useState(false),[settings,setSettings]=useState(false),[reset,setReset]=useState(false),[saveStatus,setSaveStatus]=useState<'saved'|'saving'|'failed'>('saved'),[reward,setReward]=useState<Reward|null>(null);
 const demoStage=titleOpen?'title':isDemoComplete(state)?'complete':state.completed.length===3?'opening':!state.accepted?'desktop':`cafe-${state.mission}-${coachStage(state)}`;
 const demoMetrics=useDemoTelemetry({available:edition==='demo'&&!loading&&!platform,language,stage:demoStage,mode:entryMode});
 const current=useRef(state),ready=useRef(false),checking=useRef(false),sidebarButton=useRef<HTMLButtonElement>(null);
 const testRef=useRef<(s?:GameState)=>Promise<void>>(async()=>{});
 const saveRevision=useRef(0),saveBlocked=useRef(false);
 const [loadFailed,setLoadFailed]=useState(false);
 const [levelUp,setLevelUp]=useState<LevelUp|null>(null),[trophies,setTrophies]=useState<Achievement[]>([]);
 // Level-ups and achievements are derived from XP/progress, so only real play actions celebrate them (not loads or imports).
 const celebrate=useCallback((before:GameState,next:GameState)=>{const ups=levelUps(before.xp,next.xp);if(ups.length){setLevelUp({...ups.at(-1)!,unlocks:ups.flatMap(up=>up.unlocks)});setTimeout(()=>feedback('level-up'),650);}const gained=newAchievements(before,next);if(gained.length){setTrophies(list=>[...list,...gained].slice(0,8));setTimeout(()=>feedback('achievement'),ups.length?1900:900);}},[feedback]);
 const persist=useCallback(async(next:GameState)=>{if(saveBlocked.current)throw Error("Recover or explicitly reset first");const bridge=desktopBridge();if(bridge){const raw=JSON.stringify(next);readSave(raw);const result=await bridge.saveGame(raw);if(!result.ok)throw Error(result.error||'Save failed');}else writeSave(localStorage,next);},[]);
 const update=useCallback((next:GameState)=>{current.current=next;setState(next);setHasSave(hasGameProgress(next));if(ready.current){const revision=++saveRevision.current;setSaveStatus('saving');void persist(next).then(()=>{if(revision===saveRevision.current)setSaveStatus('saved');}).catch(()=>{if(revision===saveRevision.current)setSaveStatus('failed');});}if(next.notice)toast(next.notice===DEMO_LOCKED_MESSAGE?demoLockedMessage(getLanguage()):t(next.notice));},[persist]);
 useEffect(()=>{let cancelled=false;ready.current=false;void(async()=>{await restoreLanguage();const bridge=desktopBridge();try{const primary=bridge?await bridge.loadSave():{raw:localStorage.getItem(SAVE_KEY),recovered:false};const result=await loadProgress(primary,bridge?()=>bridge.loadBackup():undefined);if(cancelled)return;if(result.state){result.state.notice='';update(result.state);}if(result.recovered)toast(ui('백업 저장을 복구했어요.','Backup save restored.','バックアップから復元しました。'));}catch{if(!cancelled){saveBlocked.current=true;setLoadFailed(true);setSaveStatus('failed');toast.error(ui('저장 파일을 읽지 못했어요. 설정에서 백업을 불러오거나 새로 시작해 주세요.','Save could not be read. Import a backup or start a new game in Settings.','セーブを読み込めません。設定からバックアップを読み込むか最初から始めてください。'));}}finally{if(bridge){try{const info=await bridge.getPlatformInfo();if(!cancelled)setPlatform(info);}catch{}}if(!cancelled){ready.current=true;setLoading(false);setSidebarOpen(window.innerWidth>1000);try{setGuided(localStorage.getItem('codeshift-guided')!=='false');setAdvanced(localStorage.getItem('codeshift-advanced')==='true');setSound(localStorage.getItem('codeshift-sound')!=='false');setFeedbackPreferences(readFeedbackPreferences(localStorage.getItem(FEEDBACK_PREFERENCES_KEY)));}catch{}}}})();return()=>{cancelled=true;};},[update]);
 useEffect(()=>{const bridge=desktopBridge();if(!bridge)return;return bridge.onBeforeClose(()=>{if(!ready.current){void bridge.confirmClose();return;}void persist(current.current).then(()=>bridge.confirmClose()).catch(()=>{setSaveStatus('failed');});});},[persist]);
 const steamAchievements=earnedSteamAchievements(state).join(',');
 useEffect(()=>{void desktopBridge()?.setLanguage(language).catch(()=>{});},[language]);
 useEffect(()=>{if(ready.current&&platform?.steamAvailable&&steamAchievements)void desktopBridge()?.unlockAchievements(steamAchievements.split(',')).catch(()=>{});},[steamAchievements,platform]);
 const showProgress=useCallback((before:GameState,next:GameState)=>{const event=progressMoment(before,next);if(event){const lang=getLanguage();setMoment({id:Date.now(),title:event.title[lang],detail:event.detail[lang],label:event.label[lang],tier:event.tier,credits:event.credits,xp:event.xp});}else setMoment(previous=>previous?.tier==='check'?null:previous);return event;},[]);
 const onAction=useCallback((action:Action)=>{const before=current.current,next=act(before,action,edition);update(next);celebrate(before,next);if(edition==='demo'&&!isDemoComplete(before)&&isDemoComplete(next))setDemoCompleteOpen(true);const progress=showProgress(before,next);if(next.gameplay.career.completed.length>before.gameplay.career.completed.length){feedback(progress?.tier==='milestone'?'opening':'reward');}else if(next.gameplay.career.ending&&!before.gameplay.career.ending)feedback('opening');else if(next.gameplay.career.release.published&&!before.gameplay.career.release.published)feedback('release');else if(action.type==='career-release-test')feedback(next.gameplay.career.release.proof?.passed?'success':'retry');else if(action.type==='career-release-build'&&next.gameplay.career.release.build)feedback('success');else if(action.type==='career-test')feedback(next.gameplay.career.proofs[action.id]?.passed?(progress?'success':'click'):'retry');else if(next.completed.length>before.completed.length||next.gameplay.claimedBonuses.length>before.gameplay.claimedBonuses.length)feedback('reward');else if(next.gameplay.practice.completed.length>before.gameplay.practice.completed.length)feedback('reward');else if(next.gameplay.lab.completed.length>before.gameplay.lab.completed.length||next.gameplay.lab.audited.length>before.gameplay.lab.audited.length)feedback('reward');else if(action.type==='lab-run')feedback(next.gameplay.lab.proofs[action.id as keyof typeof next.gameplay.lab.proofs]?.passed?'success':'retry');else if(action.type==='practice-submit')feedback(next.gameplay.practice.results[action.id as keyof typeof next.gameplay.practice.results]?.passed?'success':'retry');else if(next.gameplay.servedCustomers>before.gameplay.servedCustomers)feedback('success');else if(next.gameplay.openingCelebrated&&!before.gameplay.openingCelebrated)feedback('opening');else if(next.credits<before.credits)feedback('purchase');else if(action.type==='equip-cosmetic')feedback('click');else if(action.type==='career-checkpoint'&&next.gameplay.career.checkpoints[action.id]&&JSON.stringify(next.gameplay.career.checkpoints[action.id])!==JSON.stringify(before.gameplay.career.checkpoints[action.id]))feedback('save');if(next.completed.length>before.completed.length)setReward({title:MISSIONS[before.mission].badge+' 달성!',credits:next.credits-before.credits,xp:next.xp-before.xp});else if(next.gameplay.claimedBonuses.length>before.gameplay.claimedBonuses.length)setReward({title:action.type==='claim-bonus'&&action.id==='explorer'?'터미널 탐험가 달성!':'컬러 실험가 달성!',credits:next.credits-before.credits,xp:next.xp-before.xp});},[update,feedback,showProgress,edition,celebrate]);
 const onAssist=useCallback((action:AssistAction)=>{try{const before=current.current,next=assist(before,action,edition);update(next);celebrate(before,next);if(next.completed.length>before.completed.length){feedback('reward');setReward({title:MISSIONS[before.mission].badge+' 달성!',credits:next.credits-before.credits,xp:next.xp-before.xp});}else feedback('click');return next;}catch(error){toast.error(String(error instanceof Error?error.message:error));return null;}},[update,feedback,edition,celebrate]);
 const onCommand=useCallback((command:string)=>{
  if(command.length>3000){toast.error('명령어는 3,000자까지 입력할 수 있어요.');return;}
  const previous=current.current,before=previous.testRequest,task=currentTask(previous,edition).id;
  const r=runCommand(previous,command,edition);update(r.state);const progress=showProgress(previous,r.state);celebrate(previous,r.state);
  const opsDone=r.state.gameplay.ops.completed.length>previous.gameplay.ops.completed.length,opsWon=opsDone?opsJob(r.state.gameplay.ops.completed.at(-1)!):undefined;
  if(r.error)feedback('retry');
  else if(opsWon){const lang=getLanguage();feedback('reward');setMoment({id:Date.now(),label:opsWon.track==='python'?ui('파이썬 자동화 완료','PYTHON JOB COMPLETE','Python依頼完了'):ui('SQL 의뢰 완료','SQL JOB COMPLETE','SQL依頼完了'),title:opsWon.title[lang],detail:opsWon.client[lang],tier:'delivery',credits:r.state.credits-previous.credits,xp:r.state.xp-previous.xp});}
  else if(r.state.gameplay.lab.completed.length>previous.gameplay.lab.completed.length){feedback('reward');setMoment({id:Date.now(),label:ui('코드 의뢰 완료','CODE JOB COMPLETE','コード依頼完了'),title:ui('내 함수가 작동해요','Your function works','自分の関数が動きました'),detail:'',tier:'delivery',credits:r.state.credits-previous.credits,xp:r.state.xp-previous.xp});}
  else if(r.state.gameplay.career.release.published&&!previous.gameplay.career.release.published)feedback('release');
  else if(progress||currentTask(r.state,edition).id!==task)feedback(progress?.tier==='milestone'?'opening':'success');
  else if(command.trim())feedback('command');
  if(r.openFile){noteWorkContext(workContextForFile(r.openFile));setEditorTarget({file:r.openFile,token:Date.now()});setApp('editor');setTerminalOpen(false);if(window.innerWidth<=1000)setSidebarOpen(false);}
  if(r.state.testRequest!==before)void testRef.current(r.state);
 },[update,feedback,setApp,showProgress,edition,celebrate,noteWorkContext]);
 const closeSidebar=useCallback(()=>{setSidebarOpen(false);requestAnimationFrame(()=>sidebarButton.current?.focus());},[]);
 const onOpen=useCallback((id:AppId)=>{if(!editionAllowsApp(edition,id)){toast(demoLockedMessage(getLanguage()));return;}
  if(id==='editor')noteWorkContext(workContextForFile(editorTarget?.file??''));
  else if(id!=='terminal')noteWorkContext(workSelectionRef.current[id]??(id==='challenges'&&guided?null:defaultWorkContext(current.current,id)));
  setApp(id);feedback('open');if(window.innerWidth<=1000)setSidebarOpen(false);setTerminalOpen(false);},[feedback,setApp,edition,noteWorkContext,editorTarget,guided]);
 const closeApp=useCallback(()=>{if(app!=='desktop'){closeWindow(app);feedback('close');}setTerminalOpen(false);},[app,closeWindow,feedback]);
 const onNavigate=useCallback((address:string)=>{setUrl(address);onOpen('browser');},[onOpen]);
 const queueCommand=useCallback((command:string)=>{setQueued(command);onOpen('terminal');},[onOpen]);
 const onRequest=useCallback((method:string,address:string,body:string)=>{const result=apiRequest(current.current,method,address,body);update(result.state);return {status:result.status,data:result.data};},[update]);
 const runTests=useCallback(async(s:GameState=current.current)=>{if(checking.current)return;if(s.repo&&!editionAllowsProject(edition,s.repo.root)){toast(demoLockedMessage(getLanguage()));return;}if(!s.repo){toast('먼저 CatHub 저장소를 복제해 주세요.');return;}if(s.mission===0&&!isProjectServerRunning(s)){toast('프로젝트 폴더에서 개발 서버를 켜 주세요. 다른 폴더의 서버는 pkill node로 종료할 수 있어요.');return;}checking.current=true;setTesting(true);try{const hash=sourceHash(projectFiles(s)),design=DESIGN_CHOICES.find(c=>c.id===s.gameplay.designChoice);const layout=s.mission===0||design?await checkLayout(projectFiles(s),design?.rgb):null;const result=s.mission===0?layout!:runCodeChecks(s);if(current.current.mission!==s.mission||sourceHash(projectFiles(current.current))!==hash){toast('검사 중 파일이 바뀌었어요. 다시 검사해 주세요.');return;}const before=current.current,next=act(before,{type:'test-result',hash,checks:s.mission===0?result.slice(0,3):result,designChoice:design?.id,designPassed:!!design&&!!layout?.every(c=>c.passed)},edition);const progress=showProgress(before,next);feedback(result.every(c=>c.passed)?(progress?'success':'click'):'retry');update(next);celebrate(before,next);}finally{checking.current=false;setTesting(false);}},[update,feedback,showProgress,edition,celebrate]);
 useEffect(()=>{testRef.current=runTests;},[runTests]);
 useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key!=='Escape'||event.defaultPrevented||settings||reset||reward||levelUp||titleOpen)return;if(sidebarOpen&&window.innerWidth<=1000){event.preventDefault();closeSidebar();}else if(terminalOpen){event.preventDefault();setTerminalOpen(false);}else if(app!=='desktop'){event.preventDefault();closeApp();}else if(sidebarOpen){event.preventDefault();closeSidebar();}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[app,sidebarOpen,terminalOpen,settings,reset,reward,levelUp,titleOpen,closeApp,closeSidebar]);
 useEffect(()=>{const context=(document as Document&{modelContext?:ModelContext}).modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();const tools=[{name:'read_game_state',title:'Read coding simulator progress',description:'Read the current simulated machine, project files and contract steps. No real computer operations.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({mission:MISSIONS[current.current.mission].title,machine:current.current.machine,cwd:current.current.machines[current.current.machine].cwd,steps:missionSteps(current.current),files:!current.current.repo||editionAllowsProject(edition,current.current.repo.root)?projectFiles(current.current):{},credits:current.current.credits})},{name:'run_game_commands',title:'Run simulated terminal commands',description:'Run up to 12 commands in the game terminal and update the same visible game state. Never accesses the host shell or real network. Does not edit code or claim mission completion.',inputSchema:{type:'object',properties:{commands:{type:'array',items:{type:'string'},minItems:1,maxItems:12}},required:['commands'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:async(input:unknown)=>{if(!input||typeof input!=='object'||!('commands'in input))throw new Error('commands is required');const commands=(input as {commands:unknown}).commands;if(!Array.isArray(commands)||!commands.length||commands.length>12||commands.some(c=>typeof c!=='string'||c.length>3000))throw new Error('Provide 1–12 string commands of at most 3000 characters.');setApp('terminal');const results=[];for(const cmd of commands){const r=runCommand(current.current,cmd,edition);const before=current.current.testRequest;update(r.state);if(r.state.testRequest!==before)await runTests(r.state);results.push({command:cmd,output:r.output,error:r.error});}await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));return {results,machine:current.current.machine,cwd:current.current.machines[current.current.machine].cwd};}}];for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}return ()=>lifecycle.abort();},[update,runTests,setApp,edition]);
 useEffect(()=>{document.title=GAME_BRAND;},[]);
 const onFollow=()=>{noteWorkContext(null);if(edition==='demo'&&isDemoComplete(current.current)){setDemoCompleteOpen(true);onOpen('achievements');return;}const task=currentTask(current.current,edition);if(task.app==='career'){setToolsFocus(0);setCareerTarget(null);setCareerFocus(x=>x+1);onOpen('career');return;}if(task.next){onAction({type:'next-mission'});onOpen('messages');return;}if(guided&&current.current.accepted&&!current.current.completed.includes(current.current.mission)&&task.app!=='messages'){onOpen('repair');return;}if(task.command){queueCommand(task.command);return;}if(task.file)setEditorTarget({file:task.file,token:Date.now()});if(task.url)onNavigate(task.url);else onOpen(task.app);};
 const props:GameProps={edition,workContext,workSelections,onWorkContext:noteWorkContext,onBackup:()=>setSettings(true),browserUrl:url,onOpenTools:()=>{setCareerFocus(0);setCareerTarget(null);setToolsFocus(x=>x+1);onOpen('career');},guided,onAssist,onFollow,openCareerFile:(jobId,file)=>{if(edition==='demo'&&(jobId!==DEMO_SAMPLE_JOB||!isDemoCafeComplete(current.current))){toast(demoLockedMessage(getLanguage()));return;}setCareerFocus(0);setToolsFocus(0);onAction({type:"career-accept",id:jobId});setCareerTarget({jobId,file,requestId:Date.now()});onOpen("career");},openFile:(file)=>{if(!editionAllowsPath(edition,file,current.current.repo?.root??current.current.machines.local.cwd,current.current)){toast(demoLockedMessage(getLanguage()));return;}setEditorTarget({file,token:Date.now()});onOpen('editor');noteWorkContext(workContextForFile(file));},editorTarget,state,onAction,onCommand,onOpen,onNavigate,onTest:()=>void runTests(),testing,queueCommand,onRequest};
 const renderApp=(id:AppId)=>{if(!editionAllowsApp(edition,id))return <DemoBoundary/>;switch(id){
 case 'computer':return <ComputerView {...props}/>;
 case 'notes':return <Notepad/>;
 case 'challenges':return <ChallengesHub {...props}/>;
 case 'career':return <CareerView {...props} careerFileTarget={careerTarget} focusRequest={careerFocus} toolsRequest={toolsFocus}/>;
 case 'repair':return guided?<CafeCoach key={state.mission} {...props}/>:<RepairDesk {...props}/>;
 case 'server':return <ServerView {...props}/>;
 case 'api':return <ApiView {...props}/>;
 case 'browser':return <BrowserView {...props} url={url}/>;
 case 'editor':return <EditorView {...props}/>;
 case 'terminal':return <TerminalView {...props} queued={queued} onQueued={()=>setQueued('')}/>;
 case 'missions':return <MissionsView {...props}/>;
 case 'messages':return <MessagesView {...props}/>;
 case 'workbench':return <WorkbenchView {...props}/>;
 case 'achievements':return <AchievementsView {...props}/>;
 case 'profile':return <ProfileView {...props}/>;
 case 'python':return <OpsLabView props={props} track="python"/>;
 case 'sql':return <OpsLabView props={props} track="sql"/>;
 default:return null;
 }};
 // 터미널을 왼쪽, 지금 보던 창(없으면 의뢰 화면이나 브라우저)을 오른쪽에 둔다.
 const tileWorkspace=()=>{if(!editionAllowsApp(edition,'terminal')){toast(demoLockedMessage(getLanguage()));return;}const s=current.current,coaching=guided&&s.accepted&&!s.completed.includes(s.mission)&&!s.gameplay.openingCelebrated;manager.tile('terminal',coaching?'repair':editionAllowsApp(edition,'browser')?'browser':'editor');setTerminalOpen(false);if(window.innerWidth<=1000)setSidebarOpen(false);feedback('open');};
 const toggleSound=()=>{setSound(x=>!x);try{localStorage.setItem('codeshift-sound',String(!sound));}catch{}};
 return localizeUI(<div suppressHydrationWarning onInput={()=>queueMicrotask(()=>setMoment(previous=>previous?.tier==='check'?null:previous))} data-theme={state.gameplay.equippedCosmetic} data-level-theme={loadout.theme==='default'?undefined:loadout.theme} data-terminal-skin={loadout.terminal} data-reduced-motion={feedbackPreferences.reducedMotion} className={'game-desktop pc-shell '+(sidebarOpen?'':'quest-hidden')}>
  {moment&&!titleOpen&&<div key={moment.id} className={"game-moment moment-"+moment.tier} role="status" data-testid="progress-moment" data-tier={moment.tier} data-no-translate><div className="moment-seal">{moment.tier==='milestone'?<Rocket size={26}/>:<Check size={26}/>}</div><div><small>{moment.label}</small><strong>{moment.title}</strong><span>{moment.detail}</span>{(moment.credits>0||moment.xp>0)&&<b>+{moment.credits} cr · +{moment.xp} XP</b>}</div><i/></div>}
  {!titleOpen&&<DesktopOS manager={manager} props={props} renderApp={renderApp} onSettings={()=>setSettings(true)} onTitle={()=>setTitleOpen(true)} sound={sound} onSound={toggleSound} mix={feedbackPreferences} onMix={changeFeedbackPreferences} onTile={tileWorkspace} saveStatus={saveStatus} sidebarOpen={sidebarOpen} onSidebar={()=>setSidebarOpen(x=>!x)} advanced={advanced} onWindowClose={()=>feedback('close')}/>}
  {titleOpen&&<TitleScreen hasSave={hasSave} language={language} loading={loading} unavailable={loadFailed} paused={settings||reset} onStart={()=>{if(loading||loadFailed)return;setEntryMode('continue');manager.clear();workSelectionRef.current={};setWorkSelections({});setWorkContext(null);setCareerFocus(0);setToolsFocus(0);setCareerTarget(null);setTitleOpen(false);if(edition==='demo'&&isDemoComplete(current.current))setDemoCompleteOpen(true);feedback('click');}} onSettings={()=>setSettings(true)} onNew={()=>{if(loading||loadFailed)return;if(hasSave)setReset(true);else{setEntryMode('new');update(current.current);manager.clear();workSelectionRef.current={};setWorkSelections({});setWorkContext(null);setTitleOpen(false);feedback('click');}}}/>}
  {loadFailed&&titleOpen&&<div className="save-recovery-alert" role="alert"><p>{ui("저장 파일 복구가 필요해요. 설정에서 백업을 불러오거나 진행 기록을 초기화해 주세요.","Save recovery is needed. Open Settings to import a backup or reset progress.","セーブの復元が必要です。設定でバックアップを読み込むか進行をリセットしてください。")}</p><button className="outline-button" onClick={()=>setSettings(true)}>{ui("설정 열기","Open Settings","設定を開く")}</button></div>}
  <Dialog open={settings} onOpenChange={setSettings}><DialogContent closeLabel={t('대화상자 닫기')} className="settings-dialog" onCloseAutoFocus={event=>{if(titleOpen){event.preventDefault();document.querySelector<HTMLButtonElement>('[data-testid="title-settings"]')?.focus();}}}><DialogHeader><DialogTitle>작업실 설정</DialogTitle><DialogDescription>Localhost Hero · 0.14.0 RC</DialogDescription></DialogHeader><div className="settings-row language-setting"><div><strong>언어 / Language / 言語</strong><p>언어를 바꿔도 의뢰와 코드는 유지됩니다.</p></div><LanguageSelect/></div><FeedbackSettings value={feedbackPreferences} onChange={changeFeedbackPreferences} enabled={sound} onToggle={toggleSound} onPreview={feedback}/><div className="settings-row guided-mode-setting" data-no-translate><div><strong>{ui("플레이 방식","Play style","プレイ方法")}</strong><p>{ui("함께 배우기는 화면을 만지며 한 글자부터 시작해요. 직접 작업은 앱과 터미널을 바로 사용해요. 언제든 바꿀 수 있어요.","Learn together starts with visible changes and one character. Work directly uses the apps and terminal. Switch any time.","いっしょに学ぶでは画面を触って1文字から。直接作業ではアプリとターミナルを使います。いつでも切替できます。")}</p></div><button data-testid="guided-mode-toggle" className="outline-button coach-mode-choice" aria-pressed={guided} onClick={()=>{setGuided(x=>!x);try{localStorage.setItem('codeshift-guided',String(!guided));}catch{}}}>{guided?ui("함께 배우기","Learn together","いっしょに学ぶ"):ui("직접 작업","Work directly","直接作業")}</button></div><div className="settings-row"><div><strong>모든 앱 표시</strong><p>아직 이야기에서 열리지 않은 서버와 API 앱도 표시해요.</p></div><button className="outline-button" aria-pressed={advanced} onClick={()=>{setAdvanced(x=>!x);try{localStorage.setItem('codeshift-advanced',String(!advanced));}catch{}}}>{advanced?'켜짐':'꺼짐'}</button></div><div className="settings-row"><div><strong>창 닫기와 다시 열기</strong><p>X 또는 Esc로 작업실에 돌아가세요. 앱 아이콘을 누르면 다시 열립니다. 도움말과 의뢰 패널도 각각 닫을 수 있어요.</p></div><Monitor size={20}/></div><div className="settings-row"><div><strong>저장 위치</strong><p>{platform?ui("이 컴퓨터의 저장 파일에 자동 저장됩니다. 이전 저장은 백업으로 보관합니다.","Progress autosaves to this computer. The previous save is kept as a backup.","このPCのファイルに自動保存されます。前回のセーブはバックアップとして保持します。"):t("현재 브라우저에 자동 저장됩니다. 다른 기기와 동기화되지 않습니다.")}</p></div><Check size={20}/></div><div className="settings-row"><div><strong>민서의 도움말</strong><p>힌트는 언제든 볼 수 있어요. 사용해도 보상이 줄어들지 않아요.</p></div><BookOpen size={20}/></div>{edition==='demo'&&<DemoFeedbackSettings language={language} stage={demoStage} enabled={demoMetrics.enabled} onEnabled={demoMetrics.choose}/>}<SaveTools disabled={loading} exportDisabled={loadFailed} state={state} onImport={next=>{saveBlocked.current=false;setLoadFailed(false);update(next);setLevelUp(null);setTrophies([]);manager.clear();workSelectionRef.current={};setWorkSelections({});setWorkContext(null);setMoment(null);setEditorTarget(null);setDemoCompleteOpen(false);setTitleOpen(true);setSettings(false);setReward(null);setQueued("");setUrl(START_URL);}}/>{platform&&<p className="platform-status">{platform.steamAvailable?"Steam · "+ui("연결됨","Connected","接続済み"):ui("오프라인 실행 · 로컬 저장","Offline mode · Local saves","オフライン起動 · ローカル保存")}</p>}<button className="outline-button" onClick={()=>setSettings(false)}>설정 닫기</button><button className="outline-button" onClick={()=>{setSettings(false);setTitleOpen(true);}}>타이틀로 돌아가기</button><button className="reset-button" disabled={loading} onClick={()=>{setSettings(false);setReset(true);}}>진행 기록 초기화</button></DialogContent></Dialog>
  <Dialog open={!!reward} onOpenChange={open=>{if(!open)setReward(null);}}><DialogContent closeLabel={t('대화상자 닫기')} className="reward-dialog"><DialogHeader><div className="reward-seal"><Trophy size={42}/></div><DialogTitle>{reward?.title}</DialogTitle><DialogDescription>직접 해낸 결과가 내 개발 기록에 남았어요.</DialogDescription></DialogHeader><div className="reward-payout"><span><Coins size={23}/>+{reward?.credits} cr</span><span><Flame size={23}/>+{reward?.xp} XP</span></div><p className="reward-subtext">보상 지급 완료 · 배지는 성취 창에서 확인할 수 있어요.</p><button className="primary-button" onClick={()=>{setReward(null);onFollow();}}><Rocket size={18}/>이야기 계속하기</button><button className="outline-button" onClick={()=>{setReward(null);closeApp();}}>작업실로 돌아가기</button></DialogContent></Dialog>
  {!titleOpen&&!reward&&levelUp&&<LevelUpOverlay level={levelUp} onClose={()=>setLevelUp(null)} onEquip={()=>{setLevelUp(null);onOpen('profile');}}/>}
  {!titleOpen&&trophies[0]&&<AchievementToast key={trophies[0].id} achievement={trophies[0]} onDone={()=>setTrophies(list=>list.slice(1))}/>}
  <AlertDialog open={reset} onOpenChange={setReset}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>새 작업실에서 다시 시작할까요?</AlertDialogTitle><AlertDialogDescription>{ui("저장된 코드, 의뢰 진행, 크레딧과 배지가 초기화됩니다.","Saved code, jobs, credits and badges will be reset.","保存されたコード、依頼、クレジット、バッジがリセットされます。")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={()=>{saveBlocked.current=false;setLoadFailed(false);setEntryMode('new');update(createGame());setLevelUp(null);setTrophies([]);setDemoCompleteOpen(false);manager.clear();workSelectionRef.current={};setWorkSelections({});setWorkContext(null);setMoment(null);setCareerFocus(0);setToolsFocus(0);setCareerTarget(null);setTitleOpen(false);setUrl(START_URL);setQueued('');setTerminalOpen(false);setSidebarOpen(window.innerWidth>1000);setEditorTarget(null);setReward(null);toast('새 이야기가 준비됐어요.');}}>초기화하고 다시 시작</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  {edition==='demo'&&<DemoComplete open={demoCompleteOpen} onClose={()=>{setDemoCompleteOpen(false);onOpen('achievements');}} onBackup={()=>{setDemoCompleteOpen(false);setSettings(true);}}/>}
  <Toaster theme="dark" position="bottom-center" richColors closeButton visibleToasts={1} duration={2200}/>
 </div>);
}
