import type {
  User, Table, Category, Product, Sale,
  InventoryItem, Recipe, AuditLog, Expense, Restaurant
} from './types';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Carlos Mendoza', username: 'admin', role: 'admin', status: 'active', createdAt: '2024-01-01' },
  { id: 'u2', name: 'Ana López', username: 'cajero1', role: 'cashier', status: 'active', createdAt: '2024-01-05' },
  { id: 'u3', name: 'Pedro García', username: 'mesero1', role: 'waiter', status: 'active', createdAt: '2024-01-10' },
  { id: 'u4', name: 'María Torres', username: 'mesero2', role: 'waiter', status: 'active', createdAt: '2024-01-15' },
  { id: 'u5', name: 'Lucía Ramos', username: 'cajero2', role: 'cashier', status: 'inactive', createdAt: '2024-02-01' },
];

export const mockCategories: Category[] = [
  { id: 'c1', name: 'Wings' },
  { id: 'c2', name: 'Chunks' },
  { id: 'c3', name: 'Super Tenders' },
  { id: 'c4', name: 'Extras' },
  { id: 'c5', name: 'Bebidas' },
];

export const mockProducts: Product[] = [
  { id: 'p1', name: 'Wings 6', categoryId: 'c1', price: 180, cost: 78, status: 'active' },
  { id: 'p2', name: 'Wings 10', categoryId: 'c1', price: 280, cost: 120, status: 'active' },
  { id: 'p3', name: 'Wings 15', categoryId: 'c1', price: 400, cost: 175, status: 'active' },
  { id: 'p4', name: 'Wings 20', categoryId: 'c1', price: 520, cost: 225, status: 'active' },
  { id: 'p5', name: 'Chunks 6', categoryId: 'c2', price: 160, cost: 70, status: 'active' },
  { id: 'p6', name: 'Chunks 10', categoryId: 'c2', price: 250, cost: 110, status: 'active' },
  { id: 'p7', name: 'Super Tenders 4', categoryId: 'c3', price: 200, cost: 90, status: 'active' },
  { id: 'p8', name: 'Super Tenders 6', categoryId: 'c3', price: 280, cost: 130, status: 'active' },
  { id: 'p9', name: 'Papas Fritas', categoryId: 'c4', price: 60, cost: 18, status: 'active' },
  { id: 'p10', name: 'Aros de Cebolla', categoryId: 'c4', price: 70, cost: 22, status: 'active' },
  { id: 'p11', name: 'Ranch Extra', categoryId: 'c4', price: 20, cost: 5, status: 'active' },
  { id: 'p12', name: 'Coca Cola', categoryId: 'c5', price: 50, cost: 18, status: 'active' },
  { id: 'p13', name: 'Coca Cola Zero', categoryId: 'c5', price: 50, cost: 18, status: 'active' },
  { id: 'p14', name: 'Té de Limón', categoryId: 'c5', price: 50, cost: 12, status: 'active' },
  { id: 'p15', name: 'Rojita', categoryId: 'c5', price: 50, cost: 15, status: 'active' },
];

export const mockTables: Table[] = [
  { id: 't1', name: 'Mesa 1', number: 1, capacity: 4, status: 'free' },
  { id: 't2', name: 'Mesa 2', number: 2, capacity: 2, status: 'free' },
  { id: 't3', name: 'Mesa 3', number: 3, capacity: 6, status: 'occupied', currentOrderId: 'ord-3', openedAt: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 't4', name: 'Mesa 4', number: 4, capacity: 4, status: 'free' },
  { id: 't5', name: 'Mesa 5', number: 5, capacity: 4, status: 'free' },
  { id: 't6', name: 'Mesa 6', number: 6, capacity: 6, status: 'occupied', currentOrderId: 'ord-6', openedAt: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: 't7', name: 'Mesa 7', number: 7, capacity: 2, status: 'free' },
  { id: 't8', name: 'Mesa 8', number: 8, capacity: 4, status: 'free' },
  { id: 't9', name: 'Mesa 9', number: 9, capacity: 6, status: 'occupied', currentOrderId: 'ord-9', openedAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: 't10', name: 'Mesa 10', number: 10, capacity: 4, status: 'free' },
  { id: 't11', name: 'Mesa 11', number: 11, capacity: 2, status: 'free' },
  { id: 't12', name: 'Mesa 12', number: 12, capacity: 8, status: 'free' },
];

