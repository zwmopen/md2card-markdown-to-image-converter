import fs from "node:fs/promises";
import path from "node:path";

import type { RenderJob } from "./contracts.js";
import { ensurePathInside, sanitizeFilename } from "./security.js";

export interface JobStore {
  init(): Promise<void>;
  load(): Promise<RenderJob[]>;
  save(job: RenderJob): Promise<void>;
  remove(jobId: string): Promise<void>;
}

function isRenderJob(value: unknown): value is RenderJob {
  if (!value || typeof value !== "object") return false;
  const job = value as Record<string, unknown>;
  return typeof job.id === "string"
    && typeof job.token === "string"
    && (job.kind === "single" || job.kind === "batch")
    && ["queued", "running", "completed", "failed", "cancelled"].includes(String(job.status))
    && typeof job.createdAt === "string"
    && typeof job.updatedAt === "string"
    && typeof job.expiresAt === "string";
}

export class FileJobStore implements JobStore {
  readonly rootDir: string;

  constructor(outputDir: string) {
    this.rootDir = path.resolve(outputDir, ".jobs");
  }

  async init(): Promise<void> {
    await fs.mkdir(this.rootDir, { recursive: true, mode: 0o700 });
    await fs.chmod(this.rootDir, 0o700).catch(() => undefined);
  }

  async load(): Promise<RenderJob[]> {
    await this.init();
    const entries = await fs.readdir(this.rootDir, { withFileTypes: true });
    const jobs: RenderJob[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const filePath = ensurePathInside(this.rootDir, path.join(this.rootDir, entry.name));
      try {
        const value: unknown = JSON.parse(await fs.readFile(filePath, "utf8"));
        if (!isRenderJob(value)) throw new Error("Invalid render job document");
        jobs.push(value);
      } catch (error) {
        console.warn(JSON.stringify({
          level: "warn",
          message: "Skipping unreadable persisted render job",
          file: entry.name,
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    }
    return jobs;
  }

  async save(job: RenderJob): Promise<void> {
    await this.init();
    const target = this.filePath(job.id);
    const temporary = ensurePathInside(
      this.rootDir,
      `${target}.${process.pid}.${Date.now()}.tmp`,
    );
    try {
      await fs.writeFile(temporary, `${JSON.stringify(job)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
      await fs.rename(temporary, target);
      await fs.chmod(target, 0o600).catch(() => undefined);
    } finally {
      await fs.rm(temporary, { force: true }).catch(() => undefined);
    }
  }

  async remove(jobId: string): Promise<void> {
    await fs.rm(this.filePath(jobId), { force: true });
  }

  private filePath(jobId: string): string {
    const safeId = sanitizeFilename(jobId, "job");
    return ensurePathInside(this.rootDir, path.join(this.rootDir, `${safeId}.json`));
  }
}
