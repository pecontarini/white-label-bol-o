import type { Tenant, Branding } from "./tenant";

const NEUTRO = {
  nome_exibicao: "Palpite na Mesa",
  cores: {
    primaria: "#6366F1",
    secundaria: "#0EA5E9",
    fundo: "#0B1120",
    texto: "#E2E8F0",
    acento: "#10B981",
  },
  fonte: "Inter, system-ui, sans-serif",
};

export function applyBranding(tenant: Tenant | null) {
  const b: Branding = tenant?.branding ?? {};
  const cores = { ...NEUTRO.cores, ...(b.cores ?? {}) } as Record<string, string>;
  const root = document.documentElement;
  root.style.setProperty("--color-brand-primary", cores.primaria!);
  root.style.setProperty("--color-brand-secondary", cores.secundaria!);
  root.style.setProperty("--color-brand-bg", cores.fundo!);
  root.style.setProperty("--color-brand-text", cores.texto!);
  root.style.setProperty("--color-brand-accent", cores.acento ?? NEUTRO.cores.acento);
  root.style.setProperty("--brand-font", b.fonte ?? NEUTRO.fonte);
  document.title = tenant?.nome_exibicao ?? NEUTRO.nome_exibicao;
}