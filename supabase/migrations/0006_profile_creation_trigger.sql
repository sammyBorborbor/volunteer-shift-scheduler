-- Volunteer sign-up needs a matching profiles row, but there is no INSERT
-- policy on profiles (only select/update), so a client-side insert would be
-- rejected regardless of caller. Instead of adding a public self-insert
-- policy, auto-create the profile from a trigger on auth.users, reading
-- full_name/phone out of the signUp() options.data metadata. Role is
-- hardcoded to 'volunteer' here — coordinator account creation is a
-- separate, later step.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'volunteer',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();
