import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solarcrm.customer',
  appName: 'Aditya Solars Customer',
  webDir: 'out',
  server: {
    url: 'https://solar-crm-frontend.vercel.app/customer-login',
    cleartext: false,
  },
};

export default config;