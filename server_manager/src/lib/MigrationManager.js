const fs = require("fs");
const path = require("path");
const db = require("./db.js");

class MigrationManager {
  static async runMigrations() {
    console.log("--- Checking for Database Migrations ---");

    const migrationsDir = path.join(__dirname, "../../../database/migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let applied = [];
    try {
      const result = await db.query("SELECT script FROM schema_version");
      applied = result.rows.map((r) => r.script);
    } catch (err) {
      console.error(
        "Error fetching applied migrations (table might not exist yet):",
        err.message,
      );
    }

    const pending = files.filter((f) => !applied.includes(f));

    if (pending.length === 0) {
      console.log("Database is up to date.");
      return;
    }

    console.log(`Found ${pending.length} pending migrations.`);

    for (const file of pending) {
      console.log(`Applying: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

      try {
        await db.query(sql);

        const version = parseInt(file.split("__")[0]);

        await db.query(
          `
                    INSERT INTO db_version (version, updated_at) 
                    VALUES ($1, NOW())
                    ON CONFLICT (version) DO UPDATE SET version = EXCLUDED.version, updated_at = NOW();
                `,
          [version],
        );

        console.log(`Successfully applied ${file} (v${version})`);
      } catch (err) {
        console.error(`FAILED to apply ${file}:`, err.message);
        console.log(
          "Stopping migration process to prevent inconsistent state.",
        );
        return;
      }
    }

    console.log("--- Migration Process Finished ---");
  }
}

module.exports = MigrationManager;
