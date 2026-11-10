// 통장 일대기 — 태어난 곳, 사는 시, 태어날 때 성별, 최종 학력
// 통계 계산에는 쓰지 않는다(집값·임금은 권역 평균으로 계산). 화면과 카드에 보여 주려고 씨앗으로 뽑는다.
(function (root) {
  const C = root.TJ_CITY, TJ = root.TJ, D = root.TJ_DATA;
  function wpick(list, x) { // x: 0~1
    let total = 0; for (const it of list) total += it[2];
    let v = x * total;
    for (const it of list) { if (v < it[2]) return it; v -= it[2]; }
    return list[list.length - 1];
  }
  // 사는 시: 같은 권역 안에서 주민등록 인구 비율로 뽑는다. moves: 이사한 횟수(이사하면 다른 시가 된다)
  function live(seed, region, moves) {
    const r = TJ.rng((seed ^ 0x3c6ef372) >>> 0);
    let it = wpick(C.live[region], r());
    for (let i = 0; i < (moves || 0); i++) { let nx = it, guard = 0; while (nx[0] === it[0] && guard++ < 20) nx = wpick(C.live[region], r()); it = nx; }
    return { name: it[0], short: it[1] };
  }
  // 태어난 곳: 시·군별 출생아 수 비율로 뽑는다
  function born(seed) {
    const r = TJ.rng((seed ^ 0x1b873593) >>> 0);
    const it = wpick(C.born, r());
    return { name: it[0], short: it[1] };
  }
  // 태어날 때 성별: 출생 성비대로 뽑는다(초상화와 통계 계산에는 쓰지 않는다)
  function sex(seed) {
    const r = TJ.rng((seed ^ 0x85ebca6b) >>> 0);
    return r() < C.sex.m / (C.sex.m + C.sex.f) ? "m" : "f";
  }
  // 최종 학력: 고등학교 졸업자 진학률대로 뽑는다. 20세 이하에 첫 월급을 받는 판은 고등학교 졸업으로 본다(가정)
  function edu(seed, startAge) {
    if (startAge <= 20) return "high";
    const r = TJ.rng((seed ^ 0xc2b2ae35) >>> 0);
    return r() < D.college.rate / 100 ? "college" : "high";
  }
  const EDU = { high: "고등학교 졸업", college: "대학 진학(전문대 포함)" };
  const EDU_SHORT = { high: "고등학교 졸업", college: "대학 진학" };
  root.TJ_PLACE = { live: live, born: born, sex: sex, edu: edu, EDU: EDU, EDU_SHORT: EDU_SHORT };
})(typeof window !== "undefined" ? window : globalThis);
