import { notFound, redirect } from "next/navigation";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { ItemForm } from "@/components/item/ItemForm";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { requireUser } from "@/lib/auth/require-user";
import { fetchItemById } from "@/lib/items/detail";
import { fetchTripById } from "@/lib/trips/detail";

export const dynamic = "force-dynamic";

type EditItemPageProps = {
  params: Promise<{ tripId: string; itemId: string }>;
};

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { tripId, itemId } = await params;
  const { supabase, user } = await requireUser();
  const [trip, item] = await Promise.all([
    fetchTripById(supabase, tripId),
    fetchItemById(supabase, tripId, itemId),
  ]);

  if (!trip || !item) {
    notFound();
  }

  if (trip.user_id !== user.id) {
    redirect(`/trips/${tripId}/items/${itemId}`);
  }

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6">
          <BackButton
            href={`/trips/${tripId}/items/${itemId}`}
            label="返回商品详情"
          />
        </div>
        <section className="mb-8 max-w-2xl">
          <p className="mb-2 font-stamp text-[11px] tracking-[0.24em] text-[var(--color-stamp)] uppercase">
            Edit Item
          </p>
          <Heading level={1} className="mb-3">
            编辑商品
          </Heading>
          <Text className="text-[var(--color-ink-muted)]">
            更新「{item.name}」的购买记录。
          </Text>
        </section>
        <ItemForm
          mode="edit"
          tripId={tripId}
          tripStartDate={trip.start_date}
          tripEndDate={trip.end_date}
          tripVisibility={trip.visibility}
          userId={user.id}
          item={item}
        />
      </main>
    </div>
  );
}
