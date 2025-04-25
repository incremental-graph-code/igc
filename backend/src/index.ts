import express from "express";
import cors from "cors";
import fileExplorerRoutes from "./routes/file-explorer";
import codeHandlerRoutes from "./routes/code-handler";
import requestLogger from "./middleware/requestLogger";
import { join } from 'path'
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import {__dirname} from "./utils/file";

// Read from .env file
dotenvExpand.expand(
	dotenv.config({ path: join(__dirname, '../../.env') }),
);

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || "5001");

app.use(express.json());//

// Configure CORS
const corsOptions = {
	origin: process.env.FRONTEND_URL,
	optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Use the request logger middleware
app.use(requestLogger);

// Root route
app.get("/", (_, res) => {
	res.send("Welcome to the Backend Server of IGC!");
});

app.use("/api/file-explorer", fileExplorerRoutes);
app.use("/api/code-handler", codeHandlerRoutes);

app.listen(PORT, () => {
	console.log(
		`Server running on ${
			process.env.BACKEND_URL || "http://localhost:" + PORT
		}`,
	);
});
