import {
  audit as initialAudit,
  orders as initialOrders,
  packages as initialPackages,
  stock as initialStock,
  type AuditLog,
  type Order,
  type ServicePackage,
  type StockItem,
} from "@/lib/mock-data";
import { useEffect, useState } from "react";

const STORAGE_KEY = "laundryhub-data-v1";
const CHANGE_EVENT = "laundryhub-data-change";
const INITIAL_CAPITAL = 2_000_000;

export interface LedgerEntry {
  id: string;
  type: "Modal" | "Pendapatan" | "Pembelian" | "Gaji";
  amount: number;
  detail: string;
  at: string;
  method?: "Tunai" | "Kartu" | "QRIS" | "Transfer Bank";
  employeeId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: "Admin" | "Kasir" | "Kurir" | "Staff";
  salary: number;
  active: boolean;
  email?: string;
  avatar?: string;
}

export interface LaundryData {
  orders: Order[];
  packages: ServicePackage[];
  stock: StockItem[];
  audit: AuditLog[];
  ledger: LedgerEntry[];
  employees: Employee[];
  initialCapital: number;
  customers: CustomerAccount[];
  settings: LaundrySettings;
  conversations: CustomerMessage[];
}

export interface NewOrderInput {
  customer: string;
  phone: string;
  address: string;
  packageId: string;
  weightKg: number;
  pickupAt: string;
  customerId?: string;
  source?: "Kasir" | "Online";
  paymentMethod?: "Tunai" | "Kartu" | "QRIS" | "Transfer Bank";
  deliveryAt?: string;
  paid?: boolean;
  pickupLocation?: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  avatar?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bank: string;
  accountNo: string;
  accountName: string;
  active: boolean;
}

export interface LaundrySettings {
  dailyCapacityKg: number;
  ownerVerificationCode: string;
  qrisMerchant: string;
  bankAccounts: BankAccount[];
}

export interface CustomerMessage {
  id: string;
  customerId: string;
  sender: "Customer" | "Admin" | "Kasir";
  body: string;
  at: string;
}

export interface StockPurchaseInput {
  stockId: string;
  qty: number;
  cost: number;
  supplier: string;
}

export interface PackageInput {
  id?: string;
  name: string;
  pricePerKg: number;
  durationHours: number;
  description: string;
  active: boolean;
}

export interface StockItemInput {
  id?: string;
  name: string;
  unit: string;
  qty: number;
  minQty: number;
  purchasePrice: number;
  supplier: string;
}

export interface EmployeeInput {
  id?: string;
  name: string;
  role: Employee["role"];
  salary: number;
  active: boolean;
}

const nowIso = () => new Date().toISOString();

export const stockUsageRules: Record<string, { label: string; perKg?: number; perOrder?: number }> = {
  "STK-01": { label: "0.08 Liter deterjen / kg cucian", perKg: 0.08 },
  "STK-02": { label: "0.03 Liter pewangi / kg cucian", perKg: 0.03 },
  "STK-03": { label: "0.02 Liter pelembut / kg cucian", perKg: 0.02 },
  "STK-04": { label: "1 pcs plastik / order", perOrder: 1 },
};

