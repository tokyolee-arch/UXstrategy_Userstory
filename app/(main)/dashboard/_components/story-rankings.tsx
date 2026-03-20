"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Star, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type RankedStory = {
  id: string;
  title: string;
  proposer_name: string | null;
  seq_no: number;
  total_rating: number;
  rating_count: number;
  avg_rating: number;
};

const RANK_STYLES = [
  "text-yellow-500",
  "text-gray-400",
  "text-orange-600",
];

function MiniStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-3 w-3",
            value >= s
              ? "fill-yellow-400 text-yellow-400"
              : value >= s - 0.5
                ? "fill-yellow-400/50 text-yellow-400"
                : "fill-transparent text-gray-300 dark:text-gray-600"
          )}
        />
      ))}
    </div>
  );
}

export function StoryRankings() {
  const [rankings, setRankings] = useState<RankedStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stories/rankings")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RankedStory[]) => setRankings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-yellow-500" />
          스토리 별점 랭킹
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
          <Link href="/stories">
            전체 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rankings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            아직 별점이 등록된 스토리가 없습니다.
          </p>
        ) : (
          <div className="space-y-1">
            {rankings.slice(0, 10).map((story, idx) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <span
                  className={cn(
                    "text-lg font-bold w-6 text-center shrink-0",
                    idx < 3
                      ? RANK_STYLES[idx]
                      : "text-muted-foreground"
                  )}
                >
                  {idx + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {story.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {story.proposer_name ?? "—"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <MiniStars value={Math.round(story.avg_rating)} />
                    <span className="text-xs font-semibold text-yellow-600 ml-1">
                      {story.avg_rating}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    합계 {story.total_rating}점 · {story.rating_count}명
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
