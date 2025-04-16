import React from "react";

interface OpenDirectoryButtonProps {
    onClick: (path: string) => void,
    children: React.ReactNode
    style?: React.CSSProperties,
    className?: string,
    title?: string
}

const OpenDirectoryButton: React.FC<OpenDirectoryButtonProps> = ({onClick, children, style, className, title}) => {

	const handleOpenDirectory = async () => {
		if (window.electron && window.electron.selectDirectory) {
			const result = await window.electron.selectDirectory();
            if (result.length > 0)
                onClick(result[0]);
		} else {
			console.error("Electron API is not available.");
		}
	};

	return <div className={className} title={title} style={style} onClick={handleOpenDirectory}>{children}</div>;
};

export default OpenDirectoryButton;