const makeId = (prefix: string, existing: { id: string }[]) => {
  const next =
    existing.reduce((max, item) => {
      const value = Number(item.id.replace(/\D/g, ""));
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0) + 1;
  return `${prefix}-${String(next).padStart(4, "0")}`;
};

const cloneInitial = (): LaundryData => ({
  orders: initialOrders.map((item) => ({ ...item })),
  packages: initialPackages.map((item) => ({ ...item })),
  stock: initialStock.map((item) => ({ ...item })),
  audit: initialAudit.map((item) => ({ ...item })),
  employees: [
    { id: "EMP-0001", name: "Anisa Az-Zahro", role: "Admin", salary: 2500000, active: true, email: "admin@gmail.com" },
    { id: "EMP-0002", name: "Kasir Laundry Hub", role: "Kasir", salary: 1800000, active: true, email: "kasir@gmail.com" },
    { id: "EMP-0003", name: "Kurir Laundry Hub", role: "Kurir", salary: 1600000, active: true },
    { id: "EMP-0004", name: "Staff Operasional", role: "Staff", salary: 1700000, active: true },
  ],
  initialCapital: INITIAL_CAPITAL,
  customers: [
    {
      id: "CUS-0001",
      name: "Dina Rahma",
      email: "dina@mail.com",
      password: "customer123",
      phone: "0812-8888-0000",
      address: "Jl. Anggrek No. 8, Jakarta Selatan",
      createdAt: nowIso(),
    },
  ],
  settings: {
    dailyCapacityKg: 100,
    ownerVerificationCode: "OWNER-2026",
    qrisMerchant: "LaundryHub DataNova",
    bankAccounts: [
      { id: "BANK-0001", bank: "BCA", accountNo: "1234567890", accountName: "LaundryHub DataNova", active: true },
      { id: "BANK-0002", bank: "Mandiri", accountNo: "9876543210", accountName: "LaundryHub DataNova", active: true },
    ],
  },
  conversations: [
    {
      id: "MSG-0001",
      customerId: "CUS-0001",
      sender: "Admin",
      body: "Halo Dina, silakan chat di sini kalau butuh bantuan order laundry.",
      at: nowIso(),
    },
  ],
  ledger: [
    {
      id: "LED-0000",
      type: "Modal",
      amount: INITIAL_CAPITAL,
      detail: "Modal awal usaha",
      at: nowIso(),
    },
    ...initialOrders
      .filter((order) => order.paid)
      .map((order, index) => ({
        id: `LED-${String(index + 1).padStart(4, "0")}`,
        type: "Pendapatan" as const,
        amount: order.total,
        detail: `Pembayaran ${order.id} via Tunai`,
        method: "Tunai" as const,
        at: order.createdAt,
      })),
    {
      id: "LED-9001",
      type: "Pembelian",
      amount: 285000,
      detail: "Biaya operasional awal",
      at: nowIso(),
    },
  ],
});

const hydrateStockItems = (items: Partial<StockItem>[] | undefined) => {
  const source = items?.length ? items : initialStock;
  return source.map((item) => {
    const fallback = initialStock.find((stockItem) => stockItem.id === item.id);
    return {
      ...fallback,
      ...item,
      purchasePrice: item.purchasePrice ?? fallback?.purchasePrice ?? 0,
      supplier: item.supplier ?? fallback?.supplier ?? "Supplier Umum",
    } as StockItem;
  });
};

const hydrateEmployees = (items: Partial<Employee>[] | undefined, fallback: Employee[]) =>
  (items?.length ? items : fallback).map((item, index) => ({
    id: item.id ?? `EMP-${String(index + 1).padStart(4, "0")}`,
    name: item.name ?? "Karyawan",
    role: item.role ?? "Staff",
    salary: item.salary ?? 0,
    active: item.active ?? true,
    email: item.email,
    avatar: item.avatar,
  })) as Employee[];

const hydrateCustomers = (items: Partial<CustomerAccount>[] | undefined, fallback: CustomerAccount[]) =>
  (items?.length ? items : fallback).map((item, index) => ({
    id: item.id ?? `CUS-${String(index + 1).padStart(4, "0")}`,
    name: item.name ?? "Customer LaundryHub",
    email: item.email ?? `customer${index + 1}@mail.com`,
    password: item.password ?? "customer123",
    phone: item.phone ?? "",
    address: item.address ?? "",
    avatar: item.avatar,
    createdAt: item.createdAt ?? nowIso(),
  })) as CustomerAccount[];

const hydrateSettings = (settings: Partial<LaundrySettings> | undefined, fallback: LaundrySettings): LaundrySettings => ({
  dailyCapacityKg: settings?.dailyCapacityKg ?? fallback.dailyCapacityKg,
  ownerVerificationCode: settings?.ownerVerificationCode ?? fallback.ownerVerificationCode,
  qrisMerchant: settings?.qrisMerchant ?? fallback.qrisMerchant,
  bankAccounts: (settings?.bankAccounts?.length ? settings.bankAccounts : fallback.bankAccounts).map((account, index) => ({
    id: account.id ?? `BANK-${String(index + 1).padStart(4, "0")}`,
    bank: account.bank ?? "Bank",
    accountNo: account.accountNo ?? "",
    accountName: account.accountName ?? fallback.qrisMerchant,
    active: account.active ?? true,
  })),
});

const hydrateMessages = (items: Partial<CustomerMessage>[] | undefined) =>
  (items ?? []).map((message, index) => ({
    id: message.id ?? `MSG-${String(index + 1).padStart(4, "0")}`,
    customerId: message.customerId ?? "CUS-0001",
    sender: message.sender ?? "Admin",
    body: message.body ?? "",
    at: message.at ?? nowIso(),
  })) as CustomerMessage[];

const inferPaymentMethod = (entry: Partial<LedgerEntry>) => {
  if (entry.method) return entry.method;
  if (entry.detail?.includes("QRIS")) return "QRIS";
  if (entry.detail?.includes("Kartu")) return "Kartu";
  return entry.type === "Pendapatan" ? "Tunai" : undefined;
};

const hydrateLedger = (items: Partial<LedgerEntry>[] | undefined, fallback: LedgerEntry[]) =>
  (items?.length ? items : fallback).map((entry, index) => ({
    id: entry.id ?? `LED-${String(index).padStart(4, "0")}`,
    type: entry.type ?? "Pembelian",
    amount: entry.amount ?? 0,
    detail: entry.detail ?? "Transaksi",
    at: entry.at ?? nowIso(),
    method: inferPaymentMethod(entry),
    employeeId: entry.employeeId,
  })) as LedgerEntry[];

export const getLaundryData = (): LaundryData => {
  const defaults = cloneInitial();
  if (typeof window === "undefined") {
    return defaults;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LaundryData>;
    const fallbackEmployees = defaults.employees;
    const fallbackLedger = defaults.ledger;
    return {
      ...defaults,
      ...parsed,
      stock: hydrateStockItems(parsed.stock),
      employees: hydrateEmployees(parsed.employees, fallbackEmployees),
      customers: hydrateCustomers(parsed.customers, defaults.customers),
      settings: hydrateSettings(parsed.settings, defaults.settings),
      conversations: hydrateMessages(parsed.conversations ?? defaults.conversations),
      initialCapital: parsed.initialCapital ?? defaults.initialCapital,
      ledger: hydrateLedger(
        parsed.ledger?.some((entry) => entry.type === "Modal")
          ? parsed.ledger
          : [defaults.ledger[0], ...(parsed.ledger ?? defaults.ledger.slice(1))],
        fallbackLedger,
      ),
    };
  } catch {
    return defaults;
  }
};

export const saveLaundryData = (data: LaundryData) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useLaundryData = () => {
  const [data, setData] = useState<LaundryData>(() => getLaundryData());

  useEffect(() => {
    const sync = () => setData(getLaundryData());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (updater: (current: LaundryData) => LaundryData) => {
    const next = updater(getLaundryData());
    saveLaundryData(next);
    setData(next);
  };

  return { data, update };
};

const addAudit = (data: LaundryData, module: string, action: string, detail: string): AuditLog[] => [
  {
    id: makeId("LOG", data.audit),
    user: "kasir@gmail.com",
    module,
    action,
    detail,
    at: nowIso(),
  },
  ...data.audit,
];

export const getFinancialSummary = (data: LaundryData) => {
  const capital =
    data.ledger.filter((entry) => entry.type === "Modal").reduce((sum, entry) => sum + entry.amount, 0) ||
    data.initialCapital;
  const revenue = data.ledger
    .filter((entry) => entry.type === "Pendapatan")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = data.ledger
    .filter((entry) => entry.type === "Pembelian" || entry.type === "Gaji")
    .reduce((sum, entry) => sum + entry.amount, 0);
  return {
    capital,
    revenue,
    expenses,
    profit: revenue - expenses,
    cash: capital + revenue - expenses,
  };
};

export const getBookPeriod = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  if (date.getDate() >= 26) {
    start.setDate(26);
  } else {
    start.setMonth(start.getMonth() - 1, 26);
  }

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1, 25);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    label: `${start.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} - ${end.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`,
    key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
  };
};

