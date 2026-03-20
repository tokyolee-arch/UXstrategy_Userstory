"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Printer } from "lucide-react";

export function StoryActions({
  storyId,
  isOwner,
}: {
  storyId: string;
  isOwner: boolean;
}) {
  return (
    <div className="flex items-center justify-between print:hidden">
      <Button variant="outline" size="sm" asChild className="gap-1">
        <Link href="/stories">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        {isOwner && (
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href={`/stories/${storyId}/edit`}>
              <Pencil className="h-4 w-4" />
              수정
            </Link>
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          PDF 저장
        </Button>
      </div>
    </div>
  );
}
