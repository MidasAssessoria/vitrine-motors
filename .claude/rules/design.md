---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.ts"
  - "src/pages/**/*.tsx"
  - "src/pages/**/*.ts"
---

# Design System — VitrineMOTORS
> Carregado automaticamente ao editar componentes e páginas.

## Tipografia
- Headings `h1`–`h4`: sempre `font-heading` (Oswald) — obrigatório
- Body: `font-body` (DM Sans) — padrão, não precisa declarar
- Labels uppercase decorativos: `font-heading tracking-wider text-xs`

## Paleta (CSS vars em `src/index.css`)
| Token | Valor | Uso |
|---|---|---|
| `text-primary` / `bg-primary` | #F97316 | Apenas CTA principal, destaques |
| `text-accent` / `bg-accent` | #1E3A5F | Trust elements, headers dark |
| `bg-bg-secondary` | #F3F4F6 | Fundo de cards, chips de spec |
| `border-border` | #E5E7EB | Bordas padrão |
| `text-text-secondary` | #536471 | Texto auxiliar |
| `text-text-muted` | #9CA3AF | Placeholders, meta info |
| `text-verified-blue` | #2563EB | Badge verificado |
| `text-success-green` | #10B981 | Status positivo |
| `text-warning` | #F59E0B | Alertas |

## Border radius
| Elemento | Classe |
|---|---|
| Buttons (todos) | `rounded-full` |
| Badges e pills de tier | `rounded-full` |
| Chips de specs | `rounded-full` |
| Search inputs | `rounded-full` |
| Cards | `rounded-xl` ou `rounded-2xl` |
| Modais e drawers | `rounded-2xl` |

## Componentes-padrão

**Chip de spec** (ano, km, combustível, câmbio):
```tsx
<span className="bg-bg-secondary rounded-full px-2 py-0.5 text-sm text-text-secondary">
  {value}
</span>
```

**Tier badge Gold:**
```tsx
<span className="badge-gold rounded-full px-2 py-0.5 text-xs">GOLD</span>
```

**Status containers:**
```tsx
// Sucesso
<div className="bg-status-success-bg border border-status-success-border rounded-xl p-4">
// Erro
<div className="bg-status-error-bg border border-status-error-border rounded-xl p-4">
// Info
<div className="bg-status-info-bg border border-status-info-border rounded-xl p-4">
```

**Card com hover:**
```tsx
<div className="shadow-card hover:shadow-card-hover transition-shadow duration-200 rounded-xl">
```

## Sombras
- Cards em repouso: `shadow-card`
- Cards em hover: `shadow-card-hover`
- Dropdowns e floats: `shadow-float`
- Search bar: `shadow-search`
- Glow laranja sutil: `glow-gold`

## Animações — usar as classes existentes (não criar novas)
```css
animate-slide-in   /* toast, notificação lateral */
animate-slide-up   /* modal, bottom sheet */
animate-fade-in    /* reveal suave */
animate-scale-in   /* popup, dropdown */
skeleton           /* loading placeholder — já inclui shimmer */
```
Uso do skeleton:
```tsx
<div className="skeleton h-4 w-32" />   /* linha de texto */
<div className="skeleton h-48 w-full" /> /* imagem de card */
```

## Contraste — atenção
- `text-text-muted` (#9CA3AF) **falha** WCAG AA para texto funcional — use só em placeholder/decorativo
- `text-primary` (#F97316) **falha** WCAG AA sobre branco — nunca usar como cor de texto informativo
- `text-text-secondary` (#536471) e `text-accent` (#1E3A5F) são seguros para texto normal

## PROIBIDO
- ❌ Overlay laranja (`bg-primary/XX`) sobre category cards no hover
- ❌ `bg-mesh-warm` em formulários, auth pages ou fundos de página
- ❌ `rounded-xl` em buttons — use `rounded-full`
- ❌ `rounded-md` em badges ou pills — use `rounded-full`
- ❌ Cores hardcoded (`#F97316`, `#1E3A5F`, etc.) — sempre usar os tokens
- ❌ `font-sans` explícito onde `font-body` já é o padrão do body
- ❌ Classes de animação customizadas — usar as definidas em `src/index.css`
