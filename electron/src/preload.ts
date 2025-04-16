import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
	selectDirectory: () => ipcRenderer.invoke("select-directory"),
});
