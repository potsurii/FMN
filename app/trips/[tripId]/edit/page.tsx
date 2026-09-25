import { notFound, redirect } from "next/navigation";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { TripForm } from "@/components/travel/TripForm";
import { requireUser } from "@/lib/auth/require-user";
import { fetchTripWithStatsById } from "@/lib/trips/detail";

export const dynamic = "force-dynamic";

type EditTripPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { tripId } = await params;
  const { supabase, user } = await requireUser();
  const trip = await fetchTripWithStatsById(supabase, tripId);

  if (!trip) {
    notFound();
  }

  if (trip.userId !== user.id) {
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
            Edit Trip
          </p>
          <Heading level={1} className="mb-3">
            编辑旅行
          </Heading>
          <Text className="text-[var(--color-ink-muted)]">
            更新旅行档案信息。若缩短日期，须仍覆盖全部已有商品的购买日期。
          </Text>
        </section>
        <TripForm mode="edit" trip={trip} userId={user.id} />
      </main>
    </div>
  );
}
