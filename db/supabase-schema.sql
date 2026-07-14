create extension if not exists pgcrypto;
create table if not exists public.app_config (id integer primary key default 1, secret_hash text not null);
alter table public.app_config enable row level security;
create or replace function public.is_melin_admin() returns boolean language sql stable security definer set search_path=public,extensions as $$ select exists(select 1 from app_config where secret_hash=extensions.crypt(coalesce(current_setting('request.headers',true)::json->>'x-melin-secret',''),secret_hash)) $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category text not null default 'Paieiro',
  unit text not null default 'un.',
  min_stock integer not null default 50 check (min_stock >= 0),
  current_stock integer not null default 0 check (current_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  address text not null,
  neighborhood text,
  city text not null default 'Poços de Caldas',
  state text not null default 'MG',
  latitude double precision,
  longitude double precision,
  min_stock integer not null default 20 check (min_stock >= 0),
  current_stock integer not null default 0 check (current_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  client_id uuid references public.clients(id),
  movement_type text not null check (movement_type in ('entrada','saida','perda','reposicao')),
  quantity integer not null check (quantity > 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  route_date date not null default current_date,
  status text not null default 'planejada' check (status in ('planejada','em_andamento','concluida','cancelada')),
  total_distance_km numeric(10,2) not null default 0,
  estimated_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  client_id uuid not null references public.clients(id),
  stop_order integer not null,
  planned_quantity integer not null default 0,
  delivered_quantity integer,
  status text not null default 'pendente' check (status in ('pendente','concluida','ignorada')),
  completed_at timestamptz,
  unique(route_id, stop_order)
);

create table if not exists public.client_product_stock (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  current_stock integer not null default 0 check (current_stock >= 0),
  min_stock integer not null default 10 check (min_stock >= 0),
  updated_at timestamptz not null default now(),
  unique(client_id,product_id)
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'repositor' check (role in ('admin','estoque','repositor','comercial')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('receita','despesa','ambos')),
  color text not null default '#0c5039',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(name,kind)
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('receita','despesa')),
  description text not null,
  category_id uuid references public.financial_categories(id),
  client_id uuid references public.clients(id),
  supplier text,
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  paid_at date,
  status text not null default 'pendente' check (status in ('pendente','pago','cancelado')),
  payment_method text,
  notes text,
  installment_number integer not null default 1,
  installment_total integer not null default 1,
  recurrence_group uuid,
  created_at timestamptz not null default now()
);

create or replace function public.apply_stock_movement()
returns trigger language plpgsql security definer as $$
begin
  if new.movement_type = 'entrada' then
    update public.products set current_stock = current_stock + new.quantity where id = new.product_id;
  elsif new.movement_type in ('saida','perda','reposicao') then
    update public.products set current_stock = greatest(0, current_stock - new.quantity) where id = new.product_id;
  end if;
  if new.movement_type = 'reposicao' and new.client_id is not null then
    update public.clients set current_stock = current_stock + new.quantity where id = new.client_id;
    insert into public.client_product_stock(client_id,product_id,current_stock,min_stock)
    values(new.client_id,new.product_id,new.quantity,10)
    on conflict(client_id,product_id) do update set current_stock=client_product_stock.current_stock+excluded.current_stock,updated_at=now();
  end if;
  return new;
end $$;

drop trigger if exists stock_movement_apply on public.stock_movements;
create trigger stock_movement_apply after insert on public.stock_movements for each row execute function public.apply_stock_movement();

alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.stock_movements enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;
alter table public.client_product_stock enable row level security;
alter table public.app_users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.financial_categories enable row level security;
alter table public.financial_transactions enable row level security;

drop policy if exists "anon products" on public.products;
create policy "anon products" on public.products for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "anon clients" on public.clients;
create policy "anon clients" on public.clients for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "anon movements" on public.stock_movements;
create policy "anon movements" on public.stock_movements for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "anon routes" on public.routes;
create policy "anon routes" on public.routes for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "anon route stops" on public.route_stops;
create policy "anon route stops" on public.route_stops for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "admin client stock" on public.client_product_stock;
create policy "admin client stock" on public.client_product_stock for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "admin users" on public.app_users;
create policy "admin users" on public.app_users for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "admin audit" on public.audit_logs;
create policy "admin audit" on public.audit_logs for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "admin financial categories" on public.financial_categories;
create policy "admin financial categories" on public.financial_categories for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());
drop policy if exists "admin financial transactions" on public.financial_transactions;
create policy "admin financial transactions" on public.financial_transactions for all to anon using (public.is_melin_admin()) with check (public.is_melin_admin());

insert into public.financial_categories(name,kind,color) values
  ('Vendas','receita','#28754e'),('Outras receitas','receita','#3b82f6'),
  ('Compras','despesa','#d86a1e'),('Combustível','despesa','#d5a44a'),
  ('Impostos','despesa','#a34e28'),('Manutenção','despesa','#7c5c9e'),
  ('Outras despesas','despesa','#728078')
on conflict(name,kind) do nothing;

insert into public.products (name, sku, current_stock, min_stock) values
  ('Paieiro Tradicional','PT-001',684,200),
  ('Paieiro Menta','PM-002',356,150),
  ('Paieiro Especial','PE-003',244,100)
on conflict (sku) do nothing;

insert into public.clients (name,address,neighborhood,latitude,longitude,current_stock,min_stock) 
select * from (values
  ('Empório Vila Verde','Rua Assis Figueiredo, 865','Centro',-21.7877,-46.5601,18,30),
  ('Mercado São Bento','Avenida João Pinheiro, 1040','Jardim Country Club',-21.7762,-46.5892,42,50),
  ('Armazém do Campo','Rua Pernambuco, 540','Centro',-21.7859,-46.5652,86,30),
  ('Casa Nativa','Avenida Santo Antônio, 310','Cascatinha',-21.7955,-46.5732,10,30)
) as v(name,address,neighborhood,latitude,longitude,current_stock,min_stock)
where not exists (select 1 from public.clients);
