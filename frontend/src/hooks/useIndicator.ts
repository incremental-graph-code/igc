import { useEffect } from "react";
import useStore from "../store/store";
import { ReactNode } from "react";

interface UseIndicatorOptions {
	key: string; // Unique key for the indicator
	element: ReactNode; // JSX Element to render in the nav bar
	weight: number; // Order weight
}

export const useIndicator = ({ key, element, weight }: UseIndicatorOptions) => {
	const setNavBarContainer = useStore(
		(state) => state.setNavBarContainer,
	);

	useEffect(() => {
		// Add indicator to the store
		setNavBarContainer(key, { key, element, weight });

		// Cleanup when the component unmounts
		return () => {
			setNavBarContainer(key, null);
		};
	}, [key, element, weight, setNavBarContainer]);
};
