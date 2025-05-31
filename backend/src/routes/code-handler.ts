import { Router, Request, Response } from "express";
import fs from "fs-extra";
import path from "path";
import {
	CodeAnalysisRequest,
	CodeAnalysisResponse,
	CodeExecutionMetrics,
	CodeExecutionRequest,
	CodeExecutionResponse,
	CodeManyExecutionRequest,
	FileIdCodeList,
	SessionConfig,
} from "shared";
import { createCustomLogger } from "shared/server";
import { spawn, execFile } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { __dirname, getSubDirectories } from "../utils/file";
import { FileSystemTransaction } from "../utils/FileSystemTransaction";
import { prepareExecution, runExecution } from "../utils/ExecutionEngine";

const router = Router();

// Logger
const logger = createCustomLogger("backend");

/**
 * Function to check if Python is installed
 *
 * @returns {Promise<string | null>} - The path to the Python binary or null if not found
 */
const checkPythonInstallation = (): Promise<string | null> => {
	const languageDir = path.join(__dirname, "../../languages");
	return new Promise((resolve) => {
		const commands = [path.join(languageDir, "python/venv/bin/python")];
		console.log(`Commands to check: ${commands}`);
		let index = 0;

		const checkNext = () => {
			if (index >= commands.length) {
				resolve(null);
				return;
			}

			const command = commands[index];
			console.log(`Executing command: ${command} --version`);

			execFile(command, ["--version"], (error, stdout, stderr) => {
				if (error) {
					console.log(`Error executing command: ${error}`);
					console.log(`stderr: ${stderr}`);
					index++;
					checkNext();
				} else {
					console.log(`Python version output: ${stdout}`);
					resolve(commands[index]);
				}
			});
		};

		checkNext();
	});
};

/**
 * Function to get the current run number of a session and appending a new node to the session path.
 *
 * * This will also update the config timestamp
 *
 * @param {FileSystemTransaction} transactionSystem - The file system transaction system to use
 * @param {string} nextNode - The node to append to the path
 * @param {string} executionPath - The execution directory path of the session
 * @param {string} filePath - The path to the IGC file
 * @returns {Promise<number>} - The current run number
 */
const addPathToSession = async (
	transactionSystem: FileSystemTransaction,
	nextNode: string,
	executionPath: string,
	filePath: string,
): Promise<number> => {
	const data: SessionConfig = {
		path: [],
		timestamp: Date.now(),
		filePath: filePath,
	};

	try {
		// Check if the file exists
		const fileConfigPath = `${executionPath}/config.json`;
		const configExists = await fs
			.ensureFile(fileConfigPath)
			.then(() => true)
			.catch(() => false);

		if (configExists) {
			// Read and parse the file content
			const fileData = await fs.readFile(fileConfigPath, "utf8");
			data.path = JSON.parse(fileData).path;

			// Ensure it's an array before appending
			if (!Array.isArray(data.path)) {
				throw new Error("File does not contain a valid array.");
			}
		}

		// Append the new string to the list
		data.path.push(nextNode);

		// Write the updated list back to the file
		if (!configExists) {
			await transactionSystem.stageCreate(
				fileConfigPath,
				JSON.stringify(data, null, 4),
			);
		} else {
			await transactionSystem.stageModify(
				fileConfigPath,
				JSON.stringify(data, null, 4),
			);
		}
		console.log("File updated successfully!");

		// Return the current length of the list
		return data.path.length;
	} catch (err) {
		console.error("Error handling the file:", err);
		return -1; // Error case
	}
};

// export const executeCode = async (
// 	code: string,
// 	languageBinPath: string,
// 	sessionId: string,
// 	executionDir: string,
// 	prevExecutionDir?: string,
// ): Promise<Omit<CodeExecutionResponse, "metaNodeData">> => {
// 	await fs.mkdir(executionDir, { recursive: true });

// 	const stateFilePath = path.join(executionDir, "state.pkl");
// 	const configFilePath = path.join(executionDir, "configuration.json");
// 	const scriptFilePath = path.join(executionDir, "script.py");

