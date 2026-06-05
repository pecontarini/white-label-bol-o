import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useTenant } from "@/store/tenant";
import { supabase } from "@/integrations/supabase/client";

type Jogo = {
  tenant_jogo_id: string;
  jogo_id: string;
  time_a: string;
  time_b: string;
  inicio: string;
  fase: string | null;
  grupo: string | null;
  status: string;
  palpites_encerrados: boolean;
};

type RankingRow = { nome: string; acertos: number; palpites: number };

type Identidade = { nome: string; telefone: string };

function ParticipantFlow({ slug }: { slug: string }) {
  const storageKey = `pnm:participant:${slug}`;
  const [ident, setIdent] = useState<Identidade | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formTel, setFormTel] = useState("");

  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [loadingJogo, setLoadingJogo] = useState(true);
  const [palpiteA, setPalpiteA] = useState("");
  const [palpiteB, setPalpiteB] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [ranking, setRanking] = useState<RankingRow[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setIdent(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const carregarJogo = useCallback(async () => {
    setLoadingJogo(true);
    const { data } = await supabase.rpc("app_jogo_ativo", { p_slug: slug });
    setJogo((data as Jogo[] | null)?.[0] ?? null);
    setLoadingJogo(false);
  }, [slug]);

  const carregarRanking = useCallback(async () => {
    const { data } = await supabase.rpc("app_ranking", { p_slug: slug });
    setRanking((data as RankingRow[] | null) ?? []);
  }, [slug]);

  useEffect(() => {
    carregarJogo();
    carregarRanking();
  }, [carregarJogo, carregarRanking]);

  const salvarIdent = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = formNome.trim();
    const telefone = formTel.trim();
    if (!nome || !telefone) return;
    const novo = { nome, telefone };
    localStorage.setItem(storageKey, JSON.stringify(novo));
    setIdent(novo);
  };

  const trocar = () => {
    localStorage.removeItem(storageKey);
    setIdent(null);
    setFormNome("");
    setFormTel("");
  };

  const enviarPalpite = async () => {
    if (!ident || !jogo) return;
    if (palpiteA === "" || palpiteB === "") {
      toast.error("Preencha os dois placares.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.rpc("app_registrar_palpite", {
      p_slug: slug,
      p_nome: ident.nome,
      p_telefone: ident.telefone,
      p_palpite_a: Number(palpiteA),
      p_palpite_b: Number(palpiteB),
    });
    setEnviando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Palpite registrado!");
    setPalpiteA("");
    setPalpiteB("");
    carregarRanking();
  };

  const encerrado = !!jogo?.palpites_encerrados;

  return (
    <div className="mx-auto max-w-xl w-full flex flex-col gap-5 p-4">
      {/* IDENTIDADE */}
      {!ident ? (
        <form onSubmit={salvarIdent} className="glass p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Entrar no bolão</h2>
          <input
            className="glass-input"
            placeholder="Seu nome"
            value={formNome}
            onChange={(e) => setFormNome(e.target.value)}
            required
          />
          <input
            className="glass-input"
            placeholder="Telefone"
            value={formTel}
            onChange={(e) => setFormTel(e.target.value)}
            required
          />
          <button type="submit" className="cta">Continuar</button>
        </form>
      ) : (
        <div className="glass p-4 flex items-center justify-between">
          <span className="text-sm opacity-85">
            Jogando como <strong>{ident.nome}</strong>
          </span>
          <button
            type="button"
            onClick={trocar}
            className="text-xs underline opacity-70 hover:opacity-100"
          >
            trocar
          </button>
        </div>
      )}

      {/* JOGO DO MOMENTO */}
      <section className="glass p-6">
        <h2 className="text-lg font-semibold mb-3">Jogo do momento</h2>
        {loadingJogo ? (
          <p className="opacity-70 text-sm">Carregando…</p>
        ) : !jogo ? (
          <p className="opacity-80">Nenhum jogo ativo no momento.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold">
                {jogo.time_a} <span className="opacity-60">x</span> {jogo.time_b}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {format(new Date(jogo.inicio), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                {jogo.fase ? ` · ${jogo.fase}` : ""}
                {jogo.grupo ? ` · Grupo ${jogo.grupo}` : ""}
              </div>
            </div>

            {encerrado ? (
              <p className="text-center text-sm" style={{ color: "var(--color-brand-primary)" }}>
                Palpites encerrados
              </p>
            ) : null}

            <div className="flex items-center justify-center gap-3">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="glass-input w-20 text-center text-xl"
                value={palpiteA}
                onChange={(e) => setPalpiteA(e.target.value)}
                disabled={encerrado || !ident}
                aria-label={`Placar ${jogo.time_a}`}
              />
              <span className="opacity-60">x</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="glass-input w-20 text-center text-xl"
                value={palpiteB}
                onChange={(e) => setPalpiteB(e.target.value)}
                disabled={encerrado || !ident}
                aria-label={`Placar ${jogo.time_b}`}
              />
            </div>

            <button
              type="button"
              className="cta"
              onClick={enviarPalpite}
              disabled={encerrado || !ident || enviando}
            >
              {enviando ? "Enviando…" : "Enviar palpite"}
            </button>
            {!ident ? (
              <p className="text-xs opacity-70 text-center">
                Entre no bolão acima para enviar seu palpite.
              </p>
            ) : null}
          </div>
        )}
      </section>

      {/* RANKING */}
      <section className="glass p-6">
        <h2 className="text-lg font-semibold mb-3">Ranking</h2>
        {ranking.length === 0 ? (
          <p className="opacity-70 text-sm">Sem participantes ainda.</p>
        ) : (
          <ol className="flex flex-col">
            {ranking.map((r, i) => (
              <li
                key={`${r.nome}-${i}`}
                className="flex items-center justify-between py-2"
                style={{ borderTop: i === 0 ? "none" : "1px solid color-mix(in srgb, #fff 6%, transparent)" }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="text-xs w-6 text-center opacity-70"
                    style={{ color: "var(--color-brand-primary)" }}
                  >
                    {i + 1}º
                  </span>
                  <span className="font-medium">{r.nome}</span>
                </span>
                <span className="text-sm">
                  <strong>{r.acertos}</strong> pts
                  <span className="opacity-60 text-xs ml-2">({r.palpites})</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Home() {
  const { tenant, status } = useTenant();

  if (status === "ready" && tenant) {
    const nome = tenant.nome_exibicao ?? tenant.slug;
    return (
      <main className="min-h-screen py-8 px-4">
        <header className="max-w-xl mx-auto text-center mb-6">
          {tenant.branding?.logo_url ? (
            <img
              src={tenant.branding.logo_url}
              alt={nome}
              className="max-h-20 mx-auto mb-3"
            />
          ) : (
            <h1 className="text-3xl font-bold">{nome}</h1>
          )}
          {tenant.branding?.textos?.subtitulo ? (
            <p className="opacity-80 text-sm mt-1">
              {tenant.branding.textos.subtitulo}
            </p>
          ) : null}
        </header>
        <ParticipantFlow slug={tenant.slug} />
      </main>
    );
  }

  const nome = tenant?.nome_exibicao ?? "Palpite na Mesa";
  const subtitulo =
    tenant?.branding?.textos?.subtitulo ?? "Faça seu palpite e concorra a prêmios.";

  return (
    <main className="flex items-center justify-center p-8 min-h-screen">
      <section className="glass max-w-2xl w-full text-center p-12">
        {tenant?.branding?.logo_url ? (
          <img
            src={tenant.branding.logo_url}
            alt={nome}
            className="max-h-24 mx-auto mb-6"
          />
        ) : (
          <h1 className="text-4xl font-bold mb-4">{nome}</h1>
        )}
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: "var(--color-brand-primary)" }}
        >
          Copa do Mundo FIFA 2026
        </h2>
        <p className="opacity-85 mb-6">{subtitulo}</p>
        <button className="cta">Entrar no bolão</button>
        <div className="text-xs opacity-60 mt-8">
          {status === "neutro"
            ? "Tema neutro (nenhuma empresa identificada)"
            : "Tenant: " + (tenant?.slug ?? "")}
        </div>
      </section>
    </main>
  );
}

export const Route = createFileRoute("/")({ component: Home });
