const MigrationManager = require("../lib/MigrationManager.js");

async function run() {
  try {
    await MigrationManager.runMigrations();
    process.exit(0);
  } catch (err) {
    console.error("Migration script error:", err);
    process.exit(1);
  }
}

run();
