// ============================================================
// D.D. ONIETAN (SAN) & CO. — DATABASE SEED
// Run: npm run prisma:seed
//
// This single seed file works against BOTH SQLite (local dev) and
// PostgreSQL (staging/production) without modification. It detects
// which provider is active from DATABASE_URL and automatically
// JSON-encodes array/object fields only when SQLite is in use, since
// SQLite has no native array/JSON column types (see prisma/schema.sqlite.prisma
// for the full explanation of type differences between the two schemas).
//
// ── PRODUCTION SAFETY GUARD ────────────────────────────────
// This script refuses to run against what looks like a live/production
// database, UNLESS you explicitly pass ALLOW_PROD_SEED=true. This is a
// two-layer check because NODE_ENV alone is not fully reliable — some
// hosting platforms (Railway, Vercel preview deploys) set
// NODE_ENV=production even for non-live environments:
//
//   Layer 1: NODE_ENV === "production"        → blocks by default
//   Layer 2: existing real user count > seed's own admin/lawyer/client
//            count already present            → blocks even if NODE_ENV
//                                                 was misconfigured
//
// To intentionally seed a production database (e.g. first-time setup
// of a brand new prod instance with zero users), run:
//   npm run prisma:seed:prod-authorized
// (This works identically on PowerShell, cmd.exe, and Bash/Unix shells
// via cross-env — do NOT use "ALLOW_PROD_SEED=true npm run ..." directly,
// that syntax only works in Bash and will fail on Windows PowerShell.)
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

// Detect provider from the DATABASE_URL scheme — "file:" means SQLite.
const IS_SQLITE = (process.env.DATABASE_URL ?? "").startsWith("file:");

/**
 * Wraps a JS array so it's stored correctly regardless of database:
 *   - SQLite:   returns JSON.stringify(arr)  → stored as a String column
 *   - Postgres: returns arr unchanged        → stored as a native String[] column
 */
function arrayField<T>(arr: T[]): T[] {
  return IS_SQLITE ? (JSON.stringify(arr) as unknown as T[]) : arr;
}
/**
 * Wraps a JS object/null for storage in a Json-typed field:
 *   - SQLite:   returns JSON.stringify(obj)  → stored as a String column
 *   - Postgres: returns obj unchanged        → stored as a native Json column
 */
function jsonField(obj: unknown): unknown {
  return IS_SQLITE ? JSON.stringify(obj) : obj;
}

/**
 * Prompts the user for a y/N confirmation in the terminal.
 * Used as a final human-in-the-loop check before an explicitly
 * authorized production seed proceeds.
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

/**
 * Guards against accidentally running this seed script against a
 * live production database. Exits the process if the checks fail
 * and ALLOW_PROD_SEED was not explicitly set.
 */
