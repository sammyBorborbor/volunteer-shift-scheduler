-- FR-10: coordinator can edit or cancel a shift.

-- Cancel is soft-delete (cancelled_at), not a hard delete: signups.shift_id
-- has no ON DELETE CASCADE, so hard-deleting a shift with any signups fails
-- with a 23503 FK violation (verified live). Soft-delete also preserves the
-- roster/audit trail, same rationale already used for signups.status =
-- 'cancelled' instead of deleting signup rows.
alter table shifts add column cancelled_at timestamptz;

-- Prevent lowering capacity below the number of already-confirmed
-- signups — enforced in the DB, not just client validation, matching this
-- project's established pattern of the DB being the single source of truth
-- for capacity rules (see sign_up_for_shift).
create or replace function shifts_prevent_capacity_below_confirmed()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_confirmed_count int;
begin
  if new.capacity < old.capacity then
    select count(*) into v_confirmed_count from signups
      where shift_id = new.id and status = 'confirmed';
    if new.capacity < v_confirmed_count then
      raise exception 'Capacity can''t be lower than the % volunteer(s) already signed up', v_confirmed_count;
    end if;
  end if;
  return new;
end;
$$;

create trigger shifts_check_capacity_before_update
  before update on shifts
  for each row
  execute function shifts_prevent_capacity_below_confirmed();

-- Cancelling a shift needs to cascade to every confirmed signup, so a
-- volunteer's own view doesn't keep showing a live commitment to a shift
-- that no longer exists. Wrapping both writes in one RPC avoids a partial
-- cancel if the client dies between them. security definer is needed
-- because the cascade updates OTHER volunteers' signup rows, which the
-- calling coordinator's own RLS grant already covers for a plain update
-- (signups_update_coordinator) — the RPC just makes it atomic.
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

  update signups set status = 'cancelled'
    where shift_id = p_shift_id and status = 'confirmed';
end;
$$;

revoke execute on function public.cancel_shift(uuid) from public;
revoke execute on function public.cancel_shift(uuid) from anon;
grant execute on function public.cancel_shift(uuid) to authenticated;

-- Cancelled shifts drop out of both the volunteer browse list and the
-- coordinator's "Your shifts" dashboard (both read this function) — still
-- fully visible via its own roster URL and in an affected volunteer's shift
-- history, just not in the active lists.
create or replace function get_upcoming_shifts_with_capacity()
returns table (
  id uuid,
  title text,
  description text,
  location text,
  date date,
  start_time time,
  end_time time,
  capacity int,
  remaining_capacity int,
  created_by uuid
)
language sql
security definer
set search_path = public
stable
as $$
  select
    s.id,
    s.title,
    s.description,
    s.location,
    s.date,
    s.start_time,
    s.end_time,
    s.capacity,
    (s.capacity - count(su.id) filter (where su.status = 'confirmed'))::int as remaining_capacity,
    s.created_by
  from shifts s
  left join signups su on su.shift_id = s.id
  where s.date >= current_date and s.cancelled_at is null
  group by s.id
  order by s.date, s.start_time;
$$;
