/**
 * Reset password akun demo yang sudah ada di Supabase.
 * Run: npx tsx scripts/seed-demo-users.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  { email: "admin@klinik.com",    password: "admin123",    name: "Administrator",   role: "admin"    },
  { email: "apoteker@klinik.com", password: "apoteker123", name: "Apoteker Utama",  role: "apoteker" },
];

async function main() {
  console.log("=== Reset password demo users ===\n");

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw new Error(`Gagal list users: ${listError.message}`);

  for (const demo of DEMO_USERS) {
    const found = listData.users.find((u) => u.email === demo.email);
    if (!found) {
      console.log(`✗ User tidak ditemukan: ${demo.email}`);
      continue;
    }

    const { error } = await supabase.auth.admin.updateUserById(found.id, {
      password: demo.password,
      user_metadata: { ...found.user_metadata, name: demo.name, role: demo.role },
    });

    if (error) {
      console.log(`✗ Gagal update ${demo.email}: ${error.message}`);
    } else {
      console.log(`✓ ${demo.email} → password: "${demo.password}"`);
    }
  }

  console.log("\n=== Selesai! ===");
  console.log("\nKredensial demo:");
  for (const d of DEMO_USERS) {
    console.log(`  ${d.role.padEnd(10)} → ${d.email} / ${d.password}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
