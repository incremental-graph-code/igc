import React, { ReactNode } from "react";

import { GlobalKeyDownProvider } from "./GlobalKeyDownProvider";

import { useThemeMode } from "@/hooks/useThemeMode";
import { ThemeProvider } from "@mui/material/styles";

import { PopupProvider } from "@/providers/Popup/PopupProvider";



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
	return (
		<GlobalKeyDownProvider>
            <ThemeProvider theme={theme}>
                <PopupProvider>
			        {children}
                </PopupProvider>
            </ThemeProvider>
		</GlobalKeyDownProvider>
	);
};
