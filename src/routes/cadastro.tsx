import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Form = Record<string, string> & {
  autoriza_dados: string; // "true"/"false"
};

const EMPTY: Form = {
  // Empresa
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  inscricao: "",
  endereco: "",
  segmento: "",
  // Representante
  rep_nome: "",
  rep_cpf: "",
  rep_cargo: "",
  rep_email: "",
  rep_telefone: "",
  financeiro_contato: "",
  operacional_contato: "",
  // Comercial
  plano: "",
  modelo_cobranca: "",
  valores: "",
  forma_pagamento: "",
  vigencia: "",
  go_live: "",
  // Jurídico
  dpo: "",
  autoriza_dados: "false",
  responsavel_premiacao: "",
  regulamento_opcao: "padrao",
  // Marca
  nome_exibicao: "",
  slug_desejado: "",
  dominio_proprio: "",
  cor_primaria: "#E9B21E",
  cor_secundaria: "#123A28",
  cor_fundo: "#0A2417",
  cor_texto: "#F4F7F2",
  fonte: "",
  subtitulo: "",
  logo_url: "",
  // Acesso
  admin_email: "",
  admin_responsavel: "",
  // Bolão
  jogos_opcao: "",
  premios: "",
  unidades: "",
  pontuacao: "",
  // Outros
  observacoes: "",
};

function CadastroPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function up<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const contato_email = form.rep_email.trim();
    const nome_ok = (form.nome_fantasia || form.razao_social).trim();
    if (!nome_ok) {
      setErro("Informe ao menos o nome fantasia ou a razão social.");
      return;
    }
    if (!contato_email) {
      setErro("Informe um e-mail de contato do representante.");
      return;
    }

    const p_dados: Record<string, unknown> = {
      ...form,
      autoriza_dados: form.autoriza_dados === "true",
      cores: {
        primaria: form.cor_primaria,
        secundaria: form.cor_secundaria,
        fundo: form.cor_fundo,
        texto: form.cor_texto,
      },
      contato_nome: form.rep_nome,
      contato_email: form.rep_email,
      contato_telefone: form.rep_telefone,
    };

    setEnviando(true);
    const { data, error } = await supabase.rpc("app_registrar_lead", { p_dados });
    setEnviando(false);

    if (error) {
      setErro(error.message);
      return;
    }
    if ((data as { ok?: boolean } | null)?.ok) {
      setOk(true);
      setForm(EMPTY);
      return;
    }
    setErro("Não foi possível registrar agora. Tente novamente.");
  }

  if (ok) {
    return (
      <main className="app-bg min-h-screen flex items-center justify-center p-6">
        <section className="glass max-w-lg w-full p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Recebemos seus dados!</h1>
          <p className="opacity-85">
            Obrigado pelo interesse no <strong>Palpite na Mesa</strong>. Em breve nossa
            equipe entrará em contato pelo e-mail e telefone informados.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button onClick={() => setOk(false)} className="btn btn-ghost">
              Enviar outro
            </button>
            <Link to="/" className="cta text-sm">Voltar ao início</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-bg min-h-screen py-8 px-4">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Seja um parceiro</h1>
          <p className="opacity-80">
            Conte para a gente sobre o seu estabelecimento e a operação do bolão.
            Vamos te responder com a proposta e os próximos passos.
          </p>
        </header>

        <form onSubmit={submit} className="flex flex-col gap-5">
          <Section title="1. Empresa">
            <Field label="Razão social">
              <input className="glass-input" value={form.razao_social} onChange={(e) => up("razao_social", e.target.value)} />
            </Field>
            <Field label="Nome fantasia">
              <input className="glass-input" value={form.nome_fantasia} onChange={(e) => up("nome_fantasia", e.target.value)} />
            </Field>
            <Two>
              <Field label="CNPJ">
                <input className="glass-input" value={form.cnpj} onChange={(e) => up("cnpj", e.target.value)} />
              </Field>
              <Field label="Inscrição">
                <input className="glass-input" value={form.inscricao} onChange={(e) => up("inscricao", e.target.value)} />
              </Field>
            </Two>
            <Field label="Endereço">
              <input className="glass-input" value={form.endereco} onChange={(e) => up("endereco", e.target.value)} />
            </Field>
            <Field label="Segmento">
              <input className="glass-input" value={form.segmento} onChange={(e) => up("segmento", e.target.value)} placeholder="bar, restaurante, hotel..." />
            </Field>
          </Section>

          <Section title="2. Representante e contatos">
            <Two>
              <Field label="Nome do representante">
                <input className="glass-input" value={form.rep_nome} onChange={(e) => up("rep_nome", e.target.value)} />
              </Field>
              <Field label="CPF">
                <input className="glass-input" value={form.rep_cpf} onChange={(e) => up("rep_cpf", e.target.value)} />
              </Field>
            </Two>
            <Two>
              <Field label="Cargo">
                <input className="glass-input" value={form.rep_cargo} onChange={(e) => up("rep_cargo", e.target.value)} />
              </Field>
              <Field label="E-mail do representante">
                <input type="email" className="glass-input" value={form.rep_email} onChange={(e) => up("rep_email", e.target.value)} required />
              </Field>
            </Two>
            <Field label="Telefone">
              <input className="glass-input" value={form.rep_telefone} onChange={(e) => up("rep_telefone", e.target.value)} />
            </Field>
            <Two>
              <Field label="Contato financeiro">
                <input className="glass-input" value={form.financeiro_contato} onChange={(e) => up("financeiro_contato", e.target.value)} />
              </Field>
              <Field label="Contato operacional">
                <input className="glass-input" value={form.operacional_contato} onChange={(e) => up("operacional_contato", e.target.value)} />
              </Field>
            </Two>
          </Section>

          <Section title="3. Comercial">
            <Two>
              <Field label="Plano">
                <input className="glass-input" value={form.plano} onChange={(e) => up("plano", e.target.value)} placeholder="piloto, mensal, enterprise" />
              </Field>
              <Field label="Modelo de cobrança">
                <select className="glass-input" value={form.modelo_cobranca} onChange={(e) => up("modelo_cobranca", e.target.value)}>
                  <option value="">selecione</option>
                  <option value="setup">Setup único</option>
                  <option value="mensal">Mensal</option>
                  <option value="por_participante">Por participante</option>
                </select>
              </Field>
            </Two>
            <Field label="Valores">
              <input className="glass-input" value={form.valores} onChange={(e) => up("valores", e.target.value)} />
            </Field>
            <Two>
              <Field label="Forma de pagamento">
                <input className="glass-input" value={form.forma_pagamento} onChange={(e) => up("forma_pagamento", e.target.value)} />
              </Field>
              <Field label="Vigência">
                <input className="glass-input" value={form.vigencia} onChange={(e) => up("vigencia", e.target.value)} />
              </Field>
            </Two>
            <Field label="Go live">
              <input className="glass-input" value={form.go_live} onChange={(e) => up("go_live", e.target.value)} placeholder="data prevista" />
            </Field>
          </Section>

          <Section title="4. Jurídico e LGPD">
            <Field label="DPO / responsável LGPD">
              <input className="glass-input" value={form.dpo} onChange={(e) => up("dpo", e.target.value)} />
            </Field>
            <label className="flex items-start gap-2 text-sm opacity-90">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.autoriza_dados === "true"}
                onChange={(e) => up("autoriza_dados", e.target.checked ? "true" : "false")}
              />
              <span>Autorizo o tratamento dos dados informados para fins de cadastro e contato comercial.</span>
            </label>
            <Field label="Responsável pela premiação">
              <input className="glass-input" value={form.responsavel_premiacao} onChange={(e) => up("responsavel_premiacao", e.target.value)} />
            </Field>
            <Field label="Regulamento">
              <select className="glass-input" value={form.regulamento_opcao} onChange={(e) => up("regulamento_opcao", e.target.value)}>
                <option value="padrao">Usar regulamento padrão da plataforma</option>
                <option value="proprio">Vou enviar o nosso próprio</option>
              </select>
            </Field>
          </Section>

          <Section title="5. Marca">
            <Two>
              <Field label="Nome de exibição">
                <input className="glass-input" value={form.nome_exibicao} onChange={(e) => up("nome_exibicao", e.target.value)} />
              </Field>
              <Field label="Slug desejado">
                <input
                  className="glass-input"
                  value={form.slug_desejado}
                  onChange={(e) => up("slug_desejado", e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  placeholder="ex: barzinho"
                />
              </Field>
            </Two>
            <Field label="Domínio próprio (opcional)">
              <input className="glass-input" value={form.dominio_proprio} onChange={(e) => up("dominio_proprio", e.target.value)} placeholder="bolao.suaempresa.com.br" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Primária" value={form.cor_primaria} onChange={(v) => up("cor_primaria", v)} />
              <ColorField label="Secundária" value={form.cor_secundaria} onChange={(v) => up("cor_secundaria", v)} />
              <ColorField label="Fundo" value={form.cor_fundo} onChange={(v) => up("cor_fundo", v)} />
              <ColorField label="Texto" value={form.cor_texto} onChange={(v) => up("cor_texto", v)} />
            </div>
            <Field label="Fonte">
              <input className="glass-input" value={form.fonte} onChange={(e) => up("fonte", e.target.value)} />
            </Field>
            <Field label="Subtítulo">
              <input className="glass-input" value={form.subtitulo} onChange={(e) => up("subtitulo", e.target.value)} />
            </Field>
            <Field label="Logo URL">
              <input
                className="glass-input"
                value={form.logo_url}
                onChange={(e) => up("logo_url", e.target.value)}
                placeholder="link da logo, ou deixe vazio que pediremos depois"
              />
            </Field>
          </Section>

          <Section title="6. Acesso">
            <Two>
              <Field label="E-mail do admin">
                <input type="email" className="glass-input" value={form.admin_email} onChange={(e) => up("admin_email", e.target.value)} />
              </Field>
              <Field label="Responsável pelo admin">
                <input className="glass-input" value={form.admin_responsavel} onChange={(e) => up("admin_responsavel", e.target.value)} />
              </Field>
            </Two>
          </Section>

          <Section title="7. Bolão">
            <Field label="Quais jogos">
              <input className="glass-input" value={form.jogos_opcao} onChange={(e) => up("jogos_opcao", e.target.value)} placeholder="ex: Copa do Mundo 2026 - todos os jogos" />
            </Field>
            <Field label="Prêmios">
              <textarea className="glass-input" rows={3} value={form.premios} onChange={(e) => up("premios", e.target.value)} />
            </Field>
            <Field label="Unidades participantes">
              <textarea className="glass-input" rows={2} value={form.unidades} onChange={(e) => up("unidades", e.target.value)} />
            </Field>
            <Field label="Pontuação">
              <input className="glass-input" value={form.pontuacao} onChange={(e) => up("pontuacao", e.target.value)} placeholder="ex: placar exato = 3 pts" />
            </Field>
          </Section>

          <Section title="8. Observações">
            <Field label="Algo mais que devemos saber?">
              <textarea className="glass-input" rows={4} value={form.observacoes} onChange={(e) => up("observacoes", e.target.value)} />
            </Field>
          </Section>

          {erro && (
            <div className="glass p-3 text-sm" style={{ color: "var(--color-brand-primary)" }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={enviando} className="cta">
            {enviando ? "Enviando…" : "Enviar cadastro"}
          </button>

          <div className="text-center text-xs opacity-60">
            <Link to="/">voltar ao início</Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass p-5 space-y-3">
      <h2 className="text-sm uppercase tracking-wide" style={{ color: "var(--color-brand-primary)" }}>
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs opacity-70">{label}</span>
      {children}
    </label>
  );
}

function Two({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-3">{children}</div>;
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
        <input className="glass-input" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </label>
  );
}

export const Route = createFileRoute("/cadastro")({ component: CadastroPage });