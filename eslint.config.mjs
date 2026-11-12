// eslint.config.mjs — configuración plana (ESLint 9+ / 10).
//
// Antes `pnpm lint` no arrancaba: ESLint 10 exige `eslint.config.*` y el repo
// no tenía ninguno. Esta configuración devuelve el linter a la puerta de
// calidad: sin ella, un `role_id === 2` volvería a colarse sin que nadie lo
// viera (pasó con la pestaña «Admin»).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "graphify-out/**",
      "public/**",
      "next-env.d.ts",
      "*.tsbuildinfo",
      // El harness (rsc) y sus copias de seguridad no son código de la app.
      ".rsc/**",
      ".opencode/**",
      ".superpowers/**",
    ],
  },
  js.configs.recommended,
  {
    // La app corre en navegador y en servidor (Next): los globales de ambos.
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // Las reglas de TypeScript solo aplican a los archivos de TypeScript:
    // los scripts .cjs/.mjs del repo son JavaScript común.
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [...tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      // El repo usa `any` a propósito en varios puntos (mapas de PocketBase,
      // props de Radix). Se marca como aviso, no como error.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      // Reglas nuevas de react-hooks v7: son muy opinadas y en este repo
      // disparan sobre patrones correctos, así que quedan como aviso.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    // Ruido estilístico heredado que no aporta: se apaga para que la puerta
    // muestre lo que importa en lugar de ruido.
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-control-regex": "off",
      "no-useless-escape": "off",
      "no-useless-assignment": "off",
      "preserve-caught-error": "off",
    },
  },
  {
    // Los scripts de consola son CommonJS y usan require/process.
    files: ["scripts/**/*.{js,cjs,mjs,ts}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
