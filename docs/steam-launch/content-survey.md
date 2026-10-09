# Steam 콘텐츠 설문 초안

2026-10-09. 최종 빌드와 실제 Steamworks 질문을 보고 출시자가 답할 준비 자료다. 설문 제출, 등급 확정이나 법적 권리 확인을 완료한 기록이 아니다. 공식 출처: [Content Survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey).

## 생성형 AI

**Pre-Generated: Yes. Live-Generated: No.** 현재 플레이어가 소비하는 사전 생성 아트, 게임 문구/서사, 번역에 AI 도구를 사용했다. 실행 중 AI 서비스를 호출하거나 플레이어의 입력을 외부 AI에 보내는 기능은 없다. 코드 작성 지원만 언급하고 실제 아트·문구·번역 사용을 누락하지 않는다. 원래 음악은 프로젝트의 수학적 합성이며 다운로드한 샘플이나 AI 음성은 없다.

설문 영문 상세 후보:

> During development, AI tools were used to create pre-generated environment and portrait artwork and to assist with in-game text, narrative and Korean, English and Japanese localization. These assets and texts are included as fixed content in the game. The game does not generate AI content during play and does not connect to a generative AI service. Its customer messages and endings use authored, fixed game content. Music is original mathematical synthesis rather than an AI-generated recording. We will review the final shipped content and its rights before submission.

플레이어에게 표시될 공개 설명 후보:

- KO: 개발 과정에서 AI 도구를 이용해 배경·인물 아트와 게임 문구·번역을 제작 또는 보조했습니다. 게임에는 미리 준비된 콘텐츠가 포함되며, 플레이 중 AI 콘텐츠를 생성하거나 AI 서비스에 연결하지 않습니다.
- EN: AI tools were used during development to create or assist with environment and portrait art, in-game text and localization. The game uses pre-generated content and does not generate AI content or connect to an AI service during play.
- JA: 開発中にAIツールを使い、背景・人物アート、ゲーム内文章、翻訳の制作や補助を行いました。ゲームには事前に用意したコンテンツを収録し、プレイ中のAI生成やAIサービスへの接続は行いません。

아트 출처는 `media/game-art-prompts.json`과 `public/game-art/`다. 프롬프트 보존만으로 권리 문제가 해결되었다고 보지 않는다. 최종 이미지의 로고·실제 브랜드·인물·타인 저작물, 제3자 소재와 폰트 배포 조건을 확인한다. Windows 폰트는 영상에 로컬로 렌더링한 것이며 폰트 파일을 배포하지 않는다.

## 일반 콘텐츠·상호작용

| 항목 | 현재 초안 / 확인 필요 |
| --- | --- |
| 주된 내용 | 가상 컴퓨터에서 카페·동네 의뢰를 해결하는 퍼즐/시뮬레이션 |
| 폭력·유혈·성적 콘텐츠·노출 | 현재 검토한 플레이 흐름에서 해당 콘텐츠 없음; 출시자가 모든 엔딩·문구·아트를 재확인 |
| 도박·현금 보상 | 없음. 게임 내 크레딧은 의뢰 보상과 가상 작업실 구매이며 현금 구매·환전 없음 |
| 사용자 간 메시지/UGC | 온라인 채팅·공개 UGC 없음. 메시지는 게임 캐릭터의 고정 콘텐츠 |
| 개인정보 / 외부 연결 | 플레이어 코드는 시뮬레이션에서 처리하며 live AI 없음. 최종 패키지의 Steam 연결·지원 링크·저장 정보와 개인정보 안내는 별도 확인 |
| 교육/직업 주장 | 코딩 개념을 다루는 게임. 공인 교육·취업·실무 숙련·학습 성과 인증 없음 |
| 연령 | 15세 전후 입문자를 기획 대상으로 삼음. Steam/지역 심사 등급 미확정 |

각 설문은 직접적 플레이뿐 아니라 텍스트, 아트, 영상 및 모든 분기까지 포함해 답한다. 미구현 미래 계획으로 “있음”을 채우거나 개발 타깃을 연령 등급으로 적지 않는다. 출시 전 전체 콘텐츠와 권리 확인, 국가별 등급 요구, 실제 설문 표현을 대조한다.
