import fs from "fs-extra";
import path from "path";
import { CodeExecutionMetrics, CodeExecutionResponse } from "shared";
import { createCustomLogger } from "shared/server";
import { spawn } from "child_process";
import { FileSystemTransaction } from "./FileSystemTransaction";

// Logger
const logger = createCustomLogger("backend");

/**
 * Prepares the Python script file to be executed.
 * Includes boilerplate for capturing state and configuration.
 *
 * @param transactionSystem - File system transaction manager for staging changes.
 * @param code - The user-provided code.
 * @param executionDir - Directory where execution artifacts will be stored.
 * @param prevExecutionDir - Optional previous execution directory for restoring state.
 * @returns The full path to the generated script file.
 */
export const prepareExecution = async (
	transactionSystem: FileSystemTransaction,
	code: string,
	executionDir: string,
	prevExecutionDir?: string,
): Promise<string> => {
	// Get the script path
	const scriptFilePath = path.join(executionDir, "script.py");

    // Create a blank state and configuration file for python to override later
    const stateFilePath = path.join(executionDir, "state.pkl");
    await transactionSystem.stageCreate(stateFilePath, "");
    const configFilePath = path.join(executionDir, "configuration.json");
    await transactionSystem.stageCreate(configFilePath, "{}");


	// Create the script code
	let completeCode = `import dill as IGC_RUN_VARIABLE_DILL
import json as IGC_RUN_VARIABLE_JSON
import os as IGC_RUN_VARIABLE_OS
import types as IGC_RUN_VARIABLE_TYPES

state = {}
config = {}

# Save the initial state to compare later
IGC_RUN_VARIABLE_initial_globals = set(globals().keys())
`;

	if (prevExecutionDir !== undefined) {
		completeCode += `
IGC_RUN_VARIABLE_prevStateFilePath = "${path
			.join(prevExecutionDir, "state.pkl")
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"')}"
if IGC_RUN_VARIABLE_OS.path.exists(IGC_RUN_VARIABLE_prevStateFilePath):
    IGC_RUN_VARIABLE_DILL.load_session(IGC_RUN_VARIABLE_prevStateFilePath)
`;
	}

	completeCode += `
IGC_RUN_VARIABLE_stateFilePath = "${stateFilePath
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')}"
IGC_RUN_VARIABLE_configFilePath = "${configFilePath
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')}"

# User code
${code}

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

IGC_RUN_VARIABLE_DILL.dump_session(IGC_RUN_VARIABLE_stateFilePath)
with open(IGC_RUN_VARIABLE_configFilePath, "w") as IGC_RUN_VARIABLE_configFile:
    IGC_RUN_VARIABLE_JSON.dump(config, IGC_RUN_VARIABLE_configFile, default=str)
    IGC_RUN_VARIABLE_configFile.flush()
`;

    // Write the complete code to the script file
	await transactionSystem.stageCreate(scriptFilePath, completeCode);
	return scriptFilePath;
};

/**
 * Executes the prepared Python script and gathers outputs.
 * Also restores previous state/config if necessary.
 *
 * @param transactionSystem - File system transaction manager for staging changes.
 * @param scriptPath - Path to the generated script.
 * @param executionDir - Directory where outputs will be written.
 * @param pythonPath - Python binary path.
 * @param sessionId - Unique session identifier.
 * @param prevExecutionDir - Optional previous run to restore state/config.
 * @returns The result of the execution including output, error, and metrics.
 */
export const runExecution = async (
    transactionSystem: FileSystemTransaction,
	scriptPath: string,
	executionDir: string,
	pythonPath: string,
	sessionId: string,
	prevExecutionDir?: string,
): Promise<Omit<CodeExecutionResponse, "metaNodeData">> => {
	const configFilePath = path.join(executionDir, "configuration.json");
	const stateFilePath = path.join(executionDir, "state.pkl");

	return new Promise((resolve, reject) => {
		const startTime = process.hrtime();
		const proc = spawn(pythonPath, [scriptPath]);
		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (data) => {
			stdout += data.toString();
		});

		proc.stderr.on("data", (data) => {
			stderr += data.toString();
		});

		proc.on("close", async () => {
			const endTime = process.hrtime(startTime);
			const execTime = endTime[0] * 1000 + endTime[1] / 1e6;
			let config = {};

			try {
				if (await fs.pathExists(configFilePath)) {
					config = await fs.readJSON(configFilePath);
				} else if (prevExecutionDir) {
					logger.error("Config missing, using previous.");
					const prevConfig = path.join(
						prevExecutionDir,
						"configuration.json",
					);
					await transactionSystem.stageCopy(prevConfig, configFilePath);
					config = await fs.readJSON(configFilePath);
				}

				if (
					!(await fs.pathExists(stateFilePath)) &&
					prevExecutionDir !== undefined
				) {
					logger.error("State missing, using previous.");
					await transactionSystem.stageCopy(
						path.join(prevExecutionDir, "state.pkl"),
						stateFilePath,
					);
				}
			} catch (e) {
				logger.error("Error finalizing execution", { error: e });
				reject(e);
				return;
			}

			const metrics: CodeExecutionMetrics = {
				executionTime: execTime,
				sessionId,
			};

			await transactionSystem.stageCreate(path.join(executionDir, "std.out"), stdout);
			await transactionSystem.stageCreate(path.join(executionDir, "std.err"), stderr);
			await transactionSystem.stageCreate(
				path.join(executionDir, "metrics.json"),
				JSON.stringify(metrics, null, 4),
			);

			const result = {
				output: stdout,
				error: stderr,
				metrics,
				configuration: config,
			};

			if (stderr) {
				logger.error("Execution error", { sessionId, error: stderr });
			} else {
				logger.info("Execution successful", { sessionId });
			}

			resolve(result);
		});

		proc.on("error", (err) => {
			logger.error("Python execution failed", { error: err });
			reject(err);
		});
	});
};
