// 통장 일대기 — 이야기: 해마다 한 줄 문장, 통장 권 제목, 도장 모음
// 문장은 그해 엔진에서 실제로 일어난 사실(facts)과 상태로만 고른다. 통계에 없는 사건을 지어내지 않는다.
(function (root) {
  function hash(a, b) { let x = (Math.imul(a ^ 0x9e3779b9, 2654435761) ^ Math.imul(b + 7, 40503)) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return x >>> 0; }
  const pick = (arr, seed, age) => arr[hash(seed, age) % arr.length];

  // 그해에 있었던 일(중요한 것부터). 문장 끝은 과거형.
  const FACT = [
    ["first", ["첫 월급이 들어왔다. 통장을 새로 만들었다.", "첫 출근을 했다. 명세서를 세 번 읽었다.", "처음으로 내 이름 앞으로 돈이 들어왔다."]],
    ["ill", ["암 진단을 받았다. 치료를 받으며 한 해를 보냈다.", "큰 병원에 다녔다. 달력이 진료 예약으로 채워졌다."]],
    ["pension0", ["예순다섯이 됐다. 낸 기간이 짧아 달마다 받는 연금은 없었다."]],
    ["loss", ["회사가 문을 닫았다. 한동안 쉬고 다시 출근했다.", "일자리를 잃었다. 이력서를 다시 꺼냈다.", "다니던 일터가 사라졌다. 구직급여로 버텼다."]],
    ["exitRest", ["오래 다닌 일터를 떠났다. 당분간 쉬기로 했다.", "마지막 출근을 했다. 내일 알람은 맞추지 않았다."]],
    ["exitRe", ["오래 다닌 일터를 떠났다. 다른 일을 구했다.", "퇴직금이 들어왔다. 며칠 뒤 새 일터에 나갔다."]],
    ["marry", ["같이 살기로 했다. 통장이 하나가 됐다.", "결혼했다. 지출 칸에 두 사람 몫이 찍혔다.", "둘이 됐다. 냉장고가 금방 찼다."]],
    ["kid1", ["첫째가 태어났다. 지출 칸이 길어지기 시작했다.", "아이가 태어났다. 잠은 줄고 영수증은 늘었다."]],
    ["kid2", ["둘째가 태어났다. 집이 조금 좁아졌다.", "둘째가 왔다. 첫째가 형님이 됐다."]],
    ["kid3", ["셋째가 태어났다. 식탁 의자를 하나 더 샀다."]],
    ["homeLoan", ["대출을 끼고 집을 샀다. 등기부에 내 이름이 올랐다.", "집을 샀다. 은행과 긴 약속을 했다."]],
    ["home", ["대출 없이 집을 샀다. 열쇠가 묵직했다."]],
    ["sold", ["대출이 버거워 집을 팔았다. 다시 월세 계약서를 썼다."]],
    ["zero", ["모아 둔 돈이 바닥났다. 들어오는 돈에 맞춰 살기 시작했다."]],
    ["limit", ["마이너스 통장이 한도에 닿았다. 씀씀이를 줄였다."]],
    ["minus", ["통장 잔액 앞에 처음으로 빼기 표시가 붙었다."]],
    ["pension", ["연금 첫 달이 들어왔다. 평생 낸 돈이 돌아오기 시작했다.", "예순다섯이 됐다. 월급 칸 자리에 연금이 찍혔다."]],
    ["loanPaid", ["집 대출을 다 갚았다. 그날은 통장을 오래 들여다봤다.", "마지막 상환이 빠져나갔다. 집이 온전히 내 것이 됐다."]],
    ["carFirst", ["{car}가 생겼다. 주차장에 괜히 내려가 봤다."]],
    ["carBuy", ["{car}가 생겼다. 주차장에 괜히 내려가 봤다."]],
    ["carGone", ["{car}와 작별했다. 주차 자리가 넓어 보였다."]],
    ["college", ["아이가 대학에 들어갔다. 등록금 칸이 새로 생겼다."]],
    ["move", ["회사를 옮겼다. 명함을 새로 팠다.", "이직했다. 퇴직금이 한 번 들어오고 근속은 다시 1년이 됐다."]],
    ["rejoin", ["다시 출근했다. 월급날이 돌아왔다."]],
    ["school", ["아이가 초등학교에 들어갔다. 학원비 칸이 생겼다."]],
    ["kidLeft", ["아이가 독립했다. 식탁이 조용해졌다."]]
  ];
  // 별일 없는 해
  const QUIET = {
    young: ["별일 없이 지나간 해. 통장은 조금 두꺼워졌다.", "월급날을 열두 번 맞았다.", "야근이 잦았다. 그래도 남는 달이 더 많았다.", "적금 하나가 만기가 됐다. 바로 새로 들었다.", "월세가 올랐다. 점심값도 올랐다.", "친구 결혼식이 많은 해였다.", "아낀다고 아꼈는데 숫자는 비슷했다.",
      "월세 계약서에 한 번 더 도장을 찍었다.", "일이 손에 익었다. 퇴근이 조금 빨라졌다.", "자취방 냉장고가 처음으로 꽉 찼다.", "월급은 스쳐 갔고, 그래도 조금은 남았다.", "출근길이 눈 감고도 가는 길이 됐다.", "명세서의 공제 칸을 처음으로 끝까지 읽었다.", "부모님께 용돈을 드렸다. 통장은 조금 얇아졌다."],
    couple: ["둘이서 조용히 한 해를 보냈다.", "장 보는 요령이 늘었다.", "가계부를 쓰다 말았다. 그래도 남았다.", "주말마다 집을 보러 다녔다. 아직은 구경이었다.", "저녁 메뉴를 정하는 데 가장 오래 걸렸다.", "둘의 통장 비밀번호가 같아졌다.", "기념일에 조금 좋은 밥을 먹었다.", "이불을 한 채 더 샀다."],
    family: ["아이는 크고 통장은 제자리였다.", "아이 옷이 철마다 작아졌다.", "가족사진을 한 장 찍었다.", "외식이 줄고 배달이 늘었다.", "아이 키가 통장 잔액보다 빨리 자랐다.",
      "주말은 아이 일정으로 채워졌다.", "냉장고에 아이 그림이 붙었다.", "장 보는 카트가 무거워졌다.", "아이 생일 초가 하나 늘었다.", "가계부의 맨 윗줄이 아이 이름이 됐다.", "방학이 길게 느껴졌다.", "아이 신발을 한 치수 크게 샀다."],
    teen: ["아이 방문이 자주 닫혀 있었다.", "학원비가 월세만큼 나갔다.", "아이와 말이 줄었다. 용돈은 늘었다.", "아이가 나보다 커졌다.", "밥상에서 휴대폰을 내려놓게 하느라 애썼다.", "시험 기간에는 집이 조용했다.", "학부모 단체 대화방 알림을 꺼 뒀다.", "아이 교복을 한 치수 크게 맞췄다."],
    grown: ["아이가 집에 있는 날이 줄었다.", "아이가 어른이 됐다. 식비는 그대로였다.", "빨래가 줄었다.", "아이와 마주 앉아 밥을 먹는 날이 드물어졌다.", "아이 방에 불이 늦게까지 켜져 있었다."],
    loan: ["대출 이자가 월급날보다 먼저 나갔다.", "갚고 또 갚았다. 원금이 조금 줄었다.", "집은 그대로인데 대출만 작아졌다.", "상환일을 달력에 동그라미 쳤다.", "대출 잔액의 앞자리가 바뀌었다.", "베란다 화분이 하나 늘었다.", "집에 못을 하나 박았다. 내 집이라 괜찮았다."],
    late: ["별일 없이 지나간 해. 그게 다행인 나이가 됐다.", "건강검진 결과지를 오래 읽었다.", "후배가 팀장이 됐다.", "퇴직 이야기가 남의 일 같지 않았다.", "회식 자리에서 먼저 일어났다.", "노안이 왔다. 명세서를 멀리 들고 읽었다.", "연금 예상액을 처음 조회해 봤다.", "오래 쓴 지갑을 바꿨다."],
    rest: ["일을 쉬었다. 모아 둔 돈에서 생활비가 나갔다.", "알람 없이 일어났다. 통장은 조금씩 가벼워졌다.", "연금까지 남은 해를 손으로 세어 봤다.", "평일 낮의 동네를 처음 알았다.", "구인 공고를 가끔 들여다봤다.", "지출을 한 줄씩 줄였다."],
    pension: ["연금이 열두 번 들어왔다.", "쓰는 돈이 줄었다. 병원 갈 일은 늘었다.", "산책로를 하나 더 외웠다.", "통장을 정리하러 은행에 다녀왔다.", "손에 쥔 것은 줄었지만 급할 것도 없었다.", "달력에 병원 예약이 가장 많았다.",
      "아침이 길어졌다. 신문을 끝까지 읽었다.", "시장에 가는 요일이 정해졌다.", "오래된 사진을 정리했다.", "연금 들어오는 날을 달력에 적어 뒀다.", "낮잠이 늘었다. 통장은 천천히 줄었다.", "옛 동료와 점심을 먹었다. 밥값은 번갈아 냈다."],
    old: ["올해도 통장에 한 줄이 찍혔다.", "친구의 부고를 받았다.", "천천히 걷는 법을 배웠다.", "창가 자리가 좋아졌다.", "한 해가 한 계절처럼 지나갔다.",
      "약 봉투가 하나 늘었다.", "해가 잘 드는 자리에 의자를 옮겼다.", "통장 글씨가 작게 느껴졌다. 돋보기를 샀다.", "봄이 온 것을 창밖 나무로 알았다.", "전화가 오면 반가웠다.", "하루가 짧고 조용했다.", "계절마다 같은 옷을 꺼내 입었다."]
  };
  // recent: 최근에 쓴 문장들(같은 문장이 가까이에서 되풀이되지 않게 건너뛴다)
  function yearLine(e, seed, recent) {
    const f = e.facts || [];
    const choose = (arr) => {
      const ok = arr.filter((t) => !(e.home && /월세|집을 보러/.test(t)));
      const start = hash(seed, e.age) % ok.length;
      for (let i = 0; i < ok.length; i++) { const t = ok[(start + i) % ok.length]; if (!recent || recent.indexOf(t) < 0) return t; }
      return ok[start];
    };
    for (let i = 0; i < FACT.length; i++) if (f.indexOf(FACT[i][0]) >= 0) return choose(FACT[i][1]);
    let k;
    if (e.age >= 80) k = "old";
    else if (e.age >= 65) k = "pension";
    else if (!e.employed) k = "rest";
    else if (e.kidAges && e.kidAges.some((a) => a < 13)) k = "family";
    else if (e.kidAges && e.kidAges.some((a) => a < 19)) k = "teen";
    else if (e.kidAges && e.kidAges.some((a) => a < 25)) k = "grown";
    else if (e.loan) k = "loan";
    else if (e.age >= 48) k = "late";
    else if (e.married) k = "couple";
    else k = "young";
    return choose(QUIET[k]);
  }
  // 한 해의 줄: 가장 큰 사실 한 줄(line)과 그 줄에 찍을 도장(seal), 같은 해의 다른 사실들(more)
  const HEAVY = ["ill", "loss", "sold", "zero", "limit", "minus"];
  function yearInfo(e, seed, recent) {
    const f = e.facts || [], keys = FACT.map((x) => x[0]).filter((k) => f.indexOf(k) >= 0);
    const line = yearLine(e, seed, recent);
    const heavy = HEAVY.some((k) => f.indexOf(k) >= 0);
    const top = keys[0];
    const more = keys.slice(1, 3).map((k) => ({ text: FACT.find((x) => x[0] === k)[1][0], seal: heavy ? "" : (SEAL[k] || "") }));
    return { line: line, seal: top && !heavy ? (SEAL[top] || "") : "", more: more, heavy: heavy };
  }
  // 도장을 찍는 사실(무거운 일에는 찍지 않는다)
  const SEAL = { marry: "결혼", kid1: "첫째", kid2: "둘째", kid3: "셋째", homeLoan: "내 집", home: "내 집", loanPaid: "완납", pension: "연금", first: "개설", carFirst: "첫 차", carBuy: "새 차", college: "입학" };
  function sealOf(e) { const f = e.facts || []; for (const k in SEAL) if (f.indexOf(k) >= 0) return SEAL[k]; return ""; }

  // 통장 한 권 = 10년
  const BOOK = { 10: "열아홉, 처음 받는 나이", 20: "스물, 처음 받는 나이", 30: "서른, 버티는 나이", 40: "마흔, 갚아 나가는 나이", 50: "쉰, 내려놓기 시작하는 나이", 60: "예순, 정리하는 나이",
    70: "일흔, 받아 쓰는 나이", 80: "여든, 덜어 내는 나이", 90: "아흔, 덤으로 사는 나이", 100: "백, 통장이 따라온 나이" };
  const bookTitle = (age) => BOOK[Math.floor(age / 10) * 10] || "";

  // 도장 모음. test(s): 그 판의 요약으로 받았는지 판단
  const has = (s, t) => (s.tags || []).indexOf(t) >= 0;
  const STAMPS = [
    { id: "hundred", t: "백 세\n통장", d: "100세까지 통장을 이어 갔어요", test: (s) => s.endAge >= 100 },
    { id: "ninety", t: "아흔\n고개", d: "90세를 넘겼어요", test: (s) => s.endAge >= 90 },
    { id: "sixty", t: "통장\n60년", d: "통장을 60년 넘게 썼어요", test: (s) => s.years >= 60 },
    { id: "nohome", t: "무주택\n은퇴", d: "집 없이 65세를 맞았어요", test: (s) => s.snap[65] != null && s.yrHome.indexOf("1") < 0 },
    { id: "early", t: "서른 전\n내 집", d: "서른 전에 집을 샀어요", test: (s) => (s.ev || []).some((e) => e.k === "home" && e.a < 30) },
    { id: "paid", t: "대출\n완납", d: "집 대출을 끝까지 갚았어요", test: (s) => (s.ev || []).some((e) => e.k === "home") && !(s.ev || []).some((e) => e.k === "sold") && !s.loanLeft },
    { id: "nodebt", t: "마이너스\n없이", d: "통장이 한 번도 마이너스가 되지 않았어요", test: (s) => !s.flags.minus && s.endAge >= 65 },
    { id: "oneco", t: "한 회사\n30년", d: "옮기지 않고 30년을 다녔어요", test: (s) => !s.flags.moved && !s.flags.lostJob && s.leftAge && s.leftAge - s.startAge >= 30 },
    { id: "mover", t: "이직\n세 번", d: "회사를 세 번 넘게 옮겼어요", test: (s) => s.flags.moved >= 3 },
    { id: "up", t: "최저임금\n→대기업", d: "최저임금 일자리에서 시작해 대기업까지 갔어요", test: (s) => s.startJob === "min" && s.everLarge },
    { id: "again", t: "다시\n일어남", d: "일자리를 두 번 잃고도 다시 일했어요", test: (s) => s.flags.lostJob >= 2 },
    { id: "rehire", t: "두 번째\n일터", d: "퇴직 뒤 다시 일했어요", test: (s) => s.rehired },
    { id: "three", t: "아이\n셋", d: "아이 셋을 키웠어요", test: (s) => s.kids >= 3 },
    { id: "college", t: "학부모\n졸업", d: "아이를 대학까지 보냈어요", test: (s) => s.college > 0 },
    { id: "solo", t: "혼자서\n끝까지", d: "혼자 65세를 넘겼어요", test: (s) => !s.married && s.endAge >= 65 },
    { id: "pension200", t: "연금\n200만", d: "국민연금이 월 200만 원을 넘었어요", test: (s) => s.npsMonthly >= 2000000 },
    { id: "billion", t: "10억\n통장", d: "65세 순자산이 10억 원을 넘었어요", test: (s) => s.snap[65] >= 1e9 },
    { id: "gym", t: "헬스장\n3번", d: "헬스장 1년권을 끊고 세 번 갔어요", test: (s) => has(s, "gym") },
    { id: "cat", t: "집사", d: "따라온 고양이와 살게 됐어요", test: (s) => has(s, "cat") },
    { id: "karaoke", t: "탬버린", d: "한 곡이 다섯 곡이 됐어요", test: (s) => has(s, "karaoke") },
    { id: "trade", t: "네고\n방어", d: "반값 흥정을 정중히 거절했어요", test: (s) => has(s, "trade") },
    { id: "garden", t: "상추\n부자", d: "상추가 너무 잘 자랐어요", test: (s) => has(s, "garden") },
    { id: "marathon", t: "완주", d: "마라톤을 끝까지 달렸어요", test: (s) => has(s, "marathon") },
    { id: "firstcar", t: "첫 차", d: "첫 차가 생겼어요", test: (s) => has(s, "firstCar") },
    { id: "car15", t: "한 차로\n15년", d: "차 한 대를 15년 탔어요", test: (s) => has(s, "car15") },
    { id: "testdrive", t: "회장님\n시승", d: "친구의 수입차를 조심조심 몰아 봤어요", test: (s) => has(s, "testDrive") },
    { id: "rider", t: "라이더", d: "스쿠터나 오토바이를 탔어요", test: (s) => has(s, "rider") },
    { id: "lcat", t: "전설의\n집사", d: "전설: 고양이가 동네 유명 인사가 됐어요", legend: 1, test: (s) => has(s, "legendCat") },
    { id: "lart", t: "전설의\n안목", d: "전설: 벼룩시장 그림이 화가의 초기작이었어요", legend: 1, test: (s) => has(s, "legendArt") },
    { id: "lnb", t: "전설의\n이웃", d: "전설: 해마다 김장 김치가 와요", legend: 1, test: (s) => has(s, "legendNeighbor") },
    { id: "lsuper", t: "전설의\n차주", d: "전설: 낮고 넓적한 노란 차를 샀어요", legend: 1, test: (s) => has(s, "legendSuper") }
  ];
  const earned = (s) => STAMPS.filter((st) => { try { return st.test(s); } catch (e) { return false; } }).map((st) => st.id);

  root.TJ_STORY = { yearInfo: yearInfo, yearLine: yearLine, sealOf: sealOf, bookTitle: bookTitle, STAMPS: STAMPS, earned: earned, hash: hash };
})(typeof window !== "undefined" ? window : globalThis);
