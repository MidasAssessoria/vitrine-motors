#!/bin/bash
# Hook: auto-format após Edit/Write em arquivos .ts, .tsx, .css
# Recebe JSON do evento via stdin

INPUT=$(cat)
FILE=$(echo "$INPUT" | python -c "
import sys, json
try:
    d = json.loads(sys.stdin.read())
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null)

# Só age em arquivos TypeScript e CSS
if [[ "$FILE" =~ \.(tsx?|css)$ ]]; then
  # Usa binário local para evitar latência do npx
  ESLINT="./node_modules/.bin/eslint"
  if [[ ! -x "$ESLINT" ]]; then
    ESLINT="npx eslint"
  fi
  $ESLINT --fix "$FILE" --quiet 2>/dev/null || true
fi

exit 0
