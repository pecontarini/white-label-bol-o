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

const navItens = [
  { to: "/", label: "Início" },
  { to: "/meus-palpites", label: "Meus palpites" },
] as const;

export function HeaderCliente() {
  const [open, setOpen] = useState(false);
  const tenant = useTenant((s) => s.tenant);
  const nome =
    tenant?.nome_exibicao ?? tenant?.branding?.nome_exibicao ?? "Palpite na Mesa";
  const logo = tenant?.branding?.logo_url;

  return (
    <header className="glass-sticky sticky top-0 z-40 safe-top">
      <div className="mx-auto max-w-[480px] flex items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          {logo ? (
            <img
              src={logo}
              alt={nome}
              className="h-8 w-8 rounded-md object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="font-display text-base font-bold text-[var(--cl-verde)]">
              {nome}
            </span>
          )}
          <span className="truncate font-display text-base font-semibold text-[var(--cl-verde-escuro)]">
            {nome}
          </span>
        </Link>

        <div className="ml-auto">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-dark border-0 text-white">
              <SheetHeader>
                <SheetTitle className="text-white">{nome}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col">
                {navItens.map((item) => (
                  <a
                    key={item.to}
                    href={item.to}
                    onClick={() => setOpen(false)}
                    className="py-3.5 px-3 rounded-lg text-base min-h-11 flex items-center hover:bg-white/10 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-8 text-xs text-white/60 px-3">
                {nome} • Copa do Mundo FIFA 2026
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}