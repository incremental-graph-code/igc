import useStore from "@/store/store";
import { ModuleComponentStored, ModuleComponentValues } from "@/types/frontend";
import {
	updateComponentCache,
} from "@/utils/componentCache";

export const useComponentRegistry = () => {
	const { setNodeTypes, setRelationshipTypes, setViewTypes } = useStore();

	// Functions to register/unregister Nodes, Relationships, and Views
	const registerComponent = (
		component: ModuleComponentValues<any>,
	): ModuleComponentStored => {
		const allModuleComponentStored: ModuleComponentStored = {
			nodes: {},
			relationships: {},
			views: {},
		};
		if (component.object.type === "node") {
			allModuleComponentStored.nodes = {
				[component.object.key]: component,
			};
		} else if (component.object.type === "relationship") {
			allModuleComponentStored.relationships = {
				[component.object.key]: component,
			};
		} else if (component.object.type === "view") {
			allModuleComponentStored.views = {
				[component.object.key]: component,
			};
		}
		return allModuleComponentStored;
	};

	const updateComponent = (component: ModuleComponentValues<any>) => {
		if (component.object.type === "node") {
			setNodeTypes((prevNodeTypes) => {
				prevNodeTypes[component.object.key] = component;
				return prevNodeTypes;
			});
		} else if (component.object.type === "relationship") {
			setRelationshipTypes((prevRelationshipTypes) => {
				prevRelationshipTypes[component.object.key] = component;
				return prevRelationshipTypes;
			});
		} else if (component.object.type === "view") {
			setViewTypes((prevViewTypes) => {
				prevViewTypes[component.object.key] = component;
				return prevViewTypes;
			});
		}

        // Update the cache
		const cacheEntry = {
            key: component.object.key,
            modulePath: component.modulePath,
            enabled: component.enabled,
        };
		updateComponentCache(cacheEntry);
	};
	return {
		registerComponent,
		updateComponent,
	};
};
