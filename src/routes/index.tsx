import { createFileRoute } from "@tanstack/react-router";
import { useTenant } from "@/store/tenant";

function Home() {
  const { tenant, status } = useTenant();
  const nome = tenant?.nome_exibicao ?? "Palpite na Mesa";
  const subtitulo =
    tenant?.branding?.textos?.subtitulo ?? "Faça seu palpite e concorra a prêmios.";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--color-brand-bg)",
        color: "var(--color-brand-text)",
        fontFamily: "var(--brand-font)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: 640, width: "100%", textAlign: "center" }}>
        {tenant?.branding?.logo_url ? (
          <img
            src={tenant.branding.logo_url}
            alt={nome}
            style={{ maxHeight: 96, margin: "0 auto 1.5rem" }}
          />
        ) : (
          <h1 style={{ fontSize: "2.25rem", fontWeight: 700, marginBottom: "1rem" }}>
            {nome}
          </h1>
        )}

        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Copa do Mundo FIFA 2026
          </h2>
          <p style={{ opacity: 0.85, marginBottom: "1.5rem" }}>{subtitulo}</p>
          <button
            style={{
              background: "var(--color-brand-primary)",
              color: "#fff",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Entrar no bolão
          </button>
        </div>

        <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
          {status === "neutro"
            ? "Tema neutro (nenhuma empresa identificada)"
            : "Tenant: " + (tenant?.slug ?? "")}
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/")({ component: Home });
