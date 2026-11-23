// 图片代理：把 Bing 原图走本站域名
// /th?id=OHR.xxx_1920x1080.jpg → https://www.bing.com/th?id=OHR.xxx_1920x1080.jpg
export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  // 兼容三种格式：
  // /th/OHR.xxx.jpg（路径带文件名，浏览器标题显示文件名），
  // /th?id=OHR.xxx.jpg（旧版查询参数，标题显示 th），
  // /th/每日必应壁纸.jpg?id=OHR.xxx.jpg（路径放站名，标题显示站名，id 在查询参数）。
  // 查询参数优先：有 id 就用 id，没有才从路径取。
  let id = url.searchParams.get('id') || '';
  if (!id) {
    const m = url.pathname.match(/^\/th\/(.+)$/);
    if (m) id = decodeURIComponent(m[1]);
  }
  const res = await fetch('https://www.bing.com/th?id=' + encodeURIComponent(id), {
    headers: { 'User-Agent': context.request.headers.get('User-Agent') || 'Mozilla/5.0' },
  });
  // 下载保存时的文件名也统一成站名（与浏览器标题一致），中文按 RFC 5987 编码。
  const headers = {
    'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
    'Cache-Control': 'public, max-age=86400',
    'Content-Disposition': `inline; filename="MeiRiBiYingBiZhi.jpg"; filename*=UTF-8''%E6%AF%8F%E6%97%A5%E5%BF%85%E5%BA%94%E5%A3%81%E7%BA%B8.jpg`,
  };
  return new Response(res.body, {
    status: res.status,
    headers,
  });
};
