"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/foundation/Button";
import { createClient } from "@/lib/supabase/client";
import { isSearchNavActive, parseNavFrom } from "@/lib/navigation/context";

type HeaderProps = {
  className?: string;
  email?: string | null;
};

export function Header({ className = "", email = null }: HeaderProps) {
  return (
    <Suspense
      fallback={
        <HeaderChrome
          className={className}
          email={email}
          isMyTripsActive={false}
          isSearchActive={false}
        />
      }
    >
      <HeaderWithSearchParams className={className} email={email} />
    </Suspense>
  );
}

function HeaderWithSearchParams({ className = "", email = null }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = parseNavFrom(searchParams.get("from") ?? undefined);
  const isSearchActive = isSearchNavActive(pathname, from);
  const isMyTripsActive = pathname === "/home" && !isSearchActive;

  return (
    <HeaderChrome
      className={className}
      email={email}
      isMyTripsActive={isMyTripsActive}
      isSearchActive={isSearchActive}
    />
  );
}

function HeaderChrome({
  className = "",
  email = null,
  isMyTripsActive,
  isSearchActive,
}: HeaderProps & {
  isMyTripsActive: boolean;
  isSearchActive: boolean;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={`border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
          <Link href={email ? "/home" : "/"} className="flex shrink-0 flex-col gap-0.5">
            <span className="font-stamp text-[11px] tracking-[0.28em] text-[var(--color-stamp)] uppercase">
              Travel Archive
            </span>
            <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
              Forget Me Not
            </span>
          </Link>

          {email ? (
            <nav
              className="flex items-center gap-4 md:gap-5"
              aria-label="一级导航"
            >
              <NavLink href="/home" active={isMyTripsActive}>
                我的旅行
              </NavLink>
              <NavLink href="/search" active={isSearchActive}>
                搜索
              </NavLink>
            </nav>
          ) : null}
        </div>

        {email ? (
          <div className="flex shrink-0 items-center gap-3">
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

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-sm tracking-wide transition-colors ${
        active
          ? "border-b border-[var(--color-stamp)] pb-0.5 font-semibold text-[var(--color-stamp)]"
          : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
    </Link>
  );
}