export const getBookPeriodForEntry = (iso: string) => getBookPeriod(new Date(iso));

export const getLedgerInPeriod = (data: LaundryData, start: Date, end: Date) =>
  data.ledger.filter((entry) => {
    const at = new Date(entry.at).getTime();
    return at >= start.getTime() && at <= end.getTime();
  });

export const getBookkeepingSummary = (data: LaundryData, start: Date, end: Date) => {
  const entries = getLedgerInPeriod(data, start, end);
  const revenue = entries
    .filter((entry) => entry.type === "Pendapatan")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const qris = entries
    .filter((entry) => entry.type === "Pendapatan" && entry.method === "QRIS")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const cash = entries
    .filter((entry) => entry.type === "Pendapatan" && entry.method === "Tunai")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const card = entries
    .filter((entry) => entry.type === "Pendapatan" && entry.method === "Kartu")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const inventoryExpenses = entries
    .filter((entry) => entry.type === "Pembelian")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const payrollExpenses = entries
    .filter((entry) => entry.type === "Gaji")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expenses = inventoryExpenses + payrollExpenses;

  return {
    entries,
    revenue,
    qris,
    cash,
    card,
    inventoryExpenses,
    payrollExpenses,
    expenses,
    profit: revenue - expenses,
    periodBalance: revenue - expenses,
  };
};

