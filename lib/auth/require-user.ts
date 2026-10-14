import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Session check for server actions. Does not redirect. */
export async function readSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: "请先登录" };
  }

  return { ok: true as const, supabase, user };
}

export async function requireUser() {
  const session = await readSessionUser();
  if (!session.ok) {
    redirect("/login");
  }

  return { supabase: session.supabase, user: session.user };
}
