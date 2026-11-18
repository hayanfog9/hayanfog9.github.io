// 이것도 해 볼래? — 통장 일대기, 그날의 나, 인생 노선도가 서로를 소개하는 카드.
// 세 사이트에 같은 파일을 둔다. 화면에 <div data-more="bankbook|thatday|lifeline"></div>를 두면 나머지 둘을 보여 준다.
(function () {
  "use strict";
  var LIST = [
    ["bankbook", "통장 일대기", "이 월급으로 한 번의 삶을 살아 보기", "https://hayanfog9.github.io/bankbook-life-3k7d/"],
    ["thatday", "그날의 나", "날짜 하나로 그날의 엽서 만들기", "https://hayanfog9.github.io/that-day-7q2m/"],
    ["lifeline", "인생 노선도", "지나온 일을 노선도 한 장으로", "https://hayanfog9.github.io/life-line-5t9w/"]
  ];
  var box = document.querySelector("[data-more]"); if (!box) return;
  var self = box.getAttribute("data-more"), st = document.createElement("style");
  st.textContent = ".hide+[data-more]{display:none}" +
    "[data-more]{margin:34px 0 0;font-family:inherit}" +
    "[data-more] h2{font-size:17px;font-weight:800;margin:0 0 10px;color:inherit}" +
    "[data-more] a{display:grid;grid-template-columns:64px 1fr;gap:12px;align-items:center;background:#fff;border:1.5px solid rgba(30,38,44,.16);border-radius:14px;padding:10px 12px 10px 10px;margin:0 0 8px;text-decoration:none;color:#1E262C}" +
    "[data-more] a:active{transform:translateY(1px)}" +
    "[data-more] img{width:64px;height:64px;border-radius:10px;display:block;object-fit:cover}" +
    "[data-more] b{display:block;font-size:16px;font-weight:800;line-height:1.3}" +
    "[data-more] span{display:block;font-size:14px;color:#5F6973;line-height:1.4;margin-top:2px}";
  document.head.appendChild(st);
  var h = document.createElement("h2"); h.textContent = "이것도 해 볼래?"; box.appendChild(h);
  LIST.forEach(function (it) {
    if (it[0] === self) return;
    var a = document.createElement("a"), img = document.createElement("img"), d = document.createElement("div"), b = document.createElement("b"), s = document.createElement("span");
    a.href = it[3]; img.src = "more/" + it[0] + ".webp"; img.alt = ""; img.width = 64; img.height = 64; img.loading = "lazy";
    b.textContent = it[1]; s.textContent = it[2]; d.appendChild(b); d.appendChild(s); a.appendChild(img); a.appendChild(d); box.appendChild(a);
  });
})();
