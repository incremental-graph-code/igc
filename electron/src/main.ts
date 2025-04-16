import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import { fork, ChildProcess } from "child_process";
import * as httpServer from "http-server";
import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";
import { createCustomLogger } from "shared";

// Load environment variables from the root .env file
dotenvExpand.expand(
	dotenv.config({ path: path.join(__dirname, "../../.env") }),
);

// Logger
const logger = createCustomLogger("electron");

logger.info("Environment variables loaded:", process.env);

let mainWindow: BrowserWindow | null;
let backendServer: ChildProcess | null = null;
let frontendServer: any = null;

const createWindow = async () => {
	logger.info("Creating window...");

	const isDev = process.env.NODE_ENV?.toUpperCase() !== "PRODUCTION";

	logger.info(`Environment: ${process.env.NODE_ENV}`);
	logger.info(`Is Dev: ${isDev}`);

	mainWindow = new BrowserWindow({
		title: "Incremental Graph Code",
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
		icon: path.join(__dirname, "../assets/logo.png"),
		darkTheme: true,
	});

	const appUrl = process.env.FRONTEND_URL || "http://localhost:5174";
	const apiUrl = process.env.BACKEND_URL || "http://localhost:5000";

	logger.info(`App URL: ${appUrl}`);
	logger.info(`API URL: ${apiUrl}`);

	mainWindow.loadURL(appUrl);

	if (isDev) {
		mainWindow.webContents.openDevTools();
	}

	mainWindow.maximize();

	mainWindow.on("closed", () => {
		logger.info("Window closed");
		mainWindow = null;
		if (backendServer) {
			backendServer.kill();
		}
		if (frontendServer) {
			frontendServer.close();
		}
		app.quit();
	});
};

const startBackend = () => {
	let backendPath = path.resolve(__dirname, "../../backend/dist/index.js");
    let backendCWD = path.resolve(__dirname, "../../backend");

	if (process.env.PACKAGED?.toUpperCase() === "TRUE") {
		logger.info("Running in packaged mode");
		backendPath = path.join(__dirname, "../../backend/dist/index.js");
        backendCWD = path.join(__dirname, "../../backend");
	}
	logger.info(`Backend Path: ${backendPath}`);

	backendServer = fork(backendPath, [], {
		silent: true,
		env: {
			...process.env,
			ELECTRON_RUN_AS_NODE: "1",
		},
        cwd: backendCWD
	});

	backendServer.on("error", (err) => {
		logger.error("Failed to start backend:", err);
	});

	backendServer.on("close", (code) => {
		logger.info(`Backend process exited with code ${code}`);
	});

	if (backendServer.stdout) {
		backendServer.stdout.on("data", (data) => {
			logger.info(`Backend: ${data}`);
		});
	} else {
		logger.error("Backend stdout is null");
	}

	if (backendServer.stderr) {
		backendServer.stderr.on("data", (data) => {
			logger.error(`Backend error: ${data}`);
		});
	} else {
		logger.error("Backend stderr is null");
	}
};

const startFrontend = () => {
	const frontendPath = path.join(__dirname, "../../frontend/dist");
	logger.info(`Frontend Path: ${frontendPath}`);

	frontendServer = httpServer.createServer({ root: frontendPath });
	frontendServer.listen(process.env.FRONTEND_PORT || 5174, () => {
		logger.info(
			`Frontend server started at ${
				process.env.FRONTEND_URL || "http://localhost:5174"
			}`,
		);
	});
};

app.on("ready", async () => {
	logger.info("App is ready");
	startBackend();
	startFrontend();
	await createWindow();
});

app.on("window-all-closed", () => {
	logger.info("All windows closed");
	if (backendServer) {
		backendServer.kill();
	}
	if (frontendServer) {
		frontendServer.close();
	}
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", async () => {
	logger.info("App activated");
	if (BrowserWindow.getAllWindows().length === 0) {
		await createWindow();
	}
});

ipcMain.handle("select-directory", async () => {
	logger.info("Select directory invoked");
	const result = await dialog.showOpenDialog({
		properties: ["openDirectory"],
	});
	return result.filePaths;
});
