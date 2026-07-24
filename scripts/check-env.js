#!/usr/bin/env node
// scripts/check-env.js
// -- Validates .env.local before dev/build/prisma commands run.
//
// Supports TWO database modes:
//   1. SQLite   -- DATABASE_URL="file:./dev.db"        (local dev, no network)
//   2. Postgres -- DATABASE_URL="postgresql://..."     (staging/production)
//
// UPDATED: This script previously only recognized Postgres-style URLs
// and incorrectly rejected valid SQLite "file:" URLs as malformed. Now
// checks the URL scheme first and branches to the correct validator.

const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");

function fail(message) {
  console.error("\n\x1b[31m\u2716 ENVIRONMENT SETUP ERROR\x1b[0m\n");
  console.error(message);
  console.error("");
  process.exit(1);
}

function maskUrl(url) {
  // Hide password in postgresql://user:password@host -- never print secrets
  return url.replace(/(:\/\/[^:]+:)[^@]+(@)/, "$1********$2");
}

console.log(`Checking: ${envPath}\n`);

if (!fs.existsSync(envPath)) {
  fail(
    ".env.local not found.\n\n" +
    "Fix: copy the example file and fill in your own values:\n" +
    "  cp .env.example .env.local   (Mac/Linux)\n" +
    "  Copy-Item .env.example .env.local   (PowerShell)"
  );
}

const envContent = fs.readFileSync(envPath, "utf-8");
const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);

if (!match) {
  fail(
    "DATABASE_URL is missing from .env.local.\n\n" +
    "Set ONE of these:\n" +
    '  DATABASE_URL="file:./dev.db"                                    (SQLite, local dev)\n' +
    '  DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?sslmode=require"  (Postgres)'
  );
}

const dbUrl = match[1].trim();

// -- SQLite mode -----------------------------------------------------------
if (dbUrl.startsWith("file:")) {
  console.log(`\u2714 Using SQLite (local file database)`);
  console.log(`  DATABASE_URL="${dbUrl}"\n`);
  process.exit(0);
}

// -- Postgres mode -----------------------------------------------------------
if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
  const looksValid = /^postgres(ql)?:\/\/[^:]+:[^@]+@[^\/]+\/[^?]+/.test(dbUrl);

  if (!looksValid) {
    fail(
      "DATABASE_URL doesn't look like a valid Postgres connection string\n\n" +
      `Found (masked): ${maskUrl(dbUrl)}\n\n` +
      "Expected format:\n" +
      "  postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require\n\n" +
      "Common mistakes:\n" +
      '  \u2022 Missing "postgresql://" prefix\n' +
      "  \u2022 Line got cut off when copy-pasting from Neon dashboard\n" +
      '  \u2022 Extra quote marks left in (e.g. DATABASE_URL=""postgresql://...")'
    );
  }

  console.log(`\u2714 Using PostgreSQL`);
  console.log(`  DATABASE_URL="${maskUrl(dbUrl)}"\n`);
  process.exit(0);
}

// -- Neither file: nor postgresql:// -- genuinely invalid -------------------
fail(
  "DATABASE_URL doesn't start with a recognized protocol.\n\n" +
  `Found (masked): ${maskUrl(dbUrl)}\n\n` +
  "Expected ONE of:\n" +
  '  DATABASE_URL="file:./dev.db"                                        (SQLite)\n' +
  '  DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"  (Postgres)'
);
