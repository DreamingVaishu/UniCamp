# UniCamp - Simple Coding Style

This version keeps the UniCamp UI/UX and side navigation while keeping the code beginner-friendly.

## Coding style

- Reusable `useState` / `useEffect` patterns
- Direct Supabase table queries
- Small screen-level load and save functions
- Reusable dropdown component with options passed as props
- Enum dropdown choices are simple arrays in `lib/enums.ts` (no custom RPC)
- Straightforward `.select()`, `.insert()`, `.update()`, and `.delete()` calls
- Chat messages and attachment metadata are stored in `messages`

## Fresh database

Run `supabase/schema.sql` once in a new Supabase project. It contains enums, sequences, tables and foreign keys only. It intentionally has no functions, triggers, indexes, or RLS policies.

Run `supabase/setup.sql` separately only if you need chat Storage uploads and Realtime.

## Main tables

`admin`, `staff`, `students`, `channels`, `channel_members`, `messages`, `announcements`, `attendance`, `results`, `fee_structures`, `student_fees`, `payments`, `payment_items`, and `notifications`.

The student, staff/teacher, and admin screens keep the same visual design language and use a side navigation drawer instead of a bottom navigation bar.
