import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },

  { languageOptions: {  globals: {
    process: "readonly",
    module: "readonly"
  } }}, 
  ...tseslint.configs.recommended,    
  pluginReact.configs.recommended,  
  {
    rules: {
      "no-unused-vars": "warn",  // Warning for unused variables
      "@typescript-eslint/no-unused-vars": "warn",  // for TypeScript
      "@typescript-eslint/no-console": "warn",  // התעלם מאזהרות על console.log
      "no-console": "off",  
     
    }
  }
];