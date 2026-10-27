import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { deleteNegotiation } from "@/lib/negotiations.functions";
import { RequestOwner } from "./request-owner";
import { RequestDetails } from "./request-details";

type Item = { id: string; version: number; buyer: string; seller: string; buyer_id: string; seller_id: string; buyer_request_id: string; seller_request_id: string; created_at: string };

export function AdminNegotiations() {
  const client = useQueryClient();
  const remove = useServerFn(deleteNegotiation);
  const [selected, setSelected] = useState<Item | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["admin-negotiations"], refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.from("request_negotiations")
        .select("id,version,created_at,buyer_request_id,seller_request_id,buyer_id,seller_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((data ?? []).flatMap(n => [n.buyer_request_id, n.seller_request_id]))];
      if (!ids.length) return [] as Item[];
      const { data: requests, error: requestError } = await supabase.from("trade_requests").select("id,title").in("id", ids);
      if (requestError) throw requestError;
      const titles = new Map(requests?.map(r => [r.id, r.title]));
      return (data ?? []).map(n => ({ ...n, buyer: titles.get(n.buyer_request_id) ?? n.buyer_request_id, seller: titles.get(n.seller_request_id) ?? n.seller_request_id }));
    },
  });
  const deletion = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Выберите торг.");
      return remove({ data: { id: selected.id, version: selected.version } });
    },
    onSuccess: async ({ id }) => {
      setSelected(null);
      client.setQueryData<Item[]>(["admin-negotiations"], old => old?.filter(n => n.id !== id));
      client.removeQueries({ queryKey: ["request-negotiation"] });
      client.removeQueries({ queryKey: ["negotiation-history"] });
      await Promise.all(["admin-negotiations", "registry-negotiations", "chat-negotiation-results", "documents"].map(key => client.invalidateQueries({ queryKey: [key] })));
      toast.success("Торг удалён");
    },
    onError: (error) => { toast.error(error.message); setSelected(null); void query.refetch(); },
  });
  return <section className="mt-8 border-t border-border pt-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-ink">Все торги · Администратор</h2>
      <Button variant="ghost" size="icon" aria-label="Обновить список торгов" title="Обновить список торгов" onClick={() => void query.refetch()}><RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} /></Button>
    </div>
    {query.isPending ? <Loader2 aria-label="Загрузка торгов" className="size-5 animate-spin text-dim" /> : query.isError ? <p role="alert" className="text-sm text-destructive">Не удалось загрузить торги.</p> : !query.data.length ? <p className="text-sm text-dim">Торгов пока нет.</p> : <ul className="divide-y divide-border">
      {query.data.map(n => <li key={n.id} className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><RequestOwner userId={n.buyer_id} /><Button variant="link" className="h-auto whitespace-normal p-0 text-left" onClick={() => setRequestId(n.buyer_request_id)}>{n.buyer}</Button></div><div className="space-y-2"><RequestOwner userId={n.seller_id} /><Button variant="link" className="h-auto whitespace-normal p-0 text-left" onClick={() => setRequestId(n.seller_request_id)}>{n.seller}</Button></div></div><p className="mt-2 text-xs text-dim">{new Date(n.created_at).toLocaleDateString("ru-RU")} · Версия {n.version}</p></div>
        <Button variant="ghost" size="icon" className="shrink-0 text-destructive" aria-label={`Удалить торг ${n.buyer} — ${n.seller}`} title="Удалить торг" disabled={deletion.isPending} onClick={() => setSelected(n)}><Trash2 className="size-4" /></Button>
      </li>)}
    </ul>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open && !deletion.isPending) setSelected(null); }}>
      <DialogContent><DialogHeader><DialogTitle>Удалить торг?</DialogTitle><DialogDescription>Торг и история его условий будут удалены без возможности восстановления. Обе заявки и созданные документы останутся. При новом поиске соответствий торг может начаться заново.</DialogDescription></DialogHeader>
        <p className="break-words text-sm text-ink">{selected?.buyer} ⇄ {selected?.seller}</p>
        <DialogFooter><Button variant="outline" disabled={deletion.isPending} onClick={() => setSelected(null)}>Отмена</Button><Button variant="destructive" disabled={deletion.isPending} onClick={() => deletion.mutate()}>{deletion.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Удалить торг</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <RequestDetails requestId={requestId} onClose={() => setRequestId(null)} />
  </section>;
}