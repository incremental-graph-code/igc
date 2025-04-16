import { IGCViewProps } from "@/IGCItems/views/BaseView";
import { callGetComponents } from "@/requests";
import useStore from "@/store/store";
import {
	ModuleComponentStored,
	ModuleComponentValues,
	RegistryComponent,
} from "@/types/frontend";
import React from "react";
import BaseNode from "@/IGCItems/nodes/BaseNode";
import BaseRelationship from "@/IGCItems/relationships/BaseRelationship";


const COMPONENT_CACHE_KEY = "component_cache";
const FILE_HISTORY_CACHE_KEY = "file_history_cache";

interface ComponentCacheEntry {
	key: string;
	modulePath: string;
	enabled: boolean;
}
interface FileHistoryCacheEntry {
	saved: boolean;
	content: string;
}

// Function to load cache from localStorage
export const loadComponentCache = (): {
	[key: string]: ComponentCacheEntry;
} | null => {
	const cache = localStorage.getItem(COMPONENT_CACHE_KEY);
	return cache ? JSON.parse(cache) : null;
};
// Function to load cache from localStorage
export const getFileHistoryKey = (
	filePath: string,
	componentId: string = "",
): string => {
	return `${filePath}${componentId === "" ? "" : "-" + componentId}`;
};
export const loadFileHistoryCache = (): {
	[key: string]: FileHistoryCacheEntry[];
} => {
	const cache = localStorage.getItem(FILE_HISTORY_CACHE_KEY);
	return cache ? JSON.parse(cache) : {};
};

// Function to update cache in localStorage
export const updateComponentCache = (
	updateEntry: ComponentCacheEntry,
): void => {
	const cache = loadComponentCache() ?? {};
	cache[updateEntry.key] = updateEntry;
	localStorage.setItem(COMPONENT_CACHE_KEY, JSON.stringify(cache));
};
// Function to update cache in localStorage
export const updateFileHistoryCache = (
	key: string,
	updateEntry: FileHistoryCacheEntry[],
): void => {
	const cache = loadFileHistoryCache();
	cache[key] = updateEntry;
	localStorage.setItem(FILE_HISTORY_CACHE_KEY, JSON.stringify(cache));
};

// Function to dynamically import and check all exports
export const importAndCategorizeComponents = async (
	componentFilePath: string,
	moduleFilePath: string,
	registerComponent: (
		component: ModuleComponentValues<any>,
	) => ModuleComponentStored,
): Promise<ModuleComponentStored> => {
	const allModuleComponentStored: ModuleComponentStored = {
		nodes: {},
		relationships: {},
		views: {},
	};
	try {
		const componentModule = await import(/* @vite-ignore */`${componentFilePath}`);

		// Check all exports
		const exportedKeys = Object.keys(componentModule);
		for (let i = 0; i < exportedKeys.length; i++) {
			const exportedKey = exportedKeys[i];
			const exportedComponent = componentModule[exportedKey];

			// Detect component type based on properties
			if (
				["node", "relationship", "view"].includes(
					exportedComponent?.type,
				)
			) {
				// Skip abstract components
				if (exportedComponent.abstract) {
					continue;
				}

				// See if cache has enable/disable status
				let componentEnabled = true;
				const webCache = loadComponentCache();
				if (webCache !== null && exportedComponent.key in webCache) {
					const cacheEntry = webCache[exportedComponent.key];
					componentEnabled = cacheEntry.enabled;
				}

				// Register the component
				const { nodes, relationships, views } = registerComponent({
					object: exportedComponent,
					modulePath: moduleFilePath,
					enabled: componentEnabled,
				});

				// Update the stored components
				allModuleComponentStored.nodes = {
					...allModuleComponentStored.nodes,
					...nodes,
				};
				allModuleComponentStored.relationships = {
					...allModuleComponentStored.relationships,
					...relationships,
				};
				allModuleComponentStored.views = {
					...allModuleComponentStored.views,
					...views,
				};

				// Update the cache
				const entry: ComponentCacheEntry = {
					key: exportedComponent.key,
					modulePath: moduleFilePath,
					enabled: componentEnabled,
				};
				updateComponentCache(entry);
			} else {
				console.warn(
					`Component in ${componentFilePath} with key ${exportedKey} does not match known types`,
				);
			}
		}
	} catch (error) {
		console.error(
			`Error importing components from ${componentFilePath}:`,
			error,
		);
	}
	return allModuleComponentStored;
};

