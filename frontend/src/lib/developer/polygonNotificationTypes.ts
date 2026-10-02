export type PolygonEnvironmentKey = 'dev' | 'uat' | 'local' | 'prod';

export interface PolygonDbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface PolygonEnvironmentConfig {
  name: string;
  key: PolygonEnvironmentKey;
  db: PolygonDbConfig;
  polygonApiUrl: string;
}

export const POLYGON_ENVIRONMENTS: Record<PolygonEnvironmentKey, PolygonEnvironmentConfig> = {
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
    polygonApiUrl: 'https://dev-mob-api.polygon.lk/polygon',
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
    polygonApiUrl: 'https://dev-mob-api.polygon.lk/polygon',
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
    polygonApiUrl: 'http://localhost:3000/polygon',
  },
  prod: {
    name: 'Production (PROD)',
    key: 'prod',
    db: {
      host: 'roundhouse.proxy.rlwy.net',
      port: 18145,
      user: 'root',
      password: 'MKxrIMKqohKipRYMLDyKeQRYsjZwVItZ',
      database: 'collection_officer',
    },
    polygonApiUrl: 'https://mob-api.polygon.lk/polygon',
  },
};

export interface MarketplaceUserRecord {
  id: number;
  cusId: string | null;
  salesAgent: string | null;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneCode: string | null;
  phoneNumber: string | null;
  email: string | null;
  buyerType: string | null;
  companyName: string | null;
  creditBalance: string | number | null;
  creditLimit: string | number | null;
  nearesCity: string | null;
  isActive: number | null;
  isMarketPlaceUser: number | null;
  created_at: string | null;
  latestProcessOrderId?: number | null;
  latestInvNo?: string | null;
}

export type PolygonEventType =
  | 'order_confirmed'
  | 'order_picked_up'
  | 'order_collected_driver'
  | 'order_on_the_way'
  | 'order_delivered'
  | 'order_on_hold'
  | 'order_returned'
  | 'order_cancelled'
  | 'package_review'
  | 'thin_event_trigger'
  | 'catalog_updated'
  | 'custom';

export interface TriggerPolygonNotificationPayload {
  userId?: number | null;
  orderId?: number | null;
  title: string;
  message: string;
  eventType: PolygonEventType | string;
  isThinEvent?: boolean;
  data?: Record<string, any>;
}

export interface PolygonNotificationPreset {
  id: PolygonEventType;
  label: string;
  title: string;
  message: string;
  sourceApp: string;
  sampleOrderId: number;
  sampleData: Record<string, any>;
  icon: string;
  badgeColor: string;
  isThinEvent?: boolean;
  isCatalogEvent?: boolean;
}

