/**
 * @file FileSystemTransaction utility for atomic file operations with rollback support.
 *
 * This module provides a class to stage file system operations (create, modify, delete)
 * and either commit them or roll them back as a transaction.
 */

import fs from "fs-extra";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

/**
 * Represents a create file operation.
 */
interface CreateOp {
	type: "create";
	path: string;
}

/**
 * Represents a modify file operation, including a backup path for rollback.
 */
interface ModifyOp {
	type: "modify";
	path: string;
	backupPath: string;
}

/**
 * Represents a delete file operation, including a backup path for rollback.
 */
interface DeleteOp {
	type: "delete";
	path: string;
	backupPath: string;
}

/**
 * Union type for all supported file operations.
 */
type Operation = CreateOp | ModifyOp | DeleteOp;

/**
 * Provides transactional file system operations with rollback and commit support.
 *
 * Allows you to stage file creations, modifications, and deletions, and then either
 * commit all changes or roll them back in case of error.
 */
export class FileSystemTransaction {
	private operations: Operation[] = [];
	private backupDir: string;

	/**
	 * Creates a new FileSystemTransaction instance.
	 * Initializes a temporary backup directory for rollback support.
	 */
	constructor() {
		this.backupDir = path.join(os.tmpdir(), `.igc-backup-${uuidv4()}`);
		fs.ensureDirSync(this.backupDir);
	}

	/**
	 * Helper to backup a file if it exists.
	 *
	 * @param filePath - The path to check and backup.
	 * @param backupDir - The directory to store the backup.
	 * @returns The backup path if a backup was made, otherwise undefined.
	 */
	private async backupIfExists(
		filePath: string,
		backupDir: string,
	): Promise<string | undefined> {
		const exists = await fs.pathExists(filePath);
		if (exists) {
			const backupPath = path.join(backupDir, uuidv4());
			await fs.copy(filePath, backupPath);
			return backupPath;
		}
		return undefined;
	}

	/**
	 * Stages a file creation operation.
	 *
	 * If the target file already exists, backs it up for rollback.
	 *
	 * @param targetPath - The path where the file will be created.
	 * @param content - The content to write to the new file.
	 */
	async stageCreate(targetPath: string, content: string): Promise<void> {
		const backupPath = await this.backupIfExists(
			targetPath,
			this.backupDir,
		);
		await fs.outputFile(targetPath, content);
		if (backupPath) {
			this.operations.push({
				type: "modify",
				path: targetPath,
				backupPath,
			});
		} else {
			this.operations.push({ type: "create", path: targetPath });
		}
	}

	/**
	 * Stages a file copy operation.
	 *
	 * Copies a file from the source path to the destination path.
	 * If the destination file exists, backs it up for rollback.
	 *
	 * @param sourcePath - The path of the file to copy.
	 * @param destinationPath - The path where the file will be copied to.
	 */
	async stageCopy(
		sourcePath: string,
		destinationPath: string,
	): Promise<void> {
		const backupPath = await this.backupIfExists(
			destinationPath,
			this.backupDir,
		);
		await fs.copy(sourcePath, destinationPath);
		if (backupPath) {
			this.operations.push({
				type: "modify",
				path: destinationPath,
				backupPath,
			});
		} else {
			this.operations.push({ type: "create", path: destinationPath });
		}
	}

	/**
	 * Stages a file modification operation, backing up the original file for rollback.
	 *
	 * @param targetPath - The path of the file to modify.
	 * @param newContent - The new content to write to the file.
	 */
	async stageModify(targetPath: string, newContent: string): Promise<void> {
		const backupPath = path.join(this.backupDir, uuidv4());
		await fs.copy(targetPath, backupPath);
		await fs.writeFile(targetPath, newContent);
		this.operations.push({ type: "modify", path: targetPath, backupPath });
	}

	/**
	 * Stages a file deletion operation, backing up the file for rollback.
	 *
	 * @param targetPath - The path of the file to delete.
	 */
	async stageDelete(targetPath: string): Promise<void> {
		const backupPath = path.join(this.backupDir, uuidv4());
		await fs.copy(targetPath, backupPath);
		await fs.remove(targetPath);
		this.operations.push({ type: "delete", path: targetPath, backupPath });
	}

	/**
	 * Rolls back all staged operations, restoring files from backups as needed.
	 */
	async rollback(): Promise<void> {
		for (const op of [...this.operations].reverse()) {
			if (op.type === "create") {
				await fs.remove(op.path);
			} else if (op.type === "modify" || op.type === "delete") {
				await fs.copy(op.backupPath, op.path);
			}
		}
		await fs.remove(this.backupDir);
		this.operations = [];
	}

	/**
	 * Commits all staged operations, removing backups and clearing the operation log.
	 */
	async commit(): Promise<void> {
		await fs.remove(this.backupDir);
		this.operations = [];
	}
}
