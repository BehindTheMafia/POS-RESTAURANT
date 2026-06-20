import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tables } from './pages/Tables';
import { POSOrder } from './pages/POSOrder';
import { CashRegister } from './pages/CashRegister';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Audit } from './pages/Audit';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', Component: Dashboard },
      { path: 'pos', Component: Tables },
      { path: 'pos/:tableId', Component: POSOrder },
      { path: 'caja', Component: CashRegister },
      { path: 'productos', Component: Products },
      { path: 'inventario', Component: Inventory },
      { path: 'reportes', Component: Reports },
      { path: 'usuarios', Component: Users },
      { path: 'configuracion', Component: Settings },
      { path: 'auditoria', Component: Audit },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
