const { app, BrowserWindow, ipcMain, net, protocol } = require("electron");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "mall-shelf-studio-asset",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
  },
]);

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
const projectDirectory = process.cwd();

function resolveProjectAssetPath(relativePath) {
  const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = path.resolve(projectDirectory, normalizedPath);
  const relativeFromProject = path.relative(projectDirectory, absolutePath);

  if (relativeFromProject.startsWith("..") || path.isAbsolute(relativeFromProject)) {
    throw new Error("Project asset path must stay inside the project directory.");
  }

  return absolutePath;
}

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
  await mkdir(path.join(projectDirectory, "assets", "products"), { recursive: true });
  await mkdir(path.join(projectDirectory, "exports"), { recursive: true });
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
  const absolutePath = resolveProjectAssetPath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(file.arrayBuffer));

  return { relativePath };
});

function registerProjectAssetProtocol() {
  protocol.handle("mall-shelf-studio-asset", (request) => {
    const url = new URL(request.url);
    const relativePath = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    const absolutePath = resolveProjectAssetPath(relativePath);

    return net.fetch(pathToFileURL(absolutePath).toString());
  });
}

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
  registerProjectAssetProtocol();
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
