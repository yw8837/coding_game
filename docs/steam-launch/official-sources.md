# Steam 공식 출처 확인 — 2026-10-09

공개 Steamworks 공식 문서를 HTTPS로 읽어 원문을 확인했다. 계정 대시보드 권한·소유권 검증과는 별도다. 원문 발췌, URL, 확인일과 응답 해시는 `official-source-evidence.json`에 보존한다. 문서가 바뀔 수 있으므로 실제 제출·결제·공개 전에 최신 문서와 계정 화면을 다시 확인한다.

| 주제 | 공식 출처 | 확인한 내용 |
| --- | --- | --- |
| 앱 등록비 | [Steam Direct Fee](https://partner.steamgames.com/doc/gettingstarted/appfee) | 앱마다US$100 상당. 환불되지 않으며 Adjusted Gross Revenue가US$1,000 이상인 뒤 지급 시 회수 가능. 해당 VAT/GST 등 적용. 지갑 자금 제외, 지불한 계정만 크레딧 활성화 가능 |
| 결제 후 대기 | [Onboarding (English)](https://partner.steamgames.com/doc/gettingstarted/onboarding?l=english) | 현재 원문은 첫 몇 타이틀에 대해 **21일** 대기. 원문: “A 21-day waiting period between when you paid the app fee and when you can release that game.” 과거30일을 현행 값으로 적지 않음. 계정에 표시된 실제 해제일 확인 필요 |
| 상점·빌드 심사 | [Review Process](https://partner.steamgames.com/doc/store/review_process) | 상점 및 제품 빌드 각각 통상3~5영업일. 각 심사를 최소7영업일 여유로 계획. 상점은 출시 시 제공할 기능·콘텐츠와 일치해야 하며 빌드는 근최종이어야 함 |
| Coming Soon | [Coming Soon](https://partner.steamgames.com/doc/store/coming_soon) | 새 제품은 출시 전 공개 Coming Soon 페이지 최소2주. 승인 후 직접 “Post as Coming Soon”을 실행해야 공개됨 |
| AI 공개 | [Content Survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey) | 플레이어가 소비하는 아트·사운드·서사·현지화 등 사전 생성 콘텐츠를 포함. Pre-Generated는 개발 중 만든 고정 콘텐츠, Live-Generated는 게임 실행 중 AI로 생성. 후자는 추가 guardrail 설명 요구 |
| 상점 이미지 | [Store Assets](https://partner.steamgames.com/doc/store/assets/standard) | Header920×430, Small462×174, Main1232×706, Vertical748×896, 스크린샷 최소1920×1080 16:9 |
| 라이브러리 이미지 | [Library Assets](https://partner.steamgames.com/doc/store/assets/libraryassets) | Capsule600×900, Header920×430, Hero3840×1240, Logo는1280폭 및/또는720높이 투명PNG |
| 이미지 문구 | [Graphical Asset Rules](https://partner.steamgames.com/doc/store/assets/rules) | 캡슐은 게임 아트·게임명·공식 부제 중심. 리뷰·수상·할인·CTA 문구 제외. Library Hero는 글자 없음 |

위 대기 기간, Coming Soon 공개 기간과 심사는 서로 다른 조건이다. 단순 합산한 고정 출시 날짜나 심사 완료 보장을 만들지 않는다. 실제 계정의 결제일과 공개일이 아직 없으므로 현재 출시일은 미정이다.

현지화 정책 참조: [Localization and Languages](https://partner.steamgames.com/doc/store/localization), [Steam Language Codes](https://partner.steamgames.com/doc/store/localization/languages), [GetCurrentGameLanguage](https://partner.steamgames.com/doc/api/ISteamApps#GetCurrentGameLanguage). 가격 설정 참조: [Steam Regional Pricing](https://partner.steamgames.com/pricing/explorer). 이 마지막 링크들은 기존 프로젝트 정책의 참조이며 이번 원문 발췌 기록의 대상8개와 구분한다.
