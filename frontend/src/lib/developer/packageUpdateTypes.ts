export type PackageUpdateEnvironmentKey = 'dev' | 'uat' | 'local' | 'prod';

export interface PackageDbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface PackageEnvironmentConfig {
  name: string;
  key: PackageUpdateEnvironmentKey;
  db: PackageDbConfig;
  salesDashApiUrl: string;
  polygonApiUrl: string;
}

export const PACKAGE_ENVIRONMENTS: Record<PackageUpdateEnvironmentKey, PackageEnvironmentConfig> = {
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
    salesDashApiUrl: 'https://sales-dash-mobile-api-uat.vercel.app/agro-api/salesdash',
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
    salesDashApiUrl: 'http://localhost:3000/agro-api/salesdash',
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
    salesDashApiUrl: 'https://polygonagro.com/dash-api/agro-api/salesdash',
    polygonApiUrl: 'https://mob-api.polygon.lk/polygon',
  },
};

export interface MarketplacePackageRecord {
  id: number;
  displayName: string | null;
  status: string | null;
  isValid: number | null;
  productPrice: string | number | null;
  packageType: string | null;
  description: string | null;
  createdAt: string | null;
}

export type PackageActionType = 'create' | 'update' | 'delete' | 'status_change';

export interface PackageActionPreset {
  id: PackageActionType;
  label: string;
  action: PackageActionType;
  description: string;
  samplePackageId: number;
  sampleExtra: Record<string, any>;
  icon: string;
  color: string;
}

export const PACKAGE_ACTION_PRESETS: PackageActionPreset[] = [
  {
    id: 'update',
    label: 'Update Package',
    action: 'update',
    description: 'Triggered when Admin edits package price, name, or items',
    samplePackageId: 327,
    sampleExtra: {
      displayName: 'Fruit Package (Updated)',
      productPrice: 1200,
      reason: 'Admin price adjustment',
    },
    icon: 'Edit3',
    color: 'amber',
  },
  {
    id: 'status_change',
    label: 'Status Change',
    action: 'status_change',
    description: 'Triggered when Admin toggles package Enabled / Disabled',
    samplePackageId: 327,
    sampleExtra: {
      status: 'Disabled',
      reason: 'Seasonal crop ended',
    },
    icon: 'ToggleLeft',
    color: 'indigo',
  },
  {
    id: 'create',
    label: 'Create Package',
    action: 'create',
    description: 'Triggered when a brand new package is published in Admin',
    samplePackageId: 328,
    sampleExtra: {
      displayName: 'Organic Vegetable Combo',
      productPrice: 2500,
      packageType: 'Consumer Pack',
    },
    icon: 'PackagePlus',
    color: 'emerald',
  },
  {
    id: 'delete',
    label: 'Delete Package',
    action: 'delete',
    description: 'Triggered when a package is removed from marketplace',
    samplePackageId: 327,
    sampleExtra: {
      deletedBy: 'Admin Superuser',
    },
    icon: 'Trash2',
    color: 'rose',
  },
];