// 	let completeCode = `
// import dill as IGC_RUN_VARIABLE_DILL
// import json as IGC_RUN_VARIABLE_JSON
// import os as IGC_RUN_VARIABLE_OS
// import types as IGC_RUN_VARIABLE_TYPES

// state = {}
// config = {}

// # Save the initial state to compare later
// IGC_RUN_VARIABLE_initial_globals = set(globals().keys())

// `;

// 	if (prevExecutionDir !== undefined) {
// 		completeCode += `# Paths for temporary files
// IGC_RUN_VARIABLE_prevStateFilePath = "${path
// 			.join(prevExecutionDir, "state.pkl")
// 			.replace(/\\/g, "\\\\")
// 			.replace(/"/g, '\\"')}"

// # Load initial state if it exists
// if IGC_RUN_VARIABLE_OS.path.exists(IGC_RUN_VARIABLE_prevStateFilePath):
//     IGC_RUN_VARIABLE_DILL.load_session(IGC_RUN_VARIABLE_prevStateFilePath)
// `;
// 	}
// 	completeCode += `
// IGC_RUN_VARIABLE_stateFilePath = "${stateFilePath
// 		.replace(/\\/g, "\\\\")
// 		.replace(/"/g, '\\"')}"
// IGC_RUN_VARIABLE_configFilePath = "${configFilePath
// 		.replace(/\\/g, "\\\\")
// 		.replace(/"/g, '\\"')}"

// # User code
// ${code}

// # Capture the state of all variables
// IGC_RUN_VARIABLE_global_items = list(globals().items())
// config = {}

// for IGC_RUN_VARIABLE_key, IGC_RUN_VARIABLE_value in IGC_RUN_VARIABLE_global_items:
//     if IGC_RUN_VARIABLE_key not in IGC_RUN_VARIABLE_initial_globals and not IGC_RUN_VARIABLE_key.startswith('IGC_RUN_VARIABLE_'):
//         if isinstance(IGC_RUN_VARIABLE_value, (int, float, str, bool, dict, list, tuple, set)):
//             config[IGC_RUN_VARIABLE_key] = IGC_RUN_VARIABLE_value
//         elif isinstance(IGC_RUN_VARIABLE_value, IGC_RUN_VARIABLE_TYPES.FunctionType):
//             config[IGC_RUN_VARIABLE_key] = "<function>"
//         elif isinstance(IGC_RUN_VARIABLE_value, type):
//             config[IGC_RUN_VARIABLE_key] = "<class>"
//         else:
//             config[IGC_RUN_VARIABLE_key] = f"<{type(IGC_RUN_VARIABLE_value).__name__}>"

// # Save the state for the next execution
// IGC_RUN_VARIABLE_DILL.dump_session(IGC_RUN_VARIABLE_stateFilePath)

// # Save the config to a separate JSON file
// with open(IGC_RUN_VARIABLE_configFilePath, "w") as IGC_RUN_VARIABLE_configFile:
//     IGC_RUN_VARIABLE_JSON.dump(config, IGC_RUN_VARIABLE_configFile, default=str)
//     IGC_RUN_VARIABLE_configFile.flush()
// `;

// 	await fs.writeFile(scriptFilePath, completeCode);

// 	return new Promise((resolve, reject) => {
// 		const startTime = process.hrtime();
// 		logger.info("Executing Python code", { sessionId, code });

// 		const pythonProcess = spawn(languageBinPath, [scriptFilePath]);

// 		let stdout = "";
// 		let stderr = "";

// 		pythonProcess.stdout.on("data", (data) => {
// 			stdout += data.toString();
// 		});

// 		pythonProcess.stderr.on("data", (data) => {
// 			stderr += data.toString();
// 		});

// 		pythonProcess.on("close", async () => {
// 			const endTime = process.hrtime(startTime);
// 			const execTime = endTime[0] * 1000 + endTime[1] / 1000000; // Execution time in milliseconds

