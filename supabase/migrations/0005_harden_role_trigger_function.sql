-- Pin search_path on the role-change-prevention trigger function, same
-- hardening as sign_up_for_shift in 0002.
alter function public.prevent_profile_role_self_change() set search_path = public;
