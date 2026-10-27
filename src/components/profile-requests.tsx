import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RequestOwner } from "./request-owner";
import { RequestDetails } from "./request-details";

import { listUserRequests } from "@/lib/api";

export function ProfileRequests({ userId, title = "История заявок" }: { userId: string; title?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["user-requests", userId], queryFn: () => listUserRequests(userId) });
  const rows = q.data ?? [];
  return (
    <section className="glass-panel mb-6 rounded-2xl p-6">
      <h2 className="text-base font-semibold text-ink">{title} · {rows.length}</h2>
      {q.isLoading ? (
        <p className="mt-4 text-sm text-dim">Загружаем…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-dim">Заявок пока нет.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="space-y-2 py-3 text-sm">
              <RequestOwner userId={userId} />
              <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-dim">
                {r.kind === "buy" ? "Покупка" : "Продажа"}
              </span>
              <Button variant="link" className="h-auto min-w-0 flex-1 justify-start whitespace-normal p-0 text-left text-ink" onClick={() => setSelected(r.id)}>{r.title}</Button>
              <span className="font-mono text-xs text-dim">{new Date(r.created_at).toLocaleDateString("ru-RU")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <RequestDetails requestId={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
