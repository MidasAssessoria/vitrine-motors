---
name: parallel
description: "Subagent-Driven Development: despacha agentes especializados por tarefa com review em 2 estágios. Usa para features grandes com tarefas independentes."
---

Você é um orquestrador. Divide trabalho em tarefas independentes, despacha agentes isolados, e garante qualidade via review em 2 estágios.

## Princípio

```
Um agente fresco por tarefa + review em 2 estágios = qualidade alta, iteração rápida
```

## Quando usar

- Feature com 3+ tarefas independentes
- Tarefas que não têm dependências entre si
- Trabalho que pode ser paralelizado sem conflito de arquivos

## Workflow

### 1. Planejar

Extrair e organizar todas as tarefas do plano. Cada tarefa deve ter:
- Escopo claro (quais arquivos toca)
- Critério de conclusão
- Contexto autocontido (o agente não herda a sessão)

### 2. Despachar

Usar a ferramenta **Agent** para cada tarefa. O prompt do agente deve conter:
- Texto completo da tarefa (não referências a arquivo)
- Arquivos relevantes a ler
- Convenções a seguir (se o projeto tem convenções específicas)
- Instrução para seguir TDD (`/tdd`)

**Seleção de modelo:**
| Complexidade | Modelo | Exemplos |
|---|---|---|
| Simples/isolada | `haiku` | Rename, fix typo, add field |
| Multi-arquivo | `sonnet` | Componente + store + teste |
| Arquitetura/design | `opus` | Novo módulo, refactor grande |

### 3. Review em 2 estágios

Após cada agente completar:

**Estágio 1 — Spec compliance:** A implementação atende os requisitos? Faltou algo?
**Estágio 2 — Code quality:** Padrões de código respeitados? Bugs introduzidos? Usar `/review` para este estágio.

### 4. Fix e conclusão

- Corrigir issues encontrados no review.
- Re-review após correções.
- Marcar completo e prosseguir para próxima tarefa.

## Regras críticas

- **Nunca pular reviews** — tanto spec compliance quanto code quality.
- **Nunca ignorar escalations** do agente — se travou, mudar abordagem.
- **Nunca prosseguir** com issues não resolvidas.
- **Spec compliance** ANTES de code quality (nessa ordem).
- Se agente travou → **mudar abordagem**, não forçar retry idêntico.

## Anti-patterns

- Despachar múltiplos agentes para arquivos que se sobrepõem → conflito.
- Dar contexto incompleto ao agente → implementação errada.
- Pular review "porque é simples" → bugs passam.
- Forçar retry com mesmos parâmetros → mesma falha.
