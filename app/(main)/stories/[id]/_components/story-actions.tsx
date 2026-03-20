"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Printer, Trash2, Loader2 } from "lucide-react";
import { deleteStory } from "@/lib/actions/story";

export function StoryActions({
  storyId,
  isOwner,
  isAdmin,
}: {
  storyId: string;
  isOwner: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("이 스토리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    const result = await deleteStory(storyId);
    if (result.error) {
      alert(result.error);
      setDeleting(false);
    } else {
      router.push("/stories");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-between print:hidden">
      <Button variant="outline" size="sm" asChild className="gap-1">
        <Link href="/stories">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
      </Button>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            삭제
          </Button>
        )}
        {(isOwner || isAdmin) && (
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
