# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-10-10
**Status:** Source-based initial draft for CODE:SHIFT 0.13.2 RC. Prepared from the current project and supplied conversation without an additional interview. Intended audience and value propositions are design hypotheses, not measured customer findings.

## Product Overview

**One-liner:** 가상 작업실에서 고장 난 도구를 고치고, 의뢰 보상으로 작업실을 꾸미며, 내 첫 앱을 출시하는 코딩 퍼즐 게임.

**What it does:** 플레이어는 가상 PC에서 고객의 문제를 보고 파일이나 제한된 JavaScript 함수를 바꾸고 결과를 검사한 뒤 수정본을 전달한다. 카페 입문 3장을 마치면 동네 의뢰 18개 중 구역마다 6개에서 4개씩 골라 총 12개로 최종 프로젝트에 도달한다. 내 이름과 내용을 담은 작은 프로젝트를 게임 안에서 1.0.0으로 배포하고 마지막 편지를 읽는다. 남은 의뢰와 선택 연습은 계속할 수 있다.

**Product category:** 코딩 퍼즐 · 가상 PC/개발자 작업실 시뮬레이션.

**Product type:** 소비자용 게임. Windows 스타일 화면과 Linux 개발 터미널을 게임 상태로 시뮬레이션한다. 범용 OS, 임의 JavaScript 실행기, 실제 온라인 개발/배포 서비스는 아니다.

**Business model:** 현재 브라우저 전체 콘텐츠는 무료·가입 없이 플레이한다. 오프라인 Windows 후보판도 개발 중이다. Steam 한국 정가 11,000원은 사용자 결정이며 Steam 미적용·미등록이다. 할인율과 출시 일정은 확정되지 않았다. 출시 뒤 웹 입문 데모/유료 전체 캠페인 구분은 계획 단계다. `cr`은 게임 안에서만 쓰는 가상 크레딧이며 실제 현금 수익이 아니다.

## Target Audience

**Target companies / decision-makers:** B2B 항목은 적용하지 않는다. 플레이어 본인이 게임을 고르고 조작한다.

**Primary audiences:** 코딩 경험 없이 작은 수리부터 시작하고 싶은 퍼즐 플레이어, 가상 PC·터미널·직접 코드 수정을 즐기는 코딩 경험자. 초보자에게는 기본 안내와 수동 힌트, 경험자에게는 직접 작업 모드와 지원 범위 내 다른 함수 해법을 보여 준다. 두 집단의 이해·만족·지불 의향은 검증되지 않았다.

**Jobs to be done:**

- 눈앞의 고장을 고쳐 실제 화면과 결과가 바뀌는 성취를 경험한다.
- 내가 고른 의뢰를 완료하고 게임 크레딧으로 작업실 도구와 배경을 마련한다.
- 내 내용으로 만든 작은 작품의 첫 배포 기록을 갖는다.

**Use cases:** 짧은 고객 의뢰의 오류 수리, JavaScript 함수의 다른 입력/경계 확인, 의뢰 선택, 보조 모니터로 저장 파일과 결과 비교, 개인 프로젝트 편집과 게임 속 배포.

## Personas

B2B 구매 역할은 적용하지 않는다. 초보자/경험자는 메시지와 관찰을 나누기 위한 사용 시나리오이며 실제 고객 인터뷰로 확정한 페르소나가 아니다. 코딩 교육 구매자·학교·기업 연수 시장을 현재 주요 고객으로 가정하지 않는다.

## Problems & Pain Points

**Core problem hypothesis:** 추상적인 코드 변경이 어떤 결과를 만드는지 감이 없거나, 반복 의뢰가 목표·변화·보상 없이 보이면 게임을 계속할 이유를 놓칠 수 있다.

**Current creative feedback:** 사용자 요청 요약: 크림색 배경 전환이 어색하고, 예고편 시작과 끝의 힘이 약하며 BGM의 존재감이 부족하다. 더 재미있고 보상과 계속할 이유가 보이는 영상을 원한다. 이는 제작자의 피드백이며 참가자 후기나 전환율 증거가 아니다.

