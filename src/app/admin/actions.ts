"use server";

import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/auth-server";

export async function logout() {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
