/**
 * Bing 图片 CDN（/th?id=...）支持通过 w/h 参数裁剪缩放，
 * 归档里存的是 1920x1080 原图地址，这里按展示尺寸取缩略图。
 */
export function thumbUrl(url: string, w: number, h: number) {
  if (!url || !url.includes('/th?id='))
    return url

  return `${url}&w=${w}&h=${h}&qlt=90`
}