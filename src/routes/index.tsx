import { createFileRoute } from "@tanstack/react-router";
import { useTenant } from "@/store/tenant";

function Home() {
  const { tenant, status } = useTenant();
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
