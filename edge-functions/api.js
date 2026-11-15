// 公开 API：GET /api 返回当日最新壁纸
// ?size= 指定尺寸：phone（手机 1080×1920）、desktop（桌面 1920×1080，默认）、
// laptop（笔记本 1366×768）、hd（HD 1280×720）、4k（4K 3840×2160）、trademark（商标 1920×1200）
// 中文 label（手机/桌面/笔记本/HD/4K/商标）也接受。尺寸不可用时（如老图只有桌面）回落到桌面。
// ?format=image 直接返回图片：302 跳到所选尺寸的图片直链，浏览器打开即显示壁纸，
// 可直接当壁纸源或 <img> 地址用；不传 format 默认返回 JSON。
// 数据来自构建时生成的 /data/latest.json（每次构建都是最新一张图）。
const SIZE_ALIAS = {
  phone: 'phone', '手机': 'phone',
  desktop: 'desktop', '桌面': 'desktop',
  laptop: 'laptop', '笔记本': 'laptop',
  hd: 'hd', HD: 'hd',
  '4k': '4k', '4K': '4k',
  trademark: 'trademark', '商标': 'trademark',
};

export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  };
  try {
    const res = await fetch(new URL('/data/latest.json', url));
    if (!res.ok) throw new Error('latest.json ' + res.status);
    const data = await res.json();
    const want = SIZE_ALIAS[(url.searchParams.get('size') || '').trim()] || 'desktop';
    const picked = data.sizes[want] || data.sizes.desktop;
    const sizeKey = data.sizes[want] ? want : 'desktop';
    // format=image：直接显示壁纸——302 跳到图片直链（每日换图所以用临时跳转，缓存 5 分钟）
    if ((url.searchParams.get('format') || '').trim().toLowerCase() === 'image') {
      return new Response(null, {
        status: 302,
        headers: {
          Location: picked.url,
          'Cache-Control': 'public, max-age=300',
        },
      });
    }
    return new Response(JSON.stringify({
      date: data.date,
      title: data.title,
      copyright: data.copyright,
      copyrightlink: data.copyrightlink,
      detail: data.detail,
      url: picked.url,
      size: sizeKey,
      width: picked.width,
      height: picked.height,
      sizes: data.sizes,
    }, null, 2), { status: 200, headers: jsonHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'latest wallpaper unavailable' }), {
      status: 502, headers: jsonHeaders,
    });
  }
};
