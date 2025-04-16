import base from "../config/eslint/base.config.js";

export default [
	...base,
	{
		languageOptions: {
			globals: {
				require: "readonly",
				module: "readonly",
				__dirname: "readonly",
				process: "readonly",
			},
		},
		rules: {
			"@typescript-eslint/no-var-requires": "off",
		},
	},
];
