## Objetivo
Transformar o fluxo do participante (já existente na home quando `useTenant().status === "ready"`) em um app com 4 abas (estado local, sem mudar rota), preservar 100% do landing neutro, e adicionar um campo opcional "Regulamento" no formulário do `/admin`. Sem mexer em backend, schema, RLS ou ativar Lovable Cloud.

## 1. `src/routes/index.tsx` — refator do `ParticipantFlow`

Reescrever o componente `ParticipantFlow` (e auxiliares) mantendo:
- A renderização condicional do `Home` (neutro continua igual: card landing "Palpite na Mesa").
- A identidade em `localStorage` chave `pnm:participant:${slug}` (`{ nome, telefone }`), card "Entrar no bolão" quando ausente, e link "trocar".

Adicionar:
- **Cabeçalho**: logo (`tenant.branding?.logo_url`) ou `nome_exibicao`, + botão ícone "Como funciona" (abre painel inline, normal-flow, com `branding?.textos?.regulamento` ou texto padrão fornecido).
- **Estado `aba`** via `useState<"jogos"|"meus"|"ranking"|"premios">("jogos")`.
- **Barra de abas fixa embaixo** (`position: fixed; bottom: 0`) em `.glass`, mobile-first, com 4 botões; aba ativa colorida com `var(--color-brand-primary)`. Conteúdo principal com `padding-bottom` para não ficar sob a barra.

### Aba "Jogos" (default)
- `supabase.rpc("app_jogo_ativo", { p_slug: slug })` → `jogo = data?.[0]`.
- Card `.glass`: `time_a x time_b`, data formatada com `date-fns` pt-BR, e — se `premio_nome` — linha "Em disputa: {premio_quantidade}x {premio_nome}".
- Inputs `.glass-input` numéricos + botão `.cta` "Enviar palpite" chamando `app_registrar_palpite`. Sucesso: `toast.success("Palpite registrado!")`, recarrega meus palpites + ranking. Erro: `toast.error(error.message)`.
- Se `palpites_encerrados`: inputs e botão `disabled` + selo "Palpites encerrados".
- Sem identidade: aviso para entrar no bolão.
- Sem jogo: card "Nenhum jogo ativo no momento."

### Aba "Meus palpites"
- Exige identidade; senão card pedindo para entrar primeiro.
- `app_meus_palpites(slug, telefone)`. Cada item em card `.glass`:
  - "{time_a} x {time_b}", "Meu palpite: {palpite_a} x {palpite_b}".
  - `status === "encerrado"`: "Resultado: {placar_a} x {placar_b}" + selo "Acertou" (verde) / "Não acertou" (cinza-vermelho) conforme `acertou`.
  - senão: selo "Aguardando".
- Vazio: "Você ainda não palpitou."

### Aba "Ranking"
- `app_ranking(slug)`. Lista posição, nome, "{acertos} pts", com `({palpites})` secundário. Destacar (background sutil em var(--color-brand-primary) 12%) a linha cujo `nome` bate com `ident.nome`. Sem telefone.

### Aba "Prêmios"
- `app_premios(slug)`. Se houver jogo ativo com `premio_nome`, mostrar no topo "Prêmio do jogo atual: {premio_quantidade}x {premio_nome}".
- Cards `.glass` listando `nome` de cada prêmio.
- Vazio: "Os prêmios serão divulgados em breve."

### Painel "Como funciona"
- Estado `mostrarComo: boolean`. Quando true, renderizar um card `.glass` no topo do conteúdo (normal-flow, não fixed) com o texto de regulamento e botão "Fechar".

### Carregamento de dados
- `useEffect`s por aba: carregar lazy ao trocar de aba (ou pré-carregar jogo + ranking na primeira visita). Reaproveitar callbacks `carregarJogo`, `carregarRanking`, `carregarMeus`, `carregarPremios`. Após `enviarPalpite`, chamar `carregarMeus()` + `carregarRanking()`.

## 2. `src/routes/admin.tsx` — campo "Regulamento"

- Adicionar campo `regulamento: string` em `FormState` e `EMPTY`.
- Em `fromTenant`: `regulamento: b.textos?.regulamento ?? ""`.
- Em `save()`, substituir o bloco atual `if (form.subtitulo) branding.textos = ...` por:
  ```ts
  const textos: Record<string,string> = {};
  if (form.subtitulo) textos.subtitulo = form.subtitulo;
  if (form.regulamento) textos.regulamento = form.regulamento;
  if (Object.keys(textos).length) branding.textos = textos;
  ```
- Adicionar `<Field label="Regulamento / como funciona">` com `<textarea>` usando `className={inputCls}` (`.glass-input`), após o campo "Subtítulo".

## Regras
- `p_slug` sempre = `tenant.slug`; nunca enviar `tenant_id`.
- Cores apenas via variáveis de marca (`var(--color-brand-*)`, `var(--glass-*)`).
- Mobile-first, `.glass` / `.glass-input` / `.cta` / `.btn` já existentes; respeita `prefers-reduced-motion` (sem novas animações).
- Sem mudanças no backend; sem ativar Lovable Cloud.

## Arquivos
- editar `src/routes/index.tsx`
- editar `src/routes/admin.tsx`
