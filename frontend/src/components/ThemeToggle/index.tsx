import React from "react";
import IconButton from "@mui/material/IconButton";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "@/hooks/useThemeMode";

const ThemeToggle: React.FC = () => {
	const [, toggleThemeMode, mode] = useThemeMode();

	return (
		<IconButton onClick={toggleThemeMode} color="inherit">
			{mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
		</IconButton>
	);
};

export default ThemeToggle;
