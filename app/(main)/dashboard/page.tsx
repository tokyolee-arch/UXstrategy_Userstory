export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardStats,
  getRecentStories,
  getTopTags,
} from "@/lib/queries/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  SendHorizonal,
  Plus,
  ArrowRight,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryRankings } from "./_components/story-rankings";

/* ── skeleton helper ── */

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
  );
}

/* ── Stats cards ── */

async function StatsSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stats = await getDashboardStats(user?.id ?? "");

  const cards = [
    {
      label: "내가 작성한 스토리",
      value: stats.myStoryCount,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "전체 제출 스토리",
      value: stats.totalSubmitted,
      icon: SendHorizonal,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "전체 팀원 수",
      value: stats.teamMemberCount,
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-muted p-2.5 ${c.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {c.label}
                </p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Recent stories ── */

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300",
  draft: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

async function RecentStoriesSection() {
  const stories = await getRecentStories();

  if (stories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 스토리</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-8 text-center">
          아직 등록된 스토리가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">최근 스토리</CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
          <Link href="/stories">
            전체 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1 px-4 pb-4">
        {stories.map((s) => (
          <Link
            key={s.id}
            href={`/stories/${s.id}`}
            className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground">
                {s.proposer_name ?? "—"} · {formatDate(s.created_at)}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "shrink-0 text-[10px]",
                STATUS_STYLE[s.status] ?? ""
              )}
            >
              {s.status === "submitted" ? "제출됨" : "임시저장"}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Top tags ── */

const TAG_PILL: Record<string, string> = {
  기능: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
  사양: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300",
  서비스: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300",
  사업요소: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300",
};

async function TopTagsSection() {
  const tags = await getTopTags(5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-1.5">
          <Tag className="h-4 w-4" />
          인기 태그 Top 5
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
          <Link href="/analytics">
            분석 대시보드 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            태그가 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {tags.map((t, i) => (
              <div
                key={`${t.category}-${t.tag_name}-${i}`}
                className="flex items-center justify-between"
              >
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    TAG_PILL[t.category] ?? "bg-muted"
                  )}
                >
                  {t.tag_name}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {t.count}회
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main page ── */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
        <Button asChild size="sm" className="gap-1">
          <Link href="/stories/new">
            <Plus className="h-4 w-4" />
            새 스토리 작성
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border p-5 flex items-center gap-4"
              >
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-10" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <StatsSection />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[320px] rounded-lg" />}>
          <RecentStoriesSection />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[320px] rounded-lg" />}>
          <TopTagsSection />
        </Suspense>
      </div>

      {/* Story Rating Rankings */}
      <StoryRankings />
    </div>
  );
}
