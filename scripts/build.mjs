// 每日必应壁纸 — 静态站构建脚本（纯 Node，无框架、无需 npm install）。
// 用法：node scripts/build.mjs（在项目根目录运行）
// 输出：.output/（index.html、各列表页、bing/*.html、view/*.html、styles.css、sitemap.xml）
// 环境变量 SITE_URL：站点正式域名（默认 https://bing.jisu.cn）。
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'archive/zh-CN');
const DIST = join(ROOT, '.output');
const SITE_URL = (process.env.SITE_URL || 'https://bing.jisu.cn').replace(/\/$/, '');
const PER_PAGE = 24;          // 列表页每页条数
const HOME_SECTION = 12;      // 首页每个分区卡片数
const LIST_PICK = 96;         // 今日精选 / 必应热榜列表页的总挑选数（首页取前 12）
const SITE_NAME = '每日必应壁纸';

// ---------- 读数据 ----------
const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort();
const all = [];
for (const f of files) {
  const group = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf-8'));
  for (const [key, v] of Object.entries(group)) {
    all.push({
      id: key,                       // YYYYMMDD
      date: v.date,                  // YYYY-MM-DD
      title: v.title || '',
      copyright: v.copyright || '',
      copyrightlink: v.copyrightlink || '',
      url: v.url || '',
    });
  }
}
// 按日期倒序（最新在前）
all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
const byId = new Map(all.map(w => [w.id, w]));
// “今天” = 数据里最新的一天（每日抓取后构建时，最新一天就是当天；
// 某天抓取失败时仍用已有最新一天，页面不至于断档）
const TODAY = all[0];
const todayIdNum = parseInt(TODAY.id, 10);

// ---------- 工具 ----------
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const fmtDate = d => { const [y, m, dd] = d.split('-'); return `${y}年${m}月${dd}日`; };
// 地点/说明：copyright 去掉末尾的 (© ...) 署名部分
// 图片基础 id：bing.com 的 th?id=BASE_1920x1080.jpg → BASE；
// bimg.cc 镜像是 https://cdn.bimg.cc/bing/2016/BASE_1920x1080.jpg → BASE（但 Bing 不再提供这些老图的其他尺寸）
function baseOf(w) {
  const m = w.url.match(/[?&]id=([^&]+)/);
  if (m) return m[1].replace(/_(1920x1080|1080x1920|1920x1200|UHD)\.jpg$/, '');
  const m2 = w.url.match(/\/([^\/]+)_1920x1080\.jpg$/);
  if (m2) return m2[1];
  return '';
}
const isBing = w => w.url.includes('www.bing.com');
// 图片地址换成本站域名（走边缘函数代理回源，不再直连 bing.com / bimg.cc）
// bing: https://www.bing.com/th?id=X → /th?id=X
// bimg: https://cdn.bimg.cc/bing/2016/X.jpg → /mirror/bing/2016/X.jpg
function siteImg(url) {
  if (url.startsWith('https://www.bing.com/th')) return url.replace('https://www.bing.com/th', '/th');
  if (url.startsWith('https://cdn.bimg.cc/')) return url.replace('https://cdn.bimg.cc/', '/mirror/');
  return url;
}
// 可用的下载链接：bing.com 的图 4 个尺寸都经过实测可用；
// bimg.cc 镜像的老图（2016–2018，920 张）只有 1920x1080 这一档存在，
// 其余尺寸在 bimg.cc 和 bing.com 上都 404，所以只给桌面这一项，不造死链。
function downloads(w) {
  const list = [{ label: '桌面', url: siteImg(w.url) }];
  if (isBing(w) && baseOf(w)) {
    const b = baseOf(w);
    list.unshift({ label: '手机', url: siteImg(`https://www.bing.com/th?id=${b}_1080x1920.jpg`) });
    list.push({ label: '笔记本', url: siteImg(`https://www.bing.com/th?id=${b}_1366x768.jpg`) });
    list.push({ label: 'HD', url: siteImg(`https://www.bing.com/th?id=${b}_1280x720.jpg`) });
    list.push({ label: '4K', url: siteImg(`https://www.bing.com/th?id=${b}_UHD.jpg`) });
    list.push({ label: '商标', url: siteImg(`https://www.bing.com/th?id=${b}_1920x1200.jpg`) });
  }
  return list;
}
const dlBar = w => `<div class="dl-bar">${downloads(w).map(d =>
  `<a href="${esc(d.url)}" target="_blank" rel="noopener">${d.label}</a>`).join('')}</div>`;

