export type Empty = object;

export interface TokenResponse {
	access: string;
	refresh: string;
}
export interface GetFileContentRequest {
	path: string;
}
export interface GetFileContentResponse {
	content: string;
	lastModified: number;
}
export interface SetFileContentRequest {
	path: string;
	content: string;
}
export enum FileNodeType {
    File,
    Directory,
}
export interface FileNode {
	name: string;
	fullPath: string;
	type: FileNodeType;
	children?: FileNode[];
}
export interface GetFileTreeRequest {
	path: string;
}
export interface GetFileTreeResponse {
	tree: FileNode[];
}

export interface SaveFilePathRequest {
	path: string;
	content: string;
}
export interface RenameRequest {
	oldPath: string;
	newPath: string;
}

export interface CopyRequest {
	sourcePath: string;
	destinationPath: string;
}

export interface DeleteRequest {
	targetPath: string;
}

export interface NewFileRequest {
	filePath: string;
	content?: string;
}

export interface NewDirectoryRequest {
	dirPath: string;
}
export interface CodeExecutionRequest {
	code: string;
	language: string;
	filePath: string;
	nodeId: string;
	sessionId?: string;
}
export interface CodeExecutionMetrics {
	executionTime: number;
	sessionId: string;
}
export interface CodeExecutionResponse {
	output: string;
	error: string;
	metrics: CodeExecutionMetrics;
	configuration: any;
	metaNodeData?: any;
}

export interface CodeAnalysisRequest {
	code: string;
	language: string;
}
export interface IdCodeTuple {
	id: string;
	data: string | FileIdCodeList;
}

export interface FileIdCodeList {
	filePath: string;
	elements: IdCodeTuple[];
}

export interface CodeManyExecutionRequest {
	fileIdCodeList: FileIdCodeList;
	language: string;
	filePath: string;
	sessionId?: string;
}

export interface Dependencies {
	variables: string[];
	functions: string[];
	classes: string[];
	modules: string[];
}
export interface Definitions {
	variables: string[];
	functions: string[];
	classes: string[];
}
export interface CodeAnalysisResponse {
	dependencies: Dependencies;
	new_definitions: Definitions;
}

export type Cache = CacheEntry[];
export interface CacheEntry {
	search_path: string;
	last_updated: string;
	files: string[];
	meta?: ModuleConfigurationData;
}
export interface ModuleConfigurationData {
	name: string;
}
export interface SessionDataGetRequest {
	filePath: string;
}
export interface SessionDataDeleteNodeRequest {
	filePath: string;
	nodeId: string;
}
export interface SessionDataDeleteExecutionRequest {
	filePath: string;
	sessionId: string;
	executionNumber: number;
}
export interface PrimarySessionRequest {
    filePath: string;
    sessionId: string;
}

// Session/Run data
export interface IGCFileSessionData {
	primarySession: string;
	sessions: IGCSessionData;
}

// Session/Run data
export type IGCFileSession = { [filePath: string]: IGCFileSessionData };

export type IGCSessionData = { [sessionId: string]: IGCSession };

export interface IGCSession {
	lastUpdate: number;
	overallConfiguration: any;
	executions: IGCCodeNodeExecution[];
}
export interface IGCCodeNodeExecution {
	nodeId: string;
	stdout: string;
	stderr: string;
	metrics: CodeExecutionMetrics;
	configuration: any;
}

export interface SessionConfig {
	path: string[];
	timestamp: number;
	filePath: string;
}
