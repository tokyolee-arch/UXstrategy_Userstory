import { createClient } from "@/lib/supabase/server";

export type TagFreqItem = {
  tag_name: string;
  category: string;
  count: number;
};

export type ProposerCount = {
  proposer_name: string;
  count: number;
};

export type MonthlyTrendItem = {
  month: string;
  draft: number;
  submitted: number;
};

export type AnalyticsSummary = {
  totalSubmitted: number;
  teamMemberCount: number;
  topTag: string | null;
  thisMonthCount: number;
};

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [submittedRes, allRes, tagsRes, monthRes] = await Promise.all([
    supabase
      .from("user_stories")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("user_stories")
      .select("proposer_name")
      .not("proposer_name", "is", null),
    supabase.from("tech_tags").select("tag_name"),
    supabase
      .from("user_stories")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted")
      .gte("created_at", monthStart),
  ]);

  const proposerSet = new Set<string>();
  (allRes.data ?? []).forEach((r) => {
    if (r.proposer_name) proposerSet.add(r.proposer_name as string);
  });

  const tagCounts: Record<string, number> = {};
  (tagsRes.data ?? []).forEach((r) => {
    const n = r.tag_name as string;
    tagCounts[n] = (tagCounts[n] ?? 0) + 1;
  });
  let topTag: string | null = null;
  let maxCount = 0;
  for (const [name, cnt] of Object.entries(tagCounts)) {
    if (cnt > maxCount) {
      maxCount = cnt;
      topTag = name;
    }
  }

  return {
    totalSubmitted: submittedRes.count ?? 0,
    teamMemberCount: proposerSet.size,
    topTag,
    thisMonthCount: monthRes.count ?? 0,
  };
}

export async function getTagFrequency(
  category?: string
): Promise<TagFreqItem[]> {
  const supabase = await createClient();

  let query = supabase.from("tech_tags").select("tag_name, category");
  if (category) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  const map = new Map<string, { category: string; count: number }>();
  (data ?? []).forEach((r) => {
    const key = `${r.category}::${r.tag_name}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { category: r.category as string, count: 1 });
    }
  });

  const items: TagFreqItem[] = [];
  map.forEach((v, key) => {
    items.push({ tag_name: key.split("::")[1], category: v.category, count: v.count });
  });

  return items.sort((a, b) => b.count - a.count).slice(0, 10);
}

export async function getAllTagFrequency(): Promise<TagFreqItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tech_tags").select("tag_name, category");

  const map = new Map<string, { category: string; count: number }>();
  (data ?? []).forEach((r) => {
    const key = `${r.category}::${r.tag_name}`;
    const existing = map.get(key);
    if (existing) existing.count++;
    else map.set(key, { category: r.category as string, count: 1 });
  });

  const items: TagFreqItem[] = [];
  map.forEach((v, key) => {
    items.push({ tag_name: key.split("::")[1], category: v.category, count: v.count });
  });
  return items.sort((a, b) => b.count - a.count);
}

export async function getStoryCountByProposer(): Promise<ProposerCount[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_stories")
    .select("proposer_name")
    .eq("status", "submitted")
    .not("proposer_name", "is", null);

  const map = new Map<string, number>();
  (data ?? []).forEach((r) => {
    const name = r.proposer_name as string;
    map.set(name, (map.get(name) ?? 0) + 1);
  });

  const items: ProposerCount[] = [];
  map.forEach((count, proposer_name) => items.push({ proposer_name, count }));
  return items.sort((a, b) => b.count - a.count);
}

export async function getMonthlyTrend(): Promise<MonthlyTrendItem[]> {
  const supabase = await createClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("user_stories")
    .select("status, created_at")
    .gte("created_at", sixMonthsAgo.toISOString());

  const map = new Map<string, { draft: number; submitted: number }>();

  // Pre-fill last 6 months
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, { draft: 0, submitted: 0 });
  }

  (data ?? []).forEach((r) => {
    const d = new Date(r.created_at as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = map.get(key);
    if (entry) {
      if (r.status === "submitted") entry.submitted++;
      else entry.draft++;
    }
  });

  const items: MonthlyTrendItem[] = [];
  map.forEach((v, month) => items.push({ month, ...v }));
  return items.sort((a, b) => a.month.localeCompare(b.month));
}
