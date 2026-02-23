const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

// Parse the connection string to handle SSL properly
const pool = new Pool({ 
  connectionString,
  ssl: false // Disable SSL in the pool, let the driver handle it
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
