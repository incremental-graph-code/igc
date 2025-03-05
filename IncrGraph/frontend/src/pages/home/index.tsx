import React, { useEffect, useState } from "react";
import RootPage from "../root";
import FileExplorer from "../../components/FileExplorer";
import GraphEditor from "../../components/GraphEditor";
import FileEditor from "../../components/FileEditor";
import "./home.css";
import useConfirmDialog from "@components/ConfirmDialog/useConfirmDialog";
import useTextDialog from "@/components/TextDialog/useTextDialog";
import { useComponentRegistry } from "@/hooks/useComponentRegistry";
import LoadingScreen from "@/components/LoadingScreen";
import { fetchAndRegisterComponents } from "@/utils/componentCache";
import { ThemeProvider } from "@mui/material/styles";
import { useThemeMode } from "@/hooks/useThemeMode";

const HomePage: React.FC = () => {
	// Variables
	const { openConfirmDialog, ConfirmDialogPortal } = useConfirmDialog();
	const { openTextDialog, TextDialogPortal } = useTextDialog();

	const [isLoading, setIsLoading] = useState(true);
	const { registerComponent } = useComponentRegistry();

	useEffect(() => {
		fetchAndRegisterComponents(registerComponent).then(() => {
			setIsLoading(false); // Components loaded, hide loading screen
		});
	}, []);

	// For importing and categorizing components
    const [theme] = useThemeMode();
	if (isLoading) {

		return (
			<ThemeProvider theme={theme}>
				<LoadingScreen />
			</ThemeProvider>
		);
	}

	return (
		<RootPage>
			<div className="app-container">
				<>
					<FileExplorer openTextDialog={openTextDialog} />
					<GraphEditor />
					<FileEditor openConfirmDialog={openConfirmDialog} />
					<ConfirmDialogPortal />
					<TextDialogPortal />
				</>
			</div>
		</RootPage>
	);
};

export default HomePage;
