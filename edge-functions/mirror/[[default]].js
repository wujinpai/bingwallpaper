// 老图镜像代理：把 bimg.cc 的老图走本站域名
// /mirror/bing/2016/OHR.xxx_1920x1080.jpg → https://cdn.bimg.cc/bing/2016/OHR.xxx_1920x1080.jpg
export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace(/^\/mirror\//, '');
  const res = await fetch('https://cdn.bimg.cc/' + path, {
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
