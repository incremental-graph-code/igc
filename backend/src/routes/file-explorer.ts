import { Mutex } from "async-mutex";
import { Router, Request, Response } from "express";
import fs from "fs-extra";
import path from "path";
import {
	FileNode,
	Cache,
	CacheEntry,
	ModuleConfigurationData,
	IGCFileSessionData,
	SessionConfig,
	IGCSession,
	IGCCodeNodeExecution,
	SessionDataDeleteExecutionRequest,
	FileNodeType,
} from "shared";
import { createCustomLogger } from "shared/server";
import { __dirname, getSubDirectories } from "../utils/file";

const router = Router();

// Logger
const logger = createCustomLogger("backend");

// Mutex for file handling
const fileMutex = new Mutex();

async function safeOperation<T>(operation: () => Promise<T>): Promise<T> {
	return fileMutex.runExclusive(async () => {
		// Execute the operation
		return await operation();
	});
}

// Helper function to validate file paths
const validatePath = (filePath: string, res: Response): boolean => {
	if (!filePath) {
		res.status(400).send("Path parameter is required");
		return false;
	}
	if (!fs.existsSync(filePath)) {
		res.status(400).send("Invalid path");
		return false;
	}
	return true;
};

// Get directory structure
const getDirectoryStructure = (dirPath: string): FileNode[] => {
	const files = fs.readdirSync(dirPath);

	return files.map((file) => {
		const filePath = path.join(dirPath, file);
		const isDirectory = fs.lstatSync(filePath).isDirectory();

		return {
			name: file,
			fullPath: filePath,
			type: isDirectory ? FileNodeType.Directory : FileNodeType.File,
			children: isDirectory ? getDirectoryStructure(filePath) : [],
		};
	});
};

// Get directory structure endpoint
router.get("/file-tree", (req: Request, res: Response) => {
	try {
		const requestedPath = req.query.path as string;
		if (!validatePath(requestedPath, res)) return;

		if (!fs.lstatSync(requestedPath).isDirectory()) {
			res.status(400).send("Invalid directory path");
			return;
		}

		const directoryStructure = getDirectoryStructure(requestedPath);
		res.json(directoryStructure);
	} catch (error) {
		logger.error("Failed to get directory structure", { error });
		res.status(500).send("Internal Server Error");
	}
});
// Get if a file exists
router.get("/file-exists", (req: Request, res: Response) => {
	const filePath = req.query.path as string;

	try {
		if (!validatePath(filePath, res)) return;

		res.json({ exists: fs.existsSync(filePath) });
	} catch (error) {
		logger.error("Failed to check if file exists", { error });
		res.status(500).send("Internal Server Error");
	}
});

// Get file content endpoint
router.get("/file-content", async (req: Request, res: Response) => {
	const filePath = req.query.path as string;

	try {
		if (!validatePath(filePath, res)) return;

		if (fs.lstatSync(filePath).isDirectory()) {
			res.status(400).send("Invalid file path");
			return;
		}

		const fileContent = await fs.promises.readFile(filePath, "utf-8");
		const stats = await fs.promises.stat(filePath);
		const lastModified = stats.mtimeMs; // Get last modified timestamp in milliseconds

		res.json({ content: fileContent, lastModified: lastModified });
	} catch (error) {
		logger.error("Failed to read file", { error });
		res.status(500).send("Internal Server Error");
	}
});

// Save file content endpoint
router.post("/file-content", async (req: Request, res: Response) => {
	const { path: filePath, content } = req.body as {
		path: string;
		content: string;
	};

	try {
		if (!validatePath(filePath, res)) return;

		if (fs.lstatSync(filePath).isDirectory()) {
			res.status(400).send("Invalid file path");
			return;
		}

		await fs.promises.writeFile(filePath, content, "utf8");
		logger.info(
			`Successfully wrote file (${filePath}) with content: ${content}`,
		);
		res.status(200).send("File saved successfully");
	} catch (error) {
		logger.error("Failed to save file", { error });
		res.status(500).send("Error saving file");
	}
});

