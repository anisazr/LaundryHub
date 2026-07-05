export type OrderStatus = "Diterima" | "Dicuci" | "Disetrika" | "Siap" | "Diantar" | "Selesai";

export interface Order {
  id: string;
  customer: string;
  phone: string;
  address?: string;
  package: string;
  weightKg: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  dueAt: string;
  paid: boolean;
  source?: "Kasir" | "Online";
  paymentMethod?: "Tunai" | "Kartu" | "QRIS" | "Transfer Bank";
  pickupAt?: string;
  deliveryAt?: string;
  customerId?: string;
  pickupLocation?: string;
  assignedCourier?: string;
  pickupVehicle?: "Motor" | "Pick Up";
  pickupScheduledAt?: string;
}

export interface ServicePackage {
  id: string;
  name: string;
  pricePerKg: number;
  durationHours: number;
  description: string;
  active: boolean;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  minQty: number;
  purchasePrice: number;
  supplier: string;
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  area: string;
  activeTasks: number;
}

export interface DeliveryTask {
  id: string;
  orderId: string;
  courier: string;
  type: "Jemput" | "Antar";
  address: string;
  scheduledAt: string;
  status: "Terjadwal" | "Berjalan" | "Selesai";
}

export interface AuditLog {
  id: string;
  user: string;
  module: string;
  action: string;
  detail: string;
  at: string;
}

export interface Complaint {
  id: string;
  orderId: string;
  customer: string;
  subject: string;
  status: "Baru" | "Diproses" | "Selesai";
  createdAt: string;
}

const today = new Date();
const iso = (d: Date) => d.toISOString();
const addHours = (h: number) => {
  const d = new Date(today);
  d.setHours(d.getHours() + h);
  return iso(d);
};

export const packages: ServicePackage[] = [
  { id: "PKG-01", name: "Cuci Kering", pricePerKg: 7000, durationHours: 24, description: "Cuci dan kering tanpa setrika", active: true },
  { id: "PKG-02", name: "Cuci Setrika", pricePerKg: 10000, durationHours: 48, description: "Paket lengkap cuci + setrika rapi", active: true },
  { id: "PKG-03", name: "Express 6 Jam", pricePerKg: 18000, durationHours: 6, description: "Selesai dalam 6 jam", active: true },
  { id: "PKG-04", name: "Dry Clean", pricePerKg: 25000, durationHours: 72, description: "Khusus jas, gaun, dan kain halus", active: true },
  { id: "PKG-05", name: "Bed Cover", pricePerKg: 35000, durationHours: 48, description: "Bed cover dan selimut tebal", active: false },
];

export const orders: Order[] = [
  { id: "ORD-1042", customer: "Andi Pratama", phone: "0812-1111-2222", package: "Cuci Setrika", weightKg: 4.5, total: 45000, status: "Dicuci", createdAt: addHours(-3), dueAt: addHours(45), paid: true },
  { id: "ORD-1043", customer: "Siti Nurhaliza", phone: "0813-3333-4444", package: "Express 6 Jam", weightKg: 2.0, total: 36000, status: "Disetrika", createdAt: addHours(-4), dueAt: addHours(2), paid: true },
  { id: "ORD-1044", customer: "Budi Santoso", phone: "0821-5555-6666", package: "Cuci Kering", weightKg: 6.0, total: 42000, status: "Siap", createdAt: addHours(-26), dueAt: addHours(-2), paid: false },
  { id: "ORD-1045", customer: "Maria Lestari", phone: "0856-7777-8888", package: "Dry Clean", weightKg: 1.5, total: 37500, status: "Diterima", createdAt: addHours(-1), dueAt: addHours(71), paid: true },
  { id: "ORD-1046", customer: "Joko Widodo", phone: "0877-9999-0000", package: "Cuci Setrika", weightKg: 8.0, total: 80000, status: "Diantar", createdAt: addHours(-30), dueAt: addHours(18), paid: true },
  { id: "ORD-1047", customer: "Rina Marlina", phone: "0811-2222-3333", package: "Cuci Setrika", weightKg: 3.2, total: 32000, status: "Selesai", createdAt: addHours(-50), dueAt: addHours(-2), paid: true },
  { id: "ORD-1048", customer: "Hendra Wijaya", phone: "0822-4444-5555", package: "Express 6 Jam", weightKg: 1.8, total: 32400, status: "Diterima", createdAt: addHours(-1), dueAt: addHours(5), paid: false },
];

