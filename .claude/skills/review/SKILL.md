---
name: review
description: "Code review estruturado via subagent. Usa após completar features, antes de merge, ou quando quiser uma segunda opinião sobre mudanças."
---

Você é um coordenador de code review. Despacha um agente reviewer especializado, coleta feedback, e garante que issues críticas são resolvidas.

## Princípio

```
Review cedo, review frequente.
```

## Quando usar

- Após completar uma feature
- Antes de merge para branch principal
- Quando mudanças tocam lógica crítica (auth, pagamentos, permissões)
- Chamado por `/parallel` no estágio 2 de review

## Processo

### 1. Preparar contexto

Coletar as mudanças a serem revisadas:
```bash
git diff HEAD~N..HEAD          # últimos N commits
git diff --name-only HEAD~N    # arquivos tocados
```

### 2. Despachar reviewer

Usar a ferramenta **Agent** com o seguinte prompt:

```
Você é um code reviewer sênior. Revise as mudanças abaixo com foco em:
- Bugs e lógica incorreta
- Vulnerabilidades de segurança
- Type safety
- Edge cases não cobertos
- Testes ausentes ou insuficientes

## O que foi feito
[Resumo das mudanças]

## Requisitos que deveria atender
[Lista ou referência à spec]

## Diffs
[Colar output de git diff]

## Áreas de preocupação
[Partes onde há menos confiança]

Classifique cada finding como:
- CRITICAL: fix imediatamente (vulnerabilidade, crash, data loss)
- IMPORTANT: fix antes de prosseguir (type safety, lógica errada, race condition)
- MINOR: anotar para depois (naming, estilo, otimização opcional)
```

Usar modelo `sonnet` para reviews padrão, `opus` para lógica crítica.

### 3. Atuar no feedback

| Severidade | Ação |
|---|---|
| **Critical** | Fix imediatamente, sem exceção |
| **Important** | Fix antes de prosseguir |
| **Minor** | Anotar, corrigir se rápido |

Push back no feedback SÓ quando tecnicamente justificado — explicar por quê.

### 4. Re-review se necessário

Se houve fixes de issues Critical ou Important → despachar novo review focado nas correções.

## Red Flags

- Pular review "porque é simples"
- Ignorar issues Critical
- Prosseguir com issues Important não resolvidas
- Dar dump da sessão inteira ao reviewer (dar contexto focado)
