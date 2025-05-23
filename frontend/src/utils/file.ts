/**
 * @file Utility functions for file-related operations.
 */

import { FileData } from "@/store/slices/file";


/**
 * Determines whether the given file is an IGC file.
 *
 * @param fileData - The file data object containing the file path and metadata.
 * @returns `true` if the file path ends with `.igc`, otherwise `false`.
 *
 * @remarks
 * This function checks the file extension of the provided file path to determine
 * if it is an IGC file. If the `fileData` is `null`, the function will return `false`.
 */
export const isIGCFile = (fileData: FileData): boolean => {
    return fileData !== null ? fileData.filePath.endsWith(".igc") : false;
};