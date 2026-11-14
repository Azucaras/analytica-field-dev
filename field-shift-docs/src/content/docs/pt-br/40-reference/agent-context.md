---
title: Contexto do agente
description: Como um agente deve trabalhar neste repositório e para que serve cada arquivo.
---

## Arquivos

| Arquivo | Contém | Lido por |
|---|---|---|
| `/llms.txt` | Índice de páginas de todo o site | Agentes que seguem a especificação |
| `/llms-full.txt` | Corpus em um único arquivo | Agentes que buscam a variante completa |
| `AGENTS.md` na raiz do repositório | Regras locais: comandos, estrutura, regras de edição | Agentes de código |
| `/field-shift-dossier.md` | A fonte aprofundada citada | Quem precisa das evidências |

Para procedimentos, vale o `AGENTS.md`. Quando ele e uma página divergirem, corrija a página.

## Contrato de esquema

Três tabelas, somente seleção.

| Tabela | Campos principais | Regra |
|---|---|---|
| `field` | `field_id`, `boundary_version`, `geom` | Linhas de contorno são imutáveis, uma revisão adiciona uma versão |
| `observation` | `field_id`, `indicator`, `period_start`, `period_end`, `value`, `support_m`, `qa`, `basis` | `basis` é observado, recuperado, modelado ou inserido |
| `constraint` | `field_id`, `kind`, `value`, `source`, `unknown` | `unknown` é verdadeiro quando o agricultor não respondeu |

## Regras de consulta

Resolva um campo somente quando o nome for único. Pergunte quando houver múltiplas correspondências. Exija um conjunto de temporadas, um indicador e uma agregação. Aplique `PROVISIONAL_ABSTENTION_GATE` antes de devolver um ranking. Devolva os parâmetros resolvidos e a versão do esquema junto com a resposta.

Rejeite escritas, DDL, funções arbitrárias, identificadores não reconhecidos, cross joins não controlados e qualquer coisa que agregue entre campos sem declarar isso.

## Voz

`FIELD_VOICE_TEST_01` controla a voz por completo. A voz inicia, e uma confirmação na tela efetiva a escrita. Baixa confiança, uma frase fora da gramática ou um nome de campo ambíguo significam que nada é executado.

## O que um agente não pode afirmar

Não afirme que a rotação de culturas causou produtividade, lucro ou carbono do solo. Não afirme que uma grade de publicação de 9 km é condição de campo. Não afirme que um estado de modelo foi medido.
