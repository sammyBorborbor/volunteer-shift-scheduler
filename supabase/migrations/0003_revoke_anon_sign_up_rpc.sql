-- Supabase grants EXECUTE on new public-schema functions to anon by default;
-- revoke it explicitly since sign-up must require an authenticated volunteer.
revoke execute on function public.sign_up_for_shift(uuid) from anon;
