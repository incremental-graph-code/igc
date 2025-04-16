import base from "../config/jest/base.js";

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
	...base,
	rootDir: "./",
	testEnvironment: "jsdom",
};
