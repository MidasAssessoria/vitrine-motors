# Design Spec — VitrineMOTORS Stitch Sandbox Redesign

**Data:** 2026-04-07
**Escopo:** B — Quick Wins + Search Hero
**Abordagem:** Projeto sandbox isolado — sem tocar no VitrineMOTORS original

---

## Objetivo

Criar um projeto React standalone (`vitrinemotors-stitch/`) que reimagina o frontend da Home page do VitrineMOTORS usando o pipeline Stitch (design-md → enhance-prompt → generate → stitch-ui). O resultado é uma versão visual comparável ao original rodando em paralelo, sem risco ao código de produção.

---

## Estrutura do Sandbox

```
vitrinemotors-stitch/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── SearchHero.tsx      ← componente principal (Escopo B)
│   │   ├── ListingCard.tsx
│   │   ├── HowItWorks.tsx
│   │   └── CTASection.tsx
│   ├── App.tsx                 ← Home montada com os novos componentes
│   ├── index.css               ← Tailwind + tokens copiados do projeto original
│   └── main.tsx
├── .stitch/
│   ├── DESIGN.md               ← DNA extraído do VitrineMOTORS via /design-md
│   ├── metadata.json           ← projectId + screenIds persistidos
│   └── designs/
│       ├── header/
│       ├── search-hero/
│       ├── listing-card/
│       ├── how-it-works/
│       └── cta-section/
├── public/
│   └── logo.png                ← copiado do projeto original
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Stack do Sandbox

- Vite + React 19 + TypeScript
- TailwindCSS 4
- Mesmos tokens de design do VitrineMOTORS (copiados de `src/index.css`)
- Mesmas fontes: Oswald (font-heading) + DM Sans (font-body)
- Dados mockados — sem Supabase, sem auth, sem Zustand
- Porta: `5174` (para rodar lado a lado com o original em `5173`)

---

## Pipeline de Execução

### Fase 1 — Setup e Design DNA

**1.1** Criar o projeto sandbox com Vite:
```bash
npm create vite@latest vitrinemotors-stitch -- --template react-ts
```

**1.2** Configurar Tailwind 4 e copiar tokens CSS do original (`src/index.css` → tokens de cor, sombras, animações)

**1.3** Rodar `/design-md`:
- Analisar o design system do código existente (não via Stitch — extrair dos arquivos `.tsx` e `index.css`)
- Produzir `.stitch/DESIGN.md` com paleta completa, tipografia, radius, componentes
- Criar `.stitch/metadata.json` com `projectId: null` (projeto Stitch será criado no passo seguinte)

### Fase 2 — Geração no Stitch (por componente)

Para cada componente, o ciclo é:

```
/enhance-prompt → generate_screen_from_text → get_screen_image (revisar) → get_screen_code → /stitch-ui implementa
```

**Ordem de implementação:**

| # | Componente | Problema atual | Melhoria |
|---|-----------|---------------|----------|
| 1 | `Header` | Logo `h-24` transborda `h-16`; gradiente fraco | Logo `h-8` + fundo branco + borda laranja ativa |
| 2 | `SearchHero` | 4 selects em grid; sem headline | Barra unificada + "Encontrá tu próximo vehículo" + contador |
| 3 | `ListingCard` | Preço no body text | Preço sobreposto na imagem (bottom overlay) |
| 4 | `HowItWorks` | Cards soltos, sem conexão visual | Círculos numerados com linha conectora laranja |
| 5 | `CTASection` | Cores hardcoded `#0F172A`; sem social proof | Tokens CSS + stats (vendedores, anúncios, rating) |

### Fase 3 — Montagem e Comparação

**3.1** Montar `App.tsx` com todos os componentes redesenhados + dados mockados (listings fictícios de carros paraguaios)

**3.2** Rodar sandbox em `localhost:5174`

**3.3** Comparar lado a lado com o original em `localhost:5173`

---

## Componentes — Spec de Design

### Header

