// This file is for creating requests to the backend API
import { sendAxiosRequest, UseAxiosRequestOptions } from "@/utils/requests";
import {
	CodeAnalysisRequest,
	CodeAnalysisResponse,
	CodeExecutionRequest,
	CodeExecutionResponse,
	FileNode,
	GetFileTreeRequest,
	CopyRequest,
	RenameRequest,
	Empty,
	NewDirectoryRequest,
	NewFileRequest,
	DeleteRequest,
	Cache,
	GetFileContentRequest,
	GetFileContentResponse,
	SetFileContentRequest,
	IGCFileSessionData,
	SessionDataGetRequest,
	SessionDataDeleteExecutionRequest,
	SessionDataDeleteNodeRequest,
	CodeManyExecutionRequest,
	FileIdCodeList,
    PrimarySessionRequest,
} from "shared";

export const getFileContent = (filePath: string) => {
	const options: UseAxiosRequestOptions<GetFileContentRequest> = {
		method: "GET",
		route: "/api/file-explorer/file-content",
		data: {
			path: filePath,
		},
		useJWT: false,
	};

	return sendAxiosRequest<GetFileContentRequest, GetFileContentResponse>(
		options,
	);
};
export const fileExists = async (filePath: string): Promise<boolean> => {
	const options: UseAxiosRequestOptions<GetFileContentRequest> = {
		method: "GET",
		route: "/api/file-explorer/file-exists",
		data: {
			path: filePath,
		},
		useJWT: false,
	};
	try {
		const fileExists = await sendAxiosRequest<
			GetFileContentRequest,
			{ exists: boolean }
		>(options);
		return fileExists.exists;
	} catch (error) {
		return false;
	}
};

export const saveFileContent = (filePath: string, content: string) => {
	const options: UseAxiosRequestOptions<SetFileContentRequest> = {
		method: "POST",
		route: "/api/file-explorer/file-content",
		data: {
			path: filePath,
			content: content,
		},
		useJWT: false,
	};

	return sendAxiosRequest<SetFileContentRequest, Empty>(options);
};

export const callAnalyze = (code: string) => {
	console.log("runAnalysis");
	const options: UseAxiosRequestOptions<CodeAnalysisRequest> = {
		method: "POST",
		route: "/api/code-handler/analyze",
		data: {
			code: code,
			language: "python",
		},
		useJWT: false,
	};

	return sendAxiosRequest<CodeAnalysisRequest, CodeAnalysisResponse>(options);
};

export const callExecute = (
	code: string,
	language: string,
	filePath: string,
	nodeId: string,
	sessionId: string | null,
) => {
	const options: UseAxiosRequestOptions<CodeExecutionRequest> = {
		method: "POST",
		data: {
			code,
			language: language,
			filePath: filePath,
			nodeId: nodeId,
			sessionId: sessionId ? sessionId : undefined,
		},
		route: "/api/code-handler/execute",
		useJWT: false,
	};

	return sendAxiosRequest<CodeExecutionRequest, CodeExecutionResponse>(
		options,
	);
};

export const callExecuteMany = (
	fileIdCodeList: FileIdCodeList,
	language: string,
	filePath: string,
	sessionId?: string,
) => {
	const options: UseAxiosRequestOptions<CodeManyExecutionRequest> = {
		method: "POST",
		data: {
			fileIdCodeList: fileIdCodeList,
			language: language,
			filePath: filePath,
			sessionId: sessionId,
		},
		route: "/api/code-handler/execute-many",
		useJWT: false,
	};

	return sendAxiosRequest<CodeManyExecutionRequest, Empty>(options);
};

export const getFileTree = (projectDirectory: string) => {
	const options: UseAxiosRequestOptions<GetFileTreeRequest> = {
		method: "GET",
		route: "/api/file-explorer/file-tree",
		data: {
			path: projectDirectory,
		},
		useJWT: false,
	};

	return sendAxiosRequest<GetFileTreeRequest, FileNode[]>(options);
};
export const renameFileOrDirectory = (oldPath: string, newPath: string) => {
	const options: UseAxiosRequestOptions<RenameRequest> = {
		method: "PUT",
		route: "/api/file-explorer/rename",
		data: {
			oldPath: oldPath,
			newPath: newPath,
		},
		useJWT: false,
	};

	return sendAxiosRequest<RenameRequest, Empty>(options);
};

export const copyFileOrDirectory = (
	sourcePath: string,
	destinationPath: string,
) => {
	const options: UseAxiosRequestOptions<CopyRequest> = {
		method: "POST",
		route: "/api/file-explorer/copy",
		data: {
			sourcePath: sourcePath,
			destinationPath: destinationPath,
		},
		useJWT: false,
	};

	return sendAxiosRequest<CopyRequest, Empty>(options);
};

export const deleteFileOrDirectory = (targetPath: string) => {
	const options: UseAxiosRequestOptions<DeleteRequest> = {
		method: "DELETE",
		route: "/api/file-explorer/delete",
		data: {
			targetPath: targetPath,
		},
		useJWT: false,
	};

	return sendAxiosRequest<DeleteRequest, Empty>(options);
};

