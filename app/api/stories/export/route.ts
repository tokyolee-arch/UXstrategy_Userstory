import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { data: stories } = await supabase
    .from("user_stories")
    .select("seq_no, title, proposer_name, status, created_at, updated_at")
    .order("seq_no", { ascending: true });

  const { data: stages } = await supabase
    .from("stages")
    .select("story_id, stage_name, order_num")
    .order("order_num", { ascending: true });

  const { data: tags } = await supabase
    .from("tech_tags")
    .select("story_id, category, tag_name");

  const { data: storyIds } = await supabase
    .from("user_stories")
    .select("id, seq_no");

  const idMap = new Map((storyIds ?? []).map((s) => [s.id, s.seq_no]));

  const stageMap = new Map<number, string>();
  for (const s of stages ?? []) {
    const seq = idMap.get(s.story_id);
    if (seq == null) continue;
    const existing = stageMap.get(seq) ?? "";
    stageMap.set(seq, existing ? `${existing}, ${s.stage_name}` : s.stage_name);
  }

  const tagMap = new Map<number, Record<string, string[]>>();
  for (const t of tags ?? []) {
    const seq = idMap.get(t.story_id);
    if (seq == null) continue;
    if (!tagMap.has(seq)) tagMap.set(seq, {});
    const catTags = tagMap.get(seq)!;
    if (!catTags[t.category]) catTags[t.category] = [];
    catTags[t.category].push(t.tag_name);
  }

  const rows = (stories ?? []).map((s) => {
    const catTags = tagMap.get(s.seq_no) ?? {};
    return {
      "#": s.seq_no,
      "제목": s.title,
      "제안자": s.proposer_name ?? "",
      "상태": s.status === "submitted" ? "제출됨" : "임시저장",
      "여정": stageMap.get(s.seq_no) ?? "",
      "기능 태그": (catTags["기능"] ?? []).join(", "),
      "사양 태그": (catTags["사양"] ?? []).join(", "),
      "서비스 태그": (catTags["서비스"] ?? []).join(", "),
      "사업요소 태그": (catTags["사업요소"] ?? []).join(", "),
      "작성일": new Date(s.created_at).toLocaleDateString("ko-KR"),
      "수정일": new Date(s.updated_at).toLocaleDateString("ko-KR"),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 5 },
    { wch: 40 },
    { wch: 12 },
    { wch: 10 },
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
  ];
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "User Stories");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="user-stories-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
