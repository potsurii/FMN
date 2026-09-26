import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { UserList } from "@/components/user/UserList";
import { requireUser } from "@/lib/auth/require-user";
import {
  fetchIsFollowing,
  listFollowingProfiles,
} from "@/lib/follows";

export const dynamic = "force-dynamic";

export default async function FollowingPage() {
  const { supabase, user } = await requireUser();
  const profiles = await listFollowingProfiles(supabase, user.id);

  const followingMap = new Map<string, boolean>();
  await Promise.all(
    profiles.map(async (profile) => {
      if (profile.id === user.id) {
        followingMap.set(profile.id, false);
        return;
      }
      followingMap.set(
        profile.id,
        await fetchIsFollowing(supabase, user.id, profile.id),
      );
    }),
  );

  return (
    <div className="min-h-screen">
      <Header email={user.email} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        <BackButton href={`/users/${user.id}`} label="返回我的主页" />

        <div>
          <p className="mb-2 font-stamp text-[11px] tracking-[0.24em] text-[var(--color-stamp)] uppercase">
            Following
          </p>
          <Heading level={1} className="mb-2">
            我的关注
          </Heading>
          <Text className="text-sm text-[var(--color-ink-muted)]">
            你选择长期参考的旅行购物记录作者。
          </Text>
        </div>

        <UserList
          profiles={profiles}
          currentUserId={user.id}
          followingMap={followingMap}
          emptyMessage="还没有关注任何人。可在搜索中发现公开用户。"
        />
      </main>
    </div>
  );
}
