import React, { useState, useEffect, useRef } from "react";
import styles from "./CustomSelect.module.css";

export interface SelectOption {
	value: string;
	label: string;
	style: React.CSSProperties;
}

interface CustomSelectProps {
	id: string;
	options: SelectOption[];
	value: string;
	onChange: (value: string) => void;
	className?: string;
	label?: string;
	style?: React.CSSProperties;
	disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
	id,
	options,
	value,
	onChange,
	className = "",
	label,
	style,
	disabled = false,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const selectRef = useRef<HTMLDivElement>(null);
	const optionsRef = useRef<HTMLUListElement>(null);

	const handleSelect = (optionValue: string) => {
		if (!disabled) {
			onChange(optionValue);
			setIsOpen(false);
		}
	};

	const handleOutsideClick = (event: MouseEvent) => {
		if (
			selectRef.current &&
			!selectRef.current.contains(event.target as Node)
		) {
			setIsOpen(false);
		}
	};

	const adjustDropdownPosition = () => {
		if (optionsRef.current) {
			const rect = optionsRef.current.getBoundingClientRect();
			if (rect.bottom > window.innerHeight - 20) {
				optionsRef.current.style.top = `-${rect.height}px`;
			} else {
				optionsRef.current.style.top = "100%";
			}
		}
	};

	useEffect(() => {
		document.addEventListener("mousedown", handleOutsideClick);
		return () => {
			document.removeEventListener("mousedown", handleOutsideClick);
		};
	}, []);

	useEffect(() => {
		adjustDropdownPosition();
	}, [isOpen]);

	return (
		<div
			className={`${styles.customSelectContainer} ${className}`}
			ref={selectRef}
			style={style}
		>
			{label && (
				<label htmlFor={id} className={styles.customSelectLabel}>
					{label}
				</label>
			)}

			<div
				id={id}
				className={`${styles.customSelect} ${
					disabled ? styles.disabled : ""
				}`}
				onClick={() => !disabled && setIsOpen(!isOpen)}
			>
				{options.find((option) => option.value === value)?.label ||
					"Select"}
			</div>

			{isOpen && !disabled && (
				<ul className={styles.customSelectOptions} ref={optionsRef}>
					{options.map((option) => (
						<li
							key={option.value}
							className={styles.customSelectOption}
							onClick={() => handleSelect(option.value)}
						>
							<span
								className={styles.customSelectColor}
								style={option.style}
							/>
							{option.label}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default CustomSelect;
