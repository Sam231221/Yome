import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { PrismaClient } = require(join(__dirname, "generated/client"));

// Resolve monorepo root .env (database package is at packages/database)
const monorepoRoot = join(__dirname, "../../..");
dotenv.config({ path: join(monorepoRoot, ".env") });

let prisma = null;

function getPoolMax() {
  const value = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "2", 10);
  return Number.isFinite(value) && value > 0 ? value : 2;
}

/**
 * Returns a singleton Prisma client instance (pg driver adapter).
 * DATABASE_URL must be set (e.g. in monorepo root .env).
 */
function getPrismaInstance() {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Create a .env file in the monorepo root."
      );
    }
    const pool = new pg.Pool({ connectionString, max: getPoolMax() });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export default getPrismaInstance;
