import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";

export default defineConfig({
	plugins: [react()],
    envDir: "../",
	base: "./",
	build: {
		outDir: "dist",
		assetsDir: "assets",
		sourcemap: true,
	},
	server: {
		port: 5174,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@components": path.resolve(__dirname, "./src/components"),
		},
	},
});