// Function to fetch components from backend and register them
export const fetchAndRegisterComponents = async (
	registerComponent: (
		component: ModuleComponentValues<any>,
	) => ModuleComponentStored,
) => {
	const { setNodeTypes, setRelationshipTypes, setViewTypes, setModuleData } =
		useStore.getState();

	try {
		const allModuleComponentStored: ModuleComponentStored = {
			nodes: {},
			relationships: {},
			views: {},
		};
		// Fetch the list of .tsx file paths from the backend
		const modules = await callGetComponents();

		// Loop through each fetched component file path and import/categorize them
		for (let i = 0; i < modules.length; i++) {
			const componentFiles = modules[i].files;
			for (let j = 0; j < componentFiles.length; j++) {
				// Register all components from the module
				const { nodes, relationships, views } =
					await importAndCategorizeComponents(
						componentFiles[j],
						modules[i].search_path,
						registerComponent,
					);

				// Update the stored components
				allModuleComponentStored.nodes = {
					...allModuleComponentStored.nodes,
					...nodes,
				};
				allModuleComponentStored.relationships = {
					...allModuleComponentStored.relationships,
					...relationships,
				};
				allModuleComponentStored.views = {
					...allModuleComponentStored.views,
					...views,
				};

				// Update the module data
				setModuleData(() => modules);
			}
		}

		// Update the type stores
		setNodeTypes(() => allModuleComponentStored.nodes);
		setRelationshipTypes(() => allModuleComponentStored.relationships);
		setViewTypes(() => allModuleComponentStored.views);
	} catch (error) {
		console.error("Error fetching components from backend:", error);
	}
};

export interface CreateComponentOptions {
	color?: string;
	parentComponent?: RegistryComponent;
	settable?: boolean;
	abstract?: boolean;
	type?: "node" | "relationship" | "view";
}

export const createComponent = <P = {}>(
	component: React.FC<P>,
	key: string,
	displayName: string,
	options: CreateComponentOptions = {},
): React.FC<P> & RegistryComponent => {
	const {
		color = "#ffffff",
		parentComponent,
		settable = false,
		abstract = false,
		type,
	} = options;

	const typeSymbol = key;

	// Create a new function that wraps the original component
	const registryComponent: React.FC<P> & RegistryComponent = (props: P) => {
		return component(props);
	};

	// Assign properties to the new function
	registryComponent.key = key;
	registryComponent.displayName = displayName;
	registryComponent.color = color;

	const t = type ?? parentComponent?.type;
	if (!t) {
		throw new Error(
			"Type must be defined either from the parent component or as an argument",
		);
	}
	registryComponent.type = t;
	registryComponent.settable = settable;
	registryComponent.typeSymbol = typeSymbol;
	registryComponent.abstract = abstract;
	registryComponent.typeHierarchy = parentComponent
		? [
				...(parentComponent.typeHierarchy || []),
				parentComponent.typeSymbol!,
		  ]
		: [];
	registryComponent.typeHierarchy.push(typeSymbol);

	return registryComponent;
};
export interface CreateViewOptions {
	parentComponent?: RegistryComponent;
	abstract?: boolean;
}
export const createView = <T extends {} = {}>(
	component: React.FC<T>,
	key: string,
	displayName: string,
	forComponents: RegistryComponent[],
    weight: number = 0,
	options: CreateViewOptions = {},
): IGCViewProps<T> & RegistryComponent => {
	const { parentComponent, abstract = false } = options;

	const typeSymbol = key;

	// Create a new function that wraps the original component
	const registryComponent: IGCViewProps<T> & RegistryComponent = (
		props: T,
	) => {
		// Ensure the component type matches React.FC with the generic type T
		return React.createElement(component as React.FC<T>, props);
	};

	// Assign properties to the new function
	registryComponent.key = key;
	registryComponent.displayName = displayName;
	registryComponent.color = "#ffffff";
	registryComponent.type = "view";
	registryComponent.settable = false;
	registryComponent.typeSymbol = typeSymbol;
	registryComponent.abstract = abstract;
	registryComponent.typeHierarchy = parentComponent
		? [
				...(parentComponent.typeHierarchy || []),
				parentComponent.typeSymbol!,
		  ]
		: [];
	registryComponent.typeHierarchy.push(typeSymbol);

	registryComponent.forComponents = forComponents;
    registryComponent.weight = weight;

	return registryComponent;
};
