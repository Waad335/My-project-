// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

const jestGlobals = Object.fromEntries(
  ["jest", "describe", "it", "test", "expect", "beforeEach", "afterEach", "beforeAll", "afterAll"].map((name) => [name, "readonly"])
);

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    // Icons come from src/components/icons.ts (one module per icon), so the
    // bundle doesn't carry the whole icon set. Type imports are fine.
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react-native",
              message: "Import icons from @/components/icons.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["__tests__/**", "jest.setup.js"],
    languageOptions: { globals: jestGlobals },
  },
]);
