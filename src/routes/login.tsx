import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin" });
  }, [loading, session, navigate]);

  async function signIn() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    setBusy(false);
  }

  async function signUp() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? error.message : "Conta criada. Verifique seu e-mail se necessário.");
    setBusy(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
      <div className="w-full max-w-sm space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h1 className="text-xl font-semibold">Acesso administrativo</h1>
        <div className="space-y-2">
          <label className="text-xs text-slate-400">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-400">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
          />
        </div>
        {msg && <p className="text-sm text-amber-400">{msg}</p>}
        <div className="flex gap-2">
          <button
            onClick={signIn}
            disabled={busy}
            className="flex-1 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            Entrar
          </button>
          <button
            onClick={signUp}
            disabled={busy}
            className="flex-1 rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            Criar conta
          </button>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });