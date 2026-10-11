import type {GameState} from './engine.ts';

/** Levels are derived from saved XP only; nothing here is stored separately. */
export type ProgressLanguage='ko'|'en'|'ja';
export type ProgressCopy=Record<ProgressLanguage,string>;
const c=(ko:string,en:string,ja:string):ProgressCopy=>({ko,en,ja});

export const LEVELS=[
 {level:1,xp:0,title:c('견습 해결사','Apprentice Fixer','見習いフィクサー')},
 {level:2,xp:120,title:c('터미널 루키','Terminal Rookie','ターミナル・ルーキー')},
 {level:3,xp:300,title:c('주니어 개발자','Junior Developer','ジュニア開発者')},
 {level:4,xp:550,title:c('버그 헌터','Bug Hunter','バグハンター')},
 {level:5,xp:900,title:c('동네 해결사','Neighborhood Fixer','まちのフィクサー')},
 {level:6,xp:1350,title:c('스크립트 장인','Script Artisan','スクリプト職人')},
 {level:7,xp:1900,title:c('데이터 마법사','Data Wizard','データの魔法使い')},
 {level:8,xp:2600,title:c('시니어 엔지니어','Senior Engineer','シニアエンジニア')},
 {level:9,xp:3400,title:c('시스템 아키텍트','Systems Architect','システムアーキテクト')},
 {level:10,xp:4300,title:c('로컬호스트 히어로','Localhost Hero','ローカルホスト・ヒーロー')},
] as const;
export const MAX_LEVEL=LEVELS.length;

export function levelForXp(xp:number):number{
 const value=Number.isFinite(xp)?xp:0;
 let level=1;for(const row of LEVELS)if(value>=row.xp)level=row.level;
 return level;
}
export function levelInfo(xp:number){
 const level=levelForXp(xp),row=LEVELS[level-1],next=LEVELS[level]??null;
 const span=next?next.xp-row.xp:1,into=next?Math.max(0,xp-row.xp):1;
 return {level,title:row.title,floor:row.xp,next:next?.xp??null,progress:next?Math.min(1,into/span):1,remaining:next?Math.max(0,next.xp-xp):0};
}

