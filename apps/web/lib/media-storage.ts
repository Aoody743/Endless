import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function resolveProjectRoot() {
  const cwd = process.cwd();

  if (cwd.endsWith(path.join("apps", "web"))) {
    return path.resolve(cwd, "../..");
  }

  return cwd;
}

export function getMediaStorageRoot() {
  return path.join(resolveProjectRoot(), "storage", "media");
}

export async function ensureMediaStorageRoot() {
  const root = getMediaStorageRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}

function sanitizeBaseName(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  const base = path.basename(filename, extension);

  return {
    extension,
    base:
      base
        .toLocaleLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "asset"
  };
}

export async function createMediaObjectKey(filename: string) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const { base, extension } = sanitizeBaseName(filename);
  const suffix = crypto.randomBytes(6).toString("hex");

  return `${year}/${month}/${base}-${suffix}${extension}`;
}

export async function writeMediaFile(key: string, bytes: Uint8Array) {
  const root = await ensureMediaStorageRoot();
  const absolutePath = path.join(root, key);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, bytes);
  return absolutePath;
}

export async function readMediaFile(key: string) {
  const absolutePath = path.join(getMediaStorageRoot(), key);
  return fs.readFile(absolutePath);
}

export async function deleteMediaFile(key: string) {
  const absolutePath = path.join(getMediaStorageRoot(), key);
  await fs.rm(absolutePath, { force: true });
}

export function mediaUrlForKey(key: string) {
  return `/media/${key}`;
}