// Rename file or directory
router.put("/rename", async (req: Request, res: Response) => {
	const { oldPath, newPath } = req.body as {
		oldPath: string;
		newPath: string;
	};

	try {
		if (!validatePath(oldPath, res) || !newPath) return;

		await fs.rename(oldPath, newPath);
		logger.info(`Renamed ${oldPath} to ${newPath}`);
		res.status(200).send("Renamed successfully");
	} catch (error) {
		logger.error("Failed to rename", { error });
		res.status(500).send("Internal Server Error");
	}
});

// Copy file or directory
router.post("/copy", async (req: Request, res: Response) => {
	const { sourcePath, destinationPath } = req.body as {
		sourcePath: string;
		destinationPath: string;
	};

	try {
		if (!validatePath(sourcePath, res) || !destinationPath) return;

		await fs.copy(sourcePath, destinationPath);
		logger.info(`Copied ${sourcePath} to ${destinationPath}`);
		res.status(200).send("Copied successfully");
	} catch (error) {
		logger.error("Failed to copy", { error });
		res.status(500).send("Internal Server Error");
	}
});

// Delete file or directory
router.delete("/delete", async (req: Request, res: Response) => {
	const { targetPath } = req.body as { targetPath: string };

	try {
		if (!validatePath(targetPath, res)) return;

		await fs.remove(targetPath);
		logger.info(`Deleted ${targetPath}`);
		res.status(200).send("Deleted successfully");
	} catch (error) {
		logger.error("Failed to delete", { error });
		res.status(500).send("Internal Server Error");
	}
});

// Create new file
router.post("/new-file", async (req: Request, res: Response) => {
	const { filePath, content = "" } = req.body as {
		filePath: string;
		content?: string;
	};

	try {
		if (!filePath) {
			res.status(400).send("File path is required");
			return;
		}

		if (fs.existsSync(filePath)) {
			res.status(400).send("File already exists");
			return;
		}

		await fs.ensureFile(filePath);
		await fs.writeFile(filePath, content, "utf8");
		logger.info(`Created new file at ${filePath}`);
		res.status(200).send("File created successfully");
	} catch (error) {
		logger.error("Failed to create file", { error });
		res.status(500).send("Internal Server Error");
	}
});

// Create new igc file
router.post("/new-igc-file", async (req: Request, res: Response) => {
	const { filePath } = req.body as {
		filePath: string;
	};

	const content = {
		nodes: [
			{
				id: "start",
				type: "StartNode",
				data: {
					label: "Start",
				},
				position: {
					x: 0,
					y: -100,
				},
				positionAbsolute: {
					x: 0,
					y: -100,
				},
				style: {
					cursor: "grab",
				},
				width: 23,
				height: 23,
				selected: false,
				draggable: false,
			},
		],
		edges: [],
	};

	try {
		if (!filePath) {
			res.status(400).send("File path is required");
			return;
		}

		await fs.ensureFile(filePath);
		await fs.writeJSON(filePath, content, "utf8");
		logger.info(`Created new file at ${filePath}`);
		res.status(200).send("File created successfully");
	} catch (error) {
		logger.error("Failed to create file", { error });
		res.status(500).send("Internal Server Error");
	}
});

// Create new directory
router.post("/new-directory", async (req: Request, res: Response) => {
	const { dirPath } = req.body as { dirPath: string };

	try {
		if (!dirPath) {
			res.status(400).send("Directory path is required");
			return;
		}

		if (fs.existsSync(dirPath)) {
			res.status(400).send("Directory already exists");
			return;
		}

		await fs.ensureDir(dirPath);
		logger.info(`Created new directory at ${dirPath}`);
		res.status(200).send("Directory created successfully");
	} catch (error) {
		logger.error("Failed to create directory", { error });
		res.status(500).send("Internal Server Error");
	}
});

