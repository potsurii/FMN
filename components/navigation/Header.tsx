"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/foundation/Button";
import { createClient } from "@/lib/supabase/client";

type HeaderProps = {
  className?: string;
  email?: string | null;
};

export function Header({ className = "", email = null }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className={`border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="flex flex-col gap-0.5">
          <span className="font-stamp text-[11px] tracking-[0.28em] text-[var(--color-stamp)] uppercase">
            Travel Archive
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
            Forget Me Not
          </span>
        </Link>

        {email ? (
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[12rem] truncate text-sm text-[var(--color-ink-muted)] sm:inline">
              {email}
            </span>
            <Button type="button" variant="ghost" onClick={handleLogout}>
              退出
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
