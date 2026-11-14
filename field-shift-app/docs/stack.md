# Stack e comandos

Medido em 2026-11-10, Arch Linux, 12 núcleos, Node 26.12.0, Python 3.14.9 em venv.

| Peça | Versão fixada | Origem |
|---|---|---|
| React e React DOM | 19.3.1 | template Vite react-ts |
| Vite | 8.3.7 | template |
| TypeScript | 5.9.3 | fixado por causa de `shadcn add` e dos tipos do CossUI |
| Tailwind | 4.3.5 | exigido pelo shadcn, plugin `@tailwindcss/vite` |
| shadcn CLI | preset `base-nova`, base `base`, Tailwind v4 | registro `@coss` em `components.json` |
| CossUI | 26 arquivos em `src/components/ui` | `npx shadcn add @coss/...` |
| MapLibre GL JS | 6.17.0 | npm |
| Deck.gl e @deck.gl/react | 9.4.1 | npm |
| Zod | 4.6.7 | npm |
| Zustand | 5.1.0 | npm |
| React Router | 8.5.1 | npm |
| Vitest e jsdom | 5.1.0 | npm |

Backend: FastAPI 0.133.1 em `backend/.venv`, dependências em `backend/requirements.txt`.

## Comandos

```sh
npm install
npm run dev                                  # 5173
npm run build                                # tsc -b && vite build, exit 0 medido
npx tsc -b --noEmit                          # exit 0 medido
npx vitest run                               # sem teste ainda: exit 1, "No test files found"
backend/.venv/bin/uvicorn main:app --reload --app-dir backend --port 8000
```

## Correções de toolchain já aplicadas

- `tsconfig.app.json` precisou de `DOM.Iterable` em `lib`, senão `segmented-control.tsx` do CossUI não compila.
- Os componentes do registro caem em um diretório literal `@/components`; mover para `src/components` depois de cada `shadcn add`.
- `shadcn init` exige `-p nova -b base` e trava sem preset.
