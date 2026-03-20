import { getStories, getProposers } from "@/lib/queries/stories";
import type { StoryFilters, StorySortField } from "@/lib/types";
import { isAdminEmail } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { StoriesContent } from "./_components/stories-content";

function parseSearchParams(
  sp: Record<string, string | string[] | undefined>
): StoryFilters {
  const str = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;
  const cats = sp.categories;

  return {
    status: str(sp.status),
    proposer: str(sp.proposer),
    keyword: str(sp.keyword),
    categories: cats
      ? Array.isArray(cats)
        ? cats
        : cats.split(",").filter(Boolean)
      : undefined,
    sort: (str(sp.sort) as StorySortField) || "created_at",
    order: str(sp.order) === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(str(sp.page)) || 1),
  };
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseSearchParams(searchParams);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = isAdminEmail(user?.email);

  const [{ stories, total }, proposers] = await Promise.all([
    getStories(filters),
    getProposers(),
  ]);

  return (
    <StoriesContent
      stories={stories}
      total={total}
      proposers={proposers}
      filters={filters}
      isAdmin={isAdmin}
    />
  );
}
