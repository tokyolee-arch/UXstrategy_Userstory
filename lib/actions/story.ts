"use server";

import { createClient } from "@/lib/supabase/server";
import { storyFormSchema, type StoryFormValues } from "@/lib/validations/story";

export async function createStory(
  data: StoryFormValues & { status: "draft" | "submitted" }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const parsed = storyFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "유효하지 않은 데이터입니다.", details: parsed.error.flatten() };
  }

  const { data: story, error: storyError } = await supabase
    .from("user_stories")
    .insert({
      title: data.title,
      proposer_id: user.id,
      proposer_name: data.proposer_name,
      status: data.status,
      reference_image_url: data.reference_image_url ?? null,
      note: data.note ?? null,
    })
    .select()
    .single();

  if (storyError || !story) {
    return { error: storyError?.message || "스토리 저장에 실패했습니다." };
  }

  if (data.stages.length > 0) {
    const stagesPayload = data.stages.map((stage, idx) => ({
      story_id: story.id,
      order_num: idx + 1,
      stage_name: stage.stage_name,
      user_story_texts: stage.user_story_texts.map((t) => t.value),
    }));

    const { error: stagesError } = await supabase
      .from("stages")
      .insert(stagesPayload);

    if (stagesError) {
      await supabase.from("user_stories").delete().eq("id", story.id);
      return { error: `여정 저장 실패: ${stagesError.message}` };
    }
  }

  if (data.tech_tags && data.tech_tags.length > 0) {
    const tagsPayload = data.tech_tags.map((tag) => ({
      story_id: story.id,
      category: tag.category,
      tag_name: tag.tag_name,
    }));

    const { error: tagsError } = await supabase
      .from("tech_tags")
      .insert(tagsPayload);

    if (tagsError) {
      await supabase.from("stages").delete().eq("story_id", story.id);
      await supabase.from("user_stories").delete().eq("id", story.id);
      return { error: `태그 저장 실패: ${tagsError.message}` };
    }
  }

  return { success: true, storyId: story.id };
}

export async function updateStory(
  storyId: string,
  data: StoryFormValues & { status: "draft" | "submitted" }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "인증이 필요합니다." };
  }

  const parsed = storyFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "유효하지 않은 데이터입니다.", details: parsed.error.flatten() };
  }

  const { error: storyError } = await supabase
    .from("user_stories")
    .update({
      title: data.title,
      proposer_name: data.proposer_name,
      status: data.status,
      reference_image_url: data.reference_image_url ?? null,
      note: data.note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storyId);

  if (storyError) {
    return { error: `스토리 수정 실패: ${storyError.message}` };
  }

  // Delete existing stages and tech_tags, then re-insert
  await supabase.from("stages").delete().eq("story_id", storyId);
  await supabase.from("tech_tags").delete().eq("story_id", storyId);

  if (data.stages.length > 0) {
    const stagesPayload = data.stages.map((stage, idx) => ({
      story_id: storyId,
      order_num: idx + 1,
      stage_name: stage.stage_name,
      user_story_texts: stage.user_story_texts.map((t) => t.value),
    }));

    const { error: stagesError } = await supabase
      .from("stages")
      .insert(stagesPayload);

    if (stagesError) {
      return { error: `여정 저장 실패: ${stagesError.message}` };
    }
  }

  if (data.tech_tags && data.tech_tags.length > 0) {
    const tagsPayload = data.tech_tags.map((tag) => ({
      story_id: storyId,
      category: tag.category,
      tag_name: tag.tag_name,
    }));

    const { error: tagsError } = await supabase
      .from("tech_tags")
      .insert(tagsPayload);

    if (tagsError) {
      return { error: `태그 저장 실패: ${tagsError.message}` };
    }
  }

  return { success: true, storyId };
}
