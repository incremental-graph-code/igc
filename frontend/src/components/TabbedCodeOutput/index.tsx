import React, { useEffect, useRef, useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import ConfigurationDisplay from "../ConfigurationDisplay";
import "@xterm/xterm/css/xterm.css";
import "./TabbedCodeOutput.css";
import { STYLES } from "@/styles/constants";
import { IGCCodeNodeExecution } from "shared";
import useStore from "@/store/store";

interface TabbedCodeOutputProps {
	executionData: IGCCodeNodeExecution | undefined;
}

const TabbedCodeOutput: React.FC<TabbedCodeOutputProps> = ({
	executionData,
}) => {
	const [activeTab, setActiveTab] = useState(0);
	const terminalRefs = useRef<(HTMLDivElement | null)[]>([]);
	const terminals = useRef<(Terminal | null)[]>([]);
	const fitAddons = useRef<(FitAddon | null)[]>([]);
	const theme = useStore((state) => state.mode);

	useEffect(() => {
		terminalRefs.current.forEach((ref, index) => {
			if (ref && !terminals.current[index]) {
				console.log(`Initializing terminal ${index}`);

				// Initialize FitAddon
				const fitAddon = new FitAddon();
				fitAddons.current[index] = fitAddon;

				const terminal = new Terminal({
					theme: {
						background:
							theme === "light"
								? STYLES.mainBackgroundColorLight
								: STYLES.mainBackgroundColorDark,
						cursor:
							theme === "light"
								? STYLES.mainBackgroundColorLight
								: STYLES.mainBackgroundColorDark,
					},
					cursorStyle: "block",
					cursorBlink: false,
				});

				terminal.loadAddon(fitAddon);
				terminal.open(ref);
				fitAddon.fit(); // Fit the terminal on load

				terminals.current[index] = terminal;
			}
		});

		return () => {
			terminals.current.forEach((terminal) => terminal?.dispose());
		};
	}, [theme]);

	useEffect(() => {
		// Write to the terminals when executionData changes
		terminals.current.forEach((terminal, index) => {
			terminal?.clear();
			if (index === 0) {
                if(executionData && executionData.stdout !== ""){
                    const stdoutVals = executionData.stdout.split("\n");
                    for(let i = 0; i < stdoutVals.length; i++){
                        terminal?.writeln(
                            `${theme === "light" ? "\x1b[30m" : ""}${stdoutVals[i]}`
                        );
                    }
				    
                }
                else{
                    terminal?.writeln(`${theme === "light" ? "\x1b[30m" : ""}<No output>`);
                }
			} else if (index === 1) {
                if(executionData && executionData.stderr !== ""){
                    const stderrVals = executionData.stderr.split("\n");
                    for(let i = 0; i < stderrVals.length; i++){
                        terminal?.writeln(
                            `${theme === "light" ? "\x1b[30m" : ""}${stderrVals[i]}`
                        );
                    }
				    
                }
                else{
                    terminal?.writeln(`${theme === "light" ? "\x1b[30m" : ""}<No errors>`);
                }
			}
		});
	}, [executionData, theme]);

	useEffect(() => {
		// Fit terminals when the active tab changes
		fitAddons.current.forEach((fitAddon) => fitAddon?.fit());
	}, [activeTab]);

	useEffect(() => {
		// Fit terminals when the window resizes
		const handleResize = () => {
			fitAddons.current.forEach((fitAddon) => fitAddon?.fit());
		};
		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	return (
		<Box className="tabbed-code-output">
			<div style={{ whiteSpace: "nowrap" }}>
				<div style={{ overflowX: "scroll", scrollbarWidth: "none" }}>
					<Tabs
						value={activeTab}
						onChange={handleTabChange}
						className="tabbed-code-output-tabs"
					>
						<Tab
							label="Output"
							className="tabbed-code-output-tab"
						/>
						<Tab
							label="Errors"
							className="tabbed-code-output-tab"
						/>
						<Tab
							label="Configuration"
							className="tabbed-code-output-tab"
						/>
						<Tab
							label="Metrics"
							className="tabbed-code-output-tab"
						/>
					</Tabs>
				</div>
			</div>

			<Box className="tabbed-code-output-container">
				<Box
					ref={(el: HTMLDivElement | null) =>
						(terminalRefs.current[0] = el)
					}
					className={`tabbed-code-output-terminal ${
						activeTab === 0 ? "" : "hidden"
					}`}
				/>
				<Box
					ref={(el: HTMLDivElement | null) =>
						(terminalRefs.current[1] = el)
					}
					className={`tabbed-code-output-terminal ${
						activeTab === 1 ? "" : "hidden"
					}`}
				/>
				{activeTab === 2 && (
					<ConfigurationDisplay
						data={
							executionData
								? executionData.configuration
								: "No Configuration Available"
						}
					/>
				)}
				{activeTab === 3 && (
					<ConfigurationDisplay
						data={
							executionData
								? executionData.metrics
								: "No Metrics Available"
						}
					/>
				)}
			</Box>
		</Box>
	);
};

export default TabbedCodeOutput;
