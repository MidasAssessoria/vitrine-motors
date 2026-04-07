# VitrineMOTORS Stitch Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um projeto React standalone em `vitrinemotors-stitch/` que reimagina a Home page do VitrineMOTORS com 5 componentes redesenhados via pipeline Stitch, rodando em `localhost:5174` sem tocar no projeto original.

**Architecture:** Sandbox isolado — Vite + React + Tailwind 4 + dados mockados. Cada componente passa pelo ciclo: enhance-prompt → generate no Stitch → review screenshot → implementar em React. Sem routing, sem backend, sem auth.

**Tech Stack:** Vite 5, React 19, TypeScript, TailwindCSS 4, lucide-react, Google Stitch MCP

**Sandbox location:** `C:\Users\jhcar\OneDrive\Área de Trabalho\VITRINEMOTORS\vitrinemotors-stitch\`

---

## Task 1: Scaffold do projeto Vite

**Files:**
- Create: `vitrinemotors-stitch/` (novo diretório)
- Create: `vitrinemotors-stitch/vite.config.ts`
- Create: `vitrinemotors-stitch/tsconfig.json`
- Create: `vitrinemotors-stitch/tsconfig.node.json`

- [ ] **Step 1: Criar o projeto Vite com template React + TypeScript**

```bash
cd "C:\Users\jhcar\OneDrive\Área de Trabalho\VITRINEMOTORS"
npm create vite@latest vitrinemotors-stitch -- --template react-ts
cd vitrinemotors-stitch
npm install
```

Esperado: diretório `vitrinemotors-stitch/` criado com estrutura padrão Vite.

- [ ] **Step 2: Instalar dependências**

```bash
npm install tailwindcss @tailwindcss/vite lucide-react
```

- [ ] **Step 3: Substituir `vite.config.ts` com porta 5174 e Tailwind plugin**

```typescript
// vitrinemotors-stitch/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
})
```

- [ ] **Step 4: Verificar que o servidor sobe**

```bash
npm run dev
```

Esperado: `Local: http://localhost:5174/` no terminal.

---

## Task 2: Design tokens + fontes

**Files:**
- Create: `vitrinemotors-stitch/index.html`
- Create: `vitrinemotors-stitch/src/index.css`
- Delete: `vitrinemotors-stitch/src/App.css` (não vai ser usado)

- [ ] **Step 1: Criar `index.html` com Google Fonts**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VitrineMOTORS — Redesign Sandbox</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Criar `src/index.css` com tokens idênticos ao VitrineMOTORS**

```css
@import "tailwindcss";

@theme {
  /* ─── Cores principais ─── */
  --color-primary: #F97316;
  --color-primary-dark: #EA580C;
  --color-primary-light: #FFF7ED;
  --color-accent: #1E3A5F;
  --color-accent-light: #E8EEF4;
  --color-accent-red: #DC2626;
  --color-verified-blue: #2563EB;
  --color-success-green: #10B981;
  --color-whatsapp: #25D366;
  --color-warning: #F59E0B;

  /* ─── Texto ─── */
  --color-text-primary: #0F1419;
  --color-text-secondary: #536471;
  --color-text-muted: #9CA3AF;

  /* ─── Fundos ─── */
  --color-bg: #FFFFFF;
  --color-bg-secondary: #F3F4F6;
  --color-bg-elevated: #FFFFFF;
  --color-bg-hover: #F9FAFB;
  --color-bg-dark: #0F172A;

  /* ─── Bordas ─── */
  --color-border: #E5E7EB;
  --color-border-light: #F3F4F6;

  /* ─── Tipografia ─── */
  --font-heading: 'Oswald', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  /* ─── Sombras ─── */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-card-hover: 0 12px 28px rgba(249,115,22,0.08), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-float: 0 8px 30px rgba(0,0,0,0.1);
  --shadow-search: 0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
}

body {
  font-family: var(--font-body);
  color: var(--color-text-primary);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }

/* Gradient border top animado (usado no ListingCard) */
.border-top-gradient { position: relative; }
.border-top-gradient::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
  border-radius: 3px 3px 0 0;
}
.border-top-gradient:hover::before { transform: scaleX(1); }
```

- [ ] **Step 3: Atualizar `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 4: Copiar o logo do projeto original para `public/`**

```bash
cp "C:\Users\jhcar\OneDrive\Área de Trabalho\VITRINEMOTORS\vitrinemotors\public\logo.png" ".\public\logo.png"
```

---

## Task 3: Mock data

**Files:**
- Create: `vitrinemotors-stitch/src/data/mockListings.ts`

- [ ] **Step 1: Criar o arquivo de dados mockados**

```typescript
// vitrinemotors-stitch/src/data/mockListings.ts

export interface MockListing {
  id: string;
  title: string;
  price_usd: number;
  year: number;
  mileage: number;
  fuel: 'nafta' | 'diesel' | 'hibrido' | 'electrico';
  city: string;
  condition: '0km' | 'usado';
  vehicle_type: 'auto' | 'moto' | 'barco';
  photos: { url: string }[];
  tier: 'free' | 'silver' | 'gold' | 'platinum';
  featured: boolean;
  dealership?: {
    name: string;
    verified: boolean;
    logo_url?: string;
    avg_rating?: number;
  };
}

