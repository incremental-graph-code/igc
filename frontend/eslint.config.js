import base from "../config/eslint/base.config.js";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import eslintParserTypeScript from "@typescript-eslint/parser";
import eslintPluginReadableTailwind from "eslint-plugin-readable-tailwind";

export default [
	...base,
	{
		files: ["**/*.{ts,tsx,cts,mts}"],
		languageOptions: {
			parser: eslintParserTypeScript,
			parserOptions: {
				project: true,
			},
		},
	},
	{
		files: ["**/*.{jsx,tsx}"],
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			"readable-tailwind": eslintPluginReadableTailwind,
		},
		rules: {
			"readable-tailwind/multiline": ["warn", { printWidth: 100 }],
		},
	},
	{
		files: ["**/*.tsx"],
		plugins: {
			react,
			"react-hooks": hooks,
		},
		rules: {
			"react/react-in-jsx-scope": "off",
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
			"no-restricted-imports": [
				"error",
				{
					paths: [
						{
							name: "shared/server",
							message:
								"Do not import server-only code into frontend. Use 'shared' or 'shared/common' instead.",
						},
					],
				},
			],
		},
	},
];
