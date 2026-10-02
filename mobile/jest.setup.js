// Jest runs without native modules: use the official in-memory AsyncStorage mock.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Reanimated, its worklets runtime and Gesture Handler ship official mocks
// for Jest (no native UI thread here).
jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
require("react-native-gesture-handler/jestSetup");
