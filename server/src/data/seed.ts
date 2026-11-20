import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import { WORKS } from "./works.js";

async function upsertAccount(account: {
  email: string;
  name: string;
  role: "reader" | "desk";
  password: string;
}): Promise<void> {
  const passwordHash = await bcrypt.hash(account.password, 10);
  await prisma.reader.upsert({
    where: { email: account.email },
    update: { name: account.name, role: account.role, passwordHash },
    create: { email: account.email, name: account.name, role: account.role, passwordHash },
  });
}

// Demo accounts with well-known passwords are only created when SEED_DEMO_ACCOUNTS=true
// (local development). In production, set DESK_EMAIL and DESK_PASSWORD to create the
// staff account with a password only you know.
async function seedAccounts(): Promise<void> {
  if (process.env.SEED_DEMO_ACCOUNTS === "true") {
    await upsertAccount({
      email: "reader@readingroom.local",
      name: "Rowan Hale",
      role: "reader",
      password: "Reader123!",
    });
    await upsertAccount({
      email: "desk@readingroom.local",
      name: "Morgan Ellis",
      role: "desk",
      password: "Desk123!",
    });
  }

  const deskEmail = process.env.DESK_EMAIL?.trim().toLowerCase();
  const deskPassword = process.env.DESK_PASSWORD;
  if (deskEmail && deskPassword) {
    if (deskPassword.length < 12) throw new Error("DESK_PASSWORD must be at least 12 characters.");
    await upsertAccount({
      email: deskEmail,
      name: process.env.DESK_NAME?.trim() || "Desk",
      role: "desk",
      password: deskPassword,
    });
  }
}

export async function seedReadingRoom(): Promise<void> {
  const slugs = new Set<string>();
  const identities = new Set<string>();
  for (const work of WORKS) {
    if (slugs.has(work.slug)) throw new Error(`Duplicate slug ${work.slug}`);
    slugs.add(work.slug);
    const identity = `${work.work.toLowerCase()}|${work.writer.toLowerCase()}`;
    if (identities.has(identity)) throw new Error(`Duplicate work ${work.work}`);
    identities.add(identity);
  }
  if (WORKS.length < 200) {
    throw new Error(`The catalog seed has ${WORKS.length} titles; at least 200 are required.`);
  }

  await seedAccounts();

  const existing = await prisma.title.count();
  if (existing >= 200) {
    console.log(`Catalog already holds ${existing} titles; skipping book inserts.`);
    return;
  }

  for (const work of WORKS) {
    await prisma.title.upsert({
      where: { slug: work.slug },
      update: {},
      create: {
        slug: work.slug,
        work: work.work,
        writer: work.writer,
        category: work.category,
        year: work.year,
        note: work.note,
        gutenbergId: work.gutenbergId,
        workKey: work.work.toLowerCase(),
        writerKey: work.writer.toLowerCase(),
        categoryKey: work.category.toLowerCase(),
      },
    });
  }
  console.log(`Catalog holds ${await prisma.title.count()} titles.`);
}
