"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutGrid,
  List,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoryListItem, StoryFilters, StorySortField } from "@/lib/types";
import { FilterPanel } from "./filter-panel";
import { Pagination } from "./pagination";

/* ── Tag color mapping ── */

const TAG_COLORS: Record<string, string> = {
  기능: "bg-blue-100 text-blue-800 border-blue-200",
  사양: "bg-purple-100 text-purple-800 border-purple-200",
  서비스: "bg-green-100 text-green-800 border-green-200",
  사업요소: "bg-orange-100 text-orange-800 border-orange-200",
};

function TagPill({ category, name }: { category: string; name: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        TAG_COLORS[category] ?? "bg-muted text-muted-foreground"
      )}
    >
      {name}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px] px-2",
        status === "submitted"
          ? "bg-green-100 text-green-700 border-green-200"
          : "bg-gray-100 text-gray-600 border-gray-200"
      )}
    >
      {status === "submitted" ? "제출됨" : "임시저장"}
    </Badge>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ── Card View ── */

function StoryCard({ story }: { story: StoryListItem }) {
  const tags = story.tech_tags ?? [];
  const visibleTags = tags.slice(0, 5);
  const overflow = tags.length - 5;

  return (
    <Link href={`/stories/${story.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">
              #{story.seq_no}
            </span>
            <StatusBadge status={story.status} />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2.5">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2">
            {story.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{story.proposer_name ?? "—"}</span>
            <span>{formatDate(story.created_at)}</span>
          </div>

          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {visibleTags.map((t) => (
                <TagPill key={t.id} category={t.category} name={t.tag_name} />
              ))}
              {overflow > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  +{overflow}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/* ── Table View ── */

type SortableColumn = {
  key: StorySortField;
  label: string;
  className?: string;
};

const COLUMNS: SortableColumn[] = [
  { key: "seq_no", label: "#", className: "w-16 text-center" },
  { key: "title", label: "제목" },
  { key: "proposer_name", label: "제안자", className: "w-28 hidden md:table-cell" },
  { key: "status", label: "상태", className: "w-24 text-center" },
  { key: "created_at", label: "작성일", className: "w-28 hidden sm:table-cell" },
];

function SortIcon({
  column,
  current,
  order,
}: {
  column: string;
  current: string;
  order: string;
}) {
  if (column !== current)
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return order === "asc" ? (
    <ArrowUp className="ml-1 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3" />
  );
}

function StoryTable({
  stories,
  sort,
  order,
}: {
  stories: StoryListItem[];
  sort: string;
  order: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSort(col: StorySortField) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === col) {
      params.set("order", order === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", col);
      params.set("order", "asc");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors",
                  col.className
                )}
                onClick={() => handleSort(col.key)}
              >
                <span className="inline-flex items-center">
                  {col.label}
                  <SortIcon column={col.key} current={sort} order={order} />
                </span>
              </th>
            ))}
            <th className="w-20 px-3 py-2.5 text-center font-medium text-muted-foreground hidden lg:table-cell">
              여정
            </th>
            <th className="w-20 px-3 py-2.5 text-center font-medium text-muted-foreground hidden lg:table-cell">
              태그
            </th>
          </tr>
        </thead>
        <tbody>
          {stories.map((s) => (
            <tr
              key={s.id}
              className="border-b last:border-0 hover:bg-muted/40 transition-colors"
            >
              <td className="px-3 py-2.5 text-center font-mono text-xs text-muted-foreground">
                {s.seq_no}
              </td>
              <td className="px-3 py-2.5">
                <Link
                  href={`/stories/${s.id}`}
                  className="font-medium hover:underline line-clamp-1"
                >
                  {s.title}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">
                {s.proposer_name ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-center">
                <StatusBadge status={s.status} />
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                {formatDate(s.created_at)}
              </td>
              <td className="px-3 py-2.5 text-center text-xs text-muted-foreground hidden lg:table-cell">
                {s.stages?.length ?? 0}
              </td>
              <td className="px-3 py-2.5 text-center text-xs text-muted-foreground hidden lg:table-cell">
                {s.tech_tags?.length ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Empty State ── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">
        아직 등록된 스토리가 없습니다
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        첫 번째 User Story를 작성해보세요.
      </p>
      <Button asChild className="mt-4 gap-1">
        <Link href="/stories/new">
          <Plus className="h-4 w-4" />
          새 스토리 작성
        </Link>
      </Button>
    </div>
  );
}

/* ── Main Content ── */

export function StoriesContent({
  stories,
  total,
  proposers,
  filters,
}: {
  stories: StoryListItem[];
  total: number;
  proposers: string[];
  filters: StoryFilters;
}) {
  const [view, setView] = useState<"card" | "table">("card");

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          전체 목록
          <span className="ml-2 text-base font-normal text-muted-foreground">
            총 {total}개
          </span>
        </h2>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center rounded-md border">
            <Button
              variant={view === "card" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setView("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button asChild size="sm" className="gap-1">
            <Link href="/stories/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">새 스토리 작성</span>
              <span className="sm:hidden">작성</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} proposers={proposers} />

      <Separator />

      {/* Content */}
      {stories.length === 0 ? (
        <EmptyState />
      ) : view === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      ) : (
        <StoryTable
          stories={stories}
          sort={filters.sort ?? "created_at"}
          order={filters.order ?? "desc"}
        />
      )}

      {/* Pagination */}
      <Pagination total={total} currentPage={filters.page ?? 1} />
    </div>
  );
}
