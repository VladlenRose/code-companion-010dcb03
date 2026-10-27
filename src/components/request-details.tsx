import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RequestOwner } from "./request-owner";
import { supabase } from "@/integrations/supabase/client";
import { LABELS, withDefaults, type ParamKey } from "@/lib/bargain";

export function RequestDetails({ requestId, onClose }: { requestId: string | null; onClose: () => void }) {
  const q = useQuery({ queryKey: ["request-details", requestId], enabled: !!requestId, queryFn: async () => {
    if (!requestId) return null;
    const { data, error } = await supabase.from("trade_requests").select("id,owner_id,kind,title,params,extra,created_at,attachment_url").eq("id", requestId).single();
    if (error) throw error;
    return { ...data, params: withDefaults(data.params as never) };
  } });
  const r = q.data;
  return <Dialog open={!!requestId} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
      <DialogHeader><DialogTitle>{r?.title ?? "Карточка заявки"}</DialogTitle><DialogDescription>{r ? `${r.kind === "buy" ? "Покупка" : "Продажа"} · ${new Date(r.created_at).toLocaleDateString("ru-RU")}` : "Заявка участника"}</DialogDescription></DialogHeader>
      {q.isPending ? <Loader2 className="size-5 animate-spin text-dim" /> : q.isError ? <p role="alert" className="text-sm text-destructive">Заявка недоступна или удалена.</p> : r && <>
        <RequestOwner userId={r.owner_id} />
        <dl className="divide-y divide-border text-sm">{(Object.keys(LABELS) as ParamKey[]).sort((a,b) => r.params[b].priority-r.params[a].priority).map(k => {
          const p = r.params[k];
          const value = p.ignore ? "Не важно" : ["qty","price","term"].includes(k) ? `${p.min || "…"} — ${p.max || "…"} ${p.unit || (k === "price" ? "₽" : k === "term" ? "дней" : "")}` : p.value || "—";
          return <div key={k} className="grid grid-cols-2 gap-4 py-2"><dt className="text-dim">{LABELS[k]} <span className="text-xs">({p.priority}%)</span></dt><dd className="break-words text-right text-ink">{value}</dd></div>;
        })}</dl>
        {r.extra && <p className="whitespace-pre-wrap break-words text-sm text-dim">{r.extra}</p>}
        {r.attachment_url && <a href={r.attachment_url} target="_blank" rel="noreferrer" className="text-sm text-brand underline">Вложение</a>}
      </>}
    </DialogContent>
  </Dialog>;
}