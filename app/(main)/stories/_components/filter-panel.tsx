"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoryFilters } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "draft", label: "임시저장" },
  { value: "submitted", label: "제출됨" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "기능", color: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200" },
  { value: "사양", color: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200" },
  { value: "서비스", color: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" },
  { value: "사업요소", color: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200" },
] as const;

export function FilterPanel({
  filters,
  proposers,
}: {
  filters: StoryFilters;
  proposers: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState(filters.keyword ?? "");

  const activeCount =
    (filters.status && filters.status !== "all" ? 1 : 0) +
    (filters.proposer ? 1 : 0) +
    (filters.categories?.length ?? 0) +
    (filters.keyword ? 1 : 0);

  function pushParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === "" || val === "all") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleKeywordSearch() {
    pushParams({ keyword: keyword || undefined });
  }

  function clearAll() {
    setKeyword("");
    router.push(pathname);
  }

  return (
    <div className="space-y-3">
      {/* Toggle + Keyword */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          className="gap-1.5 shrink-0"
        >
          <Filter className="h-4 w-4" />
          필터
          {activeCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="제목, 단계명, 태그 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleKeywordSearch()}
            className="h-9 pl-9 pr-9"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                pushParams({ keyword: undefined });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground gap-1"
          >
            <X className="h-3.5 w-3.5" />
            초기화
          </Button>
        )}
      </div>

      {/* Expanded Panel */}
      {open && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          {/* Status */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              상태
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={
                    (filters.status ?? "all") === opt.value
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => pushParams({ status: opt.value })}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Proposer */}
          {proposers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                제안자
              </p>
              <select
                value={filters.proposer ?? ""}
                onChange={(e) =>
                  pushParams({ proposer: e.target.value || undefined })
                }
                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">전체</option>
                {proposers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tech Category */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              기술 카테고리
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const active = filters.categories?.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      const current = filters.categories ?? [];
                      const next = active
                        ? current.filter((c) => c !== cat.value)
                        : [...current, cat.value];
                      pushParams({
                        categories:
                          next.length > 0 ? next.join(",") : undefined,
                      });
                    }}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? cat.color
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {cat.value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
