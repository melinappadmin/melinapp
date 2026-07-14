import postgres from "postgres";
function config(){const ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];return {host:`db.${ref}.supabase.co`,port:5432,database:"postgres",username:"postgres",password:process.env.PASSWORD,ssl:"require" as const,max:1}}
export function db(){return postgres(config())}