// 确定性伪随机（mulberry32）：同一天种子固定，挑选结果一天内不变、每天换
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 洗牌后取前 n 个（均匀覆盖全库）
function seededPick(seed, n) {
  const idx = all.map((_, i) => i);
  const rand = mulberry32(seed);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map(i => all[i]);
}
const CURATED_ALL = seededPick(todayIdNum, LIST_PICK);        // 今日精选（列表页用）
const HOT_ALL = seededPick(todayIdNum + 7, LIST_PICK);         // 必应热榜（换个种子）
// 往年今日：同月同日、往年的，按日期倒序；不足 4 张时用同月往年的补齐
function sameDayPastYears(dateStr, limit = 12) {
  const [, m, d] = dateStr.split('-');
  const md = `${m}-${d}`;
  const year = parseInt(dateStr.slice(0, 4), 10);
  const same = all.filter(w => w.date.slice(5) === md && parseInt(w.date.slice(0, 4), 10) < year);
  let out = same.slice(0, limit);
  if (out.length < 4) {
    const fill = all.filter(w => w.date.slice(5, 7) === m && parseInt(w.date.slice(0, 4), 10) < year
      && !out.some(o => o.id === w.id));
    out = out.concat(fill).slice(0, limit);
  }
  return out;
}
// 本周：同一 ISO 周（周一至周日）内的其他壁纸
function weekOf(dateStr) {
  const dt = new Date(dateStr + 'T12:00:00');
  const day = (dt.getDay() + 6) % 7; // 周一=0
  const monday = new Date(dt); monday.setDate(dt.getDate() - day);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = x => x.toISOString().slice(0, 10);
  return [fmt(monday), fmt(sunday)];
}
function thisWeek(w) {
  const [lo, hi] = weekOf(w.date);
  return all.filter(x => x.id !== w.id && x.date >= lo && x.date <= hi);
}

// ---------- 模板 ----------
const TO_TOP = `<button id="toTop" class="to-top" aria-label="回到顶部" title="回到顶部">↑</button>
<script>(function(){var b=document.getElementById('toTop');if(!b)return;
var onScroll=function(){b.classList.toggle('show',window.scrollY>600);};
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
b.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'});});})();</script>`;
function shell({ title, desc, ambient, body }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#e9eef3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<div class="ambient" style="background-image:url('${esc(ambient)}')"></div>
<div class="ambient-veil"></div>
<header class="topbar"><div class="topbar-inner">
<a class="brand" href="/"><img class="brand-logo" src="/logo.svg" alt="每日必应壁纸"><span class="brand-name">${SITE_NAME}</span></a>
<div class="topbar-right"><button class="theme-toggle" id="themeToggle" type="button" aria-label="切换深色/浅色主题"><svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg><svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg></button></div>
</div></header>
${body}
<footer class="footer">
<div>© ${new Date().getFullYear()} ${SITE_NAME} · 图片均来自 Bing</div>
<div>数据每日从 Bing 官方接口拉取更新</div>
</footer>
${TO_TOP}
<script>
(function(){
  var btn=document.getElementById('themeToggle');
  if(!btn)return;
  var sun=btn.querySelector('.icon-sun'), moon=btn.querySelector('.icon-moon');
  function current(){
    var t=document.documentElement.getAttribute('data-theme');
    if(t==='light'||t==='dark')return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }
  function setIcon(theme){
    // 亮色显示月亮（点按切深色），深色显示太阳（点按切浅色）
    if(sun)sun.style.display=theme==='dark'?'block':'none';
    if(moon)moon.style.display=theme==='dark'?'none':'block';
  }
  function setThemeColor(theme){
    var c=theme==='dark'?'#0f172a':'#e9eef3';
    document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){
      m.setAttribute('content',c); m.removeAttribute('media');
    });
  }
  function apply(theme){
    document.documentElement.setAttribute('data-theme',theme);
    try{localStorage.setItem('theme',theme);}catch(e){}
    setIcon(theme); setThemeColor(theme);
  }
  btn.addEventListener('click',function(){
    apply(current()==='dark'?'light':'dark');
  });
  // 初次：有保存的选择就按保存的来并同步图标/浏览器 chrome 颜色，否则跟随系统
  var saved=null;
  try{saved=localStorage.getItem('theme');}catch(e){}
  if(saved==='light'||saved==='dark'){ setIcon(saved); setThemeColor(saved); }
  else setIcon(current());
})();
</script>
</body>
</html>
`;
}
const topbar = ''; // 顶栏已在 shell 里
function heroCard(w) {
  return `<div class="hero"><a class="hero-card" href="/bing/${w.id}.html">
<img src="${esc(siteImg(w.url))}" alt="${esc(w.title)}" loading="eager">
<div class="hero-info"><div><div class="hero-title">${esc(w.title)}</div>
<div class="hero-date">${fmtDate(w.date)}</div></div>
<div class="hero-copy">${esc(w.copyright)}</div></div>
</a></div>`;
}
function card(w) {
  return `<a class="card" href="/bing/${w.id}.html">
