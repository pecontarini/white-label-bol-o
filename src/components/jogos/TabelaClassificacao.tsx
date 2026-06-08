import { Bandeira } from "./Bandeira";
import type { LinhaClassificacao } from "@/lib/jogos";

/* ===================================================================
   TabelaClassificacao — Palpite na Mesa (portado do Caju).
   Visual idêntico; consome o formato da RPC app_classificacao
   (selecao, cc, bandeira, j/v/e/d/sg/pts). Sem destaque fixo de
   "Brasil" (era específico do Caju) — os 2 primeiros do grupo
   ficam marcados como classificados.
   =================================================================== */

type Props = {
  grupoLabel: string;
  linhas: LinhaClassificacao[];
  className?: string;
};

export function TabelaClassificacao({ grupoLabel, linhas, className = "" }: Props) {
  return (
    <div className={`rounded-3xl overflow-hidden glass-data ${className}`}>
      <div className="px-4 py-2 bg-cl-verde flex items-center gap-2">
        <span
          className="inline-block size-1.5 rounded-full bg-cl-laranja"
          aria-hidden
        />
        <p className="text-white text-[12px] font-semibold uppercase tracking-wider">
          {grupoLabel}
        </p>
      </div>
      <table className="w-full text-[13px] num">
        <thead>
          <tr className="bg-[color-mix(in_srgb,var(--color-brand-text)_8%,transparent)] text-cl-cinza-texto text-[10px] uppercase tracking-wider border-b border-border">
            <th className="px-2 h-7 text-left font-medium w-6">#</th>
            <th className="px-1 h-7 text-left font-medium">Seleção</th>
            <th className="px-1.5 h-7 text-center font-medium w-7">J</th>
            <th className="px-1.5 h-7 text-center font-medium w-7">V</th>
            <th className="px-1.5 h-7 text-center font-medium w-7">E</th>
            <th className="px-1.5 h-7 text-center font-medium w-7">D</th>
            <th className="px-1.5 h-7 text-center font-medium w-8">SG</th>
            <th className="px-2 h-7 text-center font-semibold w-9 text-cl-verde-escuro">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => {
            const classificado = i < 2;
            const zebra = i % 2 === 1;
            return (
              <tr
                key={l.selecao}
                className={`${zebra ? "bg-[color-mix(in_srgb,var(--color-brand-text)_6%,transparent)]" : "bg-transparent"} border-t border-border/50 h-10 ${
                  classificado ? "border-l-2 border-l-cl-verde" : ""
                }`}
              >
                <td className="px-2 text-cl-cinza-texto font-medium">{i + 1}</td>
                <td className="px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Bandeira cc={l.cc} emoji={l.bandeira} alt={l.selecao} tamanho={18} />
                    <span className="truncate text-cl-verde-escuro">{l.selecao}</span>
                  </div>
                </td>
                <td className="px-1.5 text-center text-cl-cinza-texto">{l.j}</td>
                <td className="px-1.5 text-center text-cl-cinza-texto">{l.v}</td>
                <td className="px-1.5 text-center text-cl-cinza-texto">{l.e}</td>
                <td className="px-1.5 text-center text-cl-cinza-texto">{l.d}</td>
                <td className="px-1.5 text-center text-cl-cinza-texto">
                  {l.sg > 0 ? `+${l.sg}` : l.sg}
                </td>
                <td className="px-2 text-center font-bold text-cl-verde-escuro">
                  {l.pts}
                </td>
              </tr>
            );
          })}
          {linhas.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-4 text-center text-xs text-cl-cinza-texto">
                Sem dados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function HeaderClassificacao({ titulo = "Classificação" }: { titulo?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="secao-titulo">{titulo}</p>
    </div>
  );
}
