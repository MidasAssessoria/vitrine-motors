# VitrineMOTORS — Claude Code Context

Marketplace de veículos (autos, motos, barcos) focado no Paraguai.
Monetização: assinaturas Free/Silver/Gold/Platinum + boost avulso via Stripe.

## Stack
React 19 · TypeScript · Vite 8 · TailwindCSS 4 · Zustand · Supabase · Stripe · Framer Motion · Vitest

## Comandos essenciais
```bash
npm run dev        # Servidor local → http://localhost:5173
npm run test       # Vitest (run único)
npm run test:watch # Vitest em watch
npm run build      # tsc + vite build
npm run lint       # ESLint
```

## Arquitetura — 4 áreas

| Área | Rotas | Arquivo principal | Auth? |
|---|---|---|---|
| Site público | `/`, `/listings`, `/vehicles/:id`, `/profile/:id` | `src/pages/` | Não |
| Painel vendedor | `/panel/*` | `src/pages/dashboard/` | Sim (seller) |
| Painel dealer | `/dealer/*` | `src/pages/dealer/` | Sim (dealer_owner \| dealer_member) |
| Painel admin | `/admin/*` | `src/pages/admin/` | Sim (admin) |

> **Rotas protegidas**: `/panel`, `/dealer`, `/admin` redirecionam para `/login` sem sessão ativa. Para auditar com `/polish` ou `/a11y`, faça login primeiro no preview.

## Estado global (Zustand stores)
- `src/stores/authStore.ts` — autenticação, perfil, roles, bootNotifications
- `src/stores/listingsStore.ts` — anúncios, sort, tier weight
- `src/stores/notificationStore.ts` — notificações in-app realtime
- `src/stores/impersonationStore.ts` — admin impersonando dealer

## Identidade e permissões
Fonte de verdade: `src/lib/userIdentity.ts` → `getUserContext()` + `canX()`
Specs: `src/lib/__tests__/userIdentity.spec.ts` (53 specs)

Roles no banco: `profiles.role = 'buyer' | 'seller' | 'admin'`
O role `seller` cobre 3 contextos resolvidos em runtime:
- `individual_seller` — seller sem dealership
- `dealer_owner` — seller com `dealerships.owner_id = profile.id`
- `dealer_member` — seller em `dealer_members.user_id = profile.id`

## Modelo de dados crítico
- `listings.seller_id` → quem publicou
- `listings.dealership_id` → NULL = pessoa física
- `leads.dealer_id` → NULL = lead de vendedor individual
- Plano ativo: `subscriptions` tabela, relacionado via `profiles.id`

## Convenções de desenvolvimento

### SDD — Spec Driven Development
**Escreva o spec antes da implementação.** Sem exceção.
- Specs em `src/**/__tests__/*.spec.ts`
- Cada `describe` = requisito de negócio
- Cada `it` = regra, em português do Brasil
- Fixtures locais: `makeLead()`, `makeProfile()`, etc. — nunca dados de seed
- Edge cases explícitos: null, vazio, valor no limiar
- Regressões prefixadas: `"Regressão: ..."`

> `/brainstorming` é a fase de design que precede o SDD: explora requisitos e aprova a abordagem antes do spec ser escrito. Fluxo: `/brainstorming` → spec `.spec.ts` → `/tdd`.

### Padrões de código
- Seletores Zustand granulares (não desestruturar o store inteiro)
- Componentes pesados: `React.memo` + `useCallback` nos handlers
- Validação Zod em schemas de formulário e dados externos
- Sanitização DOMPurify em qualquer HTML renderizado

## Design System
> Regras completas em `.claude/rules/design.md` (carregado automaticamente em `src/components/**` e `src/pages/**`)

Resumo: headings `font-heading` (Oswald), buttons `rounded-full`, cards `bg-bg-secondary`, **proibido** overlay laranja em hover, `bg-mesh-warm` em forms, cores hex hardcoded.

## Supabase — migrations pendentes
```
supabase/018_notifications.sql      — tabela de notificações
supabase/019_auto_bump.sql          — auto bump + pg_cron
supabase/020_operating_hours.sql    — horário de funcionamento
supabase/021_dealer_members.sql     — membros de concessionária
supabase/022_hero_text_fields.sql   — OBRIGATÓRIO para hero carousel
```
Edge Function pendente: `create-billing-portal`

## Skills disponíveis

Plugin [superpowers](https://github.com/obra/superpowers) instalado em `C:\Users\jhcar\OneDrive\Área de Trabalho\superpowers\` (atualizar com `git pull`).

### Auditoria do projeto
| Skill | Quando usar |
|---|---|
| `/polish <rota>` | Auditoria visual: design system, responsividade, UX |
| `/a11y <rota>` | Auditoria de acessibilidade crítica |

### Workflow de desenvolvimento
| Skill | Quando usar |
|---|---|
| `/brainstorming` | **Antes de qualquer feature** — explorar requisitos, propor abordagens, aprovar design |
| `/writing-plans` | Após design aprovado — converter spec em tarefas de 2-5 min com código exato |
| `/executing-plans` | Executar um plano existente (inline ou via subagents) |
| `/tdd` | Implementar feature ou bugfix com RED-GREEN-REFACTOR |
| `/debug` | Bug ou falha de teste — investigar root cause antes de fixar |
| `/parallel` | Feature grande com 3+ tarefas independentes (subagents orquestrados) |
| `/review` | Code review estruturado antes de merge |
| `/finishing-a-development-branch` | Checklist de conclusão de branch antes de merge |

### Fluxo recomendado para features novas
```
/brainstorming → /writing-plans → /executing-plans (usa /tdd por tarefa) → /review → /finishing-a-development-branch
```

### Skills adicionais (superpowers originais em inglês)
Disponíveis como fallback ou quando preferir o original: `/systematic-debugging`, `/test-driven-development`, `/subagent-driven-development`, `/requesting-code-review`, `/receiving-code-review`, `/using-git-worktrees`, `/writing-skills`

> Para atualizar o plugin: `cd "C:\Users\jhcar\OneDrive\Área de Trabalho\superpowers" && git pull`

## Testes e verificação
Baseline nunca pode ser quebrado. Rode `npm run test` antes de declarar qualquer task concluída.
Regra always-on em `.claude/rules/verification.md` reforça isso automaticamente — proíbe linguagem como "pronto" ou "deve funcionar" sem output colado.
