import { createTheme, Theme, ThemeOptions } from "@mui/material/styles";
import { deepmerge } from "@mui/utils";
import { STYLES } from "./constants";

const defaultTheme: ThemeOptions = {
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					transition: "all 0.3s ease",
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					"& .MuiIconButton-root": {
						borderRadius: "5px",
					},
				},
			},
		},
        MuiTab: {
            styleOverrides: {
                root: {
                    "&.Mui-selected": {
                        color: STYLES.primary,
                    },
                    height: STYLES.tabHeight,
                    minHeight: STYLES.tabHeight,
                    padding: "0px 10px",
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    "& .MuiTabs-indicator": {
						backgroundColor: STYLES.primary,
					},
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    color: "var(--mui-text-primary)",
                },
            },
        }
	},
};

// Light Theme
export const lightTheme: Theme = createTheme(
	deepmerge(defaultTheme, {
		cssVariables: true,
		palette: {
			mode: "light",
			background: {
				default: STYLES.mainBackgroundAccentColorLight,
				paper: STYLES.mainBackgroundColorLight,
                pure: STYLES.mainBackgroundPureColorLight,
                hover: STYLES.mainBackgroundHoverColorLight,
                selected: STYLES.mainBackgroundSelectedColorLight,
			},
			text: {
				primary: STYLES.mainFontColorLight,
				secondary: STYLES.mainFontAccentColorLight,
			},
			primary: {
				main: STYLES.mainFontAccentColorLight,
				contrastText: STYLES.mainFontColorLight,
			},
		},
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: STYLES.mainBackgroundColorLight,
                    },
                },
            }
        }
	}),
);

// Dark Theme
export const darkTheme: Theme = createTheme(
	deepmerge(defaultTheme, {
		cssVariables: true,
		palette: {
			mode: "dark",
			background: {
				default: STYLES.mainBackgroundAccentColorDark,
				paper: STYLES.mainBackgroundColorDark,
                pure: STYLES.mainBackgroundPureColorDark,
                hover: STYLES.mainBackgroundHoverColorDark,
                selected: STYLES.mainBackgroundSelectedColorDark,
			},
			text: {
				primary: STYLES.mainFontColorDark,
				secondary: STYLES.mainFontAccentColorDark,
			},
			primary: {
				main: STYLES.mainFontAccentColorDark,
				contrastText: STYLES.mainFontColorDark,
			},   
		},
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: STYLES.mainBackgroundColorDark,
                    },
                },
            }
        }
	}),
);

// const theme = createTheme({
// 	palette: {
// 		mode: "light",
// 		// mode: "dark",
// 		primary: {
// 			main: "#0096ed",
// 		},
// 		background: {
// 			default: STYLES.mainBackgroundAccentColor,
// 			paper: STYLES.mainBackgroundColor,
// 		},
// 		text: {
// 			primary: STYLES.mainFontColor,
// 		},
// 	},
// 	components: {
// 		MuiIconButton: {
// 			styleOverrides: {
// 				root: {
// 					color: STYLES.mainFontColor,
// 					borderRadius: "4px",
// 				},
// 			},
// 		},
// 		MuiCheckbox: {
// 			styleOverrides: {
// 				root: {
// 					// color: "#ffffff",
// 					// "&.Mui-checked": {
// 					// 	color: "#3f51b5",
// 					// },
// 				},
// 			},
// 		},
// 		MuiPaper: {
// 			styleOverrides: {
// 				root: {
// 					backgroundColor: STYLES.mainBackgroundColor,
// 					color: STYLES.mainFontColor,
// 				},
// 			},
// 		},
// 		MuiSvgIcon: {
// 			// styleOverrides: {
// 			// 	root: {
// 			// 		color: "#3f86b5",
// 			// 	},
// 			// },
// 		},
// 	},
// });
