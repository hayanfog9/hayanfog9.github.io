// 그날의 나 — 1차: 사진으로 꺼내기. 서버 없음. 사진과 글은 이 브라우저 밖으로 나가지 않는다.
// 구조: 엽서 한 장 = '엽서 기록'(rec) 한 덩어리. 그리기는 draw(canvas, rec, 사진) 한 함수(나중에 추억 슬라이드가 이 함수를 그대로 쓴다).
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const L = window.GN_LINES, SONGS = window.GN_SONGS;
  const SITE_TEXT = "hayanfog9.github.io/that-day-7q2m"; // 통제실이 주소를 정하면 여기만 바꾼다
  const FONT = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif';
  const MONO = 'ui-monospace,"Cascadia Mono",Consolas,"Courier New",monospace';
  const W = 1080, H = 1350, PS = 960; // 엽서 크기, 사진 칸 한 변
  const REGIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  const FILTERS = [["film", "필름"], ["fade", "빛바램"], ["leak", "빛샘"], ["vhs", "비디오"], ["bw", "흑백"], ["none", "그대로"]];
  const DECOS = [["0", "담백"], ["1", "보통"], ["2", "한껏"]];
  const FRAMES = [["pola", "폴라로이드"], ["diary", "일기장"]];
  const BGM = { flutter: "morning", miss: "dusk", sad: "night", stuck: "night", calm: "tea" };
  const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

  // ── 엽서 기록 ─────────────────────────────────────────────
  function newRec() {
    return { v: 1, mode: "photo", date: "", region: "", weather: null, mood: "miss", tod: "day", text: "", deco: 1, frame: "pola", filter: "film", room: "home", propNo: 0 };
  }
  const S = { rec: newRec(), photo: null, sq: null, filtered: null, filteredKey: "", lineNo: 0, touched: {}, songNo: 0, sound: false };

  // ── 날짜 ─────────────────────────────────────────────────
  function parseDate(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); if (!m) return null; const y = +m[1], mo = +m[2], d = +m[3]; const t = Date.UTC(y, mo - 1, d); const dt = new Date(t); if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null; return { y: y, m: mo, d: d, t: t, w: dt.getUTCDay() }; }
  function todayUTC() { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); }
  function daysSince(p) { return Math.round((todayUTC() - p.t) / 86400000); }
  const comma = (n) => n.toLocaleString("ko-KR");

  // ── 그날의 날씨: 기상청 관측값(해마다 묶어 둔 wx/<해>.js)을 필요할 때만 불러온다 ──
  // 하늘 상태는 관측값으로 우리가 나눈 것이다(가정): 신적설 > 0 눈, 강수량 > 0 비, 전운량 6 이상 흐림, 3 이상 구름 조금, 그 밖은 맑음
  const WX_FROM = 1980;
  // 시·도마다 원래 쓰는 관측소. 그 해에 자료가 없어 다른 관측소 값으로 대신했으면 카드에 그 이름을 적는다
  const WX_HOME = { 서울: "서울", 부산: "부산", 대구: "대구", 인천: "인천", 광주: "광주", 대전: "대전", 울산: "울산", 세종: "세종", 경기: "수원", 강원: "춘천", 충북: "청주", 충남: "서산", 전북: "전주", 전남: "목포", 경북: "안동", 경남: "창원", 제주: "제주" };
  function wxLoad(year, done) {
    window.GN_WX = window.GN_WX || {};
    if (window.GN_WX[year] !== undefined) return done();
    const sc = document.createElement("script"); sc.src = "wx/" + year + ".js";
    sc.onload = done; sc.onerror = () => { window.GN_WX[year] = null; done(); };
    document.head.appendChild(sc);
  }
  function wxAvgLoad(done) {
    if (window.GN_WXAVG !== undefined) return done();
    const sc = document.createElement("script"); sc.src = "wx/avg.js"; sc.onload = done; sc.onerror = () => { window.GN_WXAVG = null; done(); };
    document.head.appendChild(sc);
  }
  function wxOf(rec) {
    const p = parseDate(rec.date); if (!p || !rec.region) return null;
    const y = window.GN_WX && window.GN_WX[p.y], d = y && y[rec.region]; if (!d) return null;
    const i = Math.round((p.t - Date.UTC(p.y, 0, 1)) / 86400000);
    if (d.mn[i] == null || d.mx[i] == null) return null;
    const sky = d.sn[i] > 0 ? "눈" : d.rn[i] > 0 ? "비" : d.cl[i] == null ? "" : d.cl[i] >= 60 ? "흐림" : d.cl[i] >= 30 ? "구름 조금" : "맑음";
    return { sky: sky, min: Math.round(d.mn[i] / 10), max: Math.round(d.mx[i] / 10), min1: (d.mn[i] / 10).toFixed(1), max1: (d.mx[i] / 10).toFixed(1), rain: d.rn[i] / 10, snow: d.sn[i] / 10, stn: d.stn, sub: d.stn !== WX_HOME[rec.region] };
  }
  function wxUpdate() {
    const p = parseDate(S.rec.date), el = $("mWx");
    S.rec.weather = null;
    if (!p) { el.textContent = "날짜를 넣으면 날짜 도장과 \"그날로부터 ○일\"이 찍혀요. 지역까지 고르면 그날의 날씨도 찍혀요."; return; }
    if (!S.rec.region) { el.textContent = "그날 있던 곳을 고르면 그날의 날씨가 찍혀요(" + WX_FROM + "년부터)."; return; }
    const want = S.rec.date + "|" + S.rec.region;
    // 그날의 관측값이 없으면(1980년 이전, 아직 묶지 않은 최근 날짜) 그 달의 평균 기온만 보여 준다. 하늘 상태는 적지 않는다
    const useAvg = () => wxAvgLoad(() => {
      if (S.rec.date + "|" + S.rec.region !== want) return;
      const A = window.GN_WXAVG && window.GN_WXAVG[S.rec.region];
      if (!A) { el.textContent = "이 날짜의 관측 자료가 없어요. 날짜 도장만 찍혀요."; render(); composeScene(); return; }
      const mn = A.mn[p.m - 1] / 10, mx = A.mx[p.m - 1] / 10;
      S.rec.weather = { avg: true, sky: "", min: Math.round(mn), max: Math.round(mx), stn: "", sub: false };
      el.textContent = (p.y < WX_FROM ? WX_FROM + "년 이전이라 " : "") + "그날의 관측값은 없어요. 대신 이맘때(" + p.m + "월) " + S.rec.region + "의 평균을 보여 드려요: 최저 " + mn.toFixed(1) + "° / 최고 " + mx.toFixed(1) + "° (" + WX_FROM + "~2025년 기상청 관측값의 평균).";
      render(); composeScene();
    });
    if (p.y < WX_FROM) return useAvg();
    wxLoad(p.y, () => {
      if (S.rec.date + "|" + S.rec.region !== want) return;
      const w = wxOf(S.rec); S.rec.weather = w;
      if (!w) return useAvg();
      el.textContent = w ? "그날 " + S.rec.region + "(" + w.stn + " 관측소" + (w.sub ? " 값으로 대신" : "") + "): " + (w.sky ? w.sky + ", " : "") + "최저 " + w.min1 + "° / 최고 " + w.max1 + "°" + (w.rain > 0 ? ", 비 " + w.rain + "mm" : "") + (w.snow > 0 ? ", 새로 쌓인 눈 " + w.snow + "cm" : "") + ". 기상청 관측값이에요."
        : "이 날짜의 관측 자료가 없어요. 날짜 도장만 찍혀요.";
      render(); composeScene();
    });
  }

  // ── 사진 읽기: 찍은 날짜(EXIF)만 읽는다. 위치는 읽지 않는다 ──
  function exifDate(buf) {
    try {
      const v = new DataView(buf);
      if (v.getUint16(0) !== 0xffd8) return null;
      let off = 2;
      while (off + 4 < v.byteLength) {
        const marker = v.getUint16(off), size = v.getUint16(off + 2);
        if (marker === 0xffe1 && v.getUint32(off + 4) === 0x45786966) { // "Exif"
          const base = off + 10, le = v.getUint16(base) === 0x4949;
          const u16 = (o) => v.getUint16(o, le), u32 = (o) => v.getUint32(o, le);
          const readIfd = (start, want) => { const n = u16(start); for (let i = 0; i < n; i++) { const e = start + 2 + i * 12; if (e + 12 > v.byteLength) return null; if (u16(e) === want) return e; } return null; };
          const ifd0 = base + u32(base + 4);
          const ptr = readIfd(ifd0, 0x8769);
          let e = ptr != null ? readIfd(base + u32(ptr + 8), 0x9003) : null; // 찍은 시각
          if (e == null) e = readIfd(ifd0, 0x0132); // 없으면 파일에 적힌 시각
          if (e == null) return null;
          const at = base + u32(e + 8); let s = "";
          for (let i = 0; i < 19 && at + i < v.byteLength; i++) s += String.fromCharCode(v.getUint8(at + i));
          const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):/.exec(s);
          if (!m || +m[1] < 1970) return null;
          return { date: m[1] + "-" + m[2] + "-" + m[3], hour: +m[4] };
        }
        if ((marker & 0xff00) !== 0xff00 || size < 2) return null;
        off += 2 + size;
      }
    } catch (e) {}
    return null;
  }

  // 사진을 가운데 정사각형으로 잘라 PS×PS 캔버스에 담는다
  function toSquare(src) {
    const c = document.createElement("canvas"); c.width = c.height = PS;
    const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight, s = Math.min(sw, sh);
    c.getContext("2d").drawImage(src, (sw - s) / 2, (sh - s) / 2, s, s, 0, 0, PS, PS);
    return c;
  }
  // 사진의 밝기, 따뜻함, 선명함을 잰다(64×64로 줄여서)
  function analyze(sq) {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d"); x.drawImage(sq, 0, 0, 64, 64);
    const d = x.getImageData(0, 0, 64, 64).data; let lum = 0, warm = 0, sat = 0, green = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      lum += 0.299 * r + 0.587 * g + 0.114 * b; warm += (r - b); sat += mx ? (mx - mn) / mx : 0; if (g > r && g > b) green++;
    }
    const n = d.length / 4;
    return { lum: lum / n, warm: warm / n, sat: sat / n, green: green / n };
  }
  // 잰 값으로 시간대·기분·필터를 권한다(사용자가 이미 고른 것은 건드리지 않는다)
  function suggest(a, hour) {
    let tod = a.lum < 75 ? "night" : (a.warm > 22 && a.lum < 175) ? "dusk" : "day";
    if (hour != null) tod = hour < 6 || hour >= 20 ? "night" : hour >= 17 ? "dusk" : "day";
    let mood = "calm";
    if (tod === "night") mood = a.warm > 12 ? "calm" : "miss";
    else if (tod === "dusk") mood = "miss";
    else if (a.sat < 0.16 && a.lum < 130) mood = "sad";
    else if (a.sat > 0.34 && a.warm > 8) mood = "flutter";
    else if (a.green > 0.3) mood = "calm";
    const filter = tod === "night" ? "film" : tod === "dusk" ? "leak" : "fade";
    return { tod: tod, mood: mood, filter: filter };
  }

  // ── 날짜 모드의 장면: 미리 그린 조각을 겹친다(바깥 풍경 → 계절 가지 → 방 → 그 시절 물건 → 기분 소품) ──
  const TODS = [["dawn", "새벽"], ["day", "낮"], ["dusk", "노을"], ["night", "밤"]];
  const ROOMS = [["home", "내 방"], ["dorm", "자취방"], ["class", "교실"]];
  const ERA = [[1990, ["prop80_radio", "prop80_sharpener"]], [2000, ["prop90_pager", "prop90_cdplayer", "prop90_walkman", "prop90_letter"]], [2010, ["prop00_phone", "prop00_mp3", "prop00_camera", "prop00_diary"]], [9999, ["prop10_smartphone", "prop10_earbuds"]]];
  const MOODPROP = { flutter: "mood_flowers", miss: "mood_frame", sad: "mood_umbrella", stuck: "mood_paper", calm: "mood_plant" };
  const imgCache = {};
  function loadImg(src) { return imgCache[src] || (imgCache[src] = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; })); }
  function eraProps(year) { for (const e of ERA) if (year < e[0]) return e[1]; return ERA[ERA.length - 1][1]; }
  function sceneParts(rec) {
    const p = parseDate(rec.date), w = rec.weather, sky = w && w.sky;
    const wx = sky === "눈" ? "snow" : sky === "비" ? "rain" : sky === "흐림" ? "cloud" : "clear";
    const m = p ? p.m : 5, season = m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
    const list = eraProps(p ? p.y : 2004), prop = list[((rec.propNo || 0) + (p ? p.d : 0)) % list.length];
    return { out: "scene/out_" + rec.tod + "_" + wx + ".jpg", season: "scene/season_" + season + ".webp", room: "scene/room_" + (rec.room || "home") + ".webp", prop: "scene/" + prop + ".webp", mood: "scene/" + MOODPROP[rec.mood] + ".webp" };
  }
  // 방에는 시간대에 맞는 빛을 입힌다(낮: 밝게, 노을: 그대로, 밤: 어둡게, 새벽: 푸르게)
  function tintRoom(room, tod, size) {
    const PS = size || 960; // 방은 960, 물건·가지는 그 크기대로
    const c = document.createElement("canvas"); c.width = c.height = PS; const x = c.getContext("2d");
    x.drawImage(room, 0, 0, PS, PS);
    x.globalCompositeOperation = "source-atop";
    if (tod === "day") { x.fillStyle = "rgba(255,250,235,.22)"; x.fillRect(0, 0, PS, PS); }
    else if (tod === "night") { x.globalCompositeOperation = "multiply"; x.fillStyle = "rgb(120,125,165)"; x.fillRect(0, 0, PS, PS); x.globalCompositeOperation = "destination-in"; x.drawImage(room, 0, 0, PS, PS); }
    else if (tod === "dawn") { x.globalCompositeOperation = "multiply"; x.fillStyle = "rgb(195,205,230)"; x.fillRect(0, 0, PS, PS); x.globalCompositeOperation = "destination-in"; x.drawImage(room, 0, 0, PS, PS); }
    return c;
  }
  let sceneJob = 0;
  async function composeScene() {
    if (S.rec.mode !== "date") return;
    const job = ++sceneJob, parts = sceneParts(S.rec);
    const [out, season, room, prop, mood] = await Promise.all([loadImg(parts.out), loadImg(parts.season), loadImg(parts.room), loadImg(parts.prop), loadImg(parts.mood)]);
    if (job !== sceneJob) return;
    const c = document.createElement("canvas"); c.width = c.height = PS; const x = c.getContext("2d");
    if (out) x.drawImage(out, 0, 0, PS, PS); else { x.fillStyle = "#9db7d6"; x.fillRect(0, 0, PS, PS); }
    const tod = S.rec.tod, dim = tod === "night" || tod === "dawn"; // 밤과 새벽에는 가지와 물건에도 같은 빛을 입힌다
    if (season) x.drawImage(dim ? tintRoom(season, tod, 600) : season, 110, 80, 600, 600); // 가지는 창 왼쪽 위에 작게(창틀 뒤에 놓인다)
    if (room) x.drawImage(tintRoom(room, S.rec.tod), 0, 0);
    const home = (S.rec.room || "home") === "home";
    const ps = home ? 270 : 290;
    if (prop) x.drawImage(dim ? tintRoom(prop, tod, ps) : prop, home ? 585 : 540, home ? 600 : 628, ps, ps);
    if (mood && !home) x.drawImage(dim ? tintRoom(mood, tod, 220) : mood, 270, 672, 220, 220);
    S.sq = c; S.sqNo = (S.sqNo || 0) + 1; S.sceneOk = !!(out && room);
    render();
  }

  // ── 사진 필터(모두 이 캔버스 안에서) ───────────────────────
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function applyFilter(sq, name) {
    const c = document.createElement("canvas"); c.width = c.height = PS;
    const x = c.getContext("2d"); x.drawImage(sq, 0, 0);
    if (name === "none") return c;
    const im = x.getImageData(0, 0, PS, PS), d = im.data, src = name === "vhs" ? new Uint8ClampedArray(d) : null, r = rng(7);
    const half = PS / 2;
    for (let y = 0; y < PS; y++) {
      const dy = (y - half) / half;
      for (let xx = 0; xx < PS; xx++) {
        const i = (y * PS + xx) * 4; let R = d[i], G = d[i + 1], B = d[i + 2];
        const dx = (xx - half) / half, vig = dx * dx + dy * dy, n = r() - 0.5;
        if (name === "film" || name === "leak") {
          R = (R * 1.05 + 6 - 128) * 1.08 + 128; G = (G - 128) * 1.08 + 128; B = (B * 0.94 - 128) * 1.08 + 128;
          const v = 1 - 0.32 * vig, g = n * 22; R = R * v + g; G = G * v + g; B = B * v + g;
        } else if (name === "fade") {
          const l = 0.299 * R + 0.587 * G + 0.114 * B;
          R = (R * 0.65 + l * 0.35) * 0.82 + 46; G = (G * 0.65 + l * 0.35) * 0.82 + 42; B = (B * 0.65 + l * 0.35) * 0.82 + 28;
          const g = n * 14; R += g; G += g; B += g;
        } else if (name === "bw") {
          let l = 0.299 * R + 0.587 * G + 0.114 * B; l = (l - 128) * 1.15 + 128; l = l * (1 - 0.3 * vig) + n * 20; R = G = B = l;
        } else if (name === "vhs") {
          const xr = Math.min(PS - 1, xx + 4), xb = Math.max(0, xx - 4);
          R = src[(y * PS + xr) * 4]; B = src[(y * PS + xb) * 4 + 2];
          const l = 0.299 * R + 0.587 * G + 0.114 * B; R = R * 0.85 + l * 0.15; G = G * 0.85 + l * 0.15; B = B * 0.85 + l * 0.15 + 6;
          const line = (y % 4 === 0) ? 0.78 : 1, g = n * 26; R = R * line + g; G = G * line + g; B = B * line + g;
        }
        d[i] = R; d[i + 1] = G; d[i + 2] = B;
      }
    }
    x.putImageData(im, 0, 0);
    if (name === "leak") {
      x.globalCompositeOperation = "screen";
      let g = x.createRadialGradient(PS * 0.94, PS * 0.12, 0, PS * 0.94, PS * 0.12, PS * 0.95);
      g.addColorStop(0, "rgba(255,140,50,.62)"); g.addColorStop(0.5, "rgba(255,90,60,.2)"); g.addColorStop(1, "rgba(255,90,60,0)");
      x.fillStyle = g; x.fillRect(0, 0, PS, PS);
      g = x.createLinearGradient(0, 0, PS * 0.3, 0); g.addColorStop(0, "rgba(255,200,120,.28)"); g.addColorStop(1, "rgba(255,200,120,0)");
      x.fillStyle = g; x.fillRect(0, 0, PS, PS);
      x.globalCompositeOperation = "source-over";
    }
    return c;
  }

  // ── 글 꾸밈(규칙으로 되는 것만: 말줄임, 기호. 뜻은 바꾸지 않는다) ──
  function decorate(text, level) {
    let lines = String(text || "").split(/\n/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
    if (!lines.length) return [];
    if (level >= 1) lines = lines.map((s, i) => /[.!?…~]$/.test(s) ? s.replace(/\.$/, "..") : (i === lines.length - 1 ? s + ".." : s));
    if (level >= 2) { lines[0] = "☆ " + lines[0]; lines[lines.length - 1] = lines[lines.length - 1] + " ☆"; }
    return lines;
  }

  // ── 그리기 ───────────────────────────────────────────────
  function fitFont(c, text, px, weight, max, min) { c.font = weight + " " + px + "px " + FONT; while (c.measureText(text).width > max && px > min) { px -= 1; c.font = weight + " " + px + "px " + FONT; } return px; }
  function stampText(p) { return "'" + String(p.y).slice(2) + " " + p.m + " " + p.d; }
  function metaLeft(rec, p) {
    const a = [];
    if (p) a.push(WEEK[p.w] + "요일");
    if (rec.region) a.push(rec.region + (rec.weather && rec.weather.sub ? "(" + rec.weather.stn + " 관측값)" : ""));
    if (rec.weather) a.push((rec.weather.avg ? "이맘때 평균 " : rec.weather.sky ? rec.weather.sky + " · " : "") + rec.weather.min + "° / " + rec.weather.max + "°");
    return a.join(" · ");
  }
  function drawPhoto(c, photoCanvas, x, y, size) {
    if (photoCanvas) { c.drawImage(photoCanvas, x, y, size, size); return; }
    const g = c.createLinearGradient(0, y, 0, y + size); g.addColorStop(0, "#c9d3e2"); g.addColorStop(1, "#e9dcc6");
    c.fillStyle = g; c.fillRect(x, y, size, size);
    c.fillStyle = "#5d6a85"; c.textAlign = "center"; c.font = "700 " + Math.round(size * 0.045) + "px " + FONT; c.fillText("사진을 골라 주세요", x + size / 2, y + size / 2);
    c.textAlign = "left";
  }
  function drawStamp(c, p, right, bottom, px) {
    if (!p) return;
    c.save(); c.font = "700 " + px + "px " + MONO; c.textAlign = "right"; c.shadowColor = "rgba(255,130,30,.9)"; c.shadowBlur = px * 0.35; c.fillStyle = "#ffa646";
    c.fillText(stampText(p), right, bottom); c.restore();
  }
  function draw(cv, rec, photoCanvas) {
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), p = parseDate(rec.date), lines = decorate(rec.text, rec.deco);
    c.textBaseline = "alphabetic"; c.textAlign = "left";
    if (rec.frame === "diary") {
      c.fillStyle = "#f6f0dc"; c.fillRect(0, 0, W, H);
      c.strokeStyle = "#c9b98f"; c.lineWidth = 3; c.setLineDash([10, 10]); c.strokeRect(34, 34, W - 68, H - 68); c.setLineDash([]);
      c.fillStyle = "#3a3f55"; c.font = "800 44px " + FONT;
      c.fillText(p ? p.y + "년 " + p.m + "월 " + p.d + "일 " + WEEK[p.w] + "요일" : "그날의 일기", 84, 128);
      if (rec.weather) { c.textAlign = "right"; c.font = "600 30px " + FONT; c.fillText("날씨 " + rec.weather.sky, W - 84, 126); c.textAlign = "left"; }
      c.strokeStyle = "#b9a878"; c.lineWidth = 2; c.beginPath(); c.moveTo(84, 150); c.lineTo(W - 84, 150); c.stroke();
      // 테이프로 붙인 사진
      const size = 640, px = (W - size) / 2, py = 196;
      c.save(); c.translate(W / 2, py + size / 2); c.rotate(-0.025);
      c.shadowColor = "rgba(60,50,30,.28)"; c.shadowBlur = 24; c.shadowOffsetY = 8; c.fillStyle = "#fff"; c.fillRect(-size / 2 - 18, -size / 2 - 18, size + 36, size + 36); c.shadowColor = "transparent";
      drawPhoto(c, photoCanvas, -size / 2, -size / 2, size);
      drawStamp(c, p, size / 2 - 18, size / 2 - 18, 34);
      c.fillStyle = "rgba(240,220,150,.82)"; c.fillRect(-90, -size / 2 - 40, 180, 46);
      c.restore();
      // 줄 공책
      const ly0 = 960, gap = 74;
      c.strokeStyle = "#d9cba2"; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(84, ly0 + i * gap); c.lineTo(W - 84, ly0 + i * gap); c.stroke(); }
      c.fillStyle = "#2f3550";
      lines.forEach((t, i) => { const fp = fitFont(c, t, 48, 600, W - 190, 28); c.font = "600 " + fp + "px " + FONT; c.fillText(t, 98, ly0 - 20 + i * gap); });
    } else {
      c.fillStyle = "#fdfcf8"; c.fillRect(0, 0, W, H);
      drawPhoto(c, photoCanvas, 60, 60, PS);
      drawStamp(c, p, 60 + PS - 28, 60 + PS - 30, 50);
      c.fillStyle = "#26324d";
      const n = lines.length, lh = 64, y0 = 1118 - (n - 1) * lh / 2 + (n === 1 ? 6 : 0);
      lines.forEach((t, i) => { const fp = fitFont(c, t, 46, 600, PS - 20, 28); c.font = "600 " + fp + "px " + FONT; c.fillText(t, 70, y0 + i * lh); });
    }
    // 아래 줄: 요일·지역·날씨 / 그날로부터 ○일 / 주소
    c.fillStyle = "#667089"; c.font = "500 26px " + FONT;
    const left = metaLeft(rec, p) || "그날의 나";
    const my = rec.frame === "diary" ? 1250 : 1272, uy = rec.frame === "diary" ? 1290 : 1314, mx = rec.frame === "diary" ? 84 : 70;
    c.textAlign = "left"; c.fillText(left, mx, my);
    if (p) { const n = daysSince(p); c.textAlign = "right"; c.fillText(n > 0 ? "그날로부터 " + comma(n) + "일" : n === 0 ? "바로 오늘" : comma(-n) + "일 뒤의 그날", W - mx, my); }
    c.textAlign = "left"; c.fillStyle = "#9aa3b5"; c.font = "500 22px " + FONT; c.fillText(SITE_TEXT, mx, uy);
  }

  // 답장 카드: 문자 화면 느낌. 보낸 사람은 그날의 나
  function wrap(c, text, max) { // 낱말 단위로 끊고, 한 낱말이 너무 길 때만 글자 단위로 끊는다
    const out = []; let cur = "";
    text.split(" ").forEach((w) => {
      const t = cur ? cur + " " + w : w;
      if (c.measureText(t).width <= max) { cur = t; return; }
      if (cur) out.push(cur); cur = "";
      for (const ch of w) { if (c.measureText(cur + ch).width > max && cur) { out.push(cur); cur = ch; } else cur += ch; }
    });
    if (cur) out.push(cur); return out;
  }
  function drawReply(cv, rec, word) {
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), p = parseDate(rec.date);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1b2740"); g.addColorStop(1, "#111a2e"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.textBaseline = "alphabetic"; c.textAlign = "center"; c.fillStyle = "#f1dc98"; c.font = "700 34px " + FONT;
    const who = p ? p.y + "년 " + p.m + "월 " + p.d + "일의 나" : "그날의 나";
    c.fillText(who, W / 2, 110);
    c.strokeStyle = "#3a4a6e"; c.lineWidth = 2; c.beginPath(); c.moveTo(70, 146); c.lineTo(W - 70, 146); c.stroke();
    let y = 214, dry = true;
    const bubble = (text, mine) => {
      c.font = "500 40px " + FONT; const lines = wrap(c, text, 640), lh = 58, bw = Math.max.apply(null, lines.map((t) => c.measureText(t).width)) + 64, bh = lines.length * lh + 44;
      const x = mine ? W - 70 - bw : 70;
      if (dry) { y += bh + 26; return; }
      c.fillStyle = mine ? "#f1dc98" : "#fdfcf8"; c.beginPath();
      if (c.roundRect) c.roundRect(x, y, bw, bh, 30); else c.rect(x, y, bw, bh);
      c.fill();
      c.fillStyle = "#1b2740"; c.textAlign = "left"; lines.forEach((t, i) => c.fillText(t, x + 32, y + 62 + i * lh));
      y += bh + 26;
    };
    const seed = (p ? p.t / 86400000 : 0) + word.length * 7, pool = L.replies[rec.mood] || L.replies.calm, n = p ? daysSince(p) : 0;
    const all = () => {
      bubble(word, true);
      y += 14;
      if (p) bubble("여긴 " + p.y + "년 " + p.m + "월 " + p.d + "일, " + WEEK[p.w] + "요일이야." + (rec.weather && !rec.weather.avg ? (rec.weather.sky ? " 오늘은 " + rec.weather.sky + "," : "") + " 낮엔 " + rec.weather.max + "도까지 올랐어." : ""), false);
      bubble(pool[Math.abs(Math.round(seed)) % pool.length], false);
      bubble(p && n > 0 ? comma(n) + "일 뒤에도 잘 지내고 있길." : "거기서도 잘 지내고 있길.", false);
    };
    all(); const used = y - 214; dry = false; y = Math.max(214, 190 + Math.round((H - 190 - 110 - used) / 2)); all();
    c.textAlign = "left"; c.fillStyle = "#7f8db0"; c.font = "500 22px " + FONT; c.fillText(SITE_TEXT, 70, H - 44);
  }

  // ── 화면 ─────────────────────────────────────────────────
  function render() {
    const key = S.rec.filter + "|" + (S.sq ? S.sqNo : 0);
    if (S.sq && S.filteredKey !== key) { S.filtered = applyFilter(S.sq, S.rec.filter); S.filteredKey = key; }
    draw($("cv"), S.rec, S.sq ? S.filtered : null);
  }
  function chips(boxId, list, get, set) {
    const box = $(boxId); box.innerHTML = "";
    list.forEach((it) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = it[1]; b.dataset.v = it[0]; b.addEventListener("click", () => { set(it[0]); sync(); }); box.appendChild(b); });
    return () => box.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v) === String(get()) ? "true" : "false"));
  }
  const syncs = [
    chips("cMood", L.moods, () => S.rec.mood, (v) => { S.rec.mood = v; S.touched.mood = 1; S.songNo = 0; autoLine(); bgm(); composeScene(); }),
    chips("cFilter", FILTERS, () => S.rec.filter, (v) => { S.rec.filter = v; S.touched.filter = 1; }),
    chips("cDeco", DECOS, () => S.rec.deco, (v) => { S.rec.deco = +v; }),
    chips("cFrame", FRAMES, () => S.rec.frame, (v) => { S.rec.frame = v; }),
    chips("cTod", TODS, () => S.rec.tod, (v) => { S.rec.tod = v; composeScene(); }),
    chips("cRoom", ROOMS, () => S.rec.room, (v) => { S.rec.room = v; composeScene(); })
  ];
  $("bProp").addEventListener("click", () => { S.rec.propNo = (S.rec.propNo || 0) + 1; composeScene(); });
  function sync() { syncs.forEach((f) => f()); render(); songShow(); }
  function show(id) { ["vHome", "vMake"].forEach((v) => $(v).classList.toggle("hide", v !== id)); window.scrollTo(0, 0); }

  const msg = (t) => { $("mMsg").textContent = t; };
  async function setPhoto(src, exif) {
    S.photo = src; S.sq = toSquare(src); S.sqNo = (S.sqNo || 0) + 1;
    const a = analyze(S.sq), sg = suggest(a, exif ? exif.hour : null);
    S.rec.tod = sg.tod;
    if (!S.touched.mood) S.rec.mood = sg.mood;
    if (!S.touched.filter) S.rec.filter = sg.filter;
    if (exif && !S.touched.date) { S.rec.date = exif.date; $("iDate").value = exif.date; wxUpdate(); }
    const tod = { day: "낮", dusk: "해 질 무렵", night: "밤" }[sg.tod], mood = L.moods.find((m) => m[0] === S.rec.mood)[1];
    $("mRead").textContent = (exif ? "사진에 적힌 찍은 날짜(" + exif.date.replace(/-/g, ". ") + ")를 읽었어요. " : "사진에 찍은 날짜가 없어요. 아래에서 날짜를 넣어 주세요. ") + "사진 느낌은 " + tod + " · " + mood + " 쪽으로 봤어요. 마음에 안 들면 바꿔 주세요.";
    if (!S.rec.text.trim()) { S.touched.text = 0; autoLine(); } else autoLine();
    $("bPick").textContent = "다른 사진 고르기";
    bgm(); sync();
  }
  // 사용자가 글을 고치거나 고르기 전에는 기분과 날짜에 맞춰 글귀를 바꿔 놓는다
  function autoLine() {
    if (S.touched.text) return;
    const pool = L.lines[S.rec.mood], p = parseDate(S.rec.date);
    S.lineNo = (p ? p.y * 7 + p.m * 3 + p.d : S.seedNo || 0) % pool.length;
    S.rec.text = pool[S.lineNo]; $("iText").value = S.rec.text;
  }
  function pickLine(step) {
    S.touched.text = 1;
    const pool = L.lines[S.rec.mood]; S.lineNo = (S.lineNo + step + pool.length) % pool.length;
    S.rec.text = pool[S.lineNo]; $("iText").value = S.rec.text;
  }
  $("bPick").addEventListener("click", () => $("fPhoto").click());
  $("fPhoto").addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const head = await f.slice(0, 262144).arrayBuffer(), exif = exifDate(head);
      let src;
      if (window.createImageBitmap) { try { src = await createImageBitmap(f, { imageOrientation: "from-image" }); } catch (err) { src = null; } }
      if (!src) src = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(f); });
      await setPhoto(src, exif);
    } catch (err) { msg("이 사진은 열지 못했어요. 다른 사진으로 해 주세요."); }
    e.target.value = "";
  });
  $("iText").addEventListener("input", () => { S.rec.text = $("iText").value; S.touched.text = 1; render(); });
  $("bLine").addEventListener("click", () => { pickLine(0); render(); });
  $("bLineNext").addEventListener("click", () => { pickLine(1); render(); });
  $("iDate").max = new Date().toISOString().slice(0, 10);
  $("iDate").addEventListener("input", () => { S.rec.date = parseDate($("iDate").value) ? $("iDate").value : ""; S.touched.date = 1; S.songNo = 0; autoLine(); wxUpdate(); composeScene(); sync(); });
  { const sel = $("iRegion"); sel.innerHTML = '<option value="">고르지 않음</option>' + REGIONS.map((r) => "<option>" + r + "</option>").join(""); sel.addEventListener("change", () => { S.rec.region = sel.value; wxUpdate(); render(); }); }

  // 저장과 공유
  const toBlob = (cv) => new Promise((res) => { try { cv.toBlob((b) => res(b), "image/png"); } catch (e) { res(null); } });
  function download(cv, name) { try { const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = name; document.body.appendChild(a); a.click(); a.remove(); return true; } catch (e) { return false; } }
  const fileName = () => "그날의나_" + (S.rec.date || "엽서") + ".png";
  $("bSave").addEventListener("click", () => msg(download($("cv"), fileName()) ? "엽서를 저장했어요." : "저장하지 못했어요. 그림을 길게 눌러 저장해 주세요."));
  $("bShare").addEventListener("click", async () => {
    const blob = await toBlob($("cv"));
    if (blob && navigator.share && window.File) {
      const file = new File([blob], "that-day.png", { type: "image/png" });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: "그날의 나" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    }
    msg(download($("cv"), fileName()) ? "이 기기에서는 공유 창을 열 수 없어서 엽서를 저장했어요." : "공유하지 못했어요.");
  });
  $("bSend").addEventListener("click", () => {
    const w = $("iWord").value.trim(); if (!w) { $("iWord").focus(); return; }
    drawReply($("cv2"), S.rec, w); $("cv2").classList.remove("hide"); $("reBtns").classList.remove("hide");
    $("cv2").scrollIntoView({ block: "center", behavior: "smooth" });
  });
  $("bSave2").addEventListener("click", () => msg(download($("cv2"), "그날의나_답장.png") ? "답장을 저장했어요." : "저장하지 못했어요."));

  // ── 소리: 배경은 우리가 만든 연주곡, 그날의 노래는 눌러서 30초 ──
  const bg = new Audio(); bg.loop = true; bg.volume = 0.35; bg.preload = "none";
  const pv = new Audio(); pv.preload = "none";
  function bgm() {
    if (!S.sound) { bg.pause(); return; }
    try { if (Y.player && Y.ready && Y.player.getPlayerState() === 1) { bg.pause(); return; } } catch (e) {}
    const want = "bgm/" + BGM[S.rec.mood] + ".mp3";
    if (bg.getAttribute("src") !== want) bg.src = want;
    if (pv.paused) bg.play().catch(() => {});
  }
  function setSound(on) { S.sound = on; $("bSound").textContent = on ? "♪ 소리 끄기" : "♪ 소리 켜기"; $("bSound").setAttribute("aria-pressed", on ? "true" : "false"); bgm(); }
  $("bSound").addEventListener("click", () => setSound(!S.sound));
  // 그 해에 가까운 노래부터, 같은 해 안에서는 지금 기분과 맞는 노래부터
  function songList() {
    const p = parseDate(S.rec.date), y = p ? p.y : null, m = S.rec.mood; const a = SONGS.slice();
    const off = (s) => (y == null ? 0 : Math.abs(s[0] - y)), mm = (s) => (s[7] === m ? 0 : 1);
    a.sort((u, v) => (off(u) > 1) - (off(v) > 1) || (off(u) <= 1 ? mm(u) - mm(v) : 0) || off(u) - off(v) || u[0] - v[0]);
    return a;
  }
  function songNow() { const a = songList(); return a[S.songNo % a.length]; }
  // 그날의 노래: 먼저 YouTube 공식 플레이어(화면에 보이는 채로만 재생), 안 되면 Apple 30초 미리 듣기 카드
  const Y = { api: 0, player: null, ready: false, ids: [], idx: 0, failed: false, autoPaused: false, want: false };
  function ytLoadApi() {
    if (Y.api) return; Y.api = 1;
    window.onYouTubeIframeAPIReady = () => { Y.api = 2; ytMake(); };
    const sc = document.createElement("script"); sc.src = "https://www.youtube.com/iframe_api"; sc.onerror = () => ytFail();
    document.head.appendChild(sc);
    setTimeout(() => { if (Y.api !== 2) ytFail(); }, 8000); // 불러오지 못하면 30초 카드로
  }
  function ytMake() {
    if (Y.api !== 2 || Y.player || !Y.ids.length) return;
    const s = songNow();
    try {
      Y.player = new YT.Player("ytBox", { host: "https://www.youtube-nocookie.com", videoId: Y.ids[Y.idx], width: "100%", height: "100%",
        playerVars: { playsinline: 1, rel: 0, start: s[6] || 0, loop: 1, playlist: Y.ids[Y.idx] },
        events: {
          onReady: () => { Y.ready = true; if (Y.want && ytVisible()) { try { Y.player.playVideo(); } catch (e) {} } },
          onStateChange: (e) => { if (e.data === 1) { bg.pause(); pv.pause(); } else if (e.data === 2 || e.data === 0) { if (!Y.autoPaused) bgm(); } },
          onError: () => ytNext()
        } });
    } catch (e) { ytFail(); }
  }
  function ytNext() { // 끼워 넣기가 막힌 영상이면 다음 후보, 없으면 30초 카드
    Y.idx++;
    if (Y.idx < Y.ids.length && Y.player && Y.ready) { const s = songNow(); try { Y.player.loadVideoById({ videoId: Y.ids[Y.idx], startSeconds: s[6] || 0 }); return; } catch (e) {} }
    ytFail();
  }
  function ytFail() {
    Y.failed = true; try { if (Y.player && Y.player.stopVideo) Y.player.stopVideo(); } catch (e) {}
    const hasIt = !!songNow()[1];
    $("ytWrap").classList.add("hide"); $("itRow").classList.toggle("hide", !hasIt); $("itFoot").classList.remove("hide");
    $("sNote").textContent = hasIt ? "노래 미리 듣기 provided courtesy of iTunes. 30초만 흘러나오고 저장되지 않아요." : "이 노래는 여기서 들려 드리지 못해요. 위 링크에서 찾아볼 수 있어요.";
    bgm();
  }
  function ytShowOk() { Y.failed = false; $("ytWrap").classList.remove("hide"); $("itRow").classList.add("hide"); $("itFoot").classList.add("hide"); $("sNote").textContent = "YouTube의 공식 채널 영상이에요. 영상을 눌러 재생하고, 화면에서 벗어나면 멈춰요."; }
  const ytVisible = () => { const r = $("ytWrap").getBoundingClientRect(), h = window.innerHeight; const vis = Math.min(r.bottom, h) - Math.max(r.top, 0); return r.height > 0 && vis >= r.height * 0.5; };
  // 플레이어가 절반 넘게 가려지면 멈춘다(보이지 않는 채로 재생하지 않는다). 다시 보이면 이어서 재생한다
  function ytWatch() {
    if (!Y.player || !Y.ready || Y.failed) return;
    let st = -1; try { st = Y.player.getPlayerState(); } catch (e) { return; }
    if (st === 1 && !ytVisible()) { Y.autoPaused = true; try { Y.player.pauseVideo(); } catch (e) {} bgm(); }
    else if (Y.autoPaused && ytVisible() && !$("vMake").classList.contains("hide")) { Y.autoPaused = false; try { Y.player.playVideo(); } catch (e) {} }
  }
  window.addEventListener("scroll", ytWatch, { passive: true }); window.addEventListener("resize", ytWatch);
  setInterval(ytWatch, 700); // 스크롤 신호가 오지 않는 경우에도 확인한다
  function ytStop() { Y.want = false; Y.autoPaused = false; try { if (Y.player && Y.ready) Y.player.pauseVideo(); } catch (e) {} }

  function songShow() {
    const s = songNow(), p = parseDate(S.rec.date);
    if (S.shown === s[1]) return; S.shown = s[1];
    pv.pause(); $("bPlay").textContent = "▶";
    $("sName").textContent = s[2]; $("sArtist").textContent = s[3]; $("sYear").textContent = s[0] + "년 무렵";
    $("sTitle").textContent = s[2] + " · " + s[3] + " (" + s[0] + ")";
    $("sArt").outerHTML = '<div class="art" id="sArt"></div>';
    $("sStore").href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(s[3] + " " + s[2]); $("sStore").textContent = "YouTube에서 찾아보기";
    $("sLead").textContent = p ? p.y + "년 무렵 사랑받은 노래예요." : "그해 사랑받은 노래예요. 날짜를 넣으면 그 무렵 노래가 나와요.";
    Y.ids = (s[5] || []).slice(); Y.idx = 0; Y.autoPaused = false;
    if (!Y.ids.length) { ytFail(); return; }
    if (Y.api === 2 && Y.player && Y.ready) { ytShowOk(); try { if (Y.want && ytVisible()) Y.player.loadVideoById({ videoId: Y.ids[0], startSeconds: s[6] || 0 }); else Y.player.cueVideoById({ videoId: Y.ids[0], startSeconds: s[6] || 0 }); } catch (e) { ytFail(); } }
    else if (Y.api === 2 && !Y.player) { ytShowOk(); ytMake(); }
  }
  $("bNextSong").addEventListener("click", () => { S.songNo++; Y.want = true; songShow(); });
  $("bPlay").addEventListener("click", async () => {
    if (!pv.paused) { pv.pause(); $("bPlay").textContent = "▶"; bgm(); return; }
    const s = songNow();
    try {
      if (pv.dataset.id !== String(s[1])) {
        $("bPlay").textContent = "…";
        const j = await (await fetch("https://itunes.apple.com/lookup?id=" + s[1] + "&country=US")).json(), t = j.results && j.results[0];
        if (!t || !t.previewUrl) throw new Error("no preview");
        pv.src = t.previewUrl; pv.dataset.id = String(s[1]);
        if (t.artworkUrl100) $("sArt").outerHTML = '<img id="sArt" alt="" src="' + t.artworkUrl100 + '">';
        if (t.trackViewUrl) { $("sStore").href = t.trackViewUrl; $("sStore").textContent = "iTunes에서 보기"; }
      }
      bg.pause(); await pv.play(); $("bPlay").textContent = "❚❚";
    } catch (e) { $("bPlay").textContent = "▶"; msg("이 노래는 지금 미리 듣기를 불러오지 못했어요. 아래 링크에서 찾아볼 수 있어요."); }
  });
  pv.addEventListener("ended", () => { $("bPlay").textContent = "▶"; bgm(); });

  // ── 첫 화면 ──────────────────────────────────────────────
  function enter(preset, mode) {
    S.rec = newRec(); S.rec.mode = mode || "photo";
    const dm = S.rec.mode === "date"; S.seedNo = Math.floor(Math.random() * 1000);
    S.photo = S.sq = S.filtered = null; S.filteredKey = ""; S.touched = {}; S.songNo = 0; S.shown = null;
    if (dm) { S.rec.tod = "dusk"; S.rec.filter = "none"; S.touched.filter = 1; }
    $("bPick").classList.toggle("hide", dm); $("mSafe").classList.toggle("hide", dm); $("fsScene").classList.toggle("hide", !dm);
    $("lgFilter").textContent = dm ? "그림 느낌" : "사진 느낌";
    $("iText").value = ""; $("iDate").value = ""; $("iRegion").value = ""; $("iWord").value = ""; $("mRead").textContent = ""; msg(""); wxUpdate();
    $("cv2").classList.add("hide"); $("reBtns").classList.add("hide"); $("bPick").textContent = "사진 고르기";
    if (preset) { S.rec.text = preset[1]; S.rec.mood = preset[2]; S.touched.mood = 1; $("iText").value = preset[1]; S.touched.text = 1; if (preset[3]) S.rec.room = preset[3]; }
    else if (dm) autoLine();
    show("vMake"); setSound(true); Y.want = true; ytLoadApi(); sync(); composeScene();
  }
  $("bPhoto").addEventListener("click", () => enter(null, "photo"));
  $("bDate").addEventListener("click", () => enter(null, "date"));
  $("bHome").addEventListener("click", () => { pv.pause(); ytStop(); setSound(false); show("vHome"); });
  L.days.forEach((d) => { const b = document.createElement("button"); b.type = "button"; b.textContent = d[0]; b.addEventListener("click", () => enter(d, "date")); $("cDay").appendChild(b); });
  { const n = new Date(), y = n.getFullYear() - 20, p = parseDate(y + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0"));
    $("hToday").textContent = p ? "20년 전 오늘은 " + p.y + "년 " + p.m + "월 " + p.d + "일, " + WEEK[p.w] + "요일이었어요. 오늘로부터 " + comma(daysSince(p)) + "일 전이에요." : ""; }

  // 검사용(화면에는 나오지 않는다)
  window.GN = { composeScene: composeScene, sceneParts: sceneParts, wxUpdate: wxUpdate, wxOf: wxOf, yt: Y, state: S, draw: draw, drawReply: drawReply, setPhoto: setPhoto, enter: enter, exifDate: exifDate, parseDate: parseDate, daysSince: daysSince, analyze: analyze, sync: sync };
})();
