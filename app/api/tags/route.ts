import { NextResponse } from "next/server";
import { getExistingTags } from "@/lib/queries/tags";

export async function GET() {
  const tags = await getExistingTags();
  return NextResponse.json(tags);
}
