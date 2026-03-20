"use client";

import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProposerCount } from "@/lib/queries/analytics";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#6366f1",
];

export function ProposerPieChart({ data }: { data: ProposerCount[] }) {
  const router = useRouter();

  const handleClick = (entry: ProposerCount) => {
    router.push(`/stories?proposer=${encodeURIComponent(entry.proposer_name)}`);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">제안자별 제출 수</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          데이터가 없습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">제안자별 제출 수</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="proposer_name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              cursor="pointer"
              onClick={(_, idx) => handleClick(data[idx])}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                fontSize: 13,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(value) => [`${value}건`, "제출 수"]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
