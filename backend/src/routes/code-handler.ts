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
	createCustomLogger,
	FileIdCodeList,
	SessionConfig,
} from "shared";
import { spawn, execFile } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { getSubDirectories } from "./file-explorer";

const router = Router();

// Logger
const logger = createCustomLogger("backend");

const checkPythonInstallation = (): Promise<string | null> => {
	const languageDir = path.join(__dirname, "../../../languages");
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
 * Function to append a path to the session file
 *
 * * This will also update the config timestamp
 *
 * @param {string} nextNode - The node to append to the path
 * @param {string} executionPath - The execution directory path of the session
 * @returns {Promise<number>} - The current run number
 */
const addPathToSession = async (
	nextNode: string,
	executionPath: string,
    filePath: string,
): Promise<number> => {
	const fileConfigPath = `${executionPath}/config.json`;

	const data: SessionConfig = { path: [], timestamp: Date.now(), filePath: filePath };

	try {
		// Check if the file exists
		const fileExists = await fs
			.access(fileConfigPath)
			.then(() => true)
			.catch(() => false);

		if (fileExists) {
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
		await fs.writeFile(
			fileConfigPath,
			JSON.stringify(data, null, 4),
			"utf8",
		);
		console.log("File updated successfully!");

		// Return the current length of the list
		return data.path.length;
	} catch (err) {
		console.error("Error handling the file:", err);
		return -1; // Error case
	}
};

export const executeCode = async (
	code: string,
	languageBinPath: string,
	sessionId: string,
    executionDir: string,
    prevExecutionDir: string,
): Promise<Omit<CodeExecutionResponse, "metaNodeData">> => {

	await fs.mkdir(executionDir, { recursive: true });

	const stateFilePath = path.join(executionDir, "state.pkl");
	const configFilePath = path.join(executionDir, "configuration.json");
	const prevStateFilePath = path.join(prevExecutionDir, "state.pkl");
	const prevConfigFilePath = path.join(
		prevExecutionDir,
		"configuration.json",
	);
	const scriptFilePath = path.join(executionDir, "script.py");

	const completeCode = `
import dill as IGC_RUN_VARIABLE_DILL
import json as IGC_RUN_VARIABLE_JSON
import os as IGC_RUN_VARIABLE_OS
import types as IGC_RUN_VARIABLE_TYPES

state = {}
config = {}

# Paths for temporary files
IGC_RUN_VARIABLE_prevStateFilePath = "${prevStateFilePath
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')}"

# Save the initial state to compare later
IGC_RUN_VARIABLE_initial_globals = set(globals().keys())

# Load initial state if it exists
if IGC_RUN_VARIABLE_OS.path.exists(IGC_RUN_VARIABLE_prevStateFilePath):
    IGC_RUN_VARIABLE_DILL.load_session(IGC_RUN_VARIABLE_prevStateFilePath)

IGC_RUN_VARIABLE_stateFilePath = "${stateFilePath
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')}"
IGC_RUN_VARIABLE_configFilePath = "${configFilePath
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')}"

# User code
${code}

# Capture the state of all variables
IGC_RUN_VARIABLE_global_items = list(globals().items())
config = {}

for IGC_RUN_VARIABLE_key, IGC_RUN_VARIABLE_value in IGC_RUN_VARIABLE_global_items:
    if IGC_RUN_VARIABLE_key not in IGC_RUN_VARIABLE_initial_globals and not IGC_RUN_VARIABLE_key.startswith('IGC_RUN_VARIABLE_'):
        if isinstance(IGC_RUN_VARIABLE_value, (int, float, str, bool, dict, list, tuple, set)):
            config[IGC_RUN_VARIABLE_key] = IGC_RUN_VARIABLE_value
        elif isinstance(IGC_RUN_VARIABLE_value, IGC_RUN_VARIABLE_TYPES.FunctionType):
            config[IGC_RUN_VARIABLE_key] = "<function>"
        elif isinstance(IGC_RUN_VARIABLE_value, type):
            config[IGC_RUN_VARIABLE_key] = "<class>"
        else:
            config[IGC_RUN_VARIABLE_key] = f"<{type(IGC_RUN_VARIABLE_value).__name__}>"

# Save the state for the next execution
IGC_RUN_VARIABLE_DILL.dump_session(IGC_RUN_VARIABLE_stateFilePath)

# Save the config to a separate JSON file
with open(IGC_RUN_VARIABLE_configFilePath, "w") as IGC_RUN_VARIABLE_configFile:
    IGC_RUN_VARIABLE_JSON.dump(config, IGC_RUN_VARIABLE_configFile, default=str)
    IGC_RUN_VARIABLE_configFile.flush()
`;

	await fs.writeFile(scriptFilePath, completeCode);

	return new Promise((resolve, reject) => {
		const startTime = process.hrtime();
		logger.info("Executing Python code", { sessionId, code });

		const pythonProcess = spawn(languageBinPath, [scriptFilePath]);

		let stdout = "";
		let stderr = "";

		pythonProcess.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		pythonProcess.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		pythonProcess.on("close", async () => {
			const endTime = process.hrtime(startTime);
			const execTime = endTime[0] * 1000 + endTime[1] / 1000000; // Execution time in milliseconds

			let config = {};
			try {
				if (fs.existsSync(configFilePath)) {
					config = JSON.parse(
						await fs.readFile(configFilePath, "utf8"),
					);
				} else {
					logger.error(
						"Config file does not exist. Copying the previous one here...",
						{ sessionId },
					);
					await fs.copyFile(prevConfigFilePath, configFilePath);
					config = JSON.parse(
						await fs.readFile(prevConfigFilePath, "utf8"),
					);
				}
				if (!fs.existsSync(stateFilePath)) {
					logger.error(
						"State file does not exist. Copying the previous one here...",
						{ sessionId },
					);
					await fs.copyFile(prevStateFilePath, stateFilePath);
				}
			} catch (e) {
				logger.error(
					"Error reading config or combined result after execution",
					{ error: e },
				);
				reject(e); // Reject the promise if there's an error
				return;
			}

			const metrics = {
				executionTime: execTime,
				sessionId: sessionId,
			};

			// Log the result of execution
			await fs.writeFile(path.join(executionDir, "std.out"), stdout);
			await fs.writeFile(path.join(executionDir, "std.err"), stderr);
			await fs.writeFile(
				path.join(executionDir, "metrics.json"),
				JSON.stringify(metrics, null, 4),
			);

			const result: Omit<CodeExecutionResponse, "metaNodeData"> = {
				output: stdout,
				error: stderr,
				metrics: metrics,
				configuration: config,
			};

			if (stderr) {
				logger.error("Error executing Python code", {
					sessionId,
					error: stderr,
				});
			} else {
				logger.info("Python code executed successfully", {
					sessionId,
					result,
				});
			}

			// Clean up temporary script file but keep the state file
			await fs.unlink(scriptFilePath);

			// Resolve the result
			resolve(result);
		});

		pythonProcess.on("error", (err) => {
			logger.error("Python process failed to start", { error: err });
			reject(err); // Reject if there's an error starting the process
		});
	});
};

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
		return res.status(400).send({ error: "No code provided" });
	}
	if (!filePath) {
		logger.error(
			"No file path to the IGC file was provided (filePath) was provided in the request",
		);
		return res.status(400).send({ error: "No path provided" });
	}

	// Currently only python is supported. Change this to support different languages
	if (language !== "python") {
		logger.error("Unsupported language", { language });
		return res.status(400).send({ error: "Unsupported language" });
	}

	const pythonPath = await checkPythonInstallation();
	if (!pythonPath) {
		logger.error("Python is not installed");
		return res.status(500).send({ error: "Python is not installed" });
	}
	const sessionKey = sessionId ?? uuidv4();

	const sessionDir = path.join(
		filePath,
		"../.sessions",
		path.basename(filePath),
		sessionKey,
	);
	if (!fs.existsSync(sessionDir)) {
		await fs.mkdir(sessionDir, { recursive: true });
	}
	// Update general session config file
	const sessionConfigData = JSON.stringify(
		{ current: sessionKey },
		undefined,
		4,
	);
	await fs.writeFile(
		path.join(sessionDir, "../session.config.json"),
		sessionConfigData,
		"utf8",
	);

	// Create the executions directory (if needed)
	const executionsDir = path.join(sessionDir, "executions");
	if (!fs.existsSync(executionsDir)) {
		await fs.mkdir(executionsDir, { recursive: true });
	}

	// Get analysis data
	let metaNodeData: CodeAnalysisResponse = {
        dependencies: {
            variables: [],
            functions: [],
            classes: [],
            modules: []
        },
        new_definitions: {
            variables: [],
            functions: [],
            classes: []
        }
    };
	// try {
	// 	metaNodeData = await analyzeCode({ code, language });
	// } catch (error) {
	// 	logger.error("Error analyzing code", { error });
	// 	return;
	// }
    // Update the specific session path file
	const currentRunNumber = await addPathToSession(nodeId, executionsDir, filePath);

	// Create the run directory
	const executionDir = path.join(executionsDir, `${currentRunNumber}`);
	const prevExecutionDir = path.join(
		executionsDir,
		`${currentRunNumber - 1}`,
	);

	return res.send({
		...(await executeCode(code, pythonPath, sessionKey, executionDir, prevExecutionDir)),
		metaNodeData: metaNodeData,
	});
});

