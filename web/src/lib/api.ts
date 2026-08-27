import { useAuth } from '../stores/auth'
import type {
  Attachment,
  AttachmentKind,
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...authHeader(),
    ...(init.headers as Record<string, string> | undefined),
  }
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, {
    ...init,
    headers,
  })
  if (!res.ok) {
    let message = `请求失败（${res.status}）`
    try {
      const data = (await res.json()) as { message?: string; error?: string }
      message = data.message ?? data.error ?? message
    } catch {
      /* ignore */
    }
    if (res.status === 401) useAuth.getState().clear()
    throw new ApiError(res.status, message)
  }
  return (await res.json()) as T
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
  nativePlace?: string
  page?: number
  pageSize?: number
}

export interface PagedTraitorResponse {
  items: TraitorSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
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
        nativePlace: filters.nativePlace,
        page: filters.page,
        pageSize: filters.pageSize,
      })}`,
    ),

  getTraitor: (id: string) => request<{ traitor: Traitor }>(`/traitors/${id}`),

  getRevisions: (id: string) => request<{ items: Revision[] }>(`/traitors/${id}/revisions`),

  getStats: () => request<TraitorStats>('/traitors/stats'),

  getTimeline: () => request<{ items: TimelineNode[] }>('/traitors/timeline'),

  listWebMenus: () => request<{ items: WebMenu[] }>('/web-menus'),

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
