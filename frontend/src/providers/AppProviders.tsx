import React, { ReactNode } from "react";

import { GlobalKeyDownProvider } from "./GlobalKeyDownProvider";

import { useThemeMode } from "@/hooks/useThemeMode";
import { ThemeProvider } from "@mui/material/styles";

import { PopupProvider } from "@/providers/Popup/PopupProvider";
import { ContextMenuProvider } from "./ContextMenuProvider";
import { Toaster } from "react-hot-toast";
import { getSyncAdapter, registerSyncSystem } from "@/utils/syncRegistry";
import { SyncSystem } from "@/adapters/consts";
import useStore from "@/store/store";

interface AppProvidersProps {
	children: ReactNode;
}

/**
 * AppProviders
 *
 * Wraps multiple context providers (Theme, Auth, Settings) into one component,
 * so you only use a single wrapper for your entire application.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
	const [theme] = useThemeMode();

	if (!getSyncAdapter(SyncSystem.Text)) {
		registerSyncSystem({
			id: SyncSystem.Text,
			get: () => useStore.getState().bufferText,
			set: (v) => useStore.getState().setBufferText(v),
			serialize: (v) => v,
			deserialize: (v) => v,
		});
	}
	return (
		<GlobalKeyDownProvider>
			<ThemeProvider theme={theme}>
				<PopupProvider>
					<ContextMenuProvider>
						{children}
						<Toaster />
					</ContextMenuProvider>
				</PopupProvider>
			</ThemeProvider>
		</GlobalKeyDownProvider>
	);
};
