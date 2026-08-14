-- Schema

create table profiles (
  id uuid references auth.users(id) primary key,
  full_name text not null,
  role text not null check (role in ('volunteer','coordinator')),
  phone text,
  created_at timestamptz default now()
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int not null check (capacity > 0),
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now(),
  check (start_time < end_time)
);

create table signups (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references shifts(id) not null,
  volunteer_id uuid references profiles(id) not null,
  status text not null default 'confirmed'
    check (status in ('confirmed','cancelled','no_show','completed')),
  signed_up_at timestamptz default now(),
  unique (shift_id, volunteer_id)
);

-- Row-Level Security

alter table profiles enable row level security;
alter table shifts enable row level security;
alter table signups enable row level security;

-- profiles: any authenticated user can read (needed for names on rosters);
-- only the owner can update their own row
create policy "profiles_select_authenticated" on profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_self" on profiles
  for update using (auth.uid() = id);

-- shifts: any authenticated user can read; only coordinators can write
create policy "shifts_select_authenticated" on shifts
  for select using (auth.role() = 'authenticated');
create policy "shifts_write_coordinator" on shifts
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'coordinator')
  );

-- signups: volunteers see/manage their own; coordinators see/manage all
create policy "signups_select_own_or_coordinator" on signups
  for select using (
    volunteer_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'coordinator')
  );
create policy "signups_insert_own" on signups
  for insert with check (volunteer_id = auth.uid());
create policy "signups_update_own_or_coordinator" on signups
  for update using (
    volunteer_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'coordinator')
  );

-- RPC: atomic capacity + overlap check for sign-up (used starting Step 6)

create or replace function sign_up_for_shift(p_shift_id uuid)
returns signups
language plpgsql
security definer
as $$
declare
  v_shift record;
  v_current_count int;
  v_overlap_count int;
  v_result signups;
begin
  select * into v_shift from shifts where id = p_shift_id;

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
