"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Tag, CalendarPlus } from "lucide-react";
import type { AnalyticsSummary } from "@/lib/queries/analytics";

const CARDS = [
  { key: "totalSubmitted" as const, label: "총 제출 스토리", icon: FileText, color: "text-blue-600 dark:text-blue-400" },
  { key: "teamMemberCount" as const, label: "팀원 수", icon: Users, color: "text-green-600 dark:text-green-400" },
  { key: "topTag" as const, label: "인기 기능 태그", icon: Tag, color: "text-purple-600 dark:text-purple-400" },
  { key: "thisMonthCount" as const, label: "이번 달 제출", icon: CalendarPlus, color: "text-orange-600 dark:text-orange-400" },
] as const;

export function SummaryCards({ data }: { data: AnalyticsSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((c) => {
        const Icon = c.icon;
        const value =
          c.key === "topTag"
            ? data.topTag ?? "—"
            : data[c.key];
        const isString = typeof value === "string";

        return (
          <Card key={c.key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-muted p-2.5 ${c.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {c.label}
                </p>
                <p
                  className={`font-bold leading-tight ${
                    isString ? "text-lg truncate" : "text-2xl"
                  }`}
                >
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