// 			let config = {};
// 			try {
// 				if (fs.existsSync(configFilePath)) {
// 					config = JSON.parse(
// 						await fs.readFile(configFilePath, "utf8"),
// 					);
// 				} else {
// 					if (prevExecutionDir !== undefined) {
// 						logger.error(
// 							"Config file does not exist. Copying the previous one here...",
// 							{ sessionId },
// 						);
// 						const prevConfigFilePath = path.join(
// 							prevExecutionDir,
// 							"configuration.json",
// 						);
// 						await fs.copyFile(prevConfigFilePath, configFilePath);
// 						config = JSON.parse(
// 							await fs.readFile(prevConfigFilePath, "utf8"),
// 						);
// 					} else {
// 						logger.error(
// 							"Config file does not exist and no previous execution directory provided.",
// 							{ sessionId },
// 						);
// 						// throw new Error("Config file does not exist");
// 					}
// 				}
// 				if (!fs.existsSync(stateFilePath)) {
// 					if (prevExecutionDir !== undefined) {
// 						logger.error(
// 							"State file does not exist. Copying the previous one here...",
// 							{ sessionId },
// 						);
// 						await fs.copyFile(
// 							path.join(prevExecutionDir, "state.pkl"),
// 							stateFilePath,
// 						);
// 					} else {
// 						logger.error(
// 							"State file does not exist and no previous execution directory provided.",
// 							{ sessionId },
// 						);
// 						// throw new Error("State file does not exist");
// 					}
// 				}
// 			} catch (e) {
// 				logger.error(
// 					"Error reading config or combined result after execution",
// 					{ error: e },
// 				);
// 				reject(e); // Reject the promise if there's an error
// 				return;
// 			}

// 			const metrics = {
// 				executionTime: execTime,
// 				sessionId: sessionId,
// 			};

// 			// Log the result of execution
// 			await fs.writeFile(path.join(executionDir, "std.out"), stdout);
// 			await fs.writeFile(path.join(executionDir, "std.err"), stderr);
// 			await fs.writeFile(
// 				path.join(executionDir, "metrics.json"),
// 				JSON.stringify(metrics, null, 4),
// 			);

// 			const result: Omit<CodeExecutionResponse, "metaNodeData"> = {
// 				output: stdout,
// 				error: stderr,
// 				metrics: metrics,
// 				configuration: config,
// 			};

// 			if (stderr) {
// 				logger.error("Error executing Python code", {
// 					sessionId,
// 					error: stderr,
// 				});
// 			} else {
// 				logger.info("Python code executed successfully", {
// 					sessionId,
// 					result,
// 				});
// 			}

// 			// Clean up temporary script file but keep the state file
// 			await fs.unlink(scriptFilePath);

// 			// Resolve the result
// 			resolve(result);
// 		});

// 		pythonProcess.on("error", (err) => {
// 			logger.error("Python process failed to start", { error: err });
// 			reject(err); // Reject if there's an error starting the process
// 		});
// 	});
// };

