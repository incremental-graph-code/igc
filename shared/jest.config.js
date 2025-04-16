import base from "../config/jest/base.js";

/** @type {import('jest').Config} */
export default {
	...base,
	testEnvironment: "node",
	rootDir: "./",
};
