import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	outDir: "dist",
	format: ["esm"],
	target: "node22",
	dts: false,
	splitting: false,
	clean: true,
});
