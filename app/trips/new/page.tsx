import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { Header } from "@/components/navigation/Header";
import { BackButton } from "@/components/navigation/BackButton";
import { TripForm } from "@/components/travel/TripForm";
import { requireUser } from "@/lib/auth/require-user";

export default async function CreateTripPage() {
  const { user } = await requireUser();

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6">
          <BackButton href="/home" label="返回我的旅行" />
        </div>
        <section className="mb-8 max-w-2xl">
          <p className="mb-2 font-stamp text-[11px] tracking-[0.24em] text-[var(--color-stamp)] uppercase">
            Create Trip
          </p>
          <Heading level={1} className="mb-3">
            创建旅行
          </Heading>
          <Text className="text-[var(--color-ink-muted)]">
            填写旅行档案的基本信息。保存后将进入旅行详情。
          </Text>
        </section>
        <TripForm mode="create" userId={user.id} />
      </main>
    </div>
  );
}