router.post("/execute-many", async (req: Request, res: Response) => {
	const {
        fileIdCodeList,
		language,
		filePath,
		sessionId,
	}: CodeManyExecutionRequest = req.body;

	if (!fileIdCodeList) {
		logger.error("No code was provided in the request");
		return res.status(400).send({ error: "No code provided" });
	}
	if (!filePath) {
		logger.error(
			"No file path to the IGC file was provided (filePath) was provided in the request",
		);
		return res.status(400).send({ error: "No path provided" });
	}

	// Currently only python is supported. Change this to support different languages
	if (language !== "python") {
		logger.error("Unsupported language", { language });
		return res.status(400).send({ error: "Unsupported language" });
	}

	const pythonPath = await checkPythonInstallation();
	if (!pythonPath) {
		logger.error("Python is not installed");
		return res.status(500).send({ error: "Python is not installed" });
	}
	const sessionKey = sessionId ?? uuidv4();

	const sessionDir = path.join(
		filePath,
		"../.sessions",
		path.basename(filePath),
		sessionKey,
	);
	if (!fs.existsSync(sessionDir)) {
		await fs.mkdir(sessionDir, { recursive: true });
	}
	// Update general session config file
	const sessionConfigData = JSON.stringify(
		{ current: sessionKey },
		undefined,
		4,
	);
	await fs.writeFile(
		path.join(sessionDir, "../session.config.json"),
		sessionConfigData,
		"utf8",
	);

	// Create the executions directory (if needed)
	const executionsDir = path.join(sessionDir, "executions");

    // Run all of the code snippets
    await executeMultiple(fileIdCodeList, pythonPath, sessionKey, executionsDir);

    return res.status(200).send({ message: "All code snippets executed successfully" });
});

