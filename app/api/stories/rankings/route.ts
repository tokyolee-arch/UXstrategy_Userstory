import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: advices, error: advicesError } = await supabase
    .from("story_advices")
    .select("story_id, rating")
    .not("rating", "is", null);

  if (advicesError) {
    return NextResponse.json({ error: advicesError.message }, { status: 500 });
  }

  const ratingMap = new Map<
    string,
    { totalRating: number; count: number }
  >();

  for (const a of advices ?? []) {
    const existing = ratingMap.get(a.story_id);
    if (existing) {
      existing.totalRating += a.rating;
      existing.count++;
    } else {
      ratingMap.set(a.story_id, { totalRating: a.rating, count: 1 });
    }
  }

  const storyIds = Array.from(ratingMap.keys());
  if (storyIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: stories } = await supabase
    .from("user_stories")
    .select("id, title, proposer_name, seq_no")
    .in("id", storyIds);

  const rankings = (stories ?? [])
    .map((s) => {
      const r = ratingMap.get(s.id);
      return {
        id: s.id,
        title: s.title,
        proposer_name: s.proposer_name,
        seq_no: s.seq_no,
        total_rating: r?.totalRating ?? 0,
        rating_count: r?.count ?? 0,
        avg_rating: r ? Math.round((r.totalRating / r.count) * 10) / 10 : 0,
      };
    })
    .sort((a, b) => b.total_rating - a.total_rating);

  return NextResponse.json(rankings);
}
