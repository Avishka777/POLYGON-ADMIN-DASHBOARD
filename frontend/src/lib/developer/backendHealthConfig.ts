export interface EnvironmentConfig {
  name: 'DEV' | 'UAT' | 'PROD';
  baseUrl: string;
  healthUrl: string;
}

export interface ProjectHealthConfig {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  environments: EnvironmentConfig[];
}

export function buildHealthUrl(baseUrl: string): string {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  return `${clean}/health`;
}

export const POLYGON_PROJECTS: ProjectHealthConfig[] = [
  {
    id: 'polygon',
    name: 'Polygon Mobile',
    subtitle: 'Core Polygon Ecosystem Mobile App',
    icon: '/app-icons/polygon.ico',
    environments: [
      {
        name: 'DEV',
        baseUrl: 'https://dev-mob-api.polygon.lk/polygon/',
        healthUrl: buildHealthUrl('https://dev-mob-api.polygon.lk/polygon/'),
      },
      {
        name: 'UAT',
        baseUrl: 'https://uat-mob-api.polygon.lk/polygon/',
        healthUrl: buildHealthUrl('https://uat-mob-api.polygon.lk/polygon/'),
      },
      {
        name: 'PROD',
        baseUrl: 'https://mob-api.polygon.lk/polygon/',
        healthUrl: buildHealthUrl('https://mob-api.polygon.lk/polygon/'),
      },
    ],
  },
  {
    id: 'codi-net',
    name: 'Codi Net',
    subtitle: 'Collector & Weighing Operations Mobile App',
    icon: '/app-icons/codi-net.ico',
    environments: [
      {
        name: 'DEV',
        baseUrl: 'https://collector-api.polygonagro.com/agro-api/collection-api/',
        healthUrl: buildHealthUrl('https://collector-api.polygonagro.com/agro-api/collection-api/'),
      },
      {
        name: 'UAT',
        baseUrl: 'https://collector-mobile-app-api-uat.vercel.app/agro-api/collection-api/',
        healthUrl: buildHealthUrl('https://collector-mobile-app-api-uat.vercel.app/agro-api/collection-api/'),
      },
      {
        name: 'PROD',
        baseUrl: 'https://collector-api-prod.polygonagro.com/agro-api/collection-api/',
        healthUrl: buildHealthUrl('https://collector-api-prod.polygonagro.com/agro-api/collection-api/'),
      },
    ],
  },
  {
    id: 'govi-care',
    name: 'Govi Care',
    subtitle: 'Plant Care, Crop Health & Agro Diagnostic App',
    icon: '/app-icons/govi-care.ico',
    environments: [
      {
        name: 'DEV',
        baseUrl: 'https://plantcare-api.polygonagro.com/',
        healthUrl: buildHealthUrl('https://plantcare-api.polygonagro.com/'),
      },
      {
        name: 'UAT',
        baseUrl: 'https://plant-care-api-uat.vercel.app/',
        healthUrl: buildHealthUrl('https://plant-care-api-uat.vercel.app/'),
      },
      {
        name: 'PROD',
        baseUrl: 'https://polygonagro.com/plantcare-api/',
        healthUrl: buildHealthUrl('https://polygonagro.com/plantcare-api/'),
      },
    ],
  },
  {
    id: 'govi-link',
    name: 'Govi Link',
    subtitle: 'Farmer & Marketplace Networking App',
    icon: '/app-icons/govi-link.ico',
    environments: [
      {
        name: 'DEV',
        baseUrl: 'https://govi-link-back-dev-api.vercel.app/govilink/',
        healthUrl: buildHealthUrl('https://govi-link-back-dev-api.vercel.app/govilink/'),
      },
      {
        name: 'UAT',
        baseUrl: 'https://govi-link-api-uat.vercel.app/govilink/',
        healthUrl: buildHealthUrl('https://govi-link-api-uat.vercel.app/govilink/'),
      },
      {
        name: 'PROD',
        baseUrl: 'https://govi-link-back-prod-api.vercel.app/govilink/',
        healthUrl: buildHealthUrl('https://govi-link-back-prod-api.vercel.app/govilink/'),
      },
    ],
  },
  {
    id: 'sales-dash',
    name: 'Sales Dash',
    subtitle: 'Field Sales & Distribution Metrics App',
    icon: '/app-icons/sales-dash.ico',
    environments: [
      {
        name: 'DEV',
        baseUrl: 'https://dev.polygonagro.com/dash-api/agro-api/salesdash/',
        healthUrl: buildHealthUrl('https://dev.polygonagro.com/dash-api/agro-api/salesdash/'),
      },
      {
        name: 'UAT',
        baseUrl: 'https://sales-dash-mobile-api-uat.vercel.app/agro-api/salesdash/',
        healthUrl: buildHealthUrl('https://sales-dash-mobile-api-uat.vercel.app/agro-api/salesdash/'),
      },
      {
        name: 'PROD',
        baseUrl: 'https://polygonagro.com/dash-api/agro-api/salesdash/',
        healthUrl: buildHealthUrl('https://polygonagro.com/dash-api/agro-api/salesdash/'),
      },
    ],
  },
  {
    id: 'govi-trans',
    name: 'Govi Trans',
    subtitle: 'Agro Logistics & Transporter Management App',
    icon: '/app-icons/govi-trans.ico',
    environments: [
      {
        name: 'DEV',
        baseUrl: 'https://transporter-mobile-api.vercel.app/transporter/',
        healthUrl: buildHealthUrl('https://transporter-mobile-api.vercel.app/transporter/'),
      },
      {
        name: 'UAT',
        baseUrl: 'https://transporter-mobile-api-uat.vercel.app/transporter/',
        healthUrl: buildHealthUrl('https://transporter-mobile-api-uat.vercel.app/transporter/'),
      },
      {
        name: 'PROD',
        baseUrl: 'https://transporter-mobile-api-prod.vercel.app/transporter/',
        healthUrl: buildHealthUrl('https://transporter-mobile-api-prod.vercel.app/transporter/'),
      },
    ],
  },
];
