import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export type Product = { id:string; name:string; sku:string; category:string; current_stock:number; min_stock:number; active:boolean };
export type Client = { id:string; name:string; contact_name:string|null; phone:string|null; address:string; neighborhood:string|null; city:string; state:string; latitude:number|null; longitude:number|null; current_stock:number; min_stock:number; active:boolean };
export type Movement = { id:string; product_id:string; client_id:string|null; movement_type:"entrada"|"saida"|"perda"|"reposicao"; quantity:number; notes:string|null; created_at:string };
