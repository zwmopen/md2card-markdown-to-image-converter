import fs from "node:fs/promises";
import path from "node:path";

import JSZip from "jszip";

import type { RenderedFile } from "./contracts.js";
import { ensurePathInside, sanitizeFilename } from "./security.js";

export class OutputStore {
  readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  async init(): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true });
  }

  jobDir(jobId: string): string {
    return ensurePathInside(this.rootDir, path.join(this.rootDir, sanitizeFilename(jobId, "job")));
  }

  async write(
    jobId: string,
    relativePath: string,
    data: Uint8Array,
    mediaType: string,
  ): Promise<RenderedFile> {
    const jobDir = this.jobDir(jobId);
    const safeRelativePath = relativePath
      .split(/[\\/]+/)
      .filter(Boolean)
      .map((part) => sanitizeFilename(part, "file"))
      .join(path.sep);
    const absolutePath = ensurePathInside(jobDir, path.join(jobDir, safeRelativePath));
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, data);
    const stat = await fs.stat(absolutePath);
    return {
      name: path.basename(absolutePath),
      relativePath: path.relative(jobDir, absolutePath).split(path.sep).join("/"),
      mediaType,
      size: stat.size,
    };
  }

  async createArchive(
    jobId: string,
    archiveName: string,
    files: RenderedFile[],
  ): Promise<RenderedFile> {
    const zip = new JSZip();
    const jobDir = this.jobDir(jobId);
    for (const file of files) {
      const absolutePath = ensurePathInside(jobDir, path.join(jobDir, file.relativePath));
      zip.file(file.relativePath, await fs.readFile(absolutePath));
    }
    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    return this.write(jobId, `${sanitizeFilename(archiveName, "md2card")}.zip`, buffer, "application/zip");
  }

  async read(jobId: string, relativePath: string): Promise<{ data: Buffer; mediaType: string }> {
    const jobDir = this.jobDir(jobId);
    const absolutePath = ensurePathInside(jobDir, path.join(jobDir, relativePath));
    const data = await fs.readFile(absolutePath);
    return { data, mediaType: mediaTypeForPath(absolutePath) };
  }
}

export function extensionForFormat(format: "png" | "jpeg" | "webp"): string {
  return format === "jpeg" ? "jpg" : format;
}

export function mediaTypeForFormat(format: "png" | "jpeg" | "webp"): string {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

function mediaTypeForPath(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".zip") return "application/zip";
  if ([".jpg", ".jpeg"].includes(extension)) return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".json") return "application/json";
  return "image/png";
}