/**
 * Handle new Components / Modules
 *
 */

// interface ComponentType {
// 	type: string; // The type of component, e.g., "IGCNodeProps"
// 	components: string[]; // List of component names that match this type
// }

// interface CacheEntry {
// 	search_path: string;
// 	last_updated: string;
// 	files: {
// 		[filePath: string]: ComponentType[];
// 	};
// }

// const componentTypesToSearchFor: string[] = ["IGCNodeProps"];

// Cache file path
const CACHE_FILE = path.join(__dirname, "../cache.json");
const IGC_MODULE_CONFIG_FILE = "igc.module.json";

// Function to read the cache
const readCache = async (): Promise<Cache> => {
	try {
		// Check if the file exists
		if (!fs.existsSync(CACHE_FILE)) {
			// If file doesn't exist, create it with an empty array
			await fs.promises.writeFile(
				CACHE_FILE,
				JSON.stringify([]),
				"utf-8",
			);
			return [];
		}

		// If file exists, read its contents
		const rawData = await fs.promises.readFile(CACHE_FILE, "utf-8");
		return JSON.parse(rawData) as Cache;
	} catch (error) {
		// If an error occurs during file read (but the file exists), fail without overriding the file
		console.error("Error reading the cache file:", error);
		throw new Error("Failed to read cache file");
	}
};

// Function to write to the cache
const writeCache = (cacheData: Cache): void => {
	fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
};

// Function to scan the directory for .tsx files and compare with cache
// const getMissingOrExtraFiles = (
// 	directoryPath: string,
// 	cache: CacheEntry,
// ): { missing: string[]; extra: string[] } => {
// 	const currentFiles = fs
// 		.readdirSync(directoryPath)
// 		.filter((file) => file.endsWith(".tsx"));
// 	const cachedFiles = Object.keys(cache.files);

// 	const missingFiles = currentFiles.filter(
// 		(file) => !cachedFiles.includes(file),
// 	);
// 	const extraFiles = cachedFiles.filter(
// 		(file) => !currentFiles.includes(file),
// 	);

// 	return { missing: missingFiles, extra: extraFiles };
// };

// Function to detect components of specific types in a given file (This works, it is just slow, so instead we will just return the files)
// const findComponentsByType = (
// 	filePath: string,
// 	types: string[],
// ): ComponentType[] => {
// 	const project = new Project();
// 	const sourceFile = project.addSourceFileAtPath(filePath);
// 	const componentMatches: ComponentType[] = [];

// 	types.forEach((type) => {
//         const components: string[] = sourceFile.getVariableDeclarations().filter(s => s.getType().getText().includes(type)).map(s => s.getName());

// 		if (components.length > 0) {
// 			componentMatches.push({ type, components });
// 		}
// 	});

// 	return componentMatches;
// };
router.post("/module", async (req: Request, res: Response) => {
	const directoryPath = req.body.directory as string;
	if (!directoryPath) {
		res.status(400).json({ error: "Directory path is required" });
		return;
	}

	const cache = await readCache();

	// Check if the directory already exists in the cache
	const cacheEntryExists = cache.some(
		(entry) => entry.search_path === directoryPath,
	);
	if (cacheEntryExists) {
		res.status(400).json({
			error: "Directory already exists in the cache",
		});
		return;
	}

	// Add the new directory to the cache
	const newCacheEntry: CacheEntry = {
		search_path: directoryPath,
		last_updated: new Date().toISOString(),
		files: [],
	};
	cache.push(newCacheEntry);
	writeCache(cache);

	res.status(201).json({ message: "Directory added to cache", cache });
});

router.delete("/module", async (req: Request, res: Response) => {
	const directoryPath = req.body.directory as string;
	if (!directoryPath) {
		res.status(400).json({ error: "Directory path is required" });
		return;
	}

	const cache = await readCache();

	// Filter out the directory to remove it from the cache
	const newCache = cache.filter(
		(entry) => entry.search_path !== directoryPath,
	);

	if (newCache.length === cache.length) {
		res.status(400).json({ error: "Directory not found in the cache" });
		return;
	}

	writeCache(newCache);
	res.status(200).json({
		message: "Directory removed from cache",
		cache: newCache,
	});
	return;
});

