import { useAuth } from '../stores/auth'
import type {
  AdminMenuItem,
  Attachment,
  AttachmentKind,
  AuthPayload,
  MenuItem,
  ReviewStatus,
  Revision,
  Role,
  RoleMenuConfig,
  TraitorDetail,
  TraitorInput,
  TraitorSnapshot,
  TraitorSummary,
  User,
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

export const api = {
  login: (body: { account: string; password: string }) =>
    request<AuthPayload>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<{ user: User }>('/auth/me'),

  menus: () => request<{ items: MenuItem[] }>('/admin/menus'),

  allMenus: () => request<{ items: AdminMenuItem[] }>('/admin/menus/manage'),

  createMenu: (body: { key: string; path: string; label: string; order: number; roles: Role[]; parent?: string | null }) =>
    request<{ item: AdminMenuItem }>('/admin/menus', { method: 'POST', body: JSON.stringify(body) }),

  updateMenu: (id: string, body: { key: string; path: string; label: string; order: number; roles: Role[]; parent?: string | null }) =>
    request<{ item: AdminMenuItem }>(`/admin/menus/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  roleMenus: () => request<{ items: RoleMenuConfig[] }>('/admin/roles'),

  updateRoleMenus: (role: Role, menuKeys: string[]) =>
    request<{ items: RoleMenuConfig[] }>(`/admin/roles/${role}/menus`, {
      method: 'PUT',
      body: JSON.stringify({ menuKeys }),
    }),

  adminRevisions: (status?: ReviewStatus) =>
    request<{ items: Revision[] }>(`/admin/revisions${status ? `?status=${status}` : ''}`),

  adminRevision: (rid: string) => request<{ revision: Revision }>(`/admin/revisions/${rid}`),

  review: (rid: string, body: { result: 'approved' | 'rejected'; comment?: string }) =>
    request<{ revision: Revision }>(`/admin/revisions/${rid}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getTraitor: (id: string) => request<{ traitor: TraitorSnapshot }>(`/traitors/${id}`),

  adminTraitors: (name?: string) =>
    request<{ items: TraitorSummary[] }>(`/admin/traitors${name ? `?name=${encodeURIComponent(name)}` : ''}`),

  adminTraitor: (id: string) => request<{ traitor: TraitorDetail }>(`/admin/traitors/${id}`),

  createTraitorDirect: (input: TraitorInput) =>
    request<{ traitor: TraitorDetail }>('/admin/traitors', { method: 'POST', body: JSON.stringify(input) }),

  updateTraitorDirect: (id: string, input: TraitorInput) =>
    request<{ traitor: TraitorDetail }>(`/admin/traitors/${id}`, { method: 'PUT', body: JSON.stringify(input) }),

  upload: async (file: File, kind: AttachmentKind): Promise<Attachment> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    const res = await fetch(`${BASE}/uploads`, { method: 'POST', headers: authHeader(), body: fd })
    if (!res.ok) throw new ApiError(res.status, '上传失败')
    const data = (await res.json()) as { id: string; url: string; kind: AttachmentKind; fileType: string }
    return { ...data, caption: '' }
  },

  users: () => request<{ items: User[] }>('/admin/users'),

  createUser: (body: { username: string; email: string; password: string; role: Role }) =>
    request<{ user: User }>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),

  updateUser: (id: string, body: { username: string; email: string; password?: string }) =>
    request<{ user: User }>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  changeRole: (id: string, role: Role) =>
    request<{ user: User }>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  deleteUser: (id: string) => request<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  updateProfile: (body: { username: string; email: string }) =>
    request<{ user: User }>('/me/profile', { method: 'PUT', body: JSON.stringify(body) }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/me/password', { method: 'PUT', body: JSON.stringify(body) }),
}
