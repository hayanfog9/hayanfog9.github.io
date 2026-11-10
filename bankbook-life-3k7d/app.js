// 통장 일대기 — 화면
(function () {
  const D = window.TJ_DATA, TJ = window.TJ, A = TJ.assume;
  const $ = (id) => document.getElementById(id);
  const KEY = "tongjang_v1";

  // 이어지는 곳. open: 공개일(그 전에는 "곧 열려요"로만 표시)
  const LINKS = {
    salary: { t: "월급 실수령액 계산기", s: "내 월급으로 계산해 보기", url: "https://hayanfog9.github.io/salary-calc-6w2p/" },
    convert: { t: "시급·월급·연봉 환산", s: "내 시급은 월급으로 얼마일까", url: "https://hayanfog9.github.io/wage-convert-4p6s/" },
    saving: { t: "예금·적금 이자 계산기", s: "이 적금, 만기에 얼마 받을까", url: "https://hayanfog9.github.io/saving-calc-3k8d/", open: "2026-11-11" },
    leave: { t: "연차수당 계산기", s: "남은 연차는 돈으로 얼마일까", url: "https://hayanfog9.github.io/leave-pay-8k2m/", open: "2026-12-22" },
    retire: { t: "퇴직금 계산기", s: "내 퇴직금 계산해 보기", url: "https://hayanfog9.github.io/retire-pay-6m3x/" },
    blogSalary: { t: "연봉 얼마면 한 달에 얼마 받을까", s: "블로그 글", url: "https://blog.naver.com/hayanfog/224456624432" },
    blogRetire: { t: "퇴직금 계산기 이야기", s: "블로그 글", url: "https://blog.naver.com/hayanfog/224466830123" },
    blog: { t: "JW 블로그", s: "계산기 만든 과정과 돈 계산 글", url: "https://blog.naver.com/hayanfog" }
  };
  // 크몽 연결은 통제실 확인 뒤 주소를 넣는다. 비어 있으면 화면에 나오지 않는다.
  // 마지막 장 맨 아래 작은 상자 1개. 판의 내용에 맞는 상품 하나만 보여 준다. url이 비어 있으면 상자를 만들지 않는다.
  const KMONG = {
    quit: { t: "퇴사 정산 퇴직금 실업급여 연차수당 엑셀 2026", url: "" }, // 크몽 승인 뒤 주소를 넣는다
    parttime: { t: "알바 급여 계산 엑셀 주휴수당 월급 실수령액 2026", url: "https://kmong.com/self-marketing/854102/XrLYSjbGe5" },
    salary: { t: "연봉 월급 실수령액 계산 + 연차 관리 엑셀 2026", url: "https://kmong.com/self-marketing/850459/4pddpuIPR3" }
  };
  function kmongBox(s, startJob) {
    // 실직이 있었던 판은 퇴사 정산(주소가 있을 때만), 그 밖에는 시작 일자리에 맞는 상품
    const k = (s.flags.lostJob > 0 && KMONG.quit.url) ? KMONG.quit : startJob === "min" ? KMONG.parttime : KMONG.salary;
    if (!k || !k.url) return "";
    return '<div class="kbox">실제 내 숫자로 계산해 보고 싶다면 <a href="' + k.url + '" target="_blank" rel="sponsored noopener">' + esc(k.t) + "</a><small>제휴 광고가 아니에요. 이 페이지를 만든 사람의 크몽 상품이에요.</small></div>";
  }

  const CAUSE = {
    neoplasm: "암 등 신생물", circ: "심장·뇌혈관 등 순환계통 질환", resp: "폐렴 등 호흡계통 질환",
    external: "사고 등 외부 요인", other: "그 밖의 질환"
  };
  const HELP_T = { money: "돈 문제로 막막할 때", job: "일자리를 잃었을 때", health: "큰 병을 진단받았을 때", mind: "마음이 힘들 때", pension: "내 연금이 궁금할 때" };

  // ── 표시 도구 ───────────────────────────────────────────────
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function man(v) { // 만 원 단위
    const neg = v < 0; let m = Math.round(Math.abs(v) / 1e4);
    const eok = Math.floor(m / 1e4), rest = m % 1e4;
    let s = eok > 0 ? eok.toLocaleString("ko-KR") + "억" + (rest ? " " + rest.toLocaleString("ko-KR") + "만" : "") : m.toLocaleString("ko-KR") + "만";
    return (neg ? "−" : "") + s + " 원";
  }
  const manS = (v) => man(v).replace(" 원", ""); // 통장 줄에 쓰는 짧은 표기
  const pc = (x) => Math.round(x * 1000) / 10;
  const won = (v) => Math.round(v).toLocaleString("ko-KR") + "원";
  function linkHtml(k) {
    const L = LINKS[k]; if (!L) return "";
    const today = new Date().toISOString().slice(0, 10);
    if (L.open && today < L.open) return '<span class="soon">' + esc(L.t) + " · " + Number(L.open.slice(5, 7)) + "월 " + Number(L.open.slice(8)) + "일에 열려요</span>";
    return '<a href="' + L.url + '" target="_blank" rel="noopener">' + esc(L.t) + " — " + esc(L.s) + "</a>";
  }
  function linkCard(k) {
    const L = LINKS[k]; if (!L) return "";
    const today = new Date().toISOString().slice(0, 10);
    if (L.open && today < L.open) return '<span class="soon">' + esc(L.t) + "<small>" + Number(L.open.slice(5, 7)) + "월 " + Number(L.open.slice(8)) + "일에 열려요</small></span>";
    return '<a href="' + L.url + '" target="_blank" rel="noopener">' + esc(L.t) + "<small>" + esc(L.s) + "</small></a>";
  }
  function helpHtml(k) {
    const list = D.help[k]; if (!list) return "";
    return '<div class="helpbox"><b>' + HELP_T[k] + "</b><ul>" + list.map((h) =>
      "<li>" + esc(h.name) + ' <a href="tel:' + h.tel.replace(/-/g, "") + '">' + h.tel + "</a>" + (h.note ? " (" + esc(h.note) + ")" : "") + "</li>").join("") + "</ul></div>";
  }

  // ── 상태 ────────────────────────────────────────────────────
  let S = null; // { opt, name, picks, game, timer, paused, fast, lastDecade }
  function save() {
    if (!S || S.shared) return; // 받은 통장은 내 저장을 덮어쓰지 않는다
    try { localStorage.setItem(KEY, JSON.stringify({ opt: S.opt, name: S.name, picks: S.picks, done: !!S.done })); } catch (e) {}
  }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function clearSave() { try { localStorage.removeItem(KEY); } catch (e) {} }

  function show(id) {
    ["vCover", "vSetup", "vPlay", "vFinal"].forEach((v) => $(v).classList.toggle("hide", v !== id));
    window.scrollTo(0, 0);
  }

  // ── 시작 ────────────────────────────────────────────────────
  function newSeed() { return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; }
  function start(opt, name, picks, shared) {
    stop();
    S = { opt: opt, name: name || "", picks: [], game: new TJ.Game(opt), paused: false, fast: false, lastDecade: null, replay: (picks || []).slice(), shared: !!shared };
    $("rows").innerHTML = ""; $("sceneBox").innerHTML = "";
    $("pWho").textContent = (S.name ? S.name + " 님" : "예금주") + " · " + D.housing.regions[opt.region];
    $("tPause").textContent = "멈춤"; $("tPause").setAttribute("aria-pressed", "false");
    $("tSpeed").textContent = "빠르게";
    show("vPlay");
    // 이어 보기: 저장된 선택을 그대로 다시 밟는다
    while (S.replay.length) {
      const e = S.game.next();
      if (e.type === "scene") { const i = S.replay.shift(); S.game.choose(i); S.picks.push(i); }
      else if (e.type === "year") addYear(e, false);
      else break;
    }
    if (shared) {
      // 받은 통장: 고르는 장면이 더 없으면 끝까지 한 번에 찍는다
      for (let n = 0; n < 200; n++) {
        if (S.game.pendingScene) break;
        const e = S.game.next();
        if (e.type === "scene") break;
        if (e.type === "year") addYear(e, false);
        else { S.done = true; showFinal(e.summary); return; }
      }
      if (S.game.pendingScene) return showScene(S.game.pendingScene);
    }
    save();
    step();
  }
  // 공유 주소: 씨앗·시작 조건·고른 번호만 담는다(이름은 담지 않음)
  const JOBC = { min: "m", sme: "s", large: "l" }, REGC = { metro: "m", city: "c", prov: "p" };
  function shareUrl() {
    const o = S.opt;
    return location.origin + location.pathname.replace(/index\.html$/, "") + "#t=1." + o.seed.toString(36) + "." + o.age + JOBC[o.job] + REGC[o.region] + "." + S.picks.join("");
  }
  function parseShare() {
    const m = /^#t=1\.([0-9a-z]{1,8})\.(\d{2})([msl])([mcp])\.([0-2]{0,60})$/.exec(location.hash || "");
    if (!m) return null;
    const age = Number(m[2]);
    if (age < 19 || age > 34) return null;
    const inv = (o, c) => Object.keys(o).find((k) => o[k] === c);
    return { opt: { seed: parseInt(m[1], 36) >>> 0, age: age, job: inv(JOBC, m[3]), region: inv(REGC, m[4]) }, picks: m[5].split("").map(Number) };
  }
  function stop() { if (S && S.timer) { clearTimeout(S.timer); S.timer = null; } }
  function schedule() {
    stop();
    if (!S || S.paused || S.done) return;
    const base = S.fast ? 260 : 1000;
    S.timer = setTimeout(step, S.game.age > 65 ? base * 0.6 : base);
  }
  function step() {
    if (!S) return;
    const e = S.game.next();
    if (e.type === "scene") return showScene(e);
    if (e.type === "year") { addYear(e, true); return schedule(); }
    S.done = true; save(); showFinal(e.summary);
  }

  // ── 통장 줄 ─────────────────────────────────────────────────
  function addYear(e, animate) {
    const rows = $("rows");
    const dec = Math.floor(e.age / 10) * 10;
    if (S.lastDecade !== dec) {
      S.lastDecade = dec;
      const h = document.createElement("div"); h.className = "decade"; h.textContent = dec + "대";
      rows.appendChild(h);
    }
    let tin = 0, tout = 0;
    const notes = [];
    let detail = "";
    e.lines.forEach((l) => {
      if (l.k === "note") { notes.push(l); return; }
      if (l.k === "in") tin += l.v; else tout += l.v;
      detail += '<div class="' + l.k + '"><span>' + esc(l.t) + '</span><span class="v">' + (l.k === "in" ? "+" : "−") + man(l.v) + "</span></div>";
    });
    const d = document.createElement("details");
    d.className = "yr" + (animate ? " new" : "");
    d.innerHTML = '<summary><span class="a">' + e.age + '세</span><span class="io"><span class="in">+' + manS(tin) + '</span><br><span class="out">−' + manS(tout) + '</span></span><span class="b' + (e.balance < 0 ? " neg" : "") + '">' + manS(e.balance) + '</span></summary><div class="lines">' + detail + "</div>";
    rows.appendChild(d);
    notes.forEach((n) => {
      const s = document.createElement("div");
      s.className = "stampline" + (n.help ? " warn" : "");
      s.innerHTML = esc(n.t) + (n.help ? helpHtml(n.help) : "");
      rows.appendChild(s);
    });
    $("pAge").textContent = e.age + "세 · 통장 " + (e.age - S.opt.age + 1) + "년째";
    $("pBal").textContent = man(e.balance);
    $("pNet").textContent = e.net !== e.balance ? "집 포함 순자산 " + man(e.net) : "";
    $("pBar").style.width = Math.min(100, (e.age - S.opt.age) / (90 - S.opt.age) * 100) + "%";
    if (animate) d.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  // ── 고르는 장면 ─────────────────────────────────────────────
  function showScene(e) {
    stop();
    let h = '<section class="scene" aria-live="polite"><div class="tag">' + e.age + "세 · 창구 안내</div><h2>" + esc(e.title) + "</h2><p>" + esc(e.text) + "</p>";
    if (e.slip) {
      const s = e.slip;
      h += '<table class="slip"><tr><td>세전 월급</td><td>' + won(s.gross) + "</td></tr>" +
        "<tr><td>국민연금</td><td>−" + won(s.pension) + "</td></tr><tr><td>건강보험</td><td>−" + won(s.health) + "</td></tr>" +
        "<tr><td>장기요양보험</td><td>−" + won(s.care) + "</td></tr><tr><td>고용보험</td><td>−" + won(s.emp) + "</td></tr>" +
        "<tr><td>소득세</td><td>−" + won(s.tax) + "</td></tr><tr><td>지방소득세</td><td>−" + won(s.local) + "</td></tr>" +
        '<tr class="sum"><td>통장에 들어온 돈</td><td>' + won(s.net) + "</td></tr></table>" +
        '<p class="small">2026년 요율과 국세청 근로소득 간이세액표(2026.3.1 시행)로 계산했어요. 비과세 수당은 없다고 봤어요.</p>';
    }
    if (e.compare) {
      h += '<table class="slip"><tr><td>지금 월급(세전)</td><td>' + won(e.compare.now) + "</td></tr><tr class=\"sum\"><td>제안받은 월급(세전)</td><td>" + won(e.compare.offer) + "</td></tr></table>";
    }
    if (e.home) {
      const m = e.home;
      h += '<table class="slip"><tr><td>집값</td><td>' + man(m.price) + "</td></tr><tr><td>내 돈</td><td>" + man(m.price - m.loan) + "</td></tr>" +
        "<tr><td>대출</td><td>" + man(m.loan) + "</td></tr>" + (m.loan > 0 ? '<tr class="sum"><td>한 해 갚는 돈 (' + m.years + "년)</td><td>" + man(m.pay) + "</td></tr>" : "") + "</table>" +
        '<p class="small">대출 금리는 기준금리 ' + D.baseRate.rate.toFixed(2) + "%에 " + A.loanSpread + "%p를 더했다고 가정하고, 물가안정목표 " + D.baseRate.target + "%를 빼서 지금 돈 가치로 계산했어요. 집값은 오르내리지 않는다고 봤어요.</p>";
    }
    if (e.id === "pension") {
      h += '<table class="slip"><tr class="sum"><td>내 국민연금 (월)</td><td>' + won(e.pension) + "</td></tr><tr><td>지금 받는 사람들 평균 (월)</td><td>" + won(e.avg) + "</td></tr></table>" +
        '<p class="small">2026년부터 적용되는 산식(소득대체율 43%)으로 계산했어요. 지금 받는 사람들 평균은 ' + D.pension.avgYr + " 기준이고, 가입 기간이 짧던 세대가 많아 차이가 나요. 기초연금은 계산에 넣지 않았어요. 실제 예상액은 국민연금공단 '내 연금 알아보기'에서 확인해 주세요.</p>" + helpHtml("pension");
    }
    if (e.help) h += helpHtml(e.help);
    if (e.id === "ill") h += '<p class="small">암 진단 확률은 2023년 암등록통계의 나이대별 발생률이에요. 치료비는 사람마다 달라 계산하지 않았고, 일을 쉬는 기간(' + A.illnessRestMonths + "개월)은 가정이에요. 의료 상담이 아니에요.</p>";
    if (e.ask) h += '<p class="ask">' + esc(e.ask) + "</p>";
    e.options.forEach((o, i) => { h += '<button class="opt" data-i="' + i + '">' + esc(o.label) + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</button>"; });
    if (e.link) {
      h += '<div class="linkrow">' + linkHtml(e.link) + "</div>";
      if (e.id === "first") h += '<div class="linkrow">' + linkHtml("saving") + "</div>";
    }
    h += "</section>";
    const box = $("sceneBox");
    box.innerHTML = h;
    box.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.i);
      const picked = e.options[i].label;
      S.game.choose(i); S.picks.push(i); save();
      box.innerHTML = "";
      const s = document.createElement("div"); s.className = "stampline";
      s.textContent = e.title + " → " + picked;
      $("rows").appendChild(s);
      step();
    }));
    box.firstElementChild.scrollIntoView({ block: "start", behavior: "smooth" });
    const first = box.querySelector(".opt"); if (first) first.focus({ preventScroll: true });
  }

  // ── 마지막 장 ───────────────────────────────────────────────
  function showFinal(s) {
    stop();
    const name = S.name ? S.name + " 님의 통장" : "이 통장";
    const hand = s.gross - s.tax - s.insure;
    const pct = (v) => s.gross > 0 ? (v / s.gross * 100) : 0;
    const band = (age) => age < 40 ? "39세 이하" : age < 50 ? "40대" : age < 60 ? "50대" : "60세 이상";
    let h = '<div class="card"><div class="small">마지막 장 · 이 삶의 돈 요약</div><h2>' + esc(name) + "은 " + s.endAge + "세에서 멈췄어요</h2>" +
      "<p>" + s.startAge + "세 첫 월급날부터 " + s.years + "년 동안 찍힌 통장이에요. " +
      "사망원인통계에서 이 나이대에 맞춰 뽑힌 원인 분류는 ‘" + CAUSE[s.cause] + "’. 통계 확률로 뽑은 결과이고, 누구의 앞날을 말하는 것이 아니에요. 의료 상담도 아니에요.</p></div>";

    h += '<div class="card"><h3>평생 받은 월급 (세전)</h3><div class="big">' + man(s.gross) + "</div>" +
      '<div class="split" role="img" aria-label="월급이 나뉜 비율"><i style="width:' + pct(s.tax) + '%;background:#8a3b12"></i><i style="width:' + pct(s.insure) + '%;background:#c98a2b"></i><i style="width:' + pct(hand) + '%;background:#0c7a57"></i></div>' +
      '<div class="legend"><span style="--c:#8a3b12">소득세·지방소득세 ' + man(s.tax) + '</span><span style="--c:#c98a2b">4대보험 ' + man(s.insure) + '</span><span style="--c:#0c7a57">통장에 들어온 돈 ' + man(hand) + "</span></div>" +
      '<div class="grid2">' +
      stat(s.married ? "가족이 함께 쓴 생활비" : "쓴 생활비", man(s.spend)) + stat("그중 월세", man(s.rent)) +
      (s.tutoring ? stat("자녀 사교육비", man(s.tutoring)) : "") + stat("받은 퇴직금", man(s.severance)) + stat("받은 국민연금", man(s.pension)) +
      stat("예금 이자", man(s.interest)) + stat("낸 대출 이자", man(s.loanInterest)) +
      (s.spouseNet ? stat("배우자가 번 돈(세후)", man(s.spouseNet)) : "") + (s.benefit ? stat("받은 구직급여", man(s.benefit)) : "") +
      stat("마지막 잔액", man(s.savings)) + stat("집 포함 순자산", man(s.net)) +
      "</div></div>";

    // 통계와 비교
    const rows = [30, 40, 50, 65].filter((a) => s.snap[a] != null).map((a) => {
      const st = D.assets.byAge[band(a)];
      return "<tr><td>" + a + "세</td><td>" + man(s.snap[a]) + "</td><td>" + man(st.net * 1e4) + "</td></tr>";
    }).join("");
    if (rows) {
      h += '<div class="card"><h3>같은 나이대 통계와 견주면</h3><table class="cmp"><tr><th>나이</th><th>이 통장의 순자산</th><th>가구 평균 순자산</th></tr>' + rows + "</table>" +
        (s.rank65 != null ? "<p>65세 순자산은 전체 가구의 " + (s.rank65 === 0 ? "아래 10% 구간에 있어요." : s.rank65 >= 90 ? "위 10% 구간에 있어요." : "약 " + s.rank65 + "%보다 많아요.") + "</p>" : "") +
        '<p class="small">평균은 가구주 나이대별 가구 평균이에요(' + D.assets.yr + ", 가계금융복지조사). 평균은 자산이 많은 가구가 끌어올려서 가운데 가구(순자산 중앙값 " + man(D.assets.medianNet * 1e4) + ")보다 훨씬 높아요.</p>" +
        '<p class="small">이 통장은 지금의 임금과 제도로 수십 년을 거의 쉬지 않고 일한 삶이에요. 그래서 60세 무렵부터는 통계 평균보다 많게 나오는 편이에요. 통계 속 60세 이상 가구는 임금이 지금보다 낮던 때에 일했고, 오래 일을 쉰 가구도 들어 있어요. 대학 등록금·결혼 비용 같은 목돈도 이 통장에는 없어요.</p></div>';
    }

    // 연금
    if (s.endAge >= 65) {
      h += '<div class="card"><h3>연금</h3><p>국민연금을 ' + s.pYears + "년 냈고, 65세부터 매달 <b class=\"num\">" + won(s.npsMonthly) + "</b>을 받았어요. " +
        "지금 노령연금을 받는 사람들의 평균은 월 " + won(D.pension.avgMonthly) + "이에요(" + D.pension.avgYr + ").</p>" +
        (s.zeroAge ? "<p>" + s.zeroAge + "세에 모아 둔 돈을 다 쓰고, 그 뒤로는 연금으로만 살았어요. 은퇴 나이대(66세 이상)의 상대적 빈곤율은 " + D.elderly.povertyRate66 + "%예요(2024년).</p>" : "") + "</div>";
    } else {
      h += '<div class="card"><h3>연금</h3><p>연금을 받기 시작하는 65세 전에 통장이 멈췄어요. 실제로는 유족연금이나 반환일시금 제도가 있지만 이 통장에는 계산하지 않았어요.</p></div>';
    }

    // 고른 것
    if (s.history.length) {
      h += '<div class="card"><h3>내가 고른 것</h3><ol style="padding-left:20px;margin:6px 0;font-size:14px">' + s.history.map((x) => "<li>" + x.age + "세 · " + esc(x.pick) + "</li>").join("") + "</ol></div>";
    }

    // 이어지는 곳
    h += '<div class="card links"><h3>이 삶에 나온 숫자, 내 숫자로 바꿔 보기</h3>' +
      linkCard("salary") + linkCard("retire") + linkCard("saving") + linkCard("convert") + linkCard("leave") + linkCard("blog") + "</div>";

    h += '<div class="card"><h3>도움받을 곳</h3>' + ((s.flags.minus || s.zeroAge) ? helpHtml("money") : "") + (s.flags.lostJob ? helpHtml("job") : "") + (s.cancer ? helpHtml("health") : "") + helpHtml("mind") +
      '<p class="small">전화번호는 ' + D.checked + "에 각 기관 누리집에서 확인했어요.</p></div>";

    h += '<div class="card"><h3>이 통장 나누기</h3><p class="small">주소에는 씨앗 번호, 시작 조건, 고른 번호만 들어가요. 이름은 들어가지 않아요. 받은 사람은 같은 통장을 그대로 넘겨 볼 수 있어요.</p>' +
      '<div class="stack"><button class="btn" id="fShare">결과 주소 복사</button><button class="btn ghost" id="fCard">요약 카드 그림 저장</button></div>' +
      '<input id="fUrl" readonly aria-label="공유 주소" style="width:100%;margin-top:10px;padding:9px 10px;border:1px solid var(--rule);border-radius:8px;font:13px var(--mono);color:var(--ink2)">' +
      '<p class="small" id="fMsg" role="status" style="min-height:1.4em;margin:6px 0 0"></p><canvas id="fCanvas" width="1080" height="1080" class="hide"></canvas><img id="fImg" alt="요약 카드 미리보기" class="hide" style="width:100%;border-radius:10px;border:1px solid var(--rule);margin-top:8px"></div>';

    h += '<div class="stack" style="margin-top:16px"><button class="btn" id="fAgain">' + (S.shared ? "나도 통장 만들기" : "같은 조건으로 한 번 더") + '</button><button class="btn ghost" id="fNew">다른 통장 만들기</button><button class="btn ghost" id="fBook">이 통장 다시 넘겨 보기</button><button class="textbtn" data-src>출처와 가정 보기</button></div>';
    h += kmongBox(s, S.opt.job);

    $("vFinal").innerHTML = h;
    show("vFinal");
    $("fAgain").onclick = () => { if (S.shared) { history.replaceState(null, "", location.pathname); S = null; show("vSetup"); } else start(Object.assign({}, S.opt, { seed: newSeed() }), S.name); };
    const url = shareUrl();
    $("fUrl").value = url;
    $("fUrl").onfocus = () => $("fUrl").select();
    $("fShare").onclick = () => {
      const done = (ok) => { $("fMsg").textContent = ok ? "주소를 복사했어요. 붙여 넣어 보내면 돼요." : "복사가 막혀 있어요. 아래 주소를 길게 눌러 복사해 주세요."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => done(true), () => { $("fUrl").select(); done(false); });
      else { $("fUrl").select(); let ok = false; try { ok = document.execCommand("copy"); } catch (e) {} done(ok); }
    };
    $("fCard").onclick = () => {
      drawCard($("fCanvas"), s);
      const img = $("fImg");
      try {
        const data = $("fCanvas").toDataURL("image/png");
        img.src = data; img.classList.remove("hide");
        const a = document.createElement("a"); a.href = data; a.download = "통장일대기_" + s.endAge + "세.png";
        document.body.appendChild(a); a.click(); a.remove();
        $("fMsg").textContent = "그림을 저장했어요. 저장이 안 되면 아래 그림을 길게 눌러 저장해 주세요.";
      } catch (e) { $("fMsg").textContent = "그림을 만들지 못했어요."; }
    };
    $("fNew").onclick = () => { clearSave(); S = null; show("vSetup"); };
    $("fBook").onclick = () => { show("vPlay"); $("sceneBox").innerHTML = '<div class="stack" style="margin-top:14px"><button class="btn" id="bToFinal">마지막 장으로</button></div>'; $("bToFinal").onclick = () => show("vFinal"); };
    bindSrc();
  }
  // 큰 사건 3개: 삶의 모양을 바꾼 일부터 고른다
  const EVT = {
    home: (e) => e.a + "세 집을 샀어요", marry: (e) => e.a + "세 결혼했어요", kid: (e) => e.a + "세 " + ["첫째", "둘째", "셋째"][e.n - 1] + "가 태어났어요",
    ill: (e) => e.a + "세 암 진단을 받았어요", loss: (e) => e.a + "세 일자리를 잃었어요", sold: (e) => e.a + "세 집을 팔았어요",
    move: (e) => e.a + "세 회사를 옮겼어요", zero: (e) => e.a + "세 모은 돈을 다 썼어요"
  };
  const SITE = "hayanfog9.github.io/bankbook-life-3k7d"; // 카드에 찍는 주소(고정)
  function topEvents(s) {
    const order = ["home", "marry", "ill", "kid", "loss", "sold", "zero", "move"];
    const picked = [];
    order.forEach((k) => { const e = s.ev.find((x) => x.k === k); if (e && picked.length < 3) picked.push(e); });
    return picked.sort((a, b) => a.a - b.a).map((e) => EVT[e.k](e));
  }
  function drawCard(cv, s) {
    const c = cv.getContext("2d"), W = 1080, H = 1080;
    const font = (px, w) => (w || 400) + " " + px + 'px system-ui, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
    c.fillStyle = "#173b63"; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(207,230,214,.45)"; c.lineWidth = 3; c.strokeRect(36, 36, W - 72, H - 72);
    c.textBaseline = "alphabetic"; c.textAlign = "left";
    c.fillStyle = "#cfe6d6"; c.font = font(34, 500); c.fillText("보통예금 · 한 사람의 통장", 90, 150);
    c.fillStyle = "#ffffff"; c.font = font(104, 800); c.fillText("통장 일대기", 86, 270);
    // 종이
    c.fillStyle = "#fbfcf9"; c.fillRect(90, 330, W - 180, 620);
    c.strokeStyle = "#c9dfcf"; c.lineWidth = 2;
    for (let y = 440; y <= 632; y += 96) { c.beginPath(); c.moveTo(90, y); c.lineTo(W - 90, y); c.stroke(); }
    const row = (y, k, v, big) => {
      c.fillStyle = "#4a5a70"; c.font = font(34, 500); c.textAlign = "left"; c.fillText(k, 126, y);
      c.fillStyle = "#16263d"; c.font = font(big ? 54 : 44, 800); c.textAlign = "right"; c.fillText(v, W - 126, y + 2);
    };
    row(404, "통장 기간", s.startAge + "세 → " + s.endAge + "세");
    row(500, "가장 많았던 잔액", man(s.peak) + " (" + s.peakAge + "세)");
    if (s.snap && s.snap[65] != null) row(596, "65세 순자산 (집 포함)", man(s.snap[65]));
    else row(596, "마지막 순자산 (집 포함)", man(s.net));
    c.fillStyle = "#0c7a57"; c.font = font(30, 700); c.textAlign = "left"; c.fillText("큰 사건", 126, 690);
    const ev = topEvents(s);
    c.fillStyle = "#16263d"; c.font = font(40, 600);
    (ev.length ? ev : ["큰 사건 없이 조용히 흘러간 통장"]).forEach((t, i) => c.fillText(t, 126, 762 + i * 76));
    c.textAlign = "left"; c.fillStyle = "#cfe6d6"; c.font = font(26, 500);
    c.fillText("한국 공식 통계로 만든 가상의 삶이에요", 90, 994);
    c.textAlign = "right"; c.font = font(28, 700); c.fillText(SITE, W - 90, 1030);
  }
  function stat(k, v) { return '<div class="stat"><div class="k">' + k + '</div><div class="v">' + v + "</div></div>"; }

  // ── 출처와 가정 ─────────────────────────────────────────────
  function srcItem(title, value, o, url) {
    return '<div class="src"><b>' + esc(title) + "</b>" + esc(value) + "<br>" + esc(o.src) + " · " + esc(o.yr || "") + ' · <a href="' + (url || o.url) + '" target="_blank" rel="noopener">원문</a></div>';
  }
  function buildSrc() {
    const w = D.wage, hs = D.housing;
    let h = '<h2 id="dSrcT">출처와 가정</h2><p class="small">통계와 법령 값은 ' + D.checked + "에 공식 원문에서 직접 확인한 것만 썼어요. 통계는 지금 값이 평생 이어진다고 보고 계산해요.</p>";
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
    h += "<h3>생활비와 금리</h3>" +
      srcItem("가구원 수별 월평균 소비지출", "1인 " + man(D.spendBySize.spend[0]) + ", 2인 " + man(D.spendBySize.spend[1]) + ", 3인 " + man(D.spendBySize.spend[2]) + ", 4인 " + man(D.spendBySize.spend[3]) + ", 5인 이상 " + man(D.spendBySize.spend[4]) + " (그중 교육 지출은 따로 빼고 사교육비 통계로 계산)", D.spendBySize) +
      srcItem("가구주 65세 이상 가구의 월평균 소비지출", man(D.spendByAge.over65) + " (평균 가구원 " + D.spendByAge.over65Size + "명)", D.spendByAge) +
      srcItem("소득 5분위별 소비지출", "처분가능소득이 가장 낮은 20%는 월 " + man(D.spendByQuintile.spend[0]) + ", 가장 높은 20%는 월 " + man(D.spendByQuintile.spend[4]) + "을 써요", D.spendByQuintile) +
      srcItem("학생 1인당 월평균 사교육비", "초등학교 " + D.tutoring.elementary + "만 원, 중학교 " + D.tutoring.middle + "만 원, 고등학교 " + D.tutoring.high + "만 원(사교육을 받지 않는 학생도 포함한 평균)", D.tutoring) +
      srcItem("기준금리와 물가안정목표", "기준금리 연 " + D.baseRate.rate.toFixed(2) + "%, 물가안정목표 " + D.baseRate.target + "%", D.baseRate);
    h += "<h3>은퇴</h3>" +
      srcItem("국민연금", "65세부터, 기본연금액 = 1.29 × (A + B) × 가입연수/20, A값 " + won(D.pension.A) + ", 10년 이상 내야 받음 · 지금 받는 사람 평균 월 " + won(D.pension.avgMonthly), D.pension, D.pension.formulaUrl) +
      srcItem("은퇴 나이대 빈곤율", "66세 이상 상대적 빈곤율 " + D.elderly.povertyRate66 + "%", D.elderly);
    h += "<h3>수명, 사망, 질병</h3>" +
      srcItem("나이별 사망확률", "완전생명표(1세별) 전체 · 기대수명 " + D.life.e0 + "년", D.life) +
      srcItem("사망원인", "나이대(5세)별 사망자 수를 신생물, 순환계통, 호흡계통, 외부 요인, 그 밖으로 묶음", D.death) +
      srcItem("암 발생률", "모든 암, 나이대(5세)별 인구 10만 명당 발생자 수", D.cancer);

    h += "<h3>우리가 정한 가정</h3><ol>" + [
      "금액은 모두 2026년 돈 가치예요. 임금·물가·집값이 오르는 것은 넣지 않았고, 이자는 기준금리에서 물가안정목표를 뺀 연 " + (TJ.REAL * 100).toFixed(1) + "%로 계산해요. 이자에 붙는 세금은 계산하지 않아요.",
      "내 월급 = 나이대별 평균소득을 이은 선 × 일자리 규모 비율(대기업 " + TJ.SIZE.large.toFixed(2) + ", 중소기업 " + TJ.SIZE.sme.toFixed(2) + ") × 사람마다 다른 값(±" + pc(A.personalSpread) + "%) × 해마다 흔들림(±" + pc(A.yearlyNoise) + "%). 최저임금 일자리는 옮기기 전까지 최저임금이에요. 신입 초봉 통계가 아니라 평균으로 만든 추정이에요.",
      "실업률을 한 해에 일자리를 잃을 확률로 봤어요. 쉬는 기간은 " + A.jobLossGap.fast + "개월 또는 " + A.jobLossGap.wait + "개월이에요.",
      "이직 제안은 한 해 " + pc(A.jobOfferProb) + "% 확률, 월급은 " + pc(A.jobOfferRaise[0]) + "~" + pc(A.jobOfferRaise[1]) + "% 올라요.",
      "혼인율과 출산율은 전체 인구 기준이라, 결혼하지 않은 사람·아이를 원하는 부부의 확률로 바꾸려고 배수(결혼 " + A.marryBoost + "배, 출산 최대 " + A.birthBoost.want + "배)를 곱했어요. 성별은 묻지 않고 남녀 평균을 써요. 이혼과 배우자의 죽음은 다루지 않아요.",
      "배우자는 고용률(" + D.jobs.employRate1564 + "%)의 확률로 일하고, 일하면 나이대 평균소득을 60세까지 벌어요. 결혼할 때 배우자 저축은 내 저축의 절반으로 봤어요.",
      "생활비는 가구원 수별 평균 소비지출(교육 지출 제외)에서 시작해요. 우리 집 소득이 같은 가구원 수 평균보다 많거나 적으면 그 비율의 " + A.spendElastic + "제곱만큼 더 쓰거나 덜 써요(소득이 2배면 지출은 약 1.6배). 이 숫자는 소득 5분위 자료를 보고 정한 가정이에요. '넉넉하게'는 10% 더, '아껴서'는 10% 덜 써요. 아이는 " + A.kidLeavesAt + "세에 독립하고, 최소 생활비는 최저임금 월액의 " + pc(A.spendFloorShare) + "% × √가구원 수예요.",
      "자녀 사교육비는 초등학생(7~12세), 중학생(13~15세), 고등학생(16~18세) 나이에 전체 학생 1인당 평균을 그대로 넣어요. 대학 등록금, 결혼 비용, 영유아 보육비는 넣지 않았어요.",
      "월세는 생활비 안에서 지역별 월세 비율만큼으로 보고, 전국 평균과의 차이만큼 생활비가 달라져요. 전세는 다루지 않아요.",
      "집은 집값의 " + pc(A.downPayment) + "%를 모으면 살 수 있고, 한 해 갚는 돈이 세후 소득의 " + pc(A.loanBurdenMax) + "%를 넘으면 살 수 없어요. 대출 금리는 기준금리 + " + A.loanSpread + "%p, 최대 " + A.loanYears + "년 동안 같은 금액을 갚아요.",
      "암 진단을 받으면 그해 " + A.illnessRestMonths + "개월 일을 쉰다고 봤어요. 치료비와 보험금은 계산하지 않아요.",
      "오래 다닌 일터를 떠나는 나이는 고령층 부가조사를 따라요. " + D.mainJob.leftShare + "%는 " + A.mainJobEnd + "세 전에 떠나고(평균 " + D.mainJob.leftAge.toFixed(1) + "세가 되도록 " + A.exitFrom + "~" + (A.mainJobEnd - 1) + "세에 고르게 흩어 놓음, 흩어 놓는 방식은 가정), 나머지는 " + A.mainJobEnd + "세에 떠나요. 다시 일하면 중소기업 비율의 나이대 평균 임금으로 " + A.workEnd + "세까지 일해요. 퇴직금에 붙는 세금은 계산하지 않아요.",
      "은퇴 뒤 생활비는 같은 가구원 수 평균의 " + pc(TJ.RETIRE) + "%예요(가구주 65세 이상 가구의 소비지출을 가구원 수에 맞춰 비교한 값). 모은 돈을 다 쓰면 들어오는 돈 안에서만 쓰고, 65세부터는 마이너스 통장이 더 늘지 않는다고 봤어요. 기초연금과 퇴직연금, 개인연금은 계산하지 않아요.",
      "마이너스 통장 한도는 최저임금 " + A.minusLimitMonths + "개월분이에요. 한도를 넘게 되면 집이 있으면 팔아서 대출을 갚고, 그래도 넘으면 한도 안에서만 써요. 생계급여·아동수당·근로장려금 같은 복지 제도는 계산하지 않아요.",
      "주식·코인 같은 투자는 넣지 않았어요."
    ].map((t) => "<li>" + esc(t) + "</li>").join("") + "</ol>";
    h += '<p class="small">통계는 국가데이터처 KOSIS 등의 공개 자료를 출처를 밝히고 이용했어요. 이 페이지는 각 기관과 관계가 없고, 기관이 보증하는 내용도 아니에요.</p>';
    $("dBody").innerHTML = h;
  }
  function bindSrc() {
    document.querySelectorAll("[data-src]").forEach((b) => { b.onclick = () => { if (S && S.timer) { stop(); S.resumeAfter = true; } buildSrc(); $("dSrc").showModal(); }; });
  }
  $("dClose").onclick = () => $("dSrc").close();
  $("dSrc").addEventListener("close", () => { if (S && S.resumeAfter) { S.resumeAfter = false; schedule(); } });
  $("dSrc").addEventListener("click", (e) => { if (e.target === $("dSrc")) $("dSrc").close(); });

  // ── 표지와 개설 ─────────────────────────────────────────────
  function chips(id) {
    const box = $(id);
    box.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
      box.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", x === c ? "true" : "false"));
    }));
    return () => box.querySelector('.chip[aria-pressed="true"]').dataset.v;
  }
  const getJob = chips("cJob"), getRegion = chips("cRegion");
  $("iAge").addEventListener("input", () => { $("oAge").textContent = $("iAge").value + "세"; });
  $("bMake").onclick = () => show("vSetup");
  $("bBack").onclick = () => show("vCover");
  $("bStart").onclick = () => start({ seed: newSeed(), age: Number($("iAge").value), job: getJob(), region: getRegion() }, $("iName").value.trim());
  $("bRandom").onclick = () => {
    const r = Math.random;
    // 일자리는 최저임금·중소기업·대기업 가운데, 사는 곳은 세 지역 가운데 고르게 뽑는다
    start({ seed: newSeed(), age: 19 + Math.floor(r() * 16), job: ["min", "sme", "sme", "large"][Math.floor(r() * 4)], region: ["metro", "city", "prov"][Math.floor(r() * 3)] }, "");
  };
  $("tPause").onclick = () => {
    if (!S) return;
    S.paused = !S.paused;
    $("tPause").textContent = S.paused ? "계속" : "멈춤";
    $("tPause").setAttribute("aria-pressed", S.paused ? "true" : "false");
    if (!S.paused && !S.game.pendingScene) schedule(); else stop();
  };
  $("tSpeed").onclick = () => { if (!S) return; S.fast = !S.fast; $("tSpeed").textContent = S.fast ? "천천히" : "빠르게"; if (S.timer) schedule(); };

  const saved = load();
  if (saved && saved.opt && !saved.done) {
    $("bResume").classList.remove("hide");
    $("bResume").onclick = () => start(saved.opt, saved.name, saved.picks);
  }
  const sh = parseShare();
  if (sh) {
    $("sharedNote").classList.remove("hide");
    $("bShared").onclick = () => start(sh.opt, "", sh.picks, true);
  }
  $("fChecked").textContent = D.checked;
  bindSrc();
  window.TJ_APP = { start: start, state: () => S, drawCard: drawCard };
})();
