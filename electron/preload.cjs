const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mallShelfStudio", {
  importProductImage: (file) => ipcRenderer.invoke("product-image:import", file),
  platform: process.platform,
});
