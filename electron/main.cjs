const { app, BrowserWindow, ipcMain } = require("electron");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");

function createProductImageAssetPath(originalFileName, date, sequence) {
  const extension = originalFileName.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() ?? ".png";
  const timestamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");

  return `assets/products/product_${timestamp}_${String(sequence).padStart(3, "0")}${extension}`;
}

let productImageImportSequence = 0;
const projectStatePath = path.join(process.cwd(), "project-state.json");

async function loadProjectStateFile() {
  try {
    const text = await readFile(projectStatePath, "utf8");

    return JSON.parse(text);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function saveProjectStateFile(projectState) {
  await mkdir(path.join(process.cwd(), "assets", "products"), { recursive: true });
  await mkdir(path.join(process.cwd(), "exports"), { recursive: true });
  await writeFile(projectStatePath, `${JSON.stringify(projectState, null, 2)}\n`, "utf8");
}

ipcMain.handle("project-state:load", async () => loadProjectStateFile());

ipcMain.handle("project-state:save", async (_event, projectState) => {
  await saveProjectStateFile(projectState);

  return { ok: true };
});

ipcMain.handle("product-image:import", async (_event, file) => {
  productImageImportSequence += 1;

  const relativePath = createProductImageAssetPath(
    file.name,
    new Date(),
    productImageImportSequence,
  );
  const absolutePath = path.join(process.cwd(), relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(file.arrayBuffer));

  return { relativePath };
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#f4f6f8",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    return;
  }

  mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
