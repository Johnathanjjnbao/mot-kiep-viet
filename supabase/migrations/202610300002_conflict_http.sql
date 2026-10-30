-- Return an explicit HTTP 409 for an expected game conflict, not a retryable SQL serialization error.
begin;
create or replace function public.mkv_write_save(p_slot text, p_life_id uuid, p_snapshot jsonb,
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
  if current_rev <> p_expected_revision then raise exception 'Revision conflict' using errcode='PT409'; end if;
  insert into public.cloud_saves(user_id,slot,life_id,snapshot,revision)
    values(u,p_slot,p_life_id,p_snapshot,current_rev+1)
    on conflict(user_id,slot) do update set life_id=excluded.life_id,snapshot=excluded.snapshot,
      revision=excluded.revision,updated_at=now();
  insert into public.sync_receipts(user_id,operation_id,request_hash,revision)
    values(u,p_operation_id,digest,current_rev+1);
  return current_rev+1;
end;
$$;
commit;
