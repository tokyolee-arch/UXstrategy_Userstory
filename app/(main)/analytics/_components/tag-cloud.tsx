"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TagFreqItem } from "@/lib/queries/analytics";

const CAT_COLORS: Record<string, string> = {
  기능: "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950",
  사양: "text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950",
  서비스: "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950",
  사업요소: "text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950",
};

const MIN_SIZE = 12;
const MAX_SIZE = 28;

export function TagCloud({ tags }: { tags: TagFreqItem[] }) {
  const router = useRouter();

  if (tags.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">태그 클라우드</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
          태그가 없습니다
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...tags.map((t) => t.count));
  const minCount = Math.min(...tags.map((t) => t.count));
  const range = maxCount - minCount || 1;

  function fontSize(count: number) {
    return MIN_SIZE + ((count - minCount) / range) * (MAX_SIZE - MIN_SIZE);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">태그 클라우드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t, i) => (
            <button
              key={`${t.category}-${t.tag_name}-${i}`}
              onClick={() =>
                router.push(
                  `/stories?keyword=${encodeURIComponent(t.tag_name)}`
                )
              }
              className={cn(
                "rounded-md px-2 py-0.5 font-medium transition-colors cursor-pointer",
                CAT_COLORS[t.category] ?? "text-foreground"
              )}
              style={{ fontSize: `${fontSize(t.count)}px` }}
            >
              {t.tag_name}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
