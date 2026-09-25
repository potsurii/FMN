import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { AuthForm } from "@/components/auth/AuthForm";
import { Header } from "@/components/navigation/Header";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <section className="mb-8 max-w-md">
          <p className="mb-2 font-stamp text-[11px] tracking-[0.24em] text-[var(--color-stamp)] uppercase">
            Sign In
          </p>
          <Heading level={1} className="mb-3">
            登录
          </Heading>
          <Text className="text-[var(--color-ink-muted)]">
            登录后进入我的旅行购物档案。
          </Text>
        </section>
        <AuthForm mode="login" />
      </main>
    </div>
  );
}
