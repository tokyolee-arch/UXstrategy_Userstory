import { notFound } from "next/navigation";
import { getStoryById } from "@/lib/queries/stories";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/types";
import { StorySlide } from "./_components/story-slide";
import { StoryActions } from "./_components/story-actions";
import { StoryAdvices } from "./_components/story-advices";

export default async function StoryDetailPage({
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
  const isOwner = !!user && user.id === story.proposer_id;
  const isAdmin = isAdminEmail(user?.email);

  return (
    <div className="space-y-4">
      <StorySlide story={story} />
      <StoryActions storyId={story.id} isOwner={isOwner} isAdmin={isAdmin} />
      <StoryAdvices storyId={story.id} />
    </div>
  );
}
