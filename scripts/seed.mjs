/**
 * scripts/seed.mjs
 * -----------------
 * Seeds the Firebase Realtime Database with 15 test issues.
 * Reads credentials from .env.local automatically.
 *
 * Usage:
 *   node scripts/seed.mjs           # add data only if DB is empty
 *   node scripts/seed.mjs --force   # wipe + re-seed even if data exists
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove } from "firebase/database";

// ── Load .env.local manually (dotenv ESM workaround) ────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

try {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && value && !process.env[key]) process.env[key] = value;
  }
} catch {
  console.warn("⚠️  Could not read .env.local – using process environment variables.");
}

// ── Validate credentials ────────────────────────────────────────────────────
const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_DATABASE_URL,
} = process.env;

if (!FIREBASE_API_KEY || !VITE_FIREBASE_DATABASE_URL) {
  console.error(
    "❌  Missing Firebase credentials.\n" +
    "    Fill in FIREBASE_API_KEY and VITE_FIREBASE_DATABASE_URL in .env.local\n" +
    "    (see .env.local template in the project root)"
  );
  process.exit(1);
}

// ── Connect to Firebase ─────────────────────────────────────────────────────
const app = initializeApp({
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
  databaseURL: VITE_FIREBASE_DATABASE_URL,
});

const db = getDatabase(app);

// ── Seed data ────────────────────────────────────────────────────────────────
const seedDataPath = resolve(__dirname, "../firebase-seed.json");
const seedData = JSON.parse(readFileSync(seedDataPath, "utf-8"));

const force = process.argv.includes("--force");

async function seed() {
  const issuesRef = ref(db, "issues");

  if (!force) {
    const snapshot = await get(issuesRef);
    if (snapshot.exists()) {
      const count = Object.keys(snapshot.val()).length;
      console.log(`ℹ️  Database already has ${count} issues. Use --force to overwrite.`);
      process.exit(0);
    }
  } else {
    console.log("⚠️  --force flag set: removing existing issues...");
    await remove(issuesRef);
  }

  console.log(`⏳ Seeding ${Object.keys(seedData.issues).length} issues...`);
  await set(issuesRef, seedData.issues);
  console.log(`✅ Seeded ${Object.keys(seedData.issues).length} issues successfully!`);
  console.log(`   Database URL: ${VITE_FIREBASE_DATABASE_URL}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message || err);
  process.exit(1);
});
