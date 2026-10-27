CREATE OR REPLACE FUNCTION public.public_profiles(_ids uuid[])
RETURNS TABLE(user_id uuid, name text, company text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT u.id, coalesce(nullif(btrim(p.name), ''), nullif(btrim(u.raw_user_meta_data->>'name'), '')), coalesce(nullif(btrim(p.company), ''), nullif(btrim(u.raw_user_meta_data->>'company'), ''))
 FROM auth.users u LEFT JOIN public.profiles p ON p.user_id = u.id
 WHERE auth.uid() IS NOT NULL AND u.id = ANY(_ids)
$$;
REVOKE ALL ON FUNCTION public.public_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.public_profiles(uuid[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.delete_catalog_product(_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE p public.products; actor uuid := auth.uid();
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 SELECT * INTO p FROM public.products WHERE id = _id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND'; END IF;
 IF NOT (public.has_role(actor, 'admin') OR coalesce(p.owner_id = actor, false)) THEN RAISE EXCEPTION 'PRODUCT_DELETE_FORBIDDEN'; END IF;
 UPDATE public.trade_requests SET product_snapshot = coalesce(product_snapshot, jsonb_build_object('title', p.title, 'description', p.description, 'category', p.category, 'unit', p.unit, 'supplier', p.supplier, 'kind', p.kind, 'attrs', p.attrs)), product_id = NULL WHERE product_id = _id;
 UPDATE public.threads SET product_id = NULL WHERE product_id = _id;
 UPDATE public.products SET merged_into = NULL WHERE merged_into = _id;
 DELETE FROM public.products WHERE id = _id;
 RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_catalog_product(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_catalog_product(uuid) TO authenticated;