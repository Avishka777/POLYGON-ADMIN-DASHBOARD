export type SalesDashEnvironmentKey = 'dev' | 'uat' | 'local';

export interface SalesDashDbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface SalesDashEnvironmentConfig {
  name: string;
  key: SalesDashEnvironmentKey;
  db: SalesDashDbConfig;
  salesDashApiUrl: string;
}

export const SALES_DASH_ENVIRONMENTS: Record<SalesDashEnvironmentKey, SalesDashEnvironmentConfig> = {
  dev: {
    name: 'Development (DEV)',
    key: 'dev',
    db: {
      host: 'centerbeam.proxy.rlwy.net',
      port: 54310,
      user: 'root',
      password: 'cJQXColhqcMgBKWoyOTOlVsEIdhfKEta',
      database: 'collection_officer',
    },
    salesDashApiUrl: 'https://dev.polygonagro.com/dash-api/agro-api/salesdash',
  },
  uat: {
    name: 'User Acceptance Testing (UAT)',
    key: 'uat',
    db: {
      host: 'roundhouse.proxy.rlwy.net',
      port: 18145,
      user: 'root',
      password: 'MKxrIMKqohKipRYMLDyKeQRYsjZwVItZ',
      database: 'collection_officer',
    },
    salesDashApiUrl: 'https://sales-dash-mobile-api-uat.vercel.app/agro-api/salesdash',
  },
  local: {
    name: 'Local / Custom',
    key: 'local',
    db: {
      host: 'centerbeam.proxy.rlwy.net',
      port: 54310,
      user: 'root',
      password: 'cJQXColhqcMgBKWoyOTOlVsEIdhfKEta',
      database: 'collection_officer',
    },
    salesDashApiUrl: 'http://localhost:3000/agro-api/salesdash',
  },
};

export interface SalesAgentRecord {
  id: number;
  empId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber1: string | null;
  status: string | null;
  createdAt: string | null;
}

export type SalesDashEventType =
  | 'order_placed'
  | 'order_dispatched'
  | 'order_delivered'
  | 'payment_completed'
  | 'order_cancelled'
  | 'payment_reminder'
  | 'custom';

export interface TriggerNotificationPayload {
  orderId?: number | null;
  salesAgentId?: number | null;
  title: string;
  message: string;
  eventType: SalesDashEventType | string;
  data?: Record<string, any>;
}

export interface NotificationPreset {
  id: SalesDashEventType;
  label: string;
  title: string;
  message: string;
  sampleOrderId: number;
  sampleData: Record<string, any>;
  icon: string;
  badgeColor: string;
  sourceApp: string;
}

export const NOTIFICATION_PRESETS: NotificationPreset[] = [
  {
    id: 'order_placed',
    label: 'Order Placed',
    sourceApp: 'Polygon (GoviMart)',
    title: 'New Customer Order Placed',
    message: 'Order #INV-2026-098 for John Silva (Rs. 4,500)',
    sampleOrderId: 1420,
    sampleData: {
      invNo: 'INV-2026-098',
      customerName: 'John Silva',
      total: 4500,
      itemCount: 4,
    },
    icon: 'PackagePlus',
    badgeColor: 'emerald',
  },
  {
    id: 'order_dispatched',
    label: 'Order Dispatched',
    sourceApp: 'Admin Panel / Dispatch',
    title: 'Order Dispatched from Hub',
    message: 'Order #INV-2026-098 has been dispatched for delivery',
    sampleOrderId: 1420,
    sampleData: {
      invNo: 'INV-2026-098',
      dispatchCenter: 'Central Logistics Hub A',
      vehicleNo: 'WP-CAD-8812',
    },
    icon: 'Truck',
    badgeColor: 'indigo',
  },
  {
    id: 'order_delivered',
    label: 'Order Delivered',
    sourceApp: 'Govi Transport',
    title: 'Order Successfully Delivered',
    message: 'Order #INV-2026-098 for John Silva delivered by DRV00001',
    sampleOrderId: 1420,
    sampleData: {
      invNo: 'INV-2026-098',
      customerName: 'John Silva',
      driverEmpId: 'DRV00001',
      deliveredAt: new Date().toISOString(),
    },
    icon: 'CheckCircle2',
    badgeColor: 'blue',
  },
  {
    id: 'payment_completed',
    label: 'Payment Completed',
    sourceApp: 'GoviMart / PayHere',
    title: 'Payment Confirmed',
    message: 'Payment of Rs. 4,500 verified for Order #INV-2026-098',
    sampleOrderId: 1420,
    sampleData: {
      invNo: 'INV-2026-098',
      amount: 4500,
      paymentMethod: 'PayHere Online',
    },
    icon: 'CreditCard',
    badgeColor: 'purple',
  },
  {
    id: 'order_cancelled',
    label: 'Order Cancelled',
    sourceApp: 'Admin Panel / GoviMart',
    title: 'Order Cancelled / Rejected',
    message: 'Order #INV-2026-098 has been cancelled by customer',
    sampleOrderId: 1420,
    sampleData: {
      invNo: 'INV-2026-098',
      reason: 'Out of stock at supplier',
    },
    icon: 'AlertTriangle',
    badgeColor: 'rose',
  },
  {
    id: 'payment_reminder',
    label: 'Payment Reminder',
    sourceApp: 'Cron Job / Admin',
    title: 'Credit Payment Due Reminder',
    message: 'Customer John Silva has an outstanding balance of Rs. 12,800',
    sampleOrderId: 1420,
    sampleData: {
      customerName: 'John Silva',
      outstandingAmount: 12800,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    },
    icon: 'BellRing',
    badgeColor: 'amber',
  },
  {
    id: 'custom',
    label: 'Custom Event',
    sourceApp: 'Developer Testing',
    title: 'Developer Test Broadcast',
    message: 'Real-time test notification sent via Developer Console',
    sampleOrderId: 1420,
    sampleData: {
      debugMode: true,
      sender: 'Admin Console Developer Hub',
    },
    icon: 'Sparkles',
    badgeColor: 'slate',
  },
];
