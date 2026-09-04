-- Allow duplicate event titles across terms.
--
-- Events are now distinguished by (term, title) — the public route is
-- /events/{term}/{event-name} and the poster folder is {term}-{event-name} —
-- so a title alone no longer needs to be globally unique. Drop the unique
-- index that was previously created on events_info.title.
DROP INDEX IF EXISTS public."title";
