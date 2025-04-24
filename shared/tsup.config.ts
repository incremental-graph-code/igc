import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	outDir: "dist",
	format: ["esm"],
	target: "node22",
	dts: true,
	splitting: false,
	clean: true,
});
