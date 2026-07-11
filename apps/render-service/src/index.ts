import { loadConfig } from "./config.js";
import { createRenderService } from "./server.js";

const config = loadConfig();
const service = await createRenderService(config);

await new Promise<void>((resolve, reject) => {
  service.server.once("error", reject);
  service.server.listen(config.port, config.host, () => {
    service.server.off("error", reject);
    resolve();
  });
});

console.log(JSON.stringify({
  level: "info",
  message: "MD2Card render service started",
  host: config.host,
  port: config.port,
  outputDir: config.outputDir,
  concurrency: config.concurrency,
  remoteImagesAllowed: config.allowRemoteImages,
}));

let closing = false;
async function shutdown(signal: string): Promise<void> {
  if (closing) return;
  closing = true;
  console.log(JSON.stringify({ level: "info", message: "Shutting down renderer", signal }));
  try {
    await service.close();
    process.exitCode = 0;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
