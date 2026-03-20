export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  team: string | null;
  role: "viewer" | "editor" | "admin";
  created_at: string;
};

export type UserStory = {
  id: string;
  seq_no: number;
  title: string;
  proposer_id: string | null;
  proposer_name: string | null;
  status: "draft" | "submitted";
  reference_image_url: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type Stage = {
  id: string;
  story_id: string;
  order_num: number;
  stage_name: string;
  user_story_texts: string[];
};

export type TechTag = {
  id: string;
  story_id: string;
  category: "기능" | "사양" | "서비스" | "사업요소";
  tag_name: string;
};

export type StoryFull = UserStory & {
  proposer_display_name: string | null;
  proposer_team: string | null;
  stages: Stage[];
  tech_tags: TechTag[];
};

export type StoryListItem = UserStory & {
  stages: Stage[];
  tech_tags: TechTag[];
};

export type StorySortField =
  | "seq_no"
  | "title"
  | "proposer_name"
  | "status"
  | "created_at";

export type StoryFilters = {
  status?: string;
  proposer?: string;
  keyword?: string;
  categories?: string[];
  sort?: StorySortField;
  order?: "asc" | "desc";
  page?: number;
};
