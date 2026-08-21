REVOKE EXECUTE ON FUNCTION public.contains_profanity(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.block_profanity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.purge_expired_prayers() FROM anon, authenticated, public;