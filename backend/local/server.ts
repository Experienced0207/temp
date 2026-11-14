try {
  (process as any).loadEnvFile?.();
} catch {}

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { app } from "../src/index";
import { LocalDatabase } from "./database";
import { migrateLocal } from "./migrate";
import { seedDemo } from "./seed";

mkdirSync(".local", { recursive: true });
const db = new LocalDatabase(
  resolve(process.env.INTEGRATION_DB ?? ".local/integration.sqlite"),
);
migrateLocal(db);
await seedDemo(db);
const assets = new Hono();
assets.use("*", serveStatic({ root: "dist/integration" }));
assets.get("*", serveStatic({ path: "dist/integration/index.html" }));
const integrationPort = Number(process.env.INTEGRATION_PORT ?? 8790);
serve(
  {
    fetch: (request) =>
      app.fetch(request, {
        DB: db,
        ENVIRONMENT: "development",
        SARVAM_API_KEY: process.env.SARVAM_API_KEY,
        SARVAM_SPEECH_ENABLED: process.env.SARVAM_SPEECH_ENABLED ?? "true",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        ASSETS: { fetch: (req) => Promise.resolve(assets.fetch(req)) },
      }),
    hostname: "127.0.0.1",
    port: integrationPort,
  },
  () => {
    console.log(
      `DHAAGA integration: http://127.0.0.1:${integrationPort} (synthetic data only; persistent local SQLite)`,
    );
  },
);
