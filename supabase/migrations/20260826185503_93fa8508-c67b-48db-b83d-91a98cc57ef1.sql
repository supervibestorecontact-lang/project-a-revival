DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='prayer_likes' AND cmd='DELETE' LOOP
    EXECUTE format('DROP POLICY %I ON public.prayer_likes', p.policyname);
  END LOOP;
END $$;

REVOKE DELETE ON public.prayer_likes FROM anon, authenticated;
REVOKE SELECT ON public.prayer_likes FROM anon, authenticated;
GRANT SELECT (id, prayer_id, created_at) ON public.prayer_likes TO anon, authenticated;
GRANT ALL ON public.prayer_likes TO service_role;

REVOKE ALL ON public.profanity_words FROM anon, authenticated;
GRANT ALL ON public.profanity_words TO service_role;