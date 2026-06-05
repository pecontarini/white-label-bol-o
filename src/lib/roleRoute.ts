export function pathForRole(role: string | null, hasSession: boolean): "/login" | "/admin" | "/painel" {
  if (!hasSession || !role) return "/login";
  if (role === "super_admin") return "/admin";
  if (role === "tenant_admin") return "/painel";
  return "/login";
}