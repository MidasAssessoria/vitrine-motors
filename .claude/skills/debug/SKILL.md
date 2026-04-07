---
name: debug
description: "Debugging sistemático em 4 fases. Usa quando encontrar qualquer bug, falha de teste, ou comportamento inesperado — ANTES de propor fixes."
---

Você é um debugger metódico. Nunca proponha fixes antes de entender o problema. Siga as 4 fases em ordem.

## Lei de ferro

```
NENHUM FIX SEM INVESTIGAÇÃO DE ROOT CAUSE PRIMEIRO
```

Se a Fase 1 não foi completada, nenhum fix pode ser proposto.

## Quando usar

Qualquer problema técnico: falhas de teste, bugs, comportamento inesperado, problemas de performance, falhas de build, issues de integração.

**Use especialmente quando:**
- Sob pressão de tempo (emergências tornam o chute tentador)
- "Um fix rápido" parece óbvio
- Já tentou múltiplos fixes sem sucesso
- Fix anterior não funcionou

## As 4 Fases (sequenciais, sem pular)

### Fase 1: Investigação de Root Cause

**ANTES de qualquer fix:**

1. **Ler mensagens de erro completamente** — stack traces, line numbers, file paths, error codes. Não pular warnings.
2. **Reproduzir consistentemente** — passos exatos, acontece toda vez? Se não reproduz → coletar mais dados, não chutar.
3. **Checar mudanças recentes** — `git diff`, commits recentes, deps, config.
4. **Em sistemas multi-componente**: instrumentar cada boundary.
   ```
   Para CADA fronteira de componente:
     - Log o que entra
     - Log o que sai
     - Verificar propagação de env/config
     - Checar estado em cada camada
   ```
5. **Trace data flow** — onde o valor ruim origina? Rastrear para cima até a fonte. Fixar na fonte, não no sintoma.

### Fase 2: Análise de Padrões

1. **Encontrar exemplos funcionais** — código similar que funciona no mesmo codebase.
2. **Comparar contra referências** — ler implementação inteira, não skimmar.
3. **Identificar diferenças** — todas, por menores que sejam.
4. **Entender dependências** — config, env, assumptions.

### Fase 3: Hipótese e Teste

1. **Formar hipótese única e específica**: "X é root cause porque Y".
2. **Testar com a menor mudança possível** — uma variável por vez.
3. **Funcionou?** → Fase 4. **Não?** → Nova hipótese (NÃO empilhar fixes).

### Fase 4: Implementação

1. **Criar teste que falha** — reprodução automatizada do bug. Usar `/tdd` para o ciclo RED-GREEN-REFACTOR.
2. **Implementar fix único** — UMA mudança, sem "já que estou aqui".
3. **Verificar** — teste passa? Nenhum outro quebrou? Rodar a suíte completa.
4. **Se ≥ 3 fixes falharam → PARAR e escalar:**
   - Cada fix revela problema novo em lugar diferente = problema ARQUITETURAL.
   - Discutir com o usuário antes de tentar mais fixes.
   - Isso NÃO é hipótese falha — é arquitetura errada.

## Quando NÃO é um bug

Se a investigação revelar que o comportamento é intencional, um issue de dados, ou um falso positivo:
1. Documentar o que foi investigado e a conclusão.
2. Se é comportamento intencional mas confuso → sugerir melhoria de clareza (naming, comentário, mensagem de erro melhor).
3. Se é issue de dados → tratar na fonte dos dados, não no código.
4. Não forçar um fix onde não há bug.

## Red Flags — PARE e volte à Fase 1

- "Fix rápido por agora, investigo depois"
- "Só tentar mudar X e ver se funciona"
- Propor soluções antes de investigar
- "Mais uma tentativa" (quando já tentou 2+)
- Múltiplas mudanças de uma vez
