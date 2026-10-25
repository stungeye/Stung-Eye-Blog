const state = {
  currentPath: "",
  item: null,
  pageMode: "rendered",
  selectedPage: null,
  searchTimer: null,
};

const elements = {
  acceptButton: document.querySelector("#acceptButton"),
  breadcrumbs: document.querySelector("#breadcrumbs"),
  clearButton: document.querySelector("#clearButton"),
  discardButton: document.querySelector("#discardButton"),
  flagBadge: document.querySelector("#flagBadge"),
  flagNote: document.querySelector("#flagNote"),
  itemMeta: document.querySelector("#itemMeta"),
  itemTitle: document.querySelector("#itemTitle"),
  keepButton: document.querySelector("#keepButton"),
  kindFilter: document.querySelector("#kindFilter"),
  remoteLink: document.querySelector("#remoteLink"),
  rootButton: document.querySelector("#rootButton"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  sidebarList: document.querySelector("#sidebarList"),
  stats: document.querySelector("#stats"),
  statusFilter: document.querySelector("#statusFilter"),
  suggestionBadge: document.querySelector("#suggestionBadge"),
  suggestionBox: document.querySelector("#suggestionBox"),
  suggestionFrom: document.querySelector("#suggestionFrom"),
  suggestionReason: document.querySelector("#suggestionReason"),
  viewer: document.querySelector("#viewer"),
};

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});
elements.searchInput.addEventListener("input", () => {
  window.clearTimeout(state.searchTimer);
  state.searchTimer = window.setTimeout(runSearch, 180);
});
elements.kindFilter.addEventListener("change", runSearch);
elements.statusFilter.addEventListener("change", runSearch);
elements.rootButton.addEventListener("click", () => loadPath(""));
elements.keepButton.addEventListener("click", () => setFlag("keep"));
elements.discardButton.addEventListener("click", () => setFlag("discard"));
elements.clearButton.addEventListener("click", () => setFlag(null));
elements.acceptButton.addEventListener("click", () => setFlag(state.item?.suggestion?.suggest, true));
elements.flagNote.addEventListener("change", () => setFlag(state.item?.flag?.status ?? null));

loadPath(new URLSearchParams(window.location.search).get("path") ?? "");

async function loadPath(path) {
  const data = await fetchJson(`/api/state?path=${encodeURIComponent(path)}`);
  if (data.error) {
    renderError(data.error);
    return;
  }

  state.currentPath = data.path;
  state.item = data.item;
  state.selectedPage = data.pageFiles?.[0]?.path ?? (isPage(data.item?.path) ? data.item.path : null);
  updateUrl(data.path);
  renderHeader(data);
  renderBreadcrumbs(data.breadcrumbs);
  renderSidebar([...data.directories, ...data.files], data.path);
  renderViewer(data);
}

async function runSearch() {
  const query = elements.searchInput.value.trim();
  const kind = elements.kindFilter.value;
  const status = elements.statusFilter.value;
  if (!query && kind === "all" && status === "all") {
    await loadPath(state.currentPath);
    return;
  }

  const params = new URLSearchParams({ q: query, kind, status });
  const data = await fetchJson(`/api/search?${params.toString()}`);
  renderSidebar(data.results, state.currentPath, data.truncated ? "Showing first 500 matches" : null);
}

function renderHeader(data) {
  const item = data.item;
  elements.itemTitle.textContent = item.name;
  elements.itemMeta.textContent = metaFor(item);
  elements.remoteLink.href = item.remoteUrl;
  elements.flagNote.value = item.flag?.note ?? "";
  elements.stats.textContent = `${data.counts.files.toLocaleString()} files, ${data.counts.folders.toLocaleString()} folders | keep ${data.flags.keep}, discard ${data.flags.discard} | confirmed ${data.flags.confirmed} of ${data.flags.suggested} suggestions`;
  elements.keepButton.classList.toggle("active", item.flag?.status === "keep");
  elements.discardButton.classList.toggle("active", item.flag?.status === "discard");
  elements.flagBadge.textContent = item.flag?.status ?? "";
  elements.flagBadge.className = `flag-badge ${item.flag?.status ?? ""}`;
  renderSuggestion(item.suggestion);
}

function renderSuggestion(suggestion) {
  elements.suggestionBox.hidden = !suggestion;
  if (!suggestion) return;
  elements.suggestionBadge.textContent = `Suggested: ${suggestion.suggest}`;
  elements.suggestionBadge.className = `suggestion-badge ${suggestion.suggest}`;
  elements.suggestionReason.textContent = suggestion.reason;
  elements.suggestionFrom.textContent = suggestion.inherited ? `(from ${suggestion.from || "root"}/)` : "";
  elements.acceptButton.hidden = !["keep", "discard"].includes(suggestion.suggest);
}

