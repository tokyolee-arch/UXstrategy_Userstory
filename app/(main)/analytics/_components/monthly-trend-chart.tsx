"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyTrendItem } from "@/lib/queries/analytics";

function formatMonth(m: string) {
  const [, month] = m.split("-");
  return `${parseInt(month)}월`;
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendItem[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">월별 제출 트렌드</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          데이터가 없습니다
        </CardContent>
      </Card>
    );
  }

  const display = data.map((d) => ({ ...d, label: formatMonth(d.month) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">월별 제출 트렌드 (최근 6개월)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={display} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                fontSize: 13,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
            <Line
              type="monotone"
              dataKey="submitted"
              name="제출"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="draft"
              name="임시저장"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
