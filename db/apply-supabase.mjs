import fs from "node:fs";
import postgres from "postgres";

const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).filter(Boolean).filter((line) => !line.trim().startsWith("#")).map((line) => { const i=line.indexOf("="); return [line.slice(0,i).trim(), line.slice(i+1).trim().replace(/^['\"]|['\"]$/g, "")]; }));
const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const sql = postgres({ host: `db.${ref}.supabase.co`, port: 5432, database: "postgres", username: "postgres", password: env.PASSWORD, ssl: "require", connect_timeout: 15, max: 1 });
try {
  await sql.unsafe(fs.readFileSync("db/supabase-schema.sql", "utf8"));
  await sql.unsafe(fs.readFileSync("db/seed-catalog.sql", "utf8"));
  await sql`insert into public.app_config(id,secret_hash) values(1,extensions.crypt(${env.ADMIN_PASSWORD},extensions.gen_salt('bf'))) on conflict(id) do update set secret_hash=excluded.secret_hash`;
  await sql`insert into public.app_users(name,email,password_hash,role) values('Administrador Melin',${env.ADMIN_EMAIL},extensions.crypt(${env.ADMIN_PASSWORD},extensions.gen_salt('bf')),'admin') on conflict(email) do update set password_hash=excluded.password_hash,active=true`;
  console.log("Schema aplicado com sucesso.");
} finally {
  await sql.end();
}
