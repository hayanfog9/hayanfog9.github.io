// 통장 일대기 — 화면
(function () {
  const D = window.TJ_DATA, TJ = window.TJ, A = TJ.assume, CARD = window.TJ_CARD, STORY = window.TJ_STORY, EX = window.TJ_EXTRAS, PLACE = window.TJ_PLACE, CITY = window.TJ_CITY;
  const $ = (id) => document.getElementById(id);
  const KEY = "tongjang_v3";          // 이어 보기 기록. 계산이 바뀌면 이름을 바꾼다
  const STAMP_KEY = "tongjang_stamps"; // 모은 도장(이 브라우저에만 저장)
  const SHARE_VER = 3;                // 계산이나 통계를 바꾸면 1씩 올린다. index.html의 ?v= 숫자도 같이 올린다
  const SITE_URL = "https://hayanfog9.github.io/bankbook-life-3k7d/";

  // 이어지는 곳. open: 공개일(그 전에는 "곧 열려요"로만 표시)
  const LINKS = {
    salary: { t: "월급 실수령액 계산기", s: "내 월급으로 계산해 보기", url: "https://hayanfog9.github.io/salary-calc-6w2p/" },
    convert: { t: "시급·월급·연봉 환산", s: "내 시급은 월급으로 얼마일까", url: "https://hayanfog9.github.io/wage-convert-4p6s/" },
    saving: { t: "예금·적금 이자 계산기", s: "이 적금, 만기에 얼마 받을까", url: "https://hayanfog9.github.io/saving-calc-3k8d/", open: "2026-11-11" },
    leave: { t: "연차수당 계산기", s: "남은 연차는 돈으로 얼마일까", url: "https://hayanfog9.github.io/leave-pay-8k2m/", open: "2026-12-22" },
    retire: { t: "퇴직금 계산기", s: "내 퇴직금 계산해 보기", url: "https://hayanfog9.github.io/retire-pay-6m3x/" },
    blog: { t: "JW 블로그", s: "계산기 만든 과정과 돈 계산 글", url: "https://blog.naver.com/hayanfog" }
  };
  // 마지막 장 맨 아래 작은 상자 1개. 퇴사 정산은 주소가 생기면 url 한 줄만 채운다(실직이 있었던 판에만 나온다)
  const KMONG = {
    quit: { t: "퇴사 정산 퇴직금 실업급여 연차수당 엑셀 2026", url: "" },
    parttime: { t: "알바 급여 계산 엑셀 주휴수당 월급 실수령액 2026", url: "https://kmong.com/self-marketing/854102/XrLYSjbGe5" },
    salary: { t: "연봉 월급 실수령액 계산 + 연차 관리 엑셀 2026", url: "https://kmong.com/self-marketing/850459/4pddpuIPR3" }
  };
  const HELP_T = { money: "돈 문제로 막막할 때", job: "일자리를 잃었을 때", health: "큰 병을 진단받았을 때", mind: "마음이 힘들 때", pension: "내 연금이 궁금할 때" };
  const DEC_EV = { marry: "결혼했다", kid: "아이가 태어났다", home: "집을 샀다", exit: "오래 다닌 일터를 떠났다", ill: "암 진단을 받았다", loss: "일자리를 잃었다", move: "회사를 옮겼다", sold: "집을 팔았다", zero: "모아 둔 돈이 바닥났다" };

  // ── 표시 도구 ───────────────────────────────────────────────
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const man = CARD.man;
  const manS = (v) => man(v).replace(" 원", "");
  const won = (v) => Math.round(v).toLocaleString("ko-KR") + "원";
  const pc = (x) => Math.round(x * 1000) / 10;
  const today = () => new Date().toISOString().slice(0, 10);
  function linkHtml(k, card) {
    const L = LINKS[k]; if (!L) return "";
    if (L.open && today() < L.open) { const d = Number(L.open.slice(5, 7)) + "월 " + Number(L.open.slice(8)) + "일에 열려요"; return card ? `<span class="soon">${esc(L.t)}<small>${d}</small></span>` : `<span class="soon">${esc(L.t)} · ${d}</span>`; }
    return card ? `<a href="${L.url}" target="_blank" rel="noopener">${esc(L.t)}<small>${esc(L.s)}</small></a>` : `<a href="${L.url}" target="_blank" rel="noopener">${esc(L.t)} — ${esc(L.s)}</a>`;
  }
  function helpHtml(k) {
    const list = D.help[k]; if (!list) return "";
    return `<div class="helpbox"><b>${HELP_T[k]}</b><ul>` + list.map((h) => `<li>${esc(h.name)} <a href="tel:${h.tel.replace(/-/g, "")}">${h.tel}</a>${h.note ? " (" + esc(h.note) + ")" : ""}</li>`).join("") + "</ul></div>";
  }
  function gc(path) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: path, event: true }); } catch (e) {} }
  // 만든 사람의 다른 것들(새 창). 누른 횟수만 센다
  const MORE = [["blog", "네이버 블로그", "https://blog.naver.com/hayanfog"], ["youtube", "유튜브 쇼츠", "https://www.youtube.com/@jwailab"], ["hub", "계산기 모음", "https://hayanfog9.github.io/"]];
  const moreHtml = () => MORE.map((m) => `<a href="${m[2]}" target="_blank" rel="noopener" data-more="${m[0]}">${m[1]}</a>`).join("");
  function bindMore(root) { root.querySelectorAll("a[data-more]").forEach((a) => a.addEventListener("click", () => gc("event-" + a.dataset.more))); }
  // 작은 픽셀 그림(8x8). 그림 파일 없이 코드로 그린다
  const PIXC = { r: "#c5352b", n: "#14305a", g: "#c8a24a", y: "#e6cf8a", b: "#8a5a3c", s: "#e8b98f", w: "#ffffff", k: "#2b2320", t: "#5f8f78", q: "#9aa7b8" };
  const PIX = {
    heart: [".rr..rr.", "rrrrrrrr", "rrrrrrrr", "rrrrrrrr", ".rrrrrr.", "..rrrr..", "...rr...", "........"],
    baby: ["..bbbb..", ".bssssb.", ".sksskss", ".ssssss.", "..srrs..", ".wwwwww.", ".wwwwww.", "..s..s.."],
    house: ["...rr...", "..rrrr..", ".rrrrrr.", "rrrrrrrr", ".yyyyyy.", ".ynnyby.", ".ynnyby.", ".yyyyby."],
    bag: ["..kkkk..", "..k..k..", "bbbbbbbb", "bbbbbbbb", "bbbggbbb", "bbbbbbbb", "bbbbbbbb", "........"],
    coin: ["..gggg..", ".gyyyyg.", "gyygyyyg", "gyygyyyg", "gyygyyyg", "gyygyyyg", ".gyyyyg.", "..gggg.."],
    car: ["........", "..nnnn..", ".nqqnqn.", "nnnnnnnn", "nnnnnnnn", "nynnnnyn", ".kk..kk.", "........"],
    chart: ["......n.", "......n.", "...n..n.", "...n..n.", ".n.n..n.", ".n.n.gn.", ".n.n.gn.", "kkkkkkkk"],
    stamp: ["...bb...", "...bb...", "..bbbb..", "..bbbb..", ".rrrrrr.", ".rrrrrr.", "........", ".rrrrrr."],
    cap: ["...nn...", ".nnnnnn.", "nnnnnnnn", ".nnnnnn.", "..nnnng.", "..nnnng.", "......g.", "........"],
    list: ["n.kkkkk.", "........", "n.kkkkk.", "........", "n.kkkk..", "........", "n.kkkkk.", "........"],
    scoot: ["......k.", ".....kk.", "..nn..n.", ".nnnnnn.", "nnnnnnn.", ".kk..kk.", ".kk..kk.", "........"],
    leaf: ["....tt..", "..ttttt.", ".tttttt.", ".ttttt..", ".tttt...", "..b.....", ".b......", "b......."]
  };
  const CARCOL = [["남색", "#14305a"], ["빨간색", "#c5352b"], ["초록색", "#3f7d5c"], ["은색", "#9aa7b8"], ["노란색", "#d9a520"], ["하늘색", "#5b9bd5"], ["흰색", "#f2efe6"], ["갈색", "#8a5a3c"]];
  const carCol = (age, i) => CARCOL[(STORY.hash(S.opt.seed, age) + i) % CARCOL.length]; // 한 장면의 선택지끼리 색이 겹치지 않는다
  function pix(name, col) {
    const m = PIX[name]; if (!m) return "";
    if (col) return pix2(m, col);
    let r = "";
    m.forEach((row, y) => { for (let x = 0; x < 8; x++) { const c = PIXC[row[x]]; if (c) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`; } });
    return `<svg class="px" viewBox="0 0 8 8" aria-hidden="true" shape-rendering="crispEdges">${r}</svg>`;
  }
  function pix2(m, col) {
    let r = "";
    m.forEach((row, y) => { for (let x = 0; x < 8; x++) { const c = row[x] === "n" ? col : PIXC[row[x]]; if (c) r += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`; } });
    return `<svg class="px big" viewBox="0 0 8 8" aria-hidden="true" shape-rendering="crispEdges">${r}</svg>`;
  }
  // 그해의 사실에 맞는 그림(무거운 일에는 붙이지 않는다)
  const FACT_PIX = [["marry", "heart"], ["kid1", "baby"], ["kid2", "baby"], ["kid3", "baby"], ["homeLoan", "house"], ["home", "house"], ["loanPaid", "house"], ["pension", "coin"], ["first", "bag"], ["college", "cap"], ["carFirst", "car"], ["carBuy", "car"], ["move", "bag"], ["rejoin", "bag"], ["exitRe", "leaf"], ["exitRest", "leaf"], ["school", "cap"]];
  const H3_PIX = [["명 중 나는", "chart"], ["견주면", "chart"], ["도장", "stamp"], ["평생 받은 월급", "coin"], ["연금", "coin"], ["내가 고른 것", "list"], ["내 숫자로", "bag"], ["도움받을 곳", "heart"], ["나란히", "list"]];
  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── 상태 ────────────────────────────────────────────────────
  let S = null;
  const carName = () => (S && (S.carNick || (S.game && S.game.x.nick))) || "차";
  const ct = (t) => String(t).replace(/\{car\}/g, carName()); // 차 별명 끼워 넣기
  function save() {
    if (!S || S.shared) return;
    try { localStorage.setItem(KEY, JSON.stringify({ opt: S.opt, name: S.name, picks: S.picks, done: !!S.done, carNick: S.carNick || "" })); } catch (e) {}
  }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function myStamps() { try { return JSON.parse(localStorage.getItem(STAMP_KEY) || "[]"); } catch (e) { return []; } }
  function addStamps(ids) {
    const have = myStamps(), fresh = ids.filter((i) => have.indexOf(i) < 0);
    if (fresh.length) { try { localStorage.setItem(STAMP_KEY, JSON.stringify(have.concat(fresh))); } catch (e) {} }
    return fresh;
  }
  function show(id) { ["vCover", "vSetup", "vPlay", "vFinal"].forEach((v) => $(v).classList.toggle("hide", v !== id)); if (id === "vCover") renderShelf(); window.scrollTo(0, 0); }
  const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const whoName = () => S.name || CARD.nameOf(S.opt.seed);
  const liveNow = () => PLACE.live(S.opt.seed, S.opt.region, (S.game && S.game.x.moves) || 0); // 지금 사는 시(발령으로 옮기면 바뀐다)
  const ro = (w) => { const c = w.charCodeAt(w.length - 1), j = (c - 0xac00) % 28; return w + (c >= 0xac00 && c <= 0xd7a3 && j !== 0 && j !== 8 ? "으로" : "로"); };

  // 씨앗과 고른 번호만으로 한 판을 끝까지 다시 계산한다(받은 통장, 친구 통장)
  function simulate(opt, picks) {
    const g = new TJ.Game(opt); const p = picks.slice();
    for (let n = 0; n < 5000; n++) {
      const e = g.next();
      if (e.type === "end") return e.summary;
      if (e.type === "scene") g.choose(Math.min(e.options.length - 1, p.length ? p.shift() : 0));
    }
    return null;
  }

  // ── 공유 주소: 씨앗·시작 조건·고른 번호만 담는다(이름과 차 별명은 담지 않음) ──
  const JOBC = { min: "m", sme: "s", large: "l" }, REGC = { metro: "m", city: "c", prov: "p" };
  function shareUrl() {
    const o = S.opt, base = /^https?:/.test(location.protocol) ? location.origin + location.pathname.replace(/index\.html$/, "") : SITE_URL;
    return base + "#t=" + SHARE_VER + "." + o.seed.toString(36) + "." + o.age + JOBC[o.job] + REGC[o.region] + "." + S.picks.join("");
  }
  function parseShare(hash) {
    const m = /^#t=(\d)\.([0-9a-z]{1,8})\.(\d{2})([msl])([mcp])\.([0-3]{0,120})$/.exec(hash || "");
    if (!m) return null;
    if (Number(m[1]) !== SHARE_VER) return { old: true };
    const age = Number(m[3]); if (age < 19 || age > 34) return null;
    const inv = (o, c) => Object.keys(o).find((k) => o[k] === c);
    return { opt: { seed: parseInt(m[2], 36) >>> 0, age: age, job: inv(JOBC, m[4]), region: inv(REGC, m[5]) }, picks: m[6].split("").map(Number) };
  }

  // ── 시작 ────────────────────────────────────────────────────
  function start(opt, name, picks, shared, carNick) {
    stop();
    S = { opt: opt, name: name || "", picks: [], game: new TJ.Game(opt), paused: false, fast: false, shared: !!shared, carNick: carNick || "",
      replay: (picks || []).slice(), rows: 0, vol: 0, dec: null, skipChap: false, recent: [] };
    $("rows").innerHTML = ""; $("sceneBox").innerHTML = "";
    $("pNm").textContent = whoName();
    $("tPause").textContent = "멈춤"; $("tPause").setAttribute("aria-pressed", "false");
    $("tSpeed").textContent = "빠르게"; $("tSpeed").setAttribute("aria-pressed", "false");
    head(opt.age, 0, { married: false, kidAges: [] });
    show("vPlay");
    { const b = PLACE.born(opt.seed), l = PLACE.live(opt.seed, opt.region, 0); const m = document.createElement("div"); m.className = "memo"; m.textContent = b.name === l.name ? l.short + "에서 태어나 " + l.short + "에서 첫 월급을 받았다." : b.short + "에서 태어나 " + l.short + "에서 첫 월급을 받았다."; $("rows").appendChild(m); }
    const fresh = !shared && !(picks && picks.length);
    // 이어 보기·받은 통장: 저장된 선택을 그대로 다시 밟는다(움직임 없이)
    while (S.replay.length || shared) {
      if (S.game.pendingScene && !S.replay.length) break;
      const e = S.game.next();
      if (e.type === "scene") { if (!S.replay.length) break; const i = Math.min(e.options.length - 1, S.replay.shift()); S.game.choose(i); S.picks.push(i); }
      else if (e.type === "year") addYear(e, false);
      else { S.done = true; showFinal(e.summary); return; }
    }
    save();
    if (fresh) return showBirth();
    step();
  }
  // ── 태어나기: 통장을 만들기 전의 짧은 첫 장(계산에는 쓰지 않는다) ──
  function showBirth() {
    const mine = S, o = S.opt, Y = A.baseYear - o.age;
    const b = PLACE.born(o.seed), l = PLACE.live(o.seed, o.region, 0), sex = PLACE.sex(o.seed), edu = PLACE.edu(o.seed, o.age);
    const steps = [
      [0, "갓난아이", "태어난 곳 " + b.name + " · 성별 " + (sex === "m" ? "남" : "여")],
      [8, "초등학교", (Y + 7) + "년, 초등학교에 들어갔어요."],
      [14, "중학교", (Y + 13) + "년, 중학생이 됐어요."],
      [17, "고등학교", (Y + 16) + "년, 고등학생이 됐어요."],
      [o.age, "첫 월급", (edu === "college" ? (Y + 19) + "년에 대학에 갔고(전문대 포함), " : (Y + 19) + "년에 고등학교를 졸업했고, ") + (b.name === l.name ? "태어난 " + l.short + "에서 첫 월급을 받아요." : b.short + "에서 태어나 " + l.short + "에서 첫 월급을 받아요.")]
    ];
    const box = $("sceneBox");
    box.innerHTML = `<section class="chap birth${reduced() ? "" : " turn"}" aria-live="polite"><div class="no">통장을 만들기 전</div><h2>${Y}년, ${esc(b.short)}에서<br>한 아이가 태어났어요</h2>
      <div class="faces">${steps.map((x, i) => `<figure class="${i ? "wait" : ""}"><canvas id="bf${i}" width="64" height="64"></canvas>${x[1]}</figure>`).join("")}</div>
      <p class="bline" id="bLine">${esc(steps[0][2])}</p></section>
      <div class="stack" style="margin-top:14px"><button class="btn" id="bSkip">첫 월급날로 건너뛰기</button></div>
      <p class="fine" style="margin-top:8px">태어난 곳은 시·군별 출생아 수, 성별은 출생 성비, 학력은 고등학교 졸업자 진학률로 뽑았어요. 계산에는 쓰지 않아요.</p>`;
    settle(box.firstElementChild, ["turn"], 700);
    steps.forEach((x, i) => CARD.portrait($("bf" + i).getContext("2d"), 0, 0, 64, o.seed, x[0]));
    let i = 0, timer = null;
    const done = () => { clearTimeout(timer); if (S !== mine) return; box.innerHTML = ""; step(); };
    const tick = () => {
      if (S !== mine || !$("bLine")) return;
      i++;
      if (i >= steps.length) return done();
      box.querySelectorAll(".faces figure")[i].classList.remove("wait");
      $("bLine").textContent = steps[i][2];
      timer = setTimeout(tick, i === steps.length - 1 ? 2600 : 1400);
    };
    if (reduced()) { box.querySelectorAll(".faces figure").forEach((f) => f.classList.remove("wait")); $("bLine").textContent = steps[steps.length - 1][2]; $("bSkip").textContent = "첫 월급날로"; }
    else timer = setTimeout(tick, 1800);
    $("bSkip").onclick = done;
    $("bSkip").focus({ preventScroll: true });
  }
  function stop() { if (S && S.timer) { clearTimeout(S.timer); S.timer = null; } }
  function schedule(ms) { stop(); if (!S || S.paused || S.done) return; S.timer = setTimeout(step, ms); }
  function step() {
    if (!S) return;
    // 나이대가 바뀌면 그해의 일이 시작되기 전에 통장 한 권을 덮고 새 권을 편다
    const g = S.game;
    if (!g.pendingScene && !g.dead && g.phase === "start" && g.age % 10 === 0 && S.rows > 0 && !S.skipChap && S.chapAt !== g.age) { S.chapAt = g.age; return showChapter(g.age); }
    const e = g.pendingScene || g.next();
    if (e.type === "scene") return showScene(e);
    if (e.type === "year") {
      const notable = addYear(e, true);
      return schedule(S.fast ? 150 : notable ? 1400 : 650);
    }
    S.done = true; save(); showFinal(e.summary);
  }

  // ── 머리: 나이 먹는 얼굴, 가족, 잔액 ─────────────────────────
  function head(age, balance, e) {
    CARD.portrait($("pf").getContext("2d"), 0, 0, 64, S.opt.seed, age);
    const vol = Math.floor(age / 10) - Math.floor(S.opt.age / 10) + 1;
    $("pAg").textContent = age + "세 · " + liveNow().name + " · " + vol + "권째";
    $("pBal").textContent = manS(balance);
    const fam = $("pFam"); fam.innerHTML = "";
    const face = (seed, a, px) => { const c = document.createElement("canvas"); c.width = c.height = 64; c.style.width = c.style.height = px + "px"; CARD.portrait(c.getContext("2d"), 0, 0, 64, seed, a); fam.appendChild(c); };
    if (e.married) face((S.opt.seed ^ 0x55aa1234) >>> 0, age, 22);
    (e.kidAges || []).forEach((k, i) => { if (k < A.kidLeavesAt) face((S.opt.seed + 7919 * (i + 1)) >>> 0, k, 16); });
  }

  // 움직임이 끝나면(또는 탭이 가려져 움직임이 멈춰 있어도) 정해진 시간 뒤에는 움직임용 표시를 떼어 낸다.
  // 글자와 도장이 움직임 도중의 모습으로 남지 않게 하려는 것이다.
  function settle(el, cls, ms, childSel, childCls) {
    setTimeout(() => { cls.forEach((c) => el.classList.remove(c)); if (childSel) { const k = el.querySelector(childSel); if (k) childCls.forEach((c) => k.classList.remove(c)); } }, ms);
  }

  // ── 통장 줄 ─────────────────────────────────────────────────
  function volHeader(age) {
    const d = Math.floor(age / 10) * 10, vol = Math.floor(age / 10) - Math.floor(S.opt.age / 10) + 1;
    if (S.vol === vol) return;
    S.vol = vol;
    const h = document.createElement("div"); h.className = "vol"; h.textContent = "통장 " + vol + "권 · " + d + "대";
    $("rows").appendChild(h);
    $("pVol").textContent = "통장 " + vol + "권";
    S.dec = { in: 0, out: 0, tax: 0, from: age };
  }
  function addYear(e, animate) {
    const rows = $("rows");
    volHeader(e.age);
    let tin = 0, tout = 0, detail = "";
    const notes = [];
    e.lines.forEach((l) => {
      if (l.k === "note") { notes.push(l); return; }
      if (l.k === "in") tin += l.v; else tout += l.v;
      detail += `<div class="${l.k}"><span>${esc(ct(l.t))}</span><span class="v">${l.k === "in" ? "+" : "−"}${man(l.v)}</span></div>`;
    });
    S.dec.in += tin; S.dec.out += tout; S.dec.tax += e.taxSum || 0;
    const info = STORY.yearInfo(e, S.opt.seed, S.recent), raw = info.line; S.recent.push(raw); if (S.recent.length > 9) S.recent.shift();
    const say = ct(raw), seal = info.seal;
    const fp = info.heavy ? null : FACT_PIX.find((x) => (e.facts || []).indexOf(x[0]) >= 0), icon = fp ? pix(fp[1]) : "";
    const d = document.createElement("details");
    d.className = "row" + (animate && !reduced() ? " type" : "");
    d.innerHTML = `<summary><span class="a dot">${e.age}</span><div><div class="say">${icon}${esc(say)}</div><span class="io dot">+${manS(tin)} <em>−${manS(tout)}</em></span></div><span class="b dot${e.balance < 0 ? " neg" : ""}">${manS(e.balance)}</span></summary><div class="lines">${detail}</div>` +
      (seal ? `<div class="seal${animate && !reduced() ? " pop" : ""}" aria-label="도장: ${seal}">${seal}</div>` : "");
    rows.appendChild(d);
    if (animate) settle(d, ["type"], 700, ".seal", ["pop"]);
    // 같은 해에 있었던 다른 큰일은 한 줄씩 덧붙인다
    info.more.forEach((x) => { const m = document.createElement("div"); m.className = "memo"; m.textContent = ct(x.text) + (x.seal ? "  〔" + x.seal + "〕" : ""); rows.appendChild(m); });
    notes.forEach((n) => {
      // 엔진의 안내 메모 가운데 그해 문장과 겹치는 것은 빼고, 도움 안내와 재미·돌발 결과만 남긴다
      if (!n.help && !n.kind) return;
      const m = document.createElement("div");
      m.className = "memo" + (n.help ? " warn" : "");
      m.innerHTML = esc(ct(n.t)) + (n.help ? helpHtml(n.help) : "");
      rows.appendChild(m);
    });
    S.rows++;
    head(e.age, e.balance, e);
    if (animate) d.scrollIntoView({ block: "nearest", behavior: reduced() ? "auto" : "smooth" });
    return !!seal || info.more.length > 0 || (e.facts && e.facts.length > 0);

  }

  // ── 고르는 장면 ─────────────────────────────────────────────
  function showScene(e) {
    stop();
    const kind = e.kind || "stat";
    let h = `<section class="scene ${kind}" aria-live="polite">`;
    if (kind === "sur") h += `<div class="bang">${e.legend ? "전설!" : "돌발!"}</div>`;
    const tag = kind === "fun" ? "소소한 하루 · 재미 장면(통계 아님)" : kind === "sur" ? e.age + "세 · 갑자기 생긴 일" : kind === "car" ? e.age + "세 · 차 이야기" : e.age + "세 · " + liveNow().name + " 창구";
    if (e.img) h += `<div class="top"><img src="fun/${e.img}.jpg" width="104" height="104" alt="" loading="lazy"><div><div class="tag">${tag}</div><h2>${esc(ct(e.title))}</h2></div></div><p style="margin-top:10px">${esc(ct(e.text))}</p>`;
    else h += `<div class="tag">${tag}</div><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p>`;
    if (e.slip) {
      const s = e.slip;
      h += `<table class="slip"><tr><td>세전 월급</td><td>${won(s.gross)}</td></tr><tr><td>국민연금</td><td>−${won(s.pension)}</td></tr><tr><td>건강보험</td><td>−${won(s.health)}</td></tr><tr><td>장기요양보험</td><td>−${won(s.care)}</td></tr><tr><td>고용보험</td><td>−${won(s.emp)}</td></tr><tr><td>소득세</td><td>−${won(s.tax)}</td></tr><tr><td>지방소득세</td><td>−${won(s.local)}</td></tr><tr class="sum"><td>통장에 들어온 돈</td><td>${won(s.net)}</td></tr></table><p class="fine">2026년 요율과 국세청 근로소득 간이세액표(2026.3.1 시행)로 계산했어요. 비과세 수당은 없다고 봤어요.</p>`;
    }
    if (e.compare) h += `<table class="slip"><tr><td>지금 월급(세전)</td><td>${won(e.compare.now)}</td></tr><tr class="sum"><td>제안받은 월급(세전)</td><td>${won(e.compare.offer)}</td></tr></table>`;
    if (e.home) {
      const m = e.home;
      h += `<table class="slip"><tr><td>집값</td><td>${man(m.price)}</td></tr><tr><td>내 돈</td><td>${man(m.price - m.loan)}</td></tr><tr><td>대출</td><td>${man(m.loan)}</td></tr>${m.loan > 0 ? `<tr class="sum"><td>한 해 갚는 돈 (${m.years}년)</td><td>${man(m.pay)}</td></tr>` : ""}</table><p class="fine">대출 금리는 기준금리 ${D.baseRate.rate.toFixed(2)}%에 ${A.loanSpread}%p를 더했다고 가정하고, 물가안정목표 ${D.baseRate.target}%를 빼서 지금 돈 가치로 계산했어요. 집값은 오르내리지 않는다고 봤어요.</p>`;
    }
    if (e.id === "pension") h += `<table class="slip"><tr class="sum"><td>내 국민연금 (월)</td><td>${won(e.pension)}</td></tr><tr><td>지금 받는 사람들 평균 (월)</td><td>${won(e.avg)}</td></tr></table><p class="fine">2026년부터 적용되는 산식(소득대체율 43%)으로 계산했어요. 지금 받는 사람들 평균은 ${D.pension.avgYr} 기준이고, 가입 기간이 짧던 세대가 많아 차이가 나요. 기초연금은 계산에 넣지 않았어요. 실제 예상액은 국민연금공단 '내 연금 알아보기'에서 확인해 주세요.</p>` + helpHtml("pension");
    if (e.help) h += helpHtml(e.help);
    if (e.id === "ill") h += `<p class="fine">암 진단 확률은 2023년 암등록통계의 나이대별 발생률이에요. 치료비는 사람마다 달라 계산하지 않았고, 일을 쉬는 기간(${A.illnessRestMonths}개월)은 가정이에요. 의료 상담이 아니에요.</p>`;
    if (kind === "car") h += `<label class="fine" for="carNick" style="display:block;margin-top:6px">차를 사면 부를 별명 (안 쓰면 "${esc(S.game.x.nick)}")</label><input id="carNick" class="tin" maxlength="8" autocomplete="off" placeholder="${esc(S.game.x.nick)}">`;
    if (e.ask) h += `<p class="ask">${esc(e.ask)}</p>`;
    e.options.forEach((o, i) => {
      let ic = "", colName = "";
      if (kind === "car" && i < e.options.length - 1) { const cc = carCol(e.age, i); ic = pix(/스쿠터|오토바이/.test(o.label) ? "scoot" : "car", cc[1]); colName = cc[0] + " · "; }
      h += `<button class="opt${ic ? " caropt" : ""}" data-i="${i}">${ic}<span>${esc(ct(o.label))}${o.sub ? "<small>" + esc(colName + ct(o.sub)) + "</small>" : ""}</span></button>`;
    });
    if (kind === "sur") h += `<p class="fine" style="margin:8px 0 0">갑자기 생긴 일의 금액은 통계가 아니라 우리가 정한 가정이에요.</p>`;
    if (e.foot) h += `<p class="fine" style="margin:8px 0 0">${esc(e.foot)}</p>`;
    if (e.link) { h += `<div class="linkrow">${linkHtml(e.link)}</div>`; if (e.id === "first") h += `<div class="linkrow">${linkHtml("saving")}</div>`; }
    h += "</section>";
    const box = $("sceneBox");
    box.innerHTML = h;
    const sec = box.firstElementChild;
    if (kind === "sur" && !reduced()) { sec.classList.add("shake"); settle(sec, ["shake"], 600); }
    box.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      if (kind === "car") { const v = ($("carNick").value || "").trim(); if (v) S.carNick = v; }
      const label = e.options[i].label;
      S.game.choose(i); S.picks.push(i); save();
      box.innerHTML = "";
      if (e.options.length > 1) { const m = document.createElement("div"); m.className = "memo pick"; m.textContent = ct(e.title) + " → " + ct(label); $("rows").appendChild(m); }
      step();
    }));
    sec.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
    const first = box.querySelector(".opt"); if (first) first.focus({ preventScroll: true });
  }

  // ── 장 넘김: 통장 한 권(10년)을 덮는다 ─────────────────────────
  function showChapter(age) {
    stop();
    const e = { age: age };
    const g = S.game, from = S.dec.from, to = e.age - 1, vol = S.vol + 1;
    const band = e.age < 40 ? "39세 이하" : e.age < 50 ? "40대" : e.age < 60 ? "50대" : "60세 이상";
    const avg = D.assets.byAge[band].net * 1e4, mine = g.netWorth();
    const evs = g.ev.filter((x) => x.a >= from && x.a <= to).slice(0, 4).map((x) => `<li>${x.a}세에 ${DEC_EV[x.k] || ""}.</li>`).join("") || `<li>큰일 없이 지나간 ${to - from + 1}년이었다.</li>`;
    const title = STORY.bookTitle(e.age).split(", ");
    const box = $("sceneBox");
    box.innerHTML = `<section class="chap${reduced() ? "" : " turn"}"><div class="no">통장 ${vol}권</div><h2>${esc(title[0])},<br>${esc(title[1] || "")}</h2>
      <div class="faces"><figure><canvas id="cf1" width="64" height="64"></canvas>${from}세</figure><span class="arrow" aria-hidden="true">→</span><figure><canvas id="cf2" width="64" height="64"></canvas>${e.age}세</figure></div></section>
      <div class="sum"><div><span>지난 권(${from}~${to}세)에 들어온 돈</span><span class="dot">${manS(S.dec.in)}</span></div>
      <div><span>나간 돈</span><span class="dot" style="color:var(--out)">${manS(S.dec.out)}</span></div>
      <div><span>그중 세금과 4대보험</span><span class="dot">${manS(S.dec.tax)}</span></div>
      <div><span>지금 내 순자산(집 포함)</span><span class="dot">${manS(mine)}</span></div>
      <div><span>같은 나이대 가구 평균</span><span class="dot">${manS(avg)}</span></div></div>
      <ul class="big3">${evs}</ul>
      <div class="stack" style="margin-top:14px"><button class="btn" id="cNext">새 통장 펴기</button><button class="textbtn" id="cSkip">장 넘김은 이제 건너뛰기</button></div>
      <p class="fine" style="margin-top:8px">평균은 가구주 나이대별 가구 평균 순자산이에요(${D.assets.yr}, 가계금융복지조사).</p>`;
    settle(box.firstElementChild, ["turn"], 700);
    CARD.portrait($("cf1").getContext("2d"), 0, 0, 64, S.opt.seed, Math.max(from, e.age - 10));
    CARD.portrait($("cf2").getContext("2d"), 0, 0, 64, S.opt.seed, e.age);
    const go = (skip) => { stop(); if (skip) S.skipChap = true; box.innerHTML = ""; step(); };
    $("cNext").onclick = () => go(false); $("cSkip").onclick = () => go(true);
    box.firstElementChild.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
    $("cNext").focus({ preventScroll: true });
    // "빠르게"를 켜 둔 사람은 장 넘김에서 오래 멈추지 않는다
    if (S.fast) S.timer = setTimeout(() => go(false), 2500);
  }

  // ── 마지막 장 ───────────────────────────────────────────────
  function stat(k, v) { return `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div></div>`; }
  function kmongBox(s) {
    const k = (s.flags.lostJob > 0 && KMONG.quit.url) ? KMONG.quit : S.opt.job === "min" ? KMONG.parttime : KMONG.salary;
    if (!k || !k.url) return "";
    return `<div class="kbox">실제 내 숫자로 계산해 보고 싶다면 <a href="${k.url}" target="_blank" rel="sponsored noopener">${esc(k.t)}</a><small>제휴 광고가 아니에요. 이 페이지를 만든 사람의 크몽 상품이에요.</small></div>`;
  }
  function shareText(s, pl) {
    const url = shareUrl();
    if (pl && !pl.early) return "한국 통계로 내 통장 평생을 돌려 봤더니 65세에 " + manS(s.snap[65]) + " 원, " + pl.n.toLocaleString("ko-KR") + "명 중 " + pl.rank.toLocaleString("ko-KR") + "번째였다 👉 " + url;
    return "한국 통계로 내 통장 평생을 돌려 봤더니 " + (s.endAge - s.startAge + 1) + "년 치 통장이 나왔다 👉 " + url;
  }
  function canvasBlob(cv) { return new Promise((res) => { try { cv.toBlob((b) => res(b), "image/png"); } catch (e) { res(null); } }); }
  function download(cv, name) {
    try { const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = name; document.body.appendChild(a); a.click(); a.remove(); return true; } catch (e) { return false; }
  }
  function showFinal(s) {
    stop();
    const who = whoName(), copt = Object.assign({}, S.opt, { name: S.name });
    const pl = CARD.place(s, S.opt), epi = ct(CARD.epitaph(s)), wh = CARD.who(s, S.opt);
    const hand = s.gross - s.tax - s.insure, pct = (v) => s.gross > 0 ? (v / s.gross * 100) : 0;
    const band = (age) => age < 40 ? "39세 이하" : age < 50 ? "40대" : age < 60 ? "50대" : "60세 이상";
    const fresh = S.shared ? [] : addStamps(STORY.earned(s));
    const got = STORY.earned(s);

    let h = `<div class="card plain"><img id="fImg" alt="${esc(who)} 님의 통장 기록 카드. ${s.startAge}세부터 ${s.endAge}세까지의 요약이에요." style="display:block;width:100%;height:auto;border-radius:6px"><canvas id="fCanvas" class="hide"></canvas><canvas id="fCanvas2" class="hide"></canvas>
      <div class="stack" style="margin-top:10px"><button class="btn" id="fShare">공유하기</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn line" id="fCard" style="font-size:15px;padding:12px 6px">카드 저장(4:5)</button><button class="btn line" id="fStory" style="font-size:15px;padding:12px 6px">스토리용 저장</button></div></div>
      <input id="fUrl" readonly aria-label="공유 주소" class="tin" style="margin-top:10px;font:13px var(--mono);color:var(--sub)">
      <p class="fine" id="fMsg" role="status" style="min-height:1.4em;margin:6px 0 0"></p>
      <p class="fine" style="margin:4px 0 0">${S.name ? "" : "카드의 이름은 흔한 성과 이름에서 무작위로 뽑은 것이고 실제 인물이 아니에요. "}주소에는 씨앗 번호, 시작 조건, 고른 번호만 들어가요. 받은 사람은 같은 통장을 그대로 넘겨 볼 수 있어요.</p></div>`;
    h += `<div class="stack" style="margin-top:14px"><button class="btn big" id="fAgain">${S.shared ? "나도 통장 만들기" : "다른 인생 살아 보기"}</button></div>`;

    h += `<div class="card"><div class="fine">마지막 장</div><h2 style="font-size:22px">${esc(who)} 님의 통장은 ${s.endAge}세에서 멈췄어요</h2><p class="epi">“${esc(epi)}”</p>
      <p style="margin:10px 0 0">${esc(wh.born)}에서 태어나 ${esc(wh.live)}에서 통장을 덮었어요. 최종 학력은 ${esc(PLACE.EDU[PLACE.edu(s.seed, s.startAge)])}. ${s.startAge}세 첫 월급날부터 ${s.years}년 동안 찍힌 통장이에요. 사망원인통계에서 이 나이대에 맞춰 뽑힌 원인 분류는 ‘${CARD.CAUSE[s.cause]}’${s.cause === "unspec" ? "(원인이 뚜렷이 적히지 않은 경우를 모은 분류)" : ""}. 통계 확률로 뽑은 결과이고, 누구의 앞날을 말하는 것이 아니에요. 의료 상담도 아니에요.</p></div>`;

    // 같은 조건으로 미리 돌린 판들 가운데 내 자리
    if (pl) {
      if (!pl.early) {
        const hg = CARD.histogram(pl.row, s.snap[65]);
        h += `<div class="card"><h3>같은 조건 ${pl.n.toLocaleString("ko-KR")}명 중 나는</h3><div class="bigmoney">${pl.rank.toLocaleString("ko-KR")}번째</div>
          <div class="hist" role="img" aria-label="65세 순자산 분포. 내 자리는 ${pl.n.toLocaleString("ko-KR")}명 중 ${pl.rank.toLocaleString("ko-KR")}번째예요.">${hg.bins.map((b, i) => `<i class="${i === hg.mine ? "me" : ""}" style="height:${Math.max(3, Math.round(b * 100))}%"></i>`).join("")}</div>
          <div class="histx"><span>${manS(hg.lo * 1e4)}</span><span>65세 순자산(집 포함)</span><span>${manS(hg.hi * 1e4)}</span></div>
          <p class="fine" style="margin-top:8px">${s.startAge}세·${CARD.JOB[S.opt.job]}·${ro(D.housing.regions[S.opt.region])} 시작한 통장 ${pl.n.toLocaleString("ko-KR")}개를 미리 돌려 둔 분포예요(고르는 장면은 무작위). 막대는 아래 1%부터 위 1%까지를 20칸으로 나눈 것이고, 순위는 순자산이 많은 순서예요.</p></div>`;
      } else h += `<div class="card"><h3>같은 조건의 통장들과 견주면</h3><p>같은 조건으로 시작한 통장 ${pl.n.toLocaleString("ko-KR")}개 가운데 65세 전에 멈춘 통장은 ${pl.earlyPct}%예요. 이 통장도 그 안에 들어요.</p></div>`;
    }
    // 친구와 나란히
    if (S.friend && !S.shared) {
      const f = S.friend, fp = CARD.place(f.s, f.opt);
      const line = (k, a, b) => `<tr><td>${k}</td><td>${a}</td><td>${b}</td></tr>`;
      const n65 = (x) => x.snap[65] != null ? man(x.snap[65]) : "65세 전에 멈춤";
      const rk = (p) => p && !p.early ? p.rank.toLocaleString("ko-KR") + "번째" : "-";
      h += `<div class="card"><h3>친구 통장과 나란히 보기</h3><table class="cmp"><tr><th></th><th>내 통장</th><th>${esc(CARD.nameOf(f.opt.seed))}</th></tr>
        ${line("통장 기간", s.startAge + "→" + s.endAge + "세", f.s.startAge + "→" + f.s.endAge + "세")}${line("65세 순자산", n65(s), n65(f.s))}${line("같은 조건 순위", rk(pl), rk(fp))}${line("평생 월급", man(s.gross), man(f.s.gross))}${line("국민연금(월)", s.npsMonthly ? man(s.npsMonthly) : "-", f.s.npsMonthly ? man(f.s.npsMonthly) : "-")}</table>
        <p class="fine" style="margin-top:8px">순위는 각자 자기 시작 조건 안에서 매긴 것이에요. 친구 통장은 받은 주소의 씨앗과 선택으로 이 브라우저에서 다시 계산했어요.</p>
        <div class="stack" style="margin-top:10px"><button class="btn line" id="fCmp">비교 카드 저장</button></div></div>`;
    }
    // 이번에 받은 도장
    if (got.length) {
      h += `<div class="card"><h3>이 통장이 남긴 도장 ${got.length}개</h3><div class="stamps">${got.map((id) => { const st = STORY.STAMPS.find((x) => x.id === id); return `<div class="st${st.legend ? " legend" : ""}${fresh.indexOf(id) >= 0 ? " new" : ""}" title="${esc(st.d)}">${esc(st.t)}</div>`; }).join("")}</div>
        <p class="fine" style="margin-top:8px">${S.shared ? "받은 통장의 도장은 내 도장 모음에 들어가지 않아요." : (fresh.length ? "새 도장 " + fresh.length + "개를 모았어요. " : "") + "도장은 이 브라우저에만 저장돼요. 표지에서 다시 볼 수 있어요."}</p></div>`;
    }

    h += `<div class="card"><h3>평생 받은 월급 (세전)</h3><div class="bigmoney">${man(s.gross)}</div>
      <div class="split" role="img" aria-label="월급이 나뉜 비율"><i style="width:${pct(s.tax)}%;background:#8a3b12"></i><i style="width:${pct(s.insure)}%;background:#c98a2b"></i><i style="width:${pct(hand)}%;background:#0c7a57"></i></div>
      <div class="legend"><span style="--c:#8a3b12">소득세·지방소득세 ${man(s.tax)}</span><span style="--c:#c98a2b">4대보험 ${man(s.insure)}</span><span style="--c:#0c7a57">통장에 들어온 돈 ${man(hand)}</span></div>
      <div class="grid2">${stat(s.married ? "가족이 함께 쓴 생활비" : "쓴 생활비", man(s.spend))}${stat("그중 월세", man(s.rent))}
      ${s.tutoring ? stat("자녀 사교육비", man(s.tutoring)) : ""}${s.college ? stat("자녀 대학 등록금", man(s.college)) : ""}${stat("받은 퇴직금", man(s.severance))}${stat("받은 국민연금", man(s.pension))}
      ${stat("예금 이자", man(s.interest))}${stat("낸 대출 이자", man(s.loanInterest))}${s.spouseNet ? stat("배우자가 번 돈(세후)", man(s.spouseNet)) : ""}${s.benefit ? stat("받은 구직급여", man(s.benefit)) : ""}
      ${s.carNet ? stat("차에 든 돈(가정)", man(-s.carNet)) : ""}${(s.extraNet - s.carNet) ? stat("갑자기 생긴 일(가정)", (s.extraNet - s.carNet > 0 ? "+" : "") + man(s.extraNet - s.carNet)) : ""}
      ${stat("마지막 잔액", man(s.savings))}${stat("집 포함 순자산", man(s.net))}</div></div>`;

    const rowsCmp = [30, 40, 50, 65].filter((a) => s.snap[a] != null).map((a) => `<tr><td>${a}세</td><td>${man(s.snap[a])}</td><td>${man(D.assets.byAge[band(a)].net * 1e4)}</td></tr>`).join("");
    if (rowsCmp) h += `<div class="card"><h3>같은 나이대 통계와 견주면</h3><table class="cmp"><tr><th>나이</th><th>이 통장의 순자산</th><th>가구 평균 순자산</th></tr>${rowsCmp}</table>
      <p class="fine" style="margin-top:8px">평균은 가구주 나이대별 가구 평균이에요(${D.assets.yr}, 가계금융복지조사). 평균은 자산이 많은 가구가 끌어올려서 가운데 가구(순자산 중앙값 ${man(D.assets.medianNet * 1e4)})보다 훨씬 높아요.</p>
      <p class="fine">이 통장은 지금의 임금과 제도로 수십 년을 거의 쉬지 않고 일한 삶이에요. 그래서 60세 무렵부터는 통계 평균보다 많게 나오는 편이에요. 통계 속 60세 이상 가구는 임금이 지금보다 낮던 때에 일했고, 오래 일을 쉰 가구도 들어 있어요.</p></div>`;

    if (s.endAge >= 65) h += `<div class="card"><h3>연금</h3><p>국민연금을 ${s.pYears}년 냈고, 65세부터 매달 <b>${won(s.npsMonthly)}</b>을 받았어요. 지금 노령연금을 받는 사람들의 평균은 월 ${won(D.pension.avgMonthly)}이에요(${D.pension.avgYr}).</p>${s.zeroAge ? `<p>${s.zeroAge}세에 모아 둔 돈을 다 쓰고, 그 뒤로는 연금으로만 살았어요. 은퇴 나이대(66세 이상)의 상대적 빈곤율은 ${D.elderly.povertyRate66}%예요(2024년).</p>` : ""}</div>`;
    else h += `<div class="card"><h3>연금</h3><p>연금을 받기 시작하는 65세 전에 통장이 멈췄어요. 실제로는 유족연금이나 반환일시금 제도가 있지만 이 통장에는 계산하지 않았어요.</p></div>`;

    const picks = s.history.filter((x) => x.n > 1);
    if (picks.length) h += `<div class="card"><h3>내가 고른 것</h3><ol style="padding-left:20px;margin:6px 0;font-size:14px">${picks.map((x) => `<li>${x.age}세 · ${esc(ct(x.pick))}</li>`).join("")}</ol></div>`;

    h += `<div class="card links"><h3>이 삶에 나온 숫자, 내 숫자로 바꿔 보기</h3>${linkHtml("salary", 1)}${linkHtml("retire", 1)}${linkHtml("saving", 1)}${linkHtml("convert", 1)}${linkHtml("leave", 1)}${linkHtml("blog", 1)}</div>`;
    h += `<div class="card"><h3>도움받을 곳</h3>${(s.flags.minus || s.zeroAge) ? helpHtml("money") : ""}${s.flags.lostJob ? helpHtml("job") : ""}${s.cancer ? helpHtml("health") : ""}${helpHtml("mind")}<p class="fine">전화번호는 ${D.checked}에 각 기관 누리집에서 확인했어요.</p></div>`;
    h += `<div class="stack" style="margin-top:16px"><button class="btn line" id="fSame">같은 조건으로 한 번 더</button><button class="btn line" id="fBook">이 통장 다시 넘겨 보기</button><button class="textbtn" data-src>출처와 가정 보기</button></div>`;
    h += `<div class="more"><b>만든 사람의 다른 것들</b><div>${moreHtml()}</div></div>`;
    h += kmongBox(s);

    $("vFinal").innerHTML = h;
    $("vFinal").querySelectorAll("h3").forEach((el) => { const m = H3_PIX.find((x) => el.textContent.indexOf(x[0]) >= 0); if (m) el.insertAdjacentHTML("afterbegin", pix(m[1])); });
    bindMore($("vFinal"));
    show("vFinal");
    let ok = true;
    try { CARD.draw($("fCanvas"), s, copt); $("fImg").src = $("fCanvas").toDataURL("image/png"); } catch (e) { ok = false; $("fImg").classList.add("hide"); }
    const url = shareUrl(), msg = (t) => { $("fMsg").textContent = t; };
    $("fUrl").value = url; $("fUrl").onfocus = () => $("fUrl").select();
    const copy = () => {
      const done = (y) => msg(y ? "주소를 복사했어요. 붙여 넣어 보내면 돼요." : "복사가 막혀 있어요. 아래 주소를 길게 눌러 복사해 주세요.");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => done(true), () => { $("fUrl").select(); done(false); });
      else { $("fUrl").select(); let y = false; try { y = document.execCommand("copy"); } catch (e) {} done(y); }
    };
    $("fShare").onclick = async () => {
      gc("event-share");
      const text = shareText(s, pl);
      if (navigator.share) {
        try {
          const blob = ok ? await canvasBlob($("fCanvas")) : null;
          const file = blob && window.File ? new File([blob], "tongjang.png", { type: "image/png" }) : null;
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: text });
          else await navigator.share({ text: text });
          return;
        } catch (e) { if (e && e.name === "AbortError") return; }
      }
      copy();
    };
    $("fCard").onclick = () => { gc("event-save-card"); msg(ok && download($("fCanvas"), "통장일대기_" + s.endAge + "세.png") ? "카드를 저장했어요. 저장이 안 되면 위 그림을 길게 눌러 저장해 주세요." : "그림을 만들지 못했어요."); };
    $("fStory").onclick = () => { gc("event-save-story"); let y = false; try { CARD.drawStory($("fCanvas2"), s, copt); y = download($("fCanvas2"), "통장일대기_스토리_" + s.endAge + "세.png"); } catch (e) {} msg(y ? "스토리용 세로 카드를 저장했어요." : "그림을 만들지 못했어요."); };
    if ($("fCmp")) $("fCmp").onclick = () => { let y = false; try { CARD.drawCompare($("fCanvas2"), { s: s, opt: copt }, S.friend); y = download($("fCanvas2"), "통장일대기_나란히.png"); } catch (e) {} msg(y ? "비교 카드를 저장했어요." : "그림을 만들지 못했어요."); };
    $("fAgain").onclick = () => { gc("event-again"); if (S.shared) history.replaceState(null, "", location.pathname); clearSave(); S = null; show("vSetup"); };
    $("fSame").onclick = () => { gc("event-again"); const o = Object.assign({}, S.opt, { seed: newSeed() }), nm = S.name, fr = S.friend; if (S.shared) history.replaceState(null, "", location.pathname); start(o, nm); S.friend = fr; };
    $("fBook").onclick = () => { show("vPlay"); $("sceneBox").innerHTML = '<div class="stack" style="margin-top:14px"><button class="btn" id="bToFinal">마지막 장으로</button></div>'; $("bToFinal").onclick = () => show("vFinal"); };
    bindSrc();
  }

  // ── 출처와 가정 ─────────────────────────────────────────────
  function srcItem(title, value, o, url) {
    return `<div class="src"><b>${esc(title)}</b>${esc(value)}<br>${esc(o.src)} · ${esc(o.yr || "")} · <a href="${url || o.url}" target="_blank" rel="noopener">원문</a></div>`;
  }
  function buildSrc() {
    const w = D.wage, hs = D.housing, X = EX.X;
    let h = `<h2>출처와 가정</h2><p class="fine">통계와 법령 값은 ${D.checked}에 공식 원문에서 직접 확인한 것만 썼어요. 통계는 지금 값이 평생 이어진다고 보고 계산해요.</p>`;
    h += "<h3>일과 월급</h3>" +
      srcItem("최저임금", "시급 " + won(D.minWage.hourly) + ", 월 " + won(D.minWage.monthly) + "(209시간)", D.minWage) +
      srcItem("임금근로자 월평균소득(세전)", "전체 평균 " + w.mean + "만 원, 중위 " + w.median + "만 원 · 대기업 " + w.bySize.large + "만 원, 중소기업 " + w.bySize.sme + "만 원 · 20대 " + w.byAge[20] + "만, 30대 " + w.byAge[30] + "만, 40대 " + w.byAge[40] + "만, 50대 " + w.byAge[50] + "만, 60대 " + w.byAge[60] + "만 원", w) +
      srcItem("실업률", "전체 " + D.jobs.unemp + "%, 청년(15~29세) " + D.jobs.unempYouth + "%, 15~64세 고용률 " + D.jobs.employRate1564 + "%", D.jobs) +
      srcItem("첫 취업까지 걸린 기간", "평균 " + D.firstJob.monthsAll + "개월", D.firstJob) +
      srcItem("가장 오래 일한 일자리를 떠난 나이", "55~79세 취업 경험자의 " + D.mainJob.leftShare + "%가 그 일자리를 떠났고, 떠날 때 평균 " + D.mainJob.leftAge.toFixed(1) + "세 · 평균 근속 " + D.mainJob.tenure, D.mainJob);
    h += "<h3>월급에서 떼는 돈</h3>" +
      srcItem("4대보험 요율(근로자 몫)", "국민연금 4.75%(해마다 올라 2033년 6.5%), 건강보험 3.595%, 장기요양 0.4724%, 고용보험 0.9%", D.deduct) +
      srcItem("소득세", "근로소득 간이세액표, 지방소득세는 소득세의 10%", D.taxTable, "https://www.law.go.kr/법령/소득세법시행령") +
      srcItem("퇴직금", D.severance.rule, { src: D.severance.src, yr: "현행" }, "https://www.law.go.kr/법령/근로자퇴직급여보장법") +
      srcItem("구직급여", "평균임금의 60%, 하루 " + won(D.jobBenefit.minDaily) + "~" + won(D.jobBenefit.maxDaily) + ", 120~270일", D.jobBenefit);
    h += "<h3>결혼과 출산</h3>" +
      srcItem("연령별 혼인율", "30~34세 남 53.6건, 여 57.6건(해당 나이 인구 1천 명당) 등 · 평균 초혼 나이 남 " + D.marriage.firstAge.male + "세, 여 " + D.marriage.firstAge.female + "세", D.marriage) +
      srcItem("연령별 출산율", "30~34세 여자 1천 명당 73.1명 등 · 합계출산율 " + D.birth.tfr.toFixed(2) + "명", D.birth);
    h += "<h3>집과 자산</h3>" +
      srcItem("연소득 대비 집값(자가 가구, 중위수)", "수도권 " + hs.pir.metro + "배, 광역시 등 " + hs.pir.city + "배, 도 지역 " + hs.pir.prov + "배", hs) +
      srcItem("월소득 대비 월세(임차 가구, 중위수)", "수도권 " + hs.rir.metro + "%, 광역시 등 " + hs.rir.city + "%, 도 지역 " + hs.rir.prov + "%, 전국 " + hs.rir.all + "%", hs) +
      srcItem("가구 순자산", "평균 " + man(D.assets.meanNet * 1e4) + ", 중앙값 " + man(D.assets.medianNet * 1e4) + " · 가구주 39세 이하 " + man(21950e4) + ", 40대 " + man(48389e4) + ", 50대 " + man(55161e4) + ", 60세 이상 " + man(53591e4), D.assets);
    h += "<h3>생활비, 교육비, 금리</h3>" +
      srcItem("가구원 수별 월평균 소비지출", "1인 " + man(D.spendBySize.spend[0]) + ", 2인 " + man(D.spendBySize.spend[1]) + ", 3인 " + man(D.spendBySize.spend[2]) + ", 4인 " + man(D.spendBySize.spend[3]) + ", 5인 이상 " + man(D.spendBySize.spend[4]) + " (그중 교육 지출은 따로 빼고 사교육비 통계로 계산)", D.spendBySize) +
      srcItem("가구주 65세 이상 가구의 월평균 소비지출", man(D.spendByAge.over65) + " (평균 가구원 " + D.spendByAge.over65Size + "명)", D.spendByAge) +
      srcItem("소득 5분위별 소비지출", "처분가능소득이 가장 낮은 20%는 월 " + man(D.spendByQuintile.spend[0]) + ", 가장 높은 20%는 월 " + man(D.spendByQuintile.spend[4]) + "을 써요", D.spendByQuintile) +
      srcItem("학생 1인당 월평균 사교육비", "초등학교 " + D.tutoring.elementary + "만 원, 중학교 " + D.tutoring.middle + "만 원, 고등학교 " + D.tutoring.high + "만 원(사교육을 받지 않는 학생도 포함한 평균)", D.tutoring) +
      srcItem("고등학교 졸업자 진학률", D.college.rate + "%(졸업자 가운데 상급학교에 진학한 비율)", { src: D.college.rateSrc, yr: D.college.rateYr }, D.college.rateUrl) +
      srcItem("대학 등록금", "4년제 대학 학생 1인당 연간 평균 " + won(D.college.tuition) + " (국·공립 " + won(D.college.publicTuition) + ", 사립 " + won(D.college.privateTuition) + ")", D.college) +
      srcItem("기준금리와 물가안정목표", "기준금리 연 " + D.baseRate.rate.toFixed(2) + "%, 물가안정목표 " + D.baseRate.target + "%", D.baseRate);
    h += "<h3>은퇴</h3>" +
      srcItem("국민연금", "65세부터, 기본연금액 = 1.29 × (A + B) × 가입연수/20, A값 " + won(D.pension.A) + ", 10년 이상 내야 받음 · 지금 받는 사람 평균 월 " + won(D.pension.avgMonthly), D.pension, D.pension.formulaUrl) +
      srcItem("은퇴 나이대 빈곤율", "66세 이상 상대적 빈곤율 " + D.elderly.povertyRate66 + "%", D.elderly);
    h += "<h3>수명, 사망, 질병</h3>" +
      srcItem("나이별 사망확률", "완전생명표(1세별) 전체 · 기대수명 " + D.life.e0 + "년", D.life) +
      srcItem("사망원인", "나이대(5세)별 사망자 수를 통계의 큰 분류 11가지와 그 밖으로 나눔. 화면의 ‘원인 불명확(통계 분류)’은 통계의 ‘달리 분류되지 않은 증상, 징후(R00-R99)’ 분류예요", D.death) +
      srcItem("암 발생률", "모든 암, 나이대(5세)별 인구 10만 명당 발생자 수", D.cancer);

    h += "<h3>태어난 곳, 사는 시, 학력 (보여 주기만 해요)</h3>" +
      srcItem("사는 시", "고른 권역(수도권 " + CITY.live.metro.length + "곳, 광역시 등 " + CITY.live.city.length + "곳, 도 지역 " + CITY.live.prov.length + "곳) 안에서 시·군의 주민등록 인구 비율로 뽑아요", CITY.liveSrc) +
      srcItem("태어난 곳과 태어날 때 성별", "시·군별 출생아 수 비율로 뽑아요. 성별은 출생 성비(남 " + CITY.sex.m.toLocaleString("ko-KR") + "명, 여 " + CITY.sex.f.toLocaleString("ko-KR") + "명)로 뽑아요", CITY.bornSrc) +
      "<ul>" + [
        "사는 시는 인구 비율로 뽑은 것이고, 집값·임금 계산은 권역 평균이에요. 같은 권역이면 어느 시가 나와도 계산은 같아요. 발령으로 옮길 때도 같은 권역 안의 다른 시로 옮겨요.",
        "서울·인천과 광역시는 시 이름으로, 경기도와 도 지역은 시·군 이름으로 보여 줘요. 2026년 전남·광주 통합으로 사는 곳 이름이 ‘전남광주’로 나와요. 2026년 주민등록 자료의 전남광주통합특별시는 ‘전남광주 목포시’, ‘전남광주 북구’처럼 보여 줘요. 2025년 출생 자료는 옛 이름(광주광역시, 전남)으로 나와요.",
        "태어날 때 성별은 태어나기 장에만 나와요. 월급·결혼·수명 계산과 초상화에는 쓰지 않아요(계산은 남녀 전체 통계를 써요).",
        "최종 학력은 고등학교 졸업자 진학률(" + D.college.rate + "%)의 확률로 ‘대학 진학(전문대 포함)’ 또는 ‘고등학교 졸업’을 뽑아요. 19~20세에 첫 월급을 받는 통장은 고등학교 졸업으로 봐요(가정). 전문대와 4년제는 나누지 않았어요.",
        "학력에 따라 첫 일자리나 월급이 달라지지 않아요. 학력별 일자리·임금 통계는 원문을 확인하지 못해 계산에 연결하지 않았어요.",
        "태어난 해의 통계가 아니라 가장 최근 통계의 비율을 그대로 썼어요. 태어난 곳과 사는 곳은 서로 따로 뽑아요."
      ].map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>";
    h += "<h3>우리가 정한 가정</h3><ol>" + [
      "금액은 모두 2026년 돈 가치예요. 임금·물가·집값이 오르는 것은 넣지 않았고, 이자는 기준금리에서 물가안정목표를 뺀 연 " + (TJ.REAL * 100).toFixed(1) + "%로 계산해요. 이자에 붙는 세금은 계산하지 않아요.",
      "내 월급 = 나이대별 평균소득을 이은 선 × 일자리 규모 비율(대기업 " + TJ.SIZE.large.toFixed(2) + ", 중소기업 " + TJ.SIZE.sme.toFixed(2) + ") × 사람마다 다른 값(±" + pc(A.personalSpread) + "%) × 해마다 흔들림(±" + pc(A.yearlyNoise) + "%). 최저임금 일자리는 옮기기 전까지 최저임금이에요. 신입 초봉 통계가 아니라 평균으로 만든 추정이에요.",
      "실업률을 한 해에 일자리를 잃을 확률로 봤어요. 쉬는 기간은 " + A.jobLossGap.fast + "개월 또는 " + A.jobLossGap.wait + "개월이에요.",
      "이직 제안은 한 해 " + pc(A.jobOfferProb) + "% 확률, 월급은 " + pc(A.jobOfferRaise[0]) + "~" + pc(A.jobOfferRaise[1]) + "% 올라요.",
      "혼인율과 출산율은 전체 인구 기준이라, 결혼하지 않은 사람·아이를 원하는 부부의 확률로 바꾸려고 배수(결혼 " + A.marryBoost + "배, 출산 최대 " + A.birthBoost.want + "배)를 곱했어요. 성별은 묻지 않고 남녀 평균을 써요. 이혼과 배우자의 죽음은 다루지 않아요.",
      "배우자는 고용률(" + D.jobs.employRate1564 + "%)의 확률로 일하고, 일하면 나이대 평균소득을 60세까지 벌어요. 결혼할 때 배우자 저축은 내 저축의 절반으로 봤어요.",
      "생활비는 가구원 수별 평균 소비지출(교육 지출 제외)에서 시작해요. 우리 집 소득이 같은 가구원 수 평균보다 많거나 적으면 그 비율의 " + A.spendElastic + "제곱만큼 더 쓰거나 덜 써요(소득이 2배면 지출은 약 1.6배). 이 숫자는 소득 5분위 자료를 보고 정한 가정이에요. '넉넉하게'는 10% 더, '아껴서'는 10% 덜 써요. 아이는 " + A.kidLeavesAt + "세에 독립하고, 최소 생활비는 최저임금 월액의 " + pc(A.spendFloorShare) + "% × √가구원 수예요.",
      "자녀 사교육비는 초등학생(7~12세), 중학생(13~15세), 고등학생(16~18세) 나이에 전체 학생 1인당 평균을 그대로 넣어요. 아이가 19세가 되면 고등학교 졸업자 진학률(" + D.college.rate + "%)의 확률로 대학에 가고, 가면 4년 동안 4년제 대학 평균 등록금을 내요. 전문대 등록금과 장학금은 따로 계산하지 않아요. 결혼 비용, 영유아 보육비, 대학생 생활비는 넣지 않았어요.",
      "월세는 생활비 안에서 지역별 월세 비율만큼으로 보고, 전국 평균과의 차이만큼 생활비가 달라져요. 전세는 다루지 않아요.",
      "집은 집값의 " + pc(A.downPayment) + "%를 모으면 살 수 있고, 한 해 갚는 돈이 세후 소득의 " + pc(A.loanBurdenMax) + "%를 넘으면 살 수 없어요. 대출 금리는 기준금리 + " + A.loanSpread + "%p, 최대 " + A.loanYears + "년 동안 같은 금액을 갚아요.",
      "암 진단을 받으면 그해 " + A.illnessRestMonths + "개월 일을 쉰다고 봤어요. 치료비와 보험금은 계산하지 않아요.",
      "오래 다닌 일터를 떠나는 나이는 고령층 부가조사를 따라요. " + D.mainJob.leftShare + "%는 " + A.mainJobEnd + "세 전에 떠나고(평균 " + D.mainJob.leftAge.toFixed(1) + "세가 되도록 " + A.exitFrom + "~" + (A.mainJobEnd - 1) + "세에 고르게 흩어 놓음, 흩어 놓는 방식은 가정), 나머지는 " + A.mainJobEnd + "세에 떠나요. 다시 일하면 중소기업 비율의 나이대 평균 임금으로 " + A.workEnd + "세까지 일해요. 퇴직금에 붙는 세금은 계산하지 않아요.",
      "은퇴 뒤 생활비는 같은 가구원 수 평균의 " + pc(TJ.RETIRE) + "%예요(가구주 65세 이상 가구의 소비지출을 가구원 수에 맞춰 비교한 값). 모은 돈을 다 쓰면 들어오는 돈 안에서만 쓰고, 65세부터는 마이너스 통장이 더 늘지 않는다고 봤어요. 기초연금과 퇴직연금, 개인연금은 계산하지 않아요.",
      "마이너스 통장 한도는 최저임금 " + A.minusLimitMonths + "개월분이에요. 한도를 넘게 되면 집이 있으면 팔아서 대출을 갚고, 그래도 넘으면 한도 안에서만 써요. 생계급여·아동수당·근로장려금 같은 복지 제도는 계산하지 않아요.",
      "주식·코인 같은 투자는 넣지 않았어요."
    ].map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>";

    h += "<h3>통계가 아닌 장면 (전부 가정)</h3><ul>" + [
      "소소한 하루(재미 장면)는 통장 금액을 바꾸지 않아요. 통계 계산과 따로 도는 주사위로 뽑아서, 재미 장면이 있어도 월급·사건·수명은 달라지지 않아요.",
      "갑자기 생긴 일(돌발)의 금액은 우리가 정한 값이에요: 친구가 갚은 돈 +" + man(X.friend) + ", 깜짝 성과급 +한 달 월급, 잊고 있던 적금 +" + man(X.oldbank) + ", 퀴즈 상금 +" + man(X.quiz) + "(절반 확률), 경품 +" + man(X.prize) + ", 천장 수리 −" + man(X.leakShare) + "(나눠 냄) 또는 −" + man(X.leakFix) + ", 접촉 사고 자기부담금 −" + man(X.bumpIns) + ", 새 세탁기 −" + man(X.washerNew) + ", 축의금 −" + man(X.weddings) + ", 수입차 수리비 −" + man(X.importFix) + "(수입차가 있는 판에만), 발령 이사비 −" + man(X.moveCost) + "과 월급 +" + pc(X.moveRaise) + "%, 고양이 수술 −" + man(X.pet) + ", 부모님 병원비 −" + man(X.parentsAll) + " 또는 −" + man(X.parentsShare) + ", 동창 사업 −" + man(X.biz) + "(다섯에 하나만 원금을 돌려받음).",
      "돌발도 따로 도는 주사위를 써요. 다만 잔액이 달라지면 집을 살 수 있는 때 같은 것이 조금 달라질 수 있어요. 무작위 3,000판에서 돌발을 넣기 전과 넣은 뒤의 65세 순자산 평균 차이는 0.3%였어요.",
      "차와 오토바이: 값은 " + Object.keys(X.cars).map((k) => EX.CAR[k].kind + " " + man(X.cars[k].price)).join(", ") + ". 보험·기름·수리로 한 해 " + man(X.cars.scooter.keep) + "~" + man(X.cars.importedSuv.keep) + "(슈퍼카 " + man(X.cars.superc.keep) + ")이 나가고, 차 값은 해마다 " + pc(1 - X.carDep) + "%씩 떨어져요. 할부는 5년, 값의 " + pc(X.instAdd) + "%를 더 내요. " + X.carLife + "년을 타면 폐차해요. 수입차는 예금이 차 값 이상이면 현금으로, 값의 " + pc(X.importInst) + "% 이상이면 할부로 살 수 있는 선택지가 나와요(무리한 선택도 고를 수 있어요). 차를 살지는 한 판에 " + X.carAskMax + "번까지 물어요. 겹쳐 계산하지 않으려고, 평균 소비지출에 들어 있는 자가용 지출(자동차 구입, 유지·수리, 연료, 주차·통행료 같은 개인교통 서비스. 2025년 가계동향조사, 가구원 수별로 월 " + man(D.spendBySize.car[0]) + "~" + man(D.spendBySize.car[4]) + ")은 기본 생활비에서 빼고, 차를 산 해에만 위의 차 비용을 따로 더해요. 차가 없는 해에는 대중교통 몫(철도·버스·택시 등)만 남아요. 무작위 3,000판에서 통계 장면만 돌린 것과 재미·돌발·차를 모두 넣은 것의 65세 순자산은 평균 +0.6%, 중앙값 −0.5% 차이였어요.",
      "등장하는 차·오토바이 이름은 모두 지어낸 이름이에요. 실제 회사나 차와 관계가 없어요.",
      "'같은 조건 몇 명 중 몇 번째'는 시작 조건(나이·일자리·사는 곳)마다 " + (window.TJ_DIST ? window.TJ_DIST.n.toLocaleString("ko-KR") : "") + "판을 미리 돌려 둔 표에서 찾아요. 그 판들의 고르는 장면은 무작위로 골랐어요."
    ].map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>";
    h += `<h3>개인정보</h3><p class="fine">입력한 내용은 이 브라우저에서만 계산해요.${document.querySelector("script[data-goatcounter]") ? " 방문 수만 개인을 알 수 없게 세요(GoatCounter, 쿠키 없음)." : ""} 이어 보기 기록과 모은 도장은 이 브라우저에만 저장돼요.</p>`;
    h += '<p class="fine">통계는 국가데이터처 KOSIS 등의 공개 자료를 출처를 밝히고 이용했어요. 이 페이지는 각 기관과 관계가 없고, 기관이 보증하는 내용도 아니에요.</p>';
    $("dBody").innerHTML = h;
  }
  function openDlg() { if (S && S.timer) { stop(); S.resumeAfter = true; } $("dSrc").showModal(); $("dSrc").scrollTop = 0; }
  function bindSrc() { document.querySelectorAll("[data-src]").forEach((b) => { b.onclick = () => { buildSrc(); openDlg(); }; }); }
  $("dClose").onclick = () => $("dSrc").close();
  $("dSrc").addEventListener("close", () => { if (S && S.resumeAfter) { S.resumeAfter = false; if (!S.game.pendingScene && !$("sceneBox").innerHTML) schedule(400); } });
  $("dSrc").addEventListener("click", (e) => { if (e.target === $("dSrc")) $("dSrc").close(); });

  // ── 도장 모음 ───────────────────────────────────────────────
  function renderShelf() {
    const have = myStamps(), all = STORY.STAMPS;
    $("shelfT").textContent = "모은 도장 " + have.length + " / " + all.length;
    $("shelfBox").open = have.length > 0;
    const shown = all.filter((s) => have.indexOf(s.id) >= 0).slice(0, 5);
    let h = shown.map((s) => `<div class="st${s.legend ? " legend" : ""}">${esc(s.t)}</div>`).join("");
    for (let i = shown.length; i < 6; i++) h += '<div class="st no">?</div>';
    $("shelf").innerHTML = h;
  }
  $("bStamps").onclick = () => {
    const have = myStamps();
    $("dBody").innerHTML = `<h2>도장 모음 ${have.length} / ${STORY.STAMPS.length}</h2><p class="fine">통장을 끝낼 때마다 그 삶이 남긴 도장이 모여요. 이 브라우저에만 저장돼요.</p><div class="stlist">` +
      STORY.STAMPS.map((s) => { const y = have.indexOf(s.id) >= 0; return `<div class="st${y ? (s.legend ? " legend" : "") : " no"}">${y ? esc(s.t) : "?"}</div><div>${y ? esc(s.d) : (s.legend ? "아주 드물게 나오는 전설 도장이에요" : "아직 모으지 못했어요")}</div>`; }).join("") + "</div>";
    openDlg();
  };

  // ── 표지와 개설 ─────────────────────────────────────────────
  function chips(id) {
    const box = $(id);
    box.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => box.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === c ? "true" : "false"))));
    return () => box.querySelector('.chip[aria-pressed="true"]').dataset.v;
  }
  const getJob = chips("cJob"), getRegion = chips("cRegion");
  let FRIEND = null; // 공유 주소로 받은 친구 통장
  const begin = (opt, name) => { start(opt, name); if (FRIEND) S.friend = FRIEND; };
  $("iAge").addEventListener("input", () => { $("oAge").textContent = $("iAge").value + "세"; });
  $("bMake").onclick = () => show("vSetup");
  $("bBack").onclick = () => show("vCover");
  $("bStart").onclick = () => begin({ seed: newSeed(), age: Number($("iAge").value), job: getJob(), region: getRegion() }, $("iName").value.trim());
  $("bRandom").onclick = () => { const r = Math.random; begin({ seed: newSeed(), age: 19 + Math.floor(r() * 16), job: ["min", "sme", "sme", "large"][Math.floor(r() * 4)], region: ["metro", "city", "prov"][Math.floor(r() * 3)] }, ""); };
  $("tPause").onclick = () => {
    if (!S) return;
    S.paused = !S.paused;
    $("tPause").textContent = S.paused ? "계속" : "멈춤"; $("tPause").setAttribute("aria-pressed", S.paused ? "true" : "false");
    if (!S.paused && !S.game.pendingScene && !$("sceneBox").innerHTML) schedule(200); else stop();
  };
  $("tSpeed").onclick = () => { if (!S) return; S.fast = !S.fast; $("tSpeed").textContent = S.fast ? "천천히" : "빠르게"; $("tSpeed").setAttribute("aria-pressed", S.fast ? "true" : "false"); if (S.timer) schedule(150); };

  const saved = load();
  if (saved && saved.opt && !saved.done) { $("bResume").classList.remove("hide"); $("bResume").onclick = () => { start(saved.opt, saved.name, saved.picks, false, saved.carNick); if (FRIEND) S.friend = FRIEND; }; }
  const sh = parseShare(location.hash);
  if (sh && sh.old) {
    $("arrived").classList.remove("hide");
    $("arrived").innerHTML = "<b>예전에 만든 주소예요</b>그 뒤로 계산이 바뀌어 같은 통장을 다시 보여 줄 수 없어요. 새 통장을 만들어 보세요.";
  } else if (sh) {
    const fs = simulate(sh.opt, sh.picks);
    if (fs) {
      FRIEND = { s: fs, opt: sh.opt };
      const nm = CARD.nameOf(sh.opt.seed);
      $("arrived").classList.remove("hide");
      $("arrived").innerHTML = `<b>${esc(nm)} 님의 통장이 도착했어요</b>${fs.startAge}세에 시작해 ${fs.endAge}세까지 이어진 통장이에요. 내 통장도 만들면 마지막에 두 통장을 나란히 볼 수 있어요.
        <div class="stack" style="margin-top:10px"><button class="btn" id="bMine">내 통장도 만들고 나란히 보기</button><button class="btn line" id="bShared">받은 통장 넘겨 보기</button></div>
        <p class="fine" style="margin:8px 0 0">이름은 무작위로 붙인 것이고 실제 인물이 아니에요.</p>`;
      $("bMine").onclick = () => show("vSetup");
      $("bShared").onclick = () => start(sh.opt, "", sh.picks, true);
    }
  }
  if (document.querySelector("script[data-goatcounter]")) $("fPriv").textContent = "입력한 내용은 이 브라우저에서만 계산해요. 방문 수만 개인을 알 수 없게 세요(GoatCounter).";
  $("fChecked").textContent = D.checked;
  renderShelf();
  bindSrc();
  $("cMore").innerHTML = moreHtml(); bindMore($("cMore"));
  // ── 표지: 숫자 한 줄, 예시 통장 세 권(실제 엔진으로 그 자리에서 계산해 그린다), 표지 열림 ──
  const COVER_EX = [
    { opt: { seed: 6327, age: 27, job: "sme", region: "metro" }, picks: "1210001111101003010000", cap: "아이 둘, 33년을 일한 통장" },
    { opt: { seed: 47, age: 25, job: "large", region: "prov" }, picks: "11100101", cap: "마흔에 멈춘 통장" },
    { opt: { seed: 280, age: 25, job: "large", region: "prov" }, picks: "2001131011300100101000000", cap: "전설: 슈퍼카를 산 통장" }
  ];
  try {
    buildSrc();
    const nSrc = $("dBody").querySelectorAll(".src").length; $("dBody").innerHTML = "";
    const nCity = CITY.live.metro.length + CITY.live.city.length + CITY.live.prov.length;
    $("cNums").innerHTML = ["공식 통계 " + nSrc + "묶음", "시·군 " + nCity + "곳", "돌발 " + (EX.SUR.length + EX.LEGEND.length + 1) + "가지", "도장 " + STORY.STAMPS.length + "개"].map((t) => "<span>" + t + "</span>").join("");
  } catch (e) {}
  setTimeout(() => { const f = $("flap"); if (f) f.classList.add("gone"); }, 1300);
  setTimeout(() => {
    COVER_EX.forEach((x) => {
      try {
        const sm = simulate(x.opt, x.picks.split("").map(Number)); if (!sm) return;
        const fg = document.createElement("figure"), bt = document.createElement("button"), cv = document.createElement("canvas"), cap = document.createElement("figcaption");
        CARD.draw(cv, sm, x.opt); cap.textContent = x.cap; bt.setAttribute("aria-label", x.cap + " 통장 넘겨 보기");
        bt.appendChild(cv); fg.appendChild(bt); fg.appendChild(cap); $("cLives").appendChild(fg);
        bt.onclick = () => start(x.opt, "", x.picks.split("").map(Number), true);
      } catch (e) {}
    });
  }, 60);
  window.TJ_APP = { start: start, state: () => S, simulate: simulate, renderShelf: renderShelf };
})();
