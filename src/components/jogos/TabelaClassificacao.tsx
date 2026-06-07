import { Bandeira } from "./Bandeira";
import type { LinhaClassificacao } from "@/lib/jogos";

type Props = {
  grupoLabel: string;
  linhas: LinhaClassificacao[];
  className?: string;
};

export function TabelaClassificacao({ grupoLabel, linhas, className = "" }: Props) {
  return (
    <div className={`glass-data rounded-2xl overflow-hidden ${className}`}>
      <div className="px-3 py-2 border-b border-black/5">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cl-verde-escuro)]">
          {grupoLabel}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase text-[var(--cl-cinza-texto)]">
            <th className="py-2 px-2 text-left">#</th>
            <th className="py-2 px-2 text-left">Seleção</th>
            <th className="py-2 px-1 text-center">J</th>
            <th className="py-2 px-1 text-center">V</th>
            <th className="py-2 px-1 text-center">E</th>
            <th className="py-2 px-1 text-center">D</th>
            <th className="py-2 px-1 text-center">SG</th>
            <th className="py-2 px-2 text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => {
            const classificado = i < 2;
            const zebra = i % 2 === 1;
            return (
              <tr
                key={`${l.selecao}-${i}`}
                className={`${zebra ? "bg-black/[0.02]" : ""} ${
                  classificado ? "font-semibold" : ""
                }`}
              >
                <td className="py-2 px-2 num text-[var(--cl-cinza-texto)]">{i + 1}</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Bandeira cc={l.cc} emoji={l.bandeira} alt={l.selecao} tamanho={18} />
                    <span className="truncate text-[var(--cl-verde-escuro)]">{l.selecao}</span>
                  </div>
                </td>
                <td className="py-2 px-1 text-center num">{l.j}</td>
                <td className="py-2 px-1 text-center num">{l.v}</td>
                <td className="py-2 px-1 text-center num">{l.e}</td>
                <td className="py-2 px-1 text-center num">{l.d}</td>
                <td className="py-2 px-1 text-center num">
                  {l.sg > 0 ? `+${l.sg}` : l.sg}
                </td>
                <td className="py-2 px-2 text-center num font-semibold text-[var(--cl-verde-escuro)]">
                  {l.pts}
                </td>
              </tr>
            );
          })}
          {linhas.length === 0 && (
            <tr>
              <td colSpan={8} className="py-4 text-center text-[var(--cl-cinza-texto)]">
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
    <div className="px-1">
      <h2 className="secao-titulo">{titulo}</h2>
    </div>
  );
}