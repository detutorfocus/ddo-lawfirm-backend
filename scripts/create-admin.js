// scripts/create-admin.js
// ── Creates a new ADMIN account, or offers to switch an existing
// user's role to ADMIN if the email is already in use.
// Run locally: node scripts/create-admin.js
// Uses whatever DATABASE_URL is in your .env file.

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("Connected to:", process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "(could not read host from DATABASE_URL)");
  console.log("Double-check this is the database you intend to use.\n");

  const email = await ask("Admin email: ");
  if (!email) {
    console.error("Email is required.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (existing) {
    console.log(`\nA user already exists with this email (current role: ${existing.role}).`);
    const confirm = await ask("Switch this user's role to ADMIN instead? (y/n): ");
    if (confirm.toLowerCase() !== "y") {
      console.log("Aborted. No changes made.");
      await prisma.$disconnect();
      process.exit(0);
    }
    const updated = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: "ADMIN", isActive: true },
    });
    console.log("\n✅ Role updated:");
    console.log("   id:", updated.id);
    console.log("   email:", updated.email);
    console.log("   role:", updated.role);
    console.log("\nLog in at /login with this email and its existing password.");
    await prisma.$disconnect();
    process.exit(0);
  }

  const firstName = await ask("First name: ");
  const lastName = await ask("Last name: ");
  const password = await ask("Password (min 8 chars, 1 uppercase, 1 number, 1 special char): ");

  if (!firstName || !lastName || !password) {
    console.error("All fields are required.");
    await prisma.$disconnect();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS ?? "12"));

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: "ADMIN",
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log("\n✅ ADMIN account created:");
  console.log("   id:", user.id);
  console.log("   email:", user.email);
  console.log("   role:", user.role);
  console.log("\nYou can now log in at /login using this email and password.");

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
