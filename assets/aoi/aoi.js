/* 森羅百景の案内役・碧（AI）── 2026-10-03。元＝_dev/aoi_src/aoi.js（_dev/aoi.py が assets/aoi/ へ写す。写した先は直さない）。
   碧が話すのは、①選び方の案内（帯・表・カードのどこを押すか）と、②いまひらいている景の、ページに書いてある文の抜き出しだけ。
   新しい事実は足さない。断定しない。生きものの気持ちを代わりに言わない。AI であることを、いつも名札に出す。
   3D の姿は「3D の碧を呼ぶ」を押したときだけ取りに行く（はじめの表示を遅くしない）。 */
(function () {
  var C = window.AOI_CONF; if (!C) return;
  var L = C.lines, D = document;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function txt(sel, root) { var e = (root || D).querySelector(sel); return e ? e.textContent.trim() : ""; }

  /* ── 吹き出し ── */
  var box, sayEl, actEl, dock, dot;
  function say(lines, acts) {
    if (!sayEl) return;
    sayEl.innerHTML = "";
    lines.forEach(function (t) { if (t) sayEl.appendChild(el("p", null, t)); });
    actEl.innerHTML = "";
    (acts || []).forEach(function (a) {
      var b = el(a.href ? "a" : "button", "aoi-chip" + (a.main ? " main" : ""), a.label);
      if (a.href) b.href = a.href; else { b.type = "button"; b.addEventListener("click", a.fn); }
      actEl.appendChild(b);
    });
    if (dock && dock.classList.contains("fold")) dot.classList.add("on");
  }
  /* 送った先にも、碧の一言を小さく置く（吹き出しが画面の外へ流れても、言ったことが残るように） */
  function flash(sel, lines) {
    var e = D.querySelector(sel); if (!e) return;
    var old = D.querySelector(".aoi-hint"); if (old) old.remove();
    var tgt = e;
    if (lines) {
      var h = el("div", "aoi-hint"), im = el("img");
      im.src = C.base + "face.webp"; im.alt = ""; im.width = 28; im.height = 28;
      var t = el("div"); t.appendChild(el("b", null, "碧（AI）"));
      lines.forEach(function (x) { t.appendChild(el("span", null, x)); });
      h.appendChild(im); h.appendChild(t); e.parentNode.insertBefore(h, e); tgt = h;
    }
    tgt.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    e.classList.remove("aoi-flash"); void e.offsetWidth; e.classList.add("aoi-flash");
  }
  function pick(sel) {
    var a = [].slice.call(D.querySelectorAll(sel)).filter(function (x) { return x.offsetParent !== null; });
    return a.length ? a[Math.floor(Math.random() * a.length)] : null;
  }

  /* ── 碧について（どのページでも同じ） ── */
  function about() { say(L.about, base()); }

  /* ── 3D ── 押したときだけ読む ── */
  var m3 = null;
  function open3d() {
    if (location.protocol === "file:") { say(L.no3dfile, base()); return; }
    if (!m3) {
      m3 = el("div", "aoi3d"); m3.setAttribute("role", "dialog"); m3.setAttribute("aria-label", "3D の碧");
      var x = el("button", "aoi3d-x", "×"); x.type = "button"; x.setAttribute("aria-label", "閉じる");
      var st = el("div", "aoi3d-st", "読み込んでいます（約 2 MB）");
      var cap = el("div", "aoi3d-cap");
      cap.appendChild(el("b", null, "碧（AI）"));
      cap.appendChild(D.createTextNode(" ── 3D の姿。ドラッグでまわせます。"));
      var lic = el("div", "aoi3d-lic", L.vrmlic);
      var stage = el("div", "aoi3d-stage");
      m3.appendChild(stage); m3.appendChild(x); m3.appendChild(st); m3.appendChild(cap); m3.appendChild(lic);
      D.body.appendChild(m3);
      x.addEventListener("click", close3d);
      m3._st = st; m3._stage = stage;
    }
    m3.classList.add("on"); D.documentElement.classList.add("aoi3d-open");
    m3._st.textContent = "読み込んでいます（約 2 MB）"; m3._st.style.display = "";
    import(new URL(C.base + "aoi3d.js", location.href).href).then(function (mod) {
      return mod.show(m3._stage, new URL(C.base + "aoi.vrm", location.href).href, function (p) { m3._st.textContent = "読み込んでいます " + p + "%"; });
    }).then(function (h) { m3._h = h; m3._st.style.display = "none"; })
      .catch(function (e) {
        m3._st.textContent = "3D の碧を読み込めませんでした（通信か、この端末の 3D の表示のせいかもしれません）。";
        if (window.console) console.warn("碧の 3D：", e && e.message || e);
      });
  }
  function close3d() {
    if (!m3) return;
    if (m3._h) { m3._h.dispose(); m3._h = null; }
    m3._stage.innerHTML = "";
    m3.classList.remove("on"); D.documentElement.classList.remove("aoi3d-open");
  }
  D.addEventListener("keydown", function (e) { if (e.key === "Escape" && m3 && m3.classList.contains("on")) close3d(); });

  /* ── 総目録（TOP） ── */
  function base() { return C.top ? topActs() : seriesActs(); }
  function topActs() {
    return [
      { label: "時代で", fn: function () { say(L.jidai, topActs()); flash("#bands", L.jidai); } },
      { label: "土地で", fn: function () { say(L.tochi, topActs()); flash("#cults", L.tochi); } },
      { label: "主題で", fn: function () { say(L.shudai, topActs()); flash(".genres", L.shudai); } },
      { label: "おまかせで一つ", fn: omakaseTop },
      { label: "碧について", fn: about },
      { label: "3D の碧を呼ぶ", fn: open3d }
    ];
  }
  function omakaseTop() {
    var a = pick("a.it:not(.hide)"); if (!a) { say(L.none, topActs()); return; }
    var nm = txt(".nm", a), ap = a.dataset.app || "";
    say(["「" + nm + "」はどうでしょう。" + ap + "の景です。", L.omakase_note],
        [{ label: "ひらく →", href: a.getAttribute("href"), main: true }, { label: "べつのを", fn: omakaseTop }].concat(topActs().slice(4)));
  }

  /* ── 連作のページ ── */
  function seriesActs() {
    var a = [{ label: "おまかせで一つ", fn: omakaseSeries }];
    if (C.kind === "kotoba") a.push({ label: "景の札へ", fn: function () { say(L.keisec, seriesActs()); flash("#kvs", L.keisec); } });
    a.push({ label: "碧について", fn: about }, { label: "3D の碧を呼ぶ", fn: open3d });
    return a;
  }
  function omakaseSeries() {
    var c = pick(C.kind === "kotoba" ? "#kvs .kv" : "#idx .kei");
    if (!c) { say(L.none, seriesActs()); return; }
    var nm = txt(".nm", c);
    say(["「" + nm + "」はどうでしょう。"], [{ label: "ひらく →", main: true, fn: function () { c.click(); } }, { label: "べつのを", fn: omakaseSeries }]);
  }
  /* いまひらいている景を、ページの文から抜き出して言う（新しいことは足さない） */
  function first(s) {
    s = (s || "").trim(); if (!s) return "";
    var i = s.indexOf("。"); var f = i >= 0 ? s.slice(0, i + 1) : s;
    return f.length > 96 ? f.slice(0, 94) + "…" : f;
  }
  function keiSay(root, name, lead) {
    var ws = [].slice.call(root.querySelectorAll(".w")), b = 0, p = 0;
    ws.forEach(function (w) {
      if (w.querySelector(".quote")) b++;
      else if (/^写真：/.test(txt(".src,.srcl", w))) p++;
    });
    var a = ws.length - b - p, parts = [];
    if (a) parts.push("絵 " + a); if (b) parts.push("文学 " + b); if (p) parts.push("写真 " + p);
    var l = ["「" + name + "」の景です。" + (ws.length ? parts.join("・") + "、あわせて " + ws.length + " 点が並んでいます。" : "")];
    var f = first(lead); if (f) l.push("はじめに、こう書いてあります ──「" + f + "」");
    l.push(L.kei_tail);
    say(l, [{ label: "上へ", fn: function () { (C.kind === "kotoba" ? D.getElementById("kov") : window).scrollTo(0, 0); } }, { label: "碧について", fn: about }, { label: "3D の碧を呼ぶ", fn: open3d }]);
  }
  function watch() {
    var v = D.getElementById(C.kind === "kotoba" ? "kov" : "view"); if (!v) return;
    var was = false;
    function now() {
      if (C.kind === "kotoba") keiSay(v, txt("h2b", v), txt(".lead", v));
      else keiSay(D.getElementById("tl") || v, txt("#kName"), txt("#kLead"));
    }
    new MutationObserver(function () {
      var on = v.classList.contains("on");
      if (on) setTimeout(now, 0); else if (was) say(L.hello, seriesActs());
      was = on;
    }).observe(v, { attributes: true, attributeFilter: ["class"] });
    if (v.classList.contains("on")) { was = true; now(); }
  }

  function mount() {
    if (C.top) {
      box = D.getElementById("aoiCard"); if (!box) return;
      sayEl = box.querySelector(".aoi-say"); actEl = box.querySelector(".aoi-acts");
      say(L.hello, topActs());
      return;
    }
    dock = el("aside", "aoi-dock"); dock.id = "aoiDock"; dock.setAttribute("aria-label", "案内役の碧（AI）");
    var face = el("button", "aoi-face"); face.type = "button"; face.setAttribute("aria-label", "碧（AI）の吹き出しをひらく・たたむ");
    var img = el("img"); img.src = C.base + "face.webp"; img.alt = ""; img.width = 56; img.height = 56; img.decoding = "async";
    dot = el("i", "aoi-dot"); face.appendChild(img); face.appendChild(dot);
    var bub = el("div", "aoi-bub");
    var head = el("div", "aoi-name"); head.appendChild(el("b", null, "碧（AI）")); head.appendChild(D.createTextNode(" 案内役"));
    var fold = el("button", "aoi-fold", "たたむ"); fold.type = "button"; head.appendChild(fold);
    sayEl = el("div", "aoi-say"); actEl = el("div", "aoi-acts");
    var note = el("div", "aoi-note", L.note);
    bub.appendChild(head); bub.appendChild(sayEl); bub.appendChild(actEl); bub.appendChild(note);
    dock.appendChild(bub); dock.appendChild(face);
    D.body.appendChild(dock);
    function setFold(v) { dock.classList.toggle("fold", v); store.set("aoi.fold", v ? "1" : "0"); if (!v) dot.classList.remove("on"); }
    face.addEventListener("click", function () { setFold(!dock.classList.contains("fold")); });
    fold.addEventListener("click", function () { setFold(true); });
    if (store.get("aoi.fold") === "1" || innerWidth < 560 && store.get("aoi.fold") !== "0") dock.classList.add("fold");
    say(L.hello, seriesActs());
    dot.classList.remove("on");
    watch();
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", mount); else mount();
  window.__aoi = { say: say, open3d: open3d, close3d: close3d };
})();
