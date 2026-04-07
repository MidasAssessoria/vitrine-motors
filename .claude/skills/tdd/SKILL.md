---
name: tdd
description: "Test-Driven Development: RED-GREEN-REFACTOR. Usa quando implementar qualquer feature ou bugfix — ANTES de escrever código de produção."
---

Você pratica TDD rigoroso. Nenhum código de produção existe sem um teste que falhou primeiro.

## Lei de ferro

```
NENHUM CÓDIGO DE PRODUÇÃO SEM UM TESTE FALHANDO PRIMEIRO
```

Se código foi escrito antes do teste: parar, escrever o teste primeiro, verificar que falha pela razão certa, e só então implementar. Não deletar trabalho do usuário sem perguntar.

## Quando usar

- Novas features
- Bug fixes (o teste reproduz o bug antes do fix)
- Refactoring (testes existentes devem continuar verdes)
- Mudanças de comportamento

**Exceções (requerem aprovação do usuário):**
- Protótipos descartáveis
- Código gerado
- Arquivos de configuração pura

## Ciclo RED-GREEN-REFACTOR

### RED — Escrever teste mínimo que falha

- Um teste, um behavior.
- Nome claro que descreve o que está sendo testado.
- Deve testar behavior real, não detalhes de implementação.

### Verificar RED — Confirmar que falha corretamente

**Obrigatório.** O teste deve falhar porque a feature não existe, não por typo ou erro de import.

> "Se você não viu o teste falhar, não sabe se ele testa a coisa certa."

### GREEN — Código mais simples que faz passar

- APENAS o mínimo para o teste passar.
- Sem over-engineering.
- Sem features extras "já que estou aqui".

### Verificar GREEN — Confirmar que passa

- O teste novo passa.
- Nenhum teste existente quebrou.

### REFACTOR — Limpar mantendo green

- Remover duplicação.
- Melhorar nomes.
- Testes devem continuar passando após cada mudança.

### Repeat — Próximo behavior

## Por que a ordem importa

| Abordagem | Resultado |
|---|---|
| Teste primeiro, depois código | Teste falha → código faz passar → PROVA que funciona |
| Código primeiro, teste depois | Teste passa imediato → sem evidência que pega bugs |
| Código sem teste | Zero garantia → regressões invisíveis |

## Red Flags — parar e corrigir o processo

- Código escrito antes de testes
- Testes passando imediatamente (nunca viram RED)
- Não consegue explicar por que o teste falha
- "Só dessa vez" → não existe exceção

## Checklist de conclusão

- [ ] Toda função nova tem teste
- [ ] Cada teste falhou antes da implementação (RED verificado)
- [ ] Código mínimo foi escrito (sem extras)
- [ ] Todos os testes passam com output limpo
- [ ] Edge cases cobertos

## Relação com outras skills

- Chamado por `/debug` na Fase 4 (criar teste que reproduz o bug).
- Cada tarefa de `/parallel` deve seguir este ciclo internamente.
- `/review` avalia se o TDD foi seguido corretamente.
