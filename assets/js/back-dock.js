/* back-dock.js — 全站共用「返回」鈕＋捲動位置還原（純 JS，無相依；Next／Astro／純 HTML 都能直接掛）
   為什麼要有：加到主畫面、App 外殼、部分 App 內建瀏覽器沒有「上一頁」，進到內頁就回不來。
   行為：
   1. 左下角固定一顆「返回」。有站內上一頁 → history.back()（回到剛剛的畫面）；沒有 → 去上一層路徑（/learn/x → /learn）。
   2. 返回後還原到離開時的捲動位置，不回頂端。內容是非同步載入的頁面，瀏覽器內建還原常失敗，這裡會重試到內容長出來為止。
   設定（選用，要寫在載入本檔之前）：
     window.BackDockConfig = { home:"/", hide:["/"], parents:{"^/admin":"/admin/owner"}, label:"返回", zIndex:9000,
                                hideWhenVisible:".topbar .tbrand a" }
   單頁不要浮動鈕：<meta name="back-dock" content="off">（位置還原與 BackDock.back() 仍有效） */
(function () {
  if (window.__backDock) return; window.__backDock = true;
  var cfg = window.BackDockConfig || {};
  var HOME = cfg.home || "/";
  var HIDE = cfg.hide || [HOME];
  var PARENTS = cfg.parents || {};
  var SK = "bd:stack", YK = "bd:y:";

  function here() { return location.pathname + location.search + location.hash; }
  function read() { try { var s = JSON.parse(sessionStorage.getItem(SK)); if (s && s.list && s.list.length) return s; } catch (e) {} return { list: [], idx: -1 }; }
  function write(s) {
    if (s.list.length > 60) { var cut = s.list.length - 60; s.list = s.list.slice(cut); s.idx = Math.max(0, s.idx - cut); }
    try { sessionStorage.setItem(SK, JSON.stringify(s)); } catch (e) {}
  }
  function push(u) { var s = read(); if (s.list[s.idx] === u) return; s.list = s.list.slice(0, s.idx + 1); s.list.push(u); s.idx = s.list.length - 1; write(s); }
  function replace(u) { var s = read(); if (s.idx < 0) { push(u); return; } s.list[s.idx] = u; write(s); }
  // 瀏覽器上一頁／下一頁：對回自己的堆疊；對不上（例如點了頁內錨點）就當成新的一步
  function traverse(u) {
    var s = read();
    if (s.list[s.idx] === u) return false;
    if (s.idx > 0 && s.list[s.idx - 1] === u) { s.idx--; write(s); return true; }
    if (s.list[s.idx + 1] === u) { s.idx++; write(s); return true; }
    push(u); return false;
  }

  /* ---- 捲動位置 ---- */
  var restoring = false, saveTimer = 0;
  function saveY() {
    if (restoring) return;
    var s = read(); if (s.idx < 0) return;
    try { sessionStorage.setItem(YK + s.idx, JSON.stringify({ u: s.list[s.idx], y: Math.round(window.scrollY || 0) })); } catch (e) {}
  }
  function savedY() {
    var s = read();
    try { var v = JSON.parse(sessionStorage.getItem(YK + s.idx)); if (v && v.u === s.list[s.idx]) return v.y; } catch (e) {}
    return null;
  }
  function restoreY(target) {
    if (target == null || target < 2) return;
    restoring = true;
    var stable = 0, ticks = 0, stopped = false;
    function stop() { stopped = true; }
    var evs = ["touchstart", "wheel", "keydown", "mousedown"];
    evs.forEach(function (n) { window.addEventListener(n, stop, { passive: true, once: true }); });
    (function tick() {
      ticks++;
      var max = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0) - window.innerHeight;
      if (!stopped && max >= target - 2) {
        if (Math.abs(window.scrollY - target) > 2) { window.scrollTo({ top: target, left: 0, behavior: "instant" }); stable = 0; } else stable++;
      }
      if (stopped || stable >= 6 || ticks > 70) { // 最多約 4 秒；使用者一碰畫面就放手
        evs.forEach(function (n) { window.removeEventListener(n, stop); });
        restoring = false; return;
      }
      setTimeout(tick, 60);
    })();
  }
  window.addEventListener("scroll", function () { if (saveTimer) return; saveTimer = setTimeout(function () { saveTimer = 0; saveY(); }, 120); }, { passive: true });
  window.addEventListener("pagehide", saveY);

  /* ---- 追蹤站內走過的路 ---- */
  var navType = "navigate";
  try { var ne = performance.getEntriesByType("navigation")[0]; if (ne && ne.type) navType = ne.type; } catch (e) {}
  if (navType === "back_forward") { traverse(here()); restoreY(savedY()); }
  else if (navType === "reload") { if (read().idx < 0) push(here()); }
  else push(here());

  ["pushState", "replaceState"].forEach(function (name) {
    var orig = history[name];
    history[name] = function () {
      var before = here();
      if (name === "pushState") saveY();
      var r = orig.apply(this, arguments);
      var after = here();
      if (after !== before) { if (name === "pushState") push(after); else replace(after); update(); }
      return r;
    };
  });
  window.addEventListener("popstate", function () { if (traverse(here())) restoreY(savedY()); update(); });
  window.addEventListener("hashchange", function () { traverse(here()); update(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) { traverse(here()); update(); } });

  /* ---- 上一層（沒有站內上一頁時用） ---- */
  function parentCandidates() {
    var p = location.pathname.replace(/\/+$/, ""), out = [];
    for (var k in PARENTS) { try { if (new RegExp(k).test(p) && PARENTS[k] !== p) out.push(PARENTS[k]); } catch (e) {} }
    var parts = p.split("/").filter(Boolean);
    while (parts.length > 1) { parts.pop(); out.push("/" + parts.join("/")); }
    out.push(HOME);
    return out;
  }
  function goParent() {
    var c = parentCandidates(), i = 0;
    (function next() {
      if (i >= c.length - 1 || !window.fetch) { location.href = c[Math.min(i, c.length - 1)]; return; }
      fetch(c[i], { method: "HEAD", credentials: "same-origin" }).then(function (r) { if (r.ok) location.href = c[i]; else { i++; next(); } }).catch(function () { i++; next(); });
    })();
  }
  function goBack() {
    saveY();
    var s = read();
    if (s.idx > 0 && history.length > 1) {
      var before = here(), left = false;
      // 返回真的發生了（popstate／整頁離開）就取消保險；不然使用者返回後很快又點回同一頁，會被誤判成「返回沒成功」
      function done() { left = true; clearTimeout(guard); window.removeEventListener("popstate", done); }
      window.addEventListener("popstate", done);
      window.addEventListener("pagehide", done, { once: true });
      history.back();
      // 保險：堆疊說有上一頁、瀏覽器其實沒有（另開分頁帶過來的紀錄）→ 改走上一層
      var guard = setTimeout(function () { window.removeEventListener("popstate", done); if (!left && here() === before && document.visibilityState === "visible") { var t = read(); t.list = [before]; t.idx = 0; write(t); goParent(); } }, 1500);
    } else goParent();
  }

  /* ---- 按鈕 ---- */
  var btn = null;
  function off() { var m = document.querySelector('meta[name="back-dock"]'); return !!(m && m.content === "off"); }
  function hidden() {
    var p = location.pathname.replace(/\/+$/, "") || "/";
    if (off()) return true;
    // 頁面自己的返回連結看得到時，就不重複放浮動鈕（例：工具頁會員模式的頂欄）
    if (cfg.hideWhenVisible) { try { var own = document.querySelector(cfg.hideWhenVisible); if (own && own.getClientRects().length && getComputedStyle(own).visibility !== "hidden") return true; } catch (e) {} }
    for (var i = 0; i < HIDE.length; i++) if (HIDE[i] === p) return read().idx <= 0;
    return false;
  }
  // 頁面底部若有整排固定的按鈕列（例如「立即應徵」），返回鈕往上讓，不要蓋住
  function lift() {
    if (!btn) return;
    var extra = 0;
    try {
      var els = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight - 6);
      for (var i = 0; i < els.length; i++) {
        var el = els[i]; if (el === btn || el === document.body || el === document.documentElement) continue;
        var pos = getComputedStyle(el).position; if (pos !== "fixed" && pos !== "sticky") continue;
        var r = el.getBoundingClientRect();
        if (r.width >= window.innerWidth * 0.6 && r.height < window.innerHeight * 0.4 && r.bottom >= window.innerHeight - 2) extra = Math.max(extra, Math.round(window.innerHeight - r.top));
      }
    } catch (e) {}
    btn.style.setProperty("--bd-lift", extra + "px");
  }
  function update() { if (!btn) return; btn.hidden = hidden(); if (!btn.hidden) setTimeout(lift, 60); }
  function mount() {
    if (btn || !document.body) return;
    var st = document.createElement("style");
    st.textContent = ".back-dock{position:fixed;left:max(14px,env(safe-area-inset-left));bottom:calc(16px + env(safe-area-inset-bottom) + var(--bd-lift,0px));z-index:" + (cfg.zIndex || 9000) + ";display:inline-flex;align-items:center;gap:6px;min-height:46px;padding:0 18px 0 14px;border-radius:999px;border:1px solid rgba(20,30,45,.18);background:rgba(255,255,255,.96);color:#16202c;font:700 16px/1 system-ui,-apple-system,'PingFang TC','Noto Sans TC',sans-serif;letter-spacing:.04em;box-shadow:0 6px 22px rgba(15,25,40,.16);cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap}.back-dock[hidden]{display:none}.back-dock:active{transform:scale(.97)}.back-dock:focus-visible{outline:3px solid #0071e3;outline-offset:3px}.back-dock svg{flex:none}@media print{.back-dock{display:none!important}}@media (prefers-reduced-motion:no-preference){.back-dock{transition:transform .12s}}";
    document.head.appendChild(st);
    btn = document.createElement("button");
    btn.type = "button"; btn.className = "back-dock"; btn.setAttribute("aria-label", "返回上一個畫面");
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span></span>';
    btn.lastChild.textContent = cfg.label || "返回";
    btn.addEventListener("click", goBack);
    document.body.appendChild(btn);
    update();
    setTimeout(lift, 1500);
    window.addEventListener("resize", lift);
    if (cfg.hideWhenVisible && window.MutationObserver) new MutationObserver(function () { update(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
  // 既有的「返回」連結想共用同一套邏輯：onclick="return BackDock.back(event)"（JS 沒載到時連結照常可用）
  window.BackDock = { back: function (e) { if (e && e.preventDefault) e.preventDefault(); goBack(); return false; }, canGoBack: function () { return read().idx > 0; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
