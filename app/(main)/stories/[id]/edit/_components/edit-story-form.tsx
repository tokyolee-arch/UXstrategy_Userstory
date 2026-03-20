"use client";

import { StoryForm } from "../../../_components/story-form";
import type { StoryFormValues } from "@/lib/validations/story";

export function EditStoryForm({
  storyId,
  defaultValues,
}: {
  storyId: string;
  defaultValues: StoryFormValues;
}) {
  return (
    <StoryForm mode="edit" defaultValues={defaultValues} storyId={storyId} />
  );
}
