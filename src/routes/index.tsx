import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronRight,
  Info,
  Trophy,
  Users,
  MapPin,
  Globe2,
  Ticket,
  CalendarDays,
} from "lucide-react";
import { LayoutCliente } from "@/components/site/LayoutCliente";
import { CardJogoAberto } from "@/components/jogos/CardJogoAberto";
import {
  TabelaClassificacao,
  HeaderClassificacao,
} from "@/components/jogos/TabelaClassificacao";
import { Bandeira } from "@/components/jogos/Bandeira";
import { useTenant } from "@/store/tenant";
import {
  buscarPartidas,
  buscarProximoJogo,
  buscarClassificacao,
  type Jogo,
  type LinhaClassificacao,
  type ProximoJogo,
} from "@/lib/jogos";

/* ===================================================================
   Home — Palpite na Mesa (vitrine portada do Caju, 4 abas).
   Visual idêntico ao Caju; dados via nossas RPCs (app_partidas,
   app_proximo_jogo, app_classificacao). Sem cardápio/unidades/
   "envolve Brasil" (eram do Caju). Os CTAs levam ao fluxo de
   palpite em /jogar.
   =================================================================== */

const COPA_INICIO = new Date("2026-06-11T00:00:00-03:00");
const COPA_FIM = new Date("2026-07-19T23:59:59-03:00");

const ehBrasil = (j: Jogo) =>
  j.cc_a?.toLowerCase() === "br" ||
  j.cc_b?.toLowerCase() === "br" ||
  j.time_a === "Brasil" ||
  j.time_b === "Brasil";

function JogoNaLista({ jogo }: { jogo: Jogo }) {
  if (!ehBrasil(jogo)) return <CardJogoAberto jogo={jogo} />;
  return (
    <div className="relative rounded-3xl ring-2 ring-cl-verde/40">
      <span className="absolute -top-2 left-3 z-10 rounded-full bg-cl-verde text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-sm">
        Brasil
      </span>
      <CardJogoAberto jogo={jogo} />
    </div>
  );
}

type Aba = "visao" | "partidas" | "classificacao" | "eliminatoria";
const ABAS: { id: Aba; label: string }[] = [
  { id: "visao", label: "Visão geral" },
  { id: "partidas", label: "Partidas" },
  { id: "classificacao", label: "Classificação" },
  { id: "eliminatoria", label: "Fase eliminatória" },
];

type Search = { aba: Aba };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const aba = s.aba as Aba | undefined;
    return {
      aba:
        aba === "partidas" || aba === "classificacao" || aba === "eliminatoria"
          ? aba
          : "visao",
    };
  },
  component: Home,
});

function Home() {
  const { aba } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const setAba = (a: Aba) => navigate({ search: { aba: a }, replace: true });

  return (
    <LayoutCliente>
      <TabBar ativa={aba} onChange={setAba} />
      <div className="mt-3">
        {aba === "visao" && <AbaVisaoGeral />}
        {aba === "partidas" && <AbaPartidas />}
        {aba === "classificacao" && <AbaClassificacao />}
        {aba === "eliminatoria" && <AbaEliminatoria />}
      </div>
    </LayoutCliente>
  );
}