<img src="${esc(siteImg(w.url))}" alt="${esc(w.title)}" loading="lazy">
<div class="card-bar"><span class="card-title">${esc(w.title)}</span><span class="card-date">${fmtDate(w.date)}</span></div>
</a>`;
}
function section(title, moreHref, items) {
  if (!items.length) return '';
  return `<section class="section"><div class="section-head">
<span class="section-title">${esc(title)}</span>
<a class="section-more" href="${moreHref}">更多……</a></div>
<div class="grid">${items.map(card).join('')}</div></section>`;
}
function pager(base, page, totalPages) {
  // base: 'wall' / 'curated' / 'hot'；第 1 页文件是 base.html，其余 base-N.html
  const href = p => (p === 1 ? `/${base}.html` : `/${base}-${p}.html`);
  const nums = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...nums].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  let inner = '';
  let prev = null;
  for (const p of pages) {
    if (prev !== null && p - prev > 1) inner += '<span>…</span>';
    inner += p === page ? `<span class="current">${p}</span>` : `<a href="${href(p)}">${p}</a>`;
    prev = p;
  }
  return `<nav class="pager">
${page > 1 ? `<a href="${href(page - 1)}">‹ 上一页</a>` : '<span class="disabled">‹ 上一页</span>'}
${inner}
${page < totalPages ? `<a href="${href(page + 1)}">下一页 ›</a>` : '<span class="disabled">下一页 ›</span>'}
<span class="page-info">第 ${page} 页 / 共 ${totalPages} 页</span>
</nav>`;
}
function listPage({ kind, title, items, page, totalPages, moreHref }) {
  const hero = items[0];
  const gridItems = items.slice(1);
  const body = `<main class="container">
${heroCard(hero)}
<section class="section"><div class="section-head">
<span class="section-title">${esc(title)}</span>
<span class="section-more">共 ${items.length} 张</span></div>
<div class="grid">${gridItems.map(card).join('')}</div></section>
${pager(kind, page, totalPages)}
</main>`;
  return shell({ title: `${title} - ${SITE_NAME}`, desc: `${title}，每日必应壁纸归档`, ambient: hero.url, body });
}
function detailPage(w, idx) {
  const prev = all[idx + 1] || null; // 昨日壁纸（更早一天）
  const next = all[idx - 1] || null; // 明日壁纸（更新一天）
  const week = thisWeek(w).slice(0, 7);
  const curated = CURATED_ALL.filter(x => x.id !== w.id).slice(0, HOME_SECTION);
  const pastYears = sameDayPastYears(w.date, 12);
  const body = `<main class="container">
<div class="detail-nav">
${prev ? `<a href="/bing/${prev.id}.html">‹ 昨日壁纸</a>` : '<span class="nav-empty">‹ 昨日壁纸</span>'}
<span class="nav-date">${fmtDate(w.date)}</span>
${next ? `<a href="/bing/${next.id}.html">明日壁纸 ›</a>` : '<span class="nav-empty">明日壁纸 ›</span>'}
</div>
<div class="detail-img-wrap">
<a href="/view/${w.id}.html"><img src="${esc(siteImg(w.url))}" alt="${esc(w.title)}"></a>
${dlBar(w)}
</div>
<div class="detail-info">
<div class="info-row"><span class="info-label">标题</span><span>${esc(w.title)}</span></div>
<div class="info-row"><span class="info-label">地点 / 版权</span><span>${esc(w.copyright)}${w.copyrightlink ? `（<a href="${esc(w.copyrightlink)}" target="_blank" rel="noopener">查看来源</a>）` : ''}</span></div>
<div class="info-row"><span class="info-label">日期</span><span>${fmtDate(w.date)}</span></div>
<div class="info-row"><span class="info-label">图片编号</span><span>${esc(baseOf(w) || w.id)}</span></div>
</div>
${section('本周', '/wall.html', week)}
${section('今日精选', '/curated.html', curated)}
${section('往年今日', '/wall.html', pastYears)}
</main>`;
  return shell({
    title: `${SITE_NAME} - ${w.title}`,
    desc: `${w.title}，${w.copyright}，${fmtDate(w.date)}的必应壁纸。`,
    ambient: siteImg(w.url), body,
  });
}
function viewPage(w, idx) {
  const prev = all[idx + 1] || null;
  const next = all[idx - 1] || null;
  const dl = downloads(w).map(d =>
    `<a href="${esc(d.url)}" target="_blank" rel="noopener">${d.label}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${SITE_NAME} - ${esc(w.title)}</title>
