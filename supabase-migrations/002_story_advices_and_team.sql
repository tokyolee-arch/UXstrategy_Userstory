-- =============================================
-- 1. story_advices 테이블 생성 (익명 조언 + 별점 기능)
-- =============================================
CREATE TABLE IF NOT EXISTS public.story_advices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.story_advices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view advices" ON public.story_advices
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert advices" ON public.story_advices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own advices" ON public.story_advices
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_story_advices_story_id ON public.story_advices(story_id);
CREATE INDEX IF NOT EXISTS idx_story_advices_rating ON public.story_advices(rating) WHERE rating IS NOT NULL;

-- =============================================
-- 2. handle_new_user 트리거 업데이트 (team 필드 포함)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, team)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'team'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
