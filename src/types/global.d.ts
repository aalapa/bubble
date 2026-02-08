// Type declarations for polyfills loaded in index.js

// react-native-get-random-values provides crypto.getRandomValues
declare const crypto: {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
};
