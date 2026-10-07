import type {GameState} from './engine.ts';

export const COSMETICS=[
 {id:'mint',name:'미드나잇 민트',color:'#72e4bf',price:0,description:'첫 작업실의 차분한 초록빛'},
 {id:'amber',name:'골든 아워',color:'#f4bf78',price:90,description:'야근도 따뜻하게, 노을빛 작업실'},
 {id:'violet',name:'네온 라일락',color:'#c5a5ff',price:90,description:'나만의 리듬으로, 보랏빛 작업실'},
] as const;
export const DESIGN_CHOICES=[
 {id:'sunrise',name:'햇살 앰버',color:'#c77b30',rgb:'rgb(199, 123, 48)'},
 {id:'ocean',name:'오션 블루',color:'#3678a8',rgb:'rgb(54, 120, 168)'},
] as const;
export type DesignId=typeof DESIGN_CHOICES[number]['id'];
export type Gameplay={
 readMessages:string[];
 exploration:{pwd:boolean;ls:boolean;readme:boolean};
 claimedBonuses:string[];
 ownedCosmetics:string[];
 equippedCosmetic:typeof COSMETICS[number]['id'];
 designChoice:DesignId|null;
 designEvidence:null|{hash:string;choice:DesignId;passed:boolean};
};
export function createGameplay():Gameplay{return {readMessages:[],exploration:{pwd:false,ls:false,readme:false},claimedBonuses:[],ownedCosmetics:['mint'],equippedCosmetic:'mint',designChoice:null,designEvidence:null};}
export type GameMessage={id:string;sender:string;role:string;subject:string;body:string;initial:string;action:'accept'|'missions'|'workbench'|'preview'|'achievements'};
export function gameMessages(s:GameState):GameMessage[]{
 const all:{message:GameMessage;unlocked:boolean}[]=[
  {unlocked:true,message:{id:'welcome',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'우리 카페의 첫 홈페이지를 부탁해요.',body:'안녕하세요! 메뉴 페이지를 준비했는데 카페 이름이 빠져 있고, 휴대폰에선 화면이 삐져나오네요. 제목과 너비를 고쳐 주실 수 있나요? 잘 마무리되면 350 cr를 드릴게요. 첫 의뢰, 같이 해봐요!',action:'accept'}},
  {unlocked:s.accepted,message:{id:'mentor',sender:'민서',role:'옆자리 개발자',initial:'민',subject:'막혀도 괜찮아. 네 작업실이니까.',body:'오류가 떠도 의뢰가 날아가지는 않아. 내용을 읽고 한 단계씩 해결해 보자. 여유가 생기면 보너스 과제도 해봐! 프로젝트를 탐색하고 버튼 색을 바꾸면 추가 크레딧과 배지를 받을 수 있어.',action:'workbench'}},
  {unlocked:!!s.repo,message:{id:'repo',sender:'민서',role:'옆자리 개발자',initial:'민',subject:'프로젝트 도착! 안에 뭐가 들었을까?',body:'파일을 가져왔네! 프로젝트 폴더에서 pwd로 위치를 확인하고, ls로 목록을 보고, cat README.md로 안내를 읽어 봐. 세 가지를 모두 해보면 터미널 탐험가 배지를 받을 수 있어.',action:'workbench'}},
  {unlocked:!!s.repo&&s.machines.local.dependencies.includes(s.repo.root),message:{id:'preview',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'휴대폰으로도 메뉴가 잘 보이면 좋겠어요.',body:'메뉴 세 가지와 주문 버튼이 화면 안에 모두 보이면 돼요. 그롬에서 PC와 360px 화면을 번갈아 확인해 주세요. 직접 바꾼 코드가 화면으로 나타나는 게 신기하네요!',action:'preview'}},
  {unlocked:s.completed.includes(0),message:{id:'thanks',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'첫 손님에게 홈페이지를 보여드렸어요!',body:'이제 모노 카페 이름도 보이고 휴대폰으로 메뉴도 잘 읽혀요. 정말 고마워요! 약속한 350 cr를 보냈어요. 첫 배포 배지도 잘 받으셨죠? 다음에 또 함께 일해요.',action:'achievements'}},
 ];
 return all.filter(x=>x.unlocked||s.gameplay.readMessages.includes(x.message.id)).map(x=>x.message);
}
export function canClaimColor(s:GameState,hash:string):boolean{
 const e=s.gameplay.designEvidence;
 return !!e&&e.passed&&e.hash===hash&&e.choice===s.gameplay.designChoice&&s.tests?.mission===0&&s.tests.hash===hash&&s.tests.checks.length===3&&s.tests.checks.every(c=>c.passed);
}