export const POLYGON_NOTIFICATION_PRESETS: PolygonNotificationPreset[] = [
  {
    id: 'thin_event_trigger',
    label: 'Thin Event Signal (Socket Trigger)',
    sourceApp: 'Admin / Microservice',
    title: 'New Notification Signal',
    message: 'Minimal lightweight event trigger emitted to room user_{userId}. Updates badge immediately and triggers DB fetch.',
    sampleOrderId: 4277,
    sampleData: {
      isThinEvent: true,
      hint: 'Client receives { id, unreadCount } and queries /polygon/api/notification for full verified records.',
    },
    icon: 'Radio',
    badgeColor: 'amber',
    isThinEvent: true,
  },
  {
    id: 'order_confirmed',
    label: 'Order Confirmed',
    sourceApp: 'Admin Panel',
    title: 'Order Confirmed',
    message: 'Your order #2610020003 has been confirmed and is being processed by our team.',
    sampleOrderId: 4277,
    sampleData: {
      invNo: '2610020003',
      orderStatus: 'Confirmed',
      amount: 1000,
    },
    icon: 'CheckCircle2',
    badgeColor: 'emerald',
  },
  {
    id: 'order_collected_driver',
    label: 'Collected by Driver',
    sourceApp: 'Govi Transport',
    title: 'Order Collected by Driver',
    message: 'Your order #2610020003 has been collected by our driver.',
    sampleOrderId: 4277,
    sampleData: {
      invNo: '2610020003',
      orderStatus: 'Collected',
      driverName: 'Saman Kumara',
      vehicleNo: 'CAB-9921',
    },
    icon: 'Truck',
    badgeColor: 'indigo',
  },
  {
    id: 'order_on_the_way',
    label: 'Order on the Way',
    sourceApp: 'Govi Transport',
    title: 'Order is On the Way',
    message: 'Your order #2610020003 is on its way to you. Our driver will deliver your order shortly.',
    sampleOrderId: 4277,
    sampleData: {
      invNo: '2610020003',
      orderStatus: 'On the Way',
      estimatedDelivery: '30-45 minutes',
    },
    icon: 'Truck',
    badgeColor: 'blue',
  },
  {
    id: 'order_delivered',
    label: 'Order Delivered',
    sourceApp: 'Govi Transport',
    title: 'Order Delivered',
    message: 'Your order #2610020003 has been successfully delivered. Thank you for shopping with Polygon GoviMart!',
    sampleOrderId: 4277,
    sampleData: {
      invNo: '2610020003',
      orderStatus: 'Delivered',
      deliveredAt: new Date().toISOString(),
    },
    icon: 'CheckCircle2',
    badgeColor: 'emerald',
  },
  {
    id: 'order_on_hold',
    label: 'Order On Hold',
    sourceApp: 'Govi Transport / Dispatch',
    title: 'Order On Hold',
    message: 'Your order #2610020003 is currently on hold. Reason : “Customer didn’t answer the call.”',
    sampleOrderId: 4277,
    sampleData: {
      invNo: '2610020003',
      orderStatus: 'On Hold',
      reason: "Customer didn't answer the call.",
    },
    icon: 'AlertTriangle',
    badgeColor: 'amber',
  },
  {
    id: 'order_returned',
    label: 'Order Returned',
    sourceApp: 'Govi Transport',
    title: 'Order Returned',
    message: 'Your order #2610020003 has been returned to hub. Reason : “Customer requested rescheduling.”',
    sampleOrderId: 4277,
    sampleData: {
      invNo: '2610020003',
      orderStatus: 'Returned',
      reason: 'Customer requested rescheduling.',
    },
    icon: 'RefreshCw',
    badgeColor: 'rose',
  },
  {
    id: 'package_review',
    label: 'Package Finalization Review',
    sourceApp: 'Admin Panel / Operations',
    title: 'Package Finalization Review',
    message: 'Your package review confirmation is pending. Please verify and confirm package contents in your GoviMart app.',
    sampleOrderId: 4277,
    sampleData: {
      invNo: '2610020003',
      reviewStatus: 'Pending Confirmation',
      expiryHours: 24,
    },
    icon: 'Sparkles',
    badgeColor: 'purple',
  },
  {
    id: 'catalog_updated',
    label: 'Catalog & Package Broadcast',
    sourceApp: 'Admin Panel Catalog Manager',
    title: 'Catalog Items & Packages Updated',
    message: 'New products and package bundles refreshed. Socket broadcast dispatched to all active mobile clients.',
    sampleOrderId: 4277,
    sampleData: {
      action: 'catalog_sync',
      packageId: 326,
    },
    icon: 'Radio',
    badgeColor: 'cyan',
    isCatalogEvent: true,
  },
  {
    id: 'custom',
    label: 'Developer Custom Signal',
    sourceApp: 'Admin Console Developer Hub',
    title: 'Polygon Developer Test Broadcast',
    message: 'Real-time test notification sent directly via Polygon Developer Hub.',
    sampleOrderId: 4277,
    sampleData: {
      debugMode: true,
      sender: 'Polygon Admin Developer Console',
      timestamp: new Date().toISOString(),
    },
    icon: 'Sliders',
    badgeColor: 'slate',
  },
];
