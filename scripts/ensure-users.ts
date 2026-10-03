/**
 * Ensure Admin/General levels and User01/User02 exist in hps_login.
 * Run: npx tsx scripts/ensure-users.ts
 */
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function md5(password: string) {
  return crypto.createHash("md5").update(password).digest("hex");
}

async function ensureLevel(prisma: PrismaClient, name: string) {
  const existing = await prisma.hps_user_level.findFirst({
    where: { user_level_name: name },
  });
  if (!existing) {
    await prisma.hps_user_level.create({
      data: { user_level_name: name },
    });
    console.log(`Created user level: ${name}`);
  } else {
    console.log(`User level already exists: ${name}`);
  }
}

async function upsertUser(
  prisma: PrismaClient,
  opts: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    userLevel: string;
  }
) {
  const existing = await prisma.hps_login.findFirst({
    where: { he_username: opts.username },
  });

  if (existing) {
    await prisma.hps_login.update({
      where: { he_user_id: existing.he_user_id },
      data: {
        user_level: opts.userLevel,
        he_password: md5(opts.password),
        he_full_name: opts.fullName,
        he_email: opts.email,
        he_del_ind: 0,
      },
    });
    console.log(`Updated user: ${opts.username} (${opts.userLevel})`);
    return;
  }

  await prisma.hps_login.create({
    data: {
      he_username: opts.username,
      he_password: md5(opts.password),
      he_full_name: opts.fullName,
      he_email: opts.email,
      user_level: opts.userLevel,
      he_created_date: new Date(),
      he_del_ind: 0,
    },
  });
  console.log(`Created user: ${opts.username} (${opts.userLevel})`);
}

async function main() {
  loadEnvFile();
  const prisma = new PrismaClient();

  try {
    await ensureLevel(prisma, "Admin");
    await ensureLevel(prisma, "General");

    // Ensure existing admin account (case-insensitive) is Admin level.
    // Do not reset password.
    const allUsers = await prisma.hps_login.findMany({
      select: {
        he_user_id: true,
        he_username: true,
        user_level: true,
      },
    });
    const admin = allUsers.find(
      (u) => u.he_username.toLowerCase() === "admin"
    );
    if (admin) {
      await prisma.hps_login.update({
        where: { he_user_id: admin.he_user_id },
        data: {
          he_username: "Admin",
          user_level: "Admin",
          he_del_ind: 0,
        },
      });
      console.log(
        `Normalized admin user id=${admin.he_user_id}: username=Admin, user_level=Admin`
      );
    } else {
      console.warn(
        'WARNING: No user with username "Admin"/"admin" found. Create an admin account manually if needed.'
      );
    }

    await upsertUser(prisma, {
      username: "User01",
      password: "user01@Zennix53",
      fullName: "User 01",
      email: "user01@lankapack.com",
      userLevel: "General",
    });

    await upsertUser(prisma, {
      username: "User02",
      password: "user02@Zennix53",
      fullName: "User 02",
      email: "user02@lankapack.com",
      userLevel: "General",
    });

    console.log("Done.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
