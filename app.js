// 全站通用脚本：日夜切换、回到顶部、站内无刷新跳转
// 全部用事件委托（监听挂在 document/window 上），整 body 换掉后依然有效，
// 所以详情页、列表页、文档页、全屏查看页都能无刷新互跳。
(function () {
  // ---------- 日夜切换 ----------
  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeIcon() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var theme = currentTheme();
    var sun = btn.querySelector('.icon-sun'), moon = btn.querySelector('.icon-moon');
    // 亮色显示月亮（点按切深色），深色显示太阳（点按切浅色）
    if (sun) sun.style.display = theme === 'dark' ? 'block' : 'none';
    if (moon) moon.style.display = theme === 'dark' ? 'none' : 'block';
  }
  function setThemeColor(theme) {
    var c = theme === 'dark' ? '#0f172a' : '#e9eef3';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', c); m.removeAttribute('media');
    });
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    syncThemeIcon(); setThemeColor(theme);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('#themeToggle') : null;
    if (!btn) return;
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
  // 初次：有保存的选择就按保存的来并同步图标/浏览器 chrome 颜色，否则跟随系统
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (saved === 'light' || saved === 'dark') { syncThemeIcon(); setThemeColor(saved); }
  else syncThemeIcon();

  // ---------- 回到顶部 ----------
  function onScroll() {
    var b = document.getElementById('toTop');
    if (b) b.classList.toggle('show', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('#toTop') : null;
    if (b) window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- 站内无刷新跳转 ----------
  // 整 body 替换：详情/列表/文档页与全屏查看页骨架不同（查看页没有顶栏与 <main>），
  // 只换 <main> 覆盖不到它，所以整 body 一起换；<html> 上的 data-theme 不动，主题不闪。
  var navId = 0;
  function isInternal(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return false;
    var u;
    try { u = new URL(href, location.href); } catch (e) { return false; }
    if (u.origin !== location.origin) return false;
    if (u.pathname !== '/' && !u.pathname.endsWith('.html')) return false;
    return true;
  }
  function swapFromDoc(doc, url, push) {
    var newBody = doc.body;
    if (!newBody) return false;
    document.title = doc.title || document.title;
    var desc = doc.querySelector('meta[name="description"]');
    var curDesc = document.querySelector('meta[name="description"]');
    if (desc && curDesc) curDesc.setAttribute('content', desc.getAttribute('content'));
    document.body.className = newBody.className || '';
    document.body.innerHTML = newBody.innerHTML;
    syncThemeIcon(); onScroll();
    if (push) history.pushState(null, '', url);
    window.scrollTo(0, 0);
    return true;
  }
  async function go(url, push) {
    var id = ++navId;
    try {
      var res = await fetch(url, { headers: { 'Accept': 'text/html' } });
      if (!res.ok) return false;
      if (id !== navId) return true; // 已被更新的跳转取代，丢弃这次结果
      var html = await res.text();
      if (id !== navId) return true;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      return swapFromDoc(doc, url, push);
    } catch (e) { return false; }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || !isInternal(a)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.href;
    if (href === location.href) return;
    e.preventDefault();
    go(href, true).then(function (ok) { if (!ok) location.href = href; });
  });
  window.addEventListener('popstate', function () {
    go(location.href, false).then(function (ok) { if (!ok) location.reload(); });
  });
})();
