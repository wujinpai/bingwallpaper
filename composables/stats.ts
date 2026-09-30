export interface StatsPayload {
  ok: boolean
  views: Record<string, number>
  likes: Record<string, number>
}

const LS_VIEWS = 'bingwallpaper:views'
const LS_LIKES = 'bingwallpaper:likes'
const LS_LIKED = 'bingwallpaper:liked'
const SS_VIEWED = 'bingwallpaper:viewed'

const state = reactive({
  ready: false,
  /** 是否成功连上 EdgeOne KV（false 时说明未绑定命名空间，统计退回本地） */
  remote: false,
  views: {} as Record<string, number>,
  likes: {} as Record<string, number>,
  liked: [] as string[],
})

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  }
  catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // 隐私模式下 localStorage 不可写，忽略即可
  }
}

async function send(body: { date: string, type: 'view' | 'like' | 'unlike' }) {
  try {
    await $fetch('/api/stats', { method: 'POST', body, timeout: 6000 })
  }
  catch {
    // 未部署 Edge Function 或未绑定 KV 时静默失败，本地统计仍然可用
  }
}

async function loadStats() {
  if (!import.meta.client)
    return

  state.views = readJSON(LS_VIEWS, {})
  state.likes = readJSON(LS_LIKES, {})
  state.liked = readJSON(LS_LIKED, [])
  state.ready = true

  try {
    const payload = await $fetch<StatsPayload>('/api/stats', { timeout: 6000 })
    if (payload?.ok) {
      state.remote = true
      state.views = { ...payload.views }
      state.likes = { ...payload.likes }
    }
  }
  catch {
    state.remote = false
  }
}

/** 同一会话内同一张图只计一次浏览，避免刷新刷量 */
function recordView(date: string) {
  if (!date || !import.meta.client)
    return

  let viewed: string[] = []
  try {
    viewed = JSON.parse(sessionStorage.getItem(SS_VIEWED) || '[]')
  }
  catch {
    viewed = []
  }

  if (viewed.includes(date))
    return

  viewed.push(date)
  try {
    sessionStorage.setItem(SS_VIEWED, JSON.stringify(viewed))
  }
  catch { /* ignore */ }

  state.views[date] = (state.views[date] ?? 0) + 1
  writeJSON(LS_VIEWS, state.views)
  void send({ date, type: 'view' })
}

function toggleLike(date: string) {
  if (!date || !import.meta.client)
    return

  if (state.liked.includes(date)) {
    state.liked = state.liked.filter(item => item !== date)
    state.likes[date] = Math.max(0, (state.likes[date] ?? 1) - 1)
    void send({ date, type: 'unlike' })
  }
  else {
    state.liked = [...state.liked, date]
    state.likes[date] = (state.likes[date] ?? 0) + 1
    void send({ date, type: 'like' })
  }

  writeJSON(LS_LIKES, state.likes)
  writeJSON(LS_LIKED, state.liked)
}

export function useStats() {
  return {
    ...toRefs(state),
    loadStats,
    recordView,
    toggleLike,
    viewCount: (date?: string) => (date ? state.views[date] ?? 0 : 0),
    likeCount: (date?: string) => (date ? state.likes[date] ?? 0 : 0),
    isLiked: (date?: string) => (date ? state.liked.includes(date) : false),
  }
}