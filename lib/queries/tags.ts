import { createClient } from "@/lib/supabase/server";

export type ExistingTag = {
  category: string;
  tag_name: string;
  count: number;
};

export async function getExistingTags(): Promise<ExistingTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tech_tags")
    .select("category, tag_name");

  if (error || !data) return [];

  const countMap = new Map<string, ExistingTag>();
  for (const row of data) {
    const key = `${row.category}::${row.tag_name}`;
    const existing = countMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      countMap.set(key, {
        category: row.category,
        tag_name: row.tag_name,
        count: 1,
      });
    }
  }

  return Array.from(countMap.values()).sort((a, b) => b.count - a.count);
}
