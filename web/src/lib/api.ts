import { useAuth } from '../stores/auth'
import { decryptResponse, encryptRequest, encryptionAlg, getCryptoEnabled, hasCryptoKey } from './crypto'
import type {
  Attachment,
  AttachmentKind,
  AtrocityEvent,
  AtrocityEventInput,
  AuthPayload,
  Period,
  Revision,
  TimelineNode,
  Traitor,
  TraitorInput,
  TraitorStats,
  TraitorSummary,
  User,
  WebMenu,
} from '../types'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

export function resolveAssetUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url}`
}

const BASE = `${API_ORIGIN}/api`

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function authHeader(): Record<string, string> {
  const token = useAuth.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function readResponseBody(res: Response): Promise<string> {
  const raw = await res.text()
  if (res.headers.get('X-Encrypted') === '1' && getCryptoEnabled() && hasCryptoKey()) {
    try {
      return await decryptResponse(raw)
    } catch {
      return raw
    }
  }
  return raw
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...authHeader(),
    ...(init.headers as Record<string, string> | undefined),
  }
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  const useCrypto = getCryptoEnabled() && hasCryptoKey()
  let body = init.body
  if (useCrypto && typeof init.body === 'string') {
    body = await encryptRequest(init.body)
  }
  if (useCrypto) {
    headers['X-Encrypted'] = '1'
    headers['X-Crypto-Alg'] = encryptionAlg()
  }
  const res = await fetch(BASE + path, {
    ...init,
    headers,
    body,
  })
  if (!res.ok) {
    let message = `请求失败（${res.status}）`
    try {
      const text = await readResponseBody(res)
      const data = JSON.parse(text) as { message?: string; error?: string }
      message = data.message ?? data.error ?? message
    } catch {
      /* ignore */
    }
    if (res.status === 401) useAuth.getState().clear()
    throw new ApiError(res.status, message)
  }
  const text = await readResponseBody(res)
  return JSON.parse(text) as T
}

function query(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export interface TraitorFilters {
  name?: string
  yearFrom?: number
  yearTo?: number
  event?: string
  period?: Period
  /** 省份（档案上的 Province 字段，短名如 广东） */
  province?: string
  page?: number
  pageSize?: number
}

export interface PagedTraitorResponse {
  items: TraitorSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  /** Keyset 游标：本页末行位置，可用于"页码跳转后转游标续翻"；无下一页时为 null */
  nextCursor?: string | null
}

/** 分省统计项（省份归类在后端完成） */
export interface ProvinceStat {
  /** 省份短名，如 广东 */
  province: string
  /** GeoJSON 全称，如 广东省 */
  fullName: string
  count: number
}

export interface ProvinceStatsResponse {
  items: ProvinceStat[]
  /** 档案总数 */
  total: number
  /** 可识别出省份的记录数 */
  matched: number
}

export const api = {
  register: (body: { username: string; email: string; password: string }) =>
    request<AuthPayload>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { account: string; password: string }) =>
    request<AuthPayload>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<{ user: User }>('/auth/me'),

  listTraitors: (filters: TraitorFilters = {}) =>
    request<PagedTraitorResponse>(
      `/traitors${query({
        name: filters.name,
        yearFrom: filters.yearFrom,
        yearTo: filters.yearTo,
        event: filters.event,
        period: filters.period,
        province: filters.province,
        page: filters.page,
        pageSize: filters.pageSize,
      })}`,
    ),

  getTraitor: (id: string) => request<{ traitor: Traitor }>(`/traitors/${id}`),

  getRevisions: (id: string) => request<{ items: Revision[] }>(`/traitors/${id}/revisions`),

  getStats: () => request<TraitorStats>('/traitors/stats'),

  getProvinceStats: () => request<ProvinceStatsResponse>('/traitors/province-stats'),

  getTimeline: () => request<{ items: TimelineNode[] }>('/traitors/timeline'),

  listAtrocityEvents: (era?: string) =>
    request<{ items: AtrocityEvent[] }>(`/atrocity-events${query({ era })}`),

  getAtrocityEvent: (id: string) => request<{ item: AtrocityEvent }>(`/atrocity-events/${id}`),

  createAtrocityEvent: (input: AtrocityEventInput) =>
    request<{ item: AtrocityEvent }>('/atrocity-events', { method: 'POST', body: JSON.stringify(input) }),

  listWebMenus: () => request<{ items: WebMenu[] }>('/web-menus'),

  trackVisit: (token: string, path: string) =>
    request<{ ok: boolean }>('/visits/track', { method: 'POST', body: JSON.stringify({ token, path }) }),

  getVisitStats: () => request<{ totalVisits: number; totalVisitors: number }>('/visits/stats'),

  getPublicConfig: () => request<{ items: Record<string, string> }>('/config'),

  createTraitor: (input: TraitorInput & { changeSummary: string }) =>
    request<{ revisionId: string }>('/traitors', { method: 'POST', body: JSON.stringify(input) }),

  updateTraitor: (id: string, input: TraitorInput & { changeSummary: string }) =>
    request<{ revisionId: string }>(`/traitors/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  mySubmissions: () => request<{ items: Revision[] }>('/me/submissions'),

  upload: async (file: File, kind: AttachmentKind): Promise<Attachment> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    const res = await fetch(`${BASE}/uploads`, { method: 'POST', headers: authHeader(), body: fd })
    if (!res.ok) throw new ApiError(res.status, '上传失败')
    const data = (await res.json()) as { id: string; url: string; kind: AttachmentKind; fileType: string }
    return { ...data, caption: '' }
  },
}
