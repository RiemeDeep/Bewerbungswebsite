import { healthResponseSchema } from "@bewerbungswebsite/contracts";
import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_request, response) => {
    const payload = healthResponseSchema.parse({
      status: "ok",
      service: "orchestrator",
    });

    response.status(200).json(payload);
  });

  return app;
}
