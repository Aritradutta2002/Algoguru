import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next", "dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-useless-escape": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-empty": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/components/**/*.{ts,tsx}",
    ],
    ignores: [
      "src/components/ui/**",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message: "Use the shared Button primitive from @/components/ui.",
        },
        {
          selector: "JSXOpeningElement[name.name='input']",
          message: "Use the shared Input primitive from @/components/ui.",
        },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: "Use the shared Select primitive from @/components/ui.",
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: "Use the shared Textarea primitive from @/components/ui.",
        },
        {
          selector: "JSXOpeningElement[name.name='dialog']",
          message: "Use the shared Dialog primitive from @/components/ui.",
        },
      ],
    },
  },
);
