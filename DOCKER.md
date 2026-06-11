# Docker Setup Guide

이 프로젝트는 Docker와 Docker Compose를 사용하여 MySQL 데이터베이스와 함께 실행할 수 있습니다.

## 필수 요구사항

- Docker Desktop (Mac/Windows) 또는 Docker Engine (Linux)
- Docker Compose (Docker Desktop에 포함됨)

## 빠른 시작

### 1. 환경 변수 설정

```bash
cp .env.docker .env
```

### 2. Docker Compose 시작

**모든 서비스 시작:**
```bash
docker-compose up -d
```

**로그 확인:**
```bash
docker-compose logs -f app
```

### 3. 데이터베이스 마이그레이션

```bash
docker-compose exec app npx prisma migrate dev --name init
```

### 4. API 테스트

```bash
curl http://localhost:3000/api/health
```

---

## 명령어 참조

### 서비스 관리

```bash
# 모든 서비스 시작
docker-compose up -d

# 모든 서비스 중지
docker-compose down

# 특정 서비스 재시작
docker-compose restart app
docker-compose restart mysql

# 로그 확인
docker-compose logs app
docker-compose logs mysql
docker-compose logs -f          # 실시간 로그

# 서비스 상태 확인
docker-compose ps
```

### 개발 작업

```bash
# 앱 컨테이너에서 명령 실행
docker-compose exec app npm run build
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma generate

# 데이터베이스 마이그레이션
docker-compose exec app npx prisma migrate dev

# 데이터베이스 초기화
docker-compose exec mysql mysql -u habit_user -p habit_password habit_tracker < init.sql
```

### 데이터베이스 접근

```bash
# MySQL 클라이언트 접속
docker-compose exec mysql mysql -u habit_user -p

# 비밀번호: habit_password (또는 .env 파일의 MYSQL_PASSWORD)
```

### 정리

```bash
# 모든 컨테이너 및 네트워크 제거
docker-compose down

# 모든 컨테이너, 네트워크, 볼륨 제거 (데이터 초기화)
docker-compose down -v
```

---

## 서비스 정보

### MySQL 서비스
- **포트**: 3306 (호스트에서 접근 가능)
- **사용자**: habit_user
- **비밀번호**: habit_password
- **데이터베이스**: habit_tracker
- **볼륨**: mysql_data

### Node.js 애플리케이션 서비스
- **포트**: 3000 (http://localhost:3000)
- **핫 리로드**: 활성화됨 (src 변경 시 자동 재시작)
- **노드 환경**: development

---

## 환경 변수 커스터마이징

`.env` 파일을 편집하여 설정 변경:

```bash
# 데이터베이스 설정
MYSQL_USER=custom_user
MYSQL_PASSWORD=custom_password
MYSQL_DATABASE=custom_db

# 애플리케이션 포트
APP_PORT=3001

# JWT 설정 (프로덕션에서는 반드시 변경)
JWT_SECRET=your-production-secret-key
```

변경 후 서비스 재시작:
```bash
docker-compose down
docker-compose up -d
```

---

## 트러블슈팅

### MySQL이 시작되지 않음
```bash
# MySQL 로그 확인
docker-compose logs mysql

# 데이터 초기화 후 재시작
docker-compose down -v
docker-compose up -d mysql
```

### 앱이 DB에 연결되지 않음
```bash
# MySQL 건강 상태 확인
docker-compose ps

# 데이터베이스 연결 테스트
docker-compose exec app npx prisma db push
```

### 포트 충돌
```bash
# 다른 포트 사용 (.env 수정)
APP_PORT=3001
DB_PORT=3307

# 기존 컨테이너 제거
docker-compose down
docker ps -a  # 종료되지 않은 컨테이너 확인
```

---

## Production 빌드

```bash
# Production 이미지 빌드
docker build -t habit-tracker:latest .

# Production 실행
docker run -d \
  --name habit-tracker \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  habit-tracker:latest
```

---

## 보안 주의사항

⚠️ **프로덕션 배포 전:**
1. `.env` 파일의 모든 비밀번호 변경
2. JWT_SECRET을 강력한 값으로 설정
3. 컨테이너 이미지를 프라이빗 레지스트리에 저장
4. 데이터베이스 백업 정책 수립
5. 로깅 및 모니터링 설정

---

## 참고 링크

- [Docker 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Prisma 마이그레이션](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate)
