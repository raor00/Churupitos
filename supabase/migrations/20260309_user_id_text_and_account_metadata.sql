alter table if exists public.accounts
    alter column user_id type text using user_id::text;

alter table if exists public.categories
    alter column user_id type text using user_id::text;

alter table if exists public.transactions
    alter column user_id type text using user_id::text;

alter table if exists public.buckets
    alter column user_id type text using user_id::text;

create index if not exists accounts_user_id_idx on public.accounts (user_id);
create index if not exists categories_user_id_idx on public.categories (user_id);
create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists buckets_user_id_idx on public.buckets (user_id);

alter table if exists public.accounts
    add column if not exists account_scope text;

alter table if exists public.accounts
    add column if not exists bank_id text;

alter table if exists public.accounts
    add column if not exists logo_url text;

alter table if exists public.accounts
    add column if not exists display_icon text;

update public.accounts
set account_scope = case
    when currency = 'VES' then 'national'
    else 'international'
end
where account_scope is null;