// // Function to check if a cache entry needs updating
// const isCacheEntryOutdated = (entry: CacheEntry): boolean => {
// 	const now = new Date();
// 	const lastUpdated = new Date(entry.last_updated);
// 	const timeDiff =
// 		(now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24); // difference in days
// 	return timeDiff > 1;
// };

// Function to find the cache for a specific directory
const findCacheForDirectory = (
	cache: Cache,
	directoryPath: string,
): any | null => {
	return cache.find((entry) => entry.search_path === directoryPath) || null;
};

// Function to scan the directory for .tsx files, excluding symlinks
const getTsxFiles = (directoryPath: string): string[] => {
	let tsxFiles: string[] = [];

	const files = fs.readdirSync(directoryPath);

	files.forEach((file) => {
		const filePath = path.join(directoryPath, file);
		const stat = fs.lstatSync(filePath);

		if (stat.isDirectory() && file !== "node_modules") {
			// Recursively search subdirectories
			tsxFiles = tsxFiles.concat(getTsxFiles(filePath));
		} else if (file.endsWith(".tsx") && !stat.isSymbolicLink()) {
			// Add the .tsx file if it's not a symlink
			tsxFiles.push(filePath);
		}
	});

	return tsxFiles;
};

// Function to process files and update cache for a directory
const updateCacheForDirectory = (
	directoryPath: string,
	cache: Cache,
): CacheEntry => {
	const cacheEntry = findCacheForDirectory(cache, directoryPath);

	const tsxFiles = getTsxFiles(directoryPath);
	// const missingOrExtraFiles = getMissingOrExtraFiles(
	// 	directoryPath,
	// 	cacheEntry,
	// );

	// // If there are missing or extra files, or the cache is outdated, re-process
	// if (
	// 	missingOrExtraFiles.missing.length > 0 ||
	// 	missingOrExtraFiles.extra.length > 0 ||
	// 	isCacheEntryOutdated(cacheEntry)
	// ) {
	// tsxFiles.forEach((file) => {
	// 	const filePath = path.join(directoryPath, file);
	// 	const components = findComponentsByType(
	// 		filePath,
	// 		componentTypesToSearchFor,
	// 	);
	// 	cacheEntry.files[filePath] = components;
	// });
	cacheEntry.files = tsxFiles;
	cacheEntry.last_updated = new Date().toISOString();
	// }

	return cacheEntry;
};

const checkModuleConfig = (
	modulePath: string,
): ModuleConfigurationData | undefined => {
	const configPath = path.join(modulePath, IGC_MODULE_CONFIG_FILE);
	if (fs.existsSync(configPath)) {
		const rawData = fs.readFileSync(configPath, "utf-8");
		return JSON.parse(rawData) as ModuleConfigurationData;
	}
	return undefined;
};

router.get("/find-components", async (_, res: Response) => {
	const cache = await readCache();

	cache.forEach((entry) => {
		const moduleConfig = checkModuleConfig(entry.search_path);
		if (moduleConfig) {
			entry.meta = moduleConfig;
		}
		updateCacheForDirectory(entry.search_path, cache);
	});

	writeCache(cache); // Update cache after processing
	res.json(cache);
});

