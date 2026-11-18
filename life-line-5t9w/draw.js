// 인생 노선도 — 노선 그리기.
// 규칙: 시간은 위→아래, 선은 세로와 45도만, 환승역 앞에서 옆 칸으로 꺾이고 색이 바뀜, 지금은 현재역, 그 뒤는 점선.
// 한 사람: 역 이름을 노선 양옆에 번갈아 둔다. 두 사람: 내 역은 왼쪽, 옆 노선의 역은 오른쪽, 만난 역은 두 선을 잇는 긴 알약.
// 색 이름과 색 값은 우리가 정한 것이고, 어느 운영 기관의 색·로고·번호 표기도 쓰지 않는다.
(function () {
  "use strict";
  const PAL = [["감", "#E8622C"], ["솔", "#1F8A5B"], ["쪽", "#2B5FD9"], ["자두", "#8A3FA0"], ["개나리", "#F2B705"], ["복숭아", "#F27A9B"], ["먹", "#3C444E"]];
  const SIZES = { card: [1080, 1350], phone: [1170, 2535], a4: [2480, 3508], square: [1080, 1080], hero: [1080, 1240] };
  const FB = '"LN Sans", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';   // 굵은 글자(같이 올린 글꼴)
  const FR = '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "LN Sans", sans-serif';   // 작은 글자(휴대폰 기본 글꼴)
  const LANE = 1.9, UNIT = 3.0, SP = 1.3, DG = 1.5, R0 = 0.78;   // 칸 너비, 역 하나의 기본 높이, 나란히 달릴 때 선 사이, 따로 달릴 때 가운데 틈의 절반, 역 반지름(모두 크기 단위)
  const okY = (y) => +y >= 1900 && +y <= 2150;
  const txt = (s) => String(s == null ? "" : s).trim();
  const lname = (n) => { n = txt(n); return n && !/선$/.test(n) ? n + "선" : n; };   // 노선 이름 끝이 '선'이 아니면 붙인다
  const josa = (w) => { const k = w.charCodeAt(w.length - 1); return k >= 0xAC00 && k <= 0xD7A3 && (k - 0xAC00) % 28 ? "과" : "와"; };

  // 한 사람의 역 목록(출발, 지나온 역, 앞날)
  function person(q, nowY) {
    const ev = (q.ev || []).filter((e) => e && e.n && okY(e.y)).map((e, i) => ({ y: +e.y, n: txt(e.n), t: !!e.t, i: i })).filter((e) => e.n).sort((a, b) => a.y - b.y || a.i - b.i);
    const by = +q.by || (ev.length ? ev[0].y : nowY), st = [{ y: by, k: "start" }];
    ev.forEach((e) => { if (e.y <= nowY && e.y >= by) st.push({ y: e.y, n: e.n, k: e.t ? "xfer" : "stop" }); });
    ev.forEach((e) => { if (e.y > nowY) st.push({ y: e.y, n: e.n, k: "fut" }); });
    return { by: by, bp: txt(q.bp), name: lname(q.name), st: st };
  }

  // 모델 → 줄(row) 목록. 줄마다 역 글자(items)와 선들의 가로 자리(x: 0 나, 1 옆 노선, 2~ 아이 노선)
  function build(m, nowY) {
    const A = person(m, nowY), hasB = !!(m.p && (+m.p.by || (m.p.ev || []).some((e) => e && e.n && okY(e.y)))), B = hasB ? person(m.p, nowY) : null;
    const kids = (m.kid || []).filter((k) => k && okY(k.y) && +k.y <= nowY && +k.y >= A.by).map((k) => ({ y: +k.y, n: lname(k.n) })).sort((a, b) => a.y - b.y).slice(0, 3);
    const meets = B ? (m.meet || []).filter((k) => k && okY(k.y) && +k.y <= nowY && +k.y >= Math.max(A.by, B.by)).map((k) => ({ y: +k.y, n: txt(k.n) || "만난 날" })).sort((a, b) => a.y - b.y).slice(0, 3) : [];
    const multi = !!B || kids.length > 0, en = [];
    [A, B].forEach((P, w) => {
      if (!P) return;
      P.st.forEach((s) => {
        const e = { y: s.y, k: s.k, who: w, ph: s.k === "fut" ? 2 : 0, pri: s.k === "start" ? 0 : 1 };
        if (s.k !== "start") e.n = s.n;
        else if (B) { e.n = P.name || (w ? "옆 노선" : "나의 선"); e.sub = P.by + (P.bp ? " " + P.bp : "") + " 출발"; }
        else e.n = P.bp ? P.bp + "에서 출발" : "출발";
        en.push(e);
      });
    });
    meets.forEach((k) => en.push({ y: k.y, k: "meet", n: k.n, ph: 0, pri: 2 }));
    kids.forEach((k, j) => en.push({ y: k.y, k: "kid", n: (k.n || "아이 노선") + " 출발", ki: j, ph: 0, pri: 3 }));
    if (nowY >= A.by) en.push({ y: nowY, k: "now", ph: 1, pri: 0 });
    en.forEach((e, i) => { e.i = i; });
    en.sort((a, b) => a.ph - b.ph || a.y - b.y || a.pri - b.pri || a.i - b.i);
    const rows = [];
    en.forEach((e) => {
      const r = rows[rows.length - 1];
      if (e.who != null && r && r.pair && r.y === e.y && r.ph === e.ph && r.items[0].who !== e.who) { r.items.push(e); r.pair = false; return; }   // 같은 해의 두 사람 역은 한 줄에
      rows.push({ y: e.y, ph: e.ph, items: [e], pair: e.who != null, meet: e.k === "meet", now: e.k === "now", kid: e.k === "kid" ? e.ki : -1 });
    });
    let tgFrom = Infinity;
    if (B && m.tg) rows.forEach((r, i) => { if (r.meet) tgFrom = i; });
    const first = (f) => rows.findIndex(f), nowI = first((r) => r.now);
    const span = (w) => { const s = first((r) => r.items.some((e) => e.who === w && e.k === "start")); let e = nowI; rows.forEach((r, i) => { if (r.items.some((it) => it.who === w)) e = Math.max(e, i); }); return [s, Math.max(e, s)]; };
    const sp = [span(0), B ? span(1) : [1, 0]];
    kids.forEach((k, j) => sp.push([first((r) => r.kid === j), nowI]));
    const MAXL = multi ? 2 : 3;
    let la = 0, lb = 0, da = 1, db = 1, cx = 0, dc = 1, sa = 0, sb = 0, nk = 0;
    rows.forEach((r, i) => {
      const tog = i >= tgFrom, ax = r.items.some((e) => e.who === 0 && e.k === "xfer"), bx = r.items.some((e) => e.who === 1 && e.k === "xfer");
      if (ax) sa++; if (bx) sb++;
      if (tog) { if (ax || bx) { if (cx + dc > 1 || cx + dc < -1) dc = -dc; cx += dc; } }
      else {
        if (ax) { if (la + da > MAXL || la + da < 0) da = -da; la += da; }
        if (bx) { if (lb + db > MAXL || lb + db < 0) db = -db; lb += db; }
      }
      if (r.meet) { la = 0; lb = 0; da = 1; db = 1; }
      if (r.kid >= 0) nk++;
      const x = [];
      if (!B) x[0] = la * LANE;
      else if (tog || r.meet) { x[0] = cx * LANE - (1 + nk) / 2 * SP; x[1] = x[0] + (1 + nk) * SP; }
      else { x[0] = -(DG + la * LANE + nk * SP); x[1] = DG + lb * LANE; }
      for (let j = 0; j < nk; j++) x[2 + j] = x[0] + (j + 1) * SP;
      sp.forEach((s, li) => { if (i < s[0] || i > s[1]) x[li] = undefined; });
      r.x = x; r.seg = [sa, sb]; r.tog = tog;
      if (r.now) { r.items = [{ k: "now", who: 0, n: "지금", y: r.y }]; if (B && !tog && x[1] !== undefined) r.items.push({ k: "now", who: 1, n: "지금", y: r.y }); }
    });
    const past = A.st.filter((s) => s.k !== "fut");
    const lastMeet = meets.length ? meets[meets.length - 1].y : 0;
    return { rows: rows, A: A, B: B, kids: kids, meets: meets, multi: multi, nowI: nowI, sp: sp, by: A.by, stops: past.length, xfers: past.filter((s) => s.k === "xfer").length, years: Math.max(nowY - A.by, 0), tgYears: B && m.tg && lastMeet ? nowY - lastMeet : 0 };
  }

  function summary(m, b) {
    const a = [];
    if (b.B) {
      if (b.meets.length) a.push("만난 역 " + b.meets.length + "곳");
      if (b.tgYears > 0) a.push("같이 달린 지 " + b.tgYears + "년");
      if (b.kids.length) a.push("아이 노선 " + b.kids.length + "개");
      if (!a.length) a.push("두 노선을 한 장에");
      return a.join("  ·  ");
    }
    a.push(b.by + (b.A.bp ? " " + b.A.bp : "") + " 출발", "역 " + b.stops + "개");
    if (b.xfers) a.push("환승 " + b.xfers + "번");
    if (b.years > 0) a.push(b.years + "년째 운행 중");
    return a.join("  ·  ");
  }

  // 긴 역 이름은 띄어 쓴 곳에서 두 줄로 나눈다
  function wrap(n, at) {
    if (n.length <= at) return [n];
    const mid = n.length / 2; let best = -1;
    for (let i = 1; i < n.length - 1; i++) if (n[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    if (best < 0) { if (n.length < 12) return [n]; best = Math.ceil(mid); return [n.slice(0, best), n.slice(best)]; }   // 띄어 쓴 곳이 없는 긴 이름은 가운데에서
    return [n.slice(0, best).replace(/[\s·]+$/, ""), n.slice(best + 1).replace(/^[·\s]+/, "")];
  }

  function draw(cv, m, opt) {
    opt = opt || {};
    const kind = opt.size || "card", size = SIZES[kind], W = size[0], H = size[1];
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), dark = !!m.dark, nowY = opt.now || new Date().getFullYear();
    const BG = dark ? "#141820" : "#F7F8F5", INK = dark ? "#F0F2F5" : "#1E262C", SUB = dark ? "#969EAA" : "#6E7882";
    c.fillStyle = BG; c.fillRect(0, 0, W, H);
    const b = build(m, nowY), multi = b.multi, B = b.B;
    const hex = (i) => { const k = PAL[((i % PAL.length) + PAL.length) % PAL.length]; return dark && k[0] === "먹" ? "#C4CAD3" : k[1]; };
    const c0 = [+m.c || 0, B ? (m.p.c == null ? (+m.c || 0) + 2 : +m.p.c) : 0];
    const kidC = [5, 4, 1, 3, 2, 0, 6].filter((i) => i !== c0[0] % 7 && (!B || i !== c0[1] % 7));
    const col = (li, seg) => (li > 1 ? hex(kidC[li - 2]) : hex(c0[li] + seg));
    let rows = b.rows, skipped = 0;
    const hero = kind === "hero", phone = kind === "phone", inl = phone || (multi && (kind === "square" || kind === "card"));   // 배경화면(과 두 사람의 작은 판)은 해를 이름 옆 한 줄에 작게 붙인다
    const u0 = W * (kind === "a4" ? 0.0172 : kind === "square" ? 0.0185 : 0.0215);
    const titleTop = phone ? H * 0.25 : hero ? 0 : u0 * 2.6;
    const top = hero ? u0 * 2.4 : titleTop + u0 * (phone ? 8.3 : 9.0), bottom = phone ? H * 0.09 : hero ? u0 * 2.6 : u0 * 7.4;
    const FBold = (px) => "800 " + px + "px " + FB, FReg = (px) => "400 " + px + "px " + FR;
    const margin = W * (phone ? 0.045 : 0.07), avail = H - top - bottom;
    const NOWT = "지금 여기", YS = inl ? 0.8 : 0.92;

    // 역마다: 글자 줄, 놓일 쪽, 필요한 너비와 높이
    const prep = () => {
      rows.forEach((r, i) => {
        const nx = rows[i + 1]; r.h = { L: 0, R: 0 };
        r.items.forEach((s) => {
          s.lines = wrap(s.n, WR); s.yt = s.sub || String(s.y) + (s.k === "xfer" ? "  환승" : s.k === "meet" ? "  만난 역" : "");
          if (phone && multi && (s.k === "stop" || s.k === "fut")) s.yt = "";   // 두 사람 배경화면은 보통 역의 해를 빼고 글자를 키운다(해는 액자용에서)
          if (!multi) { s.side = r.seg[0] % 2 === 0 ? "R" : "L"; if (nx && nx.x[0] !== r.x[0]) s.side = nx.x[0] > r.x[0] ? "L" : "R"; }   // 선이 꺾여 나가는 쪽은 피한다
          else s.side = s.who === 1 ? "R" : s.who === 0 ? "L" : B ? "L" : "R";
          s.gapU = R0 * (s.k === "start" ? (multi ? 2.7 : 3.5) : s.k === "now" ? (multi ? 2.6 : 3.1) : s.k === "meet" ? 2.7 : 2.3);
          c.font = FBold(100); const lw = s.lines.map((l) => c.measureText(l).width * 1.36 / 100);
          c.font = FReg(100); let yw = c.measureText(s.yt).width * YS / 100;
          if (s.k === "now") { c.font = FBold(100); yw += 0.7 + c.measureText(NOWT).width * 0.9 / 100 + 1.2; }
          if (inl) { const last = lw.pop(); s.wU = Math.max.apply(null, lw.concat([last + (s.yt ? 0.55 + yw : 0)])); s.hU = s.lines.length * 1.5 + (phone && multi ? 0.2 : 0.45); }
          else { s.wU = Math.max.apply(null, lw.concat([yw])); s.hU = s.lines.length * 1.5 + 1.25; }
          r.h[s.side] = Math.max(r.h[s.side], s.hU);
        });
        const xs = r.x.filter((v) => v !== undefined); r.lo = Math.min.apply(null, xs); r.hi = Math.max.apply(null, xs);
      });
    };
    let yf = 0.2, WR = 9, gaps, G, u, step, minL, spanU;
    const measure = () => {
      prep(); gaps = [0];
      for (let i = 1; i < rows.length; i++) {
        const p = rows[i - 1], s = rows[i];
        let g = (phone && multi ? 0.6 : multi ? 0.72 : inl ? 0.82 : 1) + Math.min(Math.max(s.y - p.y, 0), 6) * yf;
        if (p.h.L && s.h.L) g = Math.max(g, (p.h.L + s.h.L) / 2 / UNIT + 0.12);
        if (p.h.R && s.h.R) g = Math.max(g, (p.h.R + s.h.R) / 2 / UNIT + 0.12);
        let mv = 0; s.x.forEach((v, li) => { if (v !== undefined && p.x[li] !== undefined) mv = Math.max(mv, Math.abs(v - p.x[li])); });
        if (mv) g = Math.max(g, (R0 * 1.7 + mv + (mv < 1 ? 0.9 : phone && multi ? 1.0 : 1.5)) / UNIT);
        if (p.now) g = Math.max(g, 1.4);
        if (s.now) g = Math.max(g, 1.2);
        if (s.skip) g = Math.max(g, 1.7);
        gaps.push(g);
      }
      G = gaps.reduce((a, v) => a + v, 0) || 1;
      minL = Infinity; let maxR = -Infinity;
      rows.forEach((r) => {
        minL = Math.min(minL, r.lo - R0 * 2.4); maxR = Math.max(maxR, r.hi + R0 * 2.4);
        r.items.forEach((s) => { if (s.side === "R") maxR = Math.max(maxR, r.hi + s.gapU + s.wU); else minL = Math.min(minL, r.lo - s.gapU - s.wU); });
      });
      spanU = maxR - minL;
      const cap = phone ? 2.7 : kind === "a4" && multi ? 2.2 : 1.7;
      u = Math.max(Math.min(avail / G / UNIT, (W - margin * 2) / spanU, u0 * cap), u0 * 0.4);
      step = Math.min(avail / G, u * UNIT * 1.3);
    };
    const fit = (at) => { WR = at; yf = 0.2; measure(); if (u < u0 * (phone ? 1.6 : 1.15)) { yf = 0.05; measure(); } return u; };
    fit(9);
    if (phone || multi) {   // 좁은 판은 이름을 두 줄로 더 자주 나눠 보고, 글자가 더 커지는 쪽을 고른다
      let best = 9, bu = u;
      [6, 4].forEach((at) => { const v = fit(at); if (v > bu * 1.04) { best = at; bu = v; } });
      fit(best);
    }
    if (!multi && (kind === "square" || kind === "card")) {   // 정사각·미리 보기 판은 역이 많으면 앞 구간을 줄인다
      while (u < u0 * 0.74 && rows.length > 7) {
        rows = [rows[0]].concat(rows.slice(2)); skipped++;
        rows[0].x = [rows[1].x[0]]; rows[0].seg = rows[1].seg.slice(); rows[1].skip = skipped;
        const mn = rows.reduce((a, r) => Math.min(a, r.x[0]), 9); rows.forEach((r) => { r.x = [r.x[0] - mn]; });
        measure();
      }
    }
    const x0 = (W - spanU * u) / 2 - minL * u, lw = u * 0.9, r = u * R0, X = (v) => x0 + v * u;
    let y = top + (hero ? 0 : Math.max((avail - G * step) * (phone ? 0.3 : 0.42), 0));
    rows.forEach((s, i) => { y += gaps[i] * step; s.py = y; });

    // 선(아이 노선, 옆 노선, 내 노선 순서로)
    const iNow = rows.findIndex((s) => s.now), nL = 2 + b.kids.length, order = [];
    for (let li = nL - 1; li >= 0; li--) order.push(li);
    c.lineJoin = "round";
    order.forEach((li) => {
      const w = li > 1 ? lw * 0.72 : lw;
      for (let i = 1; i < rows.length; i++) {
        const a = rows[i - 1], q = rows[i]; if (a.x[li] === undefined || q.x[li] === undefined) continue;
        const xa = X(a.x[li]), xq = X(q.x[li]), dashed = (iNow >= 0 && i - 1 >= iNow) || !!q.skip;
        c.beginPath(); c.moveTo(xa, a.py);
        if (xa !== xq) { const dx = Math.abs(xq - xa), ya = q.meet ? Math.max(a.py + r * 1.7, q.py - r * 1.9 - dx) : a.py + r * 1.7; c.lineTo(xa, ya); c.lineTo(xq, Math.min(ya + dx, q.py)); }
        c.lineTo(xq, q.py); c.strokeStyle = col(li, a.seg[li]);
        if (dashed) { c.lineWidth = w * 0.7; c.lineCap = "butt"; c.setLineDash([lw * 0.95, lw * 0.95]); c.lineDashOffset = -r * 2.2; }
        else { c.lineWidth = w; c.lineCap = "round"; c.setLineDash([]); }
        c.stroke();
      }
    });
    c.setLineDash([]);
    // 역
    const ring = (x, yy, R, fill, stroke, w) => { c.beginPath(); c.arc(x, yy, R, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = w; c.strokeStyle = stroke; c.stroke(); } };
    const pill = (x, yy, w, h, fill, stroke, sw) => { const rr = h / 2; c.beginPath(); c.moveTo(x + rr, yy); c.arcTo(x + w, yy, x + w, yy + h, rr); c.arcTo(x + w, yy + h, x, yy + h, rr); c.arcTo(x, yy + h, x, yy, rr); c.arcTo(x, yy, x + w, yy, rr); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = sw; c.strokeStyle = stroke; c.stroke(); } };
    // 여러 선을 가로로 잇는 알약(만난 역, 같이 있는 지금)
    const joint = (row, lis, big) => {
      const xs = lis.map((li) => X(row.x[li])), lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs), hh = r * (big ? 1.5 : 1.25);
      pill(lo - hh, row.py - hh, hi - lo + hh * 2, hh * 2, BG, INK, r * 0.4);
      lis.forEach((li, j) => ring(xs[j], row.py, r * (big ? 0.78 : 0.56), col(li, row.seg[li] || 0)));
    };
    rows.forEach((row) => {
      const alive = []; row.x.forEach((v, li) => { if (v !== undefined) alive.push(li); });
      if (row.meet) { joint(row, alive, false); return; }
      if (row.now) {
        const groups = !B ? [alive] : row.tog ? [alive] : [alive.filter((li) => li !== 1), alive.filter((li) => li === 1)];
        groups.forEach((g) => {
          if (g.length > 1) joint(row, g, true);
          else if (g.length) { const k = col(g[0], row.seg[g[0]]), x = X(row.x[g[0]]); ring(x, row.py, r * (multi ? 1.6 : 1.9), null, k, r * 0.22); ring(x, row.py, r * (multi ? 1.05 : 1.2), k, BG, r * 0.3); }
        });
        return;
      }
      row.items.forEach((s) => {
        const li = s.k === "kid" ? 2 + s.ki : s.who, k = col(li, row.seg[li] || 0), x = X(row.x[li]), yy = row.py;
        if (s.k === "start") { const hw = r * (multi ? 1.5 : 2.2); pill(x - hw, yy - r * 0.72, hw * 2, r * 1.44, k); }
        else if (s.k === "kid") ring(x, yy, r * 0.82, k, BG, r * 0.3);
        else if (s.k === "xfer") { ring(x, yy, r * 1.1, BG, INK, r * 0.4); ring(x, yy, r * 0.52, k); }
        else if (s.k === "fut") ring(x, yy, r * 0.82, BG, k, r * 0.36);
        else ring(x, yy, r * 0.8, BG, k, r * 0.42);
      });
    });
    // 글자
    c.textBaseline = "middle";
    rows.forEach((row) => row.items.forEach((s) => {
      const R = s.side === "R", x = X(R ? row.hi : row.lo) + (R ? 1 : -1) * s.gapU * u, nl = s.lines.length, li = s.who == null ? 0 : s.who;
      let ty = row.py - (nl * 1.5 + (inl ? 0 : 1.1)) * u / 2 + 0.75 * u;
      c.textAlign = R ? "left" : "right"; c.font = FBold(u * 1.36); c.fillStyle = INK;
      const tagW = () => { c.font = FBold(u * 0.9); return c.measureText(NOWT).width + u * 1.2; };
      const tag = (px, yl) => { pill(px, yl - u * 0.76, tagW(), u * 1.52, col(li, row.seg[li])); c.font = FBold(u * 0.9); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(NOWT, px + u * 0.6, yl + u * 0.04); };
      if (!inl) {
        s.lines.forEach((l) => { c.fillText(l, x, ty); ty += 1.5 * u; });
        const yl = ty - 0.15 * u; c.font = FReg(u * 0.92); c.fillStyle = SUB; c.fillText(s.yt, x, yl);
        if (s.k === "now") { const ywd = c.measureText(s.yt).width, tw = tagW(); tag(R ? x + ywd + u * 0.7 : x - ywd - u * 0.7 - tw, yl); }
        return;
      }
      for (let i = 0; i < nl - 1; i++) { c.fillText(s.lines[i], x, ty); ty += 1.5 * u; }
      const last = s.lines[nl - 1], nw = c.measureText(last).width; c.font = FReg(u * YS); const ywd = c.measureText(s.yt).width, tw = s.k === "now" ? tagW() : 0;
      const tot = nw + (s.yt ? u * 0.55 + ywd : 0) + (tw ? u * 0.7 + tw : 0); let sx = R ? x : x - tot;
      c.textAlign = "left"; c.font = FBold(u * 1.36); c.fillStyle = INK; c.fillText(last, sx, ty); sx += nw + u * 0.55;
      c.font = FReg(u * YS); c.fillStyle = SUB; c.fillText(s.yt, sx, ty + u * 0.16); sx += ywd + u * 0.7;
      if (tw) tag(sx, ty + u * 0.02);
    }));
    rows.forEach((s, i) => {
      if (!s.skip) return; const p0 = rows[i - 1], R = s.items[0].side !== "R";
      c.textAlign = R ? "left" : "right"; c.font = FReg(u * 0.92); c.fillStyle = SUB; c.fillText("역 " + s.skip + "개 생략", X(s.x[0]) + (R ? 1 : -1) * r * 2.3, (p0.py + s.py) / 2);
    });
    b.u = u / u0;
    if (hero) return b;
    if (!phone) {   // 범례
      const items = [["역", "stop"], ["환승역(길이 바뀐 날)", "xfer"]].concat(B ? [["만난 역", "meet"]] : [], [["지금", "now"], ["앞날", "fut"]]), lu = u0 * 0.86, k0 = col(0, 0);
      const iw = (it) => lu * (it[1] === "meet" ? 3.2 : 2.2);
      c.font = FReg(lu); let tw = 0; items.forEach((it) => { tw += iw(it) + c.measureText(it[0]).width + lu * 2.2; }); tw -= lu * 2.2;
      let lx = (W - tw) / 2; const ly = H - u0 * 4.2, rr = lu * 0.62;
      items.forEach((it) => {
        const cx = lx + rr;
        if (it[1] === "xfer") { ring(cx, ly, rr * 1.1, BG, INK, rr * 0.4); ring(cx, ly, rr * 0.5, k0); }
        else if (it[1] === "meet") { pill(lx, ly - rr * 1.1, rr * 3.6, rr * 2.2, BG, INK, rr * 0.4); ring(lx + rr * 1.1, ly, rr * 0.45, k0); ring(lx + rr * 2.5, ly, rr * 0.45, col(1, 0)); }
        else if (it[1] === "now") ring(cx, ly, rr * 1.1, k0);
        else if (it[1] === "fut") { c.setLineDash([rr * 0.7, rr * 0.5]); ring(cx, ly, rr, BG, k0, rr * 0.36); c.setLineDash([]); }
        else ring(cx, ly, rr, BG, k0, rr * 0.42);
        c.font = FReg(lu); c.fillStyle = SUB; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(it[0], lx + iw(it) - lu * 0.2, ly + lu * 0.04);
        lx += iw(it) + c.measureText(it[0]).width + lu * 2.2;
      });
    }
    // 제목 줄과 아래 이름
    c.textAlign = "center"; c.textBaseline = "top";
    const nA = b.A.name || "나의 선", name = B ? nA + josa(nA) + " " + (B.name || "옆 노선") : nA;
    let ts = u0 * 3.3; c.font = FBold(ts);
    while (c.measureText(name).width > W - margin * 2 && ts > u0) { ts *= 0.92; c.font = FBold(ts); }
    c.fillStyle = INK; c.fillText(name, W / 2, titleTop);
    let ss = u0 * 1.08; c.font = FReg(ss); const sum = summary(m, b);
    while (c.measureText(sum).width > W - margin * 2 && ss > u0 * 0.5) { ss *= 0.94; c.font = FReg(ss); }
    c.fillStyle = SUB; c.fillText(sum, W / 2, titleTop + u0 * 4.5);
    c.textBaseline = "middle"; c.font = FReg(u0 * 0.84); c.fillStyle = SUB;
    c.fillText("인생 노선도", W / 2, H - (phone ? H * 0.045 : u0 * 2.4));
    return b;
  }

  window.LNDraw = { draw: draw, build: build, PAL: PAL, SIZES: SIZES, FONT: FB, josa: josa, lname: lname };
})();
