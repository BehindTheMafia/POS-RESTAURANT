export type UserRole = 'admin' | 'cashier' | 'waiter';
export type TableStatus = 'free' | 'occupied';
export type OrderStatus = 'open' | 'closed' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'mixed';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Table {
  id: string;
  name: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  openedAt?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  cost: number;
  status: 'active' | 'inactive';
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  number: number;
  tableId: string;
  tableName: string;
  waiterId: string;
  waiterName: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  number: number;
  date: string;
  cashierId: string;
  cashierName: string;
  tableId: string;
  tableName: string;
  orderId: string;
  total: number;
  discount: number;
  tax: number;
  paymentMethod: PaymentMethod;
  bankName?: string;
  reference?: string;
  status: 'completed' | 'cancelled';
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  cost: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  productId: string;
  productName: string;
  ingredients: RecipeIngredient[];
}

export interface CashMovement {
  id: string;
  type: 'in' | 'out';
  concept: string;
  amount: number;
  createdAt: string;
}

export interface CashRegisterSession {
  id: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt?: string;
  initialAmount: number;
  finalCash?: number;
  finalTransfer?: number;
  finalCard?: number;
  status: 'open' | 'closed';
  movements: CashMovement[];
}

export interface Expense {
  id: string;
  concept: string;
  category: string;
  amount: number;
  userId: string;
  userName: string;
  date: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  date: string;
  time: string;
  action: string;
  record: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface Restaurant {
  name: string;
  commercialName: string;
  address: string;
  phone: string;
  ruc: string;
  currency: string;
  exchangeRate: number;
  primaryColor: string;
  ticketMessage: string;
  igv: number;
}
