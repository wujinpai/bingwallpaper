// 图片代理：把 Bing 原图走本站域名
// /th?id=OHR.xxx_1920x1080.jpg → https://www.bing.com/th?id=OHR.xxx_1920x1080.jpg
export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  const res = await fetch('https://www.bing.com/th' + url.search, {
    headers: { 'User-Agent': context.request.headers.get('User-Agent') || 'Mozilla/5.0' },
  });
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