**Atual:** `h-24` logo em container `h-16`, gradiente `FAF9F7→white→FDF8F3`
**Novo:**
- `h-16` container, logo `h-8` (32px) — sem overflow
- Fundo branco puro `#ffffff` + `box-shadow: 0 2px 20px rgba(0,0,0,0.06)`
- Borda inferior `2px solid #f97316` (sempre visível, não só no active)
- Nav links com underline laranja no estado ativo (`border-bottom: 2px solid #f97316`)
- Botão "Publicar" mantém `rounded-full bg-primary` com `shadow: 0 4px 12px rgba(249,115,22,0.3)`

### SearchHero (componente principal do Escopo B)

**Atual:** card flutuante com `-mt-10`, 4 selects em 2-column grid, sem contexto
**Novo:**
- Headline acima dos tabs: `"Encontrá tu próximo vehículo en Paraguay"` — `font-heading font-black`
- Tabs Autos/Motos/Barcos com estilo `bg-black text-white` (ativo) vs `bg-bg-secondary` (inativo)
- Barra de busca unificada: 1 container `rounded-full border-2` com 3 seções internas divididas por separadores verticais: **Marca** | **Condición** | **Precio hasta**
- Botão "Buscar →" inline no lado direito da barra, não em linha separada
- Contador abaixo: `"847 vehículos disponibles ahora"` — `text-primary font-bold`

### ListingCard

**Atual:** preço em `text-lg font-bold text-primary` no body, separado da imagem
**Novo:**
- Preço movido para overlay da imagem: `absolute bottom-10 left-12` sobre gradiente escuro
- Estilo: `text-white text-xl font-black` com `text-shadow`
- Gradiente da imagem ampliado: `h-3/5` (era `h-2/5`) para dar mais espaço ao preço
- Body reduzido: título + specs chips + dealer/whatsapp (sem linha do preço)
- Dealer avatar: iniciais em círculo colorido (quando sem logo)

### HowItWorks

**Atual:** 3 cards independentes com ícone + número em texto pequeno
**Novo:**
- Layout flex com linha conectora: `::before` pseudo-elemento laranja (`opacity-30`) ligando os 3 círculos
- Círculos numerados: `w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark` com número
- `box-shadow: 0 4px 14px rgba(249,115,22,0.35)`
- Textos mais curtos e diretos: "Publicá gratis.", "Gestioná leads.", "Cerrá sin comisión."

### CTASection

**Atual:** `bg-gradient-to-r from-[#0F172A]/90` hardcoded; sem métricas
**Novo:**
- Trocar hardcoded por `from-accent/90` (token `#1E3A5F`)
- Adicionar faixa de stats antes dos botões:
  - `2.4k vendedores` | `850+ anúncios` | `4.8★ avaliação`
  - Separados por divisores `bg-white/10`
- Eyebrow pill: `bg-primary/15 border border-primary/30 text-primary` com texto "Vendé con nosotros"
- Headline: `"Publicá gratis. Vendé más rápido."` (mais direto)

---

## Dados Mockados

O sandbox usa dados estáticos — sem backend. Criar em `src/data/mockListings.ts`:

```typescript
// 8 listings fictícios de veículos paraguaios
// com fotos de placeholder (picsum.photos ou unsplash)
// preços em USD, cidades paraguaias (Asunción, Ciudad del Este, etc.)
```

---

## Critérios de Sucesso

- [ ] Sandbox roda em `localhost:5174` sem erros
- [ ] Design system idêntico ao original (mesmas cores, fontes, tokens)
- [ ] Header sem overflow do logo
- [ ] SearchHero com barra unificada e headline
- [ ] ListingCard com preço na imagem
- [ ] HowItWorks com linha conectora
- [ ] CTASection sem cores hardcoded
- [ ] Visual comparável lado a lado com o original

---

## Fora do Escopo

- Supabase / auth / Zustand — sandbox usa dados mockados
- Páginas além da Home — apenas `App.tsx` com os 5 componentes
- Integração de volta ao VitrineMOTORS — decisão pós-aprovação visual
- Testes — sandbox é protótipo visual, não produção