export type LoadoutSlot='theme'|'terminal'|'keys'|'bgm';
export type Loadout={theme:string;terminal:string;keys:string;bgm:string};
export const DEFAULT_LOADOUT:Loadout={theme:'default',terminal:'classic',keys:'mechanical',bgm:'lofi'};
export type LoadoutItem={slot:LoadoutSlot;id:string;level:number;name:ProgressCopy;detail:ProgressCopy};
export const LOADOUT_ITEMS:readonly LoadoutItem[]=[
 {slot:'theme',id:'default',level:1,name:c('상점 배경 사용','Shop wallpaper','ショップの壁紙'),detail:c('꾸미기에서 고른 바탕화면을 그대로 써요.','Keep the wallpaper chosen in Personalize.','個人設定で選んだ壁紙をそのまま使います。')},
 {slot:'keys',id:'mechanical',level:1,name:c('기계식 청축','Clicky mechanical','メカニカル青軸'),detail:c('또각또각 경쾌한 기본 타건음','The crisp default key click','カチカチ軽快な標準の打鍵音')},
 {slot:'terminal',id:'classic',level:1,name:c('클래식 셸','Classic shell','クラシックシェル'),detail:c('읽기 편한 기본 터미널','The easy-to-read default terminal','読みやすい標準ターミナル')},
 {slot:'bgm',id:'lofi',level:1,name:c('로파이 코딩','Lo-fi coding','ローファイ・コーディング'),detail:c('84 BPM의 잔잔한 작업 음악','Calm 84 BPM focus music','84 BPMの落ち着いた作業音楽')},
 {slot:'keys',id:'soft',level:2,name:c('저소음 택타일','Soft tactile','静音タクタイル'),detail:c('도톰하고 조용한 타건음','A soft, muted thock','やわらかく静かな打鍵音')},
 {slot:'terminal',id:'phosphor',level:3,name:c('인광 그린 CRT','Phosphor green CRT','蛍光グリーンCRT'),detail:c('주사선과 초록 잔광이 남는 해커 화면','Scanlines and a green afterglow','走査線と緑の残光が残るハッカー画面')},
 {slot:'theme',id:'matrix',level:4,name:c('매트릭스 그린','Matrix green','マトリックス・グリーン'),detail:c('초록 코드 비가 내리는 바탕화면','A desktop of falling green code','緑のコードが降るデスクトップ')},
 {slot:'bgm',id:'synthwave',level:5,name:c('신스웨이브 나이트 드라이브','Synthwave night drive','シンセウェイブ・ナイトドライブ'),detail:c('104 BPM 네온 신스 BGM','Neon synth music at 104 BPM','104 BPMのネオンシンセBGM')},
 {slot:'keys',id:'typewriter',level:6,name:c('타자기','Typewriter','タイプライター'),detail:c('철컥! 실행할 때 종이 울려요','Clack, with a bell when you run a command','カシャッ！実行時にベルが鳴ります')},
 {slot:'terminal',id:'amber',level:7,name:c('앰버 모니터','Amber monitor','アンバーモニター'),detail:c('80년대 호박색 단색 모니터','An 80s amber monochrome monitor','80年代の琥珀色モノクロモニター')},
 {slot:'theme',id:'cyberpunk',level:8,name:c('사이버펑크 네온','Cyberpunk neon','サイバーパンク・ネオン'),detail:c('마젠타와 시안 네온 그리드','Magenta and cyan neon grid','マゼンタとシアンのネオングリッド')},
 {slot:'keys',id:'retro',level:9,name:c('8비트 레트로','8-bit retro','8ビット・レトロ'),detail:c('오락실 칩튠 비프음','Arcade chiptune blips','ゲームセンターのチップチューン音')},
 {slot:'terminal',id:'hero',level:10,name:c('히어로 골드','Hero gold','ヒーローゴールド'),detail:c('최고 레벨에게만 주어지는 황금 셸','A golden shell for the top level','最高レベルだけの黄金シェル')},
];
export const LOADOUT_SLOTS:readonly LoadoutSlot[]=['theme','terminal','keys','bgm'];
export const SLOT_NAMES:Record<LoadoutSlot,ProgressCopy>={theme:c('바탕화면 테마','Desktop theme','デスクトップテーマ'),terminal:c('터미널 스킨','Terminal skin','ターミナルスキン'),keys:c('키보드 사운드','Keyboard sound','キーボード音'),bgm:c('배경음악','Music','BGM')};

export function loadoutItem(slot:LoadoutSlot,id:string):LoadoutItem|undefined{return LOADOUT_ITEMS.find(item=>item.slot===slot&&item.id===id);}
export function itemUnlocked(xp:number,item:LoadoutItem):boolean{return levelForXp(xp)>=item.level;}
export function unlocksAt(level:number):LoadoutItem[]{return LOADOUT_ITEMS.filter(item=>item.level===level);}
/** Saved choices are preferences. A locked or unknown id silently falls back. */
export function effectiveLoadout(s:Pick<GameState,'xp'>&{gameplay:{loadout?:Partial<Loadout>}}):Loadout{
 const saved=s.gameplay.loadout??{},result={...DEFAULT_LOADOUT};
 for(const slot of LOADOUT_SLOTS){const item=loadoutItem(slot,saved[slot]??'');if(item&&itemUnlocked(s.xp,item))result[slot]=item.id;}
 return result;
}

export type LevelUp={level:number;title:ProgressCopy;unlocks:LoadoutItem[]};
export function levelUps(beforeXp:number,afterXp:number):LevelUp[]{
 const from=levelForXp(beforeXp),to=levelForXp(afterXp),out:LevelUp[]=[];
 for(let level=from+1;level<=to;level++)out.push({level,title:LEVELS[level-1].title,unlocks:unlocksAt(level)});
 return out;
}
