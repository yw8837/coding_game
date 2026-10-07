import {projectFiles,sourceHash,isProjectServerRunning,type GameState} from './engine.ts';

export type DemoGuideStep={title:string;body:string;label:string;command?:string;target:'accept'|'search'|'repo'|'terminal'|'editor'|'check'|'review'|'finish'};
export function demoGuide(s:GameState):DemoGuideStep {
 const m=s.machines.local,r=s.repo,files=projectFiles(s);
 const command=(title:string,body:string,line:string):DemoGuideStep=>({title,body,label:'명령어 넣기',command:line,target:'terminal'});
 if(s.completed.includes(0))return {title:'첫 사이트를 공개했어요!',body:'HTML 제목과 CSS 너비를 바꾸고, 변경 기록을 남겨 배포까지 마쳤어요.',label:'내 결과 보기',target:'finish'};
 if(!s.accepted)return {title:'카페의 첫 의뢰를 받아 볼까요?',body:'오늘은 제목 한 줄과 너비 한 줄을 고쳐요. 설치와 명령어는 전부 게임 안에서만 작동해요.',label:'입문 데모 시작',target:'accept'};
 if(!s.discovered.repo)return {title:'COOCLE에서 프로젝트 찾기',body:'검색창에 mono cafe를 입력하고, 검색 결과의 CatHub 저장소를 열어 보세요.',label:'COOCLE 열기',target:'search'};
 if(!r)return command('프로젝트를 내 작업실로 가져오기','git clone은 저장소를 복제해요. 버튼을 누른 뒤 터미널에서 Enter를 눌러 실행하세요.','git clone https://cathub.dev/mono/menu-site.git');
 if(!m.updated)return command('설치할 도구 목록 확인하기','apt update는 설치할 수 있는 도구 목록을 갱신해요. 실행 후 다음 안내가 나타나요.','sudo apt update');
 if(!m.tools.includes('nodejs')||!m.tools.includes('npm'))return command('Node.js와 npm 준비하기','Node.js는 JavaScript 실행 도구, npm은 프로젝트에 필요한 도구를 준비하는 명령이에요.','sudo apt install nodejs npm');
 if(m.cwd!==r.root)return command('프로젝트 폴더로 이동하기','cd는 폴더를 이동해요. 명령은 현재 폴더를 기준으로 실행되므로 위치가 중요해요.','cd ~/menu-site');
 if(!m.dependencies.includes(r.root))return command('프로젝트에 필요한 도구 준비하기','npm install은 이 폴더의 package.json을 읽고 필요한 도구를 준비해요.','npm install');
 if(!isProjectServerRunning(s))return m.processes.frontend?command('다른 폴더의 서버 종료하기','지금 실행 중인 서버를 멈추고 현재 프로젝트에서 다시 시작해요.','pkill node'):command('미리보기 서버 켜기','npm run dev를 실행하면 그롬의 localhost:5173에서 작업 중인 페이지를 볼 수 있어요.','npm run dev');
 const hash=sourceHash(files),tested=s.tests?.hash===hash&&s.tests.checks.length===3&&s.tests.checks.every(c=>c.passed);
 if(!tested){
  const title=files['index.html']?.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]??'';
  if(!title.includes('모노 카페'))return {title:'① HTML의 큰 제목 바꾸기',body:'index.html에서 <h1>과 </h1> 사이를 “모노 카페에 오신 걸 환영해요.”로 바꿔 보세요.',label:'제목 고치러 가기',target:'editor'};
  return {title:'② CSS 너비를 고치고 검사하기',body:'에디터의 “② CSS 너비”를 열고 width: 960px을 width: 100%로 바꾸세요. 저장은 자동이에요.',label:'검사 실행',target:'check'};
 }
 const head=r.commits.at(-1)!;
 if(head.hash!==hash){const staged={...head.files};for(const [key,value]of Object.entries(r.staged)){if(value===null)delete staged[key];else staged[key]=value;}
  return sourceHash(staged)!==hash?command('수정한 파일을 기록할 준비하기','git add .은 지금 수정한 파일을 다음 기록에 담을 준비를 해요.','git add .'):command('첫 커밋 남기기','커밋은 설명이 붙은 코드의 저장 지점이에요. 따옴표 안에 수정 내용을 적어요.','git commit -m "My first cafe page"');}
 if(r.remote.id!==head.id)return command('CatHub로 내 기록 보내기','git push를 실행해야 CatHub에서도 방금 만든 커밋을 볼 수 있어요.','git push');
 return {title:r.pr?.status==='merged'?'마지막으로 사이트 배포하기':r.pr?.status==='approved'?'승인된 변경을 병합하기':'CatHub에서 검토받기',body:r.pr?.status==='merged'?'“검토한 버전 배포”를 누르면 의뢰가 끝나고 첫 배지를 받아요.':r.pr?.status==='approved'?'PR 화면에서 “PR 병합”을 누르세요. 그다음 배포할 수 있어요.':'Pull requests 화면에서 “PR 만들기 · 검토 요청”을 눌러 주세요.',label:'CatHub 검토 열기',target:'review'};
}
