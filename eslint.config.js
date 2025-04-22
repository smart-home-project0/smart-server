import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: globals.browser },
  rules: {
    "no-unused-vars": "warn" 
  },
  settings: {
    react: {
      version: "17"  // ציין את גרסת React שבה אתה משתמש
    }
  }
},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
];