export const createNewFile = (filePath: string, content?: string) => {
	const options: UseAxiosRequestOptions<NewFileRequest> = {
		method: "POST",
		route: "/api/file-explorer/new-file",
		data: {
			filePath: filePath,
			content: content,
		},
		useJWT: false,
	};

	return sendAxiosRequest<NewFileRequest, Empty>(options);
};

export const createEmptyIGCFile = (filePath: string) => {
	const options: UseAxiosRequestOptions<SessionDataGetRequest> = {
		method: "POST",
		route: "/api/file-explorer/new-igc-file",
		data: {
            filePath: filePath,
		},
		useJWT: false,
	};

	return sendAxiosRequest<SessionDataGetRequest, Empty>(options);
};

export const createNewDirectory = (dirPath: string) => {
	const options: UseAxiosRequestOptions<NewDirectoryRequest> = {
		method: "POST",
		route: "/api/file-explorer/new-directory",
		data: {
			dirPath: dirPath,
		},
		useJWT: false,
	};

	return sendAxiosRequest<NewDirectoryRequest, Empty>(options);
};

export const callGetComponents = () => {
	const options: UseAxiosRequestOptions<CodeAnalysisRequest> = {
		method: "GET",
		route: "/api/file-explorer/find-components",
		useJWT: false,
	};

	return sendAxiosRequest<Empty, Cache>(options);
};
interface ModuleChangeRequest {
	directory: string;
}

export const callAddModule = (directoryPath: string) => {
	const options: UseAxiosRequestOptions<ModuleChangeRequest> = {
		method: "POST",
		route: "/api/file-explorer/module",
		useJWT: false,
		data: {
			directory: directoryPath,
		},
	};

	return sendAxiosRequest<ModuleChangeRequest, any>(options);
};

export const callRemoveModule = (directoryPath: string) => {
	const options: UseAxiosRequestOptions<ModuleChangeRequest> = {
		method: "DELETE",
		route: "/api/file-explorer/module",
		useJWT: false,
		data: {
			directory: directoryPath,
		},
	};

	return sendAxiosRequest<ModuleChangeRequest, any>(options);
};

export const getSessionData = async (
	filePath: string,
): Promise<IGCFileSessionData> => {
	const options: UseAxiosRequestOptions<SessionDataGetRequest> = {
		method: "GET",
		route: "/api/file-explorer/session-data",
		data: {
			filePath: filePath,
		},
		useJWT: false,
	};

	return sendAxiosRequest<SessionDataGetRequest, IGCFileSessionData>(options);
};

export const deleteNodeInSession = async (
	filePath: string,
	nodeId: string,
): Promise<string[]> => {
	const options: UseAxiosRequestOptions<SessionDataDeleteNodeRequest> = {
		method: "DELETE",
		route: "/api/file-explorer/session-data-node",
		data: {
			filePath: filePath,
			nodeId: nodeId,
		},
		useJWT: false,
	};

	return sendAxiosRequest<SessionDataDeleteNodeRequest, string[]>(options);
};

// Needs to create the session data again using the returned paths
export const deleteExecutionInSession = async (
	filePath: string,
	sessionId: string,
	executionNumber: number,
): Promise<string[]> => {
	const options: UseAxiosRequestOptions<SessionDataDeleteExecutionRequest> = {
		method: "DELETE",
		route: "/api/file-explorer/session-data-execution",
		data: {
			filePath: filePath,
			sessionId: sessionId,
			executionNumber: executionNumber,
		},
		useJWT: false,
	};

	return sendAxiosRequest<SessionDataDeleteExecutionRequest, string[]>(
		options,
	);
};

export const setPrimarySession = async (
    filePath: string,
    sessionId: string,
): Promise<Empty> => {
    const options: UseAxiosRequestOptions<PrimarySessionRequest> = {
        method: "POST",
        route: "/api/file-explorer/primary-session",
        data: {
            filePath: filePath,
            sessionId: sessionId,
        },
        useJWT: false,
    };

    return sendAxiosRequest<PrimarySessionRequest, Empty>(options);
}

export const createSession = async (filePath: string, sessionId: string) => {
    const options: UseAxiosRequestOptions<PrimarySessionRequest> = {
        method: "POST",
        route: "/api/file-explorer/session",
        data: {
            filePath: filePath,
            sessionId: sessionId,
        },
        useJWT: false,
    };

    return sendAxiosRequest<PrimarySessionRequest, Empty>(options);
}

export const deleteSession = async (filePath: string, sessionId: string) => {
    const options: UseAxiosRequestOptions<PrimarySessionRequest> = {
        method: "DELETE",
        route: "/api/file-explorer/session",
        data: {
            filePath: filePath,
            sessionId: sessionId,
        },
        useJWT: false,
    };

    return sendAxiosRequest<PrimarySessionRequest, Empty>(options);
}
