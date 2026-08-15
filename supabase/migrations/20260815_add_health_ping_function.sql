-- Health-check ping function for UptimeRobot monitoring.
-- Called by the `health` edge function via .rpc('health_ping').
-- Returns 1 to confirm the database is reachable.
CREATE OR REPLACE FUNCTION public.health_ping()
RETURNS integer
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
AS $$ SELECT 1; $$;

-- Allow both anon and authenticated roles to call this function
-- so the edge function (which uses the service role) can invoke it.
GRANT EXECUTE ON FUNCTION public.health_ping() TO anon, authenticated;
