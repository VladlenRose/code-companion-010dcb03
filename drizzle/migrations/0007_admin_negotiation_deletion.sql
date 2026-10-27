CREATE POLICY "Admins read negotiations" ON public.request_negotiations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE FUNCTION public.admin_delete_negotiation(_id uuid, _expected integer, _actor uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n public.request_negotiations;
BEGIN
  IF _actor IS NULL OR NOT public.has_role(_actor, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO n FROM public.request_negotiations WHERE id = _id FOR UPDATE;
  IF n.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF n.version <> _expected THEN RAISE EXCEPTION 'STALE_VERSION'; END IF;
  UPDATE public.documents SET negotiation_id = NULL WHERE negotiation_id = n.id;
  DELETE FROM public.negotiation_versions WHERE negotiation_id = n.id;
  DELETE FROM public.request_negotiations WHERE id = n.id;
  RETURN n.id;
END $$;
REVOKE ALL ON FUNCTION public.admin_delete_negotiation(uuid,integer,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_negotiation(uuid,integer,uuid) TO service_role;