export {};

declare global {
	interface Window {
		electron: {
			selectDirectory: () => Promise<string[]>;
		};
	}
}
