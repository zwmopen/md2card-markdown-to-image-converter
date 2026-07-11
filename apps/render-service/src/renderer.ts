import type { Browser, BrowserContext, Page } from "playwright";
import { chromium } from "playwright";
import sharp from "sharp";

import type {
  BatchRenderRequest,
  JobResult,
  RenderJob,
  RenderRequest,
  RenderedFile,
} from "./contracts.js";
import type { RenderServiceConfig } from "./config.js";
import { canLoadRemoteUrl, sanitizeFilename } from "./security.js";
import { extensionForFormat, mediaTypeForFormat, OutputStore } from "./storage.js";
import { buildRenderHtml } from "./template.js";

function titleFromMarkdown(markdown: string, fallback: string): string {
  const heading = markdown.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m)?.[1];
  const firstLine = markdown.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return sanitizeFilename(heading ?? firstLine ?? fallback, fallback);
}

async function convertScreenshot(png: Buffer, format: RenderRequest["outputFormat"]): Promise<Buffer> {
  if (format === "png") return png;
  if (format === "jpeg") return sharp(png).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  return sharp(png).webp({ quality: 90 }).toBuffer();
}

async function closeContext(context: BrowserContext): Promise<void> {
  await context.close().catch(() => undefined);
}

export class RenderEngine {
  readonly #config: RenderServiceConfig;
  readonly #store: OutputStore;
  #browser: Browser | undefined;

  constructor(config: RenderServiceConfig, store: OutputStore) {
    this.#config = config;
    this.#store = store;
  }

  async close(): Promise<void> {
    const browser = this.#browser;
    this.#browser = undefined;
    if (browser) await browser.close();
  }

  async renderSingle(
    job: RenderJob<RenderRequest>,
    signal: AbortSignal,
  ): Promise<JobResult> {
    signal.throwIfAborted();
    const title = sanitizeFilename(
      job.payload.title ?? titleFromMarkdown(job.payload.markdown, "md2card"),
      "md2card",
    );
    const files = await this.renderDocument(job.id, job.payload, title, signal);
    signal.throwIfAborted();
    const result: JobResult = { files, ...(files[0] ? { primaryFile: files[0] } : {}) };
    if (files.length > 1) {
      result.archiveFile = await this.#store.createArchive(job.id, title, files);
      signal.throwIfAborted();
      result.files = [...files, result.archiveFile];
    }
    return result;
  }

  async renderBatch(
    job: RenderJob<BatchRenderRequest>,
    signal: AbortSignal,
  ): Promise<JobResult> {
    const files: RenderedFile[] = [];
    for (const document of job.payload.documents) {
      signal.throwIfAborted();
      const folder = sanitizeFilename(document.id, "document");
      const title = sanitizeFilename(
        document.title ?? titleFromMarkdown(document.markdown, folder),
        folder,
      );
      files.push(...await this.renderDocument(
        job.id,
        document,
        `${folder}/${title}`,
        signal,
      ));
    }
    signal.throwIfAborted();
    const archiveFile = await this.#store.createArchive(job.id, job.payload.archiveName, files);
    signal.throwIfAborted();
    return {
      files: [...files, archiveFile],
      ...(files[0] ? { primaryFile: files[0] } : {}),
      archiveFile,
    };
  }

  private async browser(): Promise<Browser> {
    if (this.#browser?.isConnected()) return this.#browser;
    this.#browser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-zygote"],
    });
    return this.#browser;
  }

  private async configureNetwork(page: Page): Promise<void> {
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (url.startsWith("data:") || url.startsWith("about:")) {
        await route.continue();
        return;
      }
      if (this.#config.allowRemoteImages && canLoadRemoteUrl(url)) {
        await route.continue();
        return;
      }
      await route.abort("blockedbyclient");
    });
  }

  private async renderDocument(
    jobId: string,
    request: RenderRequest,
    pathPrefix: string,
    signal: AbortSignal,
  ): Promise<RenderedFile[]> {
    signal.throwIfAborted();
    const browser = await this.browser();
    signal.throwIfAborted();
    const context = await browser.newContext({
      viewport: {
        width: Math.max(800, request.width + 80),
        height: Math.max(800, request.height + 80),
      },
      deviceScaleFactor: 2,
      colorScheme: request.themeMode === "dark" ? "dark" : "light",
      serviceWorkers: "block",
    });
    const abortContext = () => {
      void closeContext(context);
    };
    signal.addEventListener("abort", abortContext, { once: true });

    try {
      signal.throwIfAborted();
      const page = await context.newPage();
      page.setDefaultTimeout(this.#config.renderTimeoutMs);
      await this.configureNetwork(page);

      await page.setContent(buildRenderHtml(request), {
        waitUntil: "load",
        timeout: this.#config.renderTimeoutMs,
      });
      signal.throwIfAborted();
      await page.waitForFunction(
        () => ["true", "error"].includes(document.documentElement.dataset.ready ?? ""),
        undefined,
        { timeout: this.#config.renderTimeoutMs },
      );
      signal.throwIfAborted();
      const state = await page.evaluate(() => ({
        ready: document.documentElement.dataset.ready,
        error: document.documentElement.dataset.renderError,
      }));
      if (state.ready === "error") throw new Error(state.error || "Render page failed to paginate");

      const cards = page.locator(".md2card-page");
      const count = await cards.count();
      if (count < 1) throw new Error("Renderer produced no card pages");

      const extension = extensionForFormat(request.outputFormat);
      const mediaType = mediaTypeForFormat(request.outputFormat);
      const files: RenderedFile[] = [];
      for (let index = 0; index < count; index += 1) {
        signal.throwIfAborted();
        const png = await cards.nth(index).screenshot({
          type: "png",
          animations: "disabled",
          caret: "hide",
          timeout: this.#config.renderTimeoutMs,
        });
        signal.throwIfAborted();
        const converted = await convertScreenshot(png, request.outputFormat);
        signal.throwIfAborted();
        files.push(await this.#store.write(
          jobId,
          `${pathPrefix}/${String(index + 1).padStart(2, "0")}.${extension}`,
          converted,
          mediaType,
        ));
      }
      return files;
    } finally {
      signal.removeEventListener("abort", abortContext);
      await closeContext(context);
    }
  }
}