export const mockInventory: InventoryItem[] = [
  { id: 'i1', name: 'Bolsa de Alitas (1kg)', unit: 'bolsa', stock: 8, minStock: 10, cost: 120 },
  { id: 'i2', name: 'Aceite (1L)', unit: 'litro', stock: 5, minStock: 8, cost: 45 },
  { id: 'i3', name: 'Papas (5kg)', unit: 'saco', stock: 3, minStock: 5, cost: 80 },
  { id: 'i4', name: 'Ranch (galón)', unit: 'galón', stock: 14, minStock: 4, cost: 150 },
  { id: 'i5', name: 'Salsa BBQ (galón)', unit: 'galón', stock: 6, minStock: 4, cost: 130 },
  { id: 'i6', name: 'Salsa Buffalo (galón)', unit: 'galón', stock: 9, minStock: 4, cost: 140 },
  { id: 'i7', name: 'Empaques (paquete)', unit: 'paquete', stock: 15, minStock: 20, cost: 35 },
  { id: 'i8', name: 'Vasos (paquete)', unit: 'paquete', stock: 7, minStock: 10, cost: 25 },
];

export const mockRecipes: Recipe[] = [
  {
    id: 'r1', productId: 'p1', productName: 'Wings 6',
    ingredients: [
      { ingredientId: 'i1', ingredientName: 'Bolsa de Alitas', quantity: 0.15, unit: 'bolsa' },
      { ingredientId: 'i3', ingredientName: 'Papas', quantity: 0.02, unit: 'saco' },
      { ingredientId: 'i4', ingredientName: 'Ranch', quantity: 0.02, unit: 'galón' },
    ],
  },
  {
    id: 'r2', productId: 'p2', productName: 'Wings 10',
    ingredients: [
      { ingredientId: 'i1', ingredientName: 'Bolsa de Alitas', quantity: 0.25, unit: 'bolsa' },
      { ingredientId: 'i3', ingredientName: 'Papas', quantity: 0.02, unit: 'saco' },
      { ingredientId: 'i4', ingredientName: 'Ranch', quantity: 0.025, unit: 'galón' },
    ],
  },
  {
    id: 'r3', productId: 'p3', productName: 'Wings 15',
    ingredients: [
      { ingredientId: 'i1', ingredientName: 'Bolsa de Alitas', quantity: 0.38, unit: 'bolsa' },
      { ingredientId: 'i3', ingredientName: 'Papas', quantity: 0.02, unit: 'saco' },
      { ingredientId: 'i4', ingredientName: 'Ranch', quantity: 0.03, unit: 'galón' },
    ],
  },
];

