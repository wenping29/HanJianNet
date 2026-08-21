import type { Role } from '../types'

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: '超级管理员',
  admin: '管理员',
  manager: '管理',
  user: '普通用户',
  guest: '游客',
}

export const ROLE_OPTIONS: Role[] = ['superadmin', 'admin', 'manager', 'user', 'guest']

const RANK: Record<Role, number> = {
  superadmin: 4,
  admin: 3,
  manager: 2,
  user: 1,
  guest: 0,
}

export function roleRank(role: Role): number {
  return RANK[role] ?? -1
}

/** 能否进入后台控制台 */
export function canAccessConsole(role: Role): boolean {
  return roleRank(role) >= roleRank('manager')
}

/** 能否管理用户（查看/新增/编辑/删除） */
export function canManageUsers(role: Role): boolean {
  return roleRank(role) >= roleRank('admin')
}

/**
 * 能否把某账号改为某角色（与后端规则一致）：
 * 不能改自己；只能操作层级低于自己的账号；不能授予不低于自己的角色。
 */
export function canAssignRole(actor: { id: string; role: Role }, target: { id: string; role: Role }, next: Role): boolean {
  if (actor.id === target.id) return false
  if (roleRank(actor.role) <= roleRank(target.role)) return false
  return roleRank(next) < roleRank(actor.role)
}
