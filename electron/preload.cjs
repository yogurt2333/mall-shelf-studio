const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("mallShelfStudio", {
  platform: process.platform,
});
