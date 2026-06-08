import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const envPath = path.join(rootDir, ".env");
const standaloneAppDir = path.join(__dirname, ".next/standalone/apps/web");
const staticSourceDir = path.join(__dirname, ".next/static");
const staticTargetDir = path.join(standaloneAppDir, ".next/static");
const publicSourceDir = path.join(__dirname, "public");
const publicTargetDir = path.join(standaloneAppDir, "public");

if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const unquoted =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    if (!(key in process.env)) {
      process.env[key] = unquoted;
    }
  }
}

if (fs.existsSync(staticSourceDir)) {
  fs.mkdirSync(path.dirname(staticTargetDir), { recursive: true });
  fs.cpSync(staticSourceDir, staticTargetDir, { recursive: true, force: true });
}

if (fs.existsSync(publicSourceDir)) {
  fs.mkdirSync(standaloneAppDir, { recursive: true });
  fs.cpSync(publicSourceDir, publicTargetDir, { recursive: true, force: true });
}

await import(pathToFileURL(path.join(__dirname, ".next/standalone/apps/web/server.js")).href);