<meta name="description" content="${esc(w.title)}，${esc(w.copyright)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/styles.css">
</head>
<body class="view-body">
<img class="view-img" src="${esc(siteImg(w.url))}" alt="${esc(w.title)}">
<div class="view-nav">
${prev ? `<a href="/view/${prev.id}.html">‹ 昨日壁纸</a>` : '<span>‹ 昨日壁纸</span>'}
<span>|</span>
${next ? `<a href="/view/${next.id}.html">明日壁纸 ›</a>` : '<span>明日壁纸 ›</span>'}
</div>
<div class="view-actions">${dl}<a href="/bing/${w.id}.html">返回详情</a></div>
<div class="view-info">
<div class="view-title">${esc(w.title)}</div>
<div class="view-meta">${fmtDate(w.date)}<br>${esc(w.copyright)}</div>
</div>
</body>
</html>
`;
}

// ---------- 生成 ----------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'bing'), { recursive: true });
mkdirSync(join(DIST, 'view'), { recursive: true });
const write = (rel, html) => writeFileSync(join(DIST, rel), html, 'utf-8');

// 首页：顶部 hero 已是今日，四个分区都不再重复今日（最新从昨日开始；
// 精选/热榜是全库抽取，也把今日排除；往年今日本就是往年，不会撞上）
const latest12 = all.filter(x => x.id !== TODAY.id).slice(0, HOME_SECTION);
const curated12 = CURATED_ALL.filter(x => x.id !== TODAY.id).slice(0, HOME_SECTION);
const hot12 = HOT_ALL.filter(x => x.id !== TODAY.id).slice(0, HOME_SECTION);
const pastYearsHome = sameDayPastYears(TODAY.date, 12);
const homeBody = `<main class="container">
${heroCard(TODAY)}
${section('最新壁纸', '/wall.html', latest12)}
${section('今日精选', '/curated.html', curated12)}
${section('必应热榜', '/hot.html', hot12)}
${section('往年今日', '/wall.html', pastYearsHome)}
</main>`;
write('index.html', shell({
  title: `${SITE_NAME} - 每日一图，带你领略世界之美`,
  desc: '每日必应壁纸归档，最新壁纸、今日精选、必应热榜、往年今日，图片均来自 Bing。',
  ambient: TODAY.url, body: homeBody,
}));

// 列表页（每页 24 张；第 1 页为 wall.html，其余 wall-N.html；curated / hot 同理）
function buildList(kind, title, items) {
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  for (let p = 1; p <= totalPages; p++) {
    const pageItems = items.slice((p - 1) * PER_PAGE, p * PER_PAGE);
    const file = p === 1 ? `${kind}.html` : `${kind}-${p}.html`;
    write(file, listPage({ kind, title, items: pageItems, page: p, totalPages }));
  }
  return totalPages;
}
const wallPages = buildList('wall', '最新壁纸', all);
const curatedPages = buildList('curated', '今日精选', CURATED_ALL);
const hotPages = buildList('hot', '必应热榜', HOT_ALL);

// 详情页 + 全屏查看页
all.forEach((w, i) => {
  write(`bing/${w.id}.html`, detailPage(w, i));
  write(`view/${w.id}.html`, viewPage(w, i));
});

// 样式与图标
copyFileSync(join(ROOT, 'styles.css'), join(DIST, 'styles.css'));
for (const f of ['logo.svg', 'favicon.svg', 'favicon.png', 'apple-touch-icon.png', '681e774932fc7fc7913adc91d4c1dc4d.txt']) {
  copyFileSync(join(ROOT, f), join(DIST, f));
}

// sitemap：首页 + 各列表页（含分页）+ 全部详情页
const listUrls = ['/wall.html', '/curated.html', '/hot.html'];
for (let p = 2; p <= wallPages; p++) listUrls.push(`/wall-${p}.html`);
for (let p = 2; p <= curatedPages; p++) listUrls.push(`/curated-${p}.html`);
for (let p = 2; p <= hotPages; p++) listUrls.push(`/hot-${p}.html`);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE_URL}/</loc></url>
${listUrls.map(u => `<url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}
${all.map(w => `<url><loc>${SITE_URL}/bing/${w.id}.html</loc><lastmod>${w.date}</lastmod></url>`).join('\n')}
</urlset>
`;
write('sitemap.xml', sitemap);

// ---------- 统计 ----------
const bimgCount = all.filter(w => !isBing(w)).length;
console.log(`wallpapers: ${all.length} (bing.com ${all.length - bimgCount}, bimg.cc mirror ${bimgCount})`);
console.log(`latest: ${TODAY.id} ${TODAY.date} 「${TODAY.title}」`);
console.log(`pages: index 1, wall ${wallPages}, curated ${curatedPages}, hot ${hotPages}, detail ${all.length}, view ${all.length}`);
console.log(`sitemap urls: ${1 + listUrls.length + all.length}`);
console.log(`output: ${DIST}`);
