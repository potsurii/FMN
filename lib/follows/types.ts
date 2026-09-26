export type FollowRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type FollowCounts = {
  followingCount: number;
  followersCount: number;
};

export type ProfileSummary = {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarPath: string | null;
};
