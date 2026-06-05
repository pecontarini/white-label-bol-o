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
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(1200px 600px at 20% 10%, color-mix(in oklab, var(--color-brand-primary) 25%, transparent), transparent 60%), radial-gradient(900px 500px at 90% 90%, color-mix(in oklab, var(--color-brand-accent) 20%, transparent), transparent 60%), var(--color-brand-bg)",
        color: "var(--color-brand-text)",
        fontFamily: "var(--brand-font)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        className="blob"
        aria-hidden
        style={{
          width: 480,
          height: 480,
          top: -120,
          left: -120,
          background: "var(--color-brand-primary)",
        }}
      />
      <div
        className="blob"
        aria-hidden
        style={{
          width: 520,
          height: 520,
          bottom: -160,
          right: -140,
          background: "var(--color-brand-accent)",
          animationDelay: "-4s",
        }}
      />

      <section
        className="glass"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          width: "100%",
          textAlign: "center",
          padding: "3rem 2rem",
        }}
      >
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
          <button className="cta" style={{ fontFamily: "inherit" }}>
            Entrar no bolão
          </button>
        </div>

        <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
          {status === "neutro"
            ? "Tema neutro (nenhuma empresa identificada)"
            : "Tenant: " + (tenant?.slug ?? "")}
        </div>
      </section>
    </main>
  );
}

export const Route = createFileRoute("/")({ component: Home });
