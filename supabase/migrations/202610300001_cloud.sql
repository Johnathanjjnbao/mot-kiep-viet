-- Review target project before running. Never run automatically in the Pages workflow.
begin;
create schema if not exists mkv_private;
revoke all on schema mkv_private from public, anon, authenticated;
create table mkv_private.invited_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on mkv_private.invited_users from public, anon, authenticated;

create function public.mkv_invited() returns boolean language sql stable
security definer set search_path = '' as $$
  select exists(select 1 from mkv_private.invited_users where user_id = (select auth.uid()));
$$;
revoke all on function public.mkv_invited() from public, anon;
grant execute on function public.mkv_invited() to authenticated;

create function public.mkv_valid_save(s jsonb, life uuid) returns boolean
language sql immutable set search_path = '' as $$
select coalesce(
  jsonb_typeof(s) = 'object' and octet_length(s::text) <= 5242880
  and s->>'identity' = life::text
  and jsonb_typeof(s->'run') = 'object'
  and jsonb_typeof(s#>'{run,actions}') = 'array'
  and jsonb_array_length(s#>'{run,actions}') <= 512
  and s->>'engineVersion' = s#>>'{run,engineVersion}'
  and s->>'contentVersion' = s#>>'{run,contentVersion}'
  and ((s->>'schemaVersion' = '3' and s->>'engineVersion' = '2.0.0' and s->>'contentVersion' = '2.0.0')
    or (s->>'schemaVersion' = '2' and s->>'engineVersion' = '1.0.0' and s->>'contentVersion' = '1.0.0')),
false);
$$;
revoke all on function public.mkv_valid_save(jsonb, uuid) from public, anon;
grant execute on function public.mkv_valid_save(jsonb, uuid) to authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);
create table public.cloud_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot text not null check (slot in ('autosave','slot-1','slot-2','slot-3')),
  life_id uuid not null,
  snapshot jsonb not null,
  revision bigint not null check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id,slot),
  check (public.mkv_valid_save(snapshot, life_id))
);
create table public.completed_lives (
  user_id uuid not null references auth.users(id) on delete cascade,
  life_id uuid not null,
  record jsonb not null,
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (user_id,life_id),
  check (octet_length(record::text) <= 5500000),
  check (record->>'id' = life_id::text),
  check (public.mkv_valid_save(record->'save', life_id)),
  check (record#>>'{save,run,status}' = 'ended'),
  check (char_length(record->>'memoir') between 1 and 10000)
);
create index completed_lives_page on public.completed_lives(user_id,created_at desc,life_id);
create table public.sync_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  request_hash text not null,
  revision bigint not null,
  created_at timestamptz not null default now(),
  primary key(user_id,operation_id)
);
alter table public.profiles enable row level security;
alter table public.cloud_saves enable row level security;
alter table public.completed_lives enable row level security;
alter table public.sync_receipts enable row level security;
alter table mkv_private.invited_users enable row level security;
revoke all on public.profiles, public.cloud_saves, public.completed_lives, public.sync_receipts from public, anon, authenticated;
grant select on public.profiles, public.cloud_saves, public.completed_lives, public.sync_receipts to authenticated;
grant insert(user_id,display_name), update(display_name) on public.profiles to authenticated;
create policy own_profile_read on public.profiles for select to authenticated
using ((select auth.uid()) = user_id and (select public.mkv_invited()));
create policy own_profile_insert on public.profiles for insert to authenticated
with check ((select auth.uid()) = user_id and (select public.mkv_invited()));
create policy own_profile_update on public.profiles for update to authenticated
using ((select auth.uid()) = user_id and (select public.mkv_invited()))
with check ((select auth.uid()) = user_id and (select public.mkv_invited()));
create policy own_save_read on public.cloud_saves for select to authenticated
using ((select auth.uid()) = user_id and (select public.mkv_invited()));
create policy own_life_read on public.completed_lives for select to authenticated
using ((select auth.uid()) = user_id and (select public.mkv_invited()));
create policy own_receipt_read on public.sync_receipts for select to authenticated
using ((select auth.uid()) = user_id and (select public.mkv_invited()));

