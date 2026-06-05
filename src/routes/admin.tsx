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
    if (form.subtitulo) branding.textos = { subtitulo: form.subtitulo };

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
      <main className="min-h-screen flex items-center justify-center">
        Carregando...
      </main>
    );
  }

  if (!session) return null;

  if (role !== "super_admin") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p>Acesso restrito a super-admin.</p>
        <button onClick={signOut} className="cta text-sm">Sair</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--glass-border)" }}>
        <div>
          <h1 className="text-lg font-semibold">Super-admin · Empresas</h1>
          <p className="text-xs opacity-70">{session.user.email}</p>
        </div>
        <button onClick={signOut} className="cta text-sm">Sair</button>
      </header>

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
                className="glass-input flex-1 text-sm disabled:opacity-50"
                style={{ cursor: "pointer" }}
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