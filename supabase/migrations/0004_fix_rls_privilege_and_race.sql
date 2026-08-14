-- 1. Privilege escalation: profiles_update_self had no restriction on which
-- columns could change, so a volunteer could set their own role to
-- 'coordinator'. Block role changes outright via trigger (RLS WITH CHECK
-- can't cleanly compare old vs. new column values here).
create or replace function prevent_profile_role_self_change()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role then
    raise exception 'role cannot be changed directly';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on profiles
  for each row
  execute function prevent_profile_role_self_change();

-- 2. Broken access control: signups_update_own_or_coordinator let a volunteer
-- set their own signup's status to any value, including 'completed'/'no_show'
-- (self-marking attendance). Split into a self-cancel-only policy and a
-- separate coordinator policy with full access.
drop policy "signups_update_own_or_coordinator" on signups;

create policy "signups_update_own_cancel_only" on signups
  for update using (volunteer_id = auth.uid() and status = 'confirmed')
  with check (volunteer_id = auth.uid() and status = 'cancelled');

create policy "signups_update_coordinator" on signups
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'coordinator')
  );

-- 3. TOCTOU race: sign_up_for_shift read capacity with a plain SELECT before
-- inserting, so two concurrent calls for the same shift could both pass the
-- capacity check and both insert. Lock the shift row first so concurrent
-- sign-ups for the same shift serialize.
create or replace function sign_up_for_shift(p_shift_id uuid)
returns signups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift record;
  v_current_count int;
  v_overlap_count int;
  v_result signups;
begin
  select * into v_shift from shifts where id = p_shift_id for update;

  select count(*) into v_current_count from signups
    where shift_id = p_shift_id and status = 'confirmed';
  if v_current_count >= v_shift.capacity then
    raise exception 'Shift is at capacity';
  end if;

  select count(*) into v_overlap_count from signups s
    join shifts sh on sh.id = s.shift_id
    where s.volunteer_id = auth.uid()
      and s.status = 'confirmed'
      and sh.date = v_shift.date
      and sh.start_time < v_shift.end_time
      and sh.end_time > v_shift.start_time;
  if v_overlap_count > 0 then
    raise exception 'Schedule conflict with an existing shift';
  end if;

  insert into signups (shift_id, volunteer_id, status)
    values (p_shift_id, auth.uid(), 'confirmed')
    returning * into v_result;
  return v_result;
end;
$$;

revoke execute on function public.sign_up_for_shift(uuid) from public;
revoke execute on function public.sign_up_for_shift(uuid) from anon;
grant execute on function public.sign_up_for_shift(uuid) to authenticated;
