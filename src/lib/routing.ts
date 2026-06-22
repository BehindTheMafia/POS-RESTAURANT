import type { AuthUser } from '../hooks/useAuth'

const ROUTE_PERMISSIONS: Array<{ path: string; permission: string }> = [
  { path: '/dashboard', permission: 'dashboard.view' },
  { path: '/pos', permission: 'pos.view' },
  { path: '/caja', permission: 'cash.manage' },
  { path: '/productos', permission: 'products.manage' },
  { path: '/inventario', permission: 'inventory.view' },
  { path: '/reportes', permission: 'reports.view' },
  { path: '/usuarios', permission: 'users.manage' },
  { path: '/configuracion', permission: 'settings.manage' },
  { path: '/auditoria', permission: 'audit.view' },
]

export const getDefaultRoute = (user: AuthUser | null): string => {
  if (!user) return '/login'

  if (user.roleName === 'mesero' || user.roleName === 'cajero') {
    return '/pos'
  }

  if (user.roleName === 'admin' || user.permissions.includes('dashboard.view')) {
    return '/dashboard'
  }

  const firstAllowed = ROUTE_PERMISSIONS.find(
    route => user.permissions.includes(route.permission)
  )

  return firstAllowed?.path ?? '/pos'
}

export const canAccessRoute = (user: AuthUser | null, permission?: string): boolean => {
  if (!user) return false
  if (!permission) return true
  if (user.roleName === 'admin') return true
  return user.permissions.includes(permission)
}
