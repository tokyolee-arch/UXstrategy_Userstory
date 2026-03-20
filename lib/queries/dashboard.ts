import { createClient } from "@/lib/supabase/server";
import type { StoryListItem } from "@/lib/types";
import type { TagFreqItem } from "./analytics";

export type DashboardStats = {
  myStoryCount: number;
  totalSubmitted: number;
  teamMemberCount: number;
};

export async function getDashboardStats(
  userId: string
): Promise<DashboardStats> {
  const supabase = await createClient();

  const [myRes, submittedRes, proposersRes] = await Promise.all([
    supabase
      .from("user_stories")
      .select("id", { count: "exact", head: true })
      .eq("proposer_id", userId),
    supabase
      .from("user_stories")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("user_stories")
      .select("proposer_name")
      .not("proposer_name", "is", null),
  ]);

  const nameSet = new Set<string>();
  (proposersRes.data ?? []).forEach((r) => {
    if (r.proposer_name) nameSet.add(r.proposer_name as string);
  });

  return {
    myStoryCount: myRes.count ?? 0,
    totalSubmitted: submittedRes.count ?? 0,
    teamMemberCount: nameSet.size,
  };
}

export async function getRecentStories(): Promise<StoryListItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_stories")
    .select("*, stages(*), tech_tags(*)")
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []) as StoryListItem[];
}

export async function getTopTags(limit = 5): Promise<TagFreqItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tech_tags").select("tag_name, category");

  const map = new Map<string, { category: string; count: number }>();
  (data ?? []).forEach((r) => {
    const key = `${r.category}::${r.tag_name}`;
    const e = map.get(key);
    if (e) e.count++;
    else map.set(key, { category: r.category as string, count: 1 });
  });

  const items: TagFreqItem[] = [];
  map.forEach((v, key) => {
    items.push({ tag_name: key.split("::")[1], category: v.category, count: v.count });
  });
  return items.sort((a, b) => b.count - a.count).slice(0, limit);
}
