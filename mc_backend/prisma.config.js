// Load environment variables so Prisma CLI reads DATABASE_URL when this file is loaded
require("dotenv").config();
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
  engine: "binary",
});
