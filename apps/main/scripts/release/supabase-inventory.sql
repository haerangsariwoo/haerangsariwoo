-- Read-only catalog review. Not a migration. Run only on the confirmed project.
-- Save any output privately; never add database dumps or member records to Git.
-- This query has not yet been run against the target database.
begin transaction read only;
set local statement_timeout = '10s';
select jsonb_build_object(
  'relations', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select n.nspname as schema, c.relname as name, c.relkind as kind,
      c.relrowsecurity as rls, c.relforcerowsecurity as force_rls, c.reloptions as options
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'storage') and c.relkind in ('r', 'p', 'v', 'm')
    order by 1, 2
  ) t),
  'columns', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select table_schema, table_name, column_name, data_type, udt_name, is_nullable
    from information_schema.columns where table_schema in ('public', 'storage')
    order by table_schema, table_name, ordinal_position
  ) t),
  'constraints', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select n.nspname as schema, c.relname as relation, con.conname as name,
      con.contype as type, con.convalidated as validated,
      pg_get_constraintdef(con.oid) as definition
    from pg_constraint con join pg_class c on c.oid = con.conrelid
      join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' order by 1, 2, 3
  ) t),
  'policies', (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
    from pg_policies p where schemaname in ('public', 'storage')),
  'grants', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select table_schema, table_name, grantee, privilege_type
    from information_schema.table_privileges
    where table_schema in ('public', 'storage') and grantee in ('anon', 'authenticated', 'service_role', 'PUBLIC')
  ) t),
  'column_grants', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select table_schema, table_name, column_name, grantee, privilege_type
    from information_schema.column_privileges
    where table_schema = 'public' and grantee in ('anon', 'authenticated', 'PUBLIC')
  ) t),
  'functions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select n.nspname as schema, p.proname as name,
      pg_get_function_identity_arguments(p.oid) as arguments,
      pg_get_function_result(p.oid) as result, p.prosecdef as security_definer,
      p.proconfig as settings,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as member_execute
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' order by 1, 2, 3
  ) t),
  'triggers', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
    select n.nspname as schema, c.relname as relation, tr.tgname as name,
      tr.tgenabled as enabled, pg_get_triggerdef(tr.oid) as definition
    from pg_trigger tr join pg_class c on c.oid = tr.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'auth') and not tr.tgisinternal order by 1, 2, 3
  ) t),
  'indexes', (select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) from pg_indexes i where schemaname = 'public'),
  'buckets', (select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb) from (
    select id, public, file_size_limit, allowed_mime_types from storage.buckets
  ) b)
) as inventory;
rollback;
