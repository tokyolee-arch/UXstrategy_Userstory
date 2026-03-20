import { z } from "zod";

const userStoryTextSchema = z.object({
  value: z.string().min(1, "스토리 항목을 입력해주세요"),
});

const stageSchema = z.object({
  stage_name: z.string().min(1, "여정명을 입력해주세요"),
  user_story_texts: z
    .array(userStoryTextSchema)
    .min(1, "최소 1개의 User Story 항목이 필요합니다"),
});

const techTagSchema = z.object({
  category: z.enum(["기능", "사양", "서비스", "사업요소"]),
  tag_name: z.string().min(1),
});

export const storyFormSchema = z.object({
  title: z.string().min(2, "제목은 최소 2자 이상이어야 합니다"),
  proposer_name: z.string().min(1, "제안자 이름을 입력해주세요"),
  stages: z.array(stageSchema).min(1, "최소 1개의 여정이 필요합니다"),
  tech_tags: z.array(techTagSchema),
  reference_image_url: z.string().nullable(),
  note: z.string().nullable(),
});

export type StoryFormValues = z.infer<typeof storyFormSchema>;
