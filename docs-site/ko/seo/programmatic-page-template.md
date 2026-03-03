# 프로그래매틱 페이지 템플릿 (기능 문서 SEO/GEO)

이 템플릿은 **기능 출력 문서 페이지**용입니다. 마케팅 글 전용이 아닙니다.

## Frontmatter

```yaml
---
title: "<기능명 + 의도>"
description: "<대상 사용자 + 결과 + 플랫폼>"
---
```

## 필수 구조

1. `Quick Answer (AI Search)`
: AI 검색이 바로 인용할 수 있는 1-2문장.
2. `사용 시점`
: 언제 쓰는지/언제 쓰지 않는지.
3. `절차 / 명령`
: 복사-실행 가능한 예시.
4. `FAQ`
: 질문형 항목 3개 이상.
5. `관련 링크`
: Quick Start, Changelog, Troubleshooting.

## GEO 체크리스트

- 엔터티 명칭 통일 (`Codex CLI`, `Claude Code`, `Gemini CLI`, `MCP`, `ContextDB`)
- 페이지당 하나의 핵심 의도 유지
- OS 차이가 있으면 macOS/Linux + Windows 모두 제시
- 긴 설명 전에 짧은 답변 먼저 제공
- 동작/버전 변경 시 변경 로그 링크 포함

## 내부 링크 규칙

각 기능 페이지는 다음으로 링크:
1. 설치/시작 페이지
2. 문제 해결 페이지
3. 변경 로그/릴리스 페이지
