-- Extension layer: store match kind (fusão vs superfusão)
CREATE TABLE IF NOT EXISTS public.match_kinds (
  match_id UUID PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('fusao','superfusao')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS set_match_kinds_updated_at ON public.match_kinds;
CREATE TRIGGER set_match_kinds_updated_at
BEFORE UPDATE ON public.match_kinds
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.match_kinds ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent via pg_policies checks)
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='match_kinds' AND policyname='match_kinds_select_participants') THEN
    CREATE POLICY match_kinds_select_participants ON public.match_kinds
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_kinds.match_id
          AND (auth.uid() = m.user_low OR auth.uid() = m.user_high)
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='match_kinds' AND policyname='match_kinds_insert_participants') THEN
    CREATE POLICY match_kinds_insert_participants ON public.match_kinds
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_kinds.match_id
          AND (auth.uid() = m.user_low OR auth.uid() = m.user_high)
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='match_kinds' AND policyname='match_kinds_update_participants') THEN
    CREATE POLICY match_kinds_update_participants ON public.match_kinds
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_kinds.match_id
          AND (auth.uid() = m.user_low OR auth.uid() = m.user_high)
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_kinds.match_id
          AND (auth.uid() = m.user_low OR auth.uid() = m.user_high)
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='match_kinds' AND policyname='match_kinds_delete_participants') THEN
    CREATE POLICY match_kinds_delete_participants ON public.match_kinds
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = match_kinds.match_id
          AND (auth.uid() = m.user_low OR auth.uid() = m.user_high)
      )
    );
  END IF;
END $do$;
