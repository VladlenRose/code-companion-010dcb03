import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { validateResetPassword } from "@/lib/password-reset";

const TITLE = "Новый пароль — AI-Mall";
const DESCRIPTION = "Восстановите доступ к AI-Mall и установите новый пароль по ссылке из письма.";
export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: TITLE }, { name: "description", content: DESCRIPTION }, { property: "og:title", content: TITLE }, { property: "og:description", content: DESCRIPTION }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "saved">("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const recoveryLink = hash.get("type") === "recovery";
    let recovered = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && event === "PASSWORD_RECOVERY" && session) { recovered = true; setState("ready"); }
    });
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || recovered) return;
      setState(recoveryLink && data.session && !sessionError ? "ready" : "invalid");
    }).catch(() => { if (active) setState("invalid"); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== "ready" || busy) return;
    const validation = validateResetPassword(password, confirmation);
    if (validation) { setError(validation); return; }
    setBusy(true); setError("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword(""); setConfirmation(""); setState("saved");
    } catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить пароль. Запросите новое письмо."); }
    finally { setBusy(false); }
  };
  return <main className="grid min-h-screen place-items-center bg-mist/60 px-4 py-12"><div className="w-full max-w-md">
    <Link to="/" className="mb-6 block text-center text-lg font-semibold text-ink">AI-Mall</Link>
    <h1 className="text-2xl font-semibold text-ink">{state === "saved" ? "Пароль изменён" : "Новый пароль"}</h1>
    {state === "loading" ? <Loader2 className="mt-6 size-5 animate-spin text-brand" /> : state === "invalid" ? <div className="mt-4 space-y-4"><p role="alert" className="text-sm text-dim">Ссылка недействительна или устарела. Запросите новое письмо для восстановления пароля.</p><Button asChild variant="outline"><Link to="/auth">Вернуться ко входу</Link></Button></div> : state === "saved" ? <div className="mt-4 space-y-4"><p className="text-sm text-dim">Новый пароль сохранён.</p><Button onClick={() => void navigate({ to: "/dashboard" })}>Перейти в кабинет</Button></div> : <form onSubmit={save} className="mt-6 space-y-4">
      <div className="space-y-2"><Label htmlFor="reset-password">Новый пароль</Label><Input id="reset-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="reset-confirmation">Повторите пароль</Label><Input id="reset-confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />}Сохранить пароль</Button>
    </form>}
  </div></main>;
}