-- Definer is necessary because clients cannot bypass CAS by writing tables directly.
-- No owner argument, dynamic SQL, or mutable search path. Every write derives owner from JWT.
create function public.mkv_write_save(p_slot text, p_life_id uuid, p_snapshot jsonb,
  p_expected_revision bigint, p_operation_id uuid) returns bigint
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); current_rev bigint; prior public.sync_receipts; digest text;
begin
  if u is null or not public.mkv_invited() then raise exception 'Invitation required' using errcode='42501'; end if;
  if p_slot is null or p_slot not in ('autosave','slot-1','slot-2','slot-3')
     or p_operation_id is null or p_life_id is null or p_expected_revision is null or p_expected_revision < 0
     or not public.mkv_valid_save(p_snapshot,p_life_id) then
    raise exception 'Invalid save request' using errcode='22023';
  end if;
  digest := encode(sha256(convert_to(jsonb_build_array(p_slot,p_life_id,p_snapshot,p_expected_revision)::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(u::text || ':' || p_slot,0));
  select * into prior from public.sync_receipts where user_id=u and operation_id=p_operation_id;
  if found then
    if prior.request_hash <> digest then raise exception 'Operation reused with different data' using errcode='23505'; end if;
    return prior.revision;
  end if;
  select revision into current_rev from public.cloud_saves where user_id=u and slot=p_slot for update;
  current_rev := coalesce(current_rev,0);
  if current_rev <> p_expected_revision then raise exception 'Revision conflict' using errcode='40001'; end if;
  insert into public.cloud_saves(user_id,slot,life_id,snapshot,revision)
    values(u,p_slot,p_life_id,p_snapshot,current_rev+1)
    on conflict(user_id,slot) do update set life_id=excluded.life_id,snapshot=excluded.snapshot,
      revision=excluded.revision,updated_at=now();
  insert into public.sync_receipts(user_id,operation_id,request_hash,revision)
    values(u,p_operation_id,digest,current_rev+1);
  return current_rev+1;
end;
$$;
revoke all on function public.mkv_write_save(text,uuid,jsonb,bigint,uuid) from public, anon;
grant execute on function public.mkv_write_save(text,uuid,jsonb,bigint,uuid) to authenticated;

create function public.mkv_archive_life(p_record jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); life uuid; digest text; old_digest text;
begin
  if u is null or not public.mkv_invited() then raise exception 'Invitation required' using errcode='42501'; end if;
  if p_record is null or octet_length(p_record::text)>5500000
    or jsonb_typeof(p_record)<>'object' then raise exception 'Invalid record' using errcode='22023'; end if;
  life := (p_record->>'id')::uuid;
  if life is null or not public.mkv_valid_save(p_record->'save',life)
    or coalesce(p_record#>>'{save,run,status}','')<>'ended'
    or coalesce(char_length(p_record->>'memoir'),0) not between 1 and 10000 then
      raise exception 'Invalid completed life' using errcode='22023'; end if;
  digest := encode(sha256(convert_to(jsonb_build_object('run',p_record#>'{save,run}','memoir',p_record->'memoir')::text,'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended(u::text || ':life:' || life::text,0));
  select checksum into old_digest from public.completed_lives where user_id=u and life_id=life;
  if found then
    if old_digest<>digest then raise exception 'Immutable archive conflict' using errcode='23505'; end if;
    return old_digest;
  end if;
  insert into public.completed_lives(user_id,life_id,record,checksum) values(u,life,p_record,digest);
  return digest;
end;
$$;
revoke all on function public.mkv_archive_life(jsonb) from public, anon;
grant execute on function public.mkv_archive_life(jsonb) to authenticated;
commit;