export const executeMultiple = async (fileIdCodeList: FileIdCodeList, languageBinPath: string, sessionId: string, executionsDir: string, prevExecutionDir?: string) => {
    // Create executions directory if it doesn't exist
    if (!fs.existsSync(executionsDir)) {
		await fs.mkdir(executionsDir, { recursive: true });
	}
    
    // Recursively execute all the code snippets
    for (const element of fileIdCodeList.elements) {
        // Update the specific session path file
        const currentRunNumber = await addPathToSession(element.id, executionsDir, fileIdCodeList.filePath);

        // Create the run directory
        const executionDir = path.join(executionsDir, `${currentRunNumber}`);
        const pExecutionDir = prevExecutionDir !== undefined && currentRunNumber === 1 ? prevExecutionDir : path.join(
            executionsDir,
            `${currentRunNumber - 1}`,
        );
        fs.ensureDir(executionDir);

        if (typeof element.data === 'string') {
            // It's a code snippet, execute it
            await executeCode(element.data, languageBinPath, sessionId, executionDir, pExecutionDir);
        } else {
            // It's a nested FileIdCodeList, recursively execute it
            const fileIdList = element.data as FileIdCodeList
            const subExecutionDir = path.join(executionDir, "executions");
            await fs.ensureDir(subExecutionDir);
            // const subExecutionConfig: SessionConfig  = {
                //     path: fileIdList.elements.map((element) => element.id),
                //     timestamp: Date.now(),
                //     filePath: fileIdList.filePath,
                // };
                // await fs.writeJSON(subExecutionConfigPath, subExecutionConfig);
            await executeMultiple(fileIdList, languageBinPath, sessionId, path.join(executionsDir, `${currentRunNumber}`, "executions"), path.join(executionsDir, `${currentRunNumber-1}`));
            const subExecutionConfigPath = path.join(subExecutionDir, "config.json");
            const subExecutionConfig: SessionConfig = await fs.readJSON(subExecutionConfigPath);

            // Aggregate all the files and configurations from the sub-executions
            // Configurations file (take from the most recent sub execution)
            const lastSubExecutionDir = path.join(subExecutionDir, `${subExecutionConfig.path.length}`);
            await fs.copyFile(path.join(lastSubExecutionDir, "configuration.json"), path.join(executionDir, "configuration.json"));
            // State file (take from the most recent sub execution)
            await fs.copyFile(path.join(lastSubExecutionDir, "state.pkl"), path.join(executionDir, "state.pkl"));
            // Metrics, Stdout, stderr files
            const allSubExecutionDirs = await getSubDirectories(subExecutionDir);
            let stdout = "";
            let stderr = "";
            let totalExecutionTime = 0;
            for (const subExecution of allSubExecutionDirs.sort()) {
                // Metrics
                const subExecutionMetricsPath = path.join(subExecutionDir, subExecution, "metrics.json");
                const subExecutionMetrics: CodeExecutionMetrics = await fs.readJSON(subExecutionMetricsPath);
                totalExecutionTime += subExecutionMetrics.executionTime;
                // Stdout
                const subExecutionStdoutPath = path.join(subExecutionDir, subExecution, "std.out");
                const subExecutionStdout = await fs.readFile(subExecutionStdoutPath, "utf8");
                stdout += subExecutionStdout;
                // Stderr
                const subExecutionStderrPath = path.join(subExecutionDir, subExecution, "std.err");
                const subExecutionStderr = await fs.readFile(subExecutionStderrPath, "utf8");
                stderr += subExecutionStderr;
            }
            // Write the aggregated files
            const metrics = {
                executionTime: totalExecutionTime,
                sessionId: sessionId,
            };
            const metricsPath = path.join(executionDir, "metrics.json");
            await fs.writeJSON(metricsPath, metrics);
            const stdoutPath = path.join(executionDir, "std.out");
            await fs.writeFile(stdoutPath, stdout);
            const stderrPath = path.join(executionDir, "std.err");
            await fs.writeFile(stderrPath, stderr);
        }
    }
}

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
		return res.status(400).send({ error: "No code provided" });
	}

	if (language !== "python") {
		logger.error("Unsupported language", { language });
		return res.status(400).send({ error: "Unsupported language" });
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
