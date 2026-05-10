const bcrypt = require("bcryptjs");
const db = require("../lib/db.js");

async function seed() {
  console.log("Starting database seeding...");

  const users = [
    { username: "admin", password: "adminpassword", is_active: true },
  ];

  try {
    for (const user of users) {
      const passwordHash = bcrypt.hashSync(user.password, 10);

      await db.query(
        `INSERT INTO users (username, password_hash, is_active) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (username) DO UPDATE 
                 SET password_hash = EXCLUDED.password_hash, is_active = EXCLUDED.is_active`,
        [user.username, passwordHash, user.is_active],
      );

      console.log(`User seeded: ${user.username}`);
    }

    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Error during seeding:", err.message);
  } finally {
    process.exit();
  }
}

seed();
