import { supabase } from './supabase';

// Id of the logged in user ('' if nobody). Reads the saved session, no network call.
export async function userId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? '';
}

// Who is logged in and what role they have. Returns null if not registered.
export async function getMe() {
  const id = await userId();
  if (!id) return null;

  const { data: admin } = await supabase.from('admin').select('*').eq('id', id).maybeSingle();
  if (admin) return { role: 'admin' as const, profile: admin };

  const { data: staff } = await supabase.from('staff').select('*').eq('id', id).maybeSingle();
  if (staff) return { role: 'staff' as const, profile: staff };

  const { data: student } = await supabase.from('students').select('*').eq('id', id).maybeSingle();
  if (student) return { role: 'student' as const, profile: student };

  return null;
}

export const homeFor = (role: string) =>
  role === 'admin' ? '/admin/home' : role === 'staff' ? '/staff/home' : '/students/home';
