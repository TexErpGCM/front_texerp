import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.texerp.app',
  appName: 'TexERP',
  webDir: 'dist/texerp-front/browser',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' },
};

export default config;
