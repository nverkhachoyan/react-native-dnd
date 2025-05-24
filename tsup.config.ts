import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.{ts,tsx}"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "es2020",
  minify: false,
  bundle: false,
  external: [
    "react",
    "react-native",
    "react-native-gesture-handler",
    "react-native-reanimated",
  ],
  esbuildOptions(options) {
    options.jsx = "preserve";
    options.platform = "neutral";
    options.keepNames = true;
    options.conditions = ["react-native"];
    options.minify = false;
    options.define = {
      __DEV__: "true",
    };
  },

  onSuccess: async () => {
    console.log("Build completed with preserved module structure");
  },
});
