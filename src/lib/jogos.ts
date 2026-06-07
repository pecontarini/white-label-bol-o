import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

/* ===================================================================
   Camada de dados — Palpite na Mesa (portado do Caju).
   As telas consomem o tipo `Jogo` abaixo. Os dados vêm das RPCs
   do nosso backend multi-tenant: app_partidas / app_classificacao /
   app_proximo_jogo. Os jogos (torneio) são GLOBAIS; o que é por
   tenant (palpite/prêmio/branding) vem de outras RPCs já existentes.
   =================================================================== */

export type StatusJogo = "agendado" | "ao_vivo" | "encerrado";

// Fases como vêm do nosso backend (football-data).
export type Fase =
  | "GROUP_STAGE"
  | "LAST_32"
  | "LAST_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "THIRD_PLACE"
  | "FINAL";

export type Jogo = {
  id: string;
  numero_jogo: number;
  fase: Fase | string | null;
  grupo: string | null;
  grupo_label: string | null;
  rodada: number | null;
  data_hora_inicio: string;
  time_a: string;
  cc_a: string | null;
  bandeira_a: string;
  time_b: string;
  cc_b: string | null;
  bandeira_b: string;
  status: StatusJogo;
  placar_a: number | null;
  placar_b: number | null;
};

export type LinhaClassificacao = {
  grupo: string;
  grupo_label: string;
  posicao: number;
  selecao: string;
  cc: string | null;
  bandeira: string;
  j: number; v: number; e: number; d: number;
  gp: number; gc: number; sg: number; pts: number;
};

export type ProximoJogo = {
  id: string;
  fase: string | null;
  grupo_label: string | null;
  data_hora_inicio: string;
  time_a: string; cc_a: string | null; bandeira_a: string;
  time_b: string; cc_b: string | null; bandeira_b: string;
};

/* --------------------------- Fetchers --------------------------- */

export async function buscarPartidas(): Promise<Jogo[]> {
  const { data, error } = await supabase.rpc("app_partidas");
  if (error) throw error;
  return (data ?? []) as Jogo[];
}

export async function buscarProximoJogo(): Promise<ProximoJogo | null> {
  const { data, error } = await supabase.rpc("app_proximo_jogo");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ProximoJogo) ?? null;
}

export async function buscarClassificacao(): Promise<LinhaClassificacao[]> {
  const { data, error } = await supabase.rpc("app_classificacao");
  if (error) throw error;
  return (data ?? []) as LinhaClassificacao[];
}

/* --------------------------- Helpers ---------------------------- */

export const FASE_LABEL: Record<string, string> = {
  GROUP_STAGE: "Fase de grupos",
  LAST_32: "16-avos de final",
  LAST_16: "Oitavas de final",
  QUARTER_FINALS: "Quartas de final",
  SEMI_FINALS: "Semifinal",
  THIRD_PLACE: "Disputa de 3º lugar",
  FINAL: "Final",
};

export const faseLabel = (f: string | null | undefined) =>
  (f && FASE_LABEL[f]) || f || "";

export const formatarDataJogo = (iso: string) =>
  format(new Date(iso), "EEE, dd 'de' MMM • HH'h'mm", { locale: ptBR }).replace(
    /^./,
    (c) => c.toUpperCase(),
  );

export const formatarDiaCurto = (iso: string) =>
  format(new Date(iso), "dd/MM • HH'h'mm", { locale: ptBR });