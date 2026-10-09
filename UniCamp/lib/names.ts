import { supabase } from './supabase';

export type Person = { name: string; role: 'student' | 'staff' | 'admin'; sub?: string };

// Turns user ids into { name, role, sub } (a user can be a student, staff or admin).
export async function loadPeople(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const people: Record<string, Person> = {};
  if (!unique.length) return people;

  const [s, t, a] = await Promise.all([
    supabase.from('students').select('id, full_name, roll_no').in('id', unique),
    supabase.from('staff').select('id, username, staff_id').in('id', unique),
    supabase.from('admin').select('id, name').in('id', unique),
  ]);
  (s.data || []).forEach((x: any) => (people[x.id] = { name: x.full_name, role: 'student', sub: x.roll_no }));
  (t.data || []).forEach((x: any) => (people[x.id] = { name: x.username, role: 'staff', sub: x.staff_id }));
  (a.data || []).forEach((x: any) => (people[x.id] = { name: x.name, role: 'admin' }));
  return people;
}

// Same, but only the names.
export async function loadNames(ids: string[]) {
  const people = await loadPeople(ids);
  const names: Record<string, string> = {};
  Object.keys(people).forEach(id => (names[id] = people[id].name));
  return names;
}
