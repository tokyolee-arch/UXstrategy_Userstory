"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TagFreqItem } from "@/lib/queries/analytics";

const CATEGORY_COLORS: Record<string, string> = {
  기능: "#3b82f6",
  사양: "#8b5cf6",
  서비스: "#22c55e",
  사업요소: "#f97316",
};

const CATEGORIES = ["기능", "사양", "서비스", "사업요소"] as const;

export function TagBarChart({
  allData,
}: {
  allData: Record<string, TagFreqItem[]>;
}) {
  const [active, setActive] = useState<string>("기능");
  const data = allData[active] ?? [];
  const color = CATEGORY_COLORS[active] ?? "#3b82f6";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">카테고리별 태그 빈도</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="mb-4 grid w-full grid-cols-4">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(250, data.length * 36)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="tag_name"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 13,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {data.map((_, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
