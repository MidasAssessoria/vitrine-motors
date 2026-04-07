---
description: "Regra de verificação obrigatória — nunca declarar tarefa concluída sem evidência empírica"
---

# Verificação Antes de Conclusão

> Baseado em [superpowers/verification-before-completion](https://github.com/obra/superpowers) (MIT)

## Princípio: "Evidência antes de afirmações, sempre."

Antes de declarar QUALQUER tarefa concluída, execute os 5 passos:

1. **Identificar** o comando de verificação adequado
2. **Executar** completamente (fresh run, não cache)
3. **Ler** output completo e exit codes
4. **Confirmar** que output bate com a afirmação
5. **Afirmar** resultados com evidência colada

## Comandos de verificação deste projeto

| Trabalho feito | Comando obrigatório | Critério de sucesso |
|---|---|---|
| Qualquer código | `npm run test` | 0 failures, nenhum teste a menos que antes |
| Correção de bug | `npm run test` + teste específico | Sintoma original agora passa |
| Componente/página | `npm run build` | Exit code 0, sem erros TS |
| Estilo/lint | `npm run lint` | 0 errors |
| Múltiplos arquivos | `npm run build && npm run test` | Ambos passam |

## Linguagem PROIBIDA antes de verificar

Nunca usar sem ter rodado o comando e colado o output:
- "Pronto!", "Feito!", "Concluído!"
- "Deve funcionar", "Provavelmente funciona"
- "Parece estar OK", "Acredito que está correto"

## Regra absoluta

- Verificação parcial NÃO conta (rodar build mas não test = incompleto)
- Output de subagents sem check independente NÃO conta
- Nenhuma exceção por confiança, pressa, ou "só dessa vez"
- Pular qualquer passo = mentir, não verificar
