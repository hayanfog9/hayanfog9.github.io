// 인생 노선도 — 화면과 입력. 서버가 없고, 쓴 내용은 이 브라우저 안에서만 쓴다.
// [주소로 보내기]는 내용을 주소의 # 뒤에 담는다(# 뒤는 웹 서버로 가지 않는 부분).
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id), D = window.LNDraw, NOW = new Date().getFullYear(), KEY = "lifeline_v1", MAXURL = 1800;
  // 역 단추: [단추 글자, 역 이름, 환승 여부, 흔한 나이(없으면 null)]. 나이는 우리가 정한 가정(초등 7, 중 13, 고 16, 대학 19, 입대 21, 전역 23, 첫 출근 25)이고 사용자가 고쳐 쓴다.
  // 넷째 칸이 "앞"이면 앞날의 역(올해 + 2년), "아이선"이면 역 하나와 같은 해의 아이 노선 한 줄을 같이 만든다.
  const KINDS = [
    ["학교", '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5v4.5c3 2.6 9 2.6 12 0v-4.5"/>', [["초등학교 입학", "초등학교 입학", 0, 7], ["중학교 입학", "중학교 입학", 0, 13], ["고등학교 입학", "고등학교 입학", 0, 16], ["대학 입학", "대학 입학", 0, 19], ["전학", "전학", 1, null], ["졸업", "졸업", 0, null]]],
    ["이사", '<path d="M3 11l9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>', [["이사", "이사", 1, null], ["독립", "독립해서 나옴", 1, null], ["다른 도시로", "다른 도시로 이사", 1, null]]],
    ["일", '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M9 7.5V4.5h6v3"/><path d="M3 13h18"/>', [["첫 출근", "첫 출근", 0, 25], ["이직", "회사를 옮김", 1, null], ["입대", "입대", 0, 21], ["전역", "전역", 0, 23], ["내 일 시작", "내 일을 시작", 1, null], ["쉬어 감", "잠시 쉬어 감", 0, null]]],
    ["사랑", '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.500 15.400 12 20 12 20z"/>', [["처음 만남", "처음 만난 날", 0, null], ["결혼", "결혼", 0, null]]],
    ["아이", '<circle cx="12" cy="13" r="7"/><path d="M9.2 14.200c1.500 1.800 4.100 1.800 5.600 0"/><path d="M12 6c0-2 2-2.200 2-3.500"/>', [["아이가 태어남", "아이가 태어남", 0, "아이선"], ["아이 입학", "아이 초등학교 입학", 0, null]]],
    ["꿈", '<path d="M12 3.200l2.600 5.500 6 .8-4.400 4.200 1.100 6L12 16.700l-5.300 3 1.100-6-4.400-4.200 6-.8z"/>', [["한 달 살기", "한 달 살기", 0, "앞"], ["내 집", "내 집 마련", 0, "앞"], ["내 일", "내 가게 열기", 0, "앞"], ["직접 쓰기", "", 0, "앞"]]],
    ["직접", '<path d="M4 20l4.200-1L19.500 7.700l-3.200-3.200L5 15.800z"/><path d="M14 6.800l3.200 3.200"/>', [["직접 쓰기", "", 0, null]]]
  ];
  // 예시(지어낸 사람)
  const EX = [
    { name: "서연선", by: 1994, bp: "대구", c: 4, dark: false, ev: [[2001, "초등학교 입학", 0], [2005, "서울로 전학", 1], [2010, "고등학교 입학", 0], [2013, "대학 입학 · 자취 시작", 1], [2017, "첫 출근", 0], [2020, "회사를 옮김", 1], [2023, "첫 내 방 계약", 0], [2028, "제주 한 달 살기", 0], [2032, "내 가게 열기", 0]] },
    { name: "준호선", by: 1988, bp: "부산", c: 2, dark: true, ev: [[1995, "초등학교 입학", 0], [2007, "서울로 대학 입학", 1], [2009, "입대", 0], [2011, "전역", 0], [2014, "첫 출근", 0], [2018, "소개팅에서 만남", 0], [2020, "결혼 · 첫 전셋집", 1], [2023, "아이가 태어남", 0], [2030, "우리 집 마련", 0]] },
    { name: "영자선", by: 1958, bp: "영주", c: 1, dark: false, ev: [[1965, "국민학교 입학", 0], [1974, "서울로 올라옴", 1], [1976, "첫 월급", 0], [1981, "결혼", 0], [1983, "첫째 태어남", 0], [1986, "둘째 태어남", 0], [1992, "가게를 엶", 1], [2008, "첫째 결혼", 0], [2012, "손주가 태어남", 0], [2018, "가게를 넘김", 0], [2021, "고향으로 이사", 1], [2027, "칠순 가족 여행", 0]] },
    { label: "둘이 겹친 노선", name: "준호선", by: 1988, bp: "부산", c: 2, dark: false, ev: [[1995, "초등학교 입학", 0], [2007, "서울로 대학 입학", 1], [2009, "입대", 0], [2014, "첫 출근", 0], [2022, "첫 전셋집으로 이사", 1], [2030, "우리 집 마련", 0]],
      p: { name: "지은선", by: 1990, bp: "전주", c: 0, ev: [[1997, "초등학교 입학", 0], [2003, "광주로 전학", 1], [2009, "대학 입학", 0], [2013, "첫 출근", 0], [2016, "서울로 이직", 1]] },
      meet: [[2018, "소개팅"], [2020, "결혼"]], tg: true, kid: [[2023, "하윤선"]] }
  ];
  const evs = (a) => (a || []).map((v) => ({ y: v[0], n: v[1], t: !!v[2] }));
  const fromEx = (e) => { const m = { name: e.name, by: e.by, bp: e.bp, c: e.c, dark: e.dark, ev: evs(e.ev) }; if (e.p) { m.p = { name: e.p.name, by: e.p.by, bp: e.p.bp, c: e.p.c, ev: evs(e.p.ev) }; m.meet = e.meet.map((v) => ({ y: v[0], n: v[1] })); m.tg = !!e.tg; } if (e.kid) m.kid = e.kid.map((v) => ({ y: v[0], n: v[1] })); return m; };
  const blank = () => ({ name: "", by: "", bp: "", c: 4, dark: false, ev: [] });
  const S = { m: blank(), who: 0, keep: false, raf: 0, got: null };
  const cur = () => (S.who && S.m.p ? S.m.p : S.m);
  const bat = (w) => { const k = w.charCodeAt(w.length - 1); return k >= 0xAC00 && k <= 0xD7A3 && (k - 0xAC00) % 28 > 0; };

  function show(id) { ["vHome", "vMake", "vGot"].forEach((v) => { $(v).hidden = id !== v; }); window.scrollTo(0, 0); }
  // 미리 보기: 태어난 해를 넣기 전에는 흐린 예시 노선과 안내를 보여 준다
  function preview() {
    const cv = $("cv");
    if (S.m.by) { D.draw(cv, S.m, { size: "card" }); return; }
    D.draw(cv, Object.assign(fromEx(EX[0]), { dark: !!S.m.dark, c: S.m.c }), { size: "card" });
    const c = cv.getContext("2d"), W = cv.width, H = cv.height, dark = !!S.m.dark;
    c.fillStyle = dark ? "rgba(20,24,32,.82)" : "rgba(247,248,245,.82)"; c.fillRect(0, 0, W, H);
    c.fillStyle = dark ? "#F0F2F5" : "#1E262C"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "800 62px " + D.FONT;
    c.fillText("태어난 해를 넣으면", W / 2, H / 2 - 44); c.fillText("그려져요", W / 2, H / 2 + 44);
  }
  function redraw() { if (S.raf) return; S.raf = requestAnimationFrame(() => { S.raf = 0; preview(); save(); }); }
  // 그림을 화면에 크게 띄운다(크게 보기, 저장이 안 되는 브라우저에서 길게 눌러 저장)
  function big(src, text) { $("ovImg").src = src; $("ovMsg").textContent = text || ""; $("ov").hidden = false; $("bOv").focus(); }
  function closeBig() { $("ov").hidden = true; const s = $("ovImg").src; $("ovImg").removeAttribute("src"); if (s.indexOf("blob:") === 0) URL.revokeObjectURL(s); }
  const UA = navigator.userAgent || "", INAPP = /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Barcelona|NAVER\(inapp|Line\/|DaumApps|everytimeApp/i.test(UA), IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  function save() { if (!S.keep) return; try { localStorage.setItem(KEY, JSON.stringify(S.m)); } catch (e) { /* 저장이 막힌 브라우저에서는 그냥 넘어간다 */ } }
  function load() { let m = null; try { m = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { m = null; } return m && typeof m === "object" && Array.isArray(m.ev) ? m : null; }
  function msg(t) { $("mMsg").textContent = t || ""; }

  function chips(box, list, get, set) {
    const el = $(box); el.textContent = "";
    list.forEach((it) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.dataset.v = it[0];
      if (it[2]) { const s = document.createElement("span"); s.className = "sw"; s.style.background = it[2]; b.appendChild(s); }
      b.appendChild(document.createTextNode(it[1])); b.setAttribute("aria-pressed", String(get() === it[0]));
      b.onclick = () => { set(it[0]); [...el.children].forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.v === String(get())))); redraw(); };
      el.appendChild(b);
    });
  }
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (tag === "button") e.type = "button"; return e; };
  const yearIn = (v) => { const y = mk("input", "in"); y.type = "number"; y.inputMode = "numeric"; y.min = 1900; y.max = 2150; y.value = v || ""; y.placeholder = "해"; y.setAttribute("aria-label", "해"); return y; };
  const nameIn = (v, ph, max) => { const n = mk("input", "in"); n.maxLength = max; n.value = v || ""; n.placeholder = ph; n.setAttribute("aria-label", ph); n.autocomplete = "off"; return n; };

  function renderList() {
    const ol = $("evList"), ev = cur().ev; ol.textContent = ""; $("mEmpty").hidden = ev.length > 0;
    ev.forEach((e, i) => {
      const cls = () => (e.t ? "x " : "") + (+e.y > NOW ? "f" : ""), li = mk("li", cls());
      const y = yearIn(e.y), n = nameIn(e.n, "역 이름", 14), t = mk("button", "tg"), d = mk("button", "del", "×"); t.innerHTML = "길이<br>바뀐 날";
      t.setAttribute("aria-pressed", String(!!e.t)); d.setAttribute("aria-label", "이 역 지우기");
      y.oninput = () => { e.y = +y.value || ""; li.className = cls(); redraw(); };
      y.onchange = () => { sortEv(); };
      n.oninput = () => { e.n = n.value; redraw(); };
      t.onclick = () => { e.t = !e.t; t.setAttribute("aria-pressed", String(e.t)); li.className = cls(); redraw(); };
      d.onclick = () => { ev.splice(i, 1); renderList(); redraw(); };
      li.append(y, n, t, d); ol.appendChild(li);
    });
  }
  function sortEv() {
    const ev = cur().ev, before = ev.map((e) => e.y).join(); ev.sort((a, b) => (a.y || 9999) - (b.y || 9999));
    if (ev.map((e) => e.y).join() !== before) renderList();
  }
  const lastPast = () => S.m.ev.concat(S.m.p ? S.m.p.ev : []).reduce((v, e) => (+e.y <= NOW ? Math.max(v, +e.y || 0) : v), +S.m.by || 0);
  function addEv(a) {
    const q = cur(), by = +q.by, last = q.ev.reduce((v, e) => Math.max(v, +e.y || 0), by || 0);
    const lp = q.ev.reduce((v, e) => (+e.y <= NOW ? Math.max(v, +e.y || 0) : v), by || 0);
    const kid = a[3] === "아이선";
    let y = a[3] === "앞" ? Math.max(NOW + 2, last + 1) : !kid && a[3] != null && by ? by + a[3] : lp ? Math.min(lp + 1, NOW) : "";
    const e = { y: y, n: a[1], t: !!a[2] }; q.ev.push(e); q.ev.sort((p, r) => (p.y || 9999) - (r.y || 9999)); renderList(); redraw();
    if (kid) {   // 아이가 태어남: 같은 해의 아이 노선 한 줄을 같이 만들고 이름 칸으로 간다
      S.m.kid = S.m.kid || [];
      if (S.m.kid.length < 3) { S.m.kid.push({ y: y, n: "" }); together(); redraw(); focusLast("kdList", 1); msg("아이 노선이 같이 생겼어요. 이름을 넣어 주세요."); }
      return;
    }
    const li = $("evList").children[q.ev.indexOf(e)]; if (li) { const f = li.children[a[1] ? 0 : 1]; f.focus(); if (f.select) f.select(); }
  }

  // 만난 역, 아이 노선: 해 + 이름 두 칸짜리 목록
  function pairList(box, arr, ph, max) {
    const ol = $(box); ol.textContent = "";
    arr.forEach((e, i) => {
      const li = mk("li"), y = yearIn(e.y), n = nameIn(e.n, ph, max), d = mk("button", "del", "×"); d.setAttribute("aria-label", "지우기");
      y.oninput = () => { e.y = +y.value || ""; redraw(); }; n.oninput = () => { e.n = n.value; redraw(); };
      d.onclick = () => { arr.splice(i, 1); together(); redraw(); };
      li.append(y, n, d); ol.appendChild(li);
    });
  }
  function together() {
    const has = !!S.m.p; $("pNone").hidden = has; $("pHas").hidden = !has; $("cWho").hidden = !has;
    S.m.kid = S.m.kid || [];
    if (has) {
      S.m.meet = S.m.meet || [];
      pairList("mtList", S.m.meet, "만난 역 이름", 14); $("bMeet").hidden = S.m.meet.length >= 3; $("bTg").setAttribute("aria-pressed", String(!!S.m.tg));
      chips("cWho", [[0, S.m.name || "내 노선"], [1, S.m.p.name || "옆 노선"]], () => S.who, (v) => { S.who = +v; fillPerson(); });
    } else S.who = 0;
    pairList("kdList", S.m.kid, "아이 노선 이름", 8); $("bKid").hidden = S.m.kid.length >= 3;
  }
  function focusLast(box, idx) { const li = $(box).lastElementChild; if (li) { li.children[idx].focus(); li.scrollIntoView({ block: "center" }); } }
  function addMeet() { if (S.m.meet.length >= 3) return; S.m.meet.push({ y: "", n: S.m.meet.length ? "다시 만난 날" : "처음 만난 날" }); together(); redraw(); focusLast("mtList", 0); }
  function addKid() { S.m.kid = S.m.kid || []; if (S.m.kid.length >= 3) { msg("아이 노선은 3개까지 그릴 수 있어요."); return; } const lp = lastPast(); S.m.kid.push({ y: lp ? Math.min(lp + 1, NOW) : "", n: "" }); together(); redraw(); focusLast("kdList", 1); }
  function setPartner(q) { S.m.p = { name: q.name || "", by: q.by || "", bp: q.bp || "", c: q.c == null || +q.c === +S.m.c ? (+S.m.c + 2) % 7 : +q.c, ev: q.ev || [] }; S.m.meet = S.m.meet || []; }

  function fillPerson() {
    const q = cur();
    $("iName").value = q.name || ""; $("iBy").value = q.by || ""; $("iBp").value = q.bp || "";
    chips("cColor", D.PAL.map((p, i) => [i, p[0], p[1]]), () => cur().c, (v) => { cur().c = +v; });
    renderList();
  }
  function fill() {
    together(); fillPerson();
    chips("cTone", [["light", "밝은 판"], ["dark", "어두운 판"]], () => (S.m.dark ? "dark" : "light"), (v) => { S.m.dark = v === "dark"; });
    $("pPaste").hidden = true; $("iOut").hidden = true; $("pAsk").hidden = true; msg(""); preview();
  }
  function enter(m) { S.m = m; S.who = 0; fill(); show("vMake"); }

  // 주소에 담기: 짧은 배열 → (되면) 압축 → 글자
  const packP = (q) => [q.name || "", +q.by || 0, q.bp || "", +q.c || 0, (q.ev || []).filter((e) => e.n && e.y).map((e) => [+e.y, e.n, e.t ? 1 : 0])];
  const pairs = (a) => (a || []).filter((k) => k.y).map((k) => [+k.y, k.n || ""]);
  const b64 = (u8) => { let s = ""; u8.forEach((v) => { s += String.fromCharCode(v); }); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64 = (t) => { const s = atob(t.replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  async function pipe(u8, T) { const buf = await new Response(new Blob([u8]).stream().pipeThrough(new T("deflate-raw"))).arrayBuffer(); return new Uint8Array(buf); }
  async function code(m) {
    const raw = new TextEncoder().encode(JSON.stringify([1, packP(m), m.dark ? 1 : 0, m.p && +m.p.by ? packP(m.p) : 0, pairs(m.meet), m.tg ? 1 : 0, pairs(m.kid)]));
    if (window.CompressionStream) { try { return "z" + b64(await pipe(raw, CompressionStream)); } catch (e) { /* 압축이 안 되는 브라우저는 그대로 담는다 */ } }
    return "j" + b64(raw);
  }
  const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : ""), yr = (v) => (+v >= 1900 && +v <= 2150 ? Math.round(+v) : "");
  const unP = (a) => ({ name: str(a[0], 10), by: yr(a[1]), bp: str(a[2], 10), c: (Math.abs(a[3] | 0)) % 7, ev: (Array.isArray(a[4]) ? a[4] : []).slice(0, 40).map((v) => ({ y: yr(v && v[0]), n: str(v && v[1], 20), t: !!(v && v[2]) })).filter((e) => e.y && e.n) });
  const unPairs = (a, n) => (Array.isArray(a) ? a : []).slice(0, 3).map((v) => ({ y: yr(v && v[0]), n: str(v && v[1], n) })).filter((k) => k.y);
  async function decode(t) {
    try {
      t = String(t || ""); const i = t.indexOf("#"); if (i >= 0) t = t.slice(i + 1); t = t.trim();
      let u8 = unb64(t.slice(1));
      if (t[0] === "z") { if (!window.DecompressionStream) return null; u8 = await pipe(u8, DecompressionStream); } else if (t[0] !== "j") return null;
      const a = JSON.parse(new TextDecoder().decode(u8)); if (!Array.isArray(a) || a[0] !== 1 || !Array.isArray(a[1])) return null;
      const m = unP(a[1]); m.dark = !!a[2]; m.kid = unPairs(a[6], 8);
      if (Array.isArray(a[3])) { m.p = unP(a[3]); m.meet = unPairs(a[4], 14); m.tg = !!a[5]; }
      return m;
    } catch (e) { return null; }
  }
  const link = async (m) => location.origin + location.pathname + "#" + (await code(m || S.m));
  async function send() {
    if (!S.m.by) { msg("태어난 해를 먼저 넣어 주세요."); $("iBy").focus(); return; }
    const url = await link();
    if (url.length > MAXURL) { msg("주소가 너무 길어요. 역 이름을 줄이면 보낼 수 있어요."); return; }
    try { if (navigator.share) { await navigator.share({ title: "인생 노선도", url: url }); msg(""); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(url); msg("주소를 복사했어요. 보여 주고 싶은 사람에게 붙여 넣어 보내세요."); return; } catch (e) { /* 복사가 막히면 아래 칸에 보여 준다 */ }
    const o = $("iOut"); o.hidden = false; o.value = url; o.focus(); o.select(); msg("아래 주소를 길게 눌러 복사해 주세요.");
  }

  // 받은 노선
  function gotView(m) {
    S.got = m; const nA = D.lname(m.name) || "노선", two = !!m.p, nm = two ? nA + D.josa(nA) + " " + (D.lname(m.p.name) || "옆 노선") : nA;
    $("gTitle").textContent = nm + (bat(nm) ? "이" : "가") + " 도착했어요"; D.draw($("cvGot"), m, { size: "card" });
    $("bGotA").textContent = two ? "이 노선도 열어 보기" : "내 노선과 겹쳐 보기"; $("bGotB").textContent = two ? "내 노선 새로 그리기" : "이 노선만 열어 보기";
    show("vGot");
  }
  const clearHash = () => { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* 넘어감 */ } };
  $("bGotA").onclick = () => {
    const g = S.got; clearHash(); S.keep = false; $("bKeep").setAttribute("aria-pressed", "false");
    if (g.p) { enter(g); return; }
    const mine = load() || blank(); S.keep = !!load(); $("bKeep").setAttribute("aria-pressed", String(S.keep)); mine.p = null; S.m = mine; setPartner(g); enter(mine);
    if (!mine.by) { msg("내 노선을 넣으면 " + (g.name || "받은 노선") + " 옆에 같이 그려져요."); $("iName").focus(); }
  };
  $("bGotB").onclick = () => { const g = S.got; clearHash(); S.keep = false; $("bKeep").setAttribute("aria-pressed", "false"); enter(g.p ? blank() : g); };

  // 저장: 휴대폰이면 공유 창(사진에 저장), 아니면 파일로 받기
  function out(size, label) {
    if (!S.m.by) { msg("태어난 해를 먼저 넣어 주세요."); $("iBy").focus(); return; }
    const cv = document.createElement("canvas"); D.draw(cv, S.m, { size: size });
    cv.toBlob(async (blob) => {
      if (!blob) { msg("그림을 만들지 못했어요. 다시 눌러 주세요."); return; }
      const name = "인생노선도_" + label + ".png", file = new File([blob], name, { type: "image/png" });
      const hold = () => { big(URL.createObjectURL(blob), "그림을 길게 눌러 사진에 저장해 주세요"); msg(""); };
      if (INAPP) { hold(); return; }   // 카카오톡·인스타그램 같은 앱 안 브라우저는 공유도 내려받기도 막히는 일이 많다
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); msg(label + " 그림을 내보냈어요."); return; }
      } catch (e) { if (e && e.name === "AbortError") { msg(""); return; } hold(); return; }
      if (IOS) { hold(); return; }   // 아이폰은 내려받기가 새 탭으로 열리기도 해서 같은 방식으로
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      msg(label + " 그림을 저장했어요.");
    }, "image/png");
  }

  // 첫 화면: 예시 노선이 위에서 아래로 한 번 그려진다
  function hero() {
    const cv = $("cvHero"), off = document.createElement("canvas"), m = fromEx(EX[0]); D.draw(off, m, { size: "hero" });
    const c = cv.getContext("2d"), W = cv.width, H = cv.height, still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paint = (p) => { c.fillStyle = "#F7F8F5"; c.fillRect(0, 0, W, H); c.drawImage(off, 0, 0, W, H * p, 0, 0, W, H * p); };
    if (still) { paint(1); return; }
    const t0 = performance.now(), dur = 2800;
    const tick = (t) => { const k = Math.min((t - t0) / dur, 1), p = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; paint(p); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  // 잇기
  $("bStart").onclick = () => { const m = load(); S.keep = !!m; $("bKeep").setAttribute("aria-pressed", String(S.keep)); enter(m || blank()); if (!m) $("iName").focus(); };
  $("bHome").onclick = () => show("vHome");
  $("iName").oninput = (e) => { cur().name = e.target.value; if (S.m.p) { const b = $("cWho").children[S.who]; if (b) b.textContent = e.target.value || (S.who ? "옆 노선" : "내 노선"); } redraw(); };
  $("iBy").oninput = (e) => { cur().by = +e.target.value || ""; redraw(); };
  $("iBp").oninput = (e) => { cur().bp = e.target.value; redraw(); };
  $("bPhone").onclick = () => out("phone", "배경화면"); $("bA4").onclick = () => out("a4", "액자용"); $("bSquare").onclick = () => out("square", "정사각");
  $("bSend").onclick = send;
  $("bKeep").onclick = () => { S.keep = !S.keep; $("bKeep").setAttribute("aria-pressed", String(S.keep)); if (S.keep) { save(); msg("이 휴대폰에 기억해 둘게요."); } else { try { localStorage.removeItem(KEY); } catch (e) { /* 넘어감 */ } msg("기억해 둔 것을 지웠어요."); } };
  $("bClear").onclick = () => { $("pAsk").hidden = false; $("bAskN").focus(); };
  $("bAskN").onclick = () => { $("pAsk").hidden = true; };
  $("bZoom").onclick = () => { if (S.m.by) big($("cv").toDataURL("image/png"), ""); else $("iBy").focus(); };
  $("bOv").onclick = closeBig; $("ov").onclick = (e) => { if (e.target === $("ov")) closeBig(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("ov").hidden) closeBig(); });
  $("bAskY").onclick = () => { S.m = blank(); S.who = 0; try { localStorage.removeItem(KEY); } catch (e) { /* 넘어감 */ } S.keep = false; $("bKeep").setAttribute("aria-pressed", "false"); fill(); $("iName").focus(); };
  $("bPaste").onclick = () => { $("pPaste").hidden = false; $("iLink").focus(); };
  $("bLink").onclick = async () => { const g = await decode($("iLink").value); if (!g) { $("mLink").textContent = "주소를 읽지 못했어요. 받은 주소를 처음부터 끝까지 붙여 넣어 주세요."; return; } $("mLink").textContent = ""; $("iLink").value = ""; setPartner(g); fill(); redraw(); };
  $("bHere").onclick = () => { setPartner({}); S.who = 1; fill(); redraw(); $("iName").focus(); $("cWho").scrollIntoView({ block: "center" }); };
  $("bMeet").onclick = addMeet; $("bKid").onclick = addKid;
  $("bTg").onclick = () => { S.m.tg = !S.m.tg; $("bTg").setAttribute("aria-pressed", String(S.m.tg)); redraw(); };
  $("bUnp").onclick = () => { S.m.p = null; S.m.meet = []; S.m.tg = false; S.who = 0; fill(); redraw(); };
  function pickKind(i) {
    [...$("cKind").children].forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    const el = $("cAdd"); el.textContent = "";
    KINDS[i][2].forEach((a) => { const b = mk("button", "chip", "+ " + a[0]); b.onclick = () => addEv(a); el.appendChild(b); });
  }
  (function () {
    const el = $("cKind");
    KINDS.forEach((k, i) => { const b = mk("button", "kind"); b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + k[1] + "</svg>"; b.appendChild(document.createTextNode(k[0])); b.onclick = () => { pickKind(i); if (KINDS[i][2].length === 1) addEv(KINDS[i][2][0]); }; el.appendChild(b); });
    pickKind(0);
  })();
  (function () { const el = $("cEx"); EX.forEach((e) => { const b = mk("button", "chip", e.label ? e.label + " (" + e.name + D.josa(e.name) + " " + e.p.name + ")" : e.name + " (" + e.by + "년 " + e.bp + " 출발)"); b.onclick = () => { S.keep = false; $("bKeep").setAttribute("aria-pressed", "false"); enter(fromEx(e)); }; el.appendChild(b); }); })();
  // 같이 올린 글꼴이 준비된 뒤에 그린다(늦으면 기본 글꼴로 먼저 그림)
  const fontReady = document.fonts && document.fonts.load ? Promise.race([document.fonts.load('800 20px "LN Sans"', "인생 노선도"), new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
  const start = location.hash.length > 3 ? decode(location.hash) : Promise.resolve(null);
  Promise.all([fontReady, start]).then((v) => { hero(); if (v[1]) gotView(v[1]); else if (!$("vMake").hidden) redraw(); });
  window.addEventListener("hashchange", () => { if (location.hash.length > 3) decode(location.hash).then((m) => { if (m) gotView(m); }); });
  window.LN = { state: S, enter: enter, fromEx: fromEx, EX: EX, draw: D.draw, code: code, decode: decode, link: link };
})();
