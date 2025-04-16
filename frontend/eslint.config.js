import base from "../config/eslint/base.config.js";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";

export default [
	...base,
	{
		files: ["**/*.tsx"],
		plugins: { react, "react-hooks": hooks },
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
