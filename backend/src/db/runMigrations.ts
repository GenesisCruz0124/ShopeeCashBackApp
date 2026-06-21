import fs from "fs";
import path from "path";
import { pool } from "../config/db";

async function run() {
  const dir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    console.log(`Applying migration ${file}`);
    await pool.query(sql);
  }
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