const getExecutionData = async (
	executionDir: string,
): Promise<Omit<IGCCodeNodeExecution, "nodeId">> => {
	try {
		const configurationPath = path.join(executionDir, "configuration.json");
		const metricsPath = path.join(executionDir, "metrics.json");
		const stderrPath = path.join(executionDir, "std.err");
		const stdoutPath = path.join(executionDir, "std.out");

		// Use fs-extra's readJSON and readFile methods
		const [configuration, metrics, stderr, stdout] = await Promise.all([
			fs.readJSON(configurationPath), // Read and parse JSON file
			fs.readJSON(metricsPath), // Read and parse JSON file
			fs.readFile(stderrPath, "utf8"), // Read plain text file
			fs.readFile(stdoutPath, "utf8"), // Read plain text file
		]);

		// Return the IGCCodeNodeExecution object
		return {
			configuration,
			metrics,
			stderr,
			stdout,
		};
	} catch (error) {
		console.error("Error reading execution data:", error);
		throw new Error("Failed to load execution data");
	}
};

router.get("/session-data", async (req: Request, res: Response) => {
	const filePath = req.query.filePath as string;
	if (!filePath) {
		res.status(400).json({ error: "File path is required" });
		return;
	}

	const returnData: IGCFileSessionData = { primarySession: "", sessions: {} };

	// Get session directory
	const sessionDir = path.join(
		path.dirname(filePath),
		".sessions",
		path.basename(filePath),
	);

	// Get the primary session info inside the session.config.json file
	const sessionsConfigPath = path.join(sessionDir, "session.config.json");
	if (!fs.existsSync(sessionsConfigPath)) {
		res.status(404).json({ error: "Session config file not found" });
		return;
	}
	// Read the session config file and get the current primary session data
	const content = await safeOperation(() =>
		fs.readFile(sessionsConfigPath, "utf-8"),
	);
	console.log(content);
	if (content === "") {
		console.log("content is empty");
	}
	const sessionConfigData = JSON.parse(content);
	const primarySession: string = sessionConfigData.current;
	returnData.primarySession = primarySession;

	// Get all session data
	const sessionDirs = await getSubDirectories(sessionDir);
	for (const session of sessionDirs) {
		const sessionConfigPath = path.join(
			sessionDir,
			session,
			"executions",
			"config.json",
		);
		if (!fs.existsSync(sessionConfigPath)) {
			continue;
		}
		const sessionConfigData: SessionConfig =
			await fs.readJSON(sessionConfigPath);

		// Create a new session data object
		const sessionData: IGCSession = {
			lastUpdate: sessionConfigData.timestamp,
			overallConfiguration: {},
			executions: [],
		};
		// Update the execution data
		const executionsDir = path.join(sessionDir, session, "executions");
		for (let i = 0; i < sessionConfigData.path.length; i++) {
			const nodeId = sessionConfigData.path[i];
			const executionDir = path.join(executionsDir, `${i + 1}`);
			try {
				const executionData: IGCCodeNodeExecution = {
					...(await getExecutionData(executionDir)),
					nodeId: nodeId,
				};
				sessionData.executions.push(executionData);
			} catch (error) {
				console.error(
					`Error getting execution data for (${executionDir}):`,
					error,
				);
			}
		}
		// Update the overall configuration to the most recent one
		// Get the most recent configuration file
		const lastExecution =
			sessionData.executions[sessionData.executions.length - 1];
		if (lastExecution !== undefined) {
			sessionData.overallConfiguration = lastExecution.configuration;
		}

		// Add the session data to the return object
		returnData.sessions[session] = sessionData;
	}

	res.json(returnData);
	return;
});

