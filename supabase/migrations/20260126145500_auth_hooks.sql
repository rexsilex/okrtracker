-- Auth Hooks for Domain Validation
-- These hooks enforce domain restrictions for @frequencyads.com and @frequency.media
--
-- IMPORTANT: After applying this migration, you must enable the hooks in Supabase Dashboard:
-- 1. Go to Authentication > Hooks
-- 2. Enable "Pre Signup Hook" and set to: public.validate_email_domain
-- 3. Enable "Custom Access Token Hook" and set to: public.custom_access_token_hook

-- Pre-Signup Hook: Validates domain for email/password signups
CREATE OR REPLACE FUNCTION public.validate_email_domain(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email TEXT;
  email_domain TEXT;
  allowed_domains TEXT[] := ARRAY['frequencyads.com', 'frequency.media'];
BEGIN
  user_email := lower(event->'user'->>'email');
  email_domain := split_part(user_email, '@', 2);

  IF email_domain = ANY(allowed_domains) THEN
    RETURN jsonb_build_object('decision', 'continue');
  ELSE
    RETURN jsonb_build_object(
      'decision', 'reject',
      'message', 'Access restricted to @frequencyads.com and @frequency.media email addresses.'
    );
  END IF;
END;
$$;

-- Custom Access Token Hook: Validates domain for ALL logins (including OAuth/Google)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_email TEXT;
  email_domain TEXT;
  allowed_domains TEXT[] := ARRAY['frequencyads.com', 'frequency.media'];
  claims jsonb;
BEGIN
  user_email := lower(event->'claims'->>'email');

  IF user_email IS NULL THEN
    user_email := lower(event->'user'->>'email');
  END IF;

  email_domain := split_part(user_email, '@', 2);

  IF email_domain = ANY(allowed_domains) THEN
    claims := event->'claims';
    RETURN jsonb_build_object('claims', claims);
  ELSE
    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Access restricted to @frequencyads.com and @frequency.media email addresses.'
      )
    );
  END IF;
END;
$$;

-- Grant permissions to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.validate_email_domain(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.validate_email_domain(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;
