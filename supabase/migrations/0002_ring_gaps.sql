-- Per-generation ring spacing for the radial layout.
-- Index 0 = pad between center and ring 1 (gen 1),
-- index 1 = pad between ring 1 and ring 2, etc. Deeper generations reuse
-- the last array element.

alter table public.user_settings
  add column if not exists ring_gaps int[] default array[40, 12];
