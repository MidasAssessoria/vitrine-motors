# VitrineMOTORS — Product Requirements Document (PRD)

## Visao Geral

VitrineMOTORS e o maior marketplace digital de veiculos do Paraguai. Conecta compradores e vendedores de autos, motos e barcos novos e usados, com ferramentas profissionais para concessionarias.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4.2 + Supabase (auth, DB, storage, realtime, edge functions)

---

## Roles e Permissoes

| Role | Descricao | Permissoes |
|------|-----------|------------|
| **buyer** | Comprador | Buscar, favoritar, contatar vendedores, chat |
| **seller** | Vendedor particular | Publicar (com KYC), editar proprios anuncios, pausar/retomar, CRM de leads, chat |
| **admin** | Administrador | CRUD total em anuncios, aprovar/rejeitar anuncios e documentos, gerenciar usuarios/roles, catalogo, hero, financeiro |

### Dealer (Concessionaria)
- Owner de uma `dealership` (entidade separada)
- Mesmas permissoes de seller + painel de concessionaria
- Dealership precisa ser aprovada e verificada pelo admin

---

## Workflow de Publicacao

```
Vendedor cria anuncio (4 steps: Veiculo > Fotos > Detalhes > Contato)
    |
    ├── Usuario VERIFICADO (document_verified = true)
    |       └── Status: 'active' (publicacao imediata)
    |
    └── Usuario NAO verificado
            └── Status: 'pending'
                    |
                    ├── Admin aprova → Status: 'active' (notificacao enviada)
                    └── Admin rejeita → Status: 'rejected' (notificacao enviada)
```

### Status de Anuncio

| Status | Descricao | Quem pode setar |
|--------|-----------|-----------------|
| `pending` | Aguardando aprovacao do admin | Sistema (ao criar/editar) |
| `active` | Visivel no marketplace | Admin (aprovar) ou sistema (auto-approve verificado) |
| `paused` | Oculto temporariamente | Vendedor (toggle) |
| `rejected` | Rejeitado pelo admin | Admin |
| `reserved` | Reservado (em negociacao) | Futuro |
| `sold` | Vendido | Futuro |

### Regras de Negocio - Status

1. **Somente admin pode aprovar** (mudar de pending/rejected → active)
2. Vendedor so pode alternar entre `active` ↔ `paused`
3. Trigger SQL `guard_listing_status` impede bypass no banco
4. Edicao por vendedor nao-verificado volta status para `pending`
5. Edicao por admin ou verificado mantem status atual

---

## Workflow de Verificacao (KYC)

```
Vendedor faz upload de CI frente + CI verso
    |
    └── Documentos ficam com status 'pending'
            |
            ├── Admin aprova ambos → profile.document_verified = true
            └── Admin rejeita → vendedor precisa reenviar
```

### Campos KYC no Profile
- `document_verified: boolean` — flag principal
- `birth_date`, `nationality`, `state`, `postal_code` — dados pessoais

### Tipos de Documento
- `ci_frente` — Cedula de identidad (frente)
- `ci_verso` — Cedula de identidad (verso)
- `ruc_doc` — RUC (concessionarias)

---

## Edicao de Anuncio

- Rota: `/editar/:id`
- Reutiliza o form de publicacao (`PublishListing.tsx`) em modo edicao
- Pre-popula todos os campos e fotos existentes
- Permite adicionar/remover fotos
- Vendedor nao-verificado: edicao volta anuncio para `pending`
- Admin ou verificado: edicao mantem status atual
- Acessivel via botao de editar no painel do vendedor e no admin

---

## Features Implementadas

### Core
- [x] Publicacao de veiculos (auto, moto, barco) com form de 4 steps
- [x] Edicao de anuncios existentes
- [x] Catalogo hierarquico (marca > modelo > trim) com auto-fill
- [x] Upload de ate 10 fotos por anuncio
- [x] Busca e filtros (tipo, marca, preco, ano, km, cidade, condicao)
- [x] Pagina de detalhe do veiculo
- [x] Favoritos
- [x] Comparador de veiculos

### Vendedor
- [x] Painel do vendedor com KPIs (anuncios, vistas, contactos, conversao)
- [x] CRM de leads (status flow, temperatura, notas, valor)
- [x] Pausar/retomar anuncios
- [x] Destacar anuncios (featured)
- [x] Editar anuncios

### Admin
- [x] Dashboard com metricas gerais
- [x] Aprovar/rejeitar anuncios
- [x] Editar qualquer anuncio
- [x] Gerenciar usuarios e roles
- [x] Revisar documentos KYC
- [x] Aprovar/verificar concessionarias
- [x] Gerenciar catalogo (marcas, modelos, trims)
- [x] Gerenciar hero slides
- [x] Painel financeiro
- [x] Impersonar usuario (suporte)

### Comunicacao
- [x] Chat em tempo real (Supabase Realtime)
- [x] Formulario de contato com WhatsApp
- [x] Notificacoes por email (aprovacao/rejeicao)

### Monetizacao
- [x] Planos de subscricao (Free, Silver, Gold, Platinum)
- [x] Boost packages (destaque pago)
- [x] Checkout via Stripe

### Concessionaria
- [x] Perfil de concessionaria (logo, endereco, horarios)
- [x] Dashboard proprio
- [x] Inventario
- [x] Analytics
- [x] CRM de leads
- [x] Reviews e avaliacoes

### Auth
- [x] Login/registro com roles (pessoa fisica / concessionaria)
- [x] Recuperacao de senha
- [x] Protecao de rotas por role
- [x] RLS policies no Supabase

### UX
- [x] Design system com tokens (cores, sombras, tipografia)
- [x] Animacoes Framer Motion
- [x] Skeletons de loading
- [x] Mobile-first responsive
- [x] SEO Head por pagina

---

## Estrutura de Banco (Tabelas Principais)

| Tabela | Descricao |
|--------|-----------|
| `profiles` | Usuarios (role, KYC, verificacao) |
| `listings` | Anuncios de veiculos |
| `listing_photos` | Fotos dos anuncios |
| `leads` | Contatos/leads de compradores |
| `lead_interactions` | Historico de interacoes com leads |
| `favorites` | Favoritos do usuario |
| `reviews` | Avaliacoes de vendedores/concessionarias |
| `dealerships` | Concessionarias |
| `dealer_hours` | Horarios de funcionamento |
| `brands` / `models` / `trims` | Catalogo de veiculos |
| `boost_packages` / `boost_purchases` | Sistema de destaque |
| `user_documents` | Documentos KYC |
| `hero_slides` | Slides do hero da home |
| `payment_transactions` | Transacoes financeiras |
| `analytics_events` | Eventos de analytics |
| `conversations` / `messages` | Chat em tempo real |

---

## Migrations SQL

| # | Arquivo | Descricao |
|---|---------|-----------|
| 001 | `001_rls_policies.sql` | RLS policies para todas as tabelas |
| 002 | `002_stripe_webhook_events.sql` | Tabela de eventos Stripe |
| 003 | `003_subscriptions.sql` | Sistema de subscricoes e tiers |
| 015 | `015_profiles_kyc.sql` | Campos KYC no profile |
| 016 | `016_chat.sql` | Tabelas de chat (conversations, messages) |
| 017 | `017_listing_status_guard.sql` | Trigger que impede non-admin de aprovar anuncios |
