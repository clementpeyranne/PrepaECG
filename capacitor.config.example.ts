const config = {
  appId: "fr.prepaecg.app",
  appName: "Prepa ECG OS",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    url: "https://prepa-ecg.vercel.app",
    cleartext: false
  },
  ios: {
    contentInset: "automatic"
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
