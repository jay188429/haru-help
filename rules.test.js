// 하루상점 고객센터 Firestore 보안 규칙 테스트
import { readFileSync } from "node:fs";
import { test, before, beforeEach, after } from "node:test";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const RULES = "firestore.rules";

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-haru-help",
    firestore: { rules: readFileSync(RULES, "utf8") },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/cust01"), { name: "연습 손님", role: "customer" });
    await setDoc(doc(db, "questions/q1"), { uid: "cust01", text: "택배는 언제 와요?", status: "waiting" });
    await setDoc(doc(db, "kb/k01"), { title: "배송 기간", text: "평일 기준 1~2일 안에 보냅니다", category: "배송" });
    await setDoc(doc(db, "tickets/t1"), { uid: "cust01", question: "얼룩 교환", reason: "교환 요구", status: "open" });
  });
});

after(async () => {
  await testEnv.cleanup();
});

// 질문 questions - 읽기
test("허용 - 손님이 자기 질문을 읽는다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertSucceeds(getDoc(doc(손님.firestore(), "questions/q1")));
});

test("거부 - 손님이 남의 질문을 읽는다", async () => {
  const 다른손님 = testEnv.authenticatedContext("cust02");
  await assertFails(getDoc(doc(다른손님.firestore(), "questions/q1")));
});

test("거부 - 로그인 안 한 사람이 질문을 읽는다", async () => {
  const guest = testEnv.unauthenticatedContext();
  await assertFails(getDoc(doc(guest.firestore(), "questions/q1")));
});

// 질문 questions - 만들기 · 고치기
test("허용 - 손님이 내 UID와 waiting 으로 질문을 만든다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertSucceeds(
    setDoc(doc(손님.firestore(), "questions/q2"), { uid: "cust01", text: "환불돼요?", status: "waiting" }),
  );
});

test("거부 - 손님이 남의 UID로 질문을 만든다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertFails(
    setDoc(doc(손님.firestore(), "questions/q2"), { uid: "cust02", text: "환불돼요?", status: "waiting" }),
  );
});

test("거부 - 손님이 answered 로 질문을 만든다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertFails(
    setDoc(doc(손님.firestore(), "questions/q2"), { uid: "cust01", text: "환불돼요?", status: "answered" }),
  );
});

test("거부 - 손님이 답 칸을 채워 질문을 만든다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertFails(
    setDoc(doc(손님.firestore(), "questions/q2"), {
      uid: "cust01",
      text: "환불돼요?",
      status: "waiting",
      answer: "바로 환불됩니다",
    }),
  );
});

test("거부 - 손님이 자기 질문에 답을 써 넣는다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertFails(updateDoc(doc(손님.firestore(), "questions/q1"), { answer: "제가 씁니다" }));
});

// 안내문 kb
test("거부 - 손님이 안내문을 읽는다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertFails(getDoc(doc(손님.firestore(), "kb/k01")));
});

test("거부 - 손님이 안내문을 고친다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertFails(setDoc(doc(손님.firestore(), "kb/k01"), { text: "아무 때나 보냅니다" }, { merge: true }));
});

// 사용자 문서 users
test("허용 - 손님이 자기 사용자 문서를 읽는다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertSucceeds(getDoc(doc(손님.firestore(), "users/cust01")));
});

test("거부 - 손님이 남의 사용자 문서를 읽는다", async () => {
  const 다른손님 = testEnv.authenticatedContext("cust02");
  await assertFails(getDoc(doc(다른손님.firestore(), "users/cust01")));
});

test("허용 - 새 손님이 customer 로 자기 사용자 문서를 만든다", async () => {
  const 새손님 = testEnv.authenticatedContext("cust03");
  await assertSucceeds(setDoc(doc(새손님.firestore(), "users/cust03"), { name: "새 손님", role: "customer" }));
});

test("거부 - 새 손님이 staff 로 자기 사용자 문서를 만든다", async () => {
  const 새손님 = testEnv.authenticatedContext("cust03");
  await assertFails(setDoc(doc(새손님.firestore(), "users/cust03"), { name: "새 손님", role: "staff" }));
});

// 상담 티켓 tickets (M40)
test("허용 - 담당자가 티켓을 읽는다", async () => {
  const 담당자 = testEnv.authenticatedContext("staff01", { staff: true });
  await assertSucceeds(getDoc(doc(담당자.firestore(), "tickets/t1")));
});

test("거부 - 손님이 티켓을 읽는다", async () => {
  const 손님 = testEnv.authenticatedContext("cust01");
  await assertFails(getDoc(doc(손님.firestore(), "tickets/t1")));
});

test("거부 - 담당자도 브라우저에서 티켓을 쓰지 못한다", async () => {
  const 담당자 = testEnv.authenticatedContext("staff01", { staff: true });
  await assertFails(setDoc(doc(담당자.firestore(), "tickets/t2"), { question: "x", status: "open" }));
});
