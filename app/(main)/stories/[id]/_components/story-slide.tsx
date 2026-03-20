"use client";

import Image from "next/image";
import type { StoryListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ── Arrow colors per phase index ── */
const ARROW_COLORS = [
  "bg-gray-800",
  "bg-blue-600",
  "bg-gray-700",
  "bg-slate-800",
  "bg-indigo-700",
  "bg-gray-900",
];

const ARROW_TEXT_COLORS = [
  "text-white",
  "text-white",
  "text-white",
  "text-white",
  "text-white",
  "text-white",
];

/* ── Tag category row styles ── */
const TAG_ROW_LABEL: Record<string, string> = {
  기능: "bg-blue-600 text-white",
  사양: "bg-blue-700 text-white",
  서비스: "bg-blue-800 text-white",
  사업요소: "bg-blue-900 text-white",
};

const CATEGORIES = ["기능", "사양", "서비스", "사업요소"] as const;

/* ── Journey Arrow (CSS clip-path chevron) ── */

function JourneyArrow({
  name,
  index,
}: {
  name: string;
  index: number;
}) {
  const isFirst = index === 0;
  const clipFirst = "polygon(0% 0%, calc(100% - 18px) 0%, 100% 50%, calc(100% - 18px) 100%, 0% 100%)";
  const clipMiddle = "polygon(0% 0%, calc(100% - 18px) 0%, 100% 50%, calc(100% - 18px) 100%, 0% 100%, 18px 50%)";

  return (
    <div
      className={cn(
        "flex items-center justify-center px-6 py-3 min-h-[48px] text-xs sm:text-sm font-semibold text-center leading-tight",
        ARROW_COLORS[index % ARROW_COLORS.length],
        ARROW_TEXT_COLORS[index % ARROW_TEXT_COLORS.length]
      )}
      style={{
        clipPath: isFirst ? clipFirst : clipMiddle,
        marginLeft: isFirst ? 0 : -8,
        flex: 1,
        minWidth: 0,
      }}
    >
      {name}
    </div>
  );
}

/* ── Exported Slide ── */

export function StorySlide({ story }: { story: StoryListItem }) {
  const stages = story.stages ?? [];
  const tags = story.tech_tags ?? [];
  const hasImage = !!story.reference_image_url;

  return (
    <div
      id="story-slide"
      className="bg-white rounded-xl border shadow-sm overflow-hidden print:shadow-none print:rounded-none print:border-0"
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 border-b bg-gradient-to-r from-gray-50 to-white px-6 py-5 sm:px-8">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
            경험 아이디어 :{" "}
            <span className="text-blue-700">{story.title}</span>
          </h1>
          {story.note && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              ({story.note})
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400">제안자</p>
          <p className="text-sm font-semibold text-gray-700">
            {story.proposer_name ?? "—"}
          </p>
        </div>
      </div>

      {/* ── Journey Arrows ── */}
      {stages.length > 0 && (
        <div className="px-4 sm:px-8 pt-6">
          <div className="flex">
            {stages.map((s, i) => (
              <JourneyArrow
                key={s.id}
                name={s.stage_name}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── User Story items per phase ── */}
      {stages.length > 0 && (
        <div className="grid gap-3 px-4 sm:px-8 py-4" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
          {stages.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border bg-gray-50/80 p-3 text-xs leading-relaxed"
            >
              {(s.user_story_texts ?? []).map((text, ti) => (
                <p key={ti} className="py-0.5 text-gray-700">
                  <span className="text-blue-500 mr-1">•</span>
                  {text}
                </p>
              ))}
              {(!s.user_story_texts || s.user_story_texts.length === 0) && (
                <p className="text-gray-400 italic">항목 없음</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tech Tags Table + Image ── */}
      <div className="px-4 sm:px-8 pb-6">
        <div className={cn("flex gap-4", hasImage ? "flex-col lg:flex-row" : "")}>
          {/* Tags table */}
          <div className={cn("overflow-hidden rounded-lg border", hasImage ? "lg:w-2/3" : "w-full")}>
            <table className="w-full text-xs">
              <tbody>
                {CATEGORIES.map((cat) => {
                  const catTags = tags.filter((t) => t.category === cat);
                  return (
                    <tr key={cat} className="border-b last:border-0">
                      <td
                        className={cn(
                          "w-20 sm:w-24 px-3 py-2.5 text-center font-semibold whitespace-nowrap",
                          TAG_ROW_LABEL[cat]
                        )}
                      >
                        {cat}
                      </td>
                      <td className="px-3 py-2.5 bg-white">
                        {catTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {catTags.map((t) => (
                              <span
                                key={t.id}
                                className="inline-flex rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] font-medium text-gray-700"
                              >
                                {t.tag_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reference image */}
          {hasImage && story.reference_image_url && (
            <div className="lg:w-1/3 flex flex-col">
              <div className="relative flex-1 min-h-[160px] rounded-lg border overflow-hidden bg-gray-50">
                <Image
                  src={story.reference_image_url}
                  alt="참고 이미지"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400 text-center">
                참고. {story.title}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
