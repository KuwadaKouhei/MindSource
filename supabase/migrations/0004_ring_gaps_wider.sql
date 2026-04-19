-- Widen the default generation spacing (both for new users and for the
-- column-level default). Existing users keep whatever they've already set.
alter table public.user_settings
  alter column ring_gaps set default array[120, 80];