export const getStockUsageText = (stockItem: StockItem) =>
  stockUsageRules[stockItem.id]?.label ?? "Tidak dipakai otomatis per order";

export const getEstimatedCapacity = (stockItem: StockItem) => {
  const rule = stockUsageRules[stockItem.id];
  if (!rule?.perKg) return null;
  return Math.floor(stockItem.qty / rule.perKg);
};

export const getDailyCapacityStatus = (data: LaundryData, date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const activeToday = data.orders.filter((order) => {
    const pickup = new Date(order.pickupAt ?? order.createdAt).getTime();
    return pickup >= start.getTime() && pickup < end.getTime() && order.status !== "Selesai";
  });
  const usedKg = activeToday.reduce((sum, order) => sum + order.weightKg, 0);
  return {
    capacityKg: data.settings.dailyCapacityKg,
    usedKg,
    remainingKg: Math.max(0, data.settings.dailyCapacityKg - usedKg),
    queueCount: activeToday.length,
  };
};

export const getAvailabilityPlan = (data: LaundryData, packageId: string, weightKg: number, pickupAt: string) => {
  const service = data.packages.find((item) => item.id === packageId);
  const pickupDate = pickupAt ? new Date(pickupAt) : new Date();
  const capacity = getDailyCapacityStatus(data, pickupDate);
  const canPickupToday = weightKg > 0 && weightKg <= capacity.remainingKg;
  const dueAt = new Date(pickupDate);
  dueAt.setHours(dueAt.getHours() + (service?.durationHours ?? 24));
  const alternativeDelivery = new Date(pickupDate);
  alternativeDelivery.setDate(alternativeDelivery.getDate() + 2);
  alternativeDelivery.setHours(17, 0, 0, 0);

  return {
    service,
    capacity,
    canPickupToday,
    dueAt: dueAt.toISOString(),
    alternativeDeliveryAt: alternativeDelivery.toISOString(),
    message: canPickupToday
      ? `Bisa diproses. Sisa kapasitas hari ini ${Math.max(0, capacity.remainingKg - weightKg)} kg.`
      : `Kapasitas hari ini tinggal ${capacity.remainingKg} kg dari ${capacity.capacityKg} kg. Pilih jadwal reguler atau pengantaran lusa.`,
  };
};

const roundStock = (value: number) => Math.round(value * 100) / 100;

