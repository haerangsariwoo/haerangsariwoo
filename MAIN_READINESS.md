# Main 반영 준비 / 2026-09-14

## 판정: API 연결·읽기 전용 호환 검사 통과 / 운영 검증 일부 미완료

사용자가 `jk030430-coder's Project`의 API 주소와 키를 제공하여 직접 API 연결을 확인했다. Supabase 플러그인 OAuth는 복구되지 않았지만, 프로젝트 API를 통해 아래 읽기 전용 검사는 완료했다. 사용자는 GitHub `khg9859` 계정으로 기존 조직 저장소의 main에 코드만 커밋·푸시하도록 승인했다. DB 마이그레이션·데이터 변경·계정 권한 변경은 포함하지 않는다.

실제 회원 데이터·비밀번호·인증 토큰·DB 덤프는 GitHub에 올리지 않는다. 코드는 Git, 데이터는 Supabase에 두며 스키마 변경이 필요할 때만 검토한 마이그레이션을 버전 관리한다. 이번 점검은 GET/HEAD 요청만 사용했다. 운영 DB는 수정하지 않았고 마이그레이션도 생성·실행하지 않았다. API 키는 Git에서 제외된 로컬 환경파일에만 설정했다.

## 실제 프로젝트 API 검사

- 공개키의 Auth 설정 조회, 서버 키의 REST 스키마·Storage 버킷 조회 성공. 앱의 테이블/뷰 18개, RPC 10개가 존재하며 정적으로 추출한 단순 select/filter/order 컬럼의 누락은 없었다.
- Auth 계정과 members의 양방향 불일치, 학번 중복·빈 값, 참석/신청/팀 이벤트/팀 배정 중복은 확인되지 않았다.
- API 메타데이터로 확인 가능한 16개 외래키 연결의 orphan, 잘못된 회원 역할/상태, 음수 또는 비정상 봉사시간·수용인원, 조 범위 오류·중복 조장은 발견되지 않았다. 빈 테이블의 검사 통과는 향후 쓰기 제약의 증거가 아니다.
- 미로그인 공개키로 회원·증빙·쪽지·운영진 게시판·익명 원본·푸시 구독·조 배정·쪽지 집계 뷰 조회가 거부되었다. 회원 테이블 응답은 권한 거부(`42501`)였다. 공개키 자체는 Auth 설정 조회로 별도 검증했다.
- `profile-photos`, `album-photos`, `proof-files`, `board-files`는 비공개였다. 실제 파일은 다운로드하지 않았다.
- 익명 원본 테이블은 서버 키로도 403이어서 원본 레코드 정합성 검사는 제외했다. 우회나 권한 변경을 시도하지 않았다.
- 여러 API 요청으로 검사했으므로 단일 트랜잭션 스냅샷이 아니다. 실제 RLS 정책 본문·로그인한 역할별 쓰기 권한·unique/check/FK 삭제 규칙·트리거·RPC 본문·백업은 관리 권한으로 추가 확인해야 한다. 이것을 전체 운영 보안/정합성 검증 완료로 해석하지 않는다.
- 로컬 앱은 실제 프로젝트에 연결하고 `LOCAL_ADMIN_BYPASS=0`으로 바꿨다. 환경파일은 접근권한 600이며 Git 제외 상태다. 공유된 서버 키는 운영에 재사용하기 전에 새 키로 전환하고 기존 사용처를 확인한 뒤 폐기하는 것을 권장한다. 키를 임의 회전하거나 기존 서비스를 중단하지 않았다.

## 확인한 Git 대상

- 원격: `https://github.com/haerangsariwoo/haerangsariwoo.git`, 조직 소유 공개 저장소.
- 브랜치: `main`; 로컬 HEAD와 원격 main은 모두 `3392ee113b77e63ce941b0db3391f78cedbfa112`였다.
- GitHub 플러그인과 로컬 `gh api user`의 로그인은 모두 `khg9859`이고 저장소 push 권한을 확인했다. 사용자가 이 계정으로 커밋·푸시한다고 명시했다. `jk030430-coder`는 Supabase 프로젝트 이름으로 구분한다.
- 기존 디자인 변경을 보존한 코드 릴리스다. 저장소 원격 주소·소유자·모집 앱·운영 DB는 변경하지 않는다. push는 연결된 호스팅의 자동 배포를 시작할 수 있으므로 원격 배포 결과는 로컬 빌드와 별도로 확인한다.
- `apps/recruit` 변경 없음. 원래 Documents 작업본 대신 현재 정상 작업본에서 준비했다.

