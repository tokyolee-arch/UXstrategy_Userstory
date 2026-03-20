export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  getAnalyticsSummary,
  getTagFrequency,
  getAllTagFrequency,
  getStoryCountByProposer,
} from "@/lib/queries/analytics";
import { SummaryCards } from "./_components/summary-cards";
import { TagBarChart } from "./_components/tag-bar-chart";
import { ProposerPieChart } from "./_components/proposer-pie-chart";
import { TagCloud } from "./_components/tag-cloud";

function SectionSkeleton({ h = 300 }: { h?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg border bg-card"
      style={{ height: h }}
    />
  );
}

async function SummarySection() {
  const data = await getAnalyticsSummary();
  return <SummaryCards data={data} />;
}

async function TagBarSection() {
  const [기능, 사양, 서비스, 사업요소] = await Promise.all([
    getTagFrequency("기능"),
    getTagFrequency("사양"),
    getTagFrequency("서비스"),
    getTagFrequency("사업요소"),
  ]);
  return <TagBarChart allData={{ 기능, 사양, 서비스, 사업요소 }} />;
}

async function ProposerSection() {
  const data = await getStoryCountByProposer();
  return <ProposerPieChart data={data} />;
}

async function CloudSection() {
  const data = await getAllTagFrequency();
  return <TagCloud tags={data} />;
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">분석</h2>

      <Suspense fallback={<SectionSkeleton h={100} />}>
        <SummarySection />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<SectionSkeleton />}>
          <TagBarSection />
        </Suspense>

        <div className="space-y-6">
          <Suspense fallback={<SectionSkeleton />}>
            <ProposerSection />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton h={180} />}>
        <CloudSection />
      </Suspense>
    </div>
  );
}
