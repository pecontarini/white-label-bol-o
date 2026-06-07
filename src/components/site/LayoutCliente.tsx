import type { ReactNode } from "react";
import { HeaderCliente } from "./HeaderCliente";
import { useTenant } from "@/store/tenant";

export function LayoutCliente({ children }: { children: ReactNode }) {
  const tenant = useTenant((s) => s.tenant);
  const nome =
    tenant?.nome_exibicao ?? tenant?.branding?.nome_exibicao ?? "Palpite na Mesa";

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderCliente />
      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-4">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-[480px] px-4 py-6 safe-bottom">
        <p className="text-center text-xs text-[var(--cl-cinza-texto)]">
          {nome} · Dados:{" "}
          <a
            href="https://www.football-data.org/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            football-data.org
          </a>
        </p>
      </footer>
    </div>
  );
}