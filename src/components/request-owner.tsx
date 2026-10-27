import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { getPublicProfiles } from "@/lib/api";

export function RequestOwner({ userId }: { userId: string }) {
  const q = useQuery({ queryKey: ["public-profile", userId], queryFn: () => getPublicProfiles([userId]), staleTime: 60000 });
  const p = q.data?.[userId];
  return <Link to="/u/$userId" params={{ userId }} className="flex min-w-0 items-start gap-2 text-sm text-brand hover:underline">
    <UserRound className="mt-0.5 size-4 shrink-0" />
    <span className="min-w-0 break-words"><span className="block font-medium">{q.isPending ? "Загрузка имени…" : p?.name || "Имя не указано"}</span>{p?.company && <span className="block text-xs text-dim">{p.company}</span>}</span>
  </Link>;
}