/**
 * EdgeOne Pages Edge Function：匿名浏览量 / 点赞统计
 *
 * KV 只能在 Edge Functions 中调用（Cloud/Node Functions 不支持），
 * 所以统计接口单独放在 edge-functions 目录下。
 *
 * 使用前需要在 EdgeOne Pages 控制台：
 *   1. 开通 KV 存储并创建一个命名空间
 *   2. 把命名空间绑定到本项目的这个函数，变量名填 my_kv
 * 未绑定时接口返回 { ok: false }，前端会自动降级为 localStorage 本地统计。
 */

const BLOB_KEY = 'bingwallpaper_stats_v1'
const MAX_ENTRIES = 3000

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  })
}

/** 未绑定命名空间时 typeof 判断是安全的，不会抛错 */
function store() {
  return typeof my_kv === 'undefined' ? null : my_kv
}

async function readStats(kv) {
  const data = await kv.get(BLOB_KEY, { type: 'json' })
  if (!data || typeof data !== 'object')
    return { views: {}, likes: {} }

  return {
    views: data.views && typeof data.views === 'object' ? data.views : {},
    likes: data.likes && typeof data.likes === 'object' ? data.likes : {},
  }
}

/** 只保留浏览量最高的若干条，避免 value 无限增长 */
function trim(record) {
  const entries = Object.entries(record)
  if (entries.length <= MAX_ENTRIES)
    return record

  entries.sort((a, b) => b[1] - a[1])
  return Object.fromEntries(entries.slice(0, MAX_ENTRIES))
}

export async function onRequestGet() {
  const kv = store()
  if (!kv)
    return json({ ok: false, views: {}, likes: {}, reason: 'kv-unbound' })

  try {
    const stats = await readStats(kv)
    return json({ ok: true, ...stats })
  }
  catch (error) {
    return json({ ok: false, views: {}, likes: {}, reason: String(error) })
  }
}

export async function onRequestPost({ request }) {
  const kv = store()
  if (!kv)
    return json({ ok: false, reason: 'kv-unbound' })

  let body
  try {
    body = await request.json()
  }
  catch {
    return json({ ok: false, reason: 'bad-request' }, 400)
  }

  const { date, type } = body || {}
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    return json({ ok: false, reason: 'bad-date' }, 400)

  if (!['view', 'like', 'unlike'].includes(type))
    return json({ ok: false, reason: 'bad-type' }, 400)

  try {
    const stats = await readStats(kv)

    if (type === 'view')
      stats.views[date] = (stats.views[date] || 0) + 1
    else if (type === 'like')
      stats.likes[date] = (stats.likes[date] || 0) + 1
    else
      stats.likes[date] = Math.max(0, (stats.likes[date] || 0) - 1)

    stats.views = trim(stats.views)
    stats.likes = trim(stats.likes)

    await kv.put(BLOB_KEY, JSON.stringify(stats))

    return json({ ok: true, views: stats.views[date] || 0, likes: stats.likes[date] || 0 })
  }
  catch (error) {
    return json({ ok: false, reason: String(error) }, 500)
  }
}