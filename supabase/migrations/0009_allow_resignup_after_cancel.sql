-- signups has a unique (shift_id, volunteer_id) constraint, and
-- sign_up_for_shift did a plain insert — so a volunteer who cancelled and
-- then tried to sign up again for the same shift hit a raw
-- "duplicate key value violates unique constraint" error instead of
-- succeeding. Cancel-then-resignup is an ordinary flow (FR-05 + FR-06
-- composing), not an edge case. Fix: if an existing row for this
-- shift/volunteer is 'cancelled', flip it back to 'confirmed' instead of
-- inserting a second row. Any other existing status (confirmed already,
-- completed, no_show) is a distinct, clearly-worded rejection rather than
-- falling through to the capacity/overlap checks or the constraint error.
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
  v_existing_status text;
  v_result signups;
begin
  select * into v_shift from shifts where id = p_shift_id for update;

  select status into v_existing_status from signups
    where shift_id = p_shift_id and volunteer_id = auth.uid();

  if v_existing_status is not null and v_existing_status != 'cancelled' then
    raise exception 'You have already signed up for this shift';
  end if;

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

  if v_existing_status = 'cancelled' then
    update signups set status = 'confirmed', signed_up_at = now()
      where shift_id = p_shift_id and volunteer_id = auth.uid()
      returning * into v_result;
  else
    insert into signups (shift_id, volunteer_id, status)
      values (p_shift_id, auth.uid(), 'confirmed')
      returning * into v_result;
  end if;

  return v_result;
end;
$$;

revoke execute on function public.sign_up_for_shift(uuid) from public;
revoke execute on function public.sign_up_for_shift(uuid) from anon;
grant execute on function public.sign_up_for_shift(uuid) to authenticated;
