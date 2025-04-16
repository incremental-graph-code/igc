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
		},
	},
	{
		ignores: ["dist/", "node_modules/"],
	},
];
