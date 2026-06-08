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

/* ===================================================================
   Painel do lojista — Palpite na Mesa.
   Visual claro/clean com identidade da marca (header na cor primária,
   acentos da empresa, fundo com leve toque de marca). Toda a lógica
   (RPCs, RLS, funções) é idêntica à versão funcional.
   =================================================================== */

const FASE_LABEL: Record<string, string> = {
  GROUP_STAGE: "Fase de grupos",
  LAST_32: "16-avos",
  LAST_16: "Oitavas",
  QUARTER_FINALS: "Quartas",
  SEMI_FINALS: "Semifinal",
  THIRD_PLACE: "3º lugar",
  FINAL: "Final",
};

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
      <main className="painel-bg min-h-screen flex items-center justify-center">
        <p className="painel-muted">Carregando...</p>
      </main>
    );
  }

  if (!session) return null;

  if (role !== "tenant_admin") {
    return (
      <main className="painel-bg min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="painel-ink">Acesso restrito.</p>
        <button onClick={signOut} className="painel-btn-primary">Sair</button>
      </main>
    );
  }

  const logo = (empresa?.branding as { logo_url?: string } | null)?.logo_url;

  return (
    <main className="painel-bg min-h-screen">
      {/* Faixa de marca */}
      <div className="painel-brandbar" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3 min-w-0">
            {logo && (
              <span className="painel-logo-wrap">
                <img src={logo} alt={empresa?.nome_empresa ?? ""} />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="painel-title truncate">{empresa?.nome_empresa ?? "Painel"}</h1>
              <p className="painel-muted text-xs truncate">
                {session.user.email} · {empresa?.slug ?? tenantId}
              </p>
            </div>
          </div>
          <button onClick={signOut} className="painel-btn-ghost shrink-0">Sair</button>
        </header>

        {err && (
          <div className="painel-alert">{err}</div>
        )}

        <div className="grid lg:grid-cols-2 gap-5 pb-10">
          {/* Jogo do momento */}
          <section className="painel-card">
            <div className="painel-card-head">
              <h2>Jogo do momento</h2>
              <span className="painel-pill">{ativos.length} ativo(s)</span>
            </div>

            <div className="painel-card-body space-y-5">
              <div className="space-y-3">
                <h3 className="painel-subhead">Ativar novo jogo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_72px_auto] gap-2.5 items-end">
                  <label className="painel-field">
                    <span>Jogo</span>
                    <select value={jogoSel} onChange={(e) => setJogoSel(e.target.value)} className="painel-input">
                      <option value="">Selecione...</option>
                      {jogos.map((j) => (
                        <option key={j.id} value={j.id}>
                          {(j.fase ? (FASE_LABEL[j.fase] ?? j.fase) + " · " : "") + j.time_a + " x " + j.time_b}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="painel-field">
                    <span>Prêmio</span>
                    <select value={produtoSel} onChange={(e) => setProdutoSel(e.target.value)} className="painel-input">
                      <option value="">— sem prêmio —</option>
                      {produtos.filter((p) => p.ativo).map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </label>
                  <label className="painel-field">
                    <span>Qtd</span>
                    <input
                      type="number"
                      min={1}
                      value={qtd}
                      onChange={(e) => setQtd(Number(e.target.value) || 1)}
                      className="painel-input"
                    />
                  </label>
                  <button
                    onClick={ativarJogo}
                    disabled={savingAtivo || !jogoSel}
                    className="painel-btn-primary"
                  >
                    {savingAtivo ? "..." : "Ativar"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="painel-subhead">Ativações</h3>
                <ul className="space-y-2">
                  {ativos.map((a) => (
                    <li key={a.id} className="painel-row">
                      <span className="flex-1 min-w-[160px] font-medium painel-ink">
                        {a.jogos ? a.jogos.time_a + " x " + a.jogos.time_b : a.jogo_id}
                      </span>
                      <select
                        value={a.status}
                        onChange={(e) => setStatus(a.id, e.target.value)}
                        className="painel-input painel-input-sm"
                      >
                        <option value="habilitado">habilitado</option>
                        <option value="ativo">ativo</option>
                        <option value="encerrado">encerrado</option>
                      </select>
                      <button
                        onClick={() => togglePalpites(a.id, a.palpites_encerrados)}
                        className="painel-btn-soft"
                      >
                        {a.palpites_encerrados ? "Reabrir palpites" : "Encerrar palpites"}
                      </button>
                    </li>
                  ))}
                  {ativos.length === 0 && (
                    <li className="painel-empty">Nenhum jogo ativado ainda.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Prêmios */}
          <section className="painel-card">
            <div className="painel-card-head">
              <h2>Prêmios</h2>
              <span className="painel-pill">{produtos.filter((p) => p.ativo).length} ativo(s)</span>
            </div>
            <div className="painel-card-body space-y-4">
              <div className="flex gap-2">
                <input
                  value={novoProduto}
                  onChange={(e) => setNovoProduto(e.target.value)}
                  placeholder="Novo prêmio (ex.: Camisa oficial)"
                  className="painel-input flex-1"
                />
                <button
                  onClick={criarProduto}
                  disabled={savingProduto || !novoProduto.trim()}
                  className="painel-btn-primary whitespace-nowrap"
                >
                  {savingProduto ? "..." : "Criar"}
                </button>
              </div>
              <ul className="space-y-2">
                {produtos.map((p) => (
                  <li key={p.id} className="painel-row">
                    <span className="flex-1 font-medium painel-ink">{p.nome}</span>
                    <span className={p.ativo ? "painel-badge-on" : "painel-badge-off"}>
                      {p.ativo ? "ativo" : "inativo"}
                    </span>
                    <button onClick={() => toggleProduto(p)} className="painel-btn-soft">
                      {p.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </li>
                ))}
                {produtos.length === 0 && <li className="painel-empty">Sem prêmios cadastrados.</li>}
              </ul>
            </div>
          </section>

          {/* Participantes */}
          <section className="painel-card lg:col-span-2">
            <div className="painel-card-head">
              <h2>Participantes</h2>
              <span className="painel-pill">{clientes.length} total</span>
            </div>
            <div className="painel-card-body">
              <div className="overflow-auto rounded-xl border painel-tablewrap">
                <table className="w-full text-sm">
                  <thead className="painel-thead">
                    <tr>
                      <th className="text-left p-3 font-semibold">Nome</th>
                      <th className="text-left p-3 font-semibold">Telefone</th>
                      <th className="text-left p-3 font-semibold">Entrou em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((c) => (
                      <tr key={c.id} className="painel-trow">
                        <td className="p-3 painel-ink">{c.nome ?? "—"}</td>
                        <td className="p-3 painel-muted">{c.telefone ?? "—"}</td>
                        <td className="p-3 painel-muted">
                          {new Date(c.created_at).toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                    {clientes.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center painel-muted">
                          Nenhum participante ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/painel")({ component: PainelPage });