router.delete("/session-data-node", async (req: Request, res: Response) => {
	const filePath = req.body.filePath as string;
	const nodeId = req.body.nodeId as string;
	if (!filePath || !nodeId) {
		res.status(400).json({ error: "File path and node ID are required" });
		return;
	}

	// Keep track of the affected sessions
	const affectedSessions: string[] = [];

	// Go through every session of the file and check if the node is present in the execution path
	const sessionDir = path.join(
		path.dirname(filePath),
		".sessions",
		path.basename(filePath),
	);
	const sessionDirs = await getSubDirectories(sessionDir);
	for (const session of sessionDirs) {
		const sessionPath = path.join(sessionDir, session);
		const sessionConfigPath = path.join(
			sessionPath,
			"executions",
			"config.json",
		);
		if (!fs.existsSync(sessionConfigPath)) {
			continue;
		}
		const sessionConfigData: SessionConfig =
			await fs.readJSON(sessionConfigPath);

		// If the node is present in the execution path, remove it
		if (sessionConfigData.path.includes(nodeId)) {
			affectedSessions.push(session);

			// Remove the session
			fs.removeSync(sessionPath);
		}
	}

	// Check if the primary session is affected
	const sessionsConfigPath = path.join(sessionDir, "session.config.json");
	const content = await safeOperation(() =>
		fs.readFile(sessionsConfigPath, "utf-8"),
	);
	const sessionsConfigData = await JSON.parse(content);
	if (affectedSessions.includes(sessionsConfigData.current)) {
		// Find the most current session
		// Go through each session config file and fine the one with the most recent timestamp
		let mostRecentSession = "";
		let mostRecentTimestamp = 0;
		const sessionDirs = await getSubDirectories(sessionDir);
		for (const session of sessionDirs) {
			const sessionConfigPath = path.join(
				sessionDir,
				session,
				"executions",
				"config.json",
			);
			if (!fs.existsSync(sessionConfigPath)) {
				continue;
			}
			const sessionConfigData: SessionConfig =
				await fs.readJSON(sessionConfigPath);
			if (sessionConfigData.timestamp > mostRecentTimestamp) {
				mostRecentTimestamp = sessionConfigData.timestamp;
				mostRecentSession = session;
			}
		}
		sessionsConfigData.current = mostRecentSession;
		await safeOperation(() =>
			fs.writeJSON(sessionsConfigPath, sessionsConfigData),
		);
	}

	res.json(affectedSessions);
	return;
});

router.delete(
	"/session-data-execution",
	async (req: Request, res: Response) => {
		const {
			filePath,
			sessionId,
			executionNumber,
		}: SessionDataDeleteExecutionRequest = req.body;

		if (filePath === undefined) {
			res.status(400).json({ error: "File path is required" });
			return;
		}
		if (sessionId === undefined) {
			res.status(400).json({ error: "Session Id is required" });
			return;
		}
		if (executionNumber === undefined) {
			res.status(400).json({ error: "Execution Number is required" });
			return;
		}

		// Get the session directory
		const sessionDir = path.join(
			path.dirname(filePath),
			".sessions",
			path.basename(filePath),
			sessionId,
		);
		// Make sure session exists
		if (!fs.existsSync(sessionDir)) {
			res.status(404).json({ error: "Session not found" });
			return;
		}
		// Read the session config file
		const sessionConfigPath = path.join(
			sessionDir,
			"executions",
			"config.json",
		);
		if (!fs.existsSync(sessionConfigPath)) {
			// Error that the session has not been initialized
			res.status(400).json({ error: "Session not initialized" });
			return;
		}
		const sessionConfigData: SessionConfig =
			await fs.readJSON(sessionConfigPath);

		// Do a check to make sure the index is valid
		if (
			executionNumber < 1 ||
			executionNumber > sessionConfigData.path.length
		) {
			res.status(400).json({ error: "Invalid execution number" });
			return;
		}
		// Remove the execution from the path
		sessionConfigData.path.splice(executionNumber - 1, 1);

		// Remove all execution data (need to run this again afterwards)
		const executionsDir = path.join(sessionDir, "executions");
		// Remove the execution directory
		await fs.remove(executionsDir);

		// Create the config so it remains a valid session
		await fs.ensureDir(executionsDir);
		await safeOperation(() =>
			fs.writeJSON(sessionConfigPath, {
				path: [],
				timestamp: Date.now(),
				filePath: filePath,
			}),
		);

		res.json(sessionConfigData.path);
		return;
	},
);
router.post("/primary-session", async (req: Request, res: Response) => {
	const filePath = req.body.filePath as string;
	const sessionId = req.body.sessionId as string;

	if (!filePath || !sessionId) {
		res.status(400).json({
			error: "File path and session ID are required",
		});
		return;
	}

	const sessionDir = path.join(
		path.dirname(filePath),
		".sessions",
		path.basename(filePath),
	);
	const sessionsConfigPath = path.join(sessionDir, "session.config.json");
	const content = await safeOperation(() =>
		fs.readFile(sessionsConfigPath, "utf-8"),
	);
	const sessionConfigData = JSON.parse(content);

	if (sessionConfigData.current === sessionId) {
		res.status(400).json({ error: "Session already active" });
		return;
	}

	sessionConfigData.current = sessionId;
	await safeOperation(() =>
		fs.writeJSON(sessionsConfigPath, sessionConfigData),
	);

	res.json({ message: "Primary session updated" });
	return;
});

