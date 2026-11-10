// 통장 일대기 — 곁가지 장면: 소소한 하루(재미, 돈 안 움직임), 돌발(돈이 움직임, 금액은 가정), 차와 오토바이(가정)
// 통계 계산용 난수(g.r)는 쓰지 않는다. 재미는 g.fr, 돌발과 차는 g.sr을 쓴다.
(function (root) {
  const D = root.TJ_DATA;

  // ── 금액과 확률: 모두 우리가 정한 가정(공식 통계 아님). 화면 "출처와 가정"에 그대로 보여 준다 ──
  const X = {
    funGap: 3, funProb: 0.3, funMax: 7,
    calmNeed: D.minWage.monthly * 12, // 잔액이 이보다 적은 해에는 곁가지 장면을 넣지 않는다(그해에 통장이 바닥날 수 있어서)
    surGap: 6, surProb: 0.16, surMax: 6,
    friend: 3000000, oldbank: 800000, quiz: 500000, quizWin: 0.5, washerNew: 900000, weddings: 400000, prize: 300000,
    leakFix: 1800000, leakShare: 900000,
    bumpIns: 300000,
    moveCost: 3000000, moveRaise: 0.05,
    pet: 1500000, parentsAll: 6000000, parentsShare: 2000000,
    biz: 10000000, bizBack: 0.2,
    legendProb: 0.0009, legendCat: 2000000, legendArt: 20000000,
    carAskGap: 5, carAskProb: 0.35, carAskMax: 2, carMax: 2, carNeed: 12000000,
    cars: {
      scooter: { price: 2500000, keep: 500000 }, bike: { price: 9000000, keep: 1200000 }, used: { price: 8000000, keep: 1500000 }, small: { price: 16000000, keep: 1700000 },
      compact: { price: 23000000, keep: 2000000 }, mid: { price: 32000000, keep: 2300000 }, suv: { price: 42000000, keep: 2700000 },
      imported: { price: 70000000, keep: 4000000 }, importedSuv: { price: 95000000, keep: 4800000 }, superc: { price: 400000000, keep: 20000000 }
    },
    importCash: 1, importInst: 0.6, importShow: 45, importFix: 3500000, // 수입차: 예금이 값의 1배면 현금, 0.6배면 할부 선택지가 나온다
    carDep: 0.85, carLife: 15, carStopAge: 80, instYears: 5, instAdd: 0.10, superNeed: 2000000000
  };
  // 차·오토바이 이름: 모두 지어낸 이름이다(통제실·JW가 정함, 2026-11-10). 실제 모델명·로고·차 생김새는 쓰지 않는다.
  const CAR = {
    scooter: { kind: "스쿠터", names: ["배달스파 골목대장", "번개표 동네한바퀴", "배달스파 치킨특급"], img: "sur_scooter" },
    bike: { kind: "오토바이", names: ["할배슨 아저씨의 꿈", "번개표 주말라이더", "할배슨 바람막이"], img: "sur_scooter" },
    used: { kind: "중고 경차", names: ["규아 털털이", "핸대 십년지기", "규아 물려받음"], img: "sur_car_small" },
    small: { kind: "경차", names: ["규아 콩알", "핸대 꼬마", "핸대 깡총이"], img: "sur_car_small" },
    compact: { kind: "준중형차", names: ["핸대 무난", "규아 성실", "핸대 출퇴근"], img: "sur_car_small" },
    mid: { kind: "중형차", names: ["핸대 든든", "규아 점잖", "규아 반듯"], img: "sur_car_suv" },
    suv: { kind: "SUV", names: ["규아 씩씩", "핸대 캠핑가자", "핸대 산타할배"], img: "sur_car_suv" },
    imported: { kind: "수입 중형차", names: ["반츠 회장님", "볼보이 튼튼", "오우디 동그라미 넷 아님"], img: "sur_car_suv" },
    importedSuv: { kind: "수입 SUV", names: ["반츠 큰회장님", "볼보이 북유럽", "뱀따블유 콧구멍"], img: "sur_car_suv" },
    superc: { kind: "슈퍼카", names: ["름보르가니 황소고집", "빼로리 빨간맛", "쁘르쉐 개구리눈"], img: "sur_supercar" }
  };
  // 이름 고르기: 난수를 쓰지 않고 씨앗·나이로 정한다(계산과 무관). taken에 든 이름은 피하고, 직전 차와 같은 이름·같은 브랜드도 되도록 피한다
  const brand = (nm) => String(nm || "").split(" ")[0];
  function carName(g, id, taken) {
    const n = CAR[id].names, st = (g.seed + g.age * 7 + id.length * 3) % n.length, last = g.x.lastCar || "", tk = taken || [];
    const order = n.map((_, i) => n[(st + i) % n.length]);
    return order.find((x) => tk.indexOf(x) < 0 && x !== last && brand(x) !== brand(last)) || order.find((x) => tk.indexOf(x) < 0 && x !== last) || order.find((x) => tk.indexOf(x) < 0) || order[0];
  }
  const NICK_A = ["회색", "은색", "하얀", "남색", "초록", "빨간"], NICK_B = ["똑딱이", "붕붕이", "구름이", "고래", "완두", "감자"];
  const man = (v) => Math.round(v / 1e4).toLocaleString("ko-KR") + "만 원";

  function pay(g, L, label, amount) { // amount > 0 들어옴, < 0 나감
    g.savings += amount; g.x.net += amount;
    L.push({ k: amount > 0 ? "in" : "out", t: label + " (가정)", v: Math.abs(amount), x: 1 });
  }
  const note = (L, t, kind) => L.push({ k: "note", t: t, kind: kind || "fun" });
  const tag = (g, t) => { g.x.tags[t] = 1; };
  const working = (g) => g.employed && g.wage > 0;
  // 받침에 따라 조사를 고른다: josa("수원", "으로", "로")
  const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); if (c < 0xac00 || c > 0xd7a3) return b; const j = (c - 0xac00) % 28; return j === 0 || (a === "으로" && j === 8) ? b : a; };
  const twoWheel = (g) => !!g.x.car && (g.x.car.id === "scooter" || g.x.car.id === "bike");

  // ── 소소한 하루: 돈이 움직이지 않는다 ───────────────────────────
  const FUN = [
    { id: "chicken", ok: working, title: "월급날 치킨", text: "월급이 들어왔어요. 정신을 차려 보니 치킨이 두 마리 와 있어요. 한 마리는 내일의 나에게 주기로 했는데, 내일의 나는 받지 못했어요." },
    { id: "refund", ok: working, title: "13월의 월급", text: "연말정산 환급금이 들어왔어요. 금액은 묻지 마세요. 아무도 없는 줄 알고 방에서 춤을 췄는데, 창문이 열려 있었어요." },
    { id: "parcel", title: "옆집으로 간 택배", text: "배송 완료 문자는 왔는데 문 앞이 비어 있어요. 택배는 옆집 문 앞에서 사흘째 자리를 지키고 있었어요. 덕분에 옆집과 처음 인사했어요." },
    { id: "gym", ok: (g) => g.age < 70, title: "헬스장 1년권", text: "올해는 다를 것 같아서 헬스장 1년권을 끊었어요. 세 번 갔어요. 운동화는 지금도 새것이에요.", tag: "gym" },
    { id: "cat", ok: (g) => g.age < 75, title: "따라온 고양이", text: "집에 오는 길에 고양이 한 마리가 문 앞까지 따라왔어요. 문 앞에 앉아서 당연하다는 얼굴로 올려다봐요.",
      opts: [["문을 열어 준다", "오늘부터 집사예요. 집주인이 누구인지는 고양이가 정했어요.", "cat"], ["인사만 한다", "다음 날도 와 있어요. 밥그릇을 사 버렸어요.", "cat"]] },
    { id: "fridge", title: "냉장고 발굴", text: "냉장고 맨 안쪽에서 정체를 알 수 없는 반찬통이 나왔어요. 언제 넣었는지 아무도 몰라요. 뚜껑은 열지 않기로 했어요." },
    { id: "trade", title: "네고 되나요", text: "안 타는 자전거를 중고로 내놓았어요. 1분 만에 연락이 왔어요. 반값에, 집 앞까지 가져다 달래요. 정중히 거절했더니 이틀 뒤 제값에 팔렸어요. 사 간 분이 음료수까지 주고 갔어요.", tag: "trade" },
    { id: "holiday", ok: (g) => g.age < 40, title: "명절 잔소리 방어전", text: "명절이에요. \"요즘 뭐 하니\"가 세 번째 돌아왔어요. 전을 입에 가득 넣고 고개만 끄덕이는 기술로 버텼어요." },
    { id: "karaoke", ok: working, title: "노래방 탈출 작전", text: "회식 2차가 노래방으로 정해졌어요. 문 쪽 자리를 잡는 데까지는 성공했어요. 한 곡만 부르고 나오려 했는데 한 곡이 다섯 곡이 됐어요. 탬버린은 끝까지 놓지 않았어요.", tag: "karaoke" },
    { id: "scribble", ok: (g) => g.kids.some((k) => k >= 3 && k <= 7), title: "우리 집 벽화", text: "조용해서 가 보니 거실 벽이 미술관이 되어 있어요. 작가는 자기가 안 그렸다고 해요. 손에 크레파스를 쥔 채로요." },
    { id: "garden", ok: (g) => g.age >= 65, title: "상추 풍년", text: "재미로 심은 상추가 너무 잘 자랐어요. 이웃에게 나눠 주고 또 나눠 줘도 남아요. 이제 이웃이 저를 보면 먼저 손을 흔들고 빠르게 지나가요.", tag: "garden" },
    { id: "carwash", img: "sur_car_small", ok: (g) => !!g.x.car && !twoWheel(g), title: "세차한 날", text: "큰맘 먹고 {car}를 반짝반짝하게 닦았어요. 한 시간 뒤에 비가 왔어요. 일기예보는 어제까지 맑음이었어요." },
    { id: "doording", img: "sur_carbump", ok: (g) => !!g.x.car && !twoWheel(g), title: "주차장 문콕", text: "{car} 옆구리에 못 보던 점이 하나 생겼어요. 범인은 못 찾았어요. 이제 그 점까지 {car}의 얼굴이 됐어요." }
  ];

  // ── 돌발: 돈이 움직인다. 금액은 가정 ─────────────────────────────
  const SUR = [
    { id: "friend", img: "sur_bonus", ok: (g) => g.age >= 35, title: "10년 만에 온 입금", text: "잊고 있던 이름으로 돈이 들어왔어요. 10년 전에 빌려 간 친구예요. 메모 칸에는 \"늦어서 미안\" 다섯 글자가 적혀 있어요.",
      opts: [["고맙다고 답장한다", (g, L) => { pay(g, L, "친구가 갚은 돈", X.friend); note(L, "돈보다 다섯 글자가 더 오래 남았어요.", "sur"); }]] },
    { id: "bonus", ok: working, title: "깜짝 성과급", text: "예고도 없이 성과급이 나왔어요. 월급 한 달 치예요. 사무실이 오늘따라 조용하고 다들 표정이 좋아요.",
      opts: [["조용히 받는다", (g, L) => { pay(g, L, "깜짝 성과급", g.wage); note(L, "아무 일도 없던 것처럼 저녁을 먹었어요. 속으로만 웃었어요.", "sur"); }]] },
    { id: "oldbank", title: "서랍 속 통장", text: "이사 준비를 하다가 서랍 맨 아래에서 오래된 적금 통장이 나왔어요. 만기는 한참 전에 지났어요.",
      opts: [["은행에 가 본다", (g, L) => { pay(g, L, "잊고 있던 적금", X.oldbank); note(L, "과거의 내가 미래의 나에게 보낸 선물이었어요.", "sur"); }]] },
    { id: "quiz", img: "fun_refund", title: "퀴즈 프로그램 예선", text: "재미로 넣어 본 퀴즈 프로그램 예선에 붙었어요. 녹화장 조명이 생각보다 뜨거웠어요.",
      opts: [["버저를 누른다", (g, L) => { if (g.sr() < X.quizWin) { pay(g, L, "퀴즈 상금", X.quiz); note(L, "마지막 문제는 찍었는데 맞았어요. 방송에는 3초 나왔어요.", "sur"); } else note(L, "첫 문제에서 떨어졌어요. 기념 수건은 지금도 잘 써요.", "sur"); }]] },
    { id: "medal", ok: (g) => g.age < 60, title: "마라톤 완주", text: "친구 따라 신청한 10km 마라톤 날이에요. 7km부터는 걷는 것과 속도가 같았어요.",
      opts: [["끝까지 간다", (g, L) => { tag(g, "marathon"); note(L, "완주했어요. 메달은 현관에 걸어 뒀어요. 일주일 동안 계단이 무서웠어요.", "sur"); }]] },
    { id: "leak", ok: (g) => !!g.home, title: "천장에서 비가 온다", text: "자다가 이마에 물방울을 맞았어요. 위층 배관에서 물이 새요. 집에 있는 그릇이 다 나왔어요.",
      opts: [["위층과 이야기해 나눠 낸다", (g, L) => { pay(g, L, "천장 수리비(절반)", -X.leakShare); note(L, "위층 분이 귤 한 상자를 들고 내려왔어요. 천장은 새하얘졌어요.", "sur"); }, man(X.leakShare) + "이 나가요. 며칠 걸려요"],
        ["내 돈으로 바로 고친다", (g, L) => { pay(g, L, "천장 수리비", -X.leakFix); note(L, "하루 만에 끝났어요. 통장도 조금 하얘졌어요.", "sur"); }, man(X.leakFix) + "이 나가요"]] },
    { id: "carbump", ok: (g) => !!g.x.car && !twoWheel(g), title: "쿵", text: "주차하다가 뒤차와 살짝 닿았어요. {car}도 놀라고 저도 놀랐어요. 다친 사람은 없어요.",
      opts: [["보험으로 처리한다", (g, L) => { pay(g, L, "접촉 사고 자기부담금", -X.bumpIns); note(L, "보험사 직원이 저보다 침착했어요.", "sur"); }, man(X.bumpIns) + "이 나가요"]] },
    { id: "transfer", ok: (g) => working(g) && g.age < 50, title: "갑작스러운 발령", text: "월요일 아침에 발령 공지가 떴어요. 다음 달부터 다른 도시의 지사에서 일해 달래요. 대신 월급을 올려 준대요.",
      opts: [["간다", (g, L) => { pay(g, L, "이사 비용", -X.moveCost); g.pf *= 1 + X.moveRaise; g.wage = Math.round(g.wage * (1 + X.moveRaise) / 1000) * 1000;
          const P = root.TJ_PLACE, m = g.x.moves || 0; g.x.moves = m + 1;
          const a = P ? P.live(g.seed, g.region, m).short : "", b = P ? P.live(g.seed, g.region, m + 1).short : "";
          note(L, (a && b ? a + "에서 " + b + josa(b, "으로", "로") + " 옮겼어요. " : "") + "낯선 동네의 단골 국밥집을 찾는 데 2주 걸렸어요.", "sur"); g.facts.push("moved"); }, "이사비 " + man(X.moveCost) + ", 월급은 5% 올라요"],
        ["안 간다", (g, L) => note(L, "자리는 그대로예요. 그 지사 맛집 이야기는 건너 들었어요.", "sur")]] },
    { id: "petsurgery", ok: (g) => !!g.x.tags.cat, title: "병원에 간 고양이", text: "고양이가 밥을 안 먹어서 병원에 갔더니 수술이 필요하대요. 병원 가는 내내 저보다 고양이가 더 크게 울었어요.",
      opts: [["수술한다", (g, L) => { pay(g, L, "고양이 수술비", -X.pet); note(L, "수술은 잘 끝났어요. 고양이는 사흘 동안 저를 모른 척했어요.", "sur"); }, man(X.pet) + "이 나가요"]] },
    { id: "parents", img: "fun_holiday", ok: (g) => g.age >= 40 && g.age <= 60, title: "부모님 병원비", text: "부모님이 입원하셨어요. 큰 병은 아니지만 병원비가 꽤 나왔어요.",
      opts: [["내가 다 낸다", (g, L) => { pay(g, L, "부모님 병원비", -X.parentsAll); note(L, "퇴원하는 날 부모님이 병원 앞에서 국수를 사 주셨어요.", "sur"); }, man(X.parentsAll) + "이 나가요"],
        ["형제와 나눠 낸다", (g, L) => { pay(g, L, "부모님 병원비(나눠 냄)", -X.parentsShare); note(L, "단체 대화방이 오랜만에 시끄러웠어요.", "sur"); }, man(X.parentsShare) + "이 나가요"]] },
    { id: "business", ok: (g) => g.age >= 30 && g.age <= 55 && g.savings > X.biz * 2, title: "\"이건 무조건 돼\"", text: "오랜만에 만난 동창이 커피를 사면서 사업 이야기를 꺼내요. 지금 넣으면 1년 안에 세 배가 된대요. 자리는 딱 하나 남았대요.",
      opts: [["같이 한다", (g, L) => { pay(g, L, "동창 사업 투자", -X.biz); if (g.sr() < X.bizBack) { pay(g, L, "돌려받은 원금", X.biz); note(L, "1년 뒤 사업은 접혔고, 원금은 겨우 돌려받았어요. 큰돈을 약속하는 제안은 계약서와 사업자 정보를 먼저 확인해요.", "sur"); } else note(L, "동창의 전화기가 꺼져 있어요. 큰돈을 약속하는 제안은 계약서와 사업자 정보를 먼저 확인해요.", "sur"); }, man(X.biz) + "을 넣어요"],
        ["거절한다", (g, L) => note(L, "커피값은 제가 냈어요. 큰돈을 약속하는 제안은 계약서와 사업자 정보를 먼저 확인해요.", "sur")]] }
  ];
  SUR.push(
    { id: "washer", noimg: 1, title: "세탁기의 마지막 탈수", text: "세탁기가 큰 소리를 내더니 멈췄어요. 안에는 젖은 빨래가 가득해요. 10년을 썼으니 할 만큼은 했어요.",
      opts: [["새로 산다", (g, L) => { pay(g, L, "새 세탁기", -X.washerNew); note(L, "새 세탁기는 조용해요. 너무 조용해서 가끔 들여다봐요.", "sur"); }, man(X.washerNew) + "이 나가요"]] },
    { id: "weddings", noimg: 1, ok: (g) => g.age < 45, title: "청첩장의 계절", text: "한 달에 청첩장이 네 장 왔어요. 주말마다 뷔페를 먹었어요. 봉투를 네 번 채웠어요.",
      opts: [["봉투를 채운다", (g, L) => { pay(g, L, "축의금 네 번", -X.weddings); note(L, "갈비찜 맛집이 어디인지 알게 됐어요.", "sur"); }]] },
    { id: "testdrive", img: "sur_car_suv", ok: (g) => g.age >= 26 && g.age < 60, title: "회장님 시승", text: "친구가 새로 뽑은 ‘반츠 회장님’에 태워 줬어요. 잠깐 운전대도 잡게 해 줬어요. 방지턱 앞에서 둘 다 숨을 참았어요.",
      opts: [["조심조심 몬다", (g, L) => { tag(g, "testDrive"); note(L, "시속 30km로 동네를 한 바퀴 돌았어요. 내려서 손바닥 땀을 닦았어요.", "sur"); }]] },
    { id: "importfix", img: "sur_car_suv", ok: (g) => !!g.x.car && (g.x.car.id === "imported" || g.x.car.id === "importedSuv" || g.x.car.id === "superc"), title: "바다를 건너오는 부품", text: "{car} 계기판에 처음 보는 불이 들어왔어요. 정비소에서 부품이 바다를 건너와야 한대요. 견적서의 숫자를 두 번 읽었어요.",
      opts: [["고친다", (g, L) => { pay(g, L, "수입차 수리비", -X.importFix); note(L, "3주 만에 돌아왔어요. 그동안 버스 노선을 다시 외웠어요.", "sur"); }, man(X.importFix) + "이 나가요"]] },
    { id: "prize", noimg: 1, title: "경품 당첨", text: "마트 영수증 추첨에 뽑혔어요. 살면서 처음이에요. 상품은 쌀 20kg과 상품권이에요.",
      opts: [["받으러 간다", (g, L) => { pay(g, L, "경품 상품권", X.prize); note(L, "쌀은 들고 오다가 두 번 쉬었어요.", "sur"); }]] }
  );
  // 전설: 아주 드물게
  const LEGEND = [
    { id: "legendcat", ok: (g) => !!g.x.tags.cat, title: "전설: 동네 유명 고양이", text: "따라왔던 그 고양이가 동네 유명 인사가 됐어요. 사진을 찍으러 사람들이 와요. 사료 회사에서 1년 치 사료와 사례비를 보냈어요.",
      opts: [["매니저가 된다", (g, L) => { pay(g, L, "고양이 사례비", X.legendCat); tag(g, "legendCat"); note(L, "이제 저는 그 고양이의 매니저로 불려요.", "sur"); }]] },
    { id: "painting", title: "전설: 벼룩시장의 그림", text: "예전에 벼룩시장에서 액자가 예뻐서 산 그림이 있어요. 알고 보니 이름난 화가가 젊을 때 그린 그림이래요.",
      opts: [["미술관에 넘긴다", (g, L) => { pay(g, L, "그림 판 돈", X.legendArt); tag(g, "legendArt"); note(L, "액자는 돌려받았어요. 여전히 예뻐요.", "sur"); }]] },
    { id: "kimchi", title: "전설: 지갑 주인", text: "길에서 주운 지갑을 주인에게 돌려줬어요. 그해 겨울부터 문 앞에 해마다 김장 김치가 와요. 보내는 사람 이름은 없어요.",
      opts: [["잘 먹겠습니다", (g, L) => { tag(g, "legendNeighbor"); note(L, "김치냉장고를 살까 진지하게 고민했어요.", "sur"); }]] }
  ];

  function funScene(g, def, L) {
    const img = def.img || "fun_" + def.id;
    const opts = def.opts ? def.opts.map((o) => ({ label: o[0], run: () => { note(L, o[1]); if (o[2]) tag(g, o[2]); } }))
      : [{ label: "다음 줄로", run: () => { if (def.tag) tag(g, def.tag); } }];
    return { type: "scene", kind: "fun", id: "fun_" + def.id, age: g.age, title: def.title, text: def.text, img: img, options: opts };
  }
  function surScene(g, def, L, legend) {
    return { type: "scene", kind: "sur", legend: !!legend, id: "sur_" + def.id, age: g.age, title: def.title, text: def.text, img: def.noimg ? "" : (def.img || "sur_" + def.id),
      options: def.opts.map((o) => ({ label: o[0], sub: o[2] || "", run: () => o[1](g, L) })) };
  }

  // ── 차와 오토바이 ───────────────────────────────────────────────
  function buyCar(g, L, id, inst, name) {
    const c = X.cars[id];
    const car = { id: id, name: name || carName(g, id), price: c.price, value: c.price, years: 0, instLeft: 0, instPay: 0 };
    if (inst) { car.instLeft = X.instYears; car.instPay = Math.round(c.price * (1 + X.instAdd) / X.instYears); }
    else { pay(g, L, CAR[id].kind + " ‘" + car.name + "’ 값", -c.price); g.x.carNet -= c.price; }
    g.x.car = car; g.x.cars++; g.x.lastCar = car.name;
    if (id === "scooter" || id === "bike") tag(g, "rider"); else tag(g, "firstCar");
    if (id === "superc") tag(g, "legendSuper");
    g.facts.push(g.x.cars === 1 ? "carFirst" : "carBuy");
    note(L, "‘" + car.name + "’" + josa(car.name, "이", "가") + " 왔어요. " + (g.x.cars === 1 ? "이제부터 {car}라고 불러요." : "별명은 이번에도 {car}예요."), "car");
  }
  function carScene(g, L) {
    const s = g.savings, opts = [], taken = [];
    const add = (id, inst) => {
      const c = X.cars[id], nm = carName(g, id, taken); taken.push(nm);
      const tight = inst ? (c.price * (1 + X.instAdd) / X.instYears + c.keep) > s * 0.3 : c.price > s * 0.5;
      opts.push({ imp: id === "imported" || id === "importedSuv", label: CAR[id].kind + " ‘" + nm + "’" + (inst ? " (할부)" : ""), sub: (tight && (id === "imported" || id === "importedSuv") ? "통장이 휘청해요 · " : "") + (inst ? "5년 동안 해마다 " + man(c.price * (1 + X.instAdd) / X.instYears) + ", 유지비 한 해 " + man(c.keep) : "값 " + man(c.price) + ", 유지비 한 해 " + man(c.keep)), run: () => buyCar(g, L, id, inst, nm) });
    };
    if (g.age < 40 && s >= X.cars.scooter.price * 2) add("scooter", false);
    if (g.age >= 35 && g.age < 60 && s >= X.cars.bike.price * 3) add("bike", false);
    if (s >= X.cars.used.price * 1.3) add("used", false);
    if (s >= X.cars.small.price * 1.5) add("small", false); else if (s >= X.cars.small.price * 0.5) add("small", true);
    if (s >= X.cars.compact.price * 1.6) add("compact", false);
    if (s >= X.cars.mid.price * 1.6) add("mid", false); else if (s >= X.cars.mid.price * 0.6) add("mid", true);
    if (s >= X.cars.suv.price * 2 && g.kids.length) add("suv", false);
    // 수입차는 살 수 있는 형편이어도 차 장면의 절반쯤에서만 보인다(난수를 쓰지 않고 씨앗·나이로 정한다)
    const impShow = ((Math.imul((g.seed ^ Math.imul(g.age, 2654435761)) >>> 0, 2246822519) >>> 8) % 100) < X.importShow;
    if (!impShow) { /* 이번에는 국산차만 */ } else
    if (s >= X.cars.imported.price * X.importCash) add("imported", false); else if (s >= X.cars.imported.price * X.importInst) add("imported", true);
    if (!impShow) { /* 건너뜀 */ } else if (s >= X.cars.importedSuv.price * X.importCash) add("importedSuv", false); else if (s >= X.cars.importedSuv.price * X.importInst) add("importedSuv", true);
    if (!opts.length) return null;
    // 국산 둘 + 수입 하나(있으면). 수입차가 둘 다 되면 씨앗으로 하나를 고른다
    const dom = opts.filter((o) => !o.imp), imp = opts.filter((o) => o.imp);
    const pick = imp.length ? dom.slice(-2).concat([imp[(g.seed + g.age) % imp.length]]) : dom.slice(-3);
    pick.push({ label: "안 산다", sub: "버스와 지하철이면 충분해요", run: () => { g.x.carNo = (g.x.carNo || 0) + 1; note(L, "교통카드를 충전했어요. 창밖 구경은 덤이에요.", "car"); } });
    const big = pick.some((o) => /SUV|중형/.test(o.label));
    return { type: "scene", kind: "car", id: "car_offer", age: g.age, title: "차를 살까", text: "장을 보고 양손 가득 짐을 든 채 버스를 기다리다가 생각했어요. 차가 있으면 어떨까.", img: big ? "sur_car_suv" : "sur_car_small", options: pick,
      foot: "차값과 유지비는 통계가 아니라 가정이에요. 등장하는 차·오토바이 이름은 모두 지어낸 이름이에요." };
  }
  function dropCar(g, L, why) {
    const car = g.x.car; if (!car) return;
    const back = why === "scrap" ? 0 : Math.round(car.value);
    if (back > 0) { pay(g, L, "차를 판 돈", back); g.x.carNet += back; }
    g.x.carYearsMax = Math.max(g.x.carYearsMax || 0, car.years);
    if (car.years >= X.carLife) tag(g, "car15");
    note(L, why === "scrap" ? car.years + "년을 함께 달렸어요. " + (car.id === "scooter" || car.id === "bike" ? "마지막으로 안장을 한 번 닦아 줬어요." : "마지막으로 운전석에 한 번 앉아 봤어요.") : "새 주인에게 잘 부탁한다고 말했어요.", "car");
    g.facts.push("carGone");
    g.x.car = null; g.x.carAskAge = g.age;
  }
  // 그해에 끼워 넣을 장면을 정한다(통계 장면이 다 정해진 뒤 불린다)
  function plan(g, q, L) {
    const x = g.x;
    if (!x.nick) x.nick = NICK_A[Math.floor(g.sr() * NICK_A.length)] + " " + NICK_B[Math.floor(g.sr() * NICK_B.length)];
    // 차: 오래 탔거나 나이가 들면 보낸다
    if (x.car && (x.car.years >= X.carLife)) dropCar(g, L, "scrap");
    else if (x.car && (g.age >= X.carStopAge || g.savings < X.cars[x.car.id].keep)) dropCar(g, L, "sell");
    // 무거운 해와 그 앞뒤에는 넣지 않는다
    const heavy = g.dieNow || q.some((s) => s.id === "jobloss" || s.id === "ill") || g.age - g.heavyAge < 2 || g.savings < X.calmNeed;
    if (heavy || g.age - x.lastExtra < 2) return;
    // 차 제안
    if (g.useCar && !q.length && !x.car && x.carAsk < X.carAskMax && x.cars < X.carMax && g.age >= 24 && g.age < 70 && g.age - x.carAskAge >= X.carAskGap && g.savings >= X.carNeed && g.sr() < X.carAskProb) {
      x.carAskAge = g.age;
      const sc = carScene(g, L);
      if (sc) { x.carAsk++; q.push(sc); x.lastExtra = g.age; return; }
    }
    // 돌발
    if (g.useSur && x.surCount < X.surMax && g.age - x.lastSur >= X.surGap) {
      const roll = g.sr();
      if (roll < X.legendProb) {
        const pool = LEGEND.filter((d) => !x.seen[d.id] && (!d.ok || d.ok(g)));
        if (g.useCar && !x.car && g.savings >= X.superNeed && !x.seen.superc) pool.push({ id: "superc", img: "sur_supercar", title: "전설: 전시장 앞에서", text: "지나가다 전시장 유리창 너머로 낮고 넓적한 노란 차 ‘" + carName(g, "superc") + "’" + josa(carName(g, "superc"), "과", "와") + " 눈이 마주쳤어요. 통장을 떠올려 보니, 살 수 있어요.",
          opts: [["산다", (gg, LL) => buyCar(gg, LL, "superc", false), "값 " + man(X.cars.superc.price) + ", 유지비 한 해 " + man(X.cars.superc.keep)], ["눈으로만 본다", (gg, LL) => note(LL, "사진만 찍고 왔어요. 그날 밤 꿈에 나왔어요.", "sur")]] });
        if (pool.length) { const d = pool[Math.floor(g.sr() * pool.length)]; x.seen[d.id] = 1; x.surCount++; x.lastSur = x.lastExtra = g.age; q.push(surScene(g, d, L, true)); return; }
      } else if (roll < X.legendProb + X.surProb) {
        const pool = SUR.filter((d) => !x.seen[d.id] && (!d.ok || d.ok(g)));
        if (pool.length) { const d = pool[Math.floor(g.sr() * pool.length)]; x.seen[d.id] = 1; x.surCount++; x.lastSur = x.lastExtra = g.age; q.push(surScene(g, d, L, false)); return; }
      }
    }
    // 소소한 하루
    if (g.useFun && x.funCount < X.funMax && g.age - x.lastExtra >= X.funGap && g.fr() < X.funProb) {
      const pool = FUN.filter((d) => !x.seen[d.id] && (!d.ok || d.ok(g)));
      if (pool.length) { const d = pool[Math.floor(g.fr() * pool.length)]; x.seen[d.id] = 1; x.funCount++; x.lastExtra = g.age; q.push(funScene(g, d, L)); }
    }
  }

  // 해마다 나가는 곁가지 돈(차 할부와 유지비). 돌려준 금액만큼 그해 통장에서 빠진다
  function yearly(g, L) {
    const car = g.x.car; if (!car) return 0;
    let out = 0;
    if (car.instLeft > 0) { out += car.instPay; car.instLeft--; L.push({ k: "out", t: "{car} 할부 (가정)", v: car.instPay, x: 1 }); }
    const keep = X.cars[car.id].keep;
    out += keep; L.push({ k: "out", t: "{car} 보험·기름·수리 (가정)", v: keep, x: 1 });
    car.value *= X.carDep; car.years++;
    g.x.carNet -= out; g.x.net -= out;
    return out;
  }

  root.TJ_EXTRAS = { plan: plan, yearly: yearly, X: X, CAR: CAR, FUN: FUN, SUR: SUR, LEGEND: LEGEND };
})(typeof window !== "undefined" ? window : globalThis);
