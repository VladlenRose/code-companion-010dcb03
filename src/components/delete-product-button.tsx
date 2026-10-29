import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteProduct, type Product } from "@/lib/api";

export function DeleteProductButton({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteProduct(product.$id),
    onSuccess: async () => {
      setOpen(false);
      await Promise.all(["products", "my-products", "admin-unowned-products", "product-request-counts", "product-requests", "requests", "threads"].map((key) => qc.invalidateQueries({ queryKey: [key] })));
      toast.success(product.kind === "service" ? "Услуга удалена" : "Товар удалён");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Не удалось удалить карточку"),
  });
  return <>
    <Button variant="ghost" size="icon" aria-label={`Удалить ${product.kind === "service" ? "услугу" : "товар"} «${product.title}»`} title="Удалить карточку" onClick={() => setOpen(true)}><Trash2 className="size-4" /></Button>
    <Dialog open={open} onOpenChange={(value) => { if (!remove.isPending) setOpen(value); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Удалить {product.kind === "service" ? "услугу" : "товар"}?</DialogTitle></DialogHeader>
        <p className="break-words text-sm text-ink">«{product.title}»</p>
        <p className="text-sm text-dim">Карточка будет удалена из каталога. Заявки, их характеристики, торги и документы сохранятся.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={remove.isPending} onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate()}><Trash2 className="size-4" />{remove.isPending ? "Удаление…" : "Удалить"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}