export const mockListings: MockListing[] = [
  {
    id: '1',
    title: 'Toyota Hilux SRX 2021 4x4',
    price_usd: 28500,
    year: 2021,
    mileage: 85000,
    fuel: 'diesel',
    city: 'Asunción',
    condition: 'usado',
    vehicle_type: 'auto',
    photos: [{ url: 'https://picsum.photos/seed/hilux/400/300' }],
    tier: 'gold',
    featured: true,
    dealership: { name: 'AutoCenter PY', verified: true, avg_rating: 4.8 },
  },
  {
    id: '2',
    title: 'Honda Civic EX 2022',
    price_usd: 22000,
    year: 2022,
    mileage: 32000,
    fuel: 'nafta',
    city: 'Ciudad del Este',
    condition: 'usado',
    vehicle_type: 'auto',
    photos: [{ url: 'https://picsum.photos/seed/civic/400/300' }],
    tier: 'silver',
    featured: false,
  },
  {
    id: '3',
    title: 'Mitsubishi Outlander 2023 0km',
    price_usd: 38000,
    year: 2023,
    mileage: 0,
    fuel: 'nafta',
    city: 'Asunción',
    condition: '0km',
    vehicle_type: 'auto',
    photos: [{ url: 'https://picsum.photos/seed/outlander/400/300' }],
    tier: 'gold',
    featured: true,
    dealership: { name: 'Mitsubishi PY', verified: true, avg_rating: 4.9 },
  },
  {
    id: '4',
    title: 'Ford Ranger XLT 2020',
    price_usd: 24500,
    year: 2020,
    mileage: 120000,
    fuel: 'diesel',
    city: 'Encarnación',
    condition: 'usado',
    vehicle_type: 'auto',
    photos: [{ url: 'https://picsum.photos/seed/ranger/400/300' }],
    tier: 'free',
    featured: false,
  },
  {
    id: '5',
    title: 'Volkswagen Amarok V6 2022',
    price_usd: 45000,
    year: 2022,
    mileage: 48000,
    fuel: 'diesel',
    city: 'Asunción',
    condition: 'usado',
    vehicle_type: 'auto',
    photos: [{ url: 'https://picsum.photos/seed/amarok/400/300' }],
    tier: 'platinum',
    featured: true,
    dealership: { name: 'VW Paraguay', verified: true, avg_rating: 4.7 },
  },
  {
    id: '6',
    title: 'Chevrolet S10 High Country 2021',
    price_usd: 31000,
    year: 2021,
    mileage: 67000,
    fuel: 'diesel',
    city: 'San Lorenzo',
    condition: 'usado',
    vehicle_type: 'auto',
    photos: [{ url: 'https://picsum.photos/seed/s10/400/300' }],
    tier: 'silver',
    featured: false,
  },
  {
    id: '7',
    title: 'Renault Duster 4x4 2022',
    price_usd: 19500,
    year: 2022,
    mileage: 28000,
    fuel: 'nafta',
    city: 'Luque',
    condition: 'usado',
    vehicle_type: 'auto',
    photos: [{ url: 'https://picsum.photos/seed/duster/400/300' }],
    tier: 'free',
    featured: false,
  },
  {
    id: '8',
    title: 'Toyota Corolla Cross 2023 0km',
    price_usd: 33000,
    year: 2023,
    mileage: 0,
    fuel: 'hibrido',
    city: 'Asunción',
    condition: '0km',
    vehicle_type: 'auto',
    photos: [{ url: 'https://picsum.photos/seed/cross/400/300' }],
    tier: 'gold',
    featured: true,
    dealership: { name: 'Toyota PY', verified: true, avg_rating: 5.0 },
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(km: number): string {
  if (km === 0) return '0 km';
  return new Intl.NumberFormat('es-PY').format(km) + ' km';
}

export function getFuelLabel(fuel: string): string {
  const labels: Record<string, string> = {
    nafta: 'Nafta', diesel: 'Diesel',
    hibrido: 'Híbrido', electrico: 'Eléctrico',
  };
  return labels[fuel] ?? fuel;
}
```

---

## Task 4: .stitch/DESIGN.md — Design DNA

**Files:**
- Create: `vitrinemotors-stitch/.stitch/DESIGN.md`
- Create: `vitrinemotors-stitch/.stitch/metadata.json`

- [ ] **Step 1: Criar pasta `.stitch/`**

```bash
mkdir -p .stitch/designs/header .stitch/designs/search-hero .stitch/designs/listing-card .stitch/designs/how-it-works .stitch/designs/cta-section
```

- [ ] **Step 2: Criar `.stitch/DESIGN.md`**

```markdown
# Design System — VitrineMOTORS Redesign

> Fonte da verdade para geração de telas no Stitch.
> Leia este arquivo antes de usar generate_screen_from_text.

---

## Visual Theme

Marketplace automotivo paraguaio com energia dinâmica e confiabilidade.
Laranja vibrante como acento de ação sobre base clara e limpa.
Tipografia bold e seca (Oswald) comunica performance e autoridade.

**Mood keywords:** [energético] [confiável] [latino] [premium-acessível]

---

## Color Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Clean White | #FFFFFF | Page background |
| Surface | Light Gray | #F3F4F6 | Cards, chips, inputs |
| Primary | Vibrant Orange | #F97316 | CTAs, active states, accents |
| Primary Dark | Deep Orange | #EA580C | Hover states on CTAs |
| Accent | Deep Navy | #1E3A5F | Trust elements, dark sections |
| Text Primary | Near Black | #0F1419 | Headings, body |
| Text Secondary | Slate Gray | #536471 | Captions, labels |
| Text Muted | Light Gray | #9CA3AF | Placeholders |
| Border | Soft Gray | #E5E7EB | Dividers, input borders |
| Success | Emerald | #10B981 | 0km badge, positive states |
| WhatsApp | Green | #25D366 | WhatsApp CTAs only |

**Color Discipline:**
- Orange is for action only — CTAs, active tabs, accents
- Navy (#1E3A5F) for dark backgrounds and trust signals
- Never use black (#000) — use #0F1419 for darkest text

---

## Typography

**Display / Headings:** Oswald — bold, condensed, powerful, automotive energy
**Body:** DM Sans — clean, legible, modern, airy

**Scale:**
- H1: 48px, weight 700, Oswald
- H2: 32px, weight 700, Oswald
- H3: 20px, weight 600, Oswald
- Body: 14px, weight 400, DM Sans, line-height 1.6
- Caption: 12px, weight 500, DM Sans

---

## Component Styling

### Buttons
- **Primary:** Orange (#F97316) fill, rounded-full (pill), px-5 py-2.5, shadow 0 4px 12px rgba(249,115,22,0.3), hover to #EA580C
- **Secondary/Outline:** white bg, border 1px #E5E7EB, rounded-full, hover border orange
- **WhatsApp:** #25D366 fill, rounded-full, hover opacity-90

### Cards
- Background: white
- Border: 1px solid #E5E7EB, hover border-primary/20
- Radius: rounded-2xl (16px)
- Shadow: subtle card shadow, hover: 0 12px 28px rgba(249,115,22,0.08)
- Hover: translateY(-6px)

### Inputs / Selects
- Background: #F3F4F6 (bg-secondary)
- No border in resting state
- Focus: border orange
- Radius: rounded-xl (12px) for individual, rounded-full for unified bar

### Navigation
- Sticky white header, height 64px
- Bottom border 2px orange always visible
- Logo max-height 32px
- Active nav link: orange color + bottom underline

---

## Layout Principles

- **Density:** Balanced — generous whitespace but content-rich
- **Grid:** 12-col, max-width 1280px, centered
- **Spacing base:** multiples of 4px
- **Hierarchy:** Price and CTA most prominent visually

---

## Prompt Block (copiar para generate_screen_from_text)

```
**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Light, energetic, automotive
- Background: Clean White (#FFFFFF)
- Surface: Light Gray (#F3F4F6) for cards and inputs
- Primary Accent: Vibrant Orange (#F97316) for CTAs and active states
- Primary Dark: Deep Orange (#EA580C) for hover
- Trust Accent: Deep Navy (#1E3A5F) for dark sections
- Text Primary: Near Black (#0F1419)
- Text Secondary: Slate Gray (#536471)
- Typography: Oswald (headings, bold, condensed) + DM Sans (body)
- Buttons: Pill-shaped (rounded-full), orange fill for primary
- Cards: rounded-2xl, white bg, subtle shadow, hover lift + orange border
- Border: 1px solid #E5E7EB
```
```

- [ ] **Step 3: Criar `.stitch/metadata.json`**

```json
{
  "projectId": null,
  "projectName": "vitrinemotors-redesign",
  "screens": {}
}
```

---

## Task 5: Componente Header

**Files:**
- Create: `vitrinemotors-stitch/src/components/Header.tsx`
- Create: `vitrinemotors-stitch/.stitch/designs/header/screen.html` (gerado pelo Stitch)

**Ciclo Stitch para este componente:**

- [ ] **Step 1: Gerar design no Stitch com enhanced prompt**

Usar o MCP Stitch. Se `metadata.json` tiver `projectId: null`, criar o projeto primeiro:

```
stitch: list_projects()
→ Se não existir "vitrinemotors-redesign":
  stitch: create_project({ name: "vitrinemotors-redesign" })
  → Salvar projectId em .stitch/metadata.json
```

Depois gerar a tela com o prompt abaixo:

```
stitch: generate_screen_from_text({
  projectId: "<id do projeto>",
  name: "header",
  prompt: `
    Sticky navigation header for VitrineMOTORS — Paraguay automotive marketplace.
    Height exactly 64px. Clean, professional, high-contrast.

    **DESIGN SYSTEM (REQUIRED):**
    - Platform: Web, Desktop-first
    - Theme: Light, energetic, automotive
    - Background: Clean White (#FFFFFF)
    - Primary Accent: Vibrant Orange (#F97316) for CTA and active states
    - Trust Accent: Deep Navy (#1E3A5F)
    - Text Primary: Near Black (#0F1419)
    - Typography: Oswald (headings) + DM Sans (body)
    - Buttons: Pill-shaped, orange fill for primary

    **Page Structure:**
    1. **Header bar:** white background, 2px solid orange (#F97316) bottom border, shadow 0 2px 20px rgba(0,0,0,0.06)
    2. **Left: Logo** — image placeholder 32px tall, text "VitrineMOTORS" in Oswald bold
    3. **Center: Navigation** — "Inicio" | pill group "Autos / Motos / Barcos" (active=orange pill) | "Financiar" | "Precios"
    4. **Right: Actions** — "Iniciar sesión" outline-pill button + "Publicar" orange pill button with + icon
    5. **No hamburger menu** — desktop only view
  `
})
```

- [ ] **Step 2: Baixar e revisar screenshot**

```
stitch: get_screen_image({ screenId: "<screenId do header>" })
→ Revisar visualmente — confirmar que o header está correto
stitch: get_screen_code({ screenId: "<screenId do header>" })
→ Salvar em .stitch/designs/header/screen.html
```

Atualizar `metadata.json`: `"screens": { "header": "<screenId>" }`

- [ ] **Step 3: Implementar `src/components/Header.tsx`**

```tsx
// vitrinemotors-stitch/src/components/Header.tsx
import { Plus, Car, Bike, Ship } from 'lucide-react';

const vehicleTypeTabs = [
  { label: 'Autos', icon: Car },
  { label: 'Motos', icon: Bike },
  { label: 'Barcos', icon: Ship },
];

const navLinks = ['Financiar', 'Precios'];

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 bg-white border-b-2 border-primary"
      style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="VitrineMOTORS" className="h-8 w-auto" />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <a href="#" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
            Inicio
          </a>

          {/* Vehicle tabs pill group */}
          <div className="flex items-center gap-0.5 mx-1 bg-bg-secondary/60 rounded-full p-0.5">
            {vehicleTypeTabs.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = i === 0; // Autos active by default (visual only)
              return (
                <a
                  key={tab.label}
                  href="#"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/60'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </a>
              );
            })}
          </div>

          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="hidden lg:block text-sm font-medium text-text-primary hover:text-primary border border-border hover:border-primary rounded-full px-5 py-2 transition-all"
          >
            Iniciar sesión
          </a>
          <a
            href="#"
            className="rounded-full bg-primary hover:bg-primary-dark text-white px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-all"
            style={{ boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}
          >
            <Plus size={16} />
            Publicar
          </a>
        </div>

      </div>
    </header>
  );
}
```

---

## Task 6: Componente SearchHero

**Files:**
- Create: `vitrinemotors-stitch/src/components/SearchHero.tsx`
- Create: `vitrinemotors-stitch/.stitch/designs/search-hero/screen.html`

- [ ] **Step 1: Gerar design no Stitch**

```
stitch: generate_screen_from_text({
  projectId: "<id>",
  name: "search-hero",
  prompt: `
    Hero search section for VitrineMOTORS automotive marketplace Paraguay.
    White card with rounded corners, overlapping the hero image below it.
    This is the MOST IMPORTANT conversion element on the page.

    **DESIGN SYSTEM (REQUIRED):**
    - Platform: Web, Desktop-first
    - Theme: Light, clean, conversion-focused
    - Background: Clean White (#FFFFFF) for the search card
    - Surface: Light Gray (#F3F4F6) for input sections
    - Primary Accent: Vibrant Orange (#F97316)
    - Typography: Oswald (headings) + DM Sans (body)
    - Buttons: Pill-shaped, orange fill

    **Page Structure:**
    1. **Headline:** "Encontrá tu próximo vehículo en Paraguay" — Oswald black, 36px, above the card
    2. **Vehicle type tabs:** 3 pill tabs — "Autos" (active, black bg + white text), "Motos", "Barcos" (gray bg)
    3. **Unified search bar:** single rounded-full container with internal dividers:
       - Section 1: label "Marca" + value "Todas las marcas" (flex-1)
       - Vertical divider 1px gray
       - Section 2: label "Condición" + value "Cualquiera" (flex-1)
       - Vertical divider 1px gray
       - Section 3: label "Precio hasta" + value "Sin límite" (flex-1)
       - Inline orange pill button "Buscar →" on right (inside the bar)
    4. **Counter:** "847 vehículos disponibles ahora" — small text, orange bold number
  `
})
```

- [ ] **Step 2: Baixar screenshot e HTML**

```
stitch: get_screen_image({ screenId: "<screenId>" })
stitch: get_screen_code({ screenId: "<screenId>" })
→ Salvar em .stitch/designs/search-hero/screen.html
```

Atualizar `metadata.json`: `"search-hero": "<screenId>"`

- [ ] **Step 3: Implementar `src/components/SearchHero.tsx`**

```tsx
// vitrinemotors-stitch/src/components/SearchHero.tsx
import { useState } from 'react';
import { Search, Car, Bike, Ship } from 'lucide-react';

const TABS = [
  { label: 'Autos', icon: Car, value: 'auto' },
  { label: 'Motos', icon: Bike, value: 'moto' },
  { label: 'Barcos', icon: Ship, value: 'barco' },
] as const;

const BRANDS: Record<string, string[]> = {
  auto: ['Toyota', 'Volkswagen', 'Ford', 'Chevrolet', 'Mitsubishi', 'Honda', 'Renault', 'Nissan'],
  moto: ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW', 'Bajaj'],
  barco: ['Yamaha', 'Mercury', 'Evinrude', 'Sea Ray', 'Boston Whaler'],
};

const CONDITIONS = ['0km', 'Usado'];
const PRICES = ['$5.000', '$10.000', '$20.000', '$30.000', '$50.000'];

export function SearchHero() {
  const [activeTab, setActiveTab] = useState<'auto' | 'moto' | 'barco'>('auto');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState('');

  return (
    <section className="-mt-12 md:-mt-16 relative z-10 px-4 max-w-5xl mx-auto">

      {/* Card */}
      <div
        className="bg-white rounded-2xl p-6 md:p-8"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Headline */}
        <h2 className="font-heading font-black text-2xl md:text-3xl text-text-primary mb-5 leading-tight">
          Encontrá tu próximo<br />
          <span className="text-primary">vehículo en Paraguay</span>
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setBrand(''); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-text-primary text-white shadow-sm'
                    : 'bg-bg-secondary text-text-secondary hover:bg-gray-200'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Unified search bar */}
        <div className="flex items-center border-2 border-border rounded-full overflow-hidden focus-within:border-primary transition-colors bg-bg-secondary/50">

          {/* Marca */}
          <div className="flex-1 px-5 py-3 border-r border-border">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Marca</div>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-text-primary outline-none cursor-pointer"
            >
              <option value="">Todas las marcas</option>
              {BRANDS[activeTab].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Condición */}
          <div className="flex-1 px-5 py-3 border-r border-border">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Condición</div>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-text-primary outline-none cursor-pointer"
            >
              <option value="">Cualquiera</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
          </div>

          {/* Precio */}
          <div className="flex-1 px-5 py-3">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Precio hasta</div>
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-text-primary outline-none cursor-pointer"
            >
              <option value="">Sin límite</option>
              {PRICES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Botão buscar */}
          <div className="px-3 py-2">
            <button
              className="bg-primary hover:bg-primary-dark text-white rounded-full px-6 py-2.5 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              style={{ boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
            >
              <Search size={15} />
              Buscar
            </button>
          </div>

        </div>

        {/* Counter */}
        <p className="text-xs text-text-muted mt-3">
          <span className="text-primary font-bold">847 vehículos</span> disponibles ahora en Paraguay
        </p>

      </div>
    </section>
  );
}
```

---

## Task 7: Componente ListingCard

**Files:**
- Create: `vitrinemotors-stitch/src/components/ListingCard.tsx`
- Create: `vitrinemotors-stitch/.stitch/designs/listing-card/screen.html`

- [ ] **Step 1: Gerar design no Stitch**

```
stitch: generate_screen_from_text({
  projectId: "<id>",
  name: "listing-card",
  prompt: `
    Vehicle listing card for automotive marketplace. Single card, white background.
    The price MUST be displayed as an overlay on the photo, not below it.

    **DESIGN SYSTEM (REQUIRED):**
    - Platform: Web, Desktop-first
    - Theme: Light, clean
    - Background: Clean White (#FFFFFF)
    - Surface: Light Gray (#F3F4F6) for spec chips
    - Primary Accent: Vibrant Orange (#F97316) for GOLD badge and WhatsApp hover
    - Success: Emerald (#10B981) for 0km badge
    - WhatsApp button: #25D366
    - Typography: Oswald (card title) + DM Sans (specs, labels)
    - Cards: rounded-2xl, border 1px #E5E7EB, hover lift + subtle orange border

    **Card Structure:**
    1. **Image area (aspect 4:3):** car photo with dark gradient overlay bottom 60%
       - Top-left badge: "GOLD" orange pill OR "0KM" green pill
       - Top-right: heart icon (white circle button)
       - Bottom-left OVERLAY (on image): price "$28.500" — white, Oswald black, 20px, text-shadow
    2. **Content area (padding 14px):**
       - Title: "Toyota Hilux SRX 2021" — Oswald semibold 13px, single line
       - Spec chips row: year, fuel, city — gray rounded-full chips 11px
       - Bottom row: dealer name + verified checkmark (left) | WhatsApp green button (right)
  `
})
```

- [ ] **Step 2: Baixar assets**

```
stitch: get_screen_image({ screenId: "<screenId>" })
stitch: get_screen_code({ screenId: "<screenId>" })
→ Salvar em .stitch/designs/listing-card/screen.html
```

- [ ] **Step 3: Implementar `src/components/ListingCard.tsx`**

```tsx
// vitrinemotors-stitch/src/components/ListingCard.tsx
import { useState } from 'react';
import { Heart, MessageCircle, CheckCircle2, Star, Car, Bike, Ship, Fuel, MapPin } from 'lucide-react';
import type { MockListing } from '../data/mockListings';
import { formatPrice, formatMileage, getFuelLabel } from '../data/mockListings';

