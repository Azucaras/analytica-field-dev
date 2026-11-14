---
title: Configuração
description: Do clone limpo ao site em execução, com as versões verificadas.
---

## Pré-requisitos

| Requisito | Versão verificada | Observação |
|---|---|---|
| Node | 26.12.0 | Versão com número par, 22.23.4 ou mais recente |
| npm | 12.2.1 | Vem com o Node |
| Disco | cerca de 400 MB, incluindo `node_modules` | A saída estática é pequena, a cadeia de ferramentas não é |

Verificado em 2026-11-10 no Arch Linux, com 12 núcleos.

## Instalação e execução

```sh
cd field-shift-docs
npm install
npm run dev
```

Servidor de desenvolvimento em http://localhost:4321. O servidor de desenvolvimento não serve os espelhos `.md`; use `npm run preview` para eles.

## Compilação

```sh
npm run build
```

Gera `dist/`, os espelhos `.md` de cada página, a seção Pages do `llms.txt` e as tags de link. Ele falha em um link interno quebrado, em um `title` ausente e em um componente MDX indefinido.

## Onde ficam os arquivos

`src/content/docs/` guarda todas as páginas, uma pasta por fase. `astro.config.mjs` guarda o título, a barra lateral e o plugin. `src/styles/custom.css` guarda as regras de densidade das tabelas. `dist/` e os arquivos `llms*.txt` são saída do build.

## Antes de qualquer deploy

Altere `site`, `title` e o link social em `astro.config.mjs`, senão todo link absoluto em `llms.txt` aponta para a origem errada.