function renderBreadcrumbs(crumbs) {
  elements.breadcrumbs.textContent = "";
  for (const crumb of crumbs) {
    const button = document.createElement("button");
    button.className = "crumb";
    button.type = "button";
    button.textContent = crumb.name;
    button.addEventListener("click", () => loadPath(crumb.path));
    elements.breadcrumbs.append(button);
  }
}

function renderSidebar(items, activePath, message = null) {
  elements.sidebarList.textContent = "";
  if (message) {
    const note = document.createElement("div");
    note.className = "message";
    note.textContent = message;
    elements.sidebarList.append(note);
  }
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No entries";
    elements.sidebarList.append(empty);
    return;
  }

  const template = document.querySelector("#rowTemplate");
  for (const item of items) {
    const fragment = template.content.cloneNode(true);
    const row = fragment.querySelector(".row");
    row.classList.toggle("active", item.path === activePath);
    row.querySelector(".row-icon").textContent = iconFor(item);
    row.querySelector(".row-name").textContent = item.name;
    row.querySelector(".row-path").textContent = item.path || "root";
    const flagCell = row.querySelector(".row-flag");
    flagCell.textContent = rowFlagText(item);
    flagCell.classList.toggle("suggested", !item.flag?.status && Boolean(ownSuggestion(item)));
    row.addEventListener("click", () => loadPath(item.path));
    elements.sidebarList.append(fragment);
  }
}

function renderViewer(data) {
  if (data.item.type === "folder") {
    renderFolder(data);
    return;
  }

  if (data.item.kind === "page") {
    state.selectedPage = data.item.path;
    renderPagePreview(data.item);
    return;
  }

  if (data.item.kind === "image") renderImage(data.item);
  else if (data.item.kind === "audio") renderAudio(data.item);
  else if (data.item.kind === "video") renderVideo(data.item);
  else if (data.item.kind === "pdf") renderPdf(data.item);
  else if (data.item.kind === "text") renderText(data.item);
  else renderGeneric(data.item);
}

function renderFolder(data) {
  cachedFolderState = data;
  const rows = [...data.directories, ...data.files];
  const pageFiles = data.pageFiles ?? [];
  elements.viewer.textContent = "";

  if (pageFiles.length) {
    const toolbar = toolbarForPages(pageFiles);
    elements.viewer.append(toolbar);
    if (state.pageMode === "files") {
      elements.viewer.append(folderTable(rows));
      return;
    }
    const target = pageFiles.find((file) => file.path === state.selectedPage) ?? pageFiles[0];
    if (state.pageMode === "source") {
      const source = document.createElement("pre");
      source.className = "source";
      source.textContent = "Loading...";
      elements.viewer.append(source);
      loadTextInto(target.path, source);
    } else {
      elements.viewer.append(iframeFor(target.remoteUrl));
    }
    return;
  }

  if (!rows.length) {
    elements.viewer.innerHTML = '<div class="empty">Empty folder</div>';
    return;
  }

  elements.viewer.replaceChildren(folderTable(rows));
}

