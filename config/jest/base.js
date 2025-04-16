/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	testEnvironment: "node",
    passWithNoTests: true,
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				useESM: true,
				tsconfig: "tsconfig.json",
			},
		],
	},

	extensionsToTreatAsEsm: [".ts", ".tsx"],
	moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],

	testMatch: ["**/__tests__/**/*.test.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],

	testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
