import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";
import { BackButton } from "@/components/navigation/BackButton";
import { Header } from "@/components/navigation/Header";
import { UserList } from "@/components/user/UserList";
import { requireUser } from "@/lib/auth/require-user";
import {
  fetchIsFollowing,
  listFollowerProfiles,
} from "@/lib/follows";

export const dynamic = "force-dynamic";

export default async function FollowersPage() {
  const { supabase, user } = await requireUser();
  const profiles = await listFollowerProfiles(supabase, user.id);

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
            Followers
          </p>
          <Heading level={1} className="mb-2">
            我的粉丝
          </Heading>
          <Text className="text-sm text-[var(--color-ink-muted)]">
            关注你的旅行者。可选择回关作为长期购物参考。
          </Text>
        </div>

        <UserList
          profiles={profiles}
          currentUserId={user.id}
          followingMap={followingMap}
          emptyMessage="还没有粉丝。"
        />
      </main>
    </div>
  );
}
