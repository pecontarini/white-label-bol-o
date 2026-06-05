import { create } from "zustand";
import type { Tenant } from "@/lib/tenant";

interface TenantState {
  tenant: Tenant | null;
  status: "loading" | "ready" | "neutro";
  setTenant: (t: Tenant | null) => void;
  setStatus: (s: TenantState["status"]) => void;
}
export const useTenant = create<TenantState>((set) => ({
  tenant: null,
  status: "loading",
  setTenant: (tenant) => set({ tenant }),
  setStatus: (status) => set({ status }),
}));