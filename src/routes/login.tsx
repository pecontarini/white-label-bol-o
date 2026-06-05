import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { pathForRole } from "@/lib/roleRoute";

function LoginPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (session) navigate({ to: pathForRole(role, true) });
  }, [loading, session, role, navigate]);

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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass w-full max-w-sm space-y-4 p-6">
        <h1 className="text-xl font-semibold">Acesso administrativo</h1>
        <div className="space-y-2">
          <label className="text-xs opacity-70">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs opacity-70">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input text-sm"
          />
        </div>
        {msg && <p className="text-sm" style={{ color: "var(--color-brand-primary)" }}>{msg}</p>}
        <div className="flex gap-2">
          <button
            onClick={signIn}
            disabled={busy}
            className="cta flex-1 text-sm"
          >
            Entrar
          </button>
          <button
            onClick={signUp}
            disabled={busy}
            className="glass-input flex-1 text-sm font-medium disabled:opacity-50"
            style={{ cursor: "pointer" }}
          >
            Criar conta
          </button>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/login")({ component: LoginPage });