# FocusHabit - 습관 및 포모도로 타이머 트래커 🍅🚀

FocusHabit은 포모도로(Pomodoro) 기법을 결합한 통합 개인 습관 관리 및 생산성 향상 플랫폼입니다. 백엔드(Express.js & TypeScript & Prisma)와 프론트엔드(React & TypeScript & Vite)가 통합된 풀스택 웹 애플리케이션입니다.

---

## 📋 목차
1. [주요 기능](#-주요-기능)
2. [기술 스택](#-기술-스택)
3. [프로젝트 구조](#-프로젝트-구조)
4. [설치 및 실행 방법](#-설치-및-실행-방법)
5. [Docker 환경 구축](#-docker-환경-구축)
6. [API 엔드포인트 명세](#-api-엔드포인트-명세)
7. [주요 해결된 이슈 및 리팩토링](#-주요-해결된-이슈-및-리팩토링)

---

## ✨ 주요 기능

- 👤 **사용자 관리**: 간편한 사용자 선택(프로필 전환) 및 이메일/비밀번호 기반 신규 가입
- 📝 **습관 등록 및 관리**:
  - 목표 뽀모도로(토마토) 개수 설정
  - 습관별 기본 집중 시간 설정 및 자동 반복(무한 반복) 활성화 여부 지정
  - 습관 활성화/일시정지 토글 및 습관 삭제
- ⏲️ **포모도로 타이머 (모달 인터페이스)**:
  - 원형 SVG 진행 바와 디지털 시계 인터페이스
  - 타이머 작동 제어: 시작, 일시정지, 포기하기, 다시 시작
  - **집중 세션 지속성**: 타이머 진행 중 창을 닫아도 백엔드에서는 세션이 유지되며, 재접속 시 진행 시간이 복구됩니다.
  - **테스트 모드**: 1초를 1분으로 단축하여 타이머 완료 시나리오를 빠르게 검증할 수 있는 개발자 모드 탑재.
- 🎵 **오디오 & 시각 효과**:
  - Web Audio API를 활용한 효과음 합성 피드백 (시작/완료/실패 시 맞춤 신시사이저 비프음 연주)
  - 완료 시 터지는 다채로운 파티클/콘페티(Confetti) 이펙트

---

## 🛠 기술 스택

### Backend
- **런타임**: Node.js 20+
- **프레임워크**: Express.js
- **언어**: TypeScript (Strict 모드 및 모듈 경로 별칭 `@` 설정)
- **ORM**: Prisma
- **데이터베이스**: SQLite (로컬 개발용 디폴트) 또는 MySQL (Docker 환경)
- **보안**: bcryptjs(비밀번호 해싱), JWT(인증 토큰)

### Frontend
- **라이브러리**: React 18
- **빌드 도구**: Vite (HMR 지원 및 최적화된 빌드)
- **언어**: TypeScript (Strict & Verbatim Module Syntax 적용)
- **스타일링**: Vanilla HSL CSS (프리미엄 다크 모드, 글래스모피즘 스타일 적용)
- **아이콘**: Lucide React

---

## 📂 프로젝트 구조

애플리케이션은 유지보수성을 극대화하기 위해 백엔드와 프론트엔드가 모듈화되어 분리된 모노레포 형태를 띠고 있습니다.

```text
Habit-Tracker/
├── src/                    # 백엔드 소스 코드 (Express)
│   ├── config/             # DB 인스턴스 및 환경 변수 설정
│   ├── common/             # 예외 및 공통 헬퍼 클래스
│   ├── middleware/         # 에러 핸들러 및 로깅 미들웨어
│   ├── routes/             # 메인 Express 라우터 정의
│   ├── domains/            # 도메인 주도 설계(DDD) 관점의 도메인 단위 폴더
│   │   ├── users/          # 사용자 도메인 (Controller, Service, Repository)
│   │   ├── habits/         # 습관 도메인
│   │   └── sessions/       # 포모도로 세션 도메인 (상태 기계 및 비즈니스 엔티티 포함)
│   ├── app.ts              # Express 앱 설정 및 React SPA 정적 라우팅 서빙
│   └── main.ts             # 백엔드 서버 진입점 (포트 3000)
│
├── frontend/               # 프론트엔드 소스 코드 (Vite + React)
│   ├── src/
│   │   ├── components/     # UI 공통 컴포넌트
│   │   │   ├── AuthCard.tsx    # 로그인 및 프로필 등록 카드
│   │   │   └── TimerModal.tsx  # 포모도로 타이머 제어 모달
│   │   ├── utils/          # 프론트엔드 유틸리티
│   │   │   ├── audio.ts        # Web Audio API 기반 오디오 합성 피드백
│   │   │   └── particles.ts    # 습관 완료 콘페티 파티클 캔버스 렌더러
│   │   ├── types.ts        # TypeScript 공통 인터페이스 선언
│   │   ├── index.css       # 메인 다크 글래스모피즘 테마 스타일시트
│   │   ├── App.tsx         # 대시보드 코어 통합 파일
│   │   └── main.tsx        # React 엔트리포인트
│   ├── index.html          # SPA 템플릿
│   ├── tsconfig.json       # 빌드 설정
│   └── vite.config.ts      # Vite 번들러 설정 (포트 5173 개발 서버)
│
├── prisma/                 # 데이터베이스 마이그레이션 스키마
├── package.json            # 전체 빌드 및 스크립트 관리자
└── README.md               # 가이드 문서 (본 파일)
```

---

## 🚀 설치 및 실행 방법

### 1. 환경 변수 준비
프로젝트 루트 디렉토리에 `.env` 파일을 작성합니다.
```env
PORT=3000
DATABASE_URL="file:./dev.db" # SQLite 로컬 개발 경로
JWT_SECRET="your_jwt_secret_key_here"
```

### 2. 의존성 패키지 설치
루트 디렉토리와 프론트엔드 디렉토리의 의존성을 한 번에 설치합니다.
```bash
# 루트 및 백엔드 패키지 설치
npm install

# 프론트엔드 패키지 설치
npm run frontend:install
```

### 3. 데이터베이스 생성 및 스키마 적용
Prisma CLI를 사용하여 로컬 SQLite 데이터베이스 파일을 생성하고 마이그레이션을 적용합니다.
```bash
npx prisma db push
npx prisma generate
```

### 4. 개발 모드 동시 실행
프론트엔드 개발 서버(Vite, 포트 5173)와 백엔드 API 서버(nodemon, 포트 3000)를 별도 터미널에서 띄워 실시간 수정 사항이 반영되도록 합니다.
- **백엔드 시작 (포트 3000)**: `npm run dev`
- **프론트엔드 시작 (포트 5173)**: `npm run frontend:dev`

### 5. 빌드 및 백엔드 정적 서빙 실행 (프로덕션 환경 테스트)
프론트엔드를 빌드하여 번들된 결과를 백엔드 Express 서버에서 스태틱하게 제공하도록 준비합니다.
```bash
# 1. 프론트엔드 빌드 (결과물이 frontend/dist에 생성됨)
npm run frontend:build

# 2. 백엔드 빌드
npm run build

# 3. 백엔드 프로덕션 실행 (포트 3000에서 백엔드 API와 프론트엔드 React 앱을 함께 서빙)
npm start
```
이후 브라우저에서 `http://localhost:3000`에 접속하면, 추가 실행 없이 Express 서버에서 제공하는 React 앱 전체를 확인하실 수 있습니다.

---

## 🐳 Docker 환경 구축

프로젝트에 구성된 `docker-compose` 및 `Makefile`을 이용해 가볍게 데이터베이스(MySQL)와 백엔드 서비스를 함께 기동할 수 있습니다.

```bash
# Docker 인프라 초기 셋업 (데이터베이스 및 앱 빌드/기동)
make setup

# 로그 실시간 모니터링
make docker-logs

# 서비스 제거 및 리소스 정리
npm run docker:down
```

---

## 🔌 API 엔드포인트 명세

### 헬스 체크
- `GET /api/health`: 서버 상태 확인

### 사용자 API
- `POST /api/users/register`: 신규 이메일 가입
- `POST /api/users/login`: 이메일/비밀번호 기반 로그인
- `GET /api/users`: 전체 사용자 프로필 목록 조회
- `GET /api/users/:id`: 특정 사용자 상세 정보 조회
- `DELETE /api/users/:id`: 사용자 삭제

### 습관 API
- `POST /api/habits`: 새 습관 생성
- `GET /api/habits/user/:userId`: 특정 사용자의 모든 습관 조회
- `GET /api/habits/user/:userId/active`: 특정 사용자의 활성화 상태 습관 조회
- `PUT /api/habits/:id`: 습관 정보 수정
- `DELETE /api/habits/:id`: 습관 영구 삭제

### 세션 API
- `POST /api/sessions`: 타이머 시작과 함께 세션 생성
- `PATCH /api/sessions/:id/start`: 세션 타이머 시작 (IDLE -> RUNNING)
- `PATCH /api/sessions/:id/complete`: 세션 시간 완료 처리 (RUNNING -> COMPLETED)
- `PATCH /api/sessions/:id/fail`: 세션 중간 포기 처리 (RUNNING -> FAILED)
- `GET /api/sessions/user/:userId/running`: 현재 진행 중인 세션 유무 체크 (중단/새로고침 시 복구용)

---

## 5. 주요 해결된 이슈 및 리팩토링

1. **포모도로 세션 상태 중복 문제 해결**:
   - **증상**: 타이머를 일시정지했다가 재개(집중 재개)할 때 백엔드로 다시 PATCH 요청 `/start`를 날리면서 DB 세션이 이미 `RUNNING` 상태인데 다시 시작을 시도하여 `Cannot start session with status RUNNING` 400 에러가 발생하는 이슈.
   - **해결**: 프론트엔드 단에서 `activeSession.status`가 `RUNNING`인 경우 중복해서 서버로 시작 요청을 보내지 않고 클라이언트 타이머만 재가동하도록 로직을 수정했습니다.
2. **타이머 종료 편의성 개선**:
   - 타이머 완료 시 매번 모달을 완전히 닫고 나가서 다시 들어오는 대신, 완료 후 팝업 내부에서 즉시 새로운 세션을 이어 나갈 수 있도록 **"다시 시작"** 버튼을 도입했습니다.
   - 집중 실패 시에도 닫거나 재시작하기가 훨씬 용이하게 제어 버튼을 재배치하였습니다.
3. **Vanilla JS 레거시 프론트엔드 제거**:
   - 프로젝트 루트에 방치되어 유지보수를 방해하던 구 버전 바닐라 CSS/JS 프론트엔드 `public` 폴더를 완벽히 제거했습니다.
   - 백엔드 Express 앱(`src/app.ts`)이 `frontend/dist`에 최적화 번들된 React SPA 결과물을 서빙하도록 전면 개편하고, 알 수 없는 페이지 요청(404) 시 리액트 라우팅을 지원하기 위해 `index.html`로 fallback 전달하도록 하였습니다.
4. **리액트 코드 모듈화**:
   - 기존의 거대한 1300라인 단일 `App.tsx` 파일에서 오디오 신시사이저 유틸(`utils/audio.ts`), 파티클 콘페티 연출(`utils/particles.ts`), 사용자 접속용 카드(`components/AuthCard.tsx`), 타이머 핵심 원형 모달(`components/TimerModal.tsx`)로 핵심 로직을 기능별로 완전히 파편화하여 코드의 읽기 흐름과 재사용성을 크게 향상시켰습니다.
