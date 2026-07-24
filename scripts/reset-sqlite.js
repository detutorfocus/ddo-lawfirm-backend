// scripts/reset-sqlite.js
// -- Deletes the local SQLite dev database file and regenerates it
// from scratch via `prisma db push` + seed. Use this whenever you
// want a completely clean local dataset.
//
// Run: npm run prisma:sqlite:reset

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

const dbFile = path.join(__dirname, "..", "prisma", "dev.db");
const journalFile = `${dbFile}-journal`;

console.log(`${CYAN}Resetting local SQLite database...${RESET}\n`);

for (const file of [dbFile, journalFile]) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`${YELLOW}Deleted:${RESET} ${path.basename(file)}`);
  }
}

console.log(`\n${CYAN}Recreating schema...${RESET}`);
execSync("npm run prisma:sqlite:push", { stdio: "inherit" });

console.log(`\n${CYAN}Seeding fresh data...${RESET}`);
execSync("npm run prisma:sqlite:seed", { stdio: "inherit" });

console.log(`\n${GREEN}Done — SQLite database reset and reseeded.${RESET}`);
