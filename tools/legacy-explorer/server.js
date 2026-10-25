import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const PUBLIC_DIR = path.join(__dirname, "public");
// The data files map the legacy httpdocs, so they stay out of this public repo (gitignored legacy-data/).
const DATA_DIR = path.resolve(ROOT, process.env.LEGACY_DATA_DIR ?? "legacy-data");
const MANIFEST_PATH = path.resolve(DATA_DIR, process.env.LEGACY_FILE_LIST ?? "legacy-file-list.tsv");
const FLAGS_PATH = path.resolve(DATA_DIR, process.env.LEGACY_FLAGS ?? "legacy-file-flags.json");
// Suggestions are read-only input (written by the migration's audit), kept apart from the owner's flags.
const SUGGESTIONS_PATH = path.resolve(DATA_DIR, process.env.LEGACY_SUGGESTIONS ?? "legacy-suggestions.json");
const LOCAL_ROOT = path.resolve(ROOT, process.env.LEGACY_ROOT ?? ".");
const PORT = Number.parseInt(process.env.LEGACY_EXPLORER_PORT ?? process.env.PORT ?? "4175", 10);
const REMOTE_BASE = normalizeRemoteBase(process.env.LEGACY_REMOTE_BASE ?? "https://stungeye.com/");

const textExtensions = new Set([
  ".asc",
  ".atom",
  ".bat",
  ".c",
  ".cfg",
  ".conf",
  ".css",
  ".csv",
  ".htaccess",
  ".htm",
  ".html",
  ".ini",
  ".js",
  ".json",
  ".log",
  ".md",
  ".php",
  ".pl",
  ".py",
  ".rb",
  ".rss",
  ".sh",
  ".svg",
  ".txt",
  ".xml",
  ".xsl",
  ".yml",
]);

