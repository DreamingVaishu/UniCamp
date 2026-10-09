-- UniCamp fresh database schema
-- This file intentionally contains only PostgreSQL enums, sequences, tables, and foreign keys.
-- It has no custom functions, triggers, indexes, RLS policies, or seed data.
-- Run once in the SQL Editor of a NEW Supabase project/database.

-- 1. Enums used by dropdowns. Keep labels in lib/enums.ts in sync with these values.
create type public.user_role as enum ('admin', 'staff', 'student');
create type public.department_type as enum ('Computer Science & IT', 'Management', 'Law', 'Science', 'Nursing');
create type public.course_type as enum ('BCA', 'BSc IT', 'B.Tech', 'MCA', 'M.Tech', 'Nursing', 'LAW');
create type public.division_type as enum ('A', 'B', 'C', 'D');
create type public.student_status as enum ('active', 'inactive', 'suspended', 'graduated');
create type public.fee_type as enum ('tuition', 'admission', 'exam', 'transport', 'library', 'other');
create type public.fee_status as enum ('pending', 'partial', 'paid', 'overdue', 'cancelled');
create type public.payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type public.payment_method as enum ('cash', 'online', 'razorpay', 'upi');
create type public.attendance_status as enum ('present', 'absent', 'late');
create type public.result_status as enum ('pass', 'fail', 'absent', 'withheld');
create type public.notification_type as enum ('announcement', 'fee', 'attendance', 'result', 'chat', 'general');

-- 2. Sequences for human-readable IDs.
create sequence public.student_admission_seq start with 1;
create sequence public.student_roll_seq start with 101;
create sequence public.staff_id_seq start with 1;
create sequence public.employee_number_seq start with 1;

-- 3. User profiles. Create the matching Supabase Auth user before inserting a profile row.
create table public.admin (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  profile_image text,
  created_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  staff_id text unique not null default ('CSMU/STAFF/' || lpad(nextval('public.staff_id_seq')::text, 4, '0')),
  employee_number text unique not null default ('A-' || lpad(nextval('public.employee_number_seq')::text, 4, '0')),
  username text not null,
  email text not null unique,
  department public.department_type not null,
  role public.user_role not null default 'staff',
  phone text,
  profile_image text,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  admission_no text unique not null default ('CSMI/2026-2029/' || lpad(nextval('public.student_admission_seq')::text, 4, '0')),
  roll_no text unique not null default ('G' || lpad(nextval('public.student_roll_seq')::text, 6, '0')),
  full_name text not null,
  email text not null unique,
  phone text,
  department public.department_type not null,
  course public.course_type not null,
  division public.division_type,
  semester integer not null,
  status public.student_status not null default 'active',
  role public.user_role not null default 'student',
  profile_image text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Fees. A fee structure is one fee type for one department/course/semester/year.
create table public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  department public.department_type not null,
  course public.course_type not null,
  semester integer not null,
  fee_type public.fee_type not null,
  academic_year text not null,
  title text not null,
  amount numeric(10,2) not null,
  -- Legacy category columns are kept so older UI calculations remain compatible.
  tuition_fee numeric(10,2) not null default 0,
  admission_fee numeric(10,2) not null default 0,
  exam_fee numeric(10,2) not null default 0,
  transport_fee numeric(10,2) not null default 0,
  other_fee numeric(10,2) not null default 0,
  due_date date,
  created_at timestamptz not null default now()
);

create table public.student_fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  fee_structure_id uuid not null references public.fee_structures(id) on delete cascade,
  amount numeric(10,2) not null,
  fee_type public.fee_type not null,
  academic_year text not null,
  discount numeric(10,2) not null default 0,
  due_date date,
  status public.fee_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(10,2) not null,
  status public.payment_status not null default 'pending',
  payment_method public.payment_method,
  reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payment_items (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  student_fee_id uuid references public.student_fees(id) on delete set null,
  fee_type public.fee_type not null,
  amount numeric(10,2) not null
);

-- 5. Announcements and department chat.
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  department public.department_type not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  department public.department_type not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.channel_members (
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. Academic records.
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  department public.department_type not null,
  date date not null,
  status public.attendance_status not null,
  marked_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course public.course_type not null,
  semester integer not null,
  subject_name text not null,
  subject_code text,
  internal_marks numeric(5,2) not null default 0,
  external_marks numeric(5,2) not null default 0,
  total_marks numeric(5,2) not null default 0,
  grade text,
  grade_point numeric(4,2),
  status public.result_status not null default 'pass',
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
