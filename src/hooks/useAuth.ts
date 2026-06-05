import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  session: Session | null;
  user: User | null;
  role: string | null;
  tenantId: string | null;
  loading: boolean;
}

function derive(session: Session | null): Omit<AuthState, "loading"> {
  const user = session?.user ?? null;
  const meta = (user?.app_metadata ?? {}) as Record<string, unknown>;
  return {
    session,
    user,
    role: (meta.role as string) ?? null,
    tenantId: (meta.tenant_id as string) ?? null,
  };
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    tenantId: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({ ...derive(data.session ?? null), loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ ...derive(session), loading: false });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}