-- 1) Profanity blocklist
CREATE TABLE IF NOT EXISTS public.profanity_words (
  word text PRIMARY KEY
);
ALTER TABLE public.profanity_words ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profanity_words TO service_role;

INSERT INTO public.profanity_words (word) VALUES
('amk'),('aq'),('amina'),('amına'),('amına koyayım'),('sik'),('sikeyim'),('sikerim'),('sikik'),('siktir'),
('siktir'),('yavşak'),('yavsak'),('orospu'),('oruspu'),('kahpe'),('pezevenk'),('gavat'),('göt'),('got veren'),
('götveren'),('ibne'),('pust'),('puşt'),('kaltak'),('salak'),('gerizekalı'),('gerizekali'),('mal herif'),('şerefsiz'),
('serefsiz'),('haysiyetsiz'),('aptal'),('hıyar'),('kancık'),('kancik'),('yarrak'),('yarak'),('taşak'),('tasak'),
('meme sik'),('anan'),('ananı'),('anani'),('avrat'),('bok'),('boktan'),('kerhane'),('fuck'),('fucking'),
('shit'),('bitch'),('asshole'),('bastard'),('dick'),('pussy'),('whore'),('slut'),('cunt'),('motherfucker')
ON CONFLICT (word) DO NOTHING;

-- 2) Normalizer + profanity check
CREATE OR REPLACE FUNCTION public.normalize_tr(_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(
    translate(lower(_text), 'âîûöüçğışİÂÎÛ', 'aiuoucgisiaiu'),
    '[^a-z0-9]+', ' ', 'g'
  )
$$;

CREATE OR REPLACE FUNCTION public.contains_profanity(_text text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text;
BEGIN
  norm := ' ' || regexp_replace(public.normalize_tr(coalesce(_text, '')), '\s+', ' ', 'g') || ' ';
  RETURN EXISTS (
    SELECT 1 FROM public.profanity_words w
    WHERE norm LIKE '%' || ' ' || public.normalize_tr(w.word) || ' ' || '%'
       OR norm ~ ('(^| )[a-z0-9]*' || public.normalize_tr(w.word) || '[a-z0-9]*( |$)')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.block_profanity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.contains_profanity(NEW.text) OR public.contains_profanity(NEW.author) THEN
    RAISE EXCEPTION 'PROFANITY_BLOCKED';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prayers_block_profanity ON public.prayers;
CREATE TRIGGER prayers_block_profanity
  BEFORE INSERT OR UPDATE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.block_profanity();

DROP TRIGGER IF EXISTS prayer_comments_block_profanity ON public.prayer_comments;
CREATE TRIGGER prayer_comments_block_profanity
  BEFORE INSERT OR UPDATE ON public.prayer_comments
  FOR EACH ROW EXECUTE FUNCTION public.block_profanity();

-- 3) 24 hour lifetime
DROP POLICY IF EXISTS "Anyone can read prayers" ON public.prayers;
CREATE POLICY "Anyone can read recent prayers"
  ON public.prayers FOR SELECT TO anon, authenticated
  USING (created_at > now() - interval '24 hours');

DROP POLICY IF EXISTS "Anyone can read comments" ON public.prayer_comments;
CREATE POLICY "Anyone can read recent comments"
  ON public.prayer_comments FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.prayers p
    WHERE p.id = prayer_comments.prayer_id
      AND p.created_at > now() - interval '24 hours'
  ));

CREATE OR REPLACE FUNCTION public.purge_expired_prayers()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.prayers WHERE created_at < now() - interval '24 hours';
$$;

CREATE INDEX IF NOT EXISTS prayers_created_at_idx ON public.prayers(created_at);

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  PERFORM cron.unschedule('purge-expired-prayers');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
SELECT cron.schedule('purge-expired-prayers', '17 * * * *', $$SELECT public.purge_expired_prayers();$$);