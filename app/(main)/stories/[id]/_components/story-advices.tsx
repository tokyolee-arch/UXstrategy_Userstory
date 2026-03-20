"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Loader2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Advice = {
  id: string;
  content: string | null;
  rating: number | null;
  created_at: string;
};

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-6 w-6";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              starSize,
              "transition-colors",
              (hover || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-gray-300 dark:text-gray-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function StoryAdvices({ storyId }: { storyId: string }) {
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [myRatingExists, setMyRatingExists] = useState(false);

  const avgRating =
    advices.filter((a) => a.rating).length > 0
      ? Math.round(
          (advices.filter((a) => a.rating).reduce((s, a) => s + (a.rating ?? 0), 0) /
            advices.filter((a) => a.rating).length) *
            10
        ) / 10
      : 0;

  const totalRatings = advices.filter((a) => a.rating).length;

  const fetchAdvices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/advices`);
      if (res.ok) {
        const data = await res.json();
        setAdvices(data.advices ?? []);
        setMyRatingExists(data.myRatingExists ?? false);
      }
    } catch {
      /* best-effort */
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (expanded) fetchAdvices();
  }, [expanded, fetchAdvices]);

  async function handleSubmit() {
    if (!content.trim() && rating === 0) return;
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/advices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || null,
          rating: rating > 0 ? rating : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "저장에 실패했습니다.");
        return;
      }
      const newAdvice = await res.json();
      setAdvices((prev) => [newAdvice, ...prev]);
      if (rating > 0) setMyRatingExists(true);
      setContent("");
      setRating(0);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="print:hidden">
      <CardHeader
        className="pb-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5" />
            조언 &amp; 별점
            {advices.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {advices.length}
              </Badge>
            )}
            {avgRating > 0 && (
              <span className="flex items-center gap-1 text-sm font-normal text-yellow-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {avgRating}
              </span>
            )}
          </CardTitle>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:bg-blue-950/20 dark:border-blue-900">
            <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              조언과 별점은 <strong>익명으로 전달</strong>됩니다. 입력자 정보는
              스토리 작성자 및 다른 사용자에게 노출되지 않으니 자유롭게 의견을
              남겨주세요.
            </p>
          </div>

          {/* Rating summary */}
          {totalRatings > 0 && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{avgRating}</p>
                <p className="text-[10px] text-muted-foreground">평균</p>
              </div>
              <div className="space-y-0.5">
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <p className="text-[10px] text-muted-foreground">
                  {totalRatings}명 평가
                </p>
              </div>
            </div>
          )}

          {/* Input form */}
          <div className="space-y-3 rounded-lg border p-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                별점 {myRatingExists ? "(이미 등록됨)" : "(선택, 1회만 가능)"}
              </p>
              {myRatingExists ? (
                <p className="text-xs text-muted-foreground italic">
                  이미 이 스토리에 별점을 등록하셨습니다.
                </p>
              ) : (
                <div className="flex items-center gap-2">
                  <StarRating value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setRating(0)}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      초기화
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                조언 (선택)
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="이 스토리에 대한 조언이나 의견을 남겨주세요..."
                className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Ctrl+Enter로 전송
              </p>
              <div className="flex items-center gap-2">
                {error && <p className="text-xs text-destructive">{error}</p>}
                {success && (
                  <p className="text-xs text-green-600">등록되었습니다!</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting || (!content.trim() && rating === 0)}
                  className="gap-1"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  등록
                </Button>
              </div>
            </div>
          </div>

          {/* Advice list */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : advices.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                등록된 조언 &amp; 별점 ({advices.length}개)
              </p>
              {advices.map((advice) => (
                <div
                  key={advice.id}
                  className="rounded-lg border bg-muted/30 p-3 space-y-1.5"
                >
                  {advice.rating && (
                    <StarRating value={advice.rating} readonly size="sm" />
                  )}
                  {advice.content && (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {advice.content}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(advice.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              아직 등록된 조언이 없습니다. 첫 번째 조언과 별점을 남겨보세요!
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
