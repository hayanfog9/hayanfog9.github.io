// 통장 일대기 — 마지막 장 기록 카드 (1080x1350). 그림 파일 없이 canvas로만 그린다.
(function (root) {
  const D = root.TJ_DATA, TJ = root.TJ;
  const SITE = "hayanfog9.github.io/bankbook-life-3k7d";
  const INK = "#173b63", INK2 = "#4a5a70", PAPER = "#f4efe3", PAGE = "#fbf8ef", RULE = "#cdd9c8", GREEN = "#0c7a57", SEAL = "#c5352b", TEXT = "#16263d";
  const FONT = 'system-ui, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  const MONO = 'ui-monospace, "D2Coding", "Cascadia Mono", Consolas, "Courier New", monospace';

  // ── 이름: 흔한 성과 이름에서 씨앗으로 뽑는다. 널리 알려진 실제 인물과 같은 조합은 건너뛴다 ──
  const SUR = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍"];
  const GIVEN = ["지우", "서연", "민준", "하준", "도윤", "수아", "지호", "예준", "서윤", "시우", "하은", "주원", "지민", "유진", "현우", "은서", "수빈", "태윤", "다은", "준서",
    "채원", "민서", "지안", "연우", "소율", "건우", "나은", "윤서", "우진", "서진", "가은", "재윤", "은우", "하린", "승현", "유나", "정우", "예린", "동현", "세아"];
  const BAN = ["황지우", "박지민", "한지민", "김지민", "이서진", "김지호", "오지호", "김우진", "이현우", "김현우", "김지우", "최수빈", "안유진", "김유진", "이유진", "김동현", "김채원",
    "이서연", "신유나", "김건우", "이나은", "김정우", "박정우", "이승현", "김승현", "정예린", "김세아", "윤세아", "홍수아", "김시우", "김주원", "김연우", "김재윤", "김가은",
    "김태윤", "김민준", "김민서", "이지은", "김연아", "손흥민", "이민호", "김수현", "박서준", "전지현", "송혜교", "유재석", "강호동", "이재명", "윤석열", "안철수", "한동훈"];
  function nameOf(seed) {
    const r = TJ.rng((seed ^ 0x9e3779b9) >>> 0);
    for (let i = 0; i < 30; i++) {
      const n = SUR[Math.floor(r() * SUR.length)] + GIVEN[Math.floor(r() * GIVEN.length)];
      if (BAN.indexOf(n) < 0) return n;
    }
    return "한소율";
  }
  const recordNo = (seed) => "2026-" + String(seed % 10000).padStart(4, "0");

  // ── 픽셀 초상화 16x16. 씨앗으로 얼굴(머리 모양·피부·옷·안경을 쓰는 나이)을 정하고, 나이에 따라 머리색·주름·안경이 바뀐다 ──
  // 같은 씨앗이면 나이가 달라도 같은 사람으로 보이게, 무작위 값은 처음에 한꺼번에 뽑는다.
  function portrait(c, x, y, size, seed, age) {
    const r = TJ.rng((seed ^ 0x51ed270b) >>> 0);
    const v = []; for (let i = 0; i < 10; i++) v.push(r());
    const px = size / 16;
    const band = age < 20 ? -1 : age < 40 ? 0 : age < 58 ? 1 : age < 76 ? 2 : 3;
    const skin = ["#f1c9a5", "#e8b98f", "#d9a57a"][Math.floor(v[0] * 3)];
    const shade = "#c98f66";
    const style = Math.floor(v[1] * 4);          // 0 짧은 머리, 1 단발, 2 긴 머리, 3 올림머리
    const glassesFrom = 20 + Math.floor(v[2] * 75); // 이 나이부터 안경을 쓴다(늦게 쓰거나 끝내 안 쓰는 사람도 있다)
    const glasses = age >= glassesFrom;
    const cloth = ["#173b63", "#5f8f78", "#8a5a3c", "#3d5a80", "#a36b4f"][Math.floor(v[3] * 5)];
    const dark = ["#2b2320", "#3b2a20", "#1f1f24"][Math.floor(v[4] * 3)];
    const grayAt = 44 + Math.floor(v[5] * 16);   // 흰머리가 섞이기 시작하는 나이
    const hair = age < grayAt ? dark : age < grayAt + 14 ? "#6a645e" : age < grayAt + 26 ? "#b9b6b0" : "#e4e1da";
    const thin = band >= 2 && style === 0 && v[6] < 0.45; // 숱이 줄어든 머리
    const P = (cx, cy, col, w, h) => { c.fillStyle = col; c.fillRect(Math.round(x + cx * px), Math.round(y + cy * px), Math.ceil((w || 1) * px), Math.ceil((h || 1) * px)); };
    P(0, 0, "#dfeadf", 16, 16);
    // 옷과 목
    P(3, 13, cloth, 10, 3); P(2, 14, cloth, 12, 2); P(7, 12, skin, 2, 2); P(7, 13, shade, 2, 1);
    c.globalAlpha = 0.28; P(2, 15, "#000", 12, 1); P(3, 13, "#fff", 2, 1); P(11, 13, "#fff", 2, 1); c.globalAlpha = 0.5; P(6, 13, "#fff", 1, 1); P(9, 13, "#fff", 1, 1); c.globalAlpha = 1;
    // 얼굴과 귀
    P(5, 4, skin, 6, 8); P(4, 5, skin, 8, 6); P(6, 12, skin, 4, 1);
    P(3, 7, skin, 1, 2); P(12, 7, skin, 1, 2);
    // 머리
    const baby = age < 3;
    if (baby) { P(7, 3, hair, 2, 1); P(8, 2, hair, 1, 1); }
    else if (!thin) { P(5, 2, hair, 6, 1); P(4, 3, hair, 8, 2); P(4, 5, hair, 1, 1); P(11, 5, hair, 1, 1); } else { P(4, 4, hair, 1, 3); P(11, 4, hair, 1, 3); P(5, 3, hair, 1, 1); P(10, 3, hair, 1, 1); }
    if (!baby) {
    if (style === 1) { P(3, 4, hair, 1, 6); P(12, 4, hair, 1, 6); P(4, 5, hair, 1, 3); P(11, 5, hair, 1, 3); }
    if (style === 2) { P(3, 4, hair, 1, 9); P(12, 4, hair, 1, 9); P(2, 6, hair, 1, 7); P(13, 6, hair, 1, 7); P(4, 5, hair, 1, 2); P(11, 5, hair, 1, 2); }
    if (style === 3) { P(7, 0, hair, 2, 2); P(6, 1, hair, 4, 1); P(3, 4, hair, 1, 3); P(12, 4, hair, 1, 3); }
    if (style === 0 && !thin) { P(5, 5, hair, 2, 1); }
    }
    // 눈, 눈썹, 입, 볼
    P(6, 8, "#1c1c22"); P(9, 8, "#1c1c22");
    const brow = band >= 3 ? "#9b958c" : hair === dark ? dark : "#5b5651";
    P(6, 7, brow); P(9, 7, brow);
    P(7, 11, "#a8553f", 2, 1); P(6, 10, "#a8553f"); P(9, 10, "#a8553f");
    P(5, 9, "#eaa79a"); P(10, 9, "#eaa79a");
    if (band >= 1) { P(5, 10, shade); P(10, 10, shade); }       // 팔자 주름
    if (band >= 2) { P(6, 6, shade, 4, 1); }                    // 이마 주름
    if (band >= 3) { P(7, 9, shade, 2, 1); P(4, 9, shade); P(11, 9, shade); }
    if (band === -1) { P(5, 9, "#f3b3a6"); P(10, 9, "#f3b3a6"); } // 아이는 볼이 더 붉다
    if (glasses) { const g = "#55616e", lens = "#f6e3cf"; P(5, 7, g, 3, 1); P(8, 7, g, 3, 1); P(4, 8, g); P(11, 8, g); P(5, 9, "#a9b2bb"); P(7, 9, "#a9b2bb", 2, 1); P(10, 9, "#a9b2bb"); P(5, 8, lens); P(7, 8, lens, 2, 1); P(10, 8, lens); P(6, 8, "#11131a"); P(9, 8, "#11131a"); }
  }

  // ── 같은 시작 조건으로 미리 돌린 판들 가운데 내 자리 찾기 ──
  // 표의 p는 65세 순자산(만원)을 아래에서부터 고르게 나눈 자리들이다(99개면 1%~99%).
  function place(s, opt) {
    const T = root.TJ_DIST;
    const row = T && T.t[opt.job] && T.t[opt.job][opt.region] && T.t[opt.job][opt.region][opt.age - 19];
    if (!row) return null;
    const v = s.snap && s.snap[65];
    if (v == null) return { early: true, earlyPct: row.e, n: T.n };
    const man = v / 1e4, p = row.p, m = p.length, step = 100 / (m + 1);
    let pct;
    if (man <= p[0]) pct = step * Math.max(0.05, man / Math.max(1, p[0]));
    else if (man >= p[m - 1]) pct = 100 - step + step * Math.min(0.95, (man - p[m - 1]) / Math.max(1, p[m - 1] * 0.5));
    else { let i = 0; while (man > p[i + 1]) i++; pct = step * (i + 1) + step * (man - p[i]) / Math.max(1, p[i + 1] - p[i]); }
    const rank = Math.min(T.n, Math.max(1, Math.round((100 - pct) / 100 * T.n)));
    return { early: false, rank: rank, pct: pct, n: T.n, row: row };
  }

  const JOB = { min: "최저임금 일자리", sme: "중소기업", large: "대기업" };
  const CAUSE = { neoplasm: "암 등 신생물", circ: "순환계통 질환", resp: "호흡계통 질환", external: "사고 등 외부 요인", neuro: "신경계통 질환", digest: "소화계통 질환",
    endo: "내분비·대사 질환", infect: "감염성 질환", genito: "비뇨생식계통 질환", mental: "정신·행동 장애", unspec: "원인 불명확(통계 분류)", other: "그 밖의 질환" };
  const STATE = { w: "#2f5f8f", u: "#c9792b", r: "#c9cfd4", p: "#8fbf9f" };

  function man(v) {
    const neg = v < 0; const m = Math.round(Math.abs(v) / 1e4); const eok = Math.floor(m / 1e4), rest = m % 1e4;
    const t = eok > 0 ? eok.toLocaleString("ko-KR") + "억" + (rest ? " " + rest.toLocaleString("ko-KR") + "만" : "") : m.toLocaleString("ko-KR") + "만";
    return (neg ? "−" : "") + t + " 원";
  }
  // 나이를 우리말로(서른아홉)
  function ageWord(n) {
    const tens = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"], ones = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
    if (n >= 100) return "백";
    return tens[Math.floor(n / 10)] + ones[n % 10];
  }
  // 태어난 곳, 사는 시, 최종 학력(씨앗으로 뽑는다. 계산에는 쓰지 않는다)
  function who(s, opt) {
    const P = root.TJ_PLACE;
    if (!P) return { born: "-", live: D.housing.regions[opt.region], liveShort: D.housing.regions[opt.region], edu: "-" };
    const lv = P.live(s.seed, opt.region, s.moves || 0), b = P.born(s.seed);
    return { born: b.name, bornShort: b.short, live: lv.name, liveShort: lv.short, edu: P.EDU_SHORT[P.edu(s.seed, s.startAge)] };
  }
  // 마지막 일
  function lastWork(s, opt) {
    if (s.leftAge) return s.leftAge + "세 퇴직" + (s.rehired ? " 뒤 재취업" : "");
    return JOB[s.lastJob] || JOB[opt.job];
  }
  // 큰 사건 3개(짧은 말). 삶의 모양을 바꾼 일부터 고르고 나이 순으로 늘어놓는다
  const EV = { marry: () => "결혼", kid: (e) => ["첫째", "둘째", "셋째"][e.n - 1], home: () => "첫 집", exit: () => "퇴직", ill: () => "암 진단", loss: () => "실직", move: () => "이직", sold: () => "집을 팖", zero: () => "예금이 바닥남" };
  function bigEvents(s) {
    const order = ["marry", "kid", "home", "exit", "ill", "loss", "sold", "zero", "move"];
    const got = [];
    order.forEach((k) => { const e = (s.ev || []).find((x) => x.k === k); if (e && got.length < 3) got.push({ a: e.a, t: EV[k](e) }); });
    if (got.length < 3) got.push({ a: s.startAge, t: "첫 월급" });
    if (got.length < 3 && s.endAge >= 65) got.push({ a: 65, t: "연금 시작" });
    return got.sort((a, b) => a.a - b.a).map((e) => e.a + "세 " + e.t);
  }
  // 한 줄 묘비명: 그 삶에 실제로 있었던 사실로만, 담담하게. 맞는 문장이 여럿이면 씨앗으로 하나를 고른다
  function epitaph(s) {
    const worked = (s.yr.match(/[wu]/g) || []).length, span = s.endAge - s.startAge + 1;
    const ev = s.ev || [], home = ev.find((e) => e.k === "home"), sold = ev.find((e) => e.k === "sold"), ill = ev.find((e) => e.k === "ill");
    const kids = ["", "하나를", "둘을", "셋을"][Math.min(3, s.kids)];
    const times = ["", "한", "두", "세", "네", "다섯"];
    if (s.endAge < 50) return "통장은 " + span + "년에서 멈췄다. 줄마다 성실했다.";
    const c = [];
    if (s.endAge >= 95) c.push(ageWord(s.endAge) + " 해를 살았고, 통장은 끝까지 곁에 있었다.");
    if (home && !sold && !s.loanLeft) c.push(ageWord(home.a) + "에 집을 샀고, 끝까지 갚았다.");
    if (home && sold) c.push(ageWord(home.a) + "에 산 집을 " + ageWord(sold.a) + "에 내놓았다. 그래도 살았다.");
    if (s.flags.lostJob >= 2) c.push("일자리를 " + times[Math.min(5, s.flags.lostJob)] + " 번 잃었고, 그때마다 다시 일어났다.");
    if (s.flags.moved >= 3) c.push("회사를 " + times[Math.min(5, s.flags.moved)] + " 번 옮겼다. 짐은 늘 상자 두 개였다.");
    if (s.kids > 0) c.push("아이 " + kids + " 키우며 " + worked + "년을 일했다.");
    if (s.leftAge && s.rehired && s.leftAge < 60) c.push(ageWord(s.leftAge) + "에 일터를 떠났고, 다음 날 다시 이력서를 썼다.");
    if (worked >= 40) c.push(worked + "년을 일했다. 쉬는 법은 늦게 배웠다.");
    if (s.endAge >= 85 && s.endAge < 95) c.push("연금을 " + (s.endAge - 64) + "년 받았다. 낸 것보다 오래 살았다.");
    if (ill && s.endAge - ill.a >= 10) c.push("큰 병을 지나고도 " + (s.endAge - ill.a) + "년을 더 살았다.");
    if (s.zeroAge) c.push("모은 돈은 " + ageWord(s.zeroAge) + "에 다했지만, 삶은 이어졌다.");
    if (!home && s.endAge >= 65) c.push("평생 빌려 살았다. 그래도 통장은 남았다.");
    if (!s.married && !s.flags.minus) c.push("혼자 벌어 혼자 살았고, 누구에게도 빚지지 않았다.");
    if (s.married && !s.kids) c.push("둘이 벌어 둘이 살았다. " + worked + "년을 일했다.");
    if (!c.length) c.push(worked + "년을 일했고, " + (span - worked) + "년을 쉬었다.");
    return c[(s.seed >>> 3) % c.length];
  }

  function draw(cv, s, opt) {
    const W = 1080, H = 1350, c = cv.getContext("2d");
    cv.width = W; cv.height = H;
    const f = (px, w, fam) => (w || 400) + " " + px + "px " + (fam || FONT);
    const text = (t, x, y, font, col, align) => { c.font = font; c.fillStyle = col; c.textAlign = align || "left"; c.fillText(t, x, y); };
    const fit = (t, px, w, max, min) => { c.font = f(px, w); while (c.measureText(t).width > max && px > min) { px -= 1; c.font = f(px, w); } return px; };
    c.textBaseline = "alphabetic";
    // 종이
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    c.fillStyle = PAGE; c.fillRect(40, 128, W - 80, H - 128 - 128);
    c.strokeStyle = RULE; c.lineWidth = 2; c.strokeRect(40, 128, W - 80, H - 128 - 128);
    // 맨 위 띠
    c.fillStyle = INK; c.fillRect(0, 0, W, 104);
    text("통장 일대기", 56, 68, f(46, 800), "#fff");
    text("마지막 장", 318, 66, f(26, 500), "#cfe6d6");
    text("기록 No. " + recordNo(s.seed), W - 56, 66, f(30, 600, MONO), "#cfe6d6", "right");

    // 예금주
    const born = 2026 - s.startAge, last = born + s.endAge;
    c.fillStyle = "#fff"; c.fillRect(76, 160, 252, 252);
    c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(76, 160, 252, 252);
    portrait(c, 82, 166, 240, s.seed, s.endAge);
    text("예금주", 368, 204, f(27, 600), GREEN);
    text(opt.name || nameOf(s.seed), 364, 290, f(82, 800), TEXT);
    text(born + " – " + last + "  ·  향년 " + s.endAge + "세", 368, 346, f(33, 600, MONO), TEXT);
    const wh = who(s, opt);
    text(wh.live + "에서 " + (s.endAge - s.startAge + 1) + "년 치 통장을 덮었어요", 368, 396, f(28, 500), INK2);
    // 도장(인주색)
    c.save(); c.translate(952, 226); c.rotate(-0.22); c.strokeStyle = SEAL; c.globalAlpha = 0.82; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, 58, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(0, 0, 48, 0, Math.PI * 2); c.lineWidth = 1.5; c.stroke();
    text("통장", 0, -6, f(28, 800), SEAL, "center"); text("정리", 0, 28, f(28, 800), SEAL, "center"); c.restore();

    // 칸 6개
    const fam = s.married ? (s.kids ? "배우자, 아이 " + s.kids + "명" : "배우자") : (s.kids ? "아이 " + s.kids + "명" : "혼자");
    const has65 = s.snap && s.snap[65] != null;
    const cells = [
      ["태어난 곳", wh.born], ["사는 곳", wh.live], ["최종 학력", wh.edu],
      ["마지막 일", lastWork(s, opt)], ["가족", fam], ["마지막 원인", s.cause === "unspec" ? CAUSE.unspec : (CAUSE[s.cause] || "-") + "(통계 분류)"]
    ];
    const gx = 76, gy = 440, cw = (W - 152) / 3, ch = 104;
    c.strokeStyle = RULE; c.lineWidth = 2;
    cells.forEach((cell, i) => {
      const x = gx + (i % 3) * cw, y = gy + Math.floor(i / 3) * ch;
      c.strokeRect(x, y, cw, ch);
      text(cell[0], x + 18, y + 36, f(22, 500), INK2);
      const px = fit(cell[1], 33, 800, cw - 34, 20);
      text(cell[1], x + 18, y + 82, f(px, 800), TEXT);
    });

    // 인생 격자: 한 칸 = 1년
    const top = 668;
    text("한 해 한 칸", 76, top + 36, f(27, 800), TEXT);
    text(s.startAge + "세부터 " + s.endAge + "세까지", 226, top + 36, f(23, 500), INK2);
    const n = s.yr.length, per = 28, size = 27, gap = 6, rowH = size + 26, x0 = 76 + (W - 152 - (per * (size + gap) - gap)) / 2, y0 = top + 76, rows = Math.ceil(n / per);
    for (let i = 0; i < n; i++) {
      const x = x0 + (i % per) * (size + gap), y = y0 + Math.floor(i / per) * rowH;
      const age = s.startAge + i, lastOne = i === n - 1;
      c.fillStyle = lastOne ? "#101a2b" : STATE[s.yr[i]] || "#c9cfd4";
      c.fillRect(x, y, size, size);
      if (s.yrHome[i] === "1" && !lastOne) { c.fillStyle = "#0b3d2c"; c.fillRect(x, y + size - 6, size, 6); }
      if (s.yrFam[i] === "2" && !lastOne) { c.fillStyle = "#fff"; c.fillRect(x + size - 10, y + 3, 7, 7); }
      if (age % 10 === 0) text(String(age), x + size / 2, y - 6, f(16, 600, MONO), INK2, "center");
    }
    // 범례
    const ly = y0 + rows * rowH + 4;
    let lx = 76;
    const leg = (col, label, kind) => {
      c.fillStyle = col; c.fillRect(lx, ly - 17, 19, 19);
      if (kind === "home") { c.fillStyle = "#c9cfd4"; c.fillRect(lx, ly - 17, 19, 19); c.fillStyle = "#0b3d2c"; c.fillRect(lx, ly - 3, 19, 5); }
      if (kind === "kid") { c.fillStyle = "#2f5f8f"; c.fillRect(lx, ly - 17, 19, 19); c.fillStyle = "#fff"; c.fillRect(lx + 11, ly - 15, 6, 6); }
      text(label, lx + 26, ly, f(21, 500), INK2); c.font = f(21, 500); lx += 26 + c.measureText(label).width + 24;
    };
    leg(STATE.w, "일함"); leg(STATE.u, "일자리를 잃음"); leg(STATE.r, "쉼"); leg(STATE.p, "65세 뒤"); leg("", "집 있음", "home"); leg("", "아이와 삶", "kid"); leg("#101a2b", "마지막 해");

    // 큰 사건 3개와 묘비명: 격자가 짧으면 넉넉하게, 길면 한 줄로
    const by = 1092;                       // 큰 숫자 줄의 기준 높이
    const free = (by - 46) - (ly + 18);    // 범례 아래부터 큰 숫자 위 선까지 남는 높이
    const evs = bigEvents(s), ep = opt.epitaph || epitaph(s);
    let y = ly + 18;
    c.strokeStyle = RULE; c.beginPath(); c.moveTo(76, y); c.lineTo(W - 76, y); c.stroke();
    if (free >= 200) {
      text("큰 사건", 76, y + 42, f(24, 700), GREEN);
      evs.forEach((t, i) => text(t, 186, y + 42 + i * 42, f(31, 800), TEXT));
      const px = fit("“" + ep + "”", 32, 600, W - 152, 22);
      text("“" + ep + "”", 76, by - 46 - 22, f(px, 600), INK);
    } else {
      const line = evs.join("  ·  ");
      text("큰 사건", 76, y + 44, f(23, 700), GREEN);
      const px = fit(line, 31, 800, W - 152 - 108, 20);
      text(line, 184, y + 46, f(px, 800), TEXT);
      const p2 = fit("“" + ep + "”", 30, 600, W - 152, 20);
      text("“" + ep + "”", 76, y + 46 + Math.max(44, Math.min(60, free - 78)), f(p2, 600), INK);
    }

    // 큰 숫자: 같은 조건으로 미리 돌린 판들 가운데 몇 번째인지
    const pl = place(s, opt);
    c.strokeStyle = RULE; c.beginPath(); c.moveTo(76, by - 46); c.lineTo(W - 76, by - 46); c.stroke();
    const cond = s.startAge + "세·" + JOB[opt.job] + "·" + D.housing.regions[opt.region];
    const side = (lines, x) => lines.forEach((t, i) => { const px = fit(t, 23, 500, W - 76 - x, 16); text(t, x, by + 8 + i * 34, f(px, 500), INK2); });
    if (pl && !pl.early) {
      const big = pl.rank.toLocaleString("ko-KR") + "번째";
      text(pl.n.toLocaleString("ko-KR") + "명 중", 76, by + 6, f(30, 700), INK2);
      c.font = f(92, 800); const wNum = c.measureText(big).width;
      text(big, 72, by + 92, f(92, 800), INK);
      const sx = Math.max(76 + wNum + 44, 540);
      text("65세 순자산(집 포함)", sx, by + 6, f(24, 600), INK2);
      const amt = man(s.snap[65]); text(amt, sx, by + 58, f(fit(amt, 46, 800, W - 76 - sx, 28), 800), TEXT);
      const ex = "순자산이 많은 순서 · " + cond; text(ex, sx, by + 94, f(fit(ex, 20, 500, W - 76 - sx, 14), 500), INK2);
    } else {
      const big = (s.endAge - s.startAge + 1) + "년";
      c.font = f(110, 800); const wNum = c.measureText(big).width;
      text(big, 72, by + 88, f(110, 800), INK);
      const sx = 76 + wNum + 36;
      side(["치 통장이에요. 마지막 순자산(집 포함) " + man(s.net)].concat(pl ? ["같은 조건으로 시작한 " + pl.n.toLocaleString("ko-KR") + "개 가운데 65세 전에 멈춘 통장은 " + pl.earlyPct + "%예요.", "조건: " + cond] : []), sx);
    }
    text("한국 공식 통계와 가정으로 만든 가상의 삶이에요. 실제 인물이 아니에요.", 76, 1213, f(18, 500), INK2);

    // 맨 아래 띠
    c.fillStyle = INK; c.fillRect(0, H - 110, W, 110);
    text("너는 어떤 통장으로 살아갈까?", 56, H - 60, f(40, 800), "#fff");
    text(SITE, 58, H - 22, f(24, 600), "#cfe6d6");
  }

  // 스토리용 세로 카드(1080x1920): 통장 표지 위에 기록 카드를 올린다
  function drawStory(cv, s, opt) {
    const tmp = document.createElement("canvas"); draw(tmp, s, opt);
    const W = 1080, H = 1920, c = cv.getContext("2d");
    cv.width = W; cv.height = H;
    const f = (px, w) => (w || 400) + " " + px + "px " + FONT;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#14305a"); g.addColorStop(1, "#0d2243");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(200,162,74,.55)"; c.lineWidth = 3; c.strokeRect(34, 34, W - 68, H - 68);
    c.textBaseline = "alphabetic"; c.textAlign = "left";
    c.fillStyle = "#c8a24a"; c.font = f(34, 500); c.fillText("보통예금 · 한 사람의 통장", 84, 150);
    c.fillStyle = "#e6cf8a"; c.font = f(96, 800); c.fillText("통장 일대기", 80, 268);
    // 카드 본문(위 띠와 아래 띠는 빼고 가져온다)
    const sy = 104, sh = 1350 - 104 - 110, dw = 960, dh = Math.round(sh * dw / 1080), dx = (W - dw) / 2, dy = 330;
    c.fillStyle = "#f4efe3"; c.fillRect(dx - 10, dy - 10, dw + 20, dh + 20);
    c.drawImage(tmp, 0, sy, 1080, sh, dx, dy, dw, dh);
    c.fillStyle = "#fff"; c.font = f(62, 800); c.fillText("너는 어떤 통장으로", 84, dy + dh + 150);
    c.fillText("살아갈까?", 84, dy + dh + 232);
    c.fillStyle = "#e6cf8a"; c.font = f(34, 600); c.fillText(SITE, 84, dy + dh + 310);
  }

  // 친구와 나란히 보는 비교 카드(1080x1350). a = 내 통장, b = 친구 통장. 각각 { s, opt }
  function drawCompare(cv, a, b) {
    const W = 1080, H = 1350, c = cv.getContext("2d");
    cv.width = W; cv.height = H;
    const f = (px, w, fam) => (w || 400) + " " + px + "px " + (fam || FONT);
    const text = (t, x, y, font, col, align) => { c.font = font; c.fillStyle = col; c.textAlign = align || "left"; c.fillText(t, x, y); };
    const fit = (t, px, w, max, min) => { c.font = f(px, w); while (c.measureText(t).width > max && px > min) { px -= 1; c.font = f(px, w); } return px; };
    c.textBaseline = "alphabetic";
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    c.fillStyle = INK; c.fillRect(0, 0, W, 104);
    text("통장 일대기", 56, 68, f(46, 800), "#fff"); text("나란히 본 두 통장", 318, 66, f(26, 500), "#cfe6d6");
    const col = (o, x, label) => {
      const s = o.s, opt = o.opt, w = 462;
      c.fillStyle = PAGE; c.fillRect(x, 134, w, 1076); c.strokeStyle = RULE; c.lineWidth = 2; c.strokeRect(x, 134, w, 1076);
      text(label, x + 24, 178, f(24, 700), GREEN);
      c.fillStyle = "#fff"; c.fillRect(x + 24, 196, 172, 172); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(x + 24, 196, 172, 172);
      portrait(c, x + 30, 202, 160, s.seed, s.endAge);
      const nm = opt.name || nameOf(s.seed);
      text(nm, x + 214, 268, f(fit(nm, 52, 800, w - 236, 30), 800), TEXT);
      text(s.startAge + "세 → " + s.endAge + "세", x + 214, 316, f(28, 600, MONO), TEXT);
      { const t = who(s, opt).live + " · " + s.startAge + "세 " + JOB[opt.job]; text(t, x + 214, 354, f(fit(t, 22, 500, w - 236, 15), 500), INK2); }
      const has65 = s.snap && s.snap[65] != null, pl = place(s, opt);
      const rows = [[has65 ? "65세 순자산" : "마지막 순자산", man(has65 ? s.snap[65] : s.net)], ["같은 조건 순위", pl && !pl.early ? pl.n.toLocaleString("ko-KR") + "명 중 " + pl.rank.toLocaleString("ko-KR") + "번째" : "65세 전에 멈춤"],
        ["가족", s.married ? (s.kids ? "배우자, 아이 " + s.kids + "명" : "배우자") : "혼자"], ["마지막 일", lastWork(s, opt)], ["평생 월급(세전)", man(s.gross)], ["국민연금(월)", s.npsMonthly ? man(s.npsMonthly) : "-"]];
      rows.forEach((r, i) => {
        const y = 420 + i * 86;
        c.strokeStyle = RULE; c.beginPath(); c.moveTo(x + 24, y - 34); c.lineTo(x + w - 24, y - 34); c.stroke();
        text(r[0], x + 24, y, f(22, 500), INK2);
        text(r[1], x + w - 24, y + 36, f(fit(r[1], 32, 800, w - 48, 20), 800), i < 2 ? INK : TEXT, "right");
      });
      // 한 해 한 칸(작게)
      const n = s.yr.length, per = 21, size = 16, gap = 4, y0 = 950;
      for (let i = 0; i < n; i++) { c.fillStyle = i === n - 1 ? "#101a2b" : STATE[s.yr[i]] || "#c9cfd4"; c.fillRect(x + 24 + (i % per) * (size + gap), y0 + Math.floor(i / per) * (size + gap), size, size); }
      const ev = bigEvents(s);
      ev.forEach((t, i) => text(t, x + 24, 1066 + i * 34, f(24, 700), TEXT));
      const ep = "“" + epitaph(s) + "”";
      text(ep, x + 24, 1186, f(fit(ep, 22, 600, w - 48, 14), 600), INK);
    };
    col(a, 56, "내 통장"); col(b, 562, "친구 통장");
    c.fillStyle = INK; c.fillRect(0, H - 110, W, 110);
    text("너는 어떤 통장으로 살아갈까?", 56, H - 60, f(40, 800), "#fff"); text(SITE, 58, H - 22, f(24, 600), "#cfe6d6");
  }

  // 분포 막대: 표의 자리값(p)으로 20칸 히스토그램을 만든다. 돌려주는 값은 { bins:[비율], lo, hi, mine:칸 번호 }
  function histogram(row, value) {
    const p = row.p, lo = p[0], hi = p[p.length - 1], n = 20, bins = new Array(n).fill(0);
    p.forEach((v) => { const i = Math.min(n - 1, Math.max(0, Math.floor((v - lo) / Math.max(1, hi - lo) * n))); bins[i]++; });
    const mx = Math.max.apply(null, bins);
    const mine = value == null ? -1 : Math.min(n - 1, Math.max(0, Math.floor((value / 1e4 - lo) / Math.max(1, hi - lo) * n)));
    return { bins: bins.map((b) => b / mx), lo: lo, hi: hi, mine: mine };
  }

  root.TJ_CARD = { drawStory: drawStory, drawCompare: drawCompare, histogram: histogram, man: man, JOB: JOB, STATE: STATE, draw: draw, nameOf: nameOf, recordNo: recordNo, portrait: portrait, place: place, epitaph: epitaph, bigEvents: bigEvents, lastWork: lastWork, CAUSE: CAUSE, ageWord: ageWord, who: who };
})(typeof window !== "undefined" ? window : globalThis);
