import { defineConfig } from "prisma/config";

// Load .env file
import { config } from "dotenv";
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/chaduvkondi?schema=public",
  },
});
