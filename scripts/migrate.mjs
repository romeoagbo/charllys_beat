import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split("\n")) {
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

async function main() {
  const env = loadEnv();
  const databaseUrl =
    env.DIRECT_URL ||
    env.DATABASE_URL?.replace(":6543/", ":5432/").replace(/\?.*$/, "");

  if (!databaseUrl) {
    console.error("DIRECT_URL ou DATABASE_URL requis dans .env");
    process.exit(1);
  }

  const migrationsDir = resolve(root, "supabase/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  await client.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const schemaChecks = {
    "001_audios.sql": `
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'audios'
    `,
    "002_user_roles.sql": `
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
    `,
    "003_experts.sql": `
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'experts'
    `,
  };

  for (const file of files) {
    const check = schemaChecks[file];
    if (!check) continue;
    const { rows: recorded } = await client.query(
      "select 1 from public.schema_migrations where filename = $1",
      [file],
    );
    if (recorded.length > 0) continue;
    const { rows: exists } = await client.query(check);
    if (exists.length > 0) {
      await client.query(
        "insert into public.schema_migrations (filename) values ($1) on conflict do nothing",
        [file],
      );
      console.log(`↷ ${file} (déjà en base, enregistrée)`);
    }
  }

  try {
    for (const file of files) {
      const { rows } = await client.query(
        "select 1 from public.schema_migrations where filename = $1",
        [file],
      );

      if (rows.length > 0) {
        console.log(`↷ ${file} (déjà appliquée)`);
        continue;
      }

      const sql = readFileSync(resolve(migrationsDir, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into public.schema_migrations (filename) values ($1)",
          [file],
        );
        await client.query("commit");
        console.log(`✓ ${file}`);
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    }

    const { rows: cols } = await client.query(`
      select
        exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
        ) as has_role,
        exists (
          select 1 from information_schema.columns
          where table_schema = 'public' and table_name = 'audios' and column_name = 'kind'
        ) as has_kind,
        exists (
          select 1 from information_schema.tables
          where table_schema = 'public' and table_name = 'experts'
        ) as has_experts
    `);

    console.log("\nÉtat schéma :");
    console.log(`  profiles.role : ${cols[0].has_role ? "OK" : "MANQUANT"}`);
    console.log(`  audios.kind   : ${cols[0].has_kind ? "OK" : "MANQUANT"}`);
    console.log(`  experts       : ${cols[0].has_experts ? "OK" : "MANQUANT"}`);
    console.log("\nMigrations terminées.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
