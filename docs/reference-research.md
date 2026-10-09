# 데스크톱 코딩 게임 참고 조사

조사일: 2026-10-09. 현재 React/TypeScript 코드, `GAME-DESIGN.md`, `lib/game/workflow.ts`, 제공된 한국어 자막을 읽고 GitHub REST API를 `gh api`로 조회했다. 저장소 전체를 복제하거나 모든 예제의 코드를 감사하지 않았다. 아래의 **확인 사실**과 **현재 게임에 대한 설계 권고**를 구분한다. 엔진 교체나 새 엔진 패키지 도입은 권고하지 않는다.

## 현재 게임에 적용할 우선순위

### 1. 여러 앱을 실제 작업 창처럼 함께 유지

**확인 사실:** Godot 공식 문서의 [Creating applications → Spawning multiple windows / Constraining the window size](https://github.com/godotengine/godot-docs/blob/master/tutorials/ui/creating_applications.rst#spawning-multiple-windows)는 각 창의 이동·크기 변경·최소화·닫기를 독립 동작으로 설명하고 최소/최대 크기를 명시한다. 이는 네이티브 Godot 창에 관한 설명이며 브라우저 구현을 제공하는 문서는 아니다.

**설계 권고:** React에서는 앱별 `open`, `minimized`, `rect`, `zIndex`를 관리하고 활성 앱을 따로 기록한다. 브라우저에서 오류를 보며 옆 에디터를 수정하고, 터미널을 앞에 올려 결과를 읽을 수 있어야 한다. 제목 표시줄의 잡을 영역과 최소화/최대화/닫기 버튼은 구분한다. 작업 표시줄은 열린 앱·활성 앱·최소화 앱을 표시하고 클릭으로 복귀시킨다. 창을 닫는 동작이 파일, 명령 기록, 의뢰를 초기화하지 않도록 한다.

**검증할 행동:** 브라우저·에디터·터미널 3개를 동시에 열어 이동 → 앞뒤 전환 → 최소화 → 복귀 → 닫고 다시 열기를 해도 코드와 현재 목표가 유지된다. 뷰포트가 작아져도 제목 표시줄과 닫기 버튼을 되찾을 수 있다.

### 2. 클릭과 드래그의 소유권을 명확히 하기

**확인 사실:** Phaser의 [InputPlugin.js](https://github.com/phaserjs/phaser/blob/master/src/input/InputPlugin.js)에는 `topOnly`(기본 true), `setTopOnly`, `setDraggable`, `dragDistanceThreshold`, `dragTimeThreshold`와 drag-start / drag / drag-end 처리가 있다. `topOnly`는 겹친 오브젝트 중 맨 위 대상만 입력을 받게 한다. 이것은 게임 오브젝트 입력 설계의 참고이며 React에 그대로 복사할 API는 아니다.

**설계 권고:** 제목 표시줄만 이동을 시작하고 창 가장자리/모서리만 크기 변경을 시작한다. 닫기 버튼이나 에디터 입력을 누를 때 이동이 시작되지 않아야 한다. 드래그 시작 시 해당 창을 맨 앞으로 가져오고 pointer capture와 pointer-up/cancel 정리로 이동을 끝낸다. iframe 위를 지나가도 조작이 끊기지 않게 처리한다. 닫기 버튼은 드래그와 이벤트를 분리한다. 최소 크기와 화면 경계 제한은 게임의 레이아웃에 맞춰 정한다.

**검증할 행동:** 앞 창을 클릭했을 때 아래 창의 버튼이 작동하지 않는다. 창을 잡아 preview iframe 위로 움직인 후 놓으면 그 즉시 이동이 끝난다. 모서리로 축소해도 입력칸과 필수 버튼에 접근할 수 있다.

### 3. 퀘스트는 앱의 화면과 독립적으로 유지

**확인 사실:** [Saving games → Identify persistent objects / Serializing / Some notes](https://github.com/godotengine/godot-docs/blob/master/tutorials/io/saving_games.rst#identify-persistent-objects)는 무엇을 세션 간에 보존할지 먼저 정하고 직렬화하며, 로딩 상태 구성은 각 프로젝트가 설계해야 한다고 설명한다. 단순 상태에 JSON을 사용할 수 있다고 명시한다. 현재 `currentTask`는 파일, 서버 상태, 검사 해시, Git 스냅샷, API 증거로 다음 행동을 계산한다.

**설계 권고:** 현재 `currentTask(GameState)` 흐름을 유지하고, 체크리스트는 앱 전환·최소화·닫기에 관계없이 남긴다. 창 배치 저장과 진행 저장을 구분한다. 열린 창을 퀘스트 성공의 증거로 사용하지 않는다. 이미 완료한 검사·전송·단서는 실제 상태로 판정하고, 코드가 바뀌면 해당 검사 증거를 무효화한다. 저장의 신규 필드는 기본값으로 보완하고 기존 보상·파일·완료 상태를 보존한다.

**검증할 행동:** 의뢰 중 새로고침 후 같은 목표로 돌아온다. 완료 창을 다시 열어도 보상을 두 번 받지 않는다. 검사 뒤 코드를 다시 바꾸면 재검사를 요구한다.

### 4. 단서를 읽고 다음 행동을 발견하는 재미

**확인 사실:** [Hackhub 참고 영상](https://www.youtube.com/watch?v=HWQz19cO2JQ&t=1365s)의 확인 범위는 기존 문서에 기록된 00:38, 01:21, 22:45 장면과 제공된 한국어 자막이다. 영상 전체를 시청했다는 근거는 없다. 자막에는 도구 출력에서 비밀번호를 발견하고 다음 앱에서 사용하는 흐름, 옆 안내를 보고 따라가며 배경지식이 모두 필요하지 않다는 설명이 있다. 이것은 관찰한 플레이 흐름이며 원작 전체의 게임 시스템 분석은 아니다.

**설계 권고:** 의뢰 메시지 → 프로젝트 README/브라우저 오류 → 실제 수정 위치 → 실행 결과 → 검토 전달 순서로 단서를 연결한다. `README.md`를 읽으면 파일 이름이나 서버 주소를 발견하고, API 응답을 읽으면 주문 보관 여부를 확인하도록 한다. 발견한 단서는 안정적인 ID와 출처 앱/파일/명령을 기록해 단서 노트에 남긴다. 터미널 기록을 지워도 발견 기록은 유지한다. 필수 진행 단서는 분명하게 안내하고 보너스 탐색은 선택으로 둔다.

명령 넣기와 고칠 글자 찾기는 입력을 준비한다. 명령 실행·코드 수정·요청 전송·배포는 플레이어가 수행한다. 힌트는 처음에 목적과 열 앱을 설명하고, 막혔을 때 정확한 명령/위치를 보여 주는 단계로 발전시킬 수 있다. 잘못한 이유와 다음 시도를 앱 결과에서 읽을 수 있어야 한다.

### 5. 포커스와 드래그 대안을 함께 설계

**확인 사실:** [Godot Keyboard/Controller Navigation and Focus → Node settings / Initial focus](https://github.com/godotengine/godot-docs/blob/master/tutorials/ui/gui_navigation.rst#node-settings)는 복잡한 UI의 포커스 이동을 엔진의 추측에만 맡기지 말고 초기 포커스를 정하라고 안내한다. 숨겨진 컨트롤은 포커스를 잃을 수 있다고 설명한다. [UI Accessibility demo](https://github.com/godotengine/godot-demo-projects/tree/master/gui/accessibility)는 기본 UI와 커스텀 노드의 접근성 예제다.

웹 구현의 직접 기준으로 [WAI-ARIA APG Modal Dialog → Keyboard Interaction / Roles, States, and Properties](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) 원문 [소스](https://github.com/w3c/aria-practices/blob/master/content/patterns/dialog-modal/dialog-modal-pattern.html)도 확인했다. 모달의 Tab 순환, Escape 닫기, 닫힌 뒤 호출한 요소로 포커스 복귀, 실제 모달일 때만 `aria-modal=true` 사용을 설명한다. [WCAG 2.5.7 Dragging Movements → Intent](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) 원문 [소스](https://github.com/w3c/wcag/blob/main/understanding/22/dragging-movements.html)는 드래그 기능에 단일 포인터로 사용할 수 있는 대안을 요구하며 키보드 지원만으로 이 요구를 대신할 수 없다고 설명한다.

**설계 권고:** 일반 앱 창끼리는 자유롭게 전환하고, 설정/보상처럼 실제 모달인 화면만 포커스를 가둔다. Escape는 자동완성 후보 → 모달 → 활성 창처럼 앞의 표면부터 처리한다. 앱을 열 때 해당 앱의 유용한 입력/첫 컨트롤로, 닫을 때 작업 표시줄의 앱 버튼이나 다음 창으로 포커스를 돌린다. 작은 X 버튼에도 앱을 포함한 접근 가능한 이름을 붙인다. 이동·크기 변경의 대안으로 제목 표시줄 메뉴에 왼쪽 배치/오른쪽 배치/최대화/기본 위치·크기 복구를 제공한다.

**검증할 행동:** 키보드만으로 앱 열기, 입력, 전환, 모달 닫기, 복귀가 가능하다. 클릭/탭만으로 창을 유용하게 배치할 수 있다. 창 축소나 모달 닫기 뒤 포커스가 사라지지 않는다.

### 6. 짧은 보상 피드백과 읽기 편한 화면

**확인 사실:** Red Runner [AudioManager.cs](https://github.com/BayatGames/RedRunner/blob/master/Assets/Scripts/RedRunner/AudioManager.cs)는 음악·코인·사망·UI 음원을 구분하고, [GameManager.cs](https://github.com/BayatGames/RedRunner/blob/master/Assets/Scripts/RedRunner/GameManager.cs)는 점수 변화·오디오 설정 이벤트와 저장 데이터를 관리한다. [Squash the Creeps README → This demo covers](https://github.com/godotengine/godot-demo-projects/tree/master/3d/squash_the_creeps)는 입력, 점수, 패배, 재시작이 있는 완결된 게임 루프를 명시한다. [Multiple Resolutions and Aspect Ratios → Technical notes / Multiple resolutions crash course](https://github.com/godotengine/godot-demo-projects/tree/master/gui/multiple_resolutions)는 좁은 비율에서 HUD 축소 및 화면 밖 잘림 문제를 설명한다.

**설계 권고:** 새 단서 발견·검사 통과·의뢰 전달마다 짧고 서로 다른 피드백을 주며, 결과 텍스트와 NPC 반응을 함께 남긴다. 최종 전달 이후엔 명확한 엔딩과 재개 가능한 작업실을 제공한다. 창 안 문구는 계속 읽을 수 있게 하고 장식 효과를 최소한으로 둔다. 좁은 화면에 데스크톱 전체를 축소하지 말고 활성 창을 채워 표시하며 체크리스트 상세는 접을 수 있게 한다. 효과음 설정과 reduced-motion을 존중한다. Windows 느낌의 바탕화면에서 Linux 명령을 사용하면 터미널을 Ubuntu 개발 환경으로 명시해 학습자의 혼란을 줄인다.

## 제공된 자료의 범위별 분류

다음 표는 GitHub 저장소/조직 메타데이터의 이름·설명·존재·이동 상태 및 선택한 README/소스를 확인한 결과다. 목록 안의 모든 링크나 자산은 감사하지 않았다. 라이선스는 저장소 루트/메타데이터 수준이며 하위 자산 예외가 있을 수 있다.

| 자료 | 확인 결과와 이번 게임에서의 쓰임 | 루트 라이선스 확인 |
| --- | --- | --- |
| [Calinou/awesome-gamedev](https://github.com/Calinou/awesome-gamedev) | Awesome Gamedev; 자유 소프트웨어·문화 자산 모음. `Fonts`, `Icons`, `Sound Effects`, `Learning Resources` 등의 탐색 출발점 | CC-BY-SA-4.0; 목록의 라이선스는 연결된 자산의 허가를 대신하지 않음 |
| [godotengine/godot](https://github.com/godotengine/godot) | Godot Engine; 2D/3D 엔진. UI·게임 루프 개념 참고 | MIT |
| [godot-demo-projects](https://github.com/godotengine/godot-demo-projects) | Demonstration and Template Projects; UI, 접근성, 해상도 예제가 직접 관련 | MIT; 개별 예제의 자산 예외 확인 필요 |
| [godot-docs](https://github.com/godotengine/godot-docs) | 공식 문서; 창·포커스·저장 설계의 가장 직접적인 근거 | [LICENSE.txt](https://github.com/godotengine/godot-docs/blob/master/LICENSE.txt): CC-BY-3.0 |
| [godot-cpp](https://github.com/godotengine/godot-cpp) | C++ API 바인딩; 현재 React 게임의 구현에 필요 없음 | MIT |
| [godotengine/awesome-godot](https://github.com/godotengine/awesome-godot) | API가 [Calinou/awesome-godot](https://github.com/Calinou/awesome-godot)으로 이동 응답. 자유 플러그인/스크립트 목록 | CC-BY-4.0 |
| [GDQuest/godot-3d-dodge-the-creeps](https://github.com/GDQuest/godot-3d-dodge-the-creeps) | [godotengine의 보관된 저장소](https://github.com/godotengine/godot-3d-dodge-the-creeps)로 이동; 설명이 [squash_the_creeps](https://github.com/godotengine/godot-demo-projects/tree/master/3d/squash_the_creeps)로 재이동 명시 | MIT; 현행 데모의 음악/폰트 별도 표기 참고 |
| [Unity-Technologies](https://github.com/Unity-Technologies) | 공식 조직 이름은 Unity Technologies. 조직 자체는 개별 저장소 라이선스를 대체하지 않음 | 조직 공통 라이선스 판정 안 함 |
| [Unity-Technologies/ml-agents](https://github.com/Unity-Technologies/ml-agents) | Unity ML-Agents Toolkit; 강화/모방 학습 환경. 짧은 초보자 코딩 의뢰 게임에 학습 파이프라인 도입 필요 없음 | [LICENSE.md](https://github.com/Unity-Technologies/ml-agents/blob/develop/LICENSE.md): Apache-2.0 |
| [StefanoCecere/awesome-opensource-unity](https://github.com/StefanoCecere/awesome-opensource-unity) | Unity 패키지 목록; 가족 단위 분류만 수행 | CC0-1.0 |
| [JackyChenGit/awesome-unity-games](https://github.com/JackyChenGit/awesome-unity-games) | Unity 오픈소스 프로젝트 목록; 가족 단위 분류만 수행 | CC0-1.0 |
| [BayatGames/RedRunner](https://github.com/BayatGames/RedRunner) | Red Runner; 플랫포머. 오디오 이벤트·완결된 보상 피드백 구조 참고 | MIT; README Credits는 외부 그래픽/저장 패키지 출처를 별도 명시 |
| [RyanNielson/awesome-unity](https://github.com/RyanNielson/awesome-unity) | Unity 자산·자료 목록; archived 상태 | CC0-1.0 |
| [photonstorm/phaser](https://github.com/photonstorm/phaser) | [phaserjs/phaser](https://github.com/phaserjs/phaser)로 이동 응답. 브라우저 2D 프레임워크; 입력 소유권과 드래그 lifecycle 참고 | MIT |
| [BabylonJS/Babylon.js](https://github.com/BabylonJS/Babylon.js) | Babylon.js; 3D 엔진·TypeScript 사용 예제. 현행 텍스트/앱 UI에 3D 도입 근거 없음 | Apache-2.0 |
| [pixijs/pixijs](https://github.com/pixijs/pixijs) | PixiJS; 웹 2D 렌더링과 TypeScript 사용 예제. 시각 효과가 커질 때 별도 검토 가능 | MIT |
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | three.js; JavaScript 3D library. 데스크톱 창 구현과 직접 관련 낮음 | MIT |
| [raysan5/raylib](https://github.com/raysan5/raylib), [raylib-games](https://github.com/raysan5/raylib-games) | 간단한 프로그래밍 라이브러리와 소규모 샘플 게임. 작은 게임 루프 참고 후보; C 실행 환경으로 옮길 이유 없음 | Zlib; games README도 소스의 zlib/libpng 허가 명시 |
| [FlaxEngine/FlaxEngine](https://github.com/FlaxEngine/FlaxEngine) | Flax Engine; 다중 플랫폼 3D 엔진. 현재 UI에 직접 관련 낮음 | [LICENSE.md](https://github.com/FlaxEngine/FlaxEngine/blob/master/LICENSE.md)는 [Flax EULA](https://flaxengine.com/licensing) 적용을 명시; MIT로 간주 금지 |
| [panda3d/panda3d](https://github.com/panda3d/panda3d) | Python/C++ 3D 엔진. 현재 UI에 직접 관련 낮음 | [LICENSE](https://github.com/panda3d/panda3d/blob/master/LICENSE): Modified BSD, 3개 조건 명시 |
| [gbdev/awesome-gbdev](https://github.com/gbdev/awesome-gbdev) | Awesome Game Boy Development; Game Boy 도구·문서·ROM 목록. 이번 게임은 플랫폼/실행 환경이 다름 | 메타데이터 GPL-3.0; 링크 대상별 확인 필요 |
| [Shoozza gist](https://gist.github.com/Shoozza/2998c75bf8e27607a25d6219af40d81c) | 소유자 Shoozza, 설명 Game Development Resources; 파일 제목 Game Development Resources v1.93. 엔진·라이브러리·픽셀아트·음원 도구 분류 | 이번 조회에서 명시적 라이선스를 확인하지 못함; 목록을 자산 복제 허가로 사용하지 않음 |

### 제공된 정확한 경로에서 확인할 수 없었던 자료

아래 경로는 이번 GitHub API 조회에서 각각 HTTP 404였다. 삭제·비공개·주소 변경 중 어느 이유인지는 판정할 수 없다. 비슷한 이름의 프로젝트로 자동 대체하지 않았다.

- https://github.com/crosire/sanandreasunity
- https://github.com/Brackeys/Game-Dev-Tutorials
- https://github.com/leereilly/gamedev
- https://github.com/dfcreative/awesome-babylonjs
- https://github.com/raphamea/awesome-threejs

## 재사용 시 확인할 사항

설계 패턴을 독립적으로 구현하는 것과 소스/이미지/음악을 복사하는 것은 다르다. 이번 권고는 전자를 기준으로 작성했다. MIT, Apache, Zlib, BSD 코드나 자산을 실제로 도입하면 해당 파일의 저작권·허가 고지를 보존하고 하위 디렉터리/서드파티 고지를 확인한다. Awesome 목록의 CC0/CC-BY/CC-BY-SA 또는 GPL 표기는 외부 링크의 코드·이미지·음원에 동일하게 적용된다는 뜻이 아니다.

구체적인 예외: Squash the Creeps의 [README License](https://github.com/godotengine/godot-demo-projects/tree/master/3d/squash_the_creeps#license)는 음악 `House In a Forest Loop.ogg`를 CC-BY-3.0, Montserrat 폰트를 별도 `fonts/LICENSE.txt`로 명시한다. Red Runner의 [Credits](https://github.com/BayatGames/RedRunner#credits)는 그래픽과 저장 시스템 출처가 서로 다르다. Hackhub 영상은 화면·입력·단서 전달 방식의 관찰 자료로 사용하고 이름·대사·이미지·해킹 임무를 복제하지 않는다.

이 문서는 엔진 기능/예제/라이선스의 참고 조사다. 새 창 관리 구현의 접근성 준수나 사용자 테스트 통과를 증명하지 않는다. 실제 변경은 위의 검증 행동과 현재 게임의 회귀 검사로 별도 확인해야 한다.