**What it costs them:** 플레이 중 목표를 놓치거나 의미 있는 변화를 못 느끼는 가능성. 시간·돈 손실의 실제 측정치는 없다.

**Emotional tension hypothesis:** 낯선 코드의 부담과 스스로 해결하고 싶다는 호기심. 홍보는 문제 → 직접 수정 → 달라진 결과 → 고객 보상 → 내 도구/작품의 흐름을 보여 준다.

## Competitive Landscape

`docs/pricing-2026-10.md`의 기존 비교에는 Hacknet, The Farmer Was Replaced, while True: learn(), Human Resource Machine 등의 공식 소개·조회 시점 가격이 있다. 이 문서에서는 새로운 외부 조사나 경쟁작 플레이 검증을 하지 않았다. 가상 컴퓨터 게임, 코딩 퍼즐, 직접 만들기·학습 콘텐츠는 비교 범주이며 특정 경쟁작보다 더 재미있거나 깊다는 주장은 하지 않는다.

## Differentiation

**Concrete capabilities:**

- 파일·터미널·Git·서버·API를 하나의 가상 PC 게임 상태에서 다룬다.
- 작은 값 수정에서 시작하고, 지원 의뢰에서는 직접 작성한 JavaScript 함수로도 같은 보상을 받는다.
- 저장된 파일의 실제 평가 결과와 고객의 요청을 비교한다.
- 고객에게 전달한 첫 완료에 게임 크레딧을 지급하고, 작업실 도구·배경을 구매한다.
- 구역별 6개 중 4개를 선택하고, 자신의 내용으로 만든 프로젝트를 게임 안에서 배포한다.
- 한국어·영어·일본어 UI, 선택 힌트와 실패 시 보상 차감 없음.

**Why it may appeal:** 수리 결과를 눈으로 확인하고 보상을 작업실에 쓸 수 있으며, 끝에는 내 작품이 남는다. 이 문장은 소스로 확인한 경험 구조를 설명한다. 재미·도파민·학습 효과의 증가를 측정했다는 뜻은 아니다.

**Why customers choose us:** 아직 실제 선택 이유·구매 후기·정량 증거가 없다.

## Objections

| 예상 질문 | 사실에 맞는 응답 |
| --- | --- |
| 코딩을 몰라도 시작할 수 있나 | 작은 입력과 기본 안내로 시작하도록 설계했다. 실제 초보 완주율이나 교육 효과는 아직 측정하지 않았다. |
| 프로그래머가 직접 코드를 쓸 수 있나 | 직접 작업 모드와 제한된 JavaScript 함수 의뢰가 있다. 전체 JavaScript/Node/운영체제를 제공하지는 않는다. |
| 영상의 200 cr와 앱 출시는 무엇인가 | 빵집 의뢰 전달 완료 보상은 게임 크레딧이다. 앱 출시는 게임 속 개인 프로젝트의 1.0.0 배포 기록이다. |

**Anti-persona:** 실제 서버 운영·현금 수익·취업 자격·무제한 개발 환경·고난도 최적화만을 기대하는 사용자에게 그 기능을 약속하지 않는다. 이는 시장 배제의 확정 결론이 아니라 기대 관리다.

## Switching Dynamics

**Push hypothesis:** 목표 없는 반복과 화면에 드러나지 않는 결과.

**Pull:** 고장이 해결되는 실제 결과, 고객 반응, 게임 보상으로 쓸 도구, 의뢰 선택과 내 작품.

**Habit hypothesis:** 기존 게임/코딩 도구의 익숙함.

**Anxiety hypothesis:** 코드가 어려워 보임, 지원 문법이 제한됨, 웹 저장이 기기 사이에 자동 동기화되지 않음. 현재 전환 행동 측정은 없다.

## Customer Language

실제 고객 인터뷰 인용·추천사·개인 성공담은 제공되지 않았다. 사용자 요청은 위에서 요약으로 기록했다. 제작자나 게임 캐릭터를 실제 고객·개발자의 증언자로 만들지 않는다.