const mimeTypes = new Map([
  [".aac", "audio/aac"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".htm", "text/html; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".m4a", "audio/mp4"],
  [".mov", "video/quicktime"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".ogg", "audio/ogg"],
  [".pdf", "application/pdf"],
  [".php", "text/html; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".wav", "audio/wav"],
  [".webm", "video/webm"],
  [".xml", "application/xml; charset=utf-8"],
]);

const manifest = loadManifest();
let flags = loadFlags();
const suggestions = loadSuggestions();

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && requestUrl.pathname === "/") {
      await serveStaticFile(response, path.join(PUBLIC_DIR, "index.html"));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/assets/")) {
      await serveStaticFile(response, path.join(PUBLIC_DIR, requestUrl.pathname.replace(/^\/assets\//, "")));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/state") {
      sendJson(response, getState(requestUrl.searchParams.get("path") ?? ""));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/search") {
      sendJson(response, searchManifest(requestUrl.searchParams));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/text") {
      sendJson(response, await getTextPreview(requestUrl.searchParams.get("path") ?? ""));
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/flag") {
      const body = await readJsonBody(request);
      const updated = await updateFlag(body);
      sendJson(response, updated);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/local") {
      await serveLocalLegacyFile(response, requestUrl.searchParams.get("path") ?? "");
      return;
    }

    sendJson(response, { error: "Not found" }, 404);
  } catch (error) {
    console.error(error);
    sendJson(response, { error: error.message ?? "Unexpected error" }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`Legacy explorer: http://localhost:${PORT}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
  console.log(`Remote base: ${REMOTE_BASE}`);
  console.log(`Local root fallback: ${LOCAL_ROOT}`);
  console.log(`Flags: ${FLAGS_PATH}`);
  console.log(`Suggestions: ${SUGGESTIONS_PATH} (${Object.keys(suggestions.items).length})`);
});

function loadManifest() {
  const text = fs.readFileSync(MANIFEST_PATH, "utf8");
  const files = new Map();
  const dirs = new Map();
  const root = createDirectory("");
  dirs.set("", root);

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const columns = line.split("\t");
    if (columns.length < 3) continue;

    const filePath = cleanLegacyPath(columns[0]);
    if (!filePath || isExcluded(filePath)) continue;

    const size = Number.parseInt(columns[1], 10);
    const file = {
      path: filePath,
      name: path.posix.basename(filePath),
      parent: parentOf(filePath),
      size: Number.isFinite(size) ? size : 0,
      modified: columns.slice(2).join("\t"),
      extension: extensionFor(filePath),
      kind: kindFor(filePath),
      type: "file",
    };

    files.set(file.path, file);
    ensureDirectory(file.parent, dirs);
    dirs.get(file.parent).filePaths.push(file.path);

    for (const dirPath of ancestors(file.parent)) {
      const dir = ensureDirectory(dirPath, dirs);
      dir.fileCount += 1;
      dir.totalSize += file.size;
    }
  }

  for (const dir of dirs.values()) {
    if (!dir.path) continue;
    const parent = ensureDirectory(parentOf(dir.path), dirs);
    parent.dirPaths.push(dir.path);
  }

  return { files, dirs };
}

function createDirectory(dirPath) {
  return {
    path: dirPath,
    name: dirPath ? path.posix.basename(dirPath) : "All files",
    parent: dirPath ? parentOf(dirPath) : null,
    type: "folder",
    fileCount: 0,
    totalSize: 0,
    dirPaths: [],
    filePaths: [],
  };
}

function ensureDirectory(dirPath, dirs) {
  const cleanPath = cleanLegacyPath(dirPath);
  if (!dirs.has(cleanPath)) dirs.set(cleanPath, createDirectory(cleanPath));
  return dirs.get(cleanPath);
}

function ancestors(dirPath) {
  if (!dirPath) return [""];
  const parts = dirPath.split("/");
  const paths = [""];
  for (let index = 0; index < parts.length; index += 1) {
    paths.push(parts.slice(0, index + 1).join("/"));
  }
  return paths;
}

function getState(rawPath) {
  const requestedPath = cleanLegacyPath(rawPath);
  const file = manifest.files.get(requestedPath);
  const directory = manifest.dirs.get(requestedPath);

  if (!file && !directory) {
    return {
      error: "Path is not in legacy-file-list.tsv",
      path: requestedPath,
      remoteBase: REMOTE_BASE,
      counts: countsForManifest(),
      flags: flagSummary(),
    };
  }

  const current = file ? enrichFile(file) : enrichDirectory(directory);
  const currentDir = file ? manifest.dirs.get(file.parent) : directory;
  const directories = currentDir.dirPaths.map((dirPath) => enrichDirectory(manifest.dirs.get(dirPath))).sort(compareItems);
  const files = currentDir.filePaths.map((filePath) => enrichFile(manifest.files.get(filePath))).sort(compareItems);

  return {
    item: current,
    path: current.path,
    parent: current.parent,
    breadcrumbs: breadcrumbsFor(current.path, current.type),
    directories,
    files,
    pageFiles: files.filter((entry) => isPage(entry.path)),
    remoteBase: REMOTE_BASE,
    counts: countsForManifest(),
    flags: flagSummary(),
  };
}

function searchManifest(params) {
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const status = params.get("status") ?? "all";
  const kind = params.get("kind") ?? "all";
  const limit = Math.min(Number.parseInt(params.get("limit") ?? "200", 10), 500);

  if (!query && status === "all" && kind === "all") return { results: [] };

  const directories = Array.from(manifest.dirs.values())
    .filter((entry) => entry.path)
    .map((entry) => enrichDirectory(entry));
  const files = Array.from(manifest.files.values()).map((entry) => enrichFile(entry));
  const pool = [...directories, ...files];
  const results = [];

  for (const item of pool) {
    if (query && !item.path.toLowerCase().includes(query)) continue;
    if (!matchesStatus(item, status)) continue;
    if (kind !== "all" && item.kind !== kind && item.type !== kind) continue;
    results.push(item);
    if (results.length >= limit) break;
  }

  return { results, truncated: results.length >= limit };
}

function matchesStatus(item, status) {
  if (status === "all") return true;
  if (status === "keep" || status === "discard") return item.flag?.status === status;
  const own = item.suggestion && !item.suggestion.inherited ? item.suggestion : null;
  if (status === "unconfirmed") return Boolean(own && own.suggest !== "mixed" && !item.flag?.status);
  if (status === "disagree") return Boolean(own && item.flag?.status && ["keep", "discard"].includes(own.suggest) && own.suggest !== item.flag.status);
  if (status.startsWith("suggested-")) return own?.suggest === status.slice("suggested-".length);
  return false;
}

async function getTextPreview(rawPath) {
  const filePath = cleanLegacyPath(rawPath);
  const file = manifest.files.get(filePath);
  if (!file) return { error: "File is not in legacy-file-list.tsv" };
  if (!isTextLike(filePath)) return { error: "This file type is not previewed as text." };

  const localPath = toLocalPath(filePath);
  if (localPath && fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
    return readTextFromDisk(localPath, "local");
  }

  const remoteUrl = remoteUrlFor(filePath);
  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      return { error: `Remote request failed with HTTP ${response.status}.`, source: "remote", remoteUrl };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return textPayload(buffer, "remote", remoteUrl);
  } catch (error) {
    return { error: error.message, source: "remote", remoteUrl };
  }
}

function readTextFromDisk(localPath, source) {
  const buffer = fs.readFileSync(localPath);
  return textPayload(buffer, source);
}

function textPayload(buffer, source, remoteUrl = null) {
  const maxBytes = 1024 * 1024;
  const slice = buffer.byteLength > maxBytes ? buffer.subarray(0, maxBytes) : buffer;
  return {
    text: slice.toString("utf8"),
    source,
    remoteUrl,
    truncated: buffer.byteLength > maxBytes,
  };
}

async function updateFlag(body) {
  const targetPath = cleanLegacyPath(String(body?.path ?? ""));
  const status = body?.status === "keep" || body?.status === "discard" ? body.status : null;
  const type = body?.type === "folder" ? "folder" : "file";
  const note = String(body?.note ?? "").slice(0, 500);
  const accepted = body?.acceptedSuggestion === true && status !== null && suggestionFor(targetPath)?.suggest === status;

  if (targetPath && !manifest.files.has(targetPath) && !manifest.dirs.has(targetPath)) {
    return { error: "Path is not in legacy-file-list.tsv" };
  }

  if (!flags.items) flags.items = {};
  if (!status && !note) {
    delete flags.items[targetPath];
  } else {
    flags.items[targetPath] = {
      status,
      note,
      type,
      ...(accepted ? { acceptedSuggestion: true } : {}),
      updatedAt: new Date().toISOString(),
    };
  }
  flags.updatedAt = new Date().toISOString();
  await writeFile(FLAGS_PATH, `${JSON.stringify(flags, null, 2)}\n`);
  return { item: targetPath ? enrichAny(targetPath) : enrichDirectory(manifest.dirs.get("")), flags: flagSummary() };
}

async function serveStaticFile(response, filePath) {
  const fullPath = path.resolve(filePath);
  if (!fullPath.startsWith(PUBLIC_DIR) || !fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    sendJson(response, { error: "Not found" }, 404);
    return;
  }
  response.writeHead(200, { "Content-Type": contentTypeFor(fullPath) });
  fs.createReadStream(fullPath).pipe(response);
}

async function serveLocalLegacyFile(response, rawPath) {
  const filePath = cleanLegacyPath(rawPath);
  if (!manifest.files.has(filePath)) {
    sendJson(response, { error: "File is not in legacy-file-list.tsv" }, 404);
    return;
  }

  const localPath = toLocalPath(filePath);
  if (!localPath || !fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
    sendJson(response, { error: "Local file is not available" }, 404);
    return;
  }

  response.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
  fs.createReadStream(localPath).pipe(response);
}

function enrichAny(itemPath) {
  if (manifest.files.has(itemPath)) return enrichFile(manifest.files.get(itemPath));
  return enrichDirectory(manifest.dirs.get(itemPath));
}

function enrichFile(file) {
  const localPath = toLocalPath(file.path);
  const localExists = Boolean(localPath && fs.existsSync(localPath));
  return {
    ...file,
    flag: flags.items?.[file.path] ?? null,
    suggestion: suggestionFor(file.path),
    localExists,
    localUrl: localExists ? `/local?path=${encodeURIComponent(file.path)}` : null,
    remoteUrl: remoteUrlFor(file.path),
  };
}

function enrichDirectory(directory) {
  const pageFiles = directory.filePaths.filter(isPage);
  return {
    ...directory,
    kind: "folder",
    flag: flags.items?.[directory.path] ?? null,
    suggestion: suggestionFor(directory.path),
    hasPages: pageFiles.length > 0,
    pageCount: pageFiles.length,
    remoteUrl: directory.path ? remoteUrlFor(`${directory.path}/`) : REMOTE_BASE,
  };
}

function breadcrumbsFor(itemPath, type) {
  const dirPath = type === "file" ? parentOf(itemPath) : itemPath;
  const crumbs = [{ name: "All files", path: "" }];
  if (!dirPath) return crumbs;
  const parts = dirPath.split("/");
  for (let index = 0; index < parts.length; index += 1) {
    crumbs.push({ name: parts[index], path: parts.slice(0, index + 1).join("/") });
  }
  return crumbs;
}

function countsForManifest() {
  return {
    files: manifest.files.size,
    folders: Math.max(manifest.dirs.size - 1, 0),
    excludedPrefixes: ["system/", "archives/"],
  };
}

function flagSummary() {
  const values = Object.values(flags.items ?? {});
  const open = Object.entries(suggestions.items).filter(([itemPath, entry]) => entry.suggest !== "mixed" && isListed(itemPath));
  return {
    keep: values.filter((entry) => entry.status === "keep").length,
    discard: values.filter((entry) => entry.status === "discard").length,
    noted: values.filter((entry) => entry.note).length,
    suggested: open.length,
    confirmed: open.filter(([itemPath]) => flags.items?.[itemPath]?.status).length,
  };
}

function isListed(itemPath) {
  return manifest.files.has(itemPath) || manifest.dirs.has(itemPath);
}

// The suggestion for a path: its own, or the nearest suggested folder above it (inherited).
function suggestionFor(itemPath) {
  const own = suggestions.items[itemPath];
  if (own) return { ...own, inherited: false, from: itemPath };
  let current = itemPath;
  while (current) {
    current = parentOf(current);
    const entry = suggestions.items[current];
    if (entry && entry.suggest !== "mixed") return { ...entry, inherited: true, from: current };
  }
  return null;
}

function loadSuggestions() {
  if (!fs.existsSync(SUGGESTIONS_PATH)) return { items: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(SUGGESTIONS_PATH, "utf8"));
    return { ...parsed, items: parsed.items ?? {} };
  } catch (error) {
    console.error(`Could not read ${SUGGESTIONS_PATH}: ${error.message}`);
    return { items: {} };
  }
}

function loadFlags() {
  if (!fs.existsSync(FLAGS_PATH)) {
    return { version: 1, updatedAt: null, items: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(FLAGS_PATH, "utf8"));
    return { version: 1, updatedAt: null, items: {}, ...parsed };
  } catch {
    return { version: 1, updatedAt: null, items: {} };
  }
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error("Request body is too large."));
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function cleanLegacyPath(input) {
  const withoutSlashes = String(input ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!withoutSlashes || withoutSlashes === ".") return "";
  const normalized = path.posix.normalize(withoutSlashes);
  if (normalized === "." || normalized === "/") return "";
  if (normalized.startsWith("../") || normalized === "..") return "";
  return normalized.replace(/\/+$/, "");
}

function isExcluded(filePath) {
  return filePath === "system" || filePath.startsWith("system/") || filePath === "archives" || filePath.startsWith("archives/");
}

function parentOf(filePath) {
  const parent = path.posix.dirname(filePath);
  return parent === "." ? "" : parent;
}

function extensionFor(filePath) {
  const base = path.posix.basename(filePath);
  if (base.startsWith(".") && !base.slice(1).includes(".")) return base.toLowerCase();
  return path.posix.extname(filePath).toLowerCase();
}

function kindFor(filePath) {
  const extension = extensionFor(filePath);
  if ([".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp", ".ico"].includes(extension)) return "image";
  if ([".aac", ".aif", ".aiff", ".m4a", ".mid", ".midi", ".mp3", ".ogg", ".wav"].includes(extension)) return "audio";
  if ([".avi", ".mov", ".mp4", ".mpeg", ".mpg", ".webm", ".wmv"].includes(extension)) return "video";
  if ([".htm", ".html", ".php"].includes(extension)) return "page";
  if (extension === ".pdf") return "pdf";
  if (isTextLike(filePath)) return "text";
  if ([".swf", ".fla"].includes(extension)) return "flash";
  return "binary";
}

function isTextLike(filePath) {
  return textExtensions.has(extensionFor(filePath));
}

function isPage(filePath) {
  return [".htm", ".html", ".php"].includes(extensionFor(filePath));
}

function toLocalPath(filePath) {
  const fullPath = path.resolve(LOCAL_ROOT, filePath);
  return fullPath.startsWith(LOCAL_ROOT) ? fullPath : null;
}

function remoteUrlFor(filePath) {
  return new URL(filePath.split("/").map(encodeURIComponent).join("/"), REMOTE_BASE).toString();
}

function normalizeRemoteBase(base) {
  const url = new URL(base);
  if (!url.pathname.endsWith("/")) url.pathname = `${url.pathname}/`;
  return url.toString();
}

function compareItems(a, b) {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

function contentTypeFor(filePath) {
  return mimeTypes.get(extensionFor(filePath)) ?? "application/octet-stream";
}

function sendJson(response, data, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}
