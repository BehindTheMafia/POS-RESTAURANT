import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  User, Table, Order, OrderItem, Sale,
  InventoryItem, CashRegisterSession, Expense, AuditLog, Restaurant
} from './types';
import {
  mockUsers, mockTables, mockProducts, mockCategories,
  mockSales, mockInventory, mockExpenses, mockAuditLogs,
  mockRestaurant, mockRecipes
} from './mockData';

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  tables: Table[];
  orders: Order[];
  sales: Sale[];
  inventory: InventoryItem[];
  cashRegister: CashRegisterSession | null;
  expenses: Expense[];
  auditLogs: AuditLog[];
  restaurant: Restaurant;
  currentOrderId: string | null;
  users: User[];
}

type Action =
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'OPEN_TABLE'; tableId: string; order: Order }
  | { type: 'ADD_ORDER_ITEM'; orderId: string; item: OrderItem }
  | { type: 'REMOVE_ORDER_ITEM'; orderId: string; itemId: string }
  | { type: 'UPDATE_ITEM_QTY'; orderId: string; itemId: string; quantity: number }
  | { type: 'COMPLETE_SALE'; sale: Sale; orderId: string; tableId: string }
  | { type: 'SET_CURRENT_ORDER'; orderId: string | null }
  | { type: 'OPEN_REGISTER'; register: CashRegisterSession }
  | { type: 'CLOSE_REGISTER'; finalCash: number; finalTransfer: number; finalCard: number }
  | { type: 'UPDATE_INVENTORY'; items: InventoryItem[] }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'ADD_AUDIT_LOG'; log: AuditLog }
  | { type: 'UPDATE_RESTAURANT'; restaurant: Restaurant }
  | { type: 'UPDATE_USERS'; users: User[] };

const initialState: AppState = {
  currentUser: null,
  isAuthenticated: false,
  tables: mockTables,
  orders: [],
  sales: mockSales,
  inventory: mockInventory,
  cashRegister: null,
  expenses: mockExpenses,
  auditLogs: mockAuditLogs,
  restaurant: mockRestaurant,
  currentOrderId: null,
  users: mockUsers,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.user, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, currentUser: null, isAuthenticated: false, currentOrderId: null };
    case 'OPEN_TABLE':
      return {
        ...state,
        tables: state.tables.map(t =>
          t.id === action.tableId
            ? { ...t, status: 'occupied', currentOrderId: action.order.id, openedAt: new Date().toISOString() }
            : t
        ),
        orders: [...state.orders, action.order],
        currentOrderId: action.order.id,
      };
    case 'ADD_ORDER_ITEM':
      return {
        ...state,
        orders: state.orders.map(o =>
          o.id === action.orderId
            ? { ...o, items: [...o.items, action.item], total: o.total + action.item.subtotal }
            : o
        ),
      };
    case 'REMOVE_ORDER_ITEM':
      return {
        ...state,
        orders: state.orders.map(o => {
          if (o.id !== action.orderId) return o;
          const item = o.items.find(i => i.id === action.itemId);
          return {
            ...o,
            items: o.items.filter(i => i.id !== action.itemId),
            total: o.total - (item?.subtotal ?? 0),
          };
        }),
      };
    case 'UPDATE_ITEM_QTY':
      return {
        ...state,
        orders: state.orders.map(o => {
          if (o.id !== action.orderId) return o;
          const items = o.items.map(i => {
            if (i.id !== action.itemId) return i;
            return { ...i, quantity: action.quantity, subtotal: i.price * action.quantity };
          });
          return { ...o, items, total: items.reduce((s, i) => s + i.subtotal, 0) };
        }),
      };
    case 'COMPLETE_SALE':
      return {
        ...state,
        sales: [action.sale, ...state.sales],
        orders: state.orders.map(o =>
          o.id === action.orderId ? { ...o, status: 'closed' } : o
        ),
        tables: state.tables.map(t =>
          t.id === action.tableId
            ? { ...t, status: 'free', currentOrderId: undefined, openedAt: undefined }
            : t
        ),
        currentOrderId: null,
      };
    case 'SET_CURRENT_ORDER':
      return { ...state, currentOrderId: action.orderId };
    case 'OPEN_REGISTER':
      return { ...state, cashRegister: action.register };
    case 'CLOSE_REGISTER':
      return {
        ...state,
        cashRegister: state.cashRegister
          ? {
              ...state.cashRegister,
              status: 'closed',
              closedAt: new Date().toISOString(),
              finalCash: action.finalCash,
              finalTransfer: action.finalTransfer,
              finalCard: action.finalCard,
            }
          : null,
      };
    case 'UPDATE_INVENTORY':
      return { ...state, inventory: action.items };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'ADD_AUDIT_LOG':
      return { ...state, auditLogs: [action.log, ...state.auditLogs] };
    case 'UPDATE_RESTAURANT':
      return { ...state, restaurant: action.restaurant };
    case 'UPDATE_USERS':
      return { ...state, users: action.users };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  products: typeof mockProducts;
  categories: typeof mockCategories;
  recipes: typeof mockRecipes;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{
      state, dispatch,
      products: mockProducts,
      categories: mockCategories,
      recipes: mockRecipes,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function addAuditLog(
  dispatch: React.Dispatch<Action>,
  userId: string,
  userName: string,
  action: string,
  record: string,
  opts?: { oldValue?: string; newValue?: string; reason?: string }
) {
  const now = new Date();
  dispatch({
    type: 'ADD_AUDIT_LOG',
    log: {
      id: `audit-${Date.now()}`,
      userId,
      userName,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      action,
      record,
      ...opts,
    },
  });
}
