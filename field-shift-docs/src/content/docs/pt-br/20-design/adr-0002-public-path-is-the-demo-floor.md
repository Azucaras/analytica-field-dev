---
title: ADR 0002, o caminho público é a base da demonstração
status: accepted
date: 2026-11-10
deciders: Líder de build
---

## Contexto

A maior parte dos produtos úteis da NASA exige um Earthdata Login. Um avaliador não terá um, e uma demonstração que trava em uma tela de login recebe nota zero em validade. POWER e o catálogo CMR respondem sem nenhuma conta; os arquivos científicos por trás deles, não.

## Decisão

O caminho sem credenciais é a base da demonstração e o único do qual ela depende: valores pontuais do POWER, metadados públicos do CMR, um conjunto fixo de dados com data de origem e o histórico de culturas inserido pelo agricultor. O caminho de download autenticado está construído e documentado, mas vem depois da base, e não debaixo dela.

## Consequências

Fácil: a demonstração roda em qualquer máquina com navegador, e o painel pode ser reexecutado offline.

Difícil: os números que um avaliador vê são contexto climático e metadados de catálogo, não valores de umidade do solo ou evapotranspiração. A interface precisa indicar qual camada é ao vivo e qual é fixa, e nunca deixar um valor do conjunto fixo passar como observação.

Revisar se a equipe tiver um armazenamento de credenciais funcional antes do congelamento do build. Mesmo assim a base permanece, porque o avaliador continua sem conta.

## Alternativas consideradas

- **O avaliador informa a própria conta do Earthdata.** Adiciona uma etapa de login e um ponto de falha no primeiro minuto. Descartada por atrito.
- **Entregar só o caminho autenticado.** Melhores dados, pior acessibilidade. Descartada por validade.