function TabBar({ ativa, onChange }: { ativa: Aba; onChange: (a: Aba) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Seções"
      className="sticky top-[56px] z-20 -mx-4 px-4 glass-sticky"
    >
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {ABAS.map((t) => {
          const isAtiva = t.id === ativa;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isAtiva}
              data-active={isAtiva}
              onClick={() => onChange(t.id)}
              className="tab-underline whitespace-nowrap"
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ VISÃO GERAL ============================ */

function AbaVisaoGeral() {
  const tenant = useTenant((s) => s.tenant);
  const logoMarca = tenant?.branding?.logo_url;
  const hoje = new Date();
  const antes = hoje < COPA_INICIO;
  const durante = hoje >= COPA_INICIO && hoje <= COPA_FIM;
  const diasFaltam = Math.max(0, differenceInCalendarDays(COPA_INICIO, hoje));
  const progresso = clamp(
    (hoje.getTime() - COPA_INICIO.getTime()) /
      (COPA_FIM.getTime() - COPA_INICIO.getTime()),
    0,
    1,
  );

  const proximo = useQuery({
    queryKey: ["home", "proximo-jogo"],
    queryFn: buscarProximoJogo,
    refetchInterval: 60_000,
  });

  const partidas = useQuery({
    queryKey: ["home", "partidas"],
    queryFn: buscarPartidas,
    refetchInterval: 60_000,
  });

  const proximoBrasil = useMemo<Jogo | null>(() => {
    const lista = partidas.data ?? [];
    const futuros = lista
      .filter((j) => ehBrasil(j) && j.status !== "encerrado")
      .sort(
        (a, b) =>
          new Date(a.data_hora_inicio).getTime() -
          new Date(b.data_hora_inicio).getTime(),
      );
    return futuros[0] ?? null;
  }, [partidas.data]);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl glass px-5 pt-5 pb-6 text-center"
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "url('/assets/16-textura-geometrica.png')",
            backgroundSize: "260px",
            backgroundRepeat: "repeat",
          }}
        />
        {logoMarca ? (
          <img
            src={logoMarca}
            alt=""
            className="mx-auto mb-3 h-16 w-auto max-w-[160px] object-contain drop-shadow-sm"
          />
        ) : null}
        <p className="font-display text-3xl font-bold text-cl-verde-escuro leading-tight">
          Bolão da Copa
        </p>
        <p className="mt-1 text-[11px] text-cl-cinza-texto uppercase tracking-[0.18em]">
          Palpite na Mesa
        </p>
      </section>

      {/* Próximo jogo */}
      <SecaoProximoJogo loading={proximo.isLoading} dados={proximo.data ?? null} />

      {/* Próximo jogo do Brasil */}
      {proximoBrasil && <SecaoProximoJogoBrasil jogo={proximoBrasil} />}

      {/* Estado da Copa */}
      <section className="glass rounded-3xl p-5">
        {antes && (
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cl-cinza-texto">
              Contagem regressiva
            </p>
            <p className="mt-1 font-display text-cl-verde-escuro leading-none tabular-nums">
              <span className="text-5xl font-bold">{diasFaltam}</span>
              <span className="text-base ml-2">
                {diasFaltam === 1 ? "dia" : "dias"}
              </span>
            </p>
            <p className="mt-1 text-sm text-cl-cinza-texto">para a Copa começar</p>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-cl-cinza-texto">
              11 jun → 19 jul 2026
            </p>
          </div>
        )}
        {durante && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cl-cinza-texto text-center">
              A Copa está rolando
            </p>
            <div className="mt-3 relative h-2 rounded-full bg-cl-verde/10 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-cl-verde rounded-full transition-all"
                style={{ width: `${progresso * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-cl-cinza-texto num">
              <span>11 jun</span>
              <span>19 jul</span>
            </div>
          </div>
        )}
        {!antes && !durante && (
          <div className="text-center">
            <p className="font-display text-xl text-cl-verde-escuro">Copa encerrada</p>
            <p className="text-sm text-cl-cinza-texto mt-1">
              Obrigado por palpitar com a gente!
            </p>
          </div>
        )}
      </section>

      {/* A Copa em números */}
      <section>
        <HeaderSecao titulo="A Copa em números" />
        <div className="grid grid-cols-2 gap-2.5">
          <MiniCard icon={<Users className="size-5" />} valor="48" rotulo="seleções" />
          <MiniCard icon={<Trophy className="size-5" />} valor="104" rotulo="jogos" />
          <MiniCard icon={<MapPin className="size-5" />} valor="16" rotulo="sedes" />
          <MiniCard icon={<Globe2 className="size-5" />} valor="3" rotulo="países" />
        </div>
      </section>

      {/* Atalhos */}
      <section>
        <HeaderSecao titulo="Atalhos" />
        <div className="grid grid-cols-1 gap-2.5">
          <Link
            to="/jogar"
            className="glass rounded-2xl p-4 flex items-center gap-3 card-press"
          >
            <span className="size-10 rounded-full bg-cl-verde/15 flex items-center justify-center text-cl-verde-escuro">
              <Ticket className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-lg text-cl-verde-escuro leading-tight">
                Palpitar e ver meu ranking
              </span>
              <span className="block text-xs text-cl-cinza-texto">
                Dê seu placar e concorra aos prêmios
              </span>
            </span>
            <ChevronRight className="size-5 text-cl-cinza-texto" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function HeaderSecao({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 px-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cl-verde-escuro">
        {titulo}
      </p>
    </div>
  );
}

function MiniCard({
  icon,
  valor,
  rotulo,
}: {
  icon: React.ReactNode;
  valor: string;
  rotulo: string;
}) {
  return (
    <div className="glass rounded-2xl p-3.5 flex items-center gap-3">
      <span className="size-9 rounded-full bg-cl-verde/10 flex items-center justify-center text-cl-verde">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold leading-none text-cl-verde-escuro tabular-nums">
          {valor}
        </p>
        <p className="text-[11px] text-cl-cinza-texto uppercase tracking-wider mt-0.5">
          {rotulo}
        </p>
      </div>
    </div>
  );
}

function SecaoProximoJogo({
  loading,
  dados,
}: {
  loading: boolean;
  dados: ProximoJogo | null;
}) {
  if (loading) {
    return (
      <section>
        <HeaderSecao titulo="Próximo jogo" />
        <div className="glass rounded-3xl p-5 animate-pulse h-32" />
      </section>
    );
  }
  if (!dados) return null;

  const dataFmt = format(
    new Date(dados.data_hora_inicio),
    "EEE, dd 'de' MMM • HH'h'mm",
    { locale: ptBR },
  ).replace(/^./, (c) => c.toUpperCase());

  return (
    <section>
      <HeaderSecao titulo="Próximo jogo" />
      <article className="glass rounded-3xl p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
            <Bandeira cc={dados.cc_a} emoji={dados.bandeira_a} alt={dados.time_a} tamanho={40} />
            <p className="text-sm leading-tight truncate w-full font-medium text-cl-verde-escuro">
              {dados.time_a}
            </p>
          </div>
          <span className="font-display text-2xl text-cl-verde-escuro/40 font-bold">×</span>
          <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
            <Bandeira cc={dados.cc_b} emoji={dados.bandeira_b} alt={dados.time_b} tamanho={40} />
            <p className="text-sm leading-tight truncate w-full font-medium text-cl-verde-escuro">
              {dados.time_b}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-cl-cinza-texto">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="truncate">{dataFmt}</span>
          </div>
        </div>
        <Link
          to="/jogar"
          className="mt-3 block w-full text-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors bg-cl-verde text-white hover:bg-cl-verde/90"
        >
          Palpitar
        </Link>
      </article>
    </section>
  );
}

function SecaoProximoJogoBrasil({ jogo }: { jogo: Jogo }) {
  const dataFmt = format(
    new Date(jogo.data_hora_inicio),
    "EEE, dd 'de' MMM • HH'h'mm",
    { locale: ptBR },
  ).replace(/^./, (c) => c.toUpperCase());

  return (
    <section>
      <HeaderSecao titulo="Próximo jogo do Brasil" />
      <article className="glass rounded-3xl p-4 ring-2 ring-cl-verde/50 relative overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cl-verde via-cl-laranja to-cl-verde"
        />
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
            <Bandeira cc={jogo.cc_a} emoji={jogo.bandeira_a} alt={jogo.time_a} tamanho={44} />
            <p className="text-sm leading-tight truncate w-full font-medium text-cl-verde-escuro">
              {jogo.time_a}
            </p>
          </div>
          <span className="font-display text-2xl text-cl-verde-escuro/40 font-bold">×</span>
          <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
            <Bandeira cc={jogo.cc_b} emoji={jogo.bandeira_b} alt={jogo.time_b} tamanho={44} />
            <p className="text-sm leading-tight truncate w-full font-medium text-cl-verde-escuro">
              {jogo.time_b}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-cl-cinza-texto">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="truncate">{dataFmt}</span>
          </div>
        </div>
        <Link
          to="/jogar"
          className="mt-3 block w-full text-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors bg-cl-verde text-white hover:bg-cl-verde/90"
        >
          Palpitar no Brasil
        </Link>
      </article>
    </section>
  );
}

/* ============================= PARTIDAS ============================= */

type FiltroPartidas = "data" | "grupo" | "rodada";

function AbaPartidas() {
  const [filtro, setFiltro] = useState<FiltroPartidas>("data");

  const jogos = useQuery({
    queryKey: ["home", "partidas"],
    queryFn: buscarPartidas,
    refetchInterval: 30_000,
  });

  const filtros: { id: FiltroPartidas; label: string }[] = [
    { id: "data", label: "Por data" },
    { id: "grupo", label: "Por grupo" },
    { id: "rodada", label: "Por rodada" },
  ];

  return (
    <div className="space-y-4">
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div role="tablist" aria-label="Filtros" className="flex gap-2 w-max">
          {filtros.map((f) => {
            const isAtivo = filtro === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={isAtivo}
                onClick={() => setFiltro(f.id)}
                className={
                  isAtivo
                    ? "px-4 py-2 rounded-full bg-cl-verde text-white text-sm font-semibold shadow-sm whitespace-nowrap"
                    : "px-4 py-2 rounded-full bg-[color-mix(in_srgb,var(--color-brand-text)_8%,transparent)] text-cl-verde text-sm font-semibold border border-cl-verde/15 whitespace-nowrap"
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {jogos.isLoading ? (
        <SkeletonList />
      ) : jogos.isError ? (
        <EstadoErro mensagem="Falha ao carregar partidas." />
      ) : (jogos.data ?? []).length === 0 ? (
        <EstadoVazio mensagem="Nenhum jogo cadastrado." />
      ) : filtro === "data" ? (
        <PartidasPorData jogos={jogos.data ?? []} />
      ) : filtro === "grupo" ? (
        <PartidasPorGrupo jogos={jogos.data ?? []} />
      ) : (
        <PartidasPorRodada jogos={jogos.data ?? []} />
      )}
    </div>
  );
}

function chaveDia(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function chaveHoje(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function rotuloDia(iso: string, hojeKey: string): string {
  if (chaveDia(iso) === hojeKey) return "Hoje";
  return format(new Date(iso), "EEEE, dd 'de' MMM", { locale: ptBR }).replace(
    /^./,
    (c) => c.toUpperCase(),
  );
}

function PartidasPorData({ jogos }: { jogos: Jogo[] }) {
  const hojeKey = chaveHoje();
  const grupos = useMemo(() => {
    const m = new Map<string, Jogo[]>();
    for (const j of jogos) {
      const k = chaveDia(j.data_hora_inicio);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(j);
    }
    return Array.from(m.entries());
  }, [jogos]);

  return (
    <div className="space-y-6">
      {grupos.map(([k, lista]) => {
        const ehHoje = k === hojeKey;
        return (
          <div key={k}>
            <div className="flex items-center gap-2 mb-2 mt-1">
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  ehHoje ? "text-cl-laranja" : "text-cl-verde-escuro"
                }`}
              >
                {rotuloDia(lista[0].data_hora_inicio, hojeKey)}
              </p>
              {ehHoje && (
                <span className="text-[9px] font-semibold uppercase tracking-wider bg-cl-laranja text-white rounded-full px-2 py-0.5">
                  hoje
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {lista.map((j) => (
                <CardJogoAberto key={j.id} jogo={j} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PartidasPorGrupo({ jogos }: { jogos: Jogo[] }) {
  const grupos = useMemo(() => {
    const m = new Map<string, Jogo[]>();
    for (const j of jogos) {
      if (j.fase !== "GROUP_STAGE" || !j.grupo) continue;
      if (!m.has(j.grupo)) m.set(j.grupo, []);
      m.get(j.grupo)!.push(j);
    }
    for (const lista of m.values()) {
      lista.sort(
        (a, b) =>
          new Date(a.data_hora_inicio).getTime() -
          new Date(b.data_hora_inicio).getTime(),
      );
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [jogos]);

  return (
    <div className="space-y-6">
      {grupos.map(([g, lista]) => (
        <div key={g}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cl-verde-escuro mb-2">
            {lista[0].grupo_label ?? g.replace("GROUP_", "Grupo ")}
          </p>
          <div className="space-y-1.5">
            {lista.map((j) => (
              <CardJogoAberto key={j.id} jogo={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PartidasPorRodada({ jogos }: { jogos: Jogo[] }) {
  const rodadas = useMemo(() => {
    const m = new Map<string, Jogo[]>();
    for (const j of jogos) {
      if (j.fase !== "GROUP_STAGE" || j.rodada == null) continue;
      const k = String(j.rodada);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(j);
    }
    for (const lista of m.values()) {
      lista.sort(
        (a, b) =>
          new Date(a.data_hora_inicio).getTime() -
          new Date(b.data_hora_inicio).getTime(),
      );
    }
    return Array.from(m.entries()).sort(([a], [b]) => Number(a) - Number(b));
  }, [jogos]);

  return (
    <div className="space-y-6">
      {rodadas.map(([r, lista]) => (
        <div key={r}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cl-verde-escuro mb-2">
            Rodada {r}
          </p>
          <div className="space-y-1.5">
            {lista.map((j) => (
              <CardJogoAberto key={j.id} jogo={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================== CLASSIFICAÇÃO =========================== */

function AbaClassificacao() {
  const classificacao = useQuery({
    queryKey: ["home", "classificacao"],
    queryFn: buscarClassificacao,
    refetchInterval: 60_000,
  });

  const porGrupo = useMemo(() => {
    const m = new Map<string, { label: string; linhas: LinhaClassificacao[] }>();
    for (const c of classificacao.data ?? []) {
      if (!m.has(c.grupo)) m.set(c.grupo, { label: c.grupo_label, linhas: [] });
      m.get(c.grupo)!.linhas.push(c);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [classificacao.data]);

  if (classificacao.isLoading) return <SkeletonClassificacao />;

  return (
    <div className="space-y-5">
      <HeaderClassificacao titulo="Classificação" />
      <div className="space-y-4">
        {porGrupo.map(([g, { label, linhas }]) => (
          <TabelaClassificacao key={g} grupoLabel={label} linhas={linhas} />
        ))}
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 text-cl-cinza-texto">
          <Info className="size-4 shrink-0" />
          <p className="text-xs">
            Os dois primeiros de cada grupo avançam. Os pontos atualizam conforme os
            resultados saem.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ========================= FASE ELIMINATÓRIA ========================= */

type FaseElim =
  | "LAST_32"
  | "LAST_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "FINAL";

const SUBABAS: { id: FaseElim; label: string }[] = [
  { id: "LAST_32", label: "16-avos" },
  { id: "LAST_16", label: "Oitavas" },
  { id: "QUARTER_FINALS", label: "Quartas" },
  { id: "SEMI_FINALS", label: "Semis" },
  { id: "FINAL", label: "Final" },
];

function AbaEliminatoria() {
  const [fase, setFase] = useState<FaseElim>("LAST_32");

  const jogos = useQuery({
    queryKey: ["home", "partidas"],
    queryFn: buscarPartidas,
  });

  const filtrados = useMemo(() => {
    const lista = jogos.data ?? [];
    if (fase === "SEMI_FINALS") {
      return lista.filter(
        (j) => j.fase === "SEMI_FINALS" || j.fase === "THIRD_PLACE",
      );
    }
    return lista.filter((j) => j.fase === fase);
  }, [jogos.data, fase]);

  return (
    <div className="space-y-4">
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max">
          {SUBABAS.map((s) => {
            const isAtiva = fase === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setFase(s.id)}
                aria-selected={isAtiva}
                className={
                  isAtiva
                    ? "px-4 py-2 rounded-full bg-cl-verde text-white text-sm font-semibold shadow-sm whitespace-nowrap"
                    : "px-4 py-2 rounded-full bg-[color-mix(in_srgb,var(--color-brand-text)_8%,transparent)] text-cl-verde text-sm font-semibold border border-cl-verde/15 whitespace-nowrap"
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {jogos.isLoading ? (
        <SkeletonList />
      ) : filtrados.length === 0 ? (
        <EstadoVazio mensagem="Sem jogos cadastrados nesta fase." />
      ) : (
        <div className="space-y-1.5">
          {filtrados.map((j) => (
            <CardEliminatoria key={j.id} jogo={j} />
          ))}
        </div>
      )}
    </div>
  );
}

function CardEliminatoria({ jogo }: { jogo: Jogo }) {
  const data = new Date(jogo.data_hora_inicio);
  const dia = format(data, "dd 'de' MMM • HH'h'mm", { locale: ptBR });
  const definido =
    jogo.time_a !== "A definir" && jogo.time_b !== "A definir";

  return (
    <article className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-cl-cinza-texto num">
          {dia}
        </span>
      </div>
      {definido ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Bandeira cc={jogo.cc_a} emoji={jogo.bandeira_a} alt={jogo.time_a} tamanho={20} />
            <span className="text-sm font-semibold text-cl-verde-escuro truncate">
              {jogo.time_a}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-cl-cinza-texto">x</span>
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <span className="text-sm font-semibold text-cl-verde-escuro truncate text-right">
              {jogo.time_b}
            </span>
            <Bandeira cc={jogo.cc_b} emoji={jogo.bandeira_b} alt={jogo.time_b} tamanho={20} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-cl-cinza-texto italic">Definido após os jogos</p>
      )}
    </article>
  );
}

/* ========================= Estados auxiliares ========================= */

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-3xl glass animate-pulse" />
      ))}
    </div>
  );
}

function SkeletonClassificacao() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-52 rounded-3xl glass animate-pulse" />
      ))}
    </div>
  );
}

function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-cl-verde/30 p-6 text-center">
      <p className="text-sm text-cl-cinza-texto">{mensagem}</p>
    </div>
  );
}

function EstadoErro({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-3xl border border-cl-erro/30 bg-cl-erro/5 p-4 text-center">
      <p className="text-sm text-cl-erro font-medium">{mensagem}</p>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
