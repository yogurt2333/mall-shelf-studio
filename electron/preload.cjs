const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mallShelfStudio", {
  importProductImage: (file) => ipcRenderer.invoke("product-image:import", file),
  platform: process.platform,
  loadProjectState: () => ipcRenderer.invoke("project-state:load"),
  resolveProjectAssetUrl: (relativePath) =>
    `mall-shelf-studio-asset://project/${String(relativePath)
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`,
  saveProjectState: (projectState) => ipcRenderer.invoke("project-state:save", projectState),
});
