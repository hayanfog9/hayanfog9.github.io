// 통장 일대기 — 계산 엔진 (화면과 분리. 같은 씨앗이면 같은 삶이 나온다)
(function (root) {
  const D = root.TJ_DATA;
  const TAX = root.TJ_TAX || [];

  // ── 우리가 정한 가정 (화면 "출처와 가정"에 그대로 보여 준다) ──────────
  const A = {
    baseYear: 2026,
    personalSpread: 0.15,     // 사람마다 월급이 평균에서 ±15% 안에서 다름
    yearlyNoise: 0.03,        // 해마다 ±3% 흔들림
    jobOfferProb: 0.12,       // 한 해에 이직 제안을 받을 확률
    jobOfferRaise: [0.08, 0.20],
    offerToLargeProb: 0.15,   // 중소기업에서 대기업 제안이 올 확률
    marryBoost: 2,            // 혼인율(전체 인구 기준)을 미혼자 확률로 바꾸는 배수
    birthBoost: { want: 4, maybe: 2, no: 0 }, // 출산율(전체 여성 기준)을 부부 확률로 바꾸는 배수
    maxKids: 3,
    kidLeavesAt: 25,          // 자녀가 가계에서 독립하는 나이
    spendElastic: 0.7,        // elasticity of spending to household income (assumption)
    spendMode: { low: 1.1, mid: 1, high: 0.9 },
    spendFloorShare: 0.6,     // 최소 생활비 = 최저임금 월액의 60% × √가구원수
    minusLimitMonths: 12,     // 마이너스 통장 한도 = 최저임금 12개월분
    spouseSavingShare: 0.5,   // 결혼할 때 배우자 저축 = 내 저축의 절반
    downPayment: 0.3,         // 집값의 30%를 모으면 살 수 있음
    homeUse: 0.8,             // 집을 살 때 모은 돈의 80%까지 씀
    loanBurdenMax: 0.4,       // 한 해 대출 상환액이 세후 소득의 40%를 넘으면 사지 못함
    loanSpread: 1.5,          // 대출 금리 = 기준금리 + 1.5%p
    loanYears: 30,
    homeAskGap: 3, homeAskMax: 3,
    jobLossGap: { fast: 3, wait: 8 },  // 실직 뒤 쉬는 개월
    jobLossCut: { fast: 0.10, wait: 0 },
    illnessRestMonths: 6,     // 암 진단 해에 일을 쉬는 개월
    exitFrom: 45,             // earliest age of leaving the main job (spread is an assumption)
    mainJobEnd: 60,           // 주된 일자리 퇴직 나이
    workEnd: 65
  };

  // ── 도구 ────────────────────────────────────────────────────
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // 지금 돈 가치로 본 금리: 기준금리 - 물가안정목표
  const REAL = (D.baseRate.rate - D.baseRate.target) / 100;
  const RETIRE = (function () { const b = D.spendBySize, a = D.spendByAge; return a.over65 / (b.spend[0] + (a.over65Size - 1) * (b.spend[1] - b.spend[0])); })();
  const f10 = (x) => Math.floor((x + 1e-6) / 10) * 10;
  function band(ages, vals, age) {
    let v = 0;
    for (let i = 0; i < ages.length; i++) if (age >= ages[i]) v = vals[i];
    return age < ages[0] ? 0 : v;
  }
  // 연령대별 평균소득 곡선(만원): 연령대 가운데 나이를 잇는 직선
  function wageCurve(age) {
    const pts = [[25, D.wage.byAge[20]], [35, D.wage.byAge[30]], [45, D.wage.byAge[40]], [55, D.wage.byAge[50]], [65, D.wage.byAge[60]]];
    if (age <= pts[0][0]) return pts[0][1];
    if (age >= pts[4][0]) return pts[4][1];
    for (let i = 0; i < 4; i++) {
      const [a0, v0] = pts[i], [a1, v1] = pts[i + 1];
      if (age <= a1) return v0 + (v1 - v0) * (age - a0) / (a1 - a0);
    }
  }
  const SIZE = { large: D.wage.bySize.large / D.wage.mean, sme: D.wage.bySize.sme / D.wage.mean, avg: 1 };

  // ── 월급에서 떼는 돈 (JW 월급 계산기와 같은 식) ─────────────────
  function famVal(c, n) { return n <= 11 ? c[n - 1] : c[10] - (c[9] - c[10]) * (n - 11); }
  function baseTax(wMonth, n) {
    const w = wMonth / 1000; if (w < 770) return 0;
    if (w < 10000) { const r = TAX.find((r) => w >= r[0] && w < r[1]); return r ? famVal(r.slice(2), n) : 0; }
    const B = D.taxTable.base10000;
    const b = n <= 11 ? B[n - 1] : B[10] - (B[9] - B[10]) * (n - 11);
    if (w === 10000) return b;
    if (w <= 14000) return b + (w - 10000) * 1000 * 0.98 * 0.35 + 25000;
    if (w <= 28000) return b + 1397000 + (w - 14000) * 1000 * 0.98 * 0.38;
    if (w <= 30000) return b + 6610600 + (w - 28000) * 1000 * 0.98 * 0.40;
    if (w <= 45000) return b + 7394600 + (w - 30000) * 1000 * 0.40;
    if (w <= 87000) return b + 13394600 + (w - 45000) * 1000 * 0.42;
    return b + 31034600 + (w - 87000) * 1000 * 0.45;
  }
  function pensionRate(year) {
    const s = D.deduct.pensionSchedule;
    const y = Math.min(2033, Math.max(2026, year));
    return s[y] / 100 / 2;
  }
  // 한 달 명세서. fam: 공제대상 가족 수(본인 포함), kid: 8~20세 자녀 수
  function payslip(gross, fam, kid, year) {
    const pBase = Math.min(D.deduct.pensionBaseMax, Math.max(D.deduct.pensionBaseMin, Math.round(gross / 1000) * 1000));
    const pension = gross > 0 ? f10(pBase * pensionRate(year || A.baseYear)) : 0;
    const health = f10(gross * D.deduct.health);
    const care = f10(gross * D.deduct.care);
    const emp = f10(gross * D.deduct.employ);
    let t = baseTax(gross, fam || 1);
    const ded = !kid ? 0 : (kid === 1 ? 20830 : 45830 + 33330 * (kid - 2));
    t = f10(Math.max(0, t - ded));
    const local = f10(t * 0.1);
    const insure = pension + health + care + emp;
    return { gross, pension, health, care, emp, tax: t, local, insure, total: insure + t + local, net: gross - insure - t - local, pBase };
  }

  // ── 국민연금 예상액(월) ──────────────────────────────────────
  // 기본연금액(연) = 상수 × (A + B) × 가입연수/20  (가입 10년 이상일 때)
  function npsMonthly(avgBase, months) {
    const P = D.pension;
    if (!P.A || months < 120) return 0;
    return Math.floor(P.constant * (P.A + avgBase) * (months / 240) / 12 / 10) * 10;
  }

  // ── 구직급여(실업급여) ───────────────────────────────────────
  function jobBenefit(monthlyWage, months, age, insuredYears) {
    const U = D.jobBenefit;
    if (!U) return 0;
    const daily = Math.min(U.maxDaily, Math.max(U.minDaily, monthlyWage * 3 / 91 * U.rate));
    let days = U.days(age, insuredYears);
    days = Math.min(days, Math.round(months * 30.4));
    return Math.round(daily * days);
  }

  // ── 게임 ────────────────────────────────────────────────────
  function Game(opt) {
    const g = this;
    g.seed = opt.seed >>> 0;
    g.r = rng(g.seed);
    g.startAge = opt.age;
    g.region = opt.region;      // metro | city | prov
    g.jobType = opt.job;        // min | sme | large
    g.age = opt.age;
    g.year = A.baseYear;
    g.pf = 1 - A.personalSpread + g.r() * 2 * A.personalSpread;
    g.employed = false; g.retired = false; g.rehired = false;
    g.tenure = 0; g.wage = 0; g.lastWage = 0;
    g.waitMonths = Math.min(36, Math.round(-Math.log(1 - g.r()) * D.firstJob.monthsAll));
    g.gapMonths = 0; // 쉬는 개월(실직). 통장은 첫 월급날부터 시작하므로 취업 준비 기간은 계산하지 않는다
    g.exitAge = g.r() < D.mainJob.leftShare / 100 ? Math.min(A.mainJobEnd - 1, Math.max(g.startAge + 5, A.exitFrom + Math.floor(g.r() * (2 * (D.mainJob.leftAge - A.exitFrom) + 1)))) : A.mainJobEnd;
    g.saveMode = "mid";
    g.savings = 0; g.loan = 0; g.loanPay = 0; g.loanLeft = 0; g.home = null;
    g.married = false; g.spouse = null; g.marryDeclined = 0;
    g.kidPlan = "no"; g.kids = [];
    g.cancer = false; g.illMonths = 0;
    g.homeAsks = 0; g.homeAskAge = 0;
    g.pMonths = 0; g.pSum = 0; g.npsMonthly = 0;
    g.lastSpend = 0;
    g.dead = false; g.cause = null;
    g.queue = []; g.pendingScene = null;
    g.history = [];
    g.tot = { gross: 0, tax: 0, insure: 0, spend: 0, interest: 0, severance: 0, pension: 0, loanInterest: 0, spouseNet: 0, benefit: 0, rent: 0, tutoring: 0 };
    g.flags = { zero: false, minus: false, lostJob: 0, moved: 0 };
    g.ev = []; g.peak = 0; g.peakAge = opt.age;
    g.firstSlip = null;
    g.phase = "start";
  }

  Game.prototype.targetWage = function () {
    const g = this;
    if (g.jobType === "min") return D.minWage.monthly;
    const size = g.rehired ? SIZE.sme : SIZE[g.jobType];
    const noise = 1 - A.yearlyNoise + g.r() * 2 * A.yearlyNoise;
    return Math.max(D.minWage.monthly, Math.round(wageCurve(g.age) * size * g.pf * noise * 10000 / 1000) * 1000);
  };
  Game.prototype.household = function () {
    return 1 + (this.married ? 1 : 0) + this.kids.filter((k) => k < A.kidLeavesAt).length;
  };
  Game.prototype.netWorth = function () {
    return this.savings + (this.home ? this.home.price : 0) - this.loan;
  };
  Game.prototype.homePrice = function () {
    const g = this;
    const mine = (g.wage || g.lastWage) * 12;
    const sp = g.spouse && g.spouse.wage ? g.spouse.wage * 12 : 0;
    return Math.round(D.housing.pir[g.region] * (mine + sp) / 1e6) * 1e6;
  };
  Game.prototype.paySeverance = function (lines) {
    const g = this;
    if (g.tenure >= 1 && g.wage > 0) {
      const s = Math.round(g.wage * g.tenure);
      g.savings += s; g.tot.severance += s;
      lines.push({ k: "in", t: "퇴직금 (" + g.tenure + "년 근무)", v: s });
    }
    g.tenure = 0;
  };

  // 다음 일을 하나 돌려준다: scene(고르는 장면) | year(한 해 통장 줄) | end(끝)
  Game.prototype.next = function () {
    const g = this;
    if (g.dead) return { type: "end", summary: g.summary() };
    if (g.pendingScene) return g.pendingScene;
    if (g.phase === "start") { g.phase = "scenes"; g.buildScenes(); }
    if (g.phase === "scenes") {
      if (g.queue.length) { g.pendingScene = g.queue.shift(); return g.pendingScene; }
      g.phase = "settle";
    }
    const y = g.settle();
    g.phase = "start";
    return y;
  };
  Game.prototype.choose = function (i) {
    const g = this, s = g.pendingScene;
    if (!s) return;
    g.pendingScene = null;
    s.options[i].run();
    g.history.push({ age: g.age, scene: s.id, pick: s.options[i].label });
  };

  Game.prototype.buildScenes = function () {
    const g = this, q = g.queue, r = g.r;
    g.yearLines = [];
    const L = g.yearLines;

    // 첫 취업
    if (!g.employed && !g.retired && g.gapMonths < 12 && g.age < A.mainJobEnd) {
      g.employed = true;
      g.workMonths = 12 - g.gapMonths;
      if (!g.wage) g.wage = g.targetWage();
      if (!g.firstSlip) {
        g.firstSlip = payslip(g.wage, 1, 0, g.year);
        q.push({
          type: "scene", id: "first", age: g.age, title: "첫 월급날",
          text: g.waitMonths > 0 ? "일자리를 구하는 데 " + g.waitMonths + "개월이 걸렸어요. 오늘 첫 월급이 들어왔고, 통장을 새로 만들었어요." : "바로 일을 시작했어요. 오늘 첫 월급이 들어왔고, 통장을 새로 만들었어요.",
          slip: g.firstSlip, link: "salary",
          ask: "이 월급에서 얼마나 모을까요?",
          options: [
            { label: "넉넉하게 쓴다", sub: "평균보다 10% 더 써요", run: () => { g.saveMode = "low"; } },
            { label: "평균만큼 쓴다", sub: "가계동향조사의 가구원 수별 평균 소비", run: () => { g.saveMode = "mid"; } },
            { label: "아껴서 모은다", sub: "평균보다 10% 덜 써요", run: () => { g.saveMode = "high"; } }
          ]
        });
      } else {
        L.push({ k: "note", t: "다시 일을 시작했어요" });
      }
    } else if (!g.employed && !g.retired) {
      g.workMonths = 0;
    } else {
      g.workMonths = g.employed ? 12 : 0;
    }
    g.gapMonths = Math.max(0, g.gapMonths - 12);

    // 해마다 임금 조정
    if (g.employed && g.tenure > 0) g.wage = g.jobType === "min" ? D.minWage.monthly : Math.max(g.targetWage(), D.minWage.monthly);

    // 60세: 주된 일자리 퇴직
    if (g.age === g.exitAge && g.employed && !g.rehired) {
      const early = g.age < A.mainJobEnd;
      q.push({
        type: "scene", id: "retire60", age: g.age, title: early ? "오래 다닌 일터를 떠나요" : "정년",
        text: "오래 다닌 일터를 떠나는 날이에요. 퇴직금이 통장에 들어와요.", link: "retire",
        ask: "연금이 나오는 65세까지 " + (A.workEnd - g.age) + "년이 남았어요.",
        options: [
          { label: "다시 일한다", sub: "중소기업 나이대 평균 임금으로 65세까지", run: () => { g.paySeverance(L); g.rehired = true; g.jobType = g.jobType === "min" ? "min" : "sme"; g.wage = g.targetWage(); } },
          { label: "일을 쉰다", sub: "모은 돈으로 65세까지", run: () => { g.paySeverance(L); g.employed = false; g.retired = true; g.lastWage = g.wage; g.wage = 0; g.workMonths = 0; } }
        ]
      });
    }
    // 65세: 일을 마치고 연금 시작
    if (g.age === A.workEnd) {
      if (g.employed) { g.paySeverance(L); g.employed = false; g.lastWage = g.wage; g.wage = 0; g.workMonths = 0; }
      g.retired = true;
      g.npsMonthly = npsMonthly(g.pMonths ? g.pSum / g.pMonths : 0, g.pMonths);
      if (g.spouse) { g.spouse.wage = 0; g.spouse.nps = npsMonthly(g.spouse.pMonths ? g.spouse.pSum / g.spouse.pMonths : 0, g.spouse.pMonths); }
      q.push({
        type: "scene", id: "pension", age: g.age, title: "연금 첫 달",
        text: g.npsMonthly > 0
          ? "국민연금을 " + Math.round(g.pMonths / 12) + "년 냈어요. 이제 매달 연금이 들어와요."
          : "국민연금을 낸 기간이 10년이 안 돼 매달 받는 연금이 없어요. 낸 돈은 일시금으로 돌려받는데, 이 통장에는 계산하지 않았어요.",
        pension: g.npsMonthly, avg: D.pension.avgMonthly,
        options: [{ label: "통장을 넘긴다", run: () => {} }]
      });
    }

    if (g.employed && g.age < A.mainJobEnd) {
      // 실직
      const pLoss = (g.age < 30 ? D.jobs.unempYouth : D.jobs.unemp) / 100;
      if (g.tenure >= 1 && r() < pLoss) {
        g.flags.lostJob++; g.ev.push({ a: g.age, k: "loss" });
        const lose = (mode) => {
          const lastWage = g.wage, yrs = g.tenure;
          g.paySeverance(L);
          const gap = A.jobLossGap[mode];
          const b = jobBenefit(lastWage, gap, g.age, yrs);
          if (b > 0) { g.savings += b; g.tot.benefit += b; L.push({ k: "in", t: "구직급여", v: b }); }
          g.pf *= 1 - A.jobLossCut[mode];
          g.employed = false; g.lastWage = lastWage; g.wage = 0;
          g.workMonths = 0; g.gapMonths = gap;
          if (gap < 12) { g.workMonths = 12 - gap; g.employed = true; g.gapMonths = 0; g.wage = g.targetWage(); }
        };
        q.push({
          type: "scene", id: "jobloss", age: g.age, title: "일터가 문을 닫았어요",
          text: "회사 사정으로 일을 그만두게 됐어요. 퇴직금과 구직급여가 들어와요.", help: "job",
          ask: "다음 일자리를 어떻게 구할까요?",
          options: [
            { label: "눈높이를 낮춰 빨리 구한다", sub: A.jobLossGap.fast + "개월 쉬고, 월급은 조금 낮아져요", run: () => lose("fast") },
            { label: "원하는 자리를 기다린다", sub: A.jobLossGap.wait + "개월 쉬고, 월급은 그대로예요", run: () => lose("wait") }
          ]
        });
      } else if (g.tenure >= 1 && g.age < 50 && r() < A.jobOfferProb) {
        // 이직 제안
        const raise = A.jobOfferRaise[0] + r() * (A.jobOfferRaise[1] - A.jobOfferRaise[0]);
        let to = g.jobType;
        if (g.jobType === "min") to = "sme";
        else if (g.jobType === "sme" && r() < A.offerToLargeProb) to = "large";
        const cur = g.wage;
        let offer;
        if (to !== g.jobType) {
          offer = Math.max(D.minWage.monthly, Math.round(wageCurve(g.age) * SIZE[to] * g.pf * 10) * 1000);
          if (offer <= cur) offer = Math.round(cur * (1 + raise) / 1000) * 1000;
        } else offer = Math.round(cur * (1 + raise) / 1000) * 1000;
        const name = { sme: "중소기업", large: "대기업", min: "최저임금 일자리" }[to];
        q.push({
          type: "scene", id: "offer", age: g.age, title: "이직 제안",
          text: (to !== g.jobType ? name + "에서 " : "다른 회사에서 ") + "함께 일하자는 연락이 왔어요.",
          compare: { now: cur, offer: offer }, link: "leave",
          ask: "옮기면 지금까지의 퇴직금을 받고, 근속은 1년 차부터 다시 시작해요.",
          options: [
            { label: "옮긴다", run: () => { g.paySeverance(L); if (to === g.jobType) g.pf *= 1 + raise; else g.pf = Math.max(g.pf, offer / 10000 / (wageCurve(g.age) * SIZE[to])); g.jobType = to; g.wage = offer; g.flags.moved++; g.ev.push({ a: g.age, k: "move" }); } },
            { label: "남는다", run: () => {} }
          ]
        });
      }
    }

    // 결혼
    if (!g.married && g.age >= 20 && g.age < 65) {
      const m = (band(D.marriage.ages, D.marriage.male, g.age) + band(D.marriage.ages, D.marriage.female, g.age)) / 2 / 1000;
      const p = m * A.marryBoost * (g.marryDeclined ? 0.5 : 1);
      if (r() < p) {
        const sWorks = r() < D.jobs.employRate1564 / 100;
        const sPf = 1 - A.personalSpread + r() * 2 * A.personalSpread;
        q.push({
          type: "scene", id: "marry", age: g.age, title: "함께 살고 싶은 사람",
          text: "오래 만난 사람과 앞으로의 이야기를 나눴어요. 그 사람은 " + (sWorks ? "지금 일을 하고 있어요." : "지금은 일을 쉬고 있어요."),
          ask: "어떻게 할까요? 어느 쪽도 틀린 답이 아니에요.",
          options: [
            { label: "결혼한다", sub: "두 사람의 돈을 한 통장으로 봐요", run: () => {
              g.married = true; g.ev.push({ a: g.age, k: "marry" });
              g.spouse = { works: sWorks, pf: sPf, wage: 0, pMonths: Math.max(0, (g.age - 27)) * 12 * (sWorks ? 1 : 0), pSum: 0, nps: 0 };
              if (sWorks) g.spouse.pSum = g.spouse.pMonths * Math.min(D.deduct.pensionBaseMax, wageCurve(g.age) * sPf * 10000);
              const add = Math.max(0, Math.round(g.savings * A.spouseSavingShare));
              if (add > 0) { g.savings += add; L.push({ k: "in", t: "배우자 저축 합침", v: add }); }
              g.queue.unshift({
                type: "scene", id: "kidplan", age: g.age, title: "아이 이야기",
                text: "둘이서 아이에 대해 이야기했어요.",
                ask: "어떻게 생각하나요? 어느 쪽도 틀린 답이 아니에요.",
                options: [
                  { label: "아이를 원해요", run: () => { g.kidPlan = "want"; } },
                  { label: "아직 모르겠어요", run: () => { g.kidPlan = "maybe"; } },
                  { label: "둘이 살래요", run: () => { g.kidPlan = "no"; } }
                ]
              });
            } },
            { label: "지금처럼 지낸다", sub: "혼자 사는 통장 그대로", run: () => { g.marryDeclined++; } }
          ]
        });
      }
    }

    // 출산
    if (g.married && g.kidPlan !== "no" && g.kids.length < A.maxKids && g.age < 50) {
      const b = band(D.birth.ages, D.birth.rate, g.age) / 1000 * A.birthBoost[g.kidPlan] / (1 + 0.5 * g.kids.length);
      if (r() < b) {
        g.kids.push(0); g.ev.push({ a: g.age, k: "kid", n: g.kids.length });
        L.push({ k: "note", t: (["첫째", "둘째", "셋째"][g.kids.length - 1]) + " 아이가 태어났어요" });
      }
    }

    // 집
    if (!g.home && g.age >= 25 && g.age < A.mainJobEnd && (g.employed || (g.spouse && g.spouse.works)) && g.homeAsks < A.homeAskMax && g.age - g.homeAskAge >= A.homeAskGap) {
      const price = g.homePrice();
      if (price > 0 && g.savings >= price * A.downPayment) {
        g.homeAskAge = g.age;
        const loan = Math.max(0, price - Math.floor(g.savings * A.homeUse));
        const need = Math.max(loan, 0);
        const rate = REAL + A.loanSpread / 100;
        const n = Math.max(10, Math.min(A.loanYears, A.workEnd + 5 - g.age));
        const pay = need > 0 ? Math.round(need * rate / (1 - Math.pow(1 + rate, -n))) : 0;
        const netYear = (g.lastSlip ? g.lastSlip.net * 12 : 0) + (g.spouse && g.spouse.wage ? g.spouse.wage * 12 * 0.85 : 0);
        if (pay <= netYear * A.loanBurdenMax && ++g.homeAsks) q.push({
          type: "scene", id: "home", age: g.age, title: "집을 살 수 있을 만큼 모였어요",
          text: D.housing.regions[g.region] + "에서 우리 소득으로 살 만한 집값을 주거실태조사의 소득 대비 집값 배수로 계산했어요.",
          home: { price: price, loan: need, pay: pay, years: n, rate: rate * 100, nominal: D.baseRate.rate + A.loanSpread },
          ask: "집을 살까요?",
          options: [
            { label: "산다", sub: need > 0 ? n + "년 동안 대출을 갚아요" : "대출 없이 사요", run: () => {
              g.savings -= (price - need); g.loan = need; g.loanPay = pay; g.loanLeft = need > 0 ? n : 0; g.loanRate = rate;
              g.home = { price: price, age: g.age }; g.ev.push({ a: g.age, k: "home" });
              L.push({ k: "out", t: "집 계약 (내 돈)", v: price - need });
              if (need > 0) L.push({ k: "note", t: "주택 대출 " + Math.round(need / 1e4).toLocaleString("ko-KR") + "만 원" });
            } },
            { label: "계속 빌려 산다", sub: "월세를 내며 더 모아요", run: () => {} }
          ]
        });
      }
    }

    // 암 진단
    if (!g.cancer) {
      const p = band(D.cancer.ages, D.cancer.rate, g.age) / 100000;
      if (r() < p) {
        g.cancer = true; g.ev.push({ a: g.age, k: "ill" });
        g.cancerAge = g.age;
        const rest = g.employed ? A.illnessRestMonths : 0;
        q.push({
          type: "scene", id: "ill", age: g.age, title: "병원에서 온 소식",
          text: "건강검진 뒤 큰 병원에서 암 진단을 받았어요." + (rest ? " 치료를 받는 동안 " + rest + "개월 일을 쉬어요." : " 치료를 받으며 지내요."),
          help: "health",
          options: [{ label: "치료를 받는다", run: () => { g.illMonths = rest; } }]
        });
      }
    }
  };

  Game.prototype.settle = function () {
    const g = this, L = g.yearLines, T = g.tot;
    const year = g.year;
    const kidsHome = g.kids.filter((k) => k < A.kidLeavesAt).length;
    const kidTax = g.kids.filter((k) => k >= 8 && k <= 20).length;
    const kidsDep = g.kids.filter((k) => k <= 20).length;
    let income = 0;

    // 내 월급
    let months = g.employed ? Math.max(0, (g.workMonths || 0) - g.illMonths) : 0;
    g.illMonths = 0;
    if (months > 0 && g.wage > 0) {
      const fam = 1 + kidsDep + (g.spouse && !g.spouse.works ? 1 : 0);
      const s = payslip(g.wage, fam, kidTax, year);
      const gross = s.gross * months, net = s.net * months;
      L.push({ k: "in", t: "월급 " + months + "개월 (세전 " + won(s.gross) + ")", v: gross });
      L.push({ k: "out", t: "4대보험", v: s.insure * months });
      L.push({ k: "out", t: "소득세·지방소득세", v: (s.tax + s.local) * months });
      T.gross += gross; T.insure += s.insure * months; T.tax += (s.tax + s.local) * months;
      income += net;
      g.pMonths += months; g.pSum += s.pBase * months;
      g.lastSlip = s;
    }
    // 배우자
    if (g.spouse && g.spouse.works && g.age < A.mainJobEnd) {
      const sw = Math.max(D.minWage.monthly, Math.round(wageCurve(g.age) * g.spouse.pf * 10) * 1000);
      g.spouse.wage = sw;
      const s = payslip(sw, 1, 0, year);
      L.push({ k: "in", t: "배우자 월급 (세금·보험 뺀 금액)", v: s.net * 12 });
      income += s.net * 12; T.spouseNet += s.net * 12;
      g.spouse.pMonths += 12; g.spouse.pSum += s.pBase * 12;
    } else if (g.spouse) g.spouse.wage = 0;
    // 연금
    if (g.age >= D.pension.startAge) {
      const p = (g.npsMonthly + (g.spouse ? g.spouse.nps : 0)) * 12;
      if (p > 0) { L.push({ k: "in", t: "국민연금" + (g.spouse && g.spouse.nps ? " (부부)" : ""), v: p }); income += p; T.pension += p; }
    }
    // 이자
    if (g.savings > 0) {
      const it = Math.round(g.savings * REAL);
      L.push({ k: "in", t: "예금 이자", v: it }); g.savings += it; T.interest += it;
    } else if (g.savings < 0 && g.age < A.workEnd) { // 65세부터는 마이너스 통장이 더 늘지 않는다고 본다
      const it = Math.round(-g.savings * (REAL + A.loanSpread / 100));
      L.push({ k: "out", t: "마이너스 통장 이자", v: it }); g.savings -= it; T.loanInterest += it;
    }

    // 생활비
    const n = 1 + (g.married ? 1 : 0) + kidsHome;
    const floor = D.minWage.monthly * A.spendFloorShare * Math.sqrt(n) * 12;
    // 가구원수별 평균 소비지출(교육 지출 제외)을 기준으로, 우리 집 소득이 그 가구원수 평균보다 많고 적은 만큼 조정한다
    const SB = D.spendBySize, si = Math.min(5, n) - 1;
    const baseM = SB.spend[si] - SB.edu[si];
    const working = months > 0 || (g.spouse && g.spouse.wage > 0);
    let spend;
    if (working) spend = baseM * Math.pow(Math.max(0.3, income / 12 / SB.disposable[si]), A.spendElastic) * A.spendMode[g.saveMode] * 12;
    else spend = baseM * (g.age >= A.mainJobEnd ? RETIRE : 1) * A.spendMode[g.saveMode] * 12;
    spend = Math.max(floor, spend);
    // 자녀 사교육비: 학교급별 전체 학생 1인당 평균
    let tut = 0;
    g.kids.forEach((k) => { tut += k >= 7 && k <= 12 ? D.tutoring.elementary : k >= 13 && k <= 15 ? D.tutoring.middle : k >= 16 && k <= 18 ? D.tutoring.high : 0; });
    tut = Math.round(tut * 10000 * 12);
    let rent = 0;
    if (g.home) {
      // 대출을 갚는 동안에는 남는 돈 안에서 쓴다(최소 생활비 아래로는 내려가지 않음)
      if (g.loan > 0 && working) spend = Math.max(floor, Math.min(spend, income - g.loanPay - tut));
    } else { spend = spend * (1 + (D.housing.rir[g.region] - D.housing.rir.all) / 100); rent = spend * D.housing.rir[g.region] / 100; }
    // 은퇴 뒤 잔고가 없으면 들어오는 돈만큼만 쓴다
    const due = (g.loan > 0 ? Math.min(g.loanPay, Math.round(g.loan * (1 + g.loanRate))) : 0) + tut;
    if (!working && g.savings + income - spend - due < 0 && g.age >= A.mainJobEnd) {
      // 남은 예금과 들어오는 돈에서 대출 상환을 뺀 만큼만 쓴다. 다만 들어오는 돈 안에서 최소 생활비는 쓴다
      spend = Math.max(Math.min(floor, income), Math.max(0, g.savings) + income - due);
      rent = Math.min(rent, spend);
      if (!g.flags.zero) { g.flags.zero = true; g.zeroAge = g.age; g.ev.push({ a: g.age, k: "zero" }); L.push({ k: "note", t: "모아 둔 돈을 다 썼어요. 이제 들어오는 돈으로만 살아요", help: "money" }); }
    }
    spend = Math.round(spend);
    const spendLine = { k: "out", t: "생활비" + (rent > 0 ? " (월세 " + won(Math.round(rent / 12 / 1e4) * 1e4) + " 포함)" : ""), v: spend };
    L.push(spendLine);
    if (tut > 0) { L.push({ k: "out", t: "자녀 사교육비", v: tut }); T.tutoring += tut; }
    T.rent += Math.round(rent);

    // 대출 상환
    let loanOut = 0;
    if (g.loan > 0) {
      const interest = Math.round(g.loan * g.loanRate);
      let pay = Math.min(g.loanPay, g.loan + interest);
      g.loan = Math.max(0, g.loan + interest - pay);
      g.loanLeft--; T.loanInterest += interest; loanOut = pay;
      L.push({ k: "out", t: "주택 대출 상환 (이자 " + won(interest) + ")", v: pay });
      if (g.loan <= 0) { g.loan = 0; L.push({ k: "note", t: "주택 대출을 다 갚았어요" }); }
    }

    // 마이너스 통장에는 한도가 있다. 한도를 넘으면 집이 있으면 팔아서 대출을 갚고, 그래도 넘으면 한도 안에서만 쓴다
    const limit = -D.minWage.monthly * A.minusLimitMonths;
    let end = g.savings + income - spend - loanOut - tut;
    if (end < limit && g.home) {
      const back = g.home.price - g.loan;
      L.push({ k: "in", t: "집을 팔고 대출을 갚은 뒤 남은 돈", v: back });
      L.push({ k: "note", t: "대출을 감당하기 어려워 집을 팔고 월세로 옮겼어요", help: "money" });
      end += back; g.loan = 0; g.loanPay = 0; g.home = null; g.homeAsks = A.homeAskMax; g.flags.soldHome = true; g.ev.push({ a: g.age, k: "sold" });
    }
    if (end < limit) {
      const cut = Math.min(spend, limit - end);
      spend -= cut; end += cut; spendLine.v = spend;
      if (!g.flags.limit) { g.flags.limit = true; L.push({ k: "note", t: "마이너스 통장 한도까지 썼어요. 이제 들어오는 돈 안에서만 살아요", help: "money" }); }
    }
    T.spend += spend;
    g.savings = end;
    if (g.savings > g.peak) { g.peak = Math.round(g.savings); g.peakAge = g.age; }
    if (g.savings < 0 && !g.flags.minus) { g.flags.minus = true; L.push({ k: "note", t: "통장이 마이너스가 됐어요", help: "money" }); }

    const out = { type: "year", age: g.age, year: year, lines: L, balance: Math.round(g.savings), net: Math.round(g.netWorth()), employed: g.employed, retired: g.retired };
    g.snap = g.snap || {};
    if ([30, 40, 50, 60, 65].includes(g.age)) g.snap[g.age] = Math.round(g.netWorth());

    // 한 해가 지남
    const q = D.life.q[Math.min(100, g.age)] / 100000;
    if (g.r() < q) {
      g.dead = true; g.deathAge = g.age;
      g.cause = g.pickCause();
      out.last = true;
    }
    if (g.employed) g.tenure++;
    g.kids = g.kids.map((k) => k + 1);
    g.age++; g.year++;
    return out;
  };

  Game.prototype.pickCause = function () {
    const g = this, d = D.death;
    let i = 0;
    for (let k = 0; k < d.ages.length; k++) if (g.age >= d.ages[k]) i = k;
    const all = d.all[i];
    const parts = [["neoplasm", d.neoplasm[i]], ["circ", d.circ[i]], ["resp", d.resp[i]], ["external", d.external[i]]];
    const other = all - parts.reduce((s, p) => s + p[1], 0);
    parts.push(["other", other]);
    let x = g.r() * all;
    for (const p of parts) { if (x < p[1]) return p[0]; x -= p[1]; }
    return "other";
  };

  Game.prototype.summary = function () {
    const g = this, T = g.tot;
    const years = (g.deathAge || g.age) - g.startAge + 1;
    const net = Math.round(g.netWorth());
    const pct = D.assets.netPct;
    let rank = 0;
    const n65 = g.snap && g.snap[65];
    if (n65 != null) { for (let i = 0; i < pct.length; i++) if (n65 / 1e4 >= pct[i]) rank = (i + 1) * 10; }
    return {
      seed: g.seed, startAge: g.startAge, endAge: g.deathAge, years: years, cause: g.cause,
      region: g.region, jobType: g.jobType,
      gross: T.gross, tax: T.tax, insure: T.insure, spend: T.spend, rent: T.rent, interest: T.interest,
      severance: T.severance, pension: T.pension, loanInterest: T.loanInterest, spouseNet: T.spouseNet, benefit: T.benefit, tutoring: T.tutoring,
      net: net, savings: Math.round(g.savings), home: g.home, loan: g.loan,
      npsMonthly: g.npsMonthly, pYears: Math.round(g.pMonths / 12 * 10) / 10,
      married: g.married, kids: g.kids.length, cancer: g.cancer, cancerAge: g.cancerAge,
      zeroAge: g.zeroAge, flags: g.flags, snap: g.snap || {}, rank65: n65 != null ? rank : null,
      history: g.history, firstSlip: g.firstSlip, ev: g.ev, peak: g.peak, peakAge: g.peakAge
    };
  };

  function won(v) {
    const m = Math.round(v / 1e4);
    return m.toLocaleString("ko-KR") + "만 원";
  }

  root.TJ = { REAL: REAL, RETIRE: RETIRE, Game: Game, payslip: payslip, wageCurve: wageCurve, npsMonthly: npsMonthly, assume: A, won: won, SIZE: SIZE, rng: rng };
})(typeof window !== "undefined" ? window : globalThis);
