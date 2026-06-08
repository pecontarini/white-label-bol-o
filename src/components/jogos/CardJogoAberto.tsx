import { Link } from "@tanstack/react-router";
import { type Jogo } from "@/lib/jogos";
import { Bandeira } from "./Bandeira";
import { ChevronRight } from "lucide-react";

/* ===================================================================
   CardJogoAberto — Palpite na Mesa (portado do Caju).
   Visual idêntico ao Caju; consome o tipo `Jogo` do nosso backend
   (cc_a/cc_b para a bandeira, status "ao_vivo"/"encerrado"/"agendado").
   Sem lógica de "envolve Brasil" (era específico do Caju).
   =================================================================== */

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
  const temPlacar = jogo.placar_a !== null && jogo.placar_b !== null;
  const aoVivo = jogo.status === "ao_vivo";
  const encerrado = jogo.status === "encerrado";

  return (
    <Link
      to="/jogar"
      className="block card-press"
    >
      <article
        className={`glass rounded-3xl overflow-hidden grid grid-cols-[56px_1fr_auto] items-stretch transition-shadow hover:shadow-[0_8px_28px_rgba(28,59,22,0.10)] ${
          aoVivo ? "ring-1 ring-cl-laranja/40" : ""
        }`}
      >
        {/* Coluna 1: hora/data */}
        <div className="flex flex-col items-center justify-center border-r border-border/60 py-2.5 px-1 text-cl-cinza-texto">
          <span className="text-[10px] uppercase tracking-wider">
            {diaBR(jogo.data_hora_inicio)}
          </span>
          <span className="text-[15px] font-semibold num text-cl-verde-escuro mt-0.5">
            {horaBR(jogo.data_hora_inicio)}
          </span>
        </div>

        {/* Coluna 2: times empilhados */}
        <div className="py-2 px-3 flex flex-col gap-1.5 min-w-0">
          <LinhaTime
            nome={jogo.time_a}
            cc={jogo.cc_a}
            emoji={jogo.bandeira_a}
            placar={temPlacar ? jogo.placar_a : null}
          />
          <LinhaTime
            nome={jogo.time_b}
            cc={jogo.cc_b}
            emoji={jogo.bandeira_b}
            placar={temPlacar ? jogo.placar_b : null}
          />
        </div>

        {/* Coluna 3: status + seta */}
        <div className="flex flex-col items-end justify-center gap-1 pr-3 pl-1 py-2">
          {aoVivo ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-cl-laranja">
              <span className="pulse-dot" aria-hidden />
              Ao vivo
            </span>
          ) : encerrado ? (
            <span className="badge-encerrado">Encerrado</span>
          ) : (
            <span className="badge-palpite">Palpite</span>
          )}
          <ChevronRight className="size-4 text-cl-cinza-texto" />
        </div>
      </article>
    </Link>
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
      <Bandeira cc={cc} emoji={emoji} alt={nome} tamanho={18} />
      <span className="text-[14px] truncate flex-1 font-medium text-cl-verde-escuro">
        {nome}
      </span>
      {placar !== null && (
        <span className="text-[15px] font-semibold num text-cl-verde-escuro tabular-nums">
          {placar}
        </span>
      )}
    </div>
  );
}
