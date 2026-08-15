import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // অ্যাপ আইডি — Play Store এ পাবলিশ করার আগে চাইলে বদলাতে পারো,
  // কিন্তু একবার পাবলিশ হলে এটা আর বদলানো যাবে না।
  appId: 'com.vhs.attendance',
  appName: 'ভোলাচং উচ্চ বিদ্যালয়',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    // WebView-তে <input type="file"> দিয়ে ক্যামেরা/গ্যালারি থেকে ছবি
    // আপলোড মসৃণভাবে কাজ করার জন্য এটা জরুরি
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#059669',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#059669',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
