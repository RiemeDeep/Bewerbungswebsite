import { z } from "zod";

import { createApp } from "./app.js";
import { createRuntimeApp } from "./runtime.js";

const environmentSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
});

const environment = environmentSchema.parse(process.env);
const runtime = createRuntimeApp();
const app = createApp(runtime.dependencies);
const server = app.listen(environment.PORT, () => {
  console.info(`Orchestrator listening on port ${environment.PORT}`);
});

function shutdown(signal: string) {
  console.info(`Received ${signal}; closing HTTP server.`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close HTTP server cleanly.", error);
      process.exitCode = 1;
    }

    runtime.close().catch((closeError: unknown) => {
      console.error("Failed to close runtime dependencies cleanly.", closeError);
      process.exitCode = 1;
    });
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
