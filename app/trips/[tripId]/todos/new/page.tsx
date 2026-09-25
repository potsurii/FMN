import { notFound, redirect } from "next/navigation";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { ShoppingTodoForm } from "@/components/todo/ShoppingTodoForm";
import { requireUser } from "@/lib/auth/require-user";
import { fetchTripById } from "@/lib/trips/detail";

export const dynamic = "force-dynamic";

type NewTodoPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function NewTodoPage({ params }: NewTodoPageProps) {
  const { tripId } = await params;
  const { supabase, user } = await requireUser();
  const trip = await fetchTripById(supabase, tripId);

  if (!trip) {
    notFound();
  }

  if (trip.user_id !== user.id) {
    redirect(`/trips/${tripId}`);
  }

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6">
          <BackButton href={`/trips/${tripId}`} label="返回旅行详情" />
        </div>
        <section className="mb-8 max-w-2xl">
          <p className="mb-2 font-stamp text-[11px] tracking-[0.24em] text-[var(--color-stamp)] uppercase">
            Shopping Todo
          </p>
          <Heading level={1} className="mb-3">
            添加购物代办
          </Heading>
          <Text className="text-[var(--color-ink-muted)]">
            记下在「{trip.name}」中准备购买的商品。
          </Text>
        </section>
        <ShoppingTodoForm mode="create" tripId={tripId} userId={user.id} />
      </main>
    </div>
  );
}
