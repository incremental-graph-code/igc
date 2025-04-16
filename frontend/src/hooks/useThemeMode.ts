import { useEffect } from "react";
import { createTheme, Theme } from "@mui/material/styles";
import useStore from "@/store/store";
import { lightTheme, darkTheme } from "@/styles/theme";

export const useThemeMode = (): [Theme, () => void, "light" | "dark"] => {
    const mode = useStore((state) => state.mode);
    const setMode = useStore((state) => state.setMode);

	useEffect(() => {
		const savedMode = localStorage.getItem("theme") as
			| "light"
			| "dark"
			| null;
		if (savedMode !== null) {
			setMode(() => savedMode);
		} else {
			const systemPrefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			setMode(() => systemPrefersDark ? "dark" : "light");
		}
	}, []);

	useEffect(() => {
		localStorage.setItem("theme", mode);
	}, [mode]);

	const toggleThemeMode = () => {
		setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
	};

	return [mode === "light" ? lightTheme : darkTheme, toggleThemeMode, mode];
};
