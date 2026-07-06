const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mallShelfStudio", {
  importProductImage: (file) => ipcRenderer.invoke("product-image:import", file),
  platform: process.platform,
  loadProjectState: () => ipcRenderer.invoke("project-state:load"),
  saveProjectState: (projectState) => ipcRenderer.invoke("project-state:save", projectState),
});
