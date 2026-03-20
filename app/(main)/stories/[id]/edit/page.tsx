export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getStoryById } from "@/lib/queries/stories";
import { createClient } from "@/lib/supabase/server";
import { EditStoryForm } from "./_components/edit-story-form";

export default async function EditStoryPage({
  params,
}: {
  params: { id: string };
}) {
  const story = await getStoryById(params.id);
  if (!story) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== story.proposer_id) {
    redirect(`/stories/${params.id}`);
  }

  const formValues = {
    title: story.title,
    proposer_name: story.proposer_name ?? "",
    stages: (story.stages ?? []).map((s) => ({
      stage_name: s.stage_name,
      user_story_texts: (s.user_story_texts ?? []).map((t) => ({ value: t })),
    })),
    tech_tags: (story.tech_tags ?? []).map((t) => ({
      category: t.category,
      tag_name: t.tag_name,
    })),
    reference_image_url: story.reference_image_url ?? null,
    note: story.note ?? null,
  };

  return <EditStoryForm storyId={params.id} defaultValues={formValues} />;
}
