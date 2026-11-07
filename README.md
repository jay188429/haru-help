# 하루상점 고객센터 (haru-help)

Notion 미니프로젝트 가이드를 따라 만든 RAG + 도구 호출 상담봇.
Firebase(Hosting · Auth · Firestore · Functions · Storage) + Gemini API.

## 구조
- `functions/rag.js` — 번호 묶음 1~19 (임베딩, 검색, 리랭킹, 근거 답변, 트리거, 도구, 에이전트, 평가, 가드레일, 심판)
- `functions/index.js` — `rag.js` 의 함수를 내놓는다
- `firestore.rules` · `storage.rules` · `firestore.indexes.json`
- `public/index.html` (손님: 로그인 · 상담 · 👍👎 GA4) · `public/admin.html` (담당자: 티켓 · 알림 · 안내문 넣기/올리기)
- `rules.test.js` — 보안 규칙 테스트 17개 (`npm test`)
- `scripts/eval-ci.js` · `.github/workflows/eval-ci.yml` — PR 회귀 평가 (1위 정답 기준 12/15)
- `functions/*.csv · *.json` — 안내문 40장, 평가 세트(15 · 12 · 8문항), 연습 상품/주문
- `docs/` — 점수표 · 점검표 · 결과 문서 · 회고 **빈 양식** (측정 후 직접 채운다)
- `req-*.json` — curl 요청 파일. `(내 UID)` 자리는 에뮬레이터 Authentication 탭의 UID로 바꾼다

## 배포 상태
- 공개 주소: https://haru-help-3b683.web.app (관리 화면: /admin.html)
- 배포한 함수: onQuestionCreated · buildKb · grantStaff · onKbUploaded (평가·시험 함수는 올리지 않음)
- 배포한 것: Firestore 규칙·색인, Storage 규칙, Hosting. 이미지 정리 정책 1일
- 배포 후 할 일: 관리 화면에서 Google 로그인 → 담당자 권한 받기 → 안내문 넣기(40)

## 직접 해야 하는 것
1. ~~Firebase 프로젝트 ID · firebaseConfig 교체~~ — 완료 (haru-help-3b683)
2. 콘솔에서 Authentication(이메일/비밀번호 · Google), Firestore(프로덕션 모드), Storage(US-CENTRAL1) 시작
3. **시크릿**: `npx firebase functions:secrets:set GEMINI_API_KEY` (키는 새 프로젝트의 무료 등급 키 권장).
   에뮬레이터에서만 쓸 때는 `functions/.secret.local` 에 `GEMINI_API_KEY=...` (git 제외됨)
4. ~~OWNER_EMAIL 교체~~ — 완료 (you18676@gmail.com)
5. ~~GA4 측정 ID 교체~~ — 완료 (G-2JME6JM67D)
6. 로컬 실행: `npm install` · `cd functions && npm install` → `npx firebase emulators:start` → `buildKb` → (UID 반영 후) `seedShop`
7. 배포(가이드 M41): `npx firebase deploy --only firestore,hosting,functions:onQuestionCreated,functions:buildKb,functions:grantStaff` (+ `storage`, `functions:onKbUploaded`). `askAgent`·`eval*`·`judgeAnswers`·`seedShop` 은 올리지 않는다
8. GitHub 비공개 저장소 + Actions 시크릿 `GEMINI_API_KEY`
9. 평가 실행·점수 기록·결과 문서·회고·제출은 직접 (`docs/` 양식)

## 명령 모음 (에뮬레이터, 프로젝트 ID 교체)
```
curl.exe -X POST http://127.0.0.1:5001/<프로젝트 ID>/us-central1/buildKb -H "Content-Type: application/json" --data-binary "@req-empty.json"
curl.exe -X POST http://127.0.0.1:5001/<프로젝트 ID>/us-central1/seedShop -H "Content-Type: application/json" --data-binary "@req-seed.json"
curl.exe -X POST http://127.0.0.1:5001/<프로젝트 ID>/us-central1/evalKb -H "Content-Type: application/json" --data-binary "@req-empty.json"
```
