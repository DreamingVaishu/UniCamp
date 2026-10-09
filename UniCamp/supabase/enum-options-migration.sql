-- UniCamp enum dropdown migration
-- Run this once in Supabase SQL Editor against your existing database.
-- It does not recreate or delete any tables or records.

create or replace function public.get_enum_options()
returns table (enum_name text, enum_value text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select t.typname::text, e.enumlabel::text
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
    and t.typname = any (array[
      'user_role',
      'department_type',
      'course_type',
      'division_type',
      'student_status',
      'fee_status',
      'payment_status',
      'payment_method',
      'attendance_status',
      'result_status',
      'notification_type'
    ])
  order by t.typname, e.enumsortorder;
$$;

revoke all on function public.get_enum_options() from public;
grant execute on function public.get_enum_options() to authenticated;