router.post("/execute", async (req: Request, res: Response) => {
	const {
		code,
		language,
		filePath,
		nodeId,
		sessionId,
	}: CodeExecutionRequest = req.body;

	if (!code) {
		logger.error("No code was provided in the request");
		res.status(400).send({ error: "No code provided" });
		return;
	}
	// Transaction system for file operations
	const transactionSystem = new FileSystemTransaction();

	// Run the pre-execution step to get the language binary, session key, and execution directory
	let pythonPath: string;
	let sessionKey: string;
	let executionsDir: string;
	try {
		const result = await preExecutionStep(
			transactionSystem,
			language,
			filePath,
			sessionId,
		);
		pythonPath = result.languageBin;
		sessionKey = result.session;
		executionsDir = result.executionDir;
	} catch (error) {
		logger.error("Error in pre-execution step", { error });
		res.status(500).send({ error: "Error in pre-execution step" });
		return;
	}

	// Get analysis data
	const metaNodeData: CodeAnalysisResponse = {
		dependencies: {
			variables: [],
			functions: [],
			classes: [],
			modules: [],
		},
		new_definitions: {
			variables: [],
			functions: [],
			classes: [],
		},
	};
	// try {
	// 	metaNodeData = await analyzeCode({ code, language });
	// } catch (error) {
	// 	logger.error("Error analyzing code", { error });
	// 	return;
	// }

	// Update the specific session path file
	const currentRunNumber = await addPathToSession(
		transactionSystem,
		nodeId,
		executionsDir,
		filePath,
	);

	// Create the run directory
	const executionDir = path.join(executionsDir, `${currentRunNumber}`);

	// Get the previous execution directory (if any)
	const prevExecutionDir =
		currentRunNumber === 1 ||
		(await fs.existsSync(
			path.join(executionsDir, `${currentRunNumber - 1}`),
		))
			? undefined
			: path.join(executionsDir, `${currentRunNumber - 1}`);

	try {
		// Generate the execution script
		const script = await prepareExecution(
			transactionSystem,
			code,
			executionDir,
			prevExecutionDir,
		);

		// Run the script
		const result = await runExecution(
			transactionSystem,
			script,
			executionDir,
			pythonPath,
			sessionKey,
			prevExecutionDir,
		);
		transactionSystem.commit();
		res.send(result);
	} catch (error) {
		logger.error("Error executing code", { error });
		res.status(500).send({ error: "Error executing code" });
		transactionSystem.rollback();
		// return;
	}
	// res.send({
	// 	...(await executeCode(
	// 		code,
	// 		pythonPath,
	// 		sessionKey,
	// 		executionDir,
	// 		prevExecutionDirExists ? prevExecutionDir : undefined,
	// 	)),
	// 	metaNodeData: metaNodeData,
	// });
	// return;
});

// The pre-execution step for executing code snippets
const preExecutionStep = async (
	transactionSystem: FileSystemTransaction,
	language: string,
	filePath: string,
	sessionId?: string,
): Promise<{ languageBin: string; session: string; executionDir: string }> => {
	// Use language for binary lookup here for the future...

	// Check if python is installed and usable
	const pythonPath = await checkPythonInstallation();
	if (!pythonPath) {
		logger.error("Python is not installed");
		throw new Error("Python is not installed");
	}

	// Get the session, otherwise create a new one
	const sessionKey = sessionId ?? uuidv4();

	// Create the main session directory (if not created already)
	const sessionDir = path.join(
		filePath,
		"../.sessions",
		path.basename(filePath),
		sessionKey,
	);

	// Update general session config file
	const sessionConfigData = JSON.stringify(
		{ current: sessionKey },
		undefined,
		4,
	);
	await transactionSystem.stageCreate(
		path.join(sessionDir, "../session.config.json"),
		sessionConfigData,
	);

	// Create the executions directory (if needed)
	const executionsDir = path.join(sessionDir, "executions");

	return {
		languageBin: pythonPath,
		session: sessionKey,
		executionDir: executionsDir,
	};
};

/**
 * POST /execute-many
 *
 * Executes multiple code snippets or nested code lists in sequence.
 *
 * Request body: CodeManyExecutionRequest
 * Response: { message: string }
 */
router.post("/execute-many", async (req: Request, res: Response) => {
	const {
		fileIdCodeList,
		language,
		filePath,
		sessionId,
	}: CodeManyExecutionRequest = req.body;

	// Make sure the fileIdCodeList is provided
	if (fileIdCodeList === undefined) {
		res.status(400).send({ error: "No code provided" });
		return;
	}

	// Make sure the file path is provided
	if (filePath === undefined) {
		logger.error(
			"No file path to the IGC file was provided (filePath) was provided in the request",
		);
		res.status(400).send({ error: "No path provided" });
		return;
	}

	// Currently only python is supported. Change this to support different languages
	if (language === undefined || language !== "python") {
		logger.error("Unsupported language", { language });
		res.status(400).send({ error: "Unsupported language" });
		return;
	}

	// Transaction system for file operations
	const transactionSystem = new FileSystemTransaction();

	// Run the pre-execution step to get the language binary, session key, and execution directory
	let pythonPath: string;
	let sessionKey: string;
	let executionsDir: string;
	try {
		const result = await preExecutionStep(
			transactionSystem,
			language,
			filePath,
			sessionId,
		);
		pythonPath = result.languageBin;
		sessionKey = result.session;
		executionsDir = result.executionDir;
	} catch (error) {
		logger.error("Error in pre-execution step", { error });
		res.status(500).send({ error: "Error in pre-execution step" });
		transactionSystem.rollback();
		return;
	}

	// Run all of the code snippets
	try {
		await executeMultiple(
			transactionSystem,
			fileIdCodeList,
			pythonPath,
			sessionKey,
			executionsDir,
		);
	} catch (error) {
		logger.error("Error executing code snippets", { error });
		res.status(500).send({ error: "Error executing code snippets" });
		transactionSystem.rollback();
		return;
	}

	res.status(200).send({
		message: "All code snippets executed successfully",
	});
	transactionSystem.commit();
	return;
});

