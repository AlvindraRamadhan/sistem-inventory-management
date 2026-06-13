import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    // DIRECT_URL digunakan untuk CLI (push, migrate, studio) — tidak melalui PgBouncer
    url: process.env.DIRECT_URL,
  },
})
