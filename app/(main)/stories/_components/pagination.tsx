"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PER_PAGE = 20;

export function Pagination({
  total,
  currentPage,
}: {
  total: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 pt-4">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage <= 1}
        onClick={() => goTo(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span
            key={`dots-${idx}`}
            className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="icon"
            className={cn("h-8 w-8 text-xs")}
            onClick={() => goTo(p)}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage >= totalPages}
        onClick={() => goTo(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
