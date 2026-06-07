import { type Jogo } from "@/lib/jogos";
import { Bandeira } from "./Bandeira";
import { ChevronRight } from "lucide-react";

function horaBR(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function diaBR(iso: string) {
  return new Date(iso)
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      timeZone: "America/Sao_Paulo",
    })
    .replace(".", "");
}

export function CardJogoAberto({ jogo }: { jogo: Jogo }) {
  const aoVivo = jogo.status === "ao_vivo";
  const encerrado = jogo.status === "encerrado";

  return (
    <button
      type="button"
      className="glass-data card-press w-full text-left rounded-2xl p-3"
    >
      <div className="grid grid-cols-[64px_1fr_auto] gap-3 items-center">
        {/* Coluna 1: hora/data */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[11px] uppercase tracking-wide text-[var(--cl-cinza-texto)]">
            {diaBR(jogo.data_hora_inicio)}
          </span>
          <span className="num text-sm font-semibold text-[var(--cl-verde-escuro)]">
            {horaBR(jogo.data_hora_inicio)}
          </span>
        </div>

        {/* Coluna 2: times empilhados */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <LinhaTime
            nome={jogo.time_a}
            cc={jogo.cc_a}
            emoji={jogo.bandeira_a}
            placar={jogo.placar_a}
          />
          <LinhaTime
            nome={jogo.time_b}
            cc={jogo.cc_b}
            emoji={jogo.bandeira_b}
            placar={jogo.placar_b}
          />
        </div>

        {/* Coluna 3: status + seta */}
        <div className="flex items-center gap-1">
          {aoVivo ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--cl-sucesso)]">
              <span className="pulse-dot" />
              Ao vivo
            </span>
          ) : encerrado ? (
            <span className="badge-encerrado">Encerrado</span>
          ) : (
            <span className="badge-palpite">Palpite</span>
          )}
          <ChevronRight className="size-4 text-[var(--cl-cinza-texto)]" />
        </div>
      </div>
    </button>
  );
}

function LinhaTime({
  nome,
  cc,
  emoji,
  placar,
}: {
  nome: string;
  cc: string | null;
  emoji: string;
  placar: number | null;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Bandeira cc={cc} emoji={emoji} alt={nome} tamanho={20} />
      <span className="truncate text-sm font-medium text-[var(--cl-verde-escuro)]">
        {nome}
      </span>
      {placar !== null && (
        <span className="ml-auto num text-sm font-semibold text-[var(--cl-verde-escuro)]">
          {placar}
        </span>
      )}
    </div>
  );
}