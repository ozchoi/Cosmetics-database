import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env["DATABASE_URL"] ??
      "postgresql://cosmetics:cosmetics@localhost:5432/cosmetics_lens?schema=public",
  },
});
