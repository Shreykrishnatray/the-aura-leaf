import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * `DATABASE_URL` is read lazily (instead of `env("DATABASE_URL")`) so that
 * `prisma generate` works on a fresh clone before `.env` exists. Commands that
 * actually talk to the database (push / migrate / seed / studio) will report a
 * missing URL on their own.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
