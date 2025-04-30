import base from "../config/jest/base.js";
import { pathsToModuleNameMapper } from "ts-jest";
import tsconfig from "./tsconfig.json" assert { type: "json" };

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	...base,
	rootDir: ".",
	testEnvironment: "jsdom",
	moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
		prefix: "<rootDir>/",
	}),
};