function toolbarForPages(pageFiles) {
  const toolbar = document.createElement("div");
  toolbar.className = "viewer-toolbar";

  const select = document.createElement("select");
  for (const file of pageFiles) {
    const option = document.createElement("option");
    option.value = file.path;
    option.textContent = file.name;
    option.selected = file.path === state.selectedPage;
    select.append(option);
  }
  select.addEventListener("change", () => {
    state.selectedPage = select.value;
    renderFolder({ ...lastFolderState(), pageFiles });
  });

  const segmented = document.createElement("div");
  segmented.className = "segmented";
  for (const [mode, label] of [["files", "Files"], ["rendered", "Rendered"], ["source", "Source"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.classList.toggle("active", state.pageMode === mode);
    button.addEventListener("click", () => {
      state.pageMode = mode;
      renderFolder(lastFolderState());
    });
    segmented.append(button);
  }

  toolbar.append(select, segmented);
  return toolbar;
}

function folderTable(rows) {
  const table = document.createElement("table");
  table.className = "folder-table";
  table.innerHTML = "<thead><tr><th>Name</th><th>Kind</th><th>Size</th><th>Modified</th><th>Flag</th><th>Suggested</th></tr></thead>";
  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.kind)}</td><td>${formatBytes(row.totalSize ?? row.size)}</td><td>${escapeHtml(row.modified ?? "")}</td><td>${escapeHtml(row.flag?.status ?? "")}</td><td>${escapeHtml(ownSuggestion(row)?.suggest ?? "")}</td>`;
    tr.addEventListener("click", () => loadPath(row.path));
    tbody.append(tr);
  }
  table.append(tbody);
  return table;
}

let cachedFolderState = null;
function lastFolderState() {
  return cachedFolderState;
}

function renderPagePreview(item) {
  cachedFolderState = null;
  elements.viewer.textContent = "";
  const toolbar = document.createElement("div");
  toolbar.className = "viewer-toolbar";
  const segmented = document.createElement("div");
  segmented.className = "segmented";
  for (const [mode, label] of [["rendered", "Rendered"], ["source", "Source"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.classList.toggle("active", state.pageMode === mode);
    button.addEventListener("click", () => {
      state.pageMode = mode;
      renderPagePreview(item);
    });
    segmented.append(button);
  }
  toolbar.append(segmented);
  elements.viewer.append(toolbar);

  if (state.pageMode === "source") {
    const source = document.createElement("pre");
    source.className = "source";
    source.textContent = "Loading...";
    elements.viewer.append(source);
    loadTextInto(item.path, source);
  } else {
    elements.viewer.append(iframeFor(item.remoteUrl));
  }
}

function renderImage(item) {
  const src = item.remoteUrl;
  elements.viewer.innerHTML = `<div class="media-preview"><img alt="" src="${escapeAttribute(src)}"></div>`;
}

function renderAudio(item) {
  elements.viewer.innerHTML = `<div class="audio-preview"><audio controls src="${escapeAttribute(item.remoteUrl)}"></audio></div>`;
}

function renderVideo(item) {
  elements.viewer.innerHTML = `<div class="media-preview"><video controls src="${escapeAttribute(item.remoteUrl)}"></video></div>`;
}

function renderPdf(item) {
  elements.viewer.innerHTML = `<iframe class="pdf-frame" title="${escapeAttribute(item.name)}" src="${escapeAttribute(item.remoteUrl)}"></iframe>`;
}

function renderText(item) {
  const source = document.createElement("pre");
  source.className = "source";
  source.textContent = "Loading...";
  elements.viewer.replaceChildren(source);
  loadTextInto(item.path, source);
}

function renderGeneric(item) {
  elements.viewer.innerHTML = `<div class="message">No inline preview for ${escapeHtml(item.extension || "this file")}.</div>`;
}

function iframeFor(url) {
  const iframe = document.createElement("iframe");
  iframe.className = "preview-frame";
  iframe.src = url;
  iframe.title = "Rendered preview";
  return iframe;
}

async function loadTextInto(path, element) {
  const data = await fetchJson(`/api/text?path=${encodeURIComponent(path)}`);
  if (data.error) {
    element.className = "message warn";
    element.textContent = data.error;
    return;
  }
  element.textContent = data.truncated ? `${data.text}\n\n[truncated]` : data.text;
}

async function setFlag(status, acceptedSuggestion = false) {
  if (!state.item) return;
  const data = await fetchJson("/api/flag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: state.item.path,
      type: state.item.type,
      status,
      note: acceptedSuggestion && !elements.flagNote.value ? state.item.suggestion.reason.slice(0, 500) : elements.flagNote.value,
      acceptedSuggestion,
    }),
  });
  if (data.error) {
    renderError(data.error);
    return;
  }
  await loadPath(state.item.path);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  return response.json();
}

function renderError(message) {
  elements.viewer.innerHTML = `<div class="message warn">${escapeHtml(message)}</div>`;
}

function updateUrl(path) {
  const url = new URL(window.location.href);
  if (path) url.searchParams.set("path", path);
  else url.searchParams.delete("path");
  window.history.replaceState({}, "", url);
}

function metaFor(item) {
  if (item.type === "folder") {
    return `${item.fileCount.toLocaleString()} files | ${formatBytes(item.totalSize)} | ${item.path || "root"}`;
  }
  const source = item.localExists ? "remote + local" : "remote";
  return `${item.kind} | ${formatBytes(item.size)} | ${item.modified} | ${source}`;
}

function iconFor(item) {
  if (item.type === "folder") return item.hasPages ? "▣" : "⌂";
  return {
    audio: "♪",
    binary: "◆",
    flash: "F",
    image: "◩",
    page: "▤",
    pdf: "P",
    text: "T",
    video: "▶",
  }[item.kind] ?? "•";
}

function ownSuggestion(item) {
  return item.suggestion && !item.suggestion.inherited ? item.suggestion : null;
}

// Confirmed flags in capitals; an unconfirmed suggestion in lower case with a "?".
function rowFlagText(item) {
  if (item.flag?.status) return item.flag.status.toUpperCase();
  const suggestion = ownSuggestion(item);
  return suggestion && suggestion.suggest !== "mixed" ? `${suggestion.suggest}?` : "";
}

function isPage(path) {
  return /\.(html?|php)$/i.test(path ?? "");
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
