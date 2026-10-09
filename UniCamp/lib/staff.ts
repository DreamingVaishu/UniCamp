import { supabase } from './supabase';

// Use this when a screen requires a signed-in staff profile.
export async function loadStaff() {
  const staff = await getCurrentStaff();
  if (!staff) {
    throw new Error('Your staff profile could not be found. Please sign out and sign in again.');
  }
  return staff;
}

// Use this when a screen needs to handle a missing profile itself.
export async function getCurrentStaff() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}
