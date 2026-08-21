import { useAuth } from '../stores/auth'
import type { AuthPayload, ReviewStatus, Revision, TraitorSnapshot, User } from '../types'

const BASE = '/api'

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
  const res = await fetch(BASE + path, {
    ...init,
    headers: { ...authHeader(), ...(init.headers ?? {}) },
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

export const api = {
  login: (body: { account: string; password: string }) =>
    request<AuthPayload>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<{ user: User }>('/auth/me'),

  adminRevisions: (status?: ReviewStatus) =>
    request<{ items: Revision[] }>(`/admin/revisions${status ? `?status=${status}` : ''}`),

  adminRevision: (rid: string) => request<{ revision: Revision }>(`/admin/revisions/${rid}`),

  review: (rid: string, body: { result: 'approved' | 'rejected'; comment?: string }) =>
    request<{ revision: Revision }>(`/admin/revisions/${rid}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getTraitor: (id: string) => request<{ traitor: TraitorSnapshot }>(`/traitors/${id}`),
}
