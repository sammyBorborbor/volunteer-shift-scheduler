-- Security fix: cancel_shift's cascade (confirmed signups -> cancelled) was
-- only enforced inside that one RPC. shifts_write_coordinator has no column
-- restriction and no explicit with check, so any coordinator could set
-- shifts.cancelled_at directly (e.g. a raw PATCH to /rest/v1/shifts) and
-- skip the cascade entirely, leaving confirmed signups orphaned on a shift
-- the app now treats as cancelled. Move the cascade into a table-level
-- trigger so it's enforced no matter which write path sets cancelled_at,
-- not just the RPC's.
create or replace function shifts_cascade_cancel_signups()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.cancelled_at is not null and old.cancelled_at is null then
    update signups set status = 'cancelled'
      where shift_id = new.id and status = 'confirmed';
  end if;
  return new;
end;
$$;

create trigger shifts_cascade_cancel_signups_trigger
  after update on shifts
  for each row
  execute function shifts_cascade_cancel_signups();

-- cancel_shift no longer needs its own explicit signups update — the
-- trigger above now guarantees it for every write path, so duplicating it
-- here would just be a second copy that could drift. The RPC's remaining
-- job is purely the role check (coordinators only).
create or replace function cancel_shift(p_shift_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'coordinator') then
    raise exception 'Only coordinators can cancel a shift';
  end if;

  update shifts set cancelled_at = now()
    where id = p_shift_id and cancelled_at is null;
end;
$$;
