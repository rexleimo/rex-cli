---
title: 개요
description: 기존 Codex/Claude/Gemini 워크플로를 OpenClaw 스타일 역량으로 강화하는 빠른 진입점.
---

# RexCLI 문서

> 지금 쓰는 CLI 습관은 그대로 유지하고, `codex` / `claude` / `gemini` 위에 OpenClaw 스타일 역량 레이어를 추가합니다.

[30초 시작 (Primary CTA)](getting-started.md){ .md-button .md-button--primary data-rex-track="cta_click" data-rex-location="hero" data-rex-target="quick_start" }
[역량 사례 보기](case-library.md){ .md-button data-rex-track="cta_click" data-rex-location="hero" data-rex-target="case_library" }

프로젝트 URL: <https://github.com/rexleimo/rex-cli>

`RexCLI`는 다음 CLI를 위한 로컬 워크플로 레이어입니다.

- Codex CLI
- Claude Code
- Gemini CLI
- OpenCode

네이티브 CLI를 대체하지 않고, 아래 2가지를 추가합니다.

1. 파일시스템 ContextDB (세션 메모리)
2. 투명 래퍼 (`codex` / `claude` / `gemini` 그대로 사용)

## 운영 퍼널에서 내가 해줄 수 있는 것

### 1. 랜딩 전환 경로를 먼저 정리합니다 (보기 -> 클릭)

- 당신이 제공: 현재 랜딩 URL, 타깃 사용자, 단일 핵심 행동(예: 빠른 시작).
- 내가 수행: 메시지 이탈 구간 진단, CTA 정리, Hero/문제/증거/행동 블록 재작성.
- 당신이 받는 결과: 즉시 반영 가능한 카피 블록, CTA 배치안, 이벤트 네이밍 시트.
- 측정 지표: 핵심 CTA 클릭률과 사례 페이지 유입률을 추적/개선 가능하게 만듭니다.

### 2. "무엇을 해줄 수 있는지"를 10초 안에 이해되게 만듭니다

- 당신이 제공: 서비스 범위, 강한 사례, 명확한 제외 범위.
- 내가 수행: 추상적 설명을 "문제 -> 실행 -> 결과" 구조로 재작성.
- 당신이 받는 결과: 역량 매트릭스, 대상 사용자 섹션, 우선순위 skills 목록.
- 측정 지표: 방문자가 10초 안에 적합성을 판단하고 다음 단계로 이동합니다.

### 3. ContextDB로 멀티 CLI 인수인계를 안정화합니다

- 당신이 제공: Codex/Claude/Gemini 현재 사용 흐름과 끊김 지점.
- 내가 수행: checkpoint 단위, 메모리 인계 규칙, one-shot/interactive 흐름 정의.
- 당신이 받는 결과: 표준 인계 명령, 재시작 템플릿, 세션 간 운영 기준.
- 측정 지표: 도구 전환 시 배경 재설명 시간을 줄입니다.

### 4. 반복 운영을 재사용 가능한 skills로 제품화합니다

- 당신이 제공: 주간 반복 업무와 현재 수동 프로세스.
- 내가 수행: 단계 분해, 가드레일 추가, 검증 포인트 설계, skills 문서화.
- 당신이 받는 결과: skill 문서, 실행 체크리스트, 완료 전 검증 게이트.
- 측정 지표: 온보딩 속도와 팀 산출물 품질의 일관성을 높입니다.

## 지금 바로 쓸 수 있는 Skills

- `seo-geo-page-optimization`: 랜딩 구조, 카피, SEO/Geo 전환 최적화.
- `xhs-ops-methods`: 샤오홍슈 운영 워크플로를 엔드투엔드 실행.
- `brainstorming`: 구현 전 목표와 설계 방향 정렬.
- `writing-plans`: 다단계 요구사항을 실행 계획으로 분해.
- `dispatching-parallel-agents`: 독립 도메인을 안전하게 병렬 실행.
- `systematic-debugging`: 추측이 아닌 증거 기반 디버깅.
- `verification-before-completion`: 완료 선언 전 검증 강제.

## 30초 시작 (먼저 실행)

```bash
git clone https://github.com/rexleimo/rex-cli.git
cd rex-cli
scripts/setup-all.sh --components all --mode opt-in
source ~/.zshrc
codex
```

## 빠른 실행

```bash
codex
claude
gemini
```

## 다음 읽기

- [빠른 시작](getting-started.md)
- [공식 사례 라이브러리](case-library.md)
- [블로그 사이트](https://cli.rexai.top/blog/ko/)
- [추천 링크](friends.md)
- [프로젝트(GitHub)](https://github.com/rexleimo/rex-cli)
- [변경 로그](changelog.md)
- [CLI 워크플로](use-cases.md)
- [아키텍처](architecture.md)
- [ContextDB](contextdb.md)
