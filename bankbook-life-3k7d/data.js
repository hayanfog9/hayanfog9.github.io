// 통장 일대기 — 통계와 규칙 데이터
// 모든 값은 공식 원문에서 직접 확인한 것만 넣는다. 확인일 2026-11-10.
// src: 출처 표기, yr: 기준, url: 확인한 주소
(function (root) {
  const D = {
    checked: "2026-11-10",

    // ── 일과 월급 ─────────────────────────────────────────────
    minWage: {
      hourly: 10320, monthly: 2156880, yr: "2026년",
      src: "최저임금위원회", url: "https://www.minimumwage.go.kr/minWage/policy/decisionMain.do"
    },
    wage: {
      // 임금근로자 월평균소득(세전), 만원
      mean: 375, median: 288,
      byAge: { 20: 271, 30: 397, 40: 469, 50: 445, 60: 293, 70: 165 },
      bySize: { large: 613, sme: 307 },
      yr: "2024년 12월",
      src: "국가데이터처(옛 통계청) 「2024년 임금근로일자리 소득(보수) 결과」",
      url: "https://mods.go.kr/board.es?act=view&bid=11113&list_no=443648&mid=a10301030500"
    },
    jobs: {
      employRate1564: 69.8, unemp: 2.8, unempYouth: 6.1, yr: "2025년",
      src: "국가데이터처 「2025년 12월 및 연간 고용동향」",
      url: "https://mods.go.kr/board.es?mid=a10301030200&bid=210&act=view&list_no=443017"
    },
    firstJob: {
      monthsAll: 11.2, monthsCollege: 8.5, yr: "2026년 5월",
      src: "국가데이터처 「2026년 5월 경제활동인구조사 청년층 부가조사 결과」",
      url: "https://mods.go.kr/board.es?mid=a10301030200&bid=210&act=view&list_no=446080"
    },

    mainJob: {
      leftShare: 69.5, leftAge: 53.0, tenure: "17년 7.1개월", yr: "2026년 5월",
      src: "국가데이터처 「2026년 5월 경제활동인구조사 고령층 부가조사 결과」",
      url: "https://mods.go.kr/board.es?mid=a10301030200&bid=210&act=view&list_no=446335"
    },

    // ── 떼이는 돈 ─────────────────────────────────────────────
    deduct: {
      pensionRate: 0.0475,           // 2026년 근로자 부담(전체 9.5%)
      // 국민연금 보험료율 인상 일정(전체 요율, 근로자는 절반)
      pensionSchedule: { 2026: 9.5, 2027: 10.0, 2028: 10.5, 2029: 11.0, 2030: 11.5, 2031: 12.0, 2032: 12.5, 2033: 13.0 },
      pensionBaseMax: 6590000, pensionBaseMin: 410000, // 기준소득월액 2026.7~2027.6
      health: 0.03595,               // 건강보험 7.19%의 절반
      care: 0.009448 / 2,            // 장기요양 0.9448%의 절반
      employ: 0.009,                 // 고용보험 근로자
      yr: "2026년",
      src: "국민연금법(법률 제20903호), 국민연금공단, 국민건강보험공단, 4대사회보험 정보연계센터",
      url: "https://www.law.go.kr/nwRvsLsInfoR.do?lsiSeq=270511"
    },
    taxTable: {
      yr: "2026.3.1 시행", src: "국세청 근로소득 간이세액표",
      // 월급 1,000만원 이상 구간 기준 세액(부양가족 1~11명)
      base10000: [1507400, 1431570, 1200840, 1170840, 1140840, 1110840, 1080840, 1050840, 1020840, 990840, 960840]
    },
    severance: {
      rule: "계속근로 1년에 30일분 이상의 평균임금",
      src: "근로자퇴직급여 보장법 제8조"
    },

    // ── 결혼, 출산 ────────────────────────────────────────────
    marriage: {
      // 연령별 혼인율(해당 연령 인구 1천 명당 건), 2025년, 남·여
      ages: [20, 25, 30, 35, 40, 45, 50, 55, 60],
      male: [2.7, 25.0, 53.6, 29.2, 9.9, 4.7, 3.1, 2.5, 1.2],
      female: [7.6, 44.3, 57.6, 21.1, 6.5, 3.3, 2.5, 2.0, 0.7],
      firstAge: { male: 33.9, female: 31.6 },
      yr: "2025년", src: "국가데이터처 「2025년 혼인·이혼 통계」",
      url: "https://mods.go.kr/board.es?mid=a10301010000&bid=204&act=view&list_no=444103"
    },
    birth: {
      // 모의 연령별 출산율(해당 연령 여자인구 1천 명당 명), 2025년
      ages: [15, 20, 25, 30, 35, 40, 45],
      rate: [0.4, 3.8, 21.2, 73.1, 52.1, 8.5, 0.3],
      tfr: 0.80, firstChildMotherAge: 33.2,
      yr: "2025년", src: "국가데이터처 「2025년 출생 통계」",
      url: "https://mods.go.kr/board.es?mid=a10301010000&bid=204&act=view&list_no=446625"
    },

    // ── 집, 자산 ──────────────────────────────────────────────
    housing: {
      regions: { metro: "수도권", city: "광역시 등", prov: "도 지역" },
      pir: { all: 6.3, metro: 8.7, city: 6.3, prov: 4.0 },       // 자가가구 연소득 대비 주택가격(중위수)
      rir: { all: 15.8, metro: 18.4, city: 15.2, prov: 12.7 },   // 임차가구 월소득 대비 월임대료(중위수), %
      ownRate: { all: 61.4, metro: 55.6, city: 63.5, prov: 69.4 },
      liveInOwn: { all: 58.4, metro: 52.7, city: 60.0, prov: 66.5 },
      firstHomeYears: 7.9,
      yr: "2024년", src: "국토교통부 「2024년도 주거실태조사 결과」",
      url: "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156728491"
    },
    assets: {
      // 가구주 연령대별 평균, 만원 (2025.3말)
      byAge: {
        "39세 이하": { asset: 31498, debt: 9548, net: 21950 },
        "40대": { asset: 62714, debt: 14325, net: 48389 },
        "50대": { asset: 66205, debt: 11044, net: 55161 },
        "60세 이상": { asset: 60095, debt: 6504, net: 53591 }
      },
      meanNet: 47144, medianNet: 23860,
      // 순자산 분위 경계값 P10~P90, 만원
      netPct: [1210, 5108, 10296, 16472, 23860, 33050, 46180, 69380, 110020],
      yr: "2025년 3월 말", src: "국가데이터처·한국은행·금융감독원 「2025년 가계금융복지조사 결과」",
      url: "https://mods.go.kr/board.es?mid=a10301010000&bid=215&act=view&list_no=439535"
    },

    // ── 생활비, 금리 ──────────────────────────────────────────
    spend: {
      income: 5295000, spend: 2932000, disposable: 4235000, propensity: 69.2, surplusRate: 30.8,
      yr: "2026년 2분기", src: "국가데이터처 「2026년 2/4분기 가계동향조사 결과」",
      url: "https://eiec.kdi.re.kr/policy/materialView.do?num=285882"
    },
    // 가구원수별 가구당 월평균 지출(원), 2025년 연간. edu = 그중 교육 지출
    spendBySize: {
      size: [1, 2, 3, 4, 5],
      spend: [1757319, 2710796, 3884655, 4786967, 5206755],
      edu: [30486, 62446, 292008, 737166, 909437],
      // 가구원수별 월평균 처분가능소득(원), 2026년 2분기 (연간 자료에는 소득이 없음)
      disposable: [2493157, 4101117, 5762427, 6538580, 7680935],
      avgSize: 2.19, avgSpend: 2939091,
      yr: "2025년 연간(처분가능소득은 2026년 2분기)",
      src: "국가데이터처 가계동향조사, KOSIS 「가구원수별 가구당 월평균 가계수지(전국, 1인 이상)」",
      url: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1L9U105"
    },
    // 가구주 연령별 월평균 소비지출(원), 2025년 연간
    spendByAge: {
      under40: 2823513, a40: 3846542, a50: 3535257, over60: 2212339, over65: 1984459, over65Size: 1.79,
      yr: "2025년 연간", src: "국가데이터처 가계동향조사, KOSIS 「가구주 연령별 가구당 월평균 가계수지」",
      url: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1L9U108"
    },
    // 소득 5분위별(2026년 2분기): 처분가능소득과 소비지출(원)
    spendByQuintile: {
      disposable: [1094426, 2517745, 3703190, 5234691, 8620782],
      spend: [1371588, 1951939, 2651793, 3486011, 5199270],
      yr: "2026년 2분기", src: "국가데이터처 가계동향조사, KOSIS 「소득5분위별 가구당 월평균 가계수지」",
      url: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1L9U103"
    },
    // 전체 학생 1인당 월평균 사교육비(만원), 2025년
    tutoring: {
      elementary: 43.3, middle: 46.1, high: 49.9, all: 45.8,
      yr: "2025년", src: "국가데이터처·교육부 「2025년 초중고 사교육비조사 결과」",
      url: "https://eiec.kdi.re.kr/policy/materialView.do?num=277854"
    },
    baseRate: {
      rate: 3.00, yr: "2026.10.22 결정", src: "한국은행 기준금리",
      // 물가안정목표(소비자물가 상승률 기준, 2019년 이후) — 지금 돈 가치로 바꿀 때 씀
      target: 2.0, targetUrl: "https://www.bok.or.kr/portal/main/contents.do?menuNo=200291",
      url: "https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643"
    },

    // ── 은퇴 ──────────────────────────────────────────────────
    pension: {
      startAge: 65, replace: 43,
      avgMonthly: 706150, avg20y: 1173493, avgYr: "2026년 6월",
      src: "국민연금공단 「국민연금 공표통계(2026년 6월말)」, 보건복지부",
      url: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0056M0.do",
      // A값: 전체 가입자 평균소득월액 3년 평균. 2025.12~2026.11 지급사유 발생분에 적용
      A: 3193511, constant: 1.29, minYears: 10,
      formulaUrl: "https://www.nps.or.kr/pnsinfo/ntpsklg/getOHAF0048M0.do"
    },
    jobBenefit: {
      rate: 0.6,            // 평균임금의 60% (고용보험법 제46조)
      maxDaily: 68100,      // 기초일액 상한 113,500원 × 60% (시행령 제68조, 2026.1.1 시행)
      minDaily: 66048,      // 최저임금 10,320원 × 8시간 × 80%
      // 소정급여일수(고용보험법 별표 1)
      days: function (age, years) {
        const i = years < 1 ? 0 : years < 3 ? 1 : years < 5 ? 2 : years < 10 ? 3 : 4;
        return (age >= 50 ? [120, 180, 210, 240, 270] : [120, 150, 180, 210, 240])[i];
      },
      yr: "2026년", src: "고용보험법 제46조·별표 1, 같은 법 시행령 제68조",
      url: "https://www.law.go.kr/법령/고용보험법"
    },
    // 도움받을 곳 (각 기관 공식 누리집에서 번호 확인, 2026-11-10)
    help: {
      money: [
        { name: "서민금융콜센터(서민금융진흥원)", tel: "1397", note: "평일 9~18시", url: "https://www.kinfa.or.kr/main.do" },
        { name: "신용회복위원회 채무상담", tel: "1375", note: "평일 9~18시", url: "https://www.ccrs.or.kr/" }
      ],
      job: [
        { name: "고용노동부 고객상담센터", tel: "1350", note: "평일 9~18시", url: "https://1350.moel.go.kr/home/" }
      ],
      health: [
        { name: "국가암정보센터", tel: "1577-8899", note: "평일 9~18시", url: "https://www.cancer.go.kr/" },
        { name: "국민건강보험공단", tel: "1577-1000", note: "평일 9~18시", url: "https://www.nhis.or.kr/nhis/index.do" }
      ],
      mind: [
        { name: "자살예방상담전화", tel: "109", note: "24시간", url: "https://www.129.go.kr/109" },
        { name: "정신건강 위기상담전화", tel: "1577-0199", note: "", url: "https://www.mohw.go.kr/menu.es?mid=a10706040100" },
        { name: "보건복지상담센터", tel: "129", note: "평일 9~18시, 긴급 지원은 24시간", url: "https://www.129.go.kr/" }
      ],
      pension: [
        { name: "국민연금공단", tel: "1355", note: "평일 9~18시", url: "https://www.nps.or.kr/main.do" }
      ]
    },
    basicPension: {
      single: 349700, threshold: 2470000, yr: "2026년", src: "보건복지부",
      url: "https://mohw.go.kr/board.es?act=view&bid=0027&list_no=1488572&mid=a10503000000"
    },
    elderly: {
      share65: 21.6, povertyRate66: 37.7, yr: "2026년(빈곤율은 2024년)",
      src: "국가데이터처 「2026 고령자 통계」",
      url: "https://mods.go.kr/board.es?mid=a10301010000&bid=10820&act=view&list_no=447294"
    },

    // ── 수명, 사망, 질병 ──────────────────────────────────────
    life: {
      e0: 83.7, e0m: 80.8, e0f: 86.6, yr: "2024년",
      src: "국가데이터처 「생명표」 완전생명표(1세별), KOSIS",
      url: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1B42&conn_path=I2",
      // 사망확률(전체) x 100000, 배열 위치 = 나이(0~100세 이상)
      q: [238,24,17,11,9,8,8,7,6,6,6,8,10,12,15,17,20,23,26,28,30,32,34,37,39,41,44,47,50,52,54,56,58,60,62,65,71,78,85,93,101,108,114,121,128,137,148,162,178,193,209,227,244,263,283,305,328,351,377,404,433,468,509,552,595,639,691,757,835,928,1038,1164,1306,1458,1636,1826,2048,2307,2629,3056,3573,4163,4818,5531,6355,7266,8274,9385,10601,11927,13365,14916,16579,18353,20235,22217,24294,26454,28686,30973,100000]
    },
    death: {
      yr: "2025년", total: 362968,
      src: "국가데이터처 「사망원인통계」, KOSIS",
      url: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1B34E01&conn_path=I2",
      // 나이대(5세) 시작 나이와 사망자 수(명). 대분류 5개로 묶음: 나머지는 '그 밖의 질환'
      ages: [15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90],
      all:      [559,807,1454,1923,2483,4211,6038,10225,14621,20852,27647,31534,41062,61967,70565,66010],
      neoplasm: [60,80,168,232,433,967,1607,3195,5265,8435,11915,12557,14035,15465,11929,5787],
      circ:     [15,39,89,132,266,526,852,1554,2217,3220,4484,5353,7647,12749,15554,14824],
      resp:     [9,18,15,31,45,76,161,293,583,1147,2038,3316,5436,10027,12713,12324],
      external: [395,544,958,1131,1148,1532,1731,2139,2417,2480,2390,2170,2288,2904,2685,1935]
    },
    cancer: {
      yr: "2023년", crude: 564.3,
      src: "보건복지부 「암등록통계」, KOSIS",
      url: "https://kosis.kr/statHtml/statHtml.do?orgId=117&tblId=DT_117N_A00023&conn_path=I2",
      // 모든 암 조발생률(인구 10만 명당), 나이대 시작 나이
      ages: [15,20,25,30,35,40,45,50,55,60,65,70,75,80,85],
      rate: [24.0,50.7,109.9,191.6,267.7,375.5,453.0,541.9,654.0,894.9,1182.4,1525.7,1798.5,1930.8,1781.9]
    }
  };
  root.TJ_DATA = D;
})(typeof window !== "undefined" ? window : globalThis);
