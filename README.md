# 해랑사리우 웹앱

한성대학교 봉사동아리 **해랑사리우** 웹앱 프로젝트.

## 문서
- [해랑사리우 웹앱 브리핑](해랑사리우_브리핑.md) — 요구사항 정리 (전체 IA + 화면별 상세)

## 구성

| 앱 | 경로 | 포트 | 설명 |
|---|---|---|---|
| 메인 회원 웹앱 | `apps/main` | 3000 | 부원 전용. 홈·활동·봉사모집·커뮤니티·마이 + 운영진 관리자 |
| 신입모집 웹앱 | `apps/recruit` | 3001 | 외부 공개 창구. 소개·지원·결과 확인 + 모집 관리자 |

### 실행
```bash
cd apps/main && npm install && npm run dev      # http://localhost:3000
cd apps/recruit && npm install && npm run dev   # http://localhost:3001
```

### 주요 화면
- 메인 회원앱: `/` 로그인 → `/home` · 관리자는 헤더 메뉴 → `/admin`
- 모집앱: `/` 랜딩 → `/apply` 지원 · 관리자 `/admin`

## 기술 스택
- 프론트: Next.js 16 + TypeScript + Vercel
- 백엔드: Supabase + Go *(연동 예정)*
- UI: CSS Modules (**Tailwind 미사용**)