## 이번에 보강한 항목

- 관리자 우회는 개발 모드, 명시 플래그, 정확한 로컬 URL/자리표시자 키, 서버 키 없음, Vercel 아님을 모두 만족할 때만 허용한다. 실제 DB를 연결하면 우회가 해제된다.
- Vercel 빌드에 미리보기 설정이 남으면 오류로 중단한다. 로컬 프로덕션 빌드에서는 기존처럼 우회가 작동하지 않는다.
- 서버 키 클라이언트를 `server-only`로 제한하고, 키 누락/미리보기에서는 생성하지 않는다.
- 공지 푸시 Server Action이 호출자 세션과 승인된 운영진/관리자 역할을 직접 확인한다. 관리자 화면을 거치지 않은 직접 호출도 차단한다. 역할은 사용자 편집 가능한 메타데이터가 아닌 기존 `members` 조회 결과를 사용한다. `members` 자체의 RLS/열 권한은 별도 검증 대상이다.
- Supabase 패키지는 기존 설치 버전 `@supabase/ssr 0.12.5`, `@supabase/supabase-js 2.112.4`로 정확히 고정했다. 스키마와 SDK API를 동시에 바꾸지 않았다.
- 보안 공지를 확인해 Next.js 및 ESLint 설정을 `16.3.2 → 16.3.5` 패치 업데이트했다. lockfile의 sharp/js-yaml 취약 버전도 함께 갱신했다. 메이저 마이그레이션이나 middleware 파일명 변경은 하지 않았다.
- `.env`, 로컬 디자인 출력, DB 덤프/개인 검증 폴더를 Git 후보에서 제외한다. 파일은 삭제하지 않았다. 앱이 실제 사용하는 `public/brand`·`public/media`는 포함 대상이다.

## 실행과 검증 명령

Node 22 이상 환경에서 실행한다. 현재 검증 환경은 Node 25.1.0이다.

```sh
cd apps/main
npm ci
npm run release:verify
npm audit --audit-level=high
npm run db:contract
npm run release:check
```

- `release:verify`: lint, 모의 동작/회귀 테스트, 타입 검사, 프로덕션 빌드. DB 연결 없이도 통과할 수 있으며 데이터 검증을 대신하지 않는다.
- `db:contract`: TS 소스에 나타난 테이블/뷰, RPC, Storage 식별자 및 호출 위치를 읽기 전용으로 출력한다. 동적 값, 관계, 권한, 함수 본문을 검증하는 스키마 생성기가 아니다.
- `release:check`: 운영 URL·확인한 project ref·공개키·서버 키·VAPID·우회 플래그·Git 후보의 일부 비밀키 패턴/대형 파일을 점검한다. 비밀키 값을 출력하지 않는다. 키 유효성과 실제 프로젝트 소속을 인증하는 도구는 아니다. 모든 개인정보/비밀을 찾아내는 완전한 스캐너도 아니다.
- 현재 `.env.local`은 실제 프로젝트에 연결되어 있고 우회는 꺼져 있다. 로컬 VAPID 키 쌍은 제공되지 않아 `release:check`의 알림 설정 검사는 통과하지 못한다. 기존 푸시 구독을 깨뜨리지 않도록 새 VAPID 키를 임의 생성하지 않는다. 로컬 푸시 알림 수신은 미검증이며 운영 환경변수는 변경하지 않았다.
- 실제 배포 시 `apps/main/.env.example`의 이름을 참고해 보안 환경변수 저장소에 같은 프로젝트의 값을 설정한다. 로컬 `.env.local`을 업로드하지 않는다. push를 제공할 배포에는 일치하는 VAPID 키 쌍이 필요하다.
- Vercel 프로젝트 설정의 root directory는 `apps/main`, install은 `npm ci`, build는 `npm run release:check && npm run build`를 권장한다. 실제 Vercel 설정은 이번에 변경하지 않았다.

## 코드에서 확인한 DB 계약

기존 HEAD 대비 아래 테이블/뷰 이름과 RPC 이름의 추가·삭제는 없다. 이는 호환성의 한 단서일 뿐 컬럼·제약조건·정책·데이터가 동일하다는 판정은 아니다.

