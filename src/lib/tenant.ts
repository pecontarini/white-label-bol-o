import { supabase } from "@/integrations/supabase/client";

export interface Branding {
  nome_exibicao?: string;
  cores?: { primaria?: string; secundaria?: string; fundo?: string; texto?: string; acento?: string };
  logo_url?: string;
  fonte?: string;
  textos?: Record<string, string>;
}
export interface Tenant {
  id: string;
  slug: string;
  nome_empresa: string;
  nome_exibicao: string;
  branding: Branding;
  ativo: boolean;
  geofence?: { ativo?: boolean; lat?: number; lng?: number; raio_m?: number } | null;
}

const PLATFORM_ROOT = "palpitenamesa.com.br"; // domínio raiz real da plataforma
const PREVIEW_SUFFIXES = [".lovable.app", ".lovableproject.com", ".netlify.app"];

function deriveSlug(host: string): string | null {
  const override = new URLSearchParams(window.location.search).get("tenant");
  if (override) return override;

  if (host === "localhost" || host === "127.0.0.1") return null;

  if (PREVIEW_SUFFIXES.some((s) => host.endsWith(s))) return null;

  if (host !== PLATFORM_ROOT && !host.endsWith("." + PLATFORM_ROOT)) return null;

  if (host === PLATFORM_ROOT || host === "www." + PLATFORM_ROOT) return null;

  const label = host.slice(0, host.length - PLATFORM_ROOT.length - 1).split(".")[0];

  return label === "app" ? null : (label || null);
}

export async function resolveTenant(): Promise<Tenant | null> {
  const host = window.location.hostname;
  const { data, error } = await supabase.rpc("app_resolver_tenant", {
    p_host: host,
    p_slug: deriveSlug(host),
  });
  if (error) {
    console.error("resolveTenant", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as Tenant) ?? null;
}