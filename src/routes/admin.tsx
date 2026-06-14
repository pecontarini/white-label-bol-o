import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { pathForRole } from "@/lib/roleRoute";

interface TenantRow {
  id: string;
  slug: string;
  nome_empresa: string;
  dominio: string | null;
  plano: string;
  ativo: boolean;
  branding: Record<string, any> | null;
  created_at: string;
}

interface LeadRow {
  id: string;
  created_at: string;
  status: string;
  dados: Record<string, any> | null;
}

type AdminTab = "empresas" | "leads" | "vencedores";
type GanhadorRow = {
  tenant_slug: string;
  marca: string;
  cor: string;
  jogo: string;
  fase: string | null;
  realizado_em: string;
  ganhador: string;
  telefone: string;
  premio: string | null;
};
const LEAD_STATUSES = ["novo", "em_analise", "contratado", "descartado"] as const;

type FormState = {
  id?: string;
  slug: string;
  nome_empresa: string;
  dominio: string;
  plano: string;
  ativo: boolean;
  nome_exibicao: string;
  primaria: string;
  secundaria: string;
  fundo: string;
  texto: string;
  logo_url: string;
  fonte: string;
  subtitulo: string;
  regulamento: string;
};

const EMPTY: FormState = {
  slug: "",
  nome_empresa: "",
  dominio: "",
  plano: "piloto",
  ativo: true,
  nome_exibicao: "",
  primaria: "#E9B21E",
  secundaria: "#123A28",
  fundo: "#0A2417",
  texto: "#F4F7F2",
  logo_url: "",
  fonte: "",
  subtitulo: "",
  regulamento: "",
};

function fromTenant(t: TenantRow): FormState {
  const b = (t.branding ?? {}) as any;
  const c = b.cores ?? {};
  return {
    id: t.id,
    slug: t.slug,
    nome_empresa: t.nome_empresa,
    dominio: t.dominio ?? "",
    plano: t.plano,
    ativo: t.ativo,
    nome_exibicao: b.nome_exibicao ?? "",
    primaria: c.primaria ?? "#E9B21E",
    secundaria: c.secundaria ?? "#123A28",
    fundo: c.fundo ?? "#0A2417",
    texto: c.texto ?? "#F4F7F2",
    logo_url: b.logo_url ?? "",
    fonte: b.fonte ?? "",
    subtitulo: b.textos?.subtitulo ?? "",
    regulamento: b.textos?.regulamento ?? "",
  };
}

function AdminPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [adminFor, setAdminFor] = useState<TenantRow | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("empresas");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [ganhadores, setGanhadores] = useState<GanhadorRow[]>([]);
  const [ganhadoresError, setGanhadoresError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("id,slug,nome_empresa,dominio,plano,ativo,branding,created_at")
      .order("created_at", { ascending: false });
    if (error) setListError(error.message);
    else {
      setListError(null);
      setTenants((data ?? []) as TenantRow[]);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setLeadsError(error.message);
    else {
      setLeadsError(null);
      setLeads((data ?? []) as LeadRow[]);
    }
  }, []);

  const loadGanhadores = useCallback(async () => {
    const { data, error } = await supabase.rpc("app_admin_ganhadores");
    if (error) setGanhadoresError(error.message);
    else {
      setGanhadoresError(null);
      setGanhadores((data ?? []) as GanhadorRow[]);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    if (role !== "super_admin") {
      const target = pathForRole(role, true);
      if (target !== "/admin") navigate({ to: target });
      return;
    }
    load();
  }, [loading, session, role, navigate, load]);

  useEffect(() => {
    if (role === "super_admin" && tab === "leads") loadLeads();
  }, [role, tab, loadLeads]);

  useEffect(() => {
    if (role === "super_admin" && tab === "vencedores") loadGanhadores();
  }, [role, tab, loadGanhadores]);

  async function updateLeadStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) setLeadsError(error.message);
    else loadLeads();
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setSaveMsg(null);
    const branding: Record<string, any> = {
      nome_exibicao: form.nome_exibicao,
      cores: {
        primaria: form.primaria,
        secundaria: form.secundaria,
        fundo: form.fundo,
        texto: form.texto,
      },
    };
    if (form.logo_url) branding.logo_url = form.logo_url;
    if (form.fonte) branding.fonte = form.fonte;
    const textos: Record<string, string> = {};
    if (form.subtitulo) textos.subtitulo = form.subtitulo;
    if (form.regulamento) textos.regulamento = form.regulamento;
    if (Object.keys(textos).length) branding.textos = textos;

    const payload = {
      slug: form.slug,
      nome_empresa: form.nome_empresa,
      dominio: form.dominio || null,
      plano: form.plano,
      ativo: form.ativo,
      branding,
    };

    const { error } = form.id
      ? await supabase.from("tenants").update(payload).eq("id", form.id)
      : await supabase.from("tenants").insert(payload);

    if (error) {
      setSaveMsg(error.message);
    } else {
      setSaveMsg(form.id ? "Empresa atualizada." : "Empresa criada.");
      setForm(EMPTY);
      await load();
    }
    setSaving(false);
  }

  async function toggleActive(t: TenantRow) {
    const { error } = await supabase
      .from("tenants")
      .update({ ativo: !t.ativo })
      .eq("id", t.id);
    if (error) setListError(error.message);
    await load();
  }

  function openCreateAdmin(t: TenantRow) {
    setAdminFor(t);
    setAdminEmail("");
    setAdminPassword("");
    setAdminMsg(null);
  }

  async function submitCreateAdmin() {
    if (!adminFor) return;
    setAdminBusy(true);
    setAdminMsg(null);
    const { data, error } = await supabase.functions.invoke("criar-admin-tenant", {
      body: { email: adminEmail, password: adminPassword, tenant_id: adminFor.id },
    });
    if (error) {
      setAdminMsg(error.message);
    } else {
      const created = (data as { email?: string } | null)?.email ?? adminEmail;
      setAdminMsg("Admin criado: " + created);
    }
    setAdminBusy(false);
  }

  if (loading) {
    return (
      <main className="app-bg min-h-screen flex items-center justify-center">
        Carregando...
      </main>
    );
  }

  if (!session) return null;

  if (role !== "super_admin") {
    return (
      <main className="app-bg min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p>Acesso restrito a super-admin.</p>
        <button onClick={signOut} className="cta text-sm">Sair</button>
      </main>
    );
  }

  return (
    <main className="app-bg min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--glass-border)" }}>
        <div>
          <h1 className="text-lg font-semibold">Super-admin · Empresas</h1>
          <p className="text-xs opacity-70">{session.user.email}</p>
        </div>
        <button onClick={signOut} className="cta text-sm">Sair</button>
      </header>

      <div className="px-6 pt-4 flex gap-2">
        {(["empresas", "leads", "vencedores"] as AdminTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost"}
          >
            {t === "empresas" ? "Empresas" : t === "leads" ? "Leads" : "Vencedores"}
          </button>
        ))}
      </div>

      {tab === "vencedores" && (
        <section className="glass m-6 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wide" style={{ color: "var(--color-brand-primary)" }}>
              Vencedores · todas as marcas
            </h2>
            <button onClick={loadGanhadores} className="btn btn-sm btn-ghost">Recarregar</button>
          </div>
          {ganhadoresError && (
            <p className="text-sm mb-2" style={{ color: "var(--color-brand-primary)" }}>{ganhadoresError}</p>
          )}
          {ganhadores.length === 0 ? (
            <p className="text-sm opacity-70">
              Nenhum vencedor apurado ainda. Eles aparecem aqui automaticamente assim que cada jogo for apurado nos painéis.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {Object.entries(
                ganhadores.reduce((acc, g) => {
                  if (!acc[g.marca]) acc[g.marca] = { cor: g.cor, itens: [] };
                  acc[g.marca].itens.push(g);
                  return acc;
                }, {} as Record<string, { cor: string; itens: GanhadorRow[] }>),
              ).map(([marca, info]) => (
                <div key={marca}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ background: info.cor }} />
                    <h3 className="text-sm font-semibold">{marca}</h3>
                    <span className="text-xs opacity-60">· {info.itens.length} prêmio(s)</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {info.itens.map((g, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3"
                        style={{ border: "1px solid var(--glass-border)", borderLeft: `4px solid ${info.cor}` }}
                      >
                        <div className="font-semibold text-sm">{g.ganhador}</div>
                        <div className="text-xs opacity-70">{g.telefone}</div>
                        <div className="text-sm mt-1">Prêmio: {g.premio ?? "—"}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {g.jogo} · {new Date(g.realizado_em).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "leads" ? (
        <section className="glass m-6 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wide" style={{ color: "var(--color-brand-primary)" }}>
              Leads recebidos
            </h2>
            <button onClick={loadLeads} className="btn btn-sm btn-ghost">Recarregar</button>
          </div>
          {leadsError && (
            <p className="text-sm mb-2" style={{ color: "var(--color-brand-primary)" }}>{leadsError}</p>
          )}
          {leads.length === 0 ? (
            <p className="text-sm opacity-70">Nenhum lead ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {leads.map((l) => {
                const d = (l.dados ?? {}) as Record<string, any>;
                const nome = d.nome_fantasia || d.razao_social || "(sem nome)";
                const email = d.contato_email || d.rep_email || "—";
                const slug = d.slug_desejado || "—";
                const isOpen = expandedLead === l.id;
                return (
                  <div key={l.id} className="rounded-lg border p-3" style={{ borderColor: "var(--glass-border)" }}>
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{nome}</div>
                        <div className="text-xs opacity-70">
                          {new Date(l.created_at).toLocaleString("pt-BR")} · {email} · slug: {slug}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={l.status}
                          onChange={(e) => updateLeadStatus(l.id, e.target.value)}
                          className="glass-input text-xs"
                          style={{ width: "auto" }}
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setExpandedLead(isOpen ? null : l.id)}
                          className="btn btn-sm btn-ghost"
                        >
                          {isOpen ? "fechar" : "ver tudo"}
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs">
                        {Object.entries(d).map(([k, v]) => (
                          <div key={k} className="rounded p-2" style={{ background: "color-mix(in srgb, #000 25%, transparent)" }}>
                            <div className="opacity-60 uppercase tracking-wide" style={{ fontSize: 10 }}>{k}</div>
                            <div className="whitespace-pre-wrap break-words">
                              {typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : tab === "empresas" ? (
      <div className="grid lg:grid-cols-[1fr_420px] gap-6 p-6">
        <section className="glass p-5">
          <h2 className="text-sm uppercase tracking-wide opacity-70 mb-3" style={{ color: "var(--color-brand-primary)" }}>
            Empresas cadastradas
          </h2>
          {listError && <p className="text-sm mb-2" style={{ color: "var(--color-brand-primary)" }}>{listError}</p>}
          <div className="overflow-auto rounded-lg">
            <table className="w-full text-sm">
              <thead className="opacity-80" style={{ background: "color-mix(in srgb, #000 25%, transparent)" }}>
                <tr>
                  <th className="text-left p-3">Empresa</th>
                  <th className="text-left p-3">Slug</th>
                  <th className="text-left p-3">Domínio</th>
                  <th className="text-left p-3">Plano</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                    <td className="p-3">{t.nome_empresa}</td>
                    <td className="p-3 opacity-90">{t.slug}</td>
                    <td className="p-3 opacity-70">{t.dominio ?? "—"}</td>
                    <td className="p-3">{t.plano}</td>
                    <td className="p-3">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs"
                        style={{
                          background: t.ativo
                            ? "color-mix(in srgb, var(--color-brand-primary) 25%, transparent)"
                            : "color-mix(in srgb, #000 35%, transparent)",
                          color: t.ativo ? "var(--color-brand-primary)" : "var(--color-brand-text)",
                        }}
                      >
                        {t.ativo ? "ativo" : "inativo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="actions">
                        <button
                          onClick={() => {
                            setSaveMsg(null);
                            setForm(fromTenant(t));
                          }}
                          className="btn btn-sm btn-ghost"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleActive(t)}
                          className="btn btn-sm btn-danger"
                        >
                          {t.ativo ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => openCreateAdmin(t)}
                          className="btn btn-sm btn-primary"
                        >
                          Criar admin
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center opacity-60">
                      Nenhuma empresa cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="glass space-y-3 p-5 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wide" style={{ color: "var(--color-brand-primary)" }}>
              {form.id ? "Editar empresa" : "Nova empresa"}
            </h2>
            {form.id && (
              <button
                onClick={() => {
                  setForm(EMPTY);
                  setSaveMsg(null);
                }}
                className="text-xs opacity-70 hover:opacity-100"
              >
                cancelar
              </button>
            )}
          </div>

          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) =>
                update("slug", e.target.value.toLowerCase().replace(/\s+/g, ""))
              }
              className={inputCls}
            />
          </Field>
          <Field label="Nome da empresa">
            <input
              value={form.nome_empresa}
              onChange={(e) => update("nome_empresa", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Domínio (opcional)">
            <input
              value={form.dominio}
              onChange={(e) => update("dominio", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Plano">
            <select
              value={form.plano}
              onChange={(e) => update("plano", e.target.value)}
              className={inputCls}
            >
              <option value="piloto">piloto</option>
              <option value="mensal">mensal</option>
              <option value="enterprise">enterprise</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => update("ativo", e.target.checked)}
            />
            Ativo
          </label>

          <div className="border-t pt-3 space-y-3" style={{ borderColor: "var(--glass-border)" }}>
            <h3 className="text-xs uppercase tracking-wide" style={{ color: "var(--color-brand-primary)" }}>Branding</h3>
            <Field label="Nome de exibição">
              <input
                value={form.nome_exibicao}
                onChange={(e) => update("nome_exibicao", e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <ColorField label="Primária" value={form.primaria} onChange={(v) => update("primaria", v)} />
              <ColorField label="Secundária" value={form.secundaria} onChange={(v) => update("secundaria", v)} />
              <ColorField label="Fundo" value={form.fundo} onChange={(v) => update("fundo", v)} />
              <ColorField label="Texto" value={form.texto} onChange={(v) => update("texto", v)} />
            </div>
            <Field label="Logo URL">
              <input
                value={form.logo_url}
                onChange={(e) => update("logo_url", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Fonte">
              <input
                value={form.fonte}
                onChange={(e) => update("fonte", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Subtítulo">
              <input
                value={form.subtitulo}
                onChange={(e) => update("subtitulo", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Regulamento / como funciona">
              <textarea
                value={form.regulamento}
                onChange={(e) => update("regulamento", e.target.value)}
                className={inputCls}
                rows={5}
              />
            </Field>
          </div>

          {saveMsg && <p className="text-sm" style={{ color: "var(--color-brand-primary)" }}>{saveMsg}</p>}

          <button
            onClick={save}
            disabled={saving || !form.slug || !form.nome_empresa}
            className="cta w-full text-sm"
          >
            {form.id ? "Salvar alterações" : "Criar empresa"}
          </button>
        </aside>
      </div>
      ) : null}

      {adminFor && (
        <div
          onClick={() => !adminBusy && setAdminFor(null)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-sm p-5 space-y-3"
          >
            <div>
              <h3 className="text-base font-semibold">Criar admin da empresa</h3>
              <p className="text-xs opacity-70">{adminFor.nome_empresa}</p>
            </div>
            <Field label="E-mail">
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Senha temporária">
              <input
                type="text"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={inputCls}
              />
            </Field>
            {adminMsg && <p className="text-sm" style={{ color: "var(--color-brand-primary)" }}>{adminMsg}</p>}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAdminFor(null)}
                disabled={adminBusy}
                className="btn btn-ghost flex-1 disabled:opacity-50"
              >
                Fechar
              </button>
              <button
                onClick={submitCreateAdmin}
                disabled={adminBusy || !adminEmail || !adminPassword}
                className="cta flex-1 text-sm"
              >
                {adminBusy ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputCls = "glass-input text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs opacity-70">{label}</span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs opacity-70">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded"
          style={{ border: "1px solid var(--glass-border)", background: "transparent" }}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      </div>
    </label>
  );
}

export const Route = createFileRoute("/admin")({ component: AdminPage });