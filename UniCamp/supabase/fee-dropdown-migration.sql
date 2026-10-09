-- UniCamp: safe migration for the existing schema
-- Run in Supabase SQL Editor. Does not drop existing tables or data.
-- Backup your database before applying migrations in production.

begin;

-- 1. Ensure expected enum types exist (leave existing types unchanged).
do $$ begin
  create type public.fee_type as enum (
    'tuition', 'admission', 'exam', 'transport', 'library', 'other'
  );
exception when duplicate_object then null;
end $$;

-- 2. Extend fee structures for the new fee form.
alter table public.fee_structures
  add column if not exists semester integer,
  add column if not exists fee_type public.fee_type,
  add column if not exists amount numeric(12,2),
  add column if not exists due_date date,
  add column if not exists updated_at timestamptz not null default now();

-- Existing rows may use the old multi-column fee format.
-- Derive a useful fee type and total amount without overwriting old columns.
update public.fee_structures
set
  fee_type = coalesce(
    fee_type,
    case
      when coalesce(tuition_fee, 0) > 0 then 'tuition'::public.fee_type
      when coalesce(admission_fee, 0) > 0 then 'admission'::public.fee_type
      when coalesce(exam_fee, 0) > 0 then 'exam'::public.fee_type
      when coalesce(transport_fee, 0) > 0 then 'transport'::public.fee_type
      else 'other'::public.fee_type
    end
  ),
  amount = coalesce(
    amount,
    coalesce(tuition_fee, 0) + coalesce(admission_fee, 0) +
    coalesce(exam_fee, 0) + coalesce(transport_fee, 0) +
    coalesce(other_fee, 0)
  )
where fee_type is null or amount is null;

-- 3. Student fee assignment stores the exact amount charged to each student.
alter table public.student_fees
  add column if not exists amount numeric(12,2),
  add column if not exists fee_type public.fee_type,
  add column if not exists academic_year text;

update public.student_fees sf
set
  amount = coalesce(sf.amount, fs.amount,
    coalesce(fs.tuition_fee, 0) + coalesce(fs.admission_fee, 0) +
    coalesce(fs.exam_fee, 0) + coalesce(fs.transport_fee, 0) +
    coalesce(fs.other_fee, 0)),
  fee_type = coalesce(sf.fee_type, fs.fee_type),
  academic_year = coalesce(sf.academic_year, fs.academic_year)
from public.fee_structures fs
where fs.id = sf.fee_structure_id
  and (sf.amount is null or sf.fee_type is null or sf.academic_year is null);

-- 4. Link payment line items to a specific student fee assignment.
alter table public.payment_items
  add column if not exists student_fee_id uuid;

do $$ begin
  alter table public.payment_items
    add constraint payment_items_student_fee_id_fkey
    foreign key (student_fee_id) references public.student_fees(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

-- 5. Backfill fee type on existing payment items when it is recognizable.
-- Existing payments are not automatically allocated to fees because the
-- old schema doesn't reliably say which fee each payment paid.
update public.payment_items
set fee_type = lower(trim(fee_type))
where fee_type is not null;

-- 6. Constraints that validate new fee records without deleting legacy rows.
do $$ begin
  alter table public.fee_structures
    add constraint fee_structures_semester_valid
    check (semester is null or semester between 1 and 12) not valid;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.fee_structures
    add constraint fee_structures_amount_nonnegative
    check (amount is null or amount >= 0) not valid;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.student_fees
    add constraint student_fees_amount_nonnegative
    check (amount is null or amount >= 0) not valid;
exception when duplicate_object then null;
end $$;

commit;

-- 7. Optional helper view for fee balances.
-- Only successful payments allocated to the specific student_fee_id count
-- toward that fee. This view is read-only and does not change existing rows.
create or replace view public.student_fee_balances as
select
  sf.id as student_fee_id,
  sf.student_id,
  sf.fee_structure_id,
  coalesce(sf.fee_type, fs.fee_type) as fee_type,
  coalesce(sf.amount, fs.amount, 0)::numeric(12,2) as fee_amount,
  coalesce(sf.discount, 0)::numeric(12,2) as discount,
  greatest(coalesce(sf.amount, fs.amount, 0) - coalesce(sf.discount, 0), 0)::numeric(12,2) as payable_amount,
  coalesce(paid.paid_amount, 0)::numeric(12,2) as paid_amount,
  greatest(
    coalesce(sf.amount, fs.amount, 0) - coalesce(sf.discount, 0) -
    coalesce(paid.paid_amount, 0), 0
  )::numeric(12,2) as balance_due,
  sf.due_date,
  sf.status,
  coalesce(sf.academic_year, fs.academic_year) as academic_year,
  fs.department,
  fs.course,
  fs.semester
from public.student_fees sf
join public.fee_structures fs on fs.id = sf.fee_structure_id
left join lateral (
  select sum(pi.amount) as paid_amount
  from public.payment_items pi
  join public.payments p on p.id = pi.payment_id
  where pi.student_fee_id = sf.id
    and p.student_id = sf.student_id
    and p.status::text = 'success'
) paid on true;

-- Profile image setup:
-- students.profile_image already exists. Create a public/private storage bucket
-- manually in Supabase Storage. Recommended: private bucket named profile-images
-- and signed URLs, with Storage policies restricting users to their own folder.


-- 8. Read enum values for app dropdowns. Fee type is included for the admin fee form.
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
      'user_role', 'department_type', 'course_type', 'division_type',
      'student_status', 'fee_status', 'payment_status', 'payment_method',
      'attendance_status', 'result_status', 'notification_type', 'fee_type'
    ])
  order by t.typname, e.enumsortorder;
$$;

revoke all on function public.get_enum_options() from public;
grant execute on function public.get_enum_options() to authenticated;