/**
 * Executes multiple code snippets or nested code lists in sequence.
 *
 * @param transactionSystem - The file system transaction system to use.
 * @param fileIdCodeList - The list of code snippets or nested lists to execute.
 * @param languageBinPath - The path to the language binary (e.g., Python).
 * @param sessionId - The session ID.
 * @param executionsDir - The directory for execution outputs.
 * @param prevExecutionDir - Optional previous execution directory for state restoration.
 */
export const executeMultiple = async (
	transactionSystem: FileSystemTransaction,
	fileIdCodeList: FileIdCodeList,
	languageBinPath: string,
	sessionId: string,
	executionsDir: string,
	prevExecutionDir?: string,
) => {
	// Recursively execute all the code snippets
	for (const element of fileIdCodeList.elements) {
		// Update the specific session path file
		const currentRunNumber = await addPathToSession(
			transactionSystem,
			element.id,
			executionsDir,
			fileIdCodeList.filePath,
		);

		// Create the run directory
		const executionDir = path.join(executionsDir, `${currentRunNumber}`);

		// Get the previous execution directory (if any)
		prevExecutionDir =
			prevExecutionDir === undefined ||
			currentRunNumber === 1 ||
			(await fs.existsSync(prevExecutionDir)) ||
			(await fs.existsSync(
				path.join(executionsDir, `${currentRunNumber - 1}`),
			))
				? undefined
				: path.join(executionsDir, `${currentRunNumber - 1}`);

		// Check if the element is code or a nested FileIdCodeList
		if (typeof element.data === "string") {
			// It's a code snippet, execute it

			// Generate the execution script
			const script = await prepareExecution(
				transactionSystem,
				element.data,
				executionDir,
				prevExecutionDir,
			);

			// Run the script
			await runExecution(
				transactionSystem,
				script,
				executionDir,
				languageBinPath,
				sessionId,
				prevExecutionDir,
			);
		} else {
			// It's a nested FileIdCodeList, recursively execute it
			const fileIdList = element.data as FileIdCodeList;
			// await fs.ensureDir(subExecutionDir);
			// const subExecutionConfig: SessionConfig  = {
			//     path: fileIdList.elements.map((element) => element.id),
			//     timestamp: Date.now(),
			//     filePath: fileIdList.filePath,
			// };
			// await fs.writeJSON(subExecutionConfigPath, subExecutionConfig);
			await executeMultiple(
				transactionSystem,
				fileIdList,
				languageBinPath,
				sessionId,
				path.join(executionsDir, `${currentRunNumber}`, "executions"),
				path.join(executionsDir, `${currentRunNumber - 1}`),
			);
			const subExecutionDir = path.join(executionDir, "executions");
			const subExecutionConfigPath = path.join(
				subExecutionDir,
				"config.json",
			);
			const subExecutionConfig: SessionConfig = await fs.readJSON(
				subExecutionConfigPath,
			);

			// Aggregate all the files and configurations from the sub-executions
			// Configurations file (take from the most recent sub execution)
			const lastSubExecutionDir = path.join(
				subExecutionDir,
				`${subExecutionConfig.path.length}`,
			);
			await transactionSystem.stageCopy(
				path.join(lastSubExecutionDir, "configuration.json"),
				path.join(executionDir, "configuration.json"),
			);
			// State file (take from the most recent sub execution)
			await transactionSystem.stageCopy(
				path.join(lastSubExecutionDir, "state.pkl"),
				path.join(executionDir, "state.pkl"),
			);
			// Metrics, Stdout, stderr files
			const allSubExecutionDirs =
				await getSubDirectories(subExecutionDir);
			let stdout = "";
			let stderr = "";
			let totalExecutionTime = 0;
			for (const subExecution of allSubExecutionDirs.sort()) {
				// Metrics
				const subExecutionMetricsPath = path.join(
					subExecutionDir,
					subExecution,
					"metrics.json",
				);
				const subExecutionMetrics: CodeExecutionMetrics =
					await fs.readJSON(subExecutionMetricsPath);
				totalExecutionTime += subExecutionMetrics.executionTime;
				// Stdout
				const subExecutionStdoutPath = path.join(
					subExecutionDir,
					subExecution,
					"std.out",
				);
				const subExecutionStdout = await fs.readFile(
					subExecutionStdoutPath,
					"utf8",
				);
				stdout += subExecutionStdout;
				// Stderr
				const subExecutionStderrPath = path.join(
					subExecutionDir,
					subExecution,
					"std.err",
				);
				const subExecutionStderr = await fs.readFile(
					subExecutionStderrPath,
					"utf8",
				);
				stderr += subExecutionStderr;
			}
			// Write the aggregated files
			const metrics = {
				executionTime: totalExecutionTime,
				sessionId: sessionId,
			};
			const metricsPath = path.join(executionDir, "metrics.json");
			await transactionSystem.stageCreate(
				metricsPath,
				JSON.stringify(metrics, null, 4),
			);
			const stdoutPath = path.join(executionDir, "std.out");
			await transactionSystem.stageCreate(stdoutPath, stdout);
			const stderrPath = path.join(executionDir, "std.err");
			await transactionSystem.stageCreate(stderrPath, stderr);
		}
	}
};

