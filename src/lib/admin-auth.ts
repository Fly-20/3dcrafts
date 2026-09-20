import { redirect } from "next/navigation";
import { createServerAuthClient } from "./supabase/auth-server";

export type AdminSession = {
  userId: string;
  email: string;
  role: "owner" | "staff" | "production";
  name: string | null;
};

/** Looks up the signed-in user's `admin_users` row. Returns null if there's no session or the user isn't an admin. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createServerAuthClient();

  // getUser() re-validates the JWT against Supabase Auth, unlike getSession()
  // which only reads the (possibly stale/tampered) local cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminUser } = await supabase.from("admin_users").select("role, name").eq("id", user.id).maybeSingle();
  if (!adminUser) return null;

  return { userId: user.id, email: user.email ?? "", role: adminUser.role, name: adminUser.name };
}

/** Use at the top of admin pages/layouts/Server Actions — redirects to login if there's no admin session. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
