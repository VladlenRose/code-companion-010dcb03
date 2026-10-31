import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { ProductKinds } from "@/lib/request-similarity";

/** Map of product id -> kind ("product" | "service") used to keep goods and services apart in bargaining. */
export function useProductKinds() {
  return useQuery({
    queryKey: ["product-kinds"],
    queryFn: async (): Promise<ProductKinds> => {
      const { data, error } = await supabase.from("products").select("id, kind");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.kind]));
    },
  }).data;
}
