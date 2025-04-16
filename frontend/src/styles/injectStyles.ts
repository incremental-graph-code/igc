import { STYLES } from "./constants";

export const injectCSSVariables = () => {
	const style = document.createElement("style");
	const cssVariables = Object.keys(STYLES)
		.map(
			(key: string) => `--${key}: ${STYLES[key as keyof typeof STYLES]};`,
		)
		.join(" ");
	style.innerHTML = `:root { ${cssVariables} }`;
	document.head.appendChild(style);
};
