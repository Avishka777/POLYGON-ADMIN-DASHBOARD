export type EnvironmentKey = 'dev' | 'uat' | 'local';

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface EnvironmentUrls {
  collectorApiUrl: string;
  transporterApiUrl: string;
}

export interface OfficerEnvironmentConfig {
  name: string;
  key: EnvironmentKey;
  db: DbConfig;
  urls: EnvironmentUrls;
}

export const ENVIRONMENTS: Record<EnvironmentKey, OfficerEnvironmentConfig> = {
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
    urls: {
      collectorApiUrl: 'https://collector-api.polygonagro.com/agro-api/collection-api',
      transporterApiUrl: 'https://transporter-mobile-api.vercel.app/transporter',
    },
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
    urls: {
      collectorApiUrl: 'https://collector-mobile-app-api-uat.vercel.app/agro-api/collection-api',
      transporterApiUrl: 'https://transporter-mobile-api-uat.vercel.app/transporter',
    },
  },
  local: {
    name: 'Local / Custom',
    key: 'local',
    db: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'collection_officer',
    },
    urls: {
      collectorApiUrl: 'http://localhost:3000/agro-api/collection-api',
      transporterApiUrl: 'http://localhost:3001/transporter',
    },
  },
};

export interface OfficerRecord {
  id: number;
  empId: string | null;
  firstNameEnglish: string | null;
  lastNameEnglish: string | null;
  jobRole: string | null;
  email: string | null;
  phoneNumber01: string | null;
  status: string | null;
  passwordUpdated: number | null;
  onlineStatus: number | null;
  createdAt: string | null;
}