interface Props {
  listing: MockListing;
}

function dealerInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function ListingCard({ listing }: Props) {
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const coverPhoto = listing.photos?.[0]?.url;

  return (
    <div className="group block rounded-2xl bg-white overflow-hidden border border-border/60 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1.5 border-top-gradient cursor-pointer"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 28px rgba(249,115,22,0.08), 0 4px 12px rgba(0,0,0,0.06)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-secondary">
        {coverPhoto && !imgError ? (
          <img
            src={coverPhoto}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-bg-secondary to-border/20">
            {listing.vehicle_type === 'moto' ? <Bike size={32} className="text-primary/40" /> :
             listing.vehicle_type === 'barco' ? <Ship size={32} className="text-primary/40" /> :
             <Car size={32} className="text-primary/40" />}
          </div>
        )}

        {/* Deep gradient for price overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 45%, transparent 100%)' }}
        />

        {/* Top-left badge */}
        <div className="absolute top-3 left-3">
          {listing.tier === 'gold' || listing.tier === 'platinum' ? (
            <span className="flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              <Star size={9} className="fill-white" />
              {listing.tier === 'platinum' ? 'PLATINUM' : 'GOLD'}
            </span>
          ) : listing.condition === '0km' ? (
            <span className="bg-success-green text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              0KM
            </span>
          ) : null}
        </div>

        {/* Heart button */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 shadow-sm"
        >
          <Heart size={15} className={liked ? 'fill-red-500 text-red-500' : 'text-text-secondary'} />
        </button>

        {/* Price overlay on image */}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-heading font-black text-xl leading-none"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {formatPrice(listing.price_usd)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-text-primary line-clamp-1 font-heading group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        {/* Specs */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
            {listing.year}
          </span>
          {listing.mileage > 0 && (
            <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
              {formatMileage(listing.mileage)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
            <Fuel size={10} />
            {getFuelLabel(listing.fuel)}
          </span>
          <span className="inline-flex items-center gap-1 bg-bg-secondary text-text-secondary text-[11px] font-medium px-2 py-0.5 rounded-full">
            <MapPin size={10} />
            {listing.city}
          </span>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          {/* Dealer */}
          <div className="flex items-center gap-1.5">
            {listing.dealership ? (
              <>
                {listing.dealership.logo_url ? (
                  <img src={listing.dealership.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-[8px] font-bold">
                    {dealerInitials(listing.dealership.name)}
                  </div>
                )}
                <span className="text-xs text-text-secondary font-medium truncate max-w-[100px]">
                  {listing.dealership.name}
                </span>
                {listing.dealership.verified && (
                  <CheckCircle2 size={12} className="text-verified-blue flex-shrink-0" />
                )}
              </>
            ) : (
              <span className="text-xs text-text-muted">Particular</span>
            )}
          </div>

          {/* WhatsApp */}
          <button className="bg-whatsapp hover:bg-whatsapp/90 text-white rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition-all hover:shadow-md hover:scale-105 cursor-pointer">
            <MessageCircle size={12} />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 8: Componente HowItWorks

**Files:**
- Create: `vitrinemotors-stitch/src/components/HowItWorks.tsx`
- Create: `vitrinemotors-stitch/.stitch/designs/how-it-works/screen.html`

- [ ] **Step 1: Gerar design no Stitch**

```
stitch: generate_screen_from_text({
  projectId: "<id>",
  name: "how-it-works",
  prompt: `
    "How it works" section — 3 steps connected by a horizontal line.
    Clean white background, centered layout.

    **DESIGN SYSTEM (REQUIRED):**
    - Platform: Web, Desktop-first
    - Theme: Light, clean
    - Background: Clean White (#FFFFFF)
    - Primary Accent: Vibrant Orange (#F97316)
    - Typography: Oswald (step titles) + DM Sans (descriptions)

    **Section Structure:**
    1. **Section heading:** "¿Cómo funciona?" — Oswald bold 32px centered
    2. **Subtitle:** "Comprá o vendé tu vehículo en 3 simples pasos" — gray 14px centered
    3. **3-step row:** flex horizontal, steps connected by orange dashed line (opacity 30%) between circles
       - Each step: centered column layout
       - Circle: 48px diameter, orange gradient (#F97316 to #EA580C), number "1/2/3" white Oswald bold, shadow 0 4px 14px rgba(249,115,22,0.35)
       - Step title: "Publicá gratis" / "Gestioná leads" / "Cerrá sin comisión" — Oswald bold 16px
       - Step description: 2-line max, gray DM Sans 13px
  `
})
```

- [ ] **Step 2: Baixar assets**

```
stitch: get_screen_image({ screenId: "<screenId>" })
stitch: get_screen_code({ screenId: "<screenId>" })
→ Salvar em .stitch/designs/how-it-works/screen.html
```

- [ ] **Step 3: Implementar `src/components/HowItWorks.tsx`**

```tsx
// vitrinemotors-stitch/src/components/HowItWorks.tsx

const STEPS = [
  {
    num: 1,
    title: 'Publicá gratis',
    desc: 'Fotos, precio y datos en minutos. Tu anuncio visible al instante.',
  },
  {
    num: 2,
    title: 'Gestioná leads',
    desc: 'Compradores te contactan por WhatsApp o formulario. CRM incluido.',
  },
  {
    num: 3,
    title: 'Cerrá sin comisión',
    desc: 'Coordiná con el comprador. Sin comisiones, el 100% es tuyo.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <h2 className="font-heading font-bold text-2xl md:text-3xl text-center text-text-primary mb-3">
          ¿Cómo funciona?
        </h2>
        <p className="text-center text-text-secondary text-sm mb-14 max-w-md mx-auto">
          Comprá o vendé tu vehículo en 3 simples pasos
        </p>

        {/* Steps */}
        <div className="relative flex items-start justify-between gap-0">
          {/* Connecting line */}
          <div
            className="absolute top-6 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-0.5"
            style={{ background: 'linear-gradient(to right, #f97316, #fb923c, #f97316)', opacity: 0.25 }}
          />

          {STEPS.map((step) => (
            <div key={step.num} className="flex-1 flex flex-col items-center text-center px-4 relative z-10">
              {/* Circle */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-heading font-black text-xl mb-4 border-[3px] border-white"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                }}
              >
                {step.num}
              </div>
              <h3 className="font-heading font-bold text-base text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Task 9: Componente CTASection

**Files:**
- Create: `vitrinemotors-stitch/src/components/CTASection.tsx`
- Create: `vitrinemotors-stitch/.stitch/designs/cta-section/screen.html`

- [ ] **Step 1: Gerar design no Stitch**

```
stitch: generate_screen_from_text({
  projectId: "<id>",
  name: "cta-section",
  prompt: `
    Full-width CTA section for automotive marketplace. Dark background with orange accents.
    Encourages sellers to list their vehicles. Includes social proof stats.

    **DESIGN SYSTEM (REQUIRED):**
    - Platform: Web, Desktop-first
    - Theme: Dark, navy background with orange accents
    - Background: Deep Navy (#1E3A5F) with subtle radial orange glow at 30% opacity
    - Primary Accent: Vibrant Orange (#F97316)
    - Text: White (#FFFFFF) for headings, rgba(255,255,255,0.6) for body
    - Typography: Oswald (headings, bold) + DM Sans (body)
    - Buttons: Pill-shaped, orange fill for primary with glow shadow

    **Section Structure:**
    1. **Eyebrow pill:** "🚀 Vendé con nosotros" — orange text, orange border, dark orange bg, rounded-full pill
    2. **Headline:** "Publicá gratis. Vendé más rápido." — Oswald black 40px white, 2 lines
    3. **Subtitle:** "Llegá a miles de compradores en todo Paraguay — sin comisiones, sin límites." — gray 14px
    4. **Stats row (3 items separated by vertical dividers):**
       - "2.4k vendedores" | "850+ anúncios" | "4.8★ avaliação"
       - Numbers: white bold 28px Oswald | Labels: gray 11px
    5. **CTA buttons row:**
       - Primary: "Publicar mi vehículo →" — orange pill, shadow glow
       - Secondary: "Crear cuenta gratis" — white outline pill
  `
})
```

- [ ] **Step 2: Baixar assets**

```
stitch: get_screen_image({ screenId: "<screenId>" })
stitch: get_screen_code({ screenId: "<screenId>" })
→ Salvar em .stitch/designs/cta-section/screen.html
```

- [ ] **Step 3: Implementar `src/components/CTASection.tsx`**

```tsx
// vitrinemotors-stitch/src/components/CTASection.tsx
import { ArrowRight } from 'lucide-react';

const STATS = [
  { value: '2.4k', label: 'vendedores' },
  { value: '850+', label: 'anúncios' },
  { value: '4.8★', label: 'avaliação' },
];

export function CTASection() {
  return (
    <section className="py-20 md:py-28 text-white text-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        }}
      />
      {/* Orange glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(249,115,22,0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
          🚀 Vendé con nosotros
        </div>

        {/* Headline */}
        <h2 className="font-heading font-black text-3xl md:text-5xl leading-tight mb-4">
          Publicá gratis.<br />
          <span className="text-primary">Vendé más rápido.</span>
        </h2>

        {/* Subtitle */}
        <p className="text-white/60 text-base max-w-xl mx-auto mb-10 leading-relaxed">
          Llegá a miles de compradores en todo Paraguay — sin comisiones, sin límites.
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <div className="px-8 text-center">
                <div className="font-heading font-black text-3xl text-white">{stat.value}</div>
                <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
              </div>
              {i < STATS.length - 1 && (
                <div className="w-px h-10 bg-white/10" />
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-full px-10 py-4 text-base font-bold transition-all hover:scale-105"
            style={{ boxShadow: '0 6px 20px rgba(249,115,22,0.4)' }}
          >
            Publicar mi vehículo
            <ArrowRight size={18} />
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center border border-white/25 hover:border-white/50 text-white rounded-full px-8 py-4 text-base font-medium transition-all hover:bg-white/10"
          >
            Crear cuenta gratis
          </a>
        </div>

      </div>
    </section>
  );
}
```

---

## Task 10: Montar App.tsx

**Files:**
- Modify: `vitrinemotors-stitch/src/App.tsx`

- [ ] **Step 1: Substituir `src/App.tsx` completamente**

```tsx
// vitrinemotors-stitch/src/App.tsx
import { Header } from './components/Header';
import { SearchHero } from './components/SearchHero';
import { ListingCard } from './components/ListingCard';
import { HowItWorks } from './components/HowItWorks';
import { CTASection } from './components/CTASection';
import { mockListings } from './data/mockListings';
import { ChevronRight } from 'lucide-react';

// Hero placeholder — imagem escura com gradiente para simular o carousel
function HeroPlaceholder() {
  return (
    <div
      className="w-full h-[420px] md:h-[520px] relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      {/* Simulated car imagery with geometric shapes */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="w-96 h-64 border-2 border-white/20 rounded-2xl transform -rotate-3" />
        <div className="absolute w-72 h-48 border-2 border-primary/30 rounded-2xl transform rotate-6 translate-x-32" />
      </div>
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-16 max-w-7xl mx-auto w-full">
        <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">
          El marketplace #1 de Paraguay
        </p>
        <h1 className="font-heading font-black text-white text-4xl md:text-6xl leading-tight mb-4 max-w-lg">
          Encontrá tu<br />próximo vehículo.
        </h1>
        <p className="text-white/60 text-base mb-6 max-w-md">
          SUVs · Pickups · Sedanes — los mejores precios de Paraguay
        </p>
        <a
          href="#"
          className="bg-primary hover:bg-primary-dark text-white rounded-full px-8 py-3.5 font-semibold transition-all hover:scale-105"
          style={{ boxShadow: '0 4px 16px rgba(249,115,22,0.4)' }}
        >
          Explorar inventario
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="bg-bg min-h-screen overflow-x-hidden">
      {/* Header */}
      <Header />

      {/* Hero */}
      <HeroPlaceholder />

      {/* Search Hero — overlaps hero */}
      <div className="max-w-5xl mx-auto px-4">
        <SearchHero />
      </div>

      {/* How It Works */}
      <div className="mt-16 md:mt-20">
        <HowItWorks />
      </div>

      {/* Featured Listings */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-text-primary">
            Vehículos destacados
          </h2>
          <a href="#" className="text-primary font-medium hover:underline flex items-center gap-1 text-sm">
            Ver todos
            <ChevronRight size={16} />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mockListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <CTASection />

      {/* Footer simples */}
      <footer className="bg-bg-secondary border-t border-border py-8 text-center">
        <p className="text-text-muted text-sm">
          © 2024 VitrineMOTORS — Sandbox Redesign Preview
        </p>
        <p className="text-text-muted text-xs mt-1">
          Este é um protótipo visual isolado — não é o projeto de produção
        </p>
      </footer>
    </div>
  );
}
```

---

## Task 11: Verificação final

- [ ] **Step 1: Iniciar o servidor sandbox**

```bash
cd "C:\Users\jhcar\OneDrive\Área de Trabalho\VITRINEMOTORS\vitrinemotors-stitch"
npm run dev
```

Esperado: `Local: http://localhost:5174/` sem erros de TypeScript ou build.

- [ ] **Step 2: Verificar no browser os 5 critérios**

Abrir http://localhost:5174 e confirmar:
- [ ] Header: logo 32px sem overflow, borda laranja visível na base
- [ ] SearchHero: barra unificada com 3 seções internas + headline Oswald acima
- [ ] ListingCards: preço visível na foto (bottom-left overlay), não no body
- [ ] HowItWorks: 3 círculos laranja numerados com linha conectora
- [ ] CTASection: sem cores hardcoded, stats visíveis (2.4k / 850+ / 4.8★)

- [ ] **Step 3: Verificar no browser lado a lado com o original (opcional)**

Abrir http://localhost:5173 (original) e http://localhost:5174 (sandbox) em abas lado a lado.

---

## Self-Review Notes

**Spec coverage:**
- ✅ Sandbox isolado criado em pasta separada
- ✅ Stack idêntico (Vite + React 19 + Tailwind 4 + mesmos tokens)
- ✅ 5 componentes implementados: Header, SearchHero, ListingCard, HowItWorks, CTASection
- ✅ Pipeline Stitch incluído em cada componente (generate → review → implement)
- ✅ Mock data com 8 listings paraguaios
- ✅ .stitch/DESIGN.md criado com prompt block pronto
- ✅ Porta 5174 configurada para rodar lado a lado
- ✅ Sem Supabase/auth/Zustand — dados mockados
- ✅ Critérios de sucesso verificáveis no Task 11

**Sem placeholders, sem TBDs.**
