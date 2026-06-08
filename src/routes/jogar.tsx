import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
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
  premio_nome: string | null;
  premio_quantidade: number | null;
};

type RankingRow = { nome: string; acertos: number; palpites: number };
type Identidade = { nome: string; telefone: string };
type MeuPalpite = {
  time_a: string;
  time_b: string;
  inicio: string;
  status: string;
  palpite_a: number;
  palpite_b: number;
  placar_a: number | null;
  placar_b: number | null;
  acertou: boolean | null;
};
type Premio = { id: string; nome: string };
type Aba = "jogos" | "meus" | "ranking" | "premios";

const DEFAULT_REGULAMENTO =
  "Dê o placar exato do jogo do momento para pontuar. A cada jogo encerrado, " +
  "quem cravar o placar exato ganha o prêmio definido pelo estabelecimento. " +
  "Um palpite por jogo; pode editar enquanto os palpites estiverem abertos.";

function ParticipantFlow({
  slug,
  nome,
  logoUrl,
  regulamento,
}: {
  slug: string;
  nome: string;
  logoUrl?: string;
  regulamento?: string;
}) {
  const storageKey = `pnm:participant:${slug}`;
  const [ident, setIdent] = useState<Identidade | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formTel, setFormTel] = useState("");

  const [aba, setAba] = useState<Aba>("jogos");
  const [mostrarComo, setMostrarComo] = useState(false);

  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [loadingJogo, setLoadingJogo] = useState(true);
  const [palpiteA, setPalpiteA] = useState("");
  const [palpiteB, setPalpiteB] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [meus, setMeus] = useState<MeuPalpite[]>([]);
  const [premios, setPremios] = useState<Premio[]>([]);

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

  const carregarMeus = useCallback(async () => {
    if (!ident) {
      setMeus([]);
      return;
    }
    const { data } = await supabase.rpc("app_meus_palpites", {
      p_slug: slug,
      p_telefone: ident.telefone,
    });
    setMeus((data as MeuPalpite[] | null) ?? []);
  }, [slug, ident]);

  const carregarPremios = useCallback(async () => {
    const { data } = await supabase.rpc("app_premios", { p_slug: slug });
    setPremios((data as Premio[] | null) ?? []);
  }, [slug]);

  useEffect(() => {
    carregarJogo();
    carregarRanking();
  }, [carregarJogo, carregarRanking]);

  useEffect(() => {
    if (aba === "meus") carregarMeus();
    else if (aba === "premios") carregarPremios();
    else if (aba === "ranking") carregarRanking();
    else if (aba === "jogos") carregarJogo();
  }, [aba, carregarMeus, carregarPremios, carregarRanking, carregarJogo]);

  const salvarIdent = (e: React.FormEvent) => {
    e.preventDefault();
    const n = formNome.trim();
    const telefone = formTel.trim();
    if (!n || !telefone) return;
    const novo = { nome: n, telefone };
    localStorage.setItem(storageKey, JSON.stringify(novo));
    setIdent(novo);
  };

  const trocar = () => {
    localStorage.removeItem(storageKey);
    setIdent(null);
    setMeus([]);
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
    carregarMeus();
    carregarRanking();
  };

  const encerrado = !!jogo?.palpites_encerrados;
  const regTexto = regulamento && regulamento.trim() ? regulamento : DEFAULT_REGULAMENTO;

  const identCard = !ident ? (
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
  );

  const abas: [Aba, string][] = [
    ["jogos", "Jogos"],
    ["meus", "Meus palpites"],
    ["ranking", "Ranking"],
    ["premios", "Prêmios"],
  ];

  return (
    <div className="mx-auto max-w-xl w-full flex flex-col gap-5 p-4 pb-28">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={nome} className="max-h-10" />
          ) : (
            <h1 className="text-lg font-semibold truncate">{nome}</h1>
          )}
        </div>
        <button
          type="button"
          onClick={() => setMostrarComo((v) => !v)}
          aria-label="Como funciona"
          title="Como funciona"
          className="btn btn-sm btn-ghost"
        >
          ?
        </button>
      </header>

      {mostrarComo ? (
        <section className="glass p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-brand-primary)" }}>
              Como funciona
            </h2>
            <button
              type="button"
              onClick={() => setMostrarComo(false)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              fechar
            </button>
          </div>
          <p className="text-sm whitespace-pre-line opacity-90">{regTexto}</p>
        </section>
      ) : null}

      {identCard}

      {aba === "jogos" && (
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
                {jogo.premio_nome ? (
                  <div className="text-xs mt-2" style={{ color: "var(--color-brand-primary)" }}>
                    Em disputa: {jogo.premio_quantidade ?? 1}x {jogo.premio_nome}
                  </div>
                ) : null}
              </div>

              {encerrado ? (
                <span
                  className="self-center text-xs rounded-full px-3 py-1"
                  style={{
                    background: "color-mix(in srgb, var(--color-brand-primary) 18%, transparent)",
                    color: "var(--color-brand-primary)",
                  }}
                >
                  Palpites encerrados
                </span>
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
      )}

      {aba === "meus" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Meus palpites</h2>
          {!ident ? (
            <div className="glass p-5 text-sm opacity-85">
              Entre no bolão acima para ver seus palpites.
            </div>
          ) : meus.length === 0 ? (
            <div className="glass p-5 text-sm opacity-80">
              Você ainda não palpitou.
            </div>
          ) : (
            meus.map((m, i) => {
              const enc = m.status === "encerrado";
              return (
                <div key={i} className="glass p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {m.time_a} <span className="opacity-60">x</span> {m.time_b}
                    </span>
                    {enc ? (
                      <span
                        className="text-xs rounded-full px-2 py-0.5"
                        style={
                          m.acertou
                            ? {
                                background: "color-mix(in srgb, #22c55e 22%, transparent)",
                                color: "#86efac",
                              }
                            : {
                                background: "color-mix(in srgb, #ef4444 18%, transparent)",
                                color: "#fca5a5",
                              }
                        }
                      >
                        {m.acertou ? "Acertou" : "Não acertou"}
                      </span>
                    ) : (
                      <span
                        className="text-xs rounded-full px-2 py-0.5 opacity-80"
                        style={{ background: "color-mix(in srgb, #fff 8%, transparent)" }}
                      >
                        Aguardando
                      </span>
                    )}
                  </div>
                  <div className="text-sm opacity-85">
                    Meu palpite:{" "}
                    <strong>
                      {m.palpite_a} x {m.palpite_b}
                    </strong>
                  </div>
                  {enc ? (
                    <div className="text-sm opacity-75">
                      Resultado: {m.placar_a ?? "—"} x {m.placar_b ?? "—"}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </section>
      )}

      {aba === "ranking" && (
        <section className="glass p-6">
          <h2 className="text-lg font-semibold mb-3">Ranking</h2>
          {ranking.length === 0 ? (
            <p className="opacity-70 text-sm">Sem participantes ainda.</p>
          ) : (
            <ol className="flex flex-col">
              {ranking.map((r, i) => {
                const isMe = ident && r.nome === ident.nome;
                return (
                  <li
                    key={`${r.nome}-${i}`}
                    className="flex items-center justify-between py-2 px-2 rounded-md"
                    style={{
                      borderTop:
                        i === 0 ? "none" : "1px solid color-mix(in srgb, #fff 6%, transparent)",
                      background: isMe
                        ? "color-mix(in srgb, var(--color-brand-primary) 12%, transparent)"
                        : undefined,
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="text-xs w-6 text-center"
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
                );
              })}
            </ol>
          )}
        </section>
      )}

      {aba === "premios" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Prêmios</h2>
          {jogo?.premio_nome ? (
            <div className="glass p-4 text-sm" style={{ color: "var(--color-brand-primary)" }}>
              Prêmio do jogo atual: {jogo.premio_quantidade ?? 1}x {jogo.premio_nome}
            </div>
          ) : null}
          {premios.length === 0 ? (
            <div className="glass p-5 text-sm opacity-80">
              Os prêmios serão divulgados em breve.
            </div>
          ) : (
            premios.map((p) => (
              <div key={p.id} className="glass p-4">
                <span className="font-medium">{p.nome}</span>
              </div>
            ))
          )}
        </section>
      )}

      <nav
        className="glass fixed left-1/2 -translate-x-1/2 bottom-3 z-40 flex items-center justify-between gap-1 px-2 py-2 w-[calc(100%-1.5rem)] max-w-xl"
        aria-label="Navegação"
      >
        {abas.map(([key, label]) => {
          const active = aba === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setAba(key)}
              className="flex-1 text-xs py-2 rounded-md transition-colors"
              style={{
                color: active ? "var(--color-brand-primary)" : "var(--color-brand-text)",
                background: active
                  ? "color-mix(in srgb, var(--color-brand-primary) 14%, transparent)"
                  : "transparent",
                fontWeight: active ? 600 : 400,
              }}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Jogar() {
  const { tenant, status } = useTenant();

  if (status === "ready" && tenant) {
    const nome = tenant.nome_exibicao ?? tenant.slug;
    return (
      <main className="app-bg min-h-screen py-6 px-2">
        <div className="mx-auto max-w-xl w-full px-4 pt-1 pb-2">
          <Link to="/" className="text-sm underline opacity-70 hover:opacity-100">← Voltar</Link>
        </div>
        <ParticipantFlow
          slug={tenant.slug}
          nome={nome}
          logoUrl={tenant.branding?.logo_url}
          regulamento={tenant.branding?.textos?.regulamento}
        />
      </main>
    );
  }

  const nome = tenant?.nome_exibicao ?? "Palpite na Mesa";
  const subtitulo =
    tenant?.branding?.textos?.subtitulo ?? "Faça seu palpite e concorra a prêmios.";

  return (
    <main className="app-bg flex items-center justify-center p-8 min-h-screen">
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
        <div className="mt-4 text-xs opacity-70">
          <Link to="/cadastro" className="underline hover:opacity-100">
            Seja um parceiro
          </Link>
        </div>
      </section>
    </main>
  );
}

export const Route = createFileRoute("/jogar")({ component: Jogar });