| 영역 | 테이블/뷰 |
|---|---|
| 회원 | `members` |
| 활동·참석 | `activities`, `activity_rsvps` |
| 봉사·실적 | `internal_activities`, `internal_activity_applications`, `proof_submissions`, `partners` |
| 커뮤니티 | `notices`, `albums`, `album_photos`, `board_posts` |
| 쪽지·알림 | `inbox_messages`, `inbox_message_batches`, `push_subscriptions` |
| 팀 | `team_events`, `team_assignments` |
| 설정·외부 모집 | `app_content`, `external_cache` |

RPC 10개: `anon_list_posts`, `anon_get_post`, `anon_post_author`, `anon_list_comments`, `anon_comment_authors`, `anon_create_post`, `anon_delete_post`, `anon_create_comment`, `anon_delete_comment`, `anon_comment_push_target`.

Storage 버킷: `profile-photos`, `album-photos`, `proof-files`, `board-files`. 파일·사진 자체는 조회하지 않았다.

## 별도 운영 개선 및 추가 검증 과제

아래는 기존 소스에서 확인한 실패 가능성이다. 이번 디자인/안전장치 변경이 새로 만든 문제나 실제 데이터 훼손이 발생했다는 주장은 아니다. API 검사만으로 정책·트랜잭션 안전성을 단정하거나 삭제 순서 변경, 임의 RPC 생성, RLS 완화로 덮지 않는다.

| 우선순위 | 코드 근거 | 필요한 조치 |
|---|---|---|
| 추가 검증 | 저장소에 DB 마이그레이션/생성 타입 기준선 없음 | API 메타데이터와 단순 컬럼 대조는 통과. 실제 migrations·unique/check·RLS·RPC 본문 기준선 확보 필요 |
| 높음 | `src/app/api/admin/members/[id]/route.ts`: members 삭제 후 Auth 삭제 결과를 확인하지 않음 | Auth ↔ members FK와 삭제 정책 확인; 부분 실패/재시도/복구 설계 및 테스트 |
| 높음 | `src/app/signup/page.tsx`: Auth 가입과 members insert가 별도 요청 | 중간 실패 시 Auth만 남는 상태 확인; 트리거/가입 재시도 정책 검증 |
| 높음 | `src/lib/push/store.ts`: endpoint 삭제 후 insert | 실패 시 기존 구독이 사라질 수 있음. unique/소유권/RLS 확인 후 원자적 갱신 또는 RPC 검토 |
| 높음 | `src/app/admin/teams/TeamEventManager.tsx`: 조 배정·조장·발행을 여러 요청으로 저장 | 일부 요청 실패 시 UI 복구만으로 DB 복구 불가. 트랜잭션 RPC와 동시성 테스트 검토 |
| 높음 | `src/app/api/admin/members/[id]/reset-password/route.ts`: 공통 고정 초기화 비밀번호 | 일회성 비밀번호/재설정 링크 및 역할별 대상 제한 검토. 실제 비밀번호 변경은 하지 않음 |
| 확인 | 회원·활동·실적을 브라우저 클라이언트에서 직접 수정 | 본인 역할/승인 상태/승인 시간 조작, 타인 기록 접근을 DB 정책/열 권한이 막는지 테스트 |
| 확인 | `src/lib/external/index.ts`: 실패 시 예시 결과도 공유 캐시에 저장 | 운영 DB에 예시 캐시가 저장되어 있거나 정상 캐시를 대체하는지 확인. 회원 실적 테이블과는 별도 |
| 확인 | 프로덕션 쿠키 도메인 `.haerangsariwoo.site` 고정 | 실제 운영 도메인 및 Preview 배포에서 로그인 쿠키가 정상인지 확인; 임의로 도메인 변경하지 않음 |

## 관리 권한을 확보한 후 추가 검증 순서

