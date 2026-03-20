"use client";

import { StoryForm } from "../_components/story-form";

const EMPTY_DEFAULTS = {
  title: "",
  proposer_name: "",
  stages: [{ stage_name: "", user_story_texts: [{ value: "" }] }],
  tech_tags: [],
  reference_image_url: null,
  note: "",
};

export default function StoryNewPage() {
  return <StoryForm mode="create" defaultValues={EMPTY_DEFAULTS} />;
}
