import { defineConfig, env } from "prisma/config";
import { config as loadEnv } from "dotenv";

// Prisma 7+ no longer auto-loads .env — load it ourselves.
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma migrations use this URL directly. Set DIRECT_URL in .env for Neon
    // (the non-pooled connection string); locally it's the same as DATABASE_URL.
    url: env("DIRECT_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
