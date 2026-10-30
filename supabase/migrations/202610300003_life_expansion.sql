-- Add the versioned Life Expansion envelope. No rows, RLS policies or grants change.
-- Apply only to project kqnapcyceddwvrvkquvg after explicit owner approval.
begin;
create or replace function public.mkv_valid_save(s jsonb, life uuid) returns boolean
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
    or (s->>'schemaVersion' = '2' and s->>'engineVersion' = '1.0.0' and s->>'contentVersion' = '1.0.0')
    or (s->>'schemaVersion' = '4' and s->>'engineVersion' = '3.0.0' and s->>'contentVersion' = '3.0.0')),
false);
$$;
commit;
