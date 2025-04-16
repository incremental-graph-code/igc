import { Node, NodeTypes, EdgeTypes } from "reactflow";

import BaseRelationship, { IGCRelationshipProps } from "../relationships/BaseRelationship";
import DependencyRelationship from "../relationships/DependencyRelationship";
import ExecutionRelationship from "../relationships/ExecutionRelationship";
import InheritanceRelationship from "../relationships/InheritanceRelationship";
import MethodRelationship from "../relationships/MethodRelationship";
import OverridesRelationship from "../relationships/OverridesRelationship";
import AbstractClassNode from "../nodes/AbstractClassNode";

import BaseNode, { IGCNodeProps } from "../nodes/BaseNode";
import ClassNode from "../nodes/ClassNode";
import CodeFragmentNode from "../nodes/CodeFragmentNode";
import InterfaceNode from "../nodes/InterfaceNode";
import LibraryNode from "../nodes/LibraryNode";
import MethodNode from "../nodes/MethodNode";
import StartNode from "../nodes/StartNode";
import DocumentationNode from "../nodes/DocumentationNode";
import DocumentationRelationship from "../relationships/DocumentationRelationship";
import { ModuleComponent } from "@/types/frontend";

//Base, Class, Abstract Class, Interface, Library, Method, Code Fragment
export const nodeTypes: NodeTypes = {
	startNode: StartNode,
	baseNode: BaseNode,
	classNode: ClassNode,
	abstractClassNode: AbstractClassNode,
	interfaceNode: InterfaceNode,
	libraryNode: LibraryNode,
	methodNode: MethodNode,
	codeFragmentNode: CodeFragmentNode,
	documentationNode: DocumentationNode,
	// importNode: ImportNode,
};
export const convertMapToTrueNodeTypes = (
	componentMap: ModuleComponent<IGCNodeProps>,
): { [key: string]: IGCNodeProps } => {
	const result: { [key: string]: IGCNodeProps } = {};
    const keys = Object.keys(componentMap);
	for (let i = 0; i<keys.length; i++) {
        if (componentMap[keys[i]].enabled) {
            result[keys[i]] = componentMap[keys[i]].object;
        }
	};

	return result;
};

export const convertMapToTrueEdgeTypes = (
	componentMap: ModuleComponent<IGCRelationshipProps>,
): { [key: string]: IGCRelationshipProps } => {
	const result: { [key: string]: IGCRelationshipProps } = {};
    const keys = Object.keys(componentMap);
	for (let i = 0; i<keys.length; i++) {
		if (componentMap[keys[i]].enabled) {
            result[keys[i]] = componentMap[keys[i]].object;
        }
	};

	return result;
};


export const edgeTypes: EdgeTypes = {
	baseRelationship: BaseRelationship,
	inheritanceRelationship: InheritanceRelationship,
	overridesRelationship: OverridesRelationship,
	methodRelationship: MethodRelationship,
	executionRelationship: ExecutionRelationship,
	dependencyRelationship: DependencyRelationship,
	documentationRelationship: DocumentationRelationship,
};
