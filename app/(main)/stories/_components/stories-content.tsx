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
  Trash2,
  Loader2,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoryListItem, StoryFilters, StorySortField } from "@/lib/types";
import { deleteStory } from "@/lib/actions/story";
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

function StoryCard({
  story,
  isAdmin,
  onDelete,
}: {
  story: StoryListItem;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}) {
  const tags = story.tech_tags ?? [];
  const visibleTags = tags.slice(0, 5);
  const overflow = tags.length - 5;

  return (
    <div className="relative group">
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
      {isAdmin && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(story.id);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all z-10"
          title="스토리 삭제"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
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
  isAdmin,
  onDelete,
}: {
  stories: StoryListItem[];
  sort: string;
  order: string;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
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
            {isAdmin && (
              <th className="w-14 px-3 py-2.5 text-center font-medium text-muted-foreground">
                삭제
              </th>
            )}
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
              {isAdmin && onDelete && (
                <td className="px-3 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(s.id);
                    }}
                    className="p-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    title="스토리 삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              )}
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
  stories: initialStories,
  total,
  proposers,
  filters,
  isAdmin,
}: {
  stories: StoryListItem[];
  total: number;
  proposers: string[];
  filters: StoryFilters;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<"card" | "table">("card");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stories, setStories] = useState(initialStories);
  const [exporting, setExporting] = useState(false);

  async function handleDelete(storyId: string) {
    if (!confirm("이 스토리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setDeleting(storyId);
    const result = await deleteStory(storyId);
    if (result.error) {
      alert(result.error);
    } else {
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      router.refresh();
    }
    setDeleting(null);
  }

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

          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={exporting || stories.length === 0}
            onClick={async () => {
              setExporting(true);
              try {
                const res = await fetch("/api/stories/export");
                if (!res.ok) throw new Error();
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `user-stories-${new Date().toISOString().slice(0, 10)}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                alert("엑셀 다운로드에 실패했습니다.");
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">엑셀 저장</span>
          </Button>

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
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex items-center gap-2 rounded-lg bg-background p-4 shadow-lg border">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">삭제 중...</span>
          </div>
        </div>
      )}

      {stories.length === 0 ? (
        <EmptyState />
      ) : view === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} isAdmin={isAdmin} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <StoryTable
          stories={stories}
          sort={filters.sort ?? "created_at"}
          order={filters.order ?? "desc"}
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      <Pagination total={total} currentPage={filters.page ?? 1} />
    </div>
  );
}
