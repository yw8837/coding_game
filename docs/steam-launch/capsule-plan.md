# Steam 캡슐 제작 계획 — 파일 미생성

2026-10-09 공식 규격 확인. 기존 승인된 게임 아트를 활용하는 배치·크기 계획이다. 새로운 아트나 캡슐 이미지는 생성하지 않았다. CODE:SHIFT는 가제이므로 최종 이름 결정 후 로고를 제작·적용한다.

작업 원본은 `public/game-art/studio-evening.png`의 책상과 모니터, `neighborhood.png`의 동네, `mono-cafe.png`의 카페다. 기존 아트가 실제 승인·권리 검토 범위에 있는지 최종 출하 전에 재확인한다. 화면을 늘여 왜곡하지 않고 종횡비에 맞춰 자르며, 해상도가 부족하면 원본 크기의 한계를 기록한다. 작은 UI 스크린샷을 키아트처럼 확대하지 않는다.

| 자산 | 현재 공식 크기 | 배치 계획 |
| --- | --- | --- |
| Store Header Capsule | 920×430 | 책상·모니터는 오른쪽, 왼쪽 어두운 여백에 읽을 수 있는 제품 로고 |
| Store Small Capsule | 462×174 | 배경 디테일 축소, 로고가 대부분을 차지; 자동 축소120×45와184×69에서 읽기 확인 |
| Store Main Capsule | 1232×706 | 작업실 키아트와 큰 로고; 화면의 느낌이 드러나도록 배치 |
| Store Vertical Capsule | 748×896 | 모니터·책상을 중심으로 재구도, 상부 여백에 로고; 가로 원본의 무리한 늘이기 금지 |
| Library Capsule | 600×900 | 수직 책상/카페 구도와 제품 로고; 자동 생성300×450에서도 확인 |
| Library Header | 920×430 | Store Header와 같은 제품 정체성; 헤더 별도 등록 |
| Library Hero | 3840×1240 | 책상 또는 동네의 넓은 아트만 사용, 글자·로고 없음; 공식 safe area 템플릿으로 확인 |
| Library Logo | 너비1280 및/또는 높이720 | 투명 PNG, 최종 제품 로고/로고마크만; 적절한 종횡비 유지 |
| Store Page Background (선택) | 1438×810 | 조용한 작업실/동네 배경, 본문과 경쟁하지 않는 대비 |

Store/Library Capsule은 게임 아트, 제품명과 공식 부제만 사용한다. 할인·가격·리뷰 점수·수상 로고·“위시리스트 추가”·“코딩을 배워요” 같은 마케팅 문구를 넣지 않는다. Library Hero는 글자 자체가 없어야 한다. 모든 캡슐은 읽을 수 있는 제목/로고, 정확한 크기와 PG-13에 적절한 아트를 갖춘다. 이름의 3언어 표기가 확정되면 언어별 그래픽을 별도 검토한다.

실제 게임 스크린샷은 `output/trailer-0.10/screenshots/`의 1920×1080 원본을 사용한다. 공식 규격은 최소1920×1080, 16:9다. 실제 플레이를 보여 주며 자막·홍보 오버레이를 추가하지 않는다. 최소5장을 대표 세트로 선택하고 Steam의 suitable-for-all-ages 표시도 내용에 따라 설정한다. 엔딩 스포일러 장면은 대표 앞부분에 두지 않는다.

제작 완료 기준: Steam 공식 템플릿 안전영역, 최종 이름과 권리 확인, 원본 및 파생 이미지 크기, 작은 축소본 로고 가독성, 새 AppID의 Steamworks 미리보기까지 확인한다. 이 계획은 파일 준비나 업로드 완료를 뜻하지 않는다.

공식 출처: [Store Assets](https://partner.steamgames.com/doc/store/assets/standard), [Library Assets](https://partner.steamgames.com/doc/store/assets/libraryassets), [Graphical Asset Rules](https://partner.steamgames.com/doc/store/assets/rules). 확인일2026-10-09. 업로드 직전에 최신 템플릿과 대시보드의 요구 크기를 다시 확인한다.
