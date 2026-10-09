# 0.11 보안·오류 QA 계획

목표: 로컬 게임의 입력이 호스트 코드·파일·네트워크 권한으로 넘어가지 않으며, 잘못된 입력·저장과 반복 조작 뒤에도 정상 게임을 계속할 수 있는지 확인한다. 범위는 소유한 로컬 소스·별도 테스트 프로필과 패키지다. 실제 계정·네트워크 공격, 운영 저장 변경, 외부 서비스 부하 시험은 하지 않는다.

| ID | 상황·행위자 | 설정과 검사 | 기대 신호 | 결과·증거 | 정리 |
| --- | --- | --- | --- | --- | --- |
| QA01 | 정상 플레이어 | 카페 3장→18의뢰→최종 배포→함수·터미널, native.cjs | 엔딩·실제 파일 실행·복구, page error 없음 | native-report.json 최신 통과 | 격리 앱 종료, 프로필은 증거로 보존 |
| QA02 | 잘못된 저장을 가져오는 사용자 | malformed/oversized/HTML 포함 JSON, web security harness | 거부 시 기존 저장 유지, 텍스트 실행 없음 | web-security-report.json final.passed=true, pageErrors=[] | 별도 브라우저 context 종료 |
| QA03 | 악의적/실수로 작성한 JS | globals/prototype/import/new/무한반복·큰 자료 | 지원하지 않는 코드 거부·연산 중단·이후 정상 실행 | runtime unit + security harness | 메모리/임시 fixture 종료 |
| QA04 | 파일을 삭제·이동하는 사용자 | 모든 삭제 순서·변조 runner/tests·저장 복원 | 실제 파일 없는 통과/보상 없음 | 최종 207개 unit에 포함, 6개 삭제 순서 통과 | 가상 상태 fixture만 사용 |
| QA05 | renderer 침해를 가정한 입력 | IPC sender·asset protocol traversal·navigation/network | allowlist·격리·거부, host Node 미노출 | desktop source review + unit + native/packaged QA | 격리 앱 종료 |
| QA06 | 취약한 외부 의존성 | pnpm/npm audit, runtime 도달 경로 확인 | 데이터베이스 결과와 적용 범위 구분 | audit JSON와 요약 보고서 | 수정 없는 read-only query |
| QA07 | 사용자 문구·기록 속 지시 문자열 | HTML/명령 형태의 text 입력 | 데이터로 표시, agent/host 실행 없음 | 소스 검토와 QA02 | 외부 비밀 데이터 접근 없음 |
| QA08 | 재실행·오류·취소·오래된 상태 | 중복 보상·변경 후 proof·import/reset·저장 손상·실행 예산 후 복구 | 현재 증거만 유효·단일 보상·복구 | unit/E2E 보고서 | 사용자 저장 보존 |
| QA09 | 로컬 QA 경로 설정자 | root/child junction, 준비 전 변경, dangling link | 실제 경로 밖 쓰기 거부 | profile-final-verification.json 및 관련 22개 TAP 통과, D-01 수정 | 소유 fixture의 링크 해제 후 비재귀 정리, 잔존 0개 |
| QA10 | 큰 관찰 기록 편집자 | 다국어·emoji·surrogate, 과대 JSON/CSV, 편집 rollback | 내보낸 JSON 재가져오기와 기존 저장 보존 | data.test.cjs 7개 및 playtest-kit.py UI 통과, WEB-01 수정 | 합성 메모리 fixture 및 별도 브라우저 context 종료 |
| QA11 | 잘못된 검증 성공 주장 방지 | exit와 TAP/JSON pass/fail/skip 함께 확인, 실제 패키지 파일 비교 | 0 exit 및 명시적 통과, QA 플래그 구분 | 207 pass/0 fail/0 skip, lint 0 error/68 warning, 패키지 파일 18개 일치 | 로그 보존, 실패 캡처는 납품에서 제외 |

수정한 항목은 D-01, WEB-01, GAME-01 및 취약 의존성 갱신이다. 무한 실행은 해석기 연산 예산으로 중단되며 이후 정상 코드를 실행했다. 웹 하네스의 최초 저장 대기와 dev HMR networkidle 실패는 검사 준비/대기 방식 문제로 분류하고 실제 저장 신호·iframe 준비 신호로 수정한 뒤 재실행했다. 릴리스 범위의 제품 실패를 숨기거나 무제한 재시도하지 않았다.

기존 QA와 패키지 성공을 재사용하되 새 보안 수정이 생기면 영향을 받는 검사를 반복한다. 같은 제품 오류 3회 또는 전체 5개 QA 회차에서 중단하고 원인을 보고한다. 하네스 선택자·도구 설치 문제는 제품 결함과 구분한다. 로컬 싱글플레이 저장을 사용자가 직접 고치는 행위는 온라인 치팅 방어 보장을 의미하지 않는다.
