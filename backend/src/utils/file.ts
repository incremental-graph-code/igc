import path from 'path';

// Utils to handle file paths safely
export const safeJoin = (base: string, target: string) => {
	const targetPath = "." + path.normalize("/" + target);
	return path.join(base, targetPath);
};