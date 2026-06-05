
## Observação importante

Na mensagem há dois placeholders "[cole aqui o CSS]" e "[cole o trecho]" que não vieram preenchidos. Vou seguir com valores sensatos consistentes com o que já existe no projeto (tokens já presentes em `src/styles.css`: `--color-brand-primary/secondary/bg/text` e `--brand-font`, e o NEUTRO já definido em `src/lib/branding.ts`). Se você tiver o CSS exato que queria colar, me envie e eu substituo na hora — caso contrário implemento com a proposta abaixo.

## O que vou alterar

Tudo frontend. Nenhum toque em Supabase, schema ou Lovable Cloud. Branding continua 100% vindo do tenant via variáveis CSS já aplicadas por `applyBranding()`.

### 1) `src/styles.css` — tokens de glass + utilitários

Adicionar dentro do bloco `@theme` existente (não recriar):
- `--glass-bg: color-mix(in oklab, white 10%, transparent);`
- `--glass-bg-strong: color-mix(in oklab, white 18%, transparent);`
- `--glass-border: color-mix(in oklab, white 22%, transparent);`
- `--glass-blur: 24px;`
- `--glass-saturate: 140%;`
- `--glass-shadow: 0 10px 40px -10px color-mix(in oklab, black 60%, transparent);`
- `--glow-primary: 0 0 40px color-mix(in oklab, var(--color-brand-primary) 55%, transparent);`

Adicionar em `:root` um segundo blob neutro (verde-esmeralda) parametrizado para combinar com o brand:
- `--color-brand-accent: #10B981;` (fallback neutro; pode ser sobrescrito por `branding.cores.acento` no futuro — sem quebrar nada hoje)

Novas classes (fora de `@theme`, no nível de regra normal, NÃO usar `-webkit-backdrop-filter` manualmente — respeitando o gotcha do Tailwind v4):

```css
.glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  box-shadow: var(--glass-shadow);
  border-radius: 1rem;
}
.glass-strong { background: var(--glass-bg-strong); }

.cta {
  background: linear-gradient(135deg,
    var(--color-brand-primary),
    color-mix(in oklab, var(--color-brand-primary) 70%, var(--color-brand-accent)));
  color: #fff;
  border: 1px solid color-mix(in oklab, white 25%, transparent);
  box-shadow: var(--glow-primary), 0 8px 24px -8px color-mix(in oklab, black 50%, transparent);
  padding: 0.85rem 1.75rem;
  border-radius: 999px;
  font-weight: 600;
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
}
.cta:hover { transform: translateY(-2px); filter: brightness(1.05); }
.cta:active { transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  .cta { transition: none; }
  .cta:hover { transform: none; }
  .blob { animation: none !important; }
}
```

### 2) `src/lib/branding.ts` — NEUTRO Palpite na Mesa

Atualizar o objeto `NEUTRO` mantendo a forma atual. Proposta (paleta dark premium, alinhada com o que já está lá):
- `primaria: "#6366F1"` (indigo)
- `secundaria: "#0EA5E9"` (sky)
- `fundo: "#0B1120"` (mantém)
- `texto: "#E2E8F0"` (mantém)
- `fonte: "Inter, system-ui, sans-serif"` (mantém)

E aplicar também `--color-brand-accent` em `applyBranding()` lendo de `branding.cores.acento` com fallback `#10B981`, para o blob/CTA não ficar engessado.

### 3) `src/routes/index.tsx` — home com glass + blobs

Refazer o JSX sem nenhuma cor hardcoded:
- Container `<main>` com `position: relative; overflow: hidden;` e fundo:
  `background: radial-gradient(1200px 600px at 20% 10%, color-mix(in oklab, var(--color-brand-primary) 25%, transparent), transparent 60%), radial-gradient(900px 500px at 90% 90%, color-mix(in oklab, var(--color-brand-accent) 20%, transparent), transparent 60%), var(--color-brand-bg);`
- Dois `<div className="blob" />` absolutos atrás do conteúdo (`z-index:-1`, `filter: blur(80px)`, opacidade ~0.6), um com `background: var(--color-brand-primary)` no topo-esquerda e outro com `background: var(--color-brand-accent)` no canto inferior-direito. Animação suave (translate/scale 8s ease-in-out infinite alternate) — desligada por `prefers-reduced-motion`.
- Conteúdo central virando um `<section className="glass">` com padding generoso, contendo logo/nome, título "Copa do Mundo FIFA 2026", subtítulo do branding e o botão "Entrar no bolão" com `className="cta"`.
- Rodapé de status (`tema neutro` / `Tenant: slug`) mantido, com `opacity .6`.

Sem `bg-*` fixos, sem `text-white` etc. — só variáveis `--color-brand-*` e as classes `.glass` / `.cta`.

### 4) Acessibilidade / motion

- Todo movimento (blobs + hover do CTA) sob `@media (prefers-reduced-motion: reduce)` → desliga animação e transform.
- `backdrop-filter` apenas via classe `.glass` (sem prefix manual — Lightning CSS prefixa).

## Fora de escopo

- Nada de backend, RLS, schema, edge functions, Lovable Cloud.
- Não toco em `/login`, `/admin`, `TenantProvider`, store, ou client Supabase.

## Pergunta opcional antes de implementar

Quer que eu use exatamente o CSS/paleta que você ia colar? Se sim, cole aqui e eu ajusto os valores antes de aplicar. Senão, sigo com a proposta acima.