**Words to use:** 고장, 버그, 고치다, 결과, 전달, 게임 크레딧, 작업실, 도구, 직접 선택, 내 앱, 내 첫 출시.

**Words to avoid:** 교육 효과 보장, 취업, 누구나 완주, 현금 벌기, 실전 개발 전부, 무제한 JavaScript, 중독 보장, 검증된 재미, 실제 Steam 출시 완료. 경쟁작에 대한 미검증 열등 비교도 사용하지 않는다.

| Term | Meaning |
| --- | --- |
| 200 cr | 카페 이후 첫 구역의 빵집 등 고객 의뢰를 검사·답장·전달 완료하면 한 번 지급하는 게임 크레딧 |
| 600 cr 보조 모니터 | 저장 파일과 실행 결과를 같은 편집 화면에서 비교하는 구매 도구 |
| 4 / 6 | 각 구역의 의뢰 6개 중 4개를 골라 다음 구역/최종 프로젝트로 진행 |
| 내 첫 출시 | 게임 속 개인 프로젝트 1.0.0의 배포 기록. CODE:SHIFT 자체의 Steam 출시를 뜻하지 않음 |

## Brand Voice

**Tone:** 짧고 자신감 있는 게임 문구. 고장·행동·결과를 구체적으로 말한다.

**Style:** 강의/설명부터 시작하기보다 실제 게임 화면에 목표와 보상을 붙인다. 질문형 낚시·거짓 개인 경험·현금 암시를 피한다. 초보자 친절함과 직접 코드 조작을 함께 보여 준다.

**Personality:** 호기심, 자기주도, 손으로 고치는 느낌, 편안함, 작은 성취.

## Proof Points

| Theme | Source evidence |
| --- | --- |
| 오류 → 수정 → 결과 | `career-content.ts`의 빵집 요청/잘못된 가격 설정, `career-evaluation.ts`와 실제 저장 파일 평가 |
| 전달 → 보상 | `career.ts`의 fresh proof/답장/전달 guard, `career-content.ts:13`의 구역 1 보상 200 cr |
| 보상 → 도구 사용 | `career.ts:15`의 600 cr 보조 모니터, `CareerView.tsx`의 저장 결과 비교 패널 |
| 의뢰 선택 | `career-progress.ts:3–4`와 README의 구역별 4개/총 12개 경로 |
| 내 작품 → 첫 배포 | `release.ts`의 검사·빌드·1.0.0 배포 기록 |

**Metrics:** 콘텐츠 수와 authored 보상/가격만 확인됐다. 재미 점수·학습 성과·재방문·조회율·클릭률·플레이 시간은 확인된 수치가 없다.

**Customers / testimonials:** 확인된 고객 로고, 추천사, 판매량 또는 성공담 없음.

## Goals

**Business goal:** CODE:SHIFT를 플레이하고 싶은 PC 퍼즐 게임으로 소개하고, 추후 유료 Steam 후보판 준비를 지원한다. 공식 상점/출시는 별도 작업이다.

**Current creative goal:** 30초 영상의 실제 수리·수정 전후 결과·전달 보상·도구 효과·의뢰 선택·개인 작품 배포 흐름이 첫 화면부터 명확하게 보이게 한다.

**Conversion action:** 현재 무료 웹에서 플레이 시작. Steam에 등록되지 않은 상태에서 구매/위시리스트 CTA를 확정된 행동처럼 쓰지 않는다.

**Current metrics:** 미제공. 후속 사람 대상 관찰과 실제 배포 후 지표로 평가한다.

**Chosen trailer copy:** 시작 `고장 난 계산대.` / `해결 보상 200 cr.`. 마지막 `내 첫 출시.`와 실제 개인 앱 및 게임 속 1.0.0 배포 화면. 썸네일 `버그 고치고` / `내 앱 출시`. 캐릭터는 게임 캐릭터이며 실제 사용자·개발자 초상이나 추천사가 아니다.

## Changelog

- v1 (2026-10-10) — Initial source-based context for 0.13.2; documented novice/programmer audiences, repair–reward–tool–personal-release positioning, factual limits and the user's trailer revision direction.
