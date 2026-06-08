import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Empresa {
  nome_empresa: string;
  slug: string;
  branding: Record<string, unknown> | null;
}

interface Jogo {
  id: string;
  fase: string | null;
  grupo: string | null;
  time_a: string;
  time_b: string;
  inicio: string;
}

interface TenantJogo {
  id: string;
  status: string;
  palpites_encerrados: boolean;
  premio_quantidade: number | null;
  jogo_id: string;
  jogos: { time_a: string; time_b: string; inicio: string } | null;
}

interface Produto {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

interface Cliente {
  id: string;
  nome: string | null;
  telefone: string | null;
  created_at: string;
}

const inputCls = "glass-input text-sm";

function PainelPage() {
  const navigate = useNavigate();
  const { session, role, tenantId, loading } = useAuth();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [ativos, setAtivos] = useState<TenantJogo[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Ativar jogo form
  const [jogoSel, setJogoSel] = useState("");
  const [produtoSel, setProdutoSel] = useState("");
  const [qtd, setQtd] = useState(1);
  const [savingAtivo, setSavingAtivo] = useState(false);

  // Novo produto
  const [novoProduto, setNovoProduto] = useState("");
  const [savingProduto, setSavingProduto] = useState(false);

  const loadAll = useCallback(async () => {
    if (!tenantId) return;
    setErr(null);
    const [{ data: emp }, { data: js, error: jsErr }, { data: atv, error: atvErr }, { data: pds, error: pdsErr }, { data: cls, error: clsErr }] =
      await Promise.all([
        supabase.from("tenants").select("nome_empresa,slug,branding").eq("id", tenantId).single(),
        supabase.from("jogos").select("id,fase,grupo,time_a,time_b,inicio").order("inicio"),
        supabase
          .from("tenant_jogos")
          .select("id,status,palpites_encerrados,premio_quantidade,jogo_id, jogos(time_a,time_b,inicio)")
          .order("created_at", { ascending: false }),
        supabase.from("produtos").select("*").order("created_at", { ascending: false }),
        supabase.from("clientes").select("id,nome,telefone,created_at").order("created_at", { ascending: false }),
      ]);
    const firstErr = jsErr || atvErr || pdsErr || clsErr;
    if (firstErr) setErr(firstErr.message);
    setEmpresa((emp as Empresa) ?? null);
    setJogos((js as Jogo[]) ?? []);
    setAtivos((atv as unknown as TenantJogo[]) ?? []);
    setProdutos((pds as Produto[]) ?? []);
    setClientes((cls as Cliente[]) ?? []);
  }, [tenantId]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (role !== "tenant_admin") return;
    loadAll();
  }, [loading, session, role, tenantId, navigate, loadAll]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  async function ativarJogo() {
    if (!tenantId || !jogoSel) return;
    setSavingAtivo(true);
    const { error } = await supabase.from("tenant_jogos").insert({
      tenant_id: tenantId,
      jogo_id: jogoSel,
      status: "ativo",
      premio_produto_id: produtoSel || null,
      premio_quantidade: qtd || 1,
    });
    if (error) setErr(error.message);
    setJogoSel("");
    setProdutoSel("");
    setQtd(1);
    setSavingAtivo(false);
    await loadAll();
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("tenant_jogos").update({ status }).eq("id", id);
    if (error) setErr(error.message);
    await loadAll();
  }

  async function togglePalpites(id: string, flag: boolean) {
    const { error } = await supabase
      .from("tenant_jogos")
      .update({ palpites_encerrados: !flag })
      .eq("id", id);
    if (error) setErr(error.message);
    await loadAll();
  }

  async function criarProduto() {
    if (!tenantId || !novoProduto.trim()) return;
    setSavingProduto(true);
    const { error } = await supabase
      .from("produtos")
      .insert({ tenant_id: tenantId, nome: novoProduto.trim(), ativo: true });
    if (error) setErr(error.message);
    setNovoProduto("");
    setSavingProduto(false);
    await loadAll();
  }

  async function toggleProduto(p: Produto) {
    const { error } = await supabase.from("produtos").update({ ativo: !p.ativo }).eq("id", p.id);
    if (error) setErr(error.message);
    await loadAll();
  }

  if (loading) {
    return (
      <main className="app-bg min-h-screen flex items-center justify-center">
        Carregando...
      </main>
    );
  }

  if (!session) return null;

  if (role !== "tenant_admin") {
    return (
      <main className="app-bg min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p>Acesso restrito.</p>
        <button onClick={signOut} className="cta text-sm">Sair</button>
      </main>
    );
  }

  return (
    <main className="app-bg min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--glass-border)" }}>
        <div>
          <h1 className="text-lg font-semibold">{empresa?.nome_empresa ?? "Painel"}</h1>
          <p className="text-xs opacity-70">
            {session.user.email} · tenant {empresa?.slug ?? tenantId}
          </p>
        </div>
        <button onClick={signOut} className="cta text-sm">Sair</button>
      </header>

      {err && (
        <div className="px-6 pt-4">
          <p className="text-sm" style={{ color: "var(--color-brand-primary)" }}>{err}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 p-6">
        {/* Jogo do momento */}
        <section className="glass p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-wide" style={{ color: "var(--color-brand-primary)" }}>Jogo do momento</h2>

          <div className="space-y-2">
            <h3 className="text-xs opacity-70">Ativar novo jogo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_auto] gap-2 items-end">
              <label className="block space-y-1">
                <span className="text-xs opacity-60">Jogo</span>
                <select value={jogoSel} onChange={(e) => setJogoSel(e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {jogos.map((j) => (
                    <option key={j.id} value={j.id}>
                      {(j.fase ? j.fase + " · " : "") + j.time_a + " x " + j.time_b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs opacity-60">Prêmio</span>
                <select value={produtoSel} onChange={(e) => setProdutoSel(e.target.value)} className={inputCls}>
                  <option value="">— sem prêmio —</option>
                  {produtos.filter((p) => p.ativo).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs opacity-60">Qtd</span>
                <input
                  type="number"
                  min={1}
                  value={qtd}
                  onChange={(e) => setQtd(Number(e.target.value) || 1)}
                  className={inputCls}
                />
              </label>
              <button
                onClick={ativarJogo}
                disabled={savingAtivo || !jogoSel}
                className="cta text-sm"
              >
                Ativar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs opacity-70">Ativações</h3>
            <ul className="space-y-2">
              {ativos.map((a) => (
                <li
                  key={a.id}
                  className="glass p-3 text-sm flex flex-wrap items-center gap-2"
                >
                  <span className="flex-1 min-w-[180px]">
                    {a.jogos ? a.jogos.time_a + " x " + a.jogos.time_b : a.jogo_id}
                  </span>
                  <select
                    value={a.status}
                    onChange={(e) => setStatus(a.id, e.target.value)}
                    className="glass-input text-xs"
                    style={{ padding: "4px 8px" }}
                  >
                    <option value="habilitado">habilitado</option>
                    <option value="ativo">ativo</option>
                    <option value="encerrado">encerrado</option>
                  </select>
                  <button
                    onClick={() => togglePalpites(a.id, a.palpites_encerrados)}
                    className="glass-input text-xs"
                    style={{ padding: "4px 8px", cursor: "pointer" }}
                  >
                    {a.palpites_encerrados ? "Reabrir palpites" : "Encerrar palpites"}
                  </button>
                </li>
              ))}
              {ativos.length === 0 && (
                <li className="opacity-60 text-sm">Nenhum jogo ativado ainda.</li>
              )}
            </ul>
          </div>
        </section>

        {/* Prêmios */}
        <section className="glass p-5 space-y-4">
          <h2 className="text-sm uppercase tracking-wide" style={{ color: "var(--color-brand-primary)" }}>Prêmios</h2>
          <div className="flex gap-2">
            <input
              value={novoProduto}
              onChange={(e) => setNovoProduto(e.target.value)}
              placeholder="Novo prêmio (ex.: Camisa oficial)"
              className={inputCls}
            />
            <button
              onClick={criarProduto}
              disabled={savingProduto || !novoProduto.trim()}
              className="cta text-sm whitespace-nowrap"
            >
              Criar
            </button>
          </div>
          <ul className="space-y-2">
            {produtos.map((p) => (
              <li
                key={p.id}
                className="glass p-3 text-sm flex items-center gap-2"
              >
                <span className="flex-1">{p.nome}</span>
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-xs"
                  style={{
                    background: p.ativo
                      ? "color-mix(in srgb, var(--color-brand-primary) 25%, transparent)"
                      : "color-mix(in srgb, #000 35%, transparent)",
                    color: p.ativo ? "var(--color-brand-primary)" : "var(--color-brand-text)",
                  }}
                >
                  {p.ativo ? "ativo" : "inativo"}
                </span>
                <button
                  onClick={() => toggleProduto(p)}
                  className="glass-input text-xs"
                  style={{ padding: "4px 8px", cursor: "pointer" }}
                >
                  {p.ativo ? "Desativar" : "Ativar"}
                </button>
              </li>
            ))}
            {produtos.length === 0 && <li className="opacity-60 text-sm">Sem prêmios cadastrados.</li>}
          </ul>
        </section>

        {/* Participantes */}
        <section className="glass p-5 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wide" style={{ color: "var(--color-brand-primary)" }}>Participantes</h2>
            <span className="text-xs opacity-70">{clientes.length} total</span>
          </div>
          <div className="overflow-auto rounded-lg">
            <table className="w-full text-sm">
              <thead className="opacity-80" style={{ background: "color-mix(in srgb, #000 25%, transparent)" }}>
                <tr>
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Entrou em</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                    <td className="p-3">{c.nome ?? "—"}</td>
                    <td className="p-3 opacity-90">{c.telefone ?? "—"}</td>
                    <td className="p-3 opacity-70">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center opacity-60">
                      Nenhum participante ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/painel")({ component: PainelPage });