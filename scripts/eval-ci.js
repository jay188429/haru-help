// 안내문을 넣고 검색 평가를 돌려, 1위 정답이 기준보다 낮으면 실패로 끝낸다
const BASE = "http://127.0.0.1:5001/demo-haru/us-central1";
const MIN_TOP1 = 12;

async function call(name) {
  const res = await fetch(`${BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: {} }),
  });
  const json = await res.json();
  if (!json.result) throw new Error(`${name} 실패: ${JSON.stringify(json)}`);
  return json.result;
}

async function main() {
  console.log("buildKb", await call("buildKb"));
  const score = await call("evalKb");
  console.log("evalKb", score);
  if (score.top1 < MIN_TOP1) {
    console.error(`1위 정답 ${score.top1}/15 - 기준 ${MIN_TOP1} 아래라 실패`);
    process.exit(1);
  }
  console.log(`1위 정답 ${score.top1}/15 - 기준 ${MIN_TOP1} 이상`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
