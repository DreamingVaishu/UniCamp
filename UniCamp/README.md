# UniCamp

A beginner-friendly Expo + React Native + TypeScript + Supabase university app. The existing UI and role-specific side navigation are preserved.

## Roles and features

- **Student:** home, announcements, department channels, realtime chat, attachments, fees, results, profile, password change.
- **Staff/teacher:** home, manage students, attendance, results, announcements, channels and chat.
- **Admin:** dashboard, staff management, student overview and fee structures.

## Fresh database setup

This project is designed for a NEW Supabase project using a straightforward schema: PostgreSQL enums, sequences, tables and foreign keys only. The app does not need a custom enum RPC, triggers or database helper functions for dropdowns.

1. In Supabase, open **SQL Editor**.
2. Run `supabase/schema.sql` once. This creates all required tables, enums and sequences.
3. Add the Supabase URL and anon/publishable key to `.env`.
4. Deploy `supabase/functions/provision-account` if you want the admin to create staff/student Auth accounts from the app.
5. Create the first admin user in Supabase Authentication, then insert that user's Auth UUID into `public.admin` with their name and email.
6. For chat file uploads and realtime messages, run `supabase/setup.sql` separately. It only configures the Storage bucket/policy and Realtime publication; it is not part of the basic schema.
7. Install and start the app:

```bash
npm install
npx expo start --clear
```

For an Android native development build, run `npx expo run:android`.

## Simple dropdowns

Dropdowns use the small constant lists in `lib/enums.ts`. These values exactly match the PostgreSQL enums in `supabase/schema.sql`, so there is no extra RPC or runtime enum-fetching logic. When changing an enum, update the SQL enum and the matching list in `lib/enums.ts` together.

Semester is an integer in the database; the UI offers semesters 1–8. Academic year is text, so the fee form generates a short list of academic years and also includes years already present in fee structures.

## Fee structure behavior

An admin creates one fee structure for a selected department, course, semester, academic year and fee type. The app assigns that fee to existing students matching all three academic fields (department, course and semester). Newly created students are not automatically assigned old fee structures unless the app explicitly performs that assignment.

## Database scope and security note

`supabase/schema.sql` intentionally contains only enums, sequences, tables and foreign keys—no functions, triggers, indexes, or RLS policies. This is convenient for a simple local/class project, but it is **not production-secure by itself**. Before exposing real student data publicly, configure Supabase Row Level Security and Storage access policies appropriate to each role.

The fee dropdown migration files are for upgrading an older existing database only; do not run those migrations after running the fresh `schema.sql`.
