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
 servedCustomers:number;
 openingCelebrated:boolean;
 readMessages:string[];
 exploration:{pwd:boolean;ls:boolean;readme:boolean};
 claimedBonuses:string[];
 ownedCosmetics:string[];
 equippedCosmetic:typeof COSMETICS[number]['id'];
 designChoice:DesignId|null;
 designEvidence:null|{hash:string;choice:DesignId;passed:boolean};
};
export function createGameplay():Gameplay{return {servedCustomers:0,openingCelebrated:false,readMessages:[],exploration:{pwd:false,ls:false,readme:false},claimedBonuses:[],ownedCosmetics:['mint'],equippedCosmetic:'mint',designChoice:null,designEvidence:null};}
export type GameMessage={id:string;sender:string;role:string;subject:string;body:string;initial:string;action:'repair'|'accept'|'missions'|'workbench'|'preview'|'achievements'};
export function gameMessages(s:GameState):GameMessage[]{
 const all:{message:GameMessage;unlocked:boolean}[]=[
  {unlocked:true,message:{id:'welcome',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'간판이 바뀌었어요!',body:'저는 모노 카페 사장 지우예요. 휴대폰 메뉴판에 엉뚱한 가게 이름이 붙었어요. 우리 카페 간판을 골라 주실래요? 아래 버튼을 누르면 간판 두 개를 보여드릴게요.',action:'accept'}},
  {unlocked:s.completed.includes(0),message:{id:'mentor',sender:'민서',role:'옆자리 개발자',initial:'민',subject:'막혀도 괜찮아. 네 작업실이니까.',body:'오류가 떠도 의뢰가 날아가지는 않아. 내용을 읽고 한 단계씩 해결해 보자. 여유가 생기면 보너스 과제도 해봐! 프로젝트를 탐색하고 버튼 색을 바꾸면 추가 크레딧과 배지를 받을 수 있어.',action:'workbench'}},
  {unlocked:s.completed.length===3,message:{id:'repo',sender:'민서',role:'옆자리 개발자',initial:'민',subject:'프로젝트 도착! 안에 뭐가 들었을까?',body:'파일을 가져왔네! 프로젝트 폴더에서 pwd로 위치를 확인하고, ls로 목록을 보고, cat README.md로 안내를 읽어 봐. 세 가지를 모두 해보면 터미널 탐험가 배지를 받을 수 있어.',action:'workbench'}},
  {unlocked:s.completed.includes(0),message:{id:'preview',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'휴대폰으로도 메뉴가 잘 보이면 좋겠어요.',body:'메뉴 세 가지와 주문 버튼이 화면 안에 모두 보이면 돼요. 그롬에서 PC와 360px 화면을 번갈아 확인해 주세요. 직접 바꾼 코드가 화면으로 나타나는 게 신기하네요!',action:'preview'}},
  {unlocked:s.completed.includes(0),message:{id:'thanks',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'첫 손님에게 홈페이지를 보여드렸어요!',body:'이제 모노 카페 이름도 보이고 휴대폰으로 메뉴도 잘 읽혀요. 정말 고마워요! 약속한 350 cr를 보냈어요. 첫 배포 배지도 잘 받으셨죠? 다음에 또 함께 일해요.',action:'achievements'}},
  {unlocked:s.mission>=1,message:{id:'chapter-two',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'새 계산대가 조금 이상해요.',body:'홈페이지가 생겨서 손님이 늘었어요! 새 계산대를 연결했는데 커피 세 잔이 4,503원으로 보여요. 계산 방법을 함께 살펴봐 주실래요?',action:'repair'}},
  {unlocked:s.completed.includes(1),message:{id:'chapter-two-thanks',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'이제 잔돈까지 딱 맞아요!',body:'커피를 몇 잔 주문해도 금액이 정확해요. 약속한 500 cr를 보냈어요. 마지막으로 밖에서도 주문할 수 있으면 카페를 정식 오픈할 수 있겠어요.',action:'repair'}},
  {unlocked:s.mission>=2,message:{id:'chapter-three',sender:'민서',role:'옆자리 개발자',initial:'민',subject:'주문서는 어디로 갔을까?',body:'손님 앱의 메뉴 주소와 카페 쪽 주소가 같은지 살펴봐. 그다음 주문서를 보관하도록 해보자. 손님 테스트에서 실제로 주문 한 건을 보내 볼 거야.',action:'repair'}},
  {unlocked:s.completed.includes(2),message:{id:'opening',sender:'지우',role:'모노 카페 사장',initial:'지',subject:'모노 카페, 오늘 정식 오픈해요!',body:'휴대폰 메뉴판도, 계산도, 주문 배달도 잘 돼요. 처음부터 끝까지 함께해 줘서 고마워요. 카페 한쪽에 당신의 첫 배포 배지를 걸어 둘게요. 우리 동네 해결사님, 커피 마시러 오세요!',action:'achievements'}},
 ];
 return all.filter(x=>x.unlocked||s.gameplay.readMessages.includes(x.message.id)).map(x=>x.message);
}
export function canClaimColor(s:GameState,hash:string):boolean{
 const e=s.gameplay.designEvidence;
 return !!e&&e.passed&&e.hash===hash&&e.choice===s.gameplay.designChoice;
}
