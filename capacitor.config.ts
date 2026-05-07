import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.recyclesolution.driver',
  appName: 'Recycle Solution',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a3d2e',
      showSpinner: false,
    },
    Geolocation: {
      // Background tracking handled in AndroidManifest
    },
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
