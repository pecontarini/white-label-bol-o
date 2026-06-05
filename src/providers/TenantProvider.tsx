import { useEffect } from "react";
import type { ReactNode } from "react";
import { resolveTenant } from "@/lib/tenant";
import { applyBranding } from "@/lib/branding";
import { useTenant } from "@/store/tenant";

export function TenantProvider({ children }: { children: ReactNode }) {
  const { status, setTenant, setStatus } = useTenant();

  useEffect(() => {
    (async () => {
      const t = await resolveTenant();
      setTenant(t);
      applyBranding(t);
      setStatus(t ? "ready" : "neutro");
    })();
  }, [setTenant, setStatus]);

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Carregando...
      </div>
    );
  }

  return <>{children}</>;
}