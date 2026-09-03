import { supabase } from "./supabase";

export async function getCurrentStaff() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.log("Staff error:", error);
    return null;
  }

  return data;
}