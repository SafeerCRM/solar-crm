import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solarcrm.app',
  appName: 'Solar CRM',
  webDir: 'out',
  server: {
    url: 'https://solar-crm-frontend.vercel.app',
    cleartext: false,
  },
};

export default config;