# 每日必应壁纸

Bing 每日壁纸归档站（纯静态，无框架）。浅色主题、当日主图模糊作环境背景、16:9 大图卡、四列格子、壁纸详情页带多尺寸下载。

- 仅简体中文（`zh-CN`）市场
- 首页：今日主图 + 最新壁纸 / 今日精选 / 必应热榜 / 往年今日
- 详情页 `/bing/{YYYYMMDD}.html`：标题、地点/版权、日期、昨日/明日壁纸导航、手机/桌面/4K/商标下载、本周/今日精选/往年今日
- 全屏查看页 `/view/{YYYYMMDD}.html`：图片铺满视口，带下载与返回详情
- 列表页：`/wall.html`（最新壁纸）、`/curated.html`（今日精选）、`/hot.html`（必应热榜），每页 24 张

## 数据来源

壁纸数据来自 Bing 官方接口 `https://global.bing.com/HPImageArchive.aspx`（`mkt=zh-CN`），
存放在 `archive/zh-CN/<YYYYMM>.json`，每张一条 `{url, date, title, copyright, copyrightlink}`。
图片不下载，直接热链图片地址。

注意：2016、2017 与 2018 年大部分老图在 Bing 官方 CDN 上已下线（返回 404），
归档里这些图的地址是 `cdn.bimg.cc` 镜像，只剩 1920x1080 这一档。
因此老图详情页只提供「桌面」一个下载链接，不造死链；2018 年中以后的图 4 个尺寸都可用。

## 本地构建

```bash
node scripts/build.mjs          # 生成 .output/
python3 -m http.server -d .output  # 本地预览
```

构建时用数据里最新的一天作为“今天”（主图、往年今日、精选种子都以它为准），
这样某天抓取失败时页面也不会断档。今日精选与必应热榜用 `mulberry32` 按当天日期做种子
确定性挑选，一天内固定、每天换。

`sitemap.xml` 里的域名取环境变量 `SITE_URL`，
部署前改成真实域名再构建：`SITE_URL=https://bing.jisu.cn node scripts/build.mjs`。

## 自动更新（GitHub Actions）

`.github/workflows/update-archive.yml` 每天两次（UTC 10:15 / 18:15，即北京 18:15 / 次日 02:15）
跑 `scripts/update-archive.mjs` 抓当日 zh-CN 壁纸写进 `archive/zh-CN/`，有新图就提交推送；
推送后由 EdgeOne Pages 的 Git 集成自动重新构建部署。工作流里另有一步跑
`node scripts/build.mjs` 做构建校验。只留一个市场，一天只有一张新图，
一天只会推送一次、构建一次，两次定时是冗余（某次没抓到，另一次补上）。