const nextLedgerNumber = (entries: LedgerEntry[]) =>
  entries.reduce((max, entry) => {
    const value = Number(entry.id.replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0) + 1;

const deductOperationalStock = (stock: StockItem[], weightKg: number) =>
  stock.map((item) => {
    const rule = stockUsageRules[item.id];
    const used = (rule?.perKg ?? 0) * weightKg + (rule?.perOrder ?? 0);
    return used > 0 ? { ...item, qty: roundStock(Math.max(0, item.qty - used)) } : item;
  });

export const createOrder = (data: LaundryData, input: NewOrderInput): LaundryData => {
  const service = data.packages.find((item) => item.id === input.packageId);
  if (!service) {
    return data;
  }

  const dueAt = new Date(input.pickupAt);
  dueAt.setHours(dueAt.getHours() + service.durationHours);

  const order: Order = {
    id: makeId("ORD", data.orders),
    customer: input.customer.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    package: service.name,
    weightKg: input.weightKg,
    total: input.weightKg * service.pricePerKg,
    status: "Diterima",
    createdAt: nowIso(),
    dueAt: dueAt.toISOString(),
    paid: input.paid ?? false,
    pickupAt: input.pickupAt,
    deliveryAt: input.deliveryAt ?? dueAt.toISOString(),
    source: input.source ?? "Kasir",
    paymentMethod: input.paymentMethod,
    customerId: input.customerId,
    pickupLocation: input.pickupLocation,
  };
  const ledgerEntry: LedgerEntry | null = order.paid
    ? {
        id: makeId("LED", data.ledger),
        type: "Pendapatan",
        amount: order.total,
        detail: `Pembayaran ${order.id} via ${order.paymentMethod ?? "QRIS"}`,
        method: order.paymentMethod ?? "QRIS",
        at: nowIso(),
      }
    : null;

  return {
    ...data,
    orders: [order, ...data.orders],
    ledger: ledgerEntry ? [ledgerEntry, ...data.ledger] : data.ledger,
    stock: deductOperationalStock(data.stock, input.weightKg),
    audit: addAudit(data, "Order", "CREATE", `Order ${order.id} dibuat`),
  };
};

export const registerCustomer = (
  data: LaundryData,
  input: Omit<CustomerAccount, "id" | "createdAt">,
): LaundryData => {
  if (data.customers.some((customer) => customer.email.toLowerCase() === input.email.trim().toLowerCase())) {
    return data;
  }

  const customer: CustomerAccount = {
    ...input,
    id: makeId("CUS", data.customers),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    createdAt: nowIso(),
  };

  return {
    ...data,
    customers: [customer, ...data.customers],
    audit: addAudit(data, "Customer", "CREATE", `Customer baru registrasi: ${customer.name}`),
  };
};

export const updateCustomer = (data: LaundryData, customer: CustomerAccount): LaundryData => ({
  ...data,
  customers: data.customers.map((item) => (item.id === customer.id ? customer : item)),
  audit: addAudit(data, "Customer", "UPDATE", `Profil customer diubah: ${customer.name}`),
});

export const addCustomerMessage = (
  data: LaundryData,
  customerId: string,
  body: string,
  sender: CustomerMessage["sender"] = "Customer",
): LaundryData => ({
  ...data,
  conversations: [
    { id: makeId("MSG", data.conversations), customerId, sender, body: body.trim(), at: nowIso() },
    ...data.conversations,
  ],
});

export const updateEmployeeProfile = (
  data: LaundryData,
  role: "Admin" | "Kasir",
  input: { name: string; email: string; password?: string; avatar?: string },
): LaundryData => ({
  ...data,
  employees: data.employees.map((employee) =>
    employee.role === role
      ? { ...employee, name: input.name.trim(), email: input.email.trim().toLowerCase(), avatar: input.avatar }
      : employee,
  ),
  audit: addAudit(data, "Profil", "UPDATE", `Profil ${role} diubah oleh owner`),
});

export const upsertBankAccount = (data: LaundryData, input: Omit<BankAccount, "id"> & { id?: string }): LaundryData => {
  const existing = input.id ? data.settings.bankAccounts.find((item) => item.id === input.id) : undefined;
  const account: BankAccount = {
    id: existing?.id ?? makeId("BANK", data.settings.bankAccounts),
    bank: input.bank.trim(),
    accountNo: input.accountNo.trim(),
    accountName: input.accountName.trim(),
    active: input.active,
  };

  return {
    ...data,
    settings: {
      ...data.settings,
      bankAccounts: existing
        ? data.settings.bankAccounts.map((item) => (item.id === account.id ? account : item))
        : [account, ...data.settings.bankAccounts],
    },
    audit: addAudit(data, "Rekening", existing ? "UPDATE" : "CREATE", `Rekening ${account.bank} disimpan`),
  };
};

export const payOrder = (data: LaundryData, orderId: string, method: string): LaundryData => {
  const order = data.orders.find((item) => item.id === orderId);
  if (!order || order.paid) {
    return data;
  }

  const ledgerEntry: LedgerEntry = {
    id: makeId("LED", data.ledger),
    type: "Pendapatan",
    amount: order.total,
    detail: `Pembayaran ${order.id} via ${method}`,
    method: method as LedgerEntry["method"],
    at: nowIso(),
  };

  return {
    ...data,
    orders: data.orders.map((item) =>
      item.id === orderId ? { ...item, paid: true, status: item.status === "Diterima" ? "Dicuci" : item.status } : item,
    ),
    ledger: [ledgerEntry, ...data.ledger],
    audit: addAudit(data, "Pembayaran", "CREATE", `Pembayaran ${order.id} sebesar ${order.total}`),
  };
};

export const upsertEmployee = (data: LaundryData, input: EmployeeInput): LaundryData => {
  const existing = input.id ? data.employees.find((employee) => employee.id === input.id) : undefined;
  const employee: Employee = {
    id: existing?.id ?? makeId("EMP", data.employees),
    name: input.name.trim(),
    role: input.role,
    salary: input.salary,
    active: input.active,
  };

  return {
    ...data,
    employees: existing
      ? data.employees.map((item) => (item.id === existing.id ? employee : item))
      : [employee, ...data.employees],
    audit: addAudit(
      data,
      "Pembukuan",
      existing ? "UPDATE" : "CREATE",
      `${existing ? "Karyawan diubah" : "Karyawan ditambahkan"}: ${employee.name}`,
    ),
  };
};

export const deleteEmployee = (data: LaundryData, employeeId: string): LaundryData => {
  const employee = data.employees.find((item) => item.id === employeeId);

  if (!employee) {
    return data;
  }

  return {
    ...data,
    employees: data.employees.filter((item) => item.id !== employeeId),
    audit: addAudit(data, "Pembukuan", "DELETE", `Karyawan dihapus: ${employee.name}`),
  };
};

export const postMonthlyPayroll = (data: LaundryData, date = new Date()): LaundryData => {
  const period = getBookPeriod(date);
  const payrollAlreadyPosted = data.ledger.some((entry) => {
    const entryPeriod = getBookPeriodForEntry(entry.at);
    return entry.type === "Gaji" && entryPeriod.key === period.key;
  });

  if (payrollAlreadyPosted) {
    return data;
  }

  const activeEmployees = data.employees.filter((employee) => employee.active && employee.salary > 0);
  const payrollDate = new Date(period.end);
  const firstLedgerNumber = nextLedgerNumber(data.ledger);
  const payrollEntries = activeEmployees.map((employee, index): LedgerEntry => ({
    id: `LED-${String(firstLedgerNumber + index).padStart(4, "0")}`,
    type: "Gaji",
    amount: employee.salary,
    detail: `Gaji ${employee.role} - ${employee.name} (${period.label})`,
    employeeId: employee.id,
    at: payrollDate.toISOString(),
  }));

  return {
    ...data,
    ledger: [...payrollEntries, ...data.ledger],
    audit: addAudit(data, "Pembukuan", "CREATE", `Posting gaji ${period.label}`),
  };
};

export const addStockPurchase = (data: LaundryData, input: StockPurchaseInput): LaundryData => {
  const item = data.stock.find((stockItem) => stockItem.id === input.stockId);
  if (!item) {
    return data;
  }
  const { cash } = getFinancialSummary(data);
  if (input.cost > cash) {
    return data;
  }

  const ledgerEntry: LedgerEntry = {
    id: makeId("LED", data.ledger),
    type: "Pembelian",
    amount: input.cost,
    detail: `Pembelian ${item.name} dari ${input.supplier}`,
    at: nowIso(),
  };

  return {
    ...data,
    stock: data.stock.map((stockItem) =>
      stockItem.id === input.stockId ? { ...stockItem, qty: roundStock(stockItem.qty + input.qty) } : stockItem,
    ),
    ledger: [ledgerEntry, ...data.ledger],
    audit: addAudit(data, "Inventory", "UPDATE", `Stok ${item.name} +${input.qty} ${item.unit}`),
  };
};

export const upsertStockItem = (data: LaundryData, input: StockItemInput): LaundryData => {
  const existing = input.id ? data.stock.find((item) => item.id === input.id) : undefined;
  const stockItem: StockItem = {
    id: existing?.id ?? makeId("STK", data.stock),
    name: input.name.trim(),
    unit: input.unit.trim(),
    qty: roundStock(input.qty),
    minQty: input.minQty,
    purchasePrice: input.purchasePrice,
    supplier: input.supplier.trim(),
  };

  return {
    ...data,
    stock: existing
      ? data.stock.map((item) => (item.id === existing.id ? stockItem : item))
      : [stockItem, ...data.stock],
    audit: addAudit(
      data,
      "Inventory",
      existing ? "UPDATE" : "CREATE",
      `${existing ? "Item stok diubah" : "Item stok dibuat"}: ${stockItem.name}`,
    ),
  };
};

export const upsertPackage = (data: LaundryData, input: PackageInput): LaundryData => {
  const existing = input.id ? data.packages.find((item) => item.id === input.id) : undefined;
  const servicePackage: ServicePackage = {
    id: existing?.id ?? makeId("PKG", data.packages),
    name: input.name.trim(),
    pricePerKg: input.pricePerKg,
    durationHours: input.durationHours,
    description: input.description.trim(),
    active: input.active,
  };

  return {
    ...data,
    packages: existing
      ? data.packages.map((item) => (item.id === existing.id ? servicePackage : item))
      : [servicePackage, ...data.packages],
    audit: addAudit(
      data,
      "Paket",
      existing ? "UPDATE" : "CREATE",
      `${existing ? "Paket diubah" : "Paket dibuat"}: ${servicePackage.name}`,
    ),
  };
};

export const buildWhatsappUrl = (phone: string, message: string) => {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};
