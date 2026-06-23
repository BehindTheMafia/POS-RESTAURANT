import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { ProtectedRoute } from './ProtectedRoute'
import { HomeRedirect } from './HomeRedirect'

// Lazy-loaded pages — each page becomes its own JS chunk loaded on demand.
// This drops the initial bundle from ~1.3 MB down to only what the first page needs.
const Dashboard    = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Tables       = lazy(() => import('./pages/Tables').then(m => ({ default: m.Tables })))
const POSOrder     = lazy(() => import('./pages/POSOrder').then(m => ({ default: m.POSOrder })))
const Products     = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })))
const Inventory    = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })))
const Reports      = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })))
const Users        = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })))
const Settings     = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const Audit        = lazy(() => import('./pages/Audit').then(m => ({ default: m.Audit })))

// Suspense fallback is handled by Layout so the loading state renders inside
// the already-visible sidebar + header shell, not a blank white page.

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute requiredPermission="dashboard.view"><Dashboard /></ProtectedRoute>,
      },
      {
        path: 'pos',
        element: <ProtectedRoute requiredPermission="pos.view"><Tables /></ProtectedRoute>,
      },
      {
        path: 'pos/:tableId',
        element: <ProtectedRoute requiredPermission="pos.view"><POSOrder /></ProtectedRoute>,
      },
      {
        path: 'productos',
        element: <ProtectedRoute requiredPermission="products.manage"><Products /></ProtectedRoute>,
      },
      {
        path: 'inventario',
        element: <ProtectedRoute requiredPermission="inventory.view"><Inventory /></ProtectedRoute>,
      },
      {
        path: 'reportes',
        element: <ProtectedRoute requiredPermission="reports.view"><Reports /></ProtectedRoute>,
      },
      {
        path: 'usuarios',
        element: <ProtectedRoute requiredPermission="users.manage"><Users /></ProtectedRoute>,
      },
      {
        path: 'configuracion',
        element: <ProtectedRoute requiredPermission="settings.manage"><Settings /></ProtectedRoute>,
      },
      {
        path: 'auditoria',
        element: <ProtectedRoute requiredPermission="audit.view"><Audit /></ProtectedRoute>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