// Create a new session
router.post("/session", async (req: Request, res: Response) => {
	const filePath = req.body.filePath as string;
	const sessionId = req.body.sessionId as string;

	if (!filePath || !sessionId) {
		res.status(400).json({
			error: "File path and session ID are required",
		});
		return;
	}

	// Create the session directory
	const fileSessionDir = path.join(
		path.dirname(filePath),
		".sessions",
		path.basename(filePath),
	);
	const sessionDir = path.join(fileSessionDir, sessionId);
	await fs.ensureDir(sessionDir);

	// Create the executions directory
	const executionsDir = path.join(sessionDir, "executions");
	await fs.ensureDir(executionsDir);

	// Create the session execution config file
	await fs.writeJSON(path.join(executionsDir, "config.json"), {
		path: [],
		timestamp: Date.now(),
		filePath: filePath,
	});

	// Update the primary session
	// Get session directory

	const sessionsConfigPath = path.join(fileSessionDir, "session.config.json");
	await safeOperation(() =>
		fs.writeJSON(sessionsConfigPath, { current: sessionId }),
	);

	res.json({ message: "Session created" });
	return;
});

router.delete("/session", async (req: Request, res: Response) => {
	const filePath = req.body.filePath as string;
	const sessionId = req.body.sessionId as string;

	if (!filePath || !sessionId) {
		res.status(400).json({
			error: "File path and session ID are required",
		});
		return;
	}

	// Get the session directory
	const sessionDir = path.join(
		path.dirname(filePath),
		".sessions",
		path.basename(filePath),
		sessionId,
	);

	// Remove the session directory
	await fs.remove(sessionDir);

	// Check if the primary session is affected
	const sessionsConfigPath = path.join(
		path.dirname(filePath),
		".sessions",
		path.basename(filePath),
		"session.config.json",
	);
	const sessionsConfigData = await fs.readJSON(sessionsConfigPath);
	if (sessionsConfigData.current === sessionId) {
		// Find the most current session
		// Go through each session config file and fine the one with the most recent timestamp
		let mostRecentSession = "";
		let mostRecentTimestamp = 0;
		const sessionDirs = await getSubDirectories(
			path.join(
				path.dirname(filePath),
				".sessions",
				path.basename(filePath),
			),
		);
		for (const session of sessionDirs) {
			const sessionConfigPath = path.join(
				path.dirname(filePath),
				".sessions",
				path.basename(filePath),
				session,
				"executions",
				"config.json",
			);
			if (!fs.existsSync(sessionConfigPath)) {
				continue;
			}
			const sessionConfigData: SessionConfig =
				await fs.readJSON(sessionConfigPath);
			if (sessionConfigData.timestamp > mostRecentTimestamp) {
				mostRecentTimestamp = sessionConfigData.timestamp;
				mostRecentSession = session;
			}
		}
		sessionsConfigData.current = mostRecentSession;
		await fs.writeJSON(sessionsConfigPath, sessionsConfigData);

		res.json({
			message: "Session removed",
			newPrimary: mostRecentSession,
		});
		return;
	}
	res.json({ message: "Session removed" });
	return;
});

export default router;
