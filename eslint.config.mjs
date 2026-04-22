import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import globals from "globals";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "no-unused-vars": "off",  // Disable unused variable warnings
      "react/prop-types": "off" // Disable prop-types warnings in React
    }
  }
];