"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/foundation/Button";
import { Input } from "@/components/foundation/Input";
import { FormField } from "@/components/form/FormField";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "register";
};

function safeNextPath(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function AuthForm({ mode }: AuthFormProps) {
  return (
    <Suspense fallback={<AuthFormFields mode={mode} nextPath="/" />}>
      <AuthFormWithNext mode={mode} />
    </Suspense>
  );
}

function AuthFormWithNext({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  return <AuthFormFields mode={mode} nextPath={nextPath} />;
}

function AuthFormFields({
  mode,
  nextPath,
}: AuthFormProps & { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || undefined,
            },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "认证失败，请重试");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5">
      {mode === "register" ? (
        <FormField label="显示名称" htmlFor="auth-name">
          <Input
            id="auth-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
            placeholder="可选"
          />
        </FormField>
      ) : null}

      <FormField label="邮箱" htmlFor="auth-email" required>
        <Input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </FormField>

      <FormField label="密码" htmlFor="auth-password" required>
        <Input
          id="auth-password"
          type="password"
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
          minLength={6}
        />
      </FormField>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={loading}>
        {loading
          ? "处理中…"
          : mode === "login"
            ? "登录"
            : "注册"}
      </Button>

      <p className="text-center text-sm text-[var(--color-ink-muted)]">
        {mode === "login" ? (
          <>
            还没有账号？{" "}
            <Link
              href="/register"
              className="text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              注册
            </Link>
          </>
        ) : (
          <>
            已有账号？{" "}
            <Link
              href="/login"
              className="text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              登录
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
