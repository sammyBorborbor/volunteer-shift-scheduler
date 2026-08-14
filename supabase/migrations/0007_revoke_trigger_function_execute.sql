-- handle_new_user is a trigger function and Postgres refuses to invoke it
-- directly ("trigger functions can only be called as triggers"), so this
-- isn't exploitable — but revoke the default anon/authenticated EXECUTE
-- grants anyway to keep the security advisor clean, same as the other
-- SECURITY DEFINER functions in this project.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
