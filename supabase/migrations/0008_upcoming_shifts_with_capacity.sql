-- FR-04: volunteers need remaining capacity per shift. A client-side count
-- of confirmed signups would be wrong for volunteers, since
-- signups_select_own_or_coordinator only lets a volunteer see their OWN
-- signup rows — a naive count would silently undercount everyone else's.
-- This function counts confirmed signups across all volunteers (security
-- definer, bypassing that per-row RLS for the aggregate only) but returns
-- just the computed remaining_capacity number, never the underlying signup
-- rows or who they belong to.
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
  where s.date >= current_date
  group by s.id
  order by s.date, s.start_time;
$$;

revoke execute on function public.get_upcoming_shifts_with_capacity() from public;
revoke execute on function public.get_upcoming_shifts_with_capacity() from anon;
grant execute on function public.get_upcoming_shifts_with_capacity() to authenticated;
