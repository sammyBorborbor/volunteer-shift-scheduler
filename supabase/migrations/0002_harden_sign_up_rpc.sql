-- Pin search_path on the SECURITY DEFINER function to prevent search_path injection
alter function public.sign_up_for_shift(uuid) set search_path = public;

-- Restrict execution to authenticated users only (volunteers must be signed in to sign up)
revoke execute on function public.sign_up_for_shift(uuid) from public;
grant execute on function public.sign_up_for_shift(uuid) to authenticated;
