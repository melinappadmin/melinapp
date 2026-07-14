import { createClient } from "@supabase/supabase-js";
export function serverSupabase(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{global:{headers:{"x-melin-secret":process.env.ADMIN_PASSWORD!}},auth:{persistSession:false}})}
