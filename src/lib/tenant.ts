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
}

const PLATFORM_HOSTS = new Set(["localhost", "127.0.0.1", ""]);

function deriveSlug(host: string): string | null {
  const override = new URLSearchParams(window.location.search).get("tenant");
  if (override) return override;
  if (PLATFORM_HOSTS.has(host)) return null;
  if (host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com")) return null;
  const parts = host.split(".");
  if (parts.length >= 3 && !["www", "app"].includes(parts[0])) return parts[0];
  return null;
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