const generateSales = (): Sale[] => {
  const sales: Sale[] = [];
  const methods: Sale['paymentMethod'][] = ['cash', 'transfer', 'card', 'cash', 'cash'];
  const banks = ['BAC', 'Lafise', 'Banpro', 'Ficohsa'];
  const cashiers = [
    { id: 'u2', name: 'Ana López' },
    { id: 'u5', name: 'Lucía Ramos' },
  ];
  let saleNum = 800;
  for (let d = 29; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const numSales = Math.floor(Math.random() * 18) + 8;
    for (let s = 0; s < numSales; s++) {
      saleNum++;
      const method = methods[Math.floor(Math.random() * methods.length)];
      const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
      const tableNum = Math.floor(Math.random() * 12) + 1;
      const total = (Math.floor(Math.random() * 10) + 2) * 100 - Math.floor(Math.random() * 40);
      const discount = Math.random() < 0.08 ? Math.round(total * 0.1) : 0;
      sales.push({
        id: `sale-${d}-${s}`,
        number: saleNum,
        date: dateStr,
        cashierId: cashier.id,
        cashierName: cashier.name,
        tableId: `t${tableNum}`,
        tableName: `Mesa ${tableNum}`,
        orderId: `ord-${d}-${s}`,
        total,
        discount,
        tax: Math.round((total - discount) * 0.15),
        paymentMethod: method,
        bankName: (method === 'transfer' || method === 'card') ? banks[Math.floor(Math.random() * banks.length)] : undefined,
        reference: method !== 'cash' ? `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined,
        status: Math.random() < 0.97 ? 'completed' : 'cancelled',
      });
    }
  }
  return sales;
};

export const mockSales = generateSales();

export const mockExpenses: Expense[] = [
  { id: 'e1', concept: 'Compra de aceite (10L)', category: 'Insumos', amount: 450, userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-20' },
  { id: 'e2', concept: 'Salarios quincenales', category: 'Personal', amount: 5000, userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-15' },
  { id: 'e3', concept: 'Gas propano', category: 'Servicios', amount: 800, userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-18' },
  { id: 'e4', concept: 'Empaques y vasos', category: 'Insumos', amount: 350, userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-17' },
  { id: 'e5', concept: 'Agua potable', category: 'Servicios', amount: 250, userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-16' },
  { id: 'e6', concept: 'Bolsas de alitas (50kg)', category: 'Materia prima', amount: 6000, userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-12' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'a1', userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-20', time: '08:15:32', action: 'Apertura de Caja', record: 'Caja #001', newValue: 'Abierta — Fondo C$500' },
  { id: 'a2', userId: 'u3', userName: 'Pedro García', date: '2024-06-20', time: '09:22:10', action: 'Pedido Creado', record: 'Pedido #045 — Mesa 3', newValue: 'Wings 10, Coca Cola x2' },
  { id: 'a3', userId: 'u2', userName: 'Ana López', date: '2024-06-20', time: '09:45:18', action: 'Venta Procesada', record: 'Venta #0891', newValue: 'C$380 — Efectivo' },
  { id: 'a4', userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-20', time: '10:05:44', action: 'Precio Editado', record: 'Wings 6', oldValue: 'C$160', newValue: 'C$180', reason: 'Ajuste por inflación' },
  { id: 'a5', userId: 'u3', userName: 'Pedro García', date: '2024-06-20', time: '10:35:21', action: 'Pedido Creado', record: 'Pedido #046 — Mesa 6', newValue: 'Wings 15 x2, Té de Limón x2' },
  { id: 'a6', userId: 'u2', userName: 'Ana López', date: '2024-06-20', time: '11:02:55', action: 'Descuento Aplicado', record: 'Venta #0892', newValue: '10% — C$38', reason: 'Cliente frecuente' },
  { id: 'a7', userId: 'u4', userName: 'María Torres', date: '2024-06-20', time: '11:30:10', action: 'Pedido Creado', record: 'Pedido #047 — Mesa 9', newValue: 'Chunks 10, Papas Fritas x2' },
  { id: 'a8', userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-20', time: '12:15:00', action: 'Inventario Actualizado', record: 'Bolsa de Alitas (1kg)', oldValue: '5 bolsas', newValue: '8 bolsas', reason: 'Compra del día' },
  { id: 'a9', userId: 'u2', userName: 'Ana López', date: '2024-06-20', time: '13:05:12', action: 'Venta Procesada', record: 'Venta #0893', newValue: 'C$560 — Transferencia BAC' },
  { id: 'a10', userId: 'u1', userName: 'Carlos Mendoza', date: '2024-06-20', time: '14:22:44', action: 'Usuario Creado', record: 'Usuario: mesero2', newValue: 'Rol: Mesero — Activo' },
];

export const mockRestaurant: Restaurant = {
  name: 'Prime Wings S.A.',
  commercialName: 'Prime Wings',
  address: 'Managua, Nicaragua — Rotonda Bello Horizonte 2c al Norte',
  phone: '+505 2250-1234',
  ruc: 'J0310000016985',
  currency: 'C$',
  exchangeRate: 36.5,
  primaryColor: '#FF5A1F',
  ticketMessage: '¡Gracias por visitarnos! Vuelve pronto 🍗',
  igv: 15,
};
