import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	prettier,
	{
		languageOptions: {
			ecmaVersion: 2024,
			sourceType: "module",
			parser: tseslint.parser,
		},
		files: ["**/*.ts", "**/*.tsx"],
		rules: {
			// Optional overrides
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "warn",
		},
	},
	{
		ignores: ["dist/", "node_modules/", "docs/"],
	},
];
