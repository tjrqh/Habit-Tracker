# Habit Tracker API 🚀

포모도로(Pomodoro) 기법을 결합한 개인 습관 트래커 API 서버입니다.

## 📋 목차

- [기능](#-기능)
- [기술 스택](#-기술-스택)
- [빠른 시작](#-빠른-시작)
- [개발 환경 설정](#-개발-환경-설정)
- [Docker 설정](#-docker-설정)
- [API 문서](#-api-문서)
- [아키텍처](#-아키텍처)

## ✨ 기능

- 👤 **사용자 관리**: 회원가입, 인증
- 📝 **습관 등록**: 목표 습관 관리
- ⏲️ **포모도로 타이머**: 25분 단위 세션 관리
- 📊 **진행 상황 추적**: 완료된 세션 기록
- 🎯 **상태 관리**: IDLE → RUNNING → COMPLETED/FAILED

## 🛠 기술 스택

- **언어**: TypeScript (Strict 모드)
- **런타임**: Node.js 20+
- **프레임워크**: Express.js
- **데이터베이스**: MySQL (Docker) / SQLite (로컬 개발)
- **ORM**: Prisma
- **컨테이너**: Docker & Docker Compose

## 🚀 빠른 시작

### 로컬 개발 (SQLite)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd Habit-Tracker

# 2. 의존성 설치
npm install

# 3. 개발 서버 시작
npm run dev
```

**API 테스트:**
```bash
curl http://localhost:3000/api/health
```

### Docker Compose (MySQL)

```bash
# 1. 환경 변수 설정
cp .env.docker .env

# 2. 서비스 시작
docker-compose up -d

# 3. 데이터베이스 마이그레이션
docker-compose exec app npx prisma migrate dev

# 4. API 테스트
curl http://localhost:3000/api/health
```

**또는 Makefile 사용:**

```bash
make setup          # Docker 전체 설정
make docker-logs    # 로그 확인
make migrate-dev    # DB 마이그레이션
```

자세한 Docker 설정은 [DOCKER.md](./DOCKER.md) 참고

## 📚 개발 환경 설정

### 필수 요구사항

- Node.js 20+ 또는 Docker Desktop
- npm 또는 yarn

### 파일 구조

```
src/
├── config/           # 환경 설정 & DB 연결
├── middleware/       # 요청 처리 미들웨어
├── domains/          # 도메인 별 코드
│   ├── users/       # 사용자 관리
│   ├── habits/      # 습관 관리
│   └── sessions/    # 포모도로 세션 (DDD 적용)
├── common/          # 공통 유틸리티 & 예외
├── routes/          # API 라우트
├── app.ts           # Express 앱 설정
└── main.ts          # 진입점
```

### npm 명령어

```bash
npm run dev         # 개발 서버 시작
npm run build       # TypeScript 빌드
npm start           # 프로덕션 서버 시작
npm run lint        # 코드 검사
npm run format      # 코드 포맷팅
npm test            # 테스트 실행
```

## 🐳 Docker 설정

### 빠른 시작

```bash
# 전체 설정
make setup

# 또는 수동
cp .env.docker .env
docker-compose up -d
```

### Docker Compose 명령어

```bash
docker-compose up -d              # 시작
docker-compose down               # 중지
docker-compose logs -f app        # 로그 보기
docker-compose ps                 # 상태 확인
docker-compose exec app sh        # 컨테이너 접속
```

### 서비스 정보

| 서비스 | 포트 | 주소 |
|--------|------|------|
| Node.js App | 3000 | http://localhost:3000 |
| MySQL | 3306 | localhost:3306 |

**MySQL 접속:**

```bash
# Docker Compose 사용
docker-compose exec mysql mysql -u habit_user -phabit_password

# 또는
mysql -h localhost -u habit_user -phabit_password habit_tracker
```

## 🔌 API 문서

### 헬스 체크

```bash
GET /api/health
```

### 사용자 API

```bash
# 회원가입
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

# 사용자 조회
GET /api/users/:id

# 모든 사용자 조회
GET /api/users

# 사용자 삭제
DELETE /api/users/:id
```

### 습관 API

```bash
# 습관 생성
POST /api/habits
{
  "userId": "user-id",
  "title": "운동",
  "targetTomato": 4,
  "description": "일일 운동 습관"
}

# 습관 조회
GET /api/habits/:id

# 사용자 습관 조회
GET /api/habits/user/:userId

# 활성 습관만 조회
GET /api/habits/user/:userId/active

# 습관 업데이트
PUT /api/habits/:id

# 습관 삭제
DELETE /api/habits/:id
```

### 세션 API

```bash
# 세션 생성
POST /api/sessions
{
  "userId": "user-id",
  "habitId": "habit-id",
  "duration": 1500
}

# 세션 시작
PATCH /api/sessions/:id/start

# 세션 완료
PATCH /api/sessions/:id/complete

# 세션 실패
PATCH /api/sessions/:id/fail

# 사용자 세션 조회
GET /api/sessions/user/:userId

# 진행 중인 세션 조회
GET /api/sessions/user/:userId/running

# 습관별 세션 조회
GET /api/sessions/habit/:habitId
```

## 🏛️ 아키텍처

### 계층 구조

**일반 도메인 (Users, Habits) - 3계층:**
```
Controller → Service → Repository → Database
```

**복잡 비즈니스 로직 (Sessions) - DDD 패턴:**
```
Controller → Service → Entity (Domain Logic) → Repository → Database
```

### 디자인 패턴

- **Entity Pattern**: 포모도로 세션의 상태 관리
- **Repository Pattern**: 데이터 접근 계층 추상화
- **DTO Pattern**: 요청/응답 데이터 검증
- **Global Error Handler**: 통일된 예외 처리

## 🔐 보안

- TypeScript Strict Mode
- bcryptjs로 비밀번호 암호화
- JWT 기반 인증
- SQL 인젝션 방지 (Prisma)
- CORS 설정 (필요 시)

## 📦 배포

### Docker 프로덕션 빌드

```bash
# 이미지 빌드
docker build -t habit-tracker:latest .

# 실행
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="mysql://..." \
  habit-tracker:latest
```

### 환경 변수 (프로덕션)

```bash
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:3306/habit_tracker
JWT_SECRET=<strong-secret-key>
PORT=3000
```

## 🐛 트러블슈팅

### 문제: "Cannot find module '@prisma/client'"

**해결:**
```bash
npm install
npx prisma generate
```

### 문제: MySQL 연결 실패

**해결:**
```bash
# Docker 상태 확인
docker-compose ps

# MySQL 로그 확인
docker-compose logs mysql

# 재시작
docker-compose restart mysql
```

### 문제: 포트 충돌

**해결:**
```bash
# .env 파일에서 포트 변경
APP_PORT=3001
DB_PORT=3307

# 기존 컨테이너 제거
docker-compose down
docker-compose up -d
```

## 📝 개발 가이드

### Git Workflow

```bash
git checkout -b feature/새-기능
# ... 코드 작성 ...
git commit -m "feat: 새 기능 추가"
git push origin feature/새-기능
```

### 코드 스타일

```bash
# ESLint로 검사
npm run lint

# Prettier로 포맷팅
npm run format
```

## 📄 라이선스

MIT

## 👨‍💻 기여

Pull Request는 언제나 환영합니다!

## 📞 문의

문제가 있거나 질문이 있으시면 Issue를 등록해주세요.
