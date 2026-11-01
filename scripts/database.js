import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";



const targets = {
  dev: {
    variable: "DATABASE_URL",
    expectedDatabase: "my_app",
  },
  test: {
    variable: "TEST_DATABASE_URL",
    expectedDatabase: "ink_dashboard_test",
  },
};

const [action, targetName] = process.argv.slice(2);
const target = targets[targetName];

if (!["migrate", "status"].includes(action) || !target) {
  console.error("Usage: node scripts/database.js <migrate|status> <dev|test>");
  process.exit(1);
}

const connectionString = process.env[target.variable];

if (!connectionString) {
  console.error(target.variable + " is not configured.");
  process.exit(1);
}

let databaseName;

try {
  const url = new URL(connectionString);
  databaseName = decodeURIComponent(url.pathname.slice(1));
} catch {
  console.error(target.variable + " is not a valid database URL.");
  process.exit(1);
}

if (databaseName !== target.expectedDatabase) {
  console.error(
    "Safety check failed. Expected database: " + target.expectedDatabase +
    "; received: " + databaseName
  );
  process.exit(1);
}

const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const prismaArgs = action === "migrate"
  ? ["migrate", "deploy"]
  : ["migrate", "status"];

console.log("Target database: " + target.expectedDatabase);

const result = spawnSync(
  process.execPath,
  [prismaCli, ...prismaArgs],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  }
);

if (result.error) {
  console.error("Failed to run Prisma:", result.error.message);
  process.exit(1);
}

process.exitCode = result.status ?? 1;
