import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/store/tenant";

/* ===================================================================
   HeaderCliente — Palpite na Mesa (portado do Caju).
   Marca DINÂMICA por tenant: logo e nome vêm de useTenant()
   (branding.logo_url + nome_exibicao). Sem assets fixos do Caju.
   =================================================================== */

const navItens = [
  { to: "/", label: "Início" },
  { to: "/jogar", label: "Palpitar e meus palpites" },
] as const;

export function HeaderCliente() {
  const [open, setOpen] = useState(false);
  const tenant = useTenant((s) => s.tenant);
  const nome = tenant?.nome_exibicao ?? tenant?.branding?.nome_exibicao ?? "Palpite na Mesa";
  const logo = tenant?.branding?.logo_url;

  return (
    <header className="sticky top-0 z-30 glass-sticky">
      <div
        className="mx-auto max-w-[480px] flex items-center justify-between px-4"
        style={{ height: 56 }}
      >
        <Link to="/" className="flex items-center gap-2 min-w-0">
          {logo ? (
            <img
              src={logo}
              alt={nome}
              className="h-9 w-auto max-w-[200px] object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="font-display text-lg font-bold text-cl-verde-escuro truncate">
              {nome}
            </span>
          )}
          <span className="sr-only">{nome}</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menu"
              className="text-cl-verde-escuro min-h-11 min-w-11"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="border-none w-[78%]"
            style={{
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--color-brand-bg, #0A2417) 85%, var(--color-brand-secondary, #123A28)), var(--color-brand-bg, #0A2417))",
              color: "var(--color-brand-text, #fff)",
            }}
          >
            <SheetHeader>
              <SheetTitle className="font-display text-2xl" style={{ color: "var(--color-brand-text, #fff)" }}>
                {nome}
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1 px-2">
              {navItens.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="py-3.5 px-3 rounded-lg text-base min-h-11 flex items-center transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand-text)_12%,transparent)]"
                  activeProps={{ className: "bg-[color-mix(in_srgb,var(--color-brand-text)_18%,transparent)] font-semibold" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="absolute bottom-6 left-6 right-6 text-xs" style={{ color: "color-mix(in srgb, var(--color-brand-text) 70%, transparent)" }}>
              {nome} • Copa do Mundo FIFA 2026
            </p>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
