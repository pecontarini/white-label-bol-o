## Problema

Hoje a home só mostra "Próximo jogo" (o próximo jogo geral do torneio, vindo da RPC `app_proximo_jogo`). Quando o próximo jogo não é do Brasil, o jogo do Brasil fica "escondido" no meio da aba Partidas, sem destaque visual. Isso vale para todos os subdomínios, porque a fonte dos jogos é global.

## Solução

Adicionar um destaque "Próximo jogo do Brasil" na aba **Visão geral** da home (`src/routes/index.tsx`), logo abaixo do bloco "Próximo jogo" atual. E marcar visualmente os jogos do Brasil na aba **Partidas**.

Tudo no frontend, sem mexer em backend, RPCs, tenants nem ativar Lovable Cloud.

### O que muda

1. **`src/routes/index.tsx` — Visão geral**
   - Reaproveitar a query `["home", "partidas"]` (já usada na aba Partidas e Eliminatória — não cria request novo).
   - Derivar com `useMemo`: primeiro jogo com `status !== "encerrado"` onde `cc_a === "br"` ou `cc_b === "br"` (fallback por `time_a/time_b === "Brasil"`), ordenado por `data_hora_inicio`.
   - Renderizar uma nova seção `<SecaoProximoJogoBrasil />` com o mesmo visual glass do "Próximo jogo", mas com:
     - Título "Próximo jogo do Brasil" e um acento verde-amarelo discreto (borda/badge usando tokens existentes `cl-verde` + `cl-laranja`/amarelo do tema; sem cores hardcoded novas).
     - Bandeira maior do lado do Brasil + nome do adversário.
     - Data/hora formatada com `date-fns` (igual já é feito).
     - CTA "Palpitar" → `/jogar`.
   - Se a Copa terminou (todos jogos do Brasil encerrados) ou não há jogo do Brasil na base, a seção não renderiza (return null), sem placeholder vazio.

2. **`src/routes/index.tsx` — Partidas**
   - No `CardJogoAberto` da listagem, adicionar uma marcação leve (ex.: ring/border `cl-verde/40` + badge "Brasil") quando o jogo envolve o Brasil. Mudança visual mínima, mantendo o componente atual; se for invasivo, faço wrapper na própria home sem editar `CardJogoAberto.tsx`.

3. **Nada muda em**: RPCs, `src/lib/jogos.ts`, TenantProvider, branding, /admin, /painel, /cadastro, backend.

### Detecção do Brasil (frontend, robusto)

```ts
const ehBrasil = (j: Jogo) =>
  j.cc_a?.toLowerCase() === "br" ||
  j.cc_b?.toLowerCase() === "br" ||
  j.time_a === "Brasil" ||
  j.time_b === "Brasil";
```

### Resultado esperado

Em qualquer subdomínio, ao abrir a home, o usuário vê:
- Próximo jogo (geral) — como hoje.
- **Próximo jogo do Brasil** — novo destaque, sempre visível enquanto houver jogo do Brasil futuro.
- Na aba Partidas, jogos do Brasil ganham marcação visual sutil.
