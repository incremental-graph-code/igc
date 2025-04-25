import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

// Utils to handle file paths safely
export const safeJoin = (base: string, target: string) => {
	const targetPath = "." + path.normalize("/" + target);
	return path.join(base, targetPath);
};

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const getSubDirectories = async (dirPath: string): Promise<string[]> => {
	try {
		const entries = await fs.readdir(dirPath, { withFileTypes: true });

		// Filter to directories, then pluck out the name
		return entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
	} catch (err) {
		console.error("Error reading the directory:", err);
		return [];
	}
};