const analyzeCode = async ({
	code,
	language,
}: {
	code: string;
	language: string;
}): Promise<CodeAnalysisResponse> => {
	if (language !== "python") {
		console.error("Unsupported language", { language });
		throw new Error("Unsupported language");
	}

	const pythonPath = await checkPythonInstallation();
	if (!pythonPath) {
		console.error("Python is not installed");
		throw new Error("Python is not installed");
	}

	const analysisScriptPath = path.join(
		__dirname,
		"../scripts/python",
		"analyze_code.py",
	);

	return new Promise((resolve, reject) => {
		const pythonProcess = spawn(pythonPath, [analysisScriptPath]);

		let stdout = "";
		let stderr = "";

		pythonProcess.stdout.on("data", (data: Buffer) => {
			stdout += data.toString();
		});

		pythonProcess.stderr.on("data", (data: Buffer) => {
			stderr += data.toString();
		});

		pythonProcess.on("close", (code: number) => {
			if (code !== 0) {
				console.error("Error executing Python code", { error: stderr });
				reject(new Error(stderr));
				return;
			}

			try {
				const analysisResult = JSON.parse(stdout);
				resolve(analysisResult);
			} catch (e) {
				console.error("Error reading analysis result", { error: e });
				reject(new Error(`Error reading analysis result: ${e}`));
			}
		});

		if (pythonProcess.stdin) {
			pythonProcess.stdin.write(code);
			pythonProcess.stdin.end();
		} else {
			reject(new Error("Failed to write to Python process stdin"));
		}
	});
};

router.post("/analyze", async (req: Request, res: Response) => {
	const { code, language }: CodeAnalysisRequest = req.body;

	if (!code) {
		logger.error("No code provided in the request");
		res.status(400).send({ error: "No code provided" });
		return;
	}

	if (language !== "python") {
		logger.error("Unsupported language", { language });
		res.status(400).send({ error: "Unsupported language" });
		return;
	}

	try {
		const result = await analyzeCode({ code, language });
		res.send(result);
	} catch (error) {
		logger.error("Error analyzing code", { error });
		res.status(500).send({ error: error });
	}
});

export default router;
