import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/foundation/Button";
import { Heading } from "@/components/foundation/Heading";
import { ItemGrid } from "@/components/item/ItemGrid";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { ShoppingTodoList } from "@/components/todo/ShoppingTodoList";
import { TripCover } from "@/components/travel/TripCover";
import { TripDetailActions } from "@/components/travel/TripDetailActions";
import { requireUser } from "@/lib/auth/require-user";
import { fetchItemsByTripId } from "@/lib/items/queries";
import { fetchActiveTodosByTripId } from "@/lib/todos/queries";
import { fetchTripWithStatsById } from "@/lib/trips/detail";

export const dynamic = "force-dynamic";

type TripDetailPageProps = {
  params: Promise<{ tripId: string }>;
};

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const { tripId } = await params;
  const { supabase, user } = await requireUser();
  const trip = await fetchTripWithStatsById(supabase, tripId);

  if (!trip) {
    notFound();
  }

  const isOwner = trip.userId === user.id;
  const items = await fetchItemsByTripId(supabase, tripId);
  const todos = isOwner
    ? await fetchActiveTodosByTripId(supabase, tripId)
    : [];
  const addItemHref = `/trips/${tripId}/items/new`;
  const addTodoHref = `/trips/${tripId}/todos/new`;
  const hasItems = items.length > 0;
  const hasTodos = todos.length > 0;

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-10">
        <BackButton href="/" label="返回我的旅行" />

        <TripCover trip={trip} />

        {isOwner ? (
          <TripDetailActions tripId={tripId} tripName={trip.name} />
        ) : null}

        {isOwner ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
                  Shopping Todo
                </p>
                <Heading level={2}>购物代办</Heading>
              </div>
              {hasTodos ? (
                <Link href={addTodoHref}>
                  <Button>添加购物代办</Button>
                </Link>
              ) : null}
            </div>
            <ShoppingTodoList
              tripId={tripId}
              todos={todos}
              emptyAction={
                <Link href={addTodoHref}>
                  <Button>添加购物代办</Button>
                </Link>
              }
            />
          </section>
        ) : null}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 font-stamp text-[11px] tracking-[0.22em] text-[var(--color-stamp)] uppercase">
              Purchases
            </p>
            <Heading level={2}>购买记录</Heading>
          </div>
          {isOwner && hasItems ? (
            <Link href={addItemHref}>
              <Button>添加商品</Button>
            </Link>
          ) : null}
        </section>

        <ItemGrid
          items={items}
          emptyAction={
            isOwner ? (
              <Link href={addItemHref}>
                <Button>添加第一件商品</Button>
              </Link>
            ) : undefined
          }
        />
      </main>
    </div>
  );
}
