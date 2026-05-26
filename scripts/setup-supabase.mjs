import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

function buildPoolerUrl(supabaseUrl, password) {
  const ref = supabaseUrl.replace("https://", "").split(".")[0];
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`;
}

async function applySchema(databaseUrl) {
  const sql = readFileSync(
    resolve(root, "supabase/migrations/001_audios.sql"),
    "utf8",
  );
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✓ Schéma SQL appliqué");
  } finally {
    await client.end();
  }
}

async function ensureBuckets(supabase) {
  const buckets = [
    {
      id: "audio-files",
      public: false,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/x-wav", "audio/webm"],
    },
    {
      id: "audio-previews",
      public: true,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/x-wav", "audio/webm"],
    },
    {
      id: "audio-covers",
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  ];

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    });

    if (error && !error.message.includes("already exists")) {
      console.warn(`⚠ Bucket ${bucket.id}: ${error.message}`);
    } else {
      console.log(`✓ Bucket ${bucket.id}`);
    }
  }
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: tableError } = await supabase.from("audios").select("id").limit(1);

  if (tableError?.code === "PGRST205" || tableError?.message?.includes("Could not find")) {
    const migrationUrl =
      env.DIRECT_URL ||
      env.DATABASE_URL?.replace(":6543/", ":5432/").replace(/\?.*$/, "") ||
      (env.SUPABASE_DB_PASSWORD
        ? buildPoolerUrl(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_DB_PASSWORD).replace(":6543/", ":5432/")
        : null);

    if (migrationUrl) {
      await applySchema(migrationUrl);
    } else {
      console.log("\n⚠ Table audios absente.");
      console.log("Ajoutez DIRECT_URL ou DATABASE_URL dans .env");
      console.log("(Supabase → Settings → Database → Connection string / Database password)");
      console.log("puis relancez: npm run setup:supabase");
      console.log("\nOu exécutez supabase/migrations/001_audios.sql dans le SQL Editor Supabase.");
    }
  } else if (tableError) {
    console.warn("⚠ Vérification table:", tableError.message);
  } else {
    console.log("✓ Table audios déjà présente");
  }

  await ensureBuckets(supabase);
  console.log("\nSetup Supabase terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
