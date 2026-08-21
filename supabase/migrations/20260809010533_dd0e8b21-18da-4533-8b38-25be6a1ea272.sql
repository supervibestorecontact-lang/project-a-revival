CREATE TABLE public.prayers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL DEFAULT 'İsimsiz Kardeşiniz',
  initials text NOT NULL DEFAULT 'İK',
  text text NOT NULL,
  category text NOT NULL DEFAULT 'gunun' CHECK (category IN ('gunun','acil','sukur')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prayer_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'İsimsiz Kardeşiniz',
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prayer_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid NOT NULL REFERENCES public.prayers(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prayer_id, device_id)
);

CREATE INDEX prayer_comments_prayer_id_idx ON public.prayer_comments(prayer_id);
CREATE INDEX prayer_likes_prayer_id_idx ON public.prayer_likes(prayer_id);

GRANT SELECT, INSERT ON public.prayers TO anon, authenticated;
GRANT SELECT, INSERT ON public.prayer_comments TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.prayer_likes TO anon, authenticated;
GRANT ALL ON public.prayers TO service_role;
GRANT ALL ON public.prayer_comments TO service_role;
GRANT ALL ON public.prayer_likes TO service_role;

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prayers" ON public.prayers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add prayers" ON public.prayers FOR INSERT TO anon, authenticated WITH CHECK (char_length(text) BETWEEN 1 AND 1000 AND char_length(author) <= 60);

CREATE POLICY "Anyone can read comments" ON public.prayer_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add comments" ON public.prayer_comments FOR INSERT TO anon, authenticated WITH CHECK (char_length(text) BETWEEN 1 AND 500 AND char_length(author) <= 60);

CREATE POLICY "Anyone can read likes" ON public.prayer_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add likes" ON public.prayer_likes FOR INSERT TO anon, authenticated WITH CHECK (char_length(device_id) BETWEEN 8 AND 64);
CREATE POLICY "Anyone can remove likes" ON public.prayer_likes FOR DELETE TO anon, authenticated USING (true);