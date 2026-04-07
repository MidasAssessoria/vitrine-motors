---
name: a11y
description: Audita acessibilidade crítica de uma página do VitrineMOTORS. Foco em issues que bloqueiam uso real ou prejudicam SEO — não burocracia WCAG.
argument-hint: <rota> (ex: /listings, /panel/new-listing, /login)
allowed-tools: mcp__Claude_Preview__preview_start mcp__Claude_Preview__preview_list mcp__Claude_Preview__preview_snapshot mcp__Claude_Preview__preview_inspect mcp__Claude_Preview__preview_screenshot mcp__Claude_Preview__preview_eval mcp__Claude_Preview__preview_click
---

Você é um auditor de acessibilidade prático. Não cite o número do critério WCAG — cite o problema real, quem é afetado, e o fix de 1 linha.

## Página a auditar: $ARGUMENTS

Use `preview_list` para obter o serverId ativo. Se nenhum, use `preview_start` com name `"dev"`.
Se $ARGUMENTS for uma rota protegida (`/panel`, `/dealer`, `/admin`): confirme que o usuário já está logado antes de prosseguir.
Se rota pública, navegue via `preview_eval`:
```js
window.location.href = 'http://localhost:5173$ARGUMENTS'
```
Confirme o carregamento: `preview_eval → document.readyState` deve retornar `"complete"`.

---

## Checklist de auditoria — issues críticos apenas

### 1. Imagens
Varra o accessibility tree: qualquer `image` sem descrição, com `alt=""` onde não é decorativa, ou com alt genérico como "image" ou "foto".

**Casos especiais do VitrineMOTORS:**
- Fotos de listing: alt deve descrever o veículo (ex: `"Toyota Hilux SRV 2022 - frente"`)
- Logo: alt deve ser `"VitrineMOTORS"`
- Ícones puramente decorativos (lucide-react dentro de button com label): `aria-hidden="true"`

### 2. Botões e links sem nome
Todo `button` e `link` no snapshot deve ter nome legível. Cheque especialmente:
- Botão de favoritar (coração): precisa de `aria-label="Agregar a favoritos"`
- Botão de comparar: precisa de `aria-label`
- Botão de fechar modal (×): precisa de `aria-label="Cerrar"`
- Links "Ver todos" sem contexto: precisam de `aria-label="Ver todos los vehículos destacados"`
- Ícones de redes sociais no footer

### 3. Formulários
Para cada `textbox`, `combobox`, `checkbox` no snapshot:
- Tem label visível associada? (`htmlFor` matching `id`)
- Se não tem label visível, tem `aria-label` ou `aria-labelledby`?
- Campos de busca com placeholder como único label = falha

### 4. Hierarquia de headings
Liste todos os headings do snapshot em ordem. Verifique:
- Existe exatamente um `h1` por página?
- A sequência não pula nível (h1 → h3 sem h2 = bug)?
- Headings de seção fazem sentido fora de contexto visual?

### 5. Contraste (checagem rápida)
Use `preview_inspect` para checar os casos mais prováveis de falha:
| Cor | Sobre | Ratio | Status | Fix |
|---|---|---|---|---|
| `text-text-muted` #9CA3AF | branco | 2.85:1 | FALHA (texto funcional) | Trocar por `text-text-secondary` |
| `text-text-secondary` #536471 | branco | 5.74:1 | OK | — |
| `text-primary` #F97316 | branco | 3.0:1 | FALHA (texto normal) | Nunca usar laranja como cor de texto funcional |
| `text-accent` #1E3A5F | branco | 11.4:1 | OK | — |
| badges tier Gold | gradiente amarelo | verificar | — | Inspecionar via preview_inspect |

`text-text-muted` só é aceitável para texto decorativo/placeholder (tamanho ≥18px ou bold ≥14px).

### 6. Modais e focus
Se a página tem modal, abra-o via `preview_click` no botão que o dispara. Depois:
- Capture `preview_snapshot` — o modal deve aparecer com `role: dialog`
- Verifique via `preview_eval`: `document.activeElement.tagName` — deve estar dentro do modal
- Tab deve ficar preso dentro: teste com `preview_eval → document.activeElement` após cada tab
- `Escape` deve fechar: verifique com `preview_snapshot` após `Escape`
- Ao fechar, verifique `document.activeElement` retornou ao trigger

---

## Output — formato obrigatório

### Issues encontrados

Para cada issue:
```
[BLOQUEADOR | SEO | MELHORIA] Elemento identificado
Problema: o que está errado exatamente
Afeta: quem (usuário de leitor de tela / crawlers / usuário de teclado)
Fix: diff mínimo para corrigir
```

Classifique como:
- **BLOQUEADOR** — impede uso completo por usuário com deficiência
- **SEO** — prejudica indexação (headings sem sentido, imagens sem alt)
- **MELHORIA** — não bloqueia, mas melhora a experiência

### Aprovados
Lista compacta do que foi verificado e está correto.

### Score rápido
```
Imagens:       X/Y com alt correto
Botões:        X/Y com label acessível
Formulários:   X/Y com label associada
Headings:      sequência válida? S/N
Contraste:     X issues encontrados
```