async function guardAgainstProductionSeed(): Promise<void> {
  const isProdEnv = process.env.NODE_ENV === "production";
  const explicitlyAllowed = process.env.ALLOW_PROD_SEED === "true";

  // Layer 2 check: does the database already contain real, non-seed
  // data? We check for ANY existing user whose email is not one of
  // this script's own known seed accounts — a strong signal that
  // real people have already signed up.
  const KNOWN_SEED_EMAILS = [
    "admin@ddonietanandco.com",
    "dd.onietan@ddonietanandco.com",
    "adaeze.okonkwo@ddonietanandco.com",
    "emeka.nwosu@ddonietanandco.com",
    "e.adesanya@adesanyagroup.com",
    "m.ibrahim@ibrahimholdings.ng",
  ];

  let hasRealUsers = false;
  try {
    const existingUserCount = await prisma.user.count({
      where: { email: { notIn: KNOWN_SEED_EMAILS } },
    });
    hasRealUsers = existingUserCount > 0;
  } catch {
    // Table may not exist yet (first-ever migration) — safe to proceed,
    // there is nothing to protect on a genuinely empty new database.
    hasRealUsers = false;
  }

  if (!isProdEnv && !hasRealUsers) {
    return; // Clearly a local/dev environment with no real data — proceed normally.
  }

  console.log("\n🛑  PRODUCTION SEED GUARD TRIGGERED  🛑");
  console.log("─────────────────────────────────────────");
  if (isProdEnv) console.log("  • NODE_ENV is set to \"production\"");
  if (hasRealUsers) console.log("  • Database already contains users NOT created by this seed script");
  console.log("─────────────────────────────────────────\n");

  if (!explicitlyAllowed) {
    console.error("❌ Refusing to seed. This looks like a live/production environment.\n");
    console.error("If this is genuinely a brand-new production database with zero real");
    console.error("users and you want to seed initial demo/admin accounts, re-run with:\n");
    console.error("   npm run prisma:seed:prod-authorized\n");
    await prisma.$disconnect();
    process.exit(1);
  }

  // Even with the explicit env flag, require an interactive human
  // confirmation as a final safety net — prevents a copy-pasted
  // command from a runbook/CI script running unattended.
  if (hasRealUsers) {
    console.warn("⚠️  ALLOW_PROD_SEED=true was set, but real users already exist.");
    const confirmed = await askConfirmation(
      "Type 'y' to proceed anyway, or anything else to abort: "
    );
    if (!confirmed) {
      console.error("\n❌ Aborted by user. No changes were made.");
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  console.log("\n✅ Proceeding with explicit authorization.\n");
}

async function main() {
  await guardAgainstProductionSeed();

  console.log("🌱 Seeding D.D. Onietan & Co. database...");

  const BCRYPT_ROUNDS = 12;

  // ── 1. ADMIN USER ─────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ddonietanandco.com" },
    update: {},
    create: {
      email: "admin@ddonietanandco.com",
      passwordHash: await bcrypt.hash("Admin@Onietan2024!", BCRYPT_ROUNDS),
      role: "ADMIN",
      firstName: "System",
      lastName: "Administrator",
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log("✅ Admin user created:", adminUser.email);

  // ── 2. PRINCIPAL LAWYER — D.D. Onietan SAN ───────────
  const principalUser = await prisma.user.upsert({
    where: { email: "dd.onietan@ddonietanandco.com" },
    update: {},
    create: {
      email: "dd.onietan@ddonietanandco.com",
      passwordHash: await bcrypt.hash("Lawyer@Onietan2024!", BCRYPT_ROUNDS),
      role: "LAWYER",
      firstName: "D.D.",
      lastName: "Onietan",
      phone: "+234 803 XXX XXXX",
      isEmailVerified: true,
      isActive: true,
    },
  });

  const principalLawyer = await prisma.lawyer.upsert({
    where: { userId: principalUser.id },
    update: {},
    create: {
      userId: principalUser.id,
      barNumber: "NBA/ABJ/SAN/0001",
      title: "SAN",
      position: "Principal Partner & Senior Advocate of Nigeria",
      specializations: arrayField(["Constitutional Law", "Corporate Law", "Commercial Litigation", "Arbitration"]),
      biography: "D.D. Onietan (SAN) is a distinguished Senior Advocate of Nigeria with over 30 years of exceptional legal practice. Called to the Nigerian Bar in 1994, he rose to the rank of Senior Advocate of Nigeria — the highest distinction conferred upon legal practitioners in Nigeria — through decades of landmark judgments, corporate counsel, and unwavering client representation at the highest courts of the land, including the Supreme Court of Nigeria.",
      qualifications: arrayField(["LLB (Hons) University of Lagos", "BL Nigerian Law School", "LLM University of London"]),
      certifications: arrayField(["Senior Advocate of Nigeria (SAN)", "Accredited Arbitrator (CIAMBN)", "ACIArb (Chartered Institute of Arbitrators)"]),
      courtAdmissions: arrayField(["Supreme Court of Nigeria", "Court of Appeal", "Federal High Court", "High Courts of all States", "National Industrial Court"]),
      professionalMemberships: arrayField(["Nigerian Bar Association (NBA)", "Society of Construction Law Nigeria (SCLON)", "Institute of Chartered Mediators and Conciliators", "Commonwealth Lawyers Association", "International Bar Association (IBA)"]),
      yearsOfExperience: 30,
      hourlyRate: 150000, // NGN
    },
  });
  console.log("✅ Principal Lawyer created:", principalUser.email);

  // ── 3. SENIOR PARTNER — Adaeze Okonkwo ───────────────
  const lawyer2User = await prisma.user.upsert({
    where: { email: "adaeze.okonkwo@ddonietanandco.com" },
    update: {},
    create: {
      email: "adaeze.okonkwo@ddonietanandco.com",
      passwordHash: await bcrypt.hash("Lawyer@Onietan2024!", BCRYPT_ROUNDS),
      role: "LAWYER",
      firstName: "Adaeze",
      lastName: "Okonkwo",
      phone: "+234 805 XXX XXXX",
      isEmailVerified: true,
      isActive: true,
    },
  });

  const lawyer2 = await prisma.lawyer.upsert({
    where: { userId: lawyer2User.id },
    update: {},
    create: {
      userId: lawyer2User.id,
      barNumber: "NBA/ABJ/2006/0234",
      title: "Esq.",
      position: "Senior Partner",
      specializations: arrayField(["Commercial Litigation", "Dispute Resolution", "Banking & Finance Law"]),
      biography: "Adaeze Okonkwo is a highly accomplished commercial litigator with 18 years of experience handling complex commercial disputes. She is known for her sharp analytical skills and aggressive advocacy in Nigerian courts.",
      qualifications: arrayField(["LLB (Hons) University of Abuja", "BL Nigerian Law School", "LLM Commercial Law (UCL, London)"]),
      certifications: arrayField(["Accredited Mediator (ICMC)", "CIARB Member"]),
      courtAdmissions: arrayField(["Court of Appeal", "Federal High Court", "State High Courts"]),
      professionalMemberships: arrayField(["Nigerian Bar Association (NBA)", "Women in Law Nigeria (WILN)"]),
      yearsOfExperience: 18,
      hourlyRate: 80000,
    },
  });

  // ── 4. MANAGING PARTNER — Emeka Nwosu ────────────────
  const lawyer3User = await prisma.user.upsert({
    where: { email: "emeka.nwosu@ddonietanandco.com" },
    update: {},
    create: {
      email: "emeka.nwosu@ddonietanandco.com",
      passwordHash: await bcrypt.hash("Lawyer@Onietan2024!", BCRYPT_ROUNDS),
      role: "LAWYER",
      firstName: "Emeka",
      lastName: "Nwosu",
      isEmailVerified: true,
      isActive: true,
    },
  });

  const lawyer3 = await prisma.lawyer.upsert({
    where: { userId: lawyer3User.id },
    update: {},
    create: {
      userId: lawyer3User.id,
      barNumber: "NBA/PH/2009/0567",
      title: "Esq.",
      position: "Managing Partner",
      specializations: arrayField(["Oil & Gas Law", "Energy Law", "Environmental Law", "Corporate Law"]),
      biography: "Emeka Nwosu specializes in the Nigerian energy sector, providing expert legal counsel on upstream and downstream oil and gas operations, project finance, and regulatory compliance.",
      qualifications: arrayField(["LLB (Hons) University of Benin", "BL Nigerian Law School", "LLM Energy Law (Aberdeen)"]),
      certifications: arrayField(["ICSID Arbitration Practitioner", "Energy Law Certificate (IBA)"]),
      courtAdmissions: arrayField(["Federal High Court", "Federal Court of Appeal"]),
      professionalMemberships: arrayField(["NBA", "International Energy Bar Association", "NNPC Legal Advisory Panel"]),
      yearsOfExperience: 15,
      hourlyRate: 90000,
    },
  });
  console.log("✅ 3 Lawyers seeded");

  // ── 5. CLIENT USERS ────────────────────────────────────
  const client1User = await prisma.user.upsert({
    where: { email: "e.adesanya@adesanyagroup.com" },
    update: {},
    create: {
      email: "e.adesanya@adesanyagroup.com",
      passwordHash: await bcrypt.hash("Client@Onietan2024!", BCRYPT_ROUNDS),
      role: "CLIENT",
      firstName: "Emmanuel",
      lastName: "Adesanya",
      phone: "+234 806 XXX XXXX",
      isEmailVerified: true,
      isActive: true,
    },
  });

  const client1 = await prisma.client.upsert({
    where: { userId: client1User.id },
    update: {},
    create: {
      userId: client1User.id,
      clientNumber: "DDO/CLT/2024/001",
      companyName: "Adesanya Group of Companies",
      industry: "Conglomerate / Real Estate",
      address: "15, Adeola Odeku Street",
      city: "Victoria Island",
      state: "Lagos",
      country: "Nigeria",
    },
  });

  const client2User = await prisma.user.upsert({
    where: { email: "m.ibrahim@ibrahimholdings.ng" },
    update: {},
    create: {
      email: "m.ibrahim@ibrahimholdings.ng",
      passwordHash: await bcrypt.hash("Client@Onietan2024!", BCRYPT_ROUNDS),
      role: "CLIENT",
      firstName: "Musa",
      lastName: "Ibrahim",
      isEmailVerified: true,
      isActive: true,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { userId: client2User.id },
    update: {},
    create: {
      userId: client2User.id,
      clientNumber: "DDO/CLT/2024/002",
      companyName: "Ibrahim Holdings Ltd.",
      industry: "Oil & Gas / Agriculture",
      address: "Plot 23, Murtala Mohammed Way",
      city: "Kano",
      state: "Kano",
      country: "Nigeria",
    },
  });
  console.log("✅ 2 Client users seeded");

  // ── 6. CASES ───────────────────────────────────────────
  const case1 = await prisma.case.upsert({
    where: { caseNumber: "DDO/2024/001" },
    update: {},
    create: {
      caseNumber: "DDO/2024/001",
      title: "Adesanya Group v. Federal Government of Nigeria",
      description: "Constitutional challenge regarding compulsory acquisition of commercial property in Victoria Island without adequate compensation. The firm represents the Adesanya Group in this landmark constitutional litigation.",
      clientId: client1.id,
      courtName: "Supreme Court of Nigeria",
      courtLocation: "Abuja",
      filingDate: new Date("2024-01-15"),
      status: "ACTIVE",
      priority: "HIGH",
      practiceArea: "Constitutional Law",
      estimatedValue: 2500000000, // 2.5 Billion NGN
      retainerAmount: 25000000,
      notes: "High-profile constitutional matter. All communications strictly confidential.",
    },
  });

  // Assign principal lawyer
  await prisma.caseLawyer.upsert({
    where: { caseId_lawyerId: { caseId: case1.id, lawyerId: principalLawyer.id } },
    update: {},
    create: {
      caseId: case1.id,
      lawyerId: principalLawyer.id,
      role: "Lead Counsel",
    },
  });

  const case2 = await prisma.case.upsert({
    where: { caseNumber: "DDO/2024/087" },
    update: {},
    create: {
      caseNumber: "DDO/2024/087",
      title: "Ibrahim Holdings Ltd. v. NLNG — Oil Field Contract Dispute",
      description: "Commercial arbitration and subsequent court action arising from breach of JOA (Joint Operating Agreement) between Ibrahim Holdings and NLNG. Seeking damages of $45M USD for wrongful contract termination.",
      clientId: client2.id,
      courtName: "Federal High Court",
      courtLocation: "Port Harcourt",
      filingDate: new Date("2024-06-10"),
      status: "HEARING_SCHEDULED",
      priority: "URGENT",
      practiceArea: "Oil & Gas Law",
      estimatedValue: 35000000000,
      retainerAmount: 50000000,
    },
  });

  await prisma.caseLawyer.upsert({
    where: { caseId_lawyerId: { caseId: case2.id, lawyerId: lawyer3.id } },
    update: {},
    create: {
      caseId: case2.id,
      lawyerId: lawyer3.id,
      role: "Lead Counsel",
    },
  });

  // ── 7. HEARINGS ────────────────────────────────────────
  await prisma.hearing.createMany({
    data: [
      {
        caseId: case1.id,
        hearingDate: new Date("2025-01-15T09:00:00"),
        court: "Supreme Court of Nigeria, Abuja",
        hearingType: "Hearing",
        judge: "Honourable Justice A. Augie JSC",
        notes: "Oral arguments on constitutional grounds. Prepare comprehensive brief.",
        isCompleted: false,
      },
      {
        caseId: case1.id,
        hearingDate: new Date("2024-11-20T09:00:00"),
        court: "Supreme Court of Nigeria, Abuja",
        hearingType: "Mention",
        judge: "Honourable Justice A. Augie JSC",
        result: "Matter adjourned to Jan 15, 2025 for hearing.",
        isCompleted: true,
      },
      {
        caseId: case2.id,
        hearingDate: new Date("2025-01-22T10:00:00"),
        court: "Federal High Court, Port Harcourt",
        hearingType: "Hearing",
        judge: "Honourable Justice O. Nwosu",
        notes: "Witness examination scheduled.",
        isCompleted: false,
      },
    ],
  });

  // ── 8. TASKS ───────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      {
        title: "Prepare Supreme Court brief for Case DDO/2024/001",
        description: "Draft comprehensive constitutional arguments for Jan 15 hearing. Cite precedents from Marwa v. Mustapha and Fundamental Rights cases.",
        caseId: case1.id,
        assignedToId: principalUser.id,
        createdById: adminUser.id,
        lawyerId: principalLawyer.id,
        status: "IN_PROGRESS",
        priority: "URGENT",
        dueDate: new Date("2025-01-10"),
        tags: arrayField(["constitutional", "brief", "supreme-court"]),
      },
      {
        title: "Review NLNG Joint Operating Agreement documents",
        description: "Thoroughly review all JOA documents, correspondence, and financial records for Case DDO/2024/087 ahead of hearing.",
        caseId: case2.id,
        assignedToId: lawyer3User.id,
        createdById: adminUser.id,
        lawyerId: lawyer3.id,
        status: "TODO",
        priority: "HIGH",
        dueDate: new Date("2025-01-18"),
        tags: arrayField(["oil-gas", "review", "contract"]),
      },
    ],
  });

  // ── 9. PUBLICATIONS ────────────────────────────────────
  await prisma.publication.createMany({
    data: [
      {
        title: "Constitutional Dimensions of Electoral Law in Nigeria 2024",
        excerpt: "A comprehensive analysis of recent Supreme Court decisions on electoral matters and their implications for Nigeria's democratic process.",
        content: "The Nigerian electoral jurisprudence has witnessed unprecedented developments in 2024...",
        slug: "constitutional-dimensions-electoral-law-nigeria-2024",
        authorId: principalLawyer.id,
        category: "Constitutional Law",
        tags: arrayField(["constitution", "electoral-law", "supreme-court", "Nigeria"]),
        status: "PUBLISHED",
        publishedAt: new Date("2024-12-01"),
      },
      {
        title: "Oil & Gas Contracts: Navigating International Arbitration in 2024",
        excerpt: "Key insights for Nigerian energy companies entering international arbitration proceedings, with lessons from recent ICSID awards.",
        content: "The Nigerian oil and gas sector continues to be a fertile ground for complex arbitration proceedings...",
        slug: "oil-gas-contracts-international-arbitration-2024",
        authorId: lawyer3.id,
        category: "Energy Law",
        tags: arrayField(["oil-gas", "arbitration", "ICSID", "energy"]),
        status: "PUBLISHED",
        publishedAt: new Date("2024-11-15"),
      },
    ],
  });

  // ── 10. CONSULTATION REQUESTS ──────────────────────────
  await prisma.consultationRequest.createMany({
    data: [
      {
        fullName: "Chioma Obi",
        email: "chioma.obi@email.com",
        phone: "+234 807 XXX XXXX",
        serviceNeeded: "Property Law",
        message: "I need advice on a land dispute in Lekki involving a disputed Certificate of Occupancy.",
        status: "NEW",
      },
      {
        fullName: "Babatunde Adeyemi",
        email: "b.adeyemi@company.ng",
        phone: "+234 808 XXX XXXX",
        serviceNeeded: "Corporate Law",
        message: "We are planning a merger and need expert legal counsel on regulatory approvals and due diligence.",
        status: "CONTACTED",
      },
    ],
  });

  // ── 11. NEWSLETTER SUBSCRIBERS ─────────────────────────
  await prisma.newsletterSubscriber.createMany({
    data: [
      { fullName: "Seun Fashola", email: "seun.fashola@email.com" },
      { fullName: "Ngozi Okafor", email: "ngozi.okafor@company.ng" },
      { fullName: "Ahmed Danjuma", email: "ahmed.danjuma@firm.ng" },
    ],
  });

  console.log("\n🎉 Database seeded successfully!");
  console.log("─────────────────────────────────────");
  console.log("📧 Admin:   admin@ddonietanandco.com / Admin@Onietan2024!");
  console.log("⚖️  Lawyer:  dd.onietan@ddonietanandco.com / Lawyer@Onietan2024!");
  console.log("👤 Client:  e.adesanya@adesanyagroup.com / Client@Onietan2024!");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
