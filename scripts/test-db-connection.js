// scripts/test-db-connection.js
// ── Quick standalone DB connectivity test.
// Run with: npm run db:test
// This is MUCH faster than running the full seed script to check if
// your DATABASE_URL actually works, and gives a clearer error surface.

require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

async function main() {
  console.log(`${CYAN}Testing database connection...${RESET}\n`);

  if (!process.env.DATABASE_URL) {
    console.error(`${RED}❌ DATABASE_URL is not set. Check .env.local exists.${RESET}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1 as connected`;
    const ms = Date.now() - start;
    console.log(`${GREEN}✅ Connected successfully in ${ms}ms${RESET}`);

    // Check if tables exist yet
    try {
      const userCount = await prisma.user.count();
      console.log(`${GREEN}✅ Schema is migrated — found ${userCount} user(s)${RESET}`);
      if (userCount === 0) {
        console.log(`${YELLOW}⚠️  No users found — run: npm run prisma:seed${RESET}`);
      }
    } catch (schemaErr) {
      console.log(`${YELLOW}⚠️  Connected, but tables don't exist yet.${RESET}`);
      console.log(`   Run: ${CYAN}npm run prisma:migrate${RESET} then ${CYAN}npm run prisma:seed${RESET}`);
    }
  } catch (err) {
    console.error(`${RED}❌ Connection FAILED after ${Date.now() - start}ms${RESET}\n`);
    console.error(err.message);
    console.error(`\n${YELLOW}Common fixes:${RESET}`);
    console.error(`  1. If using Neon free tier: the database may be "waking up" from`);
    console.error(`     idle suspension. Wait 10 seconds and run this again.`);
    console.error(`  2. Confirm ?sslmode=require is at the end of your DATABASE_URL`);
    console.error(`  3. Confirm you copied the POOLED connection string (has "-pooler")`);
    console.error(`  4. Check the Neon dashboard — is the project/branch active?`);
    console.error(`  5. Try disabling VPN/firewall temporarily to rule out network blocks`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
