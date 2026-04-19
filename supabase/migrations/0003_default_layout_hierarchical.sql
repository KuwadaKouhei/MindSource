-- Switch the default layout from radial to hierarchical to match the new UX.
-- Existing rows keep whatever the user has already chosen.
alter table public.user_settings
  alter column layout set default 'hierarchical';
