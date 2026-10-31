#!/usr/bin/env node
// Copy the kept legacy www.stungeye.com files into legacy/ (Phase C C3.3, PLAN F4/F33).
//
// The owner triaged the old httpdocs in the legacy explorer. This script resolves each file of
// the live tree to its nearest flagged ancestor (as the explorer does; the root flag is ignored,
// so only explicit keeps count), drops files that are never served whatever the flags say, and
// copies the rest byte for byte. legacy/ is served at the site root by the Eleventy build.
//
// Usage: node tools/import-legacy.mjs <legacy-data dir> <exported httpdocs dir>
//   legacy-data: legacy-file-flags.json + legacy-file-list-live.tsv (private archive,
//                stungeye_dot_com _archive/legacy-data/)
//   httpdocs:    the docroot as exported in Phase C C2
// Re-running replaces legacy/ entirely.
import { readFileSync, rmSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [dataDir, httpdocs] = process.argv.slice(2);
if (!dataDir || !httpdocs) {
  console.error("usage: node tools/import-legacy.mjs <legacy-data dir> <httpdocs dir>");
  process.exit(2);
}
const NEVER = [".htaccess", ".htpasswd", ".php", ".sql", ".env"];
const items = JSON.parse(readFileSync(join(dataDir, "legacy-file-flags.json"), "utf-8")).items;
const live = readFileSync(join(dataDir, "legacy-file-list-live.tsv"), "utf-8")
  .split("\n").filter(Boolean).map((l) => l.split("\t")[0]);

function status(path) {
  const parts = path.split("/");
  for (let i = parts.length; i >= 1; i--) {
    const q = parts.slice(0, i).join("/");
    if (items[q]?.status) return items[q].status;
  }
  return "discard";
}

const never = (p) => NEVER.some((x) => p.toLowerCase().endsWith(x)) || basename(p).startsWith(".");
const kept = live.filter((p) => status(p) === "keep" && !never(p) && !p.split("/").includes(".git")).sort();

const dest = join(ROOT, "legacy");
rmSync(dest, { recursive: true, force: true });
for (const p of kept) {
  const src = join(httpdocs, p);
  if (!existsSync(src)) throw new Error(`missing in httpdocs: ${p}`);
  mkdirSync(dirname(join(dest, p)), { recursive: true });
  copyFileSync(src, join(dest, p));
}
console.log(`legacy/: ${kept.length} files`);