1. 사용자가 제공한 프로젝트의 관리 접근 권한을 확인하고 배포 환경의 Supabase ref와 일치시키기. 키·비밀번호를 채팅에 붙이지 않기. API 키는 관리 API의 OAuth/PAT를 대신하지 않는다.
2. 프로젝트 metadata, migrations, generated types, security/performance advisors 조회. 준비된 `apps/main/scripts/release/supabase-inventory.sql`은 **미실행 읽기 전용 catalog 질의**이며 프로젝트 확인 후 검토·실행한다. 결과는 `.release-private/` 등 비공개 위치에 보관한다.
3. 기존 레코드를 내보내지 않고 집계로 검사: Auth/member 불일치, 학번 중복, 신청/참석 중복, orphan FK, 음수 봉사시간, 잘못된 상태, 조 범위·조장 중복·발행 일관성. 실제 컬럼/함수를 먼저 확인한 후 SELECT를 작성한다.
4. Auth 연동과 트리거, unique/FK/check, RPC 내부 권한 및 기본 EXECUTE, 테이블·열 grants/RLS, Storage 공개 여부와 소유자 경로 정책 확인. 익명 글 실제 작성자 노출을 특히 점검한다.
5. 기존 백업/PITR와 복구 가능 시점을 확인한다. 스키마 변경이 필요하면 별도 개발 DB에서 이전 스키마와 새 코드를 함께 검증하고, 검토한 마이그레이션만 준비한다. 운영 `db reset`, seed, 강제 push 금지.
6. 역할별 별도 테스트 계정으로 미로그인/대기/일반 부원/운영진/관리자 allow/deny 및 실제 가입·신청·취소·실적 승인·팀 저장·알림 테스트. 운영 회원을 테스트 데이터로 쓰지 않는다.
7. 스키마를 변경하는 후속 릴리스는 별도 테스트 DB에서 검증하고 승인받은 뒤 적용한다. 코드 rollback과 DB rollback은 구분한다. 이번 코드 커밋·푸시 승인을 운영 DB 변경 승인으로 확대하지 않는다.

## 검증 기록

- 최초 플러그인 연결은 재인증 요구로 막혔고, 이후 사용자가 제공한 프로젝트 API 주소/키를 사용한 직접 조회로 검증 범위를 확장했다. 플러그인 재인증 자체가 완료된 것은 아니다.
- Next.js `16.3.5`에서 338개 모의/정적 회귀 검사 및 lint·TypeScript·프로덕션 빌드 통과. 생성 페이지 33개. 실제 운영 DB 통합 테스트 결과는 아니다.
- 패치 후 `npm audit --audit-level=high`: 보고된 취약점 0건. 설치 버전은 Next.js `16.3.5`, sharp `0.35.4`, js-yaml `4.3.2`다. 알려지지 않은 취약점까지 없음을 보장하지 않는다.
- 최종 프로덕션 HTTP 확인: 미로그인 `/home`, `/admin`은 각각 `/?next=%2Fhome`, `/?next=%2Fadmin`으로 307, `/login`은 200. 미리보기 플래그가 남아 있어도 보호 페이지 인증 우회 없음. 임시 프로덕션 서버는 종료했다.
- 개발 서버를 새 버전으로 다시 실행하고 브라우저에서 홈 렌더링과 MY 링크 이동을 확인했다. 확인한 콘솔 오류는 없고, 스플래시 마스코트 이미지의 eager loading 권고 경고 1개는 남아 있다. 실제 설치/알림 권한 허용이나 운영 계정 로그인은 테스트하지 않았다.
- 초기 미리보기 상태의 `release:check`는 6개 항목을 차단했다. 실제 API 연결 후에는 VAPID 키 쌍 누락 1개만 남았다. 이는 로컬 알림 테스트/운영 배포 설정의 미완료 항목이며, 환경파일은 코드 커밋에 포함하지 않는다.
- 실제 프로젝트 환경변수로도 프로덕션 빌드가 통과했다. 공개 빌드 산출물 92개에서 제공된 서버 키가 포함되지 않았음을 검사했다. `git diff --check` 통과. 개발 서버는 `http://localhost:3010`에서 실제 인증을 요구하는 상태로 실행 중이다.
- 실제 프로젝트 연결 후 로그인 화면 렌더링과 비로그인 홈 접근의 로그인 리다이렉트를 브라우저로 확인했다. 로컬 관리자 바로가기 역시 제거된 상태다. 실제 계정 로그인·가입·저장·삭제·푸시 발송은 수행하지 않았다.
- 로컬 `.env`나 실제 회원 데이터/파일을 Git에 추가하지 않았고, DB 변경 및 푸시 알림 발송 없음.
- Next.js의 middleware → proxy 권고는 기존 경고로 남아 있다.

## 근거

- [Supabase API grants와 RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase RLS와 역할별 테스트](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase 변경 내역](https://supabase.com/changelog)
- [Next.js AVIF 이미지 처리 보안 공지](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
- [sharp 보안 공지](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c)
- [Next.js 16.3.5 릴리스](https://github.com/vercel/next.js/releases/tag/v16.3.5)
