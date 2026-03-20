import { createClient } from "@/lib/supabase/server";
import type { StoryListItem, StoryFilters, StoryListItem as StoryDetail } from "@/lib/types";

const PER_PAGE = 20;

export async function getStories(filters: StoryFilters) {
  const supabase = await createClient();

  const {
    status,
    proposer,
    keyword,
    categories,
    sort = "created_at",
    order = "desc",
    page = 1,
  } = filters;

  // Pre-filter: keyword across related tables + categories
  let constrainedIds: string[] | null = null;

  const preQueries: Promise<string[]>[] = [];

  if (keyword) {
    const kw = `%${keyword}%`;
    preQueries.push(
      (async () => {
        const [titles, stages, tags] = await Promise.all([
          supabase.from("user_stories").select("id").ilike("title", kw),
          supabase.from("stages").select("story_id").ilike("stage_name", kw),
          supabase.from("tech_tags").select("story_id").ilike("tag_name", kw),
        ]);
        return [
          ...(titles.data?.map((r) => r.id) ?? []),
          ...(stages.data?.map((r) => r.story_id) ?? []),
          ...(tags.data?.map((r) => r.story_id) ?? []),
        ];
      })()
    );
  }

  if (categories && categories.length > 0) {
    preQueries.push(
      (async () => {
        const { data } = await supabase
          .from("tech_tags")
          .select("story_id")
          .in("category", categories);
        return data?.map((r) => r.story_id) ?? [];
      })()
    );
  }

  if (preQueries.length > 0) {
    const results = await Promise.all(preQueries);
    // Intersect all id sets
    const sets = results.map((ids) => new Set(ids));
    const intersection = sets.reduce((acc, set) => {
      const filtered: string[] = [];
      acc.forEach((id) => {
        if (set.has(id)) filtered.push(id);
      });
      return new Set(filtered);
    });
    constrainedIds = Array.from(intersection);
    if (constrainedIds.length === 0) {
      return { stories: [] as StoryListItem[], total: 0, error: null };
    }
  }

  // Main query
  let query = supabase.from("user_stories").select(
    `*, stages(*), tech_tags(*)`,
    { count: "exact" }
  );

  if (constrainedIds) {
    query = query.in("id", constrainedIds);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (proposer) {
    query = query.eq("proposer_name", proposer);
  }

  query = query.order(sort, { ascending: order === "asc" });

  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  return {
    stories: (data ?? []) as StoryListItem[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function getStoryById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_stories")
    .select(`*, stages(*), tech_tags(*)`)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const story = data as StoryDetail;
  if (story.stages) {
    story.stages.sort((a, b) => a.order_num - b.order_num);
  }
  return story;
}

export async function getProposers(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_stories")
    .select("proposer_name")
    .not("proposer_name", "is", null);

  const nameSet = new Set(
    (data ?? [])
      .map((r) => r.proposer_name as string)
      .filter(Boolean)
  );
  return Array.from(nameSet).sort();
}
