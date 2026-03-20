import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("story_advices")
    .select("id, content, rating, user_id, created_at")
    .eq("story_id", params.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const myRatingExists = user
    ? (data ?? []).some((a) => a.user_id === user.id && a.rating != null)
    : false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sanitized = (data ?? []).map(({ user_id, ...rest }) => rest);

  return NextResponse.json({ advices: sanitized, myRatingExists });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const content = body.content?.trim() || "";
  const rating = typeof body.rating === "number" ? Math.min(5, Math.max(1, body.rating)) : null;

  if (!content && !rating) {
    return NextResponse.json(
      { error: "조언 내용 또는 별점을 입력해주세요." },
      { status: 400 }
    );
  }

  if (rating) {
    const { data: existing } = await supabase
      .from("story_advices")
      .select("id")
      .eq("story_id", params.id)
      .eq("user_id", user.id)
      .not("rating", "is", null)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "이미 이 스토리에 별점을 등록하셨습니다. 별점은 1회만 가능합니다." },
        { status: 409 }
      );
    }
  }

  const insertData: Record<string, unknown> = {
    story_id: params.id,
    user_id: user.id,
  };
  if (content) insertData.content = content;
  if (rating) insertData.rating = rating;

  const { data, error } = await supabase
    .from("story_advices")
    .insert(insertData)
    .select("id, content, rating, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