export const stock: StockItem[] = [
  { id: "STK-01", name: "Deterjen Cair Premium", unit: "Liter", qty: 24, minQty: 10, purchasePrice: 18000, supplier: "PT Bersih Chemical" },
  { id: "STK-02", name: "Pewangi Lavender", unit: "Liter", qty: 8, minQty: 10, purchasePrice: 22000, supplier: "Aroma Laundry Supply" },
  { id: "STK-03", name: "Pelembut Pakaian", unit: "Liter", qty: 15, minQty: 8, purchasePrice: 20000, supplier: "Aroma Laundry Supply" },
  { id: "STK-04", name: "Plastik Kemasan L", unit: "pcs", qty: 320, minQty: 100, purchasePrice: 450, supplier: "CV Plastik Jaya" },
  { id: "STK-05", name: "Hanger Plastik", unit: "pcs", qty: 45, minQty: 50, purchasePrice: 1200, supplier: "CV Plastik Jaya" },
];

export const couriers: Courier[] = [
  { id: "KR-01", name: "Agus Setiawan", phone: "0812-0001-0001", area: "Jakarta Selatan", activeTasks: 3 },
  { id: "KR-02", name: "Dewi Anggraini", phone: "0812-0002-0002", area: "Jakarta Pusat", activeTasks: 2 },
  { id: "KR-03", name: "Rudi Hartono", phone: "0812-0003-0003", area: "Jakarta Timur", activeTasks: 4 },
];

export const deliveries: DeliveryTask[] = [
  { id: "DLV-01", orderId: "ORD-1045", courier: "Agus Setiawan", type: "Jemput", address: "Jl. Melati No. 12, Jaksel", scheduledAt: addHours(1), status: "Terjadwal" },
  { id: "DLV-02", orderId: "ORD-1046", courier: "Dewi Anggraini", type: "Antar", address: "Jl. Sudirman No. 88, Jakpus", scheduledAt: addHours(2), status: "Berjalan" },
  { id: "DLV-03", orderId: "ORD-1042", courier: "Rudi Hartono", type: "Antar", address: "Jl. Cendana No. 3, Jaktim", scheduledAt: addHours(20), status: "Terjadwal" },
];

export const audit: AuditLog[] = [
  { id: "LOG-001", user: "admin@gmail.com", module: "Paket", action: "UPDATE", detail: "Harga PKG-02 diubah 9000 → 10000", at: addHours(-1) },
  { id: "LOG-002", user: "kasir@gmail.com", module: "Order", action: "CREATE", detail: "Order ORD-1048 dibuat", at: addHours(-1) },
  { id: "LOG-003", user: "admin@gmail.com", module: "Inventory", action: "UPDATE", detail: "Stok Pewangi Lavender -2 L", at: addHours(-2) },
  { id: "LOG-004", user: "kasir@gmail.com", module: "Pembayaran", action: "CREATE", detail: "Pembayaran ORD-1047 sebesar Rp32.000", at: addHours(-5) },
  { id: "LOG-005", user: "admin@gmail.com", module: "Kurir", action: "ASSIGN", detail: "Tugas DLV-02 → Dewi Anggraini", at: addHours(-3) },
];

export const complaints: Complaint[] = [
  { id: "CMP-01", orderId: "ORD-1042", customer: "Andi Pratama", subject: "Kemeja putih kurang bersih", status: "Diproses", createdAt: addHours(-2) },
  { id: "CMP-02", orderId: "ORD-1047", customer: "Rina Marlina", subject: "Hanger hilang", status: "Selesai", createdAt: addHours(-20) },
];

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const hoursUntil = (iso: string) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 36e5;
  return diff;
};
