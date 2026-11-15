---
title: ADR 0001, demonstrar em um único campo brasileiro
status: accepted
date: 2026-11-10
deciders: Líder de pesquisa, líder de build
---

## Contexto

A pesquisa cobre dois países e o envelope de build é grande, mas uma comparação precisa de um campo, uma jurisdição, uma safra e um histórico de culturas antes de calcular qualquer coisa. Cobrir os dois países superficialmente deixa cada linha sem suporte. O Cerrado também traz a evidência mais forte do conjunto: uma diferença de produtividade de 2.33 Mg por ha entre duas datas de plantio de milho, em janeiro e fevereiro, em um mesmo ensaio no Mato Grosso.

## Decisão

A demonstração roda em um campo sintético em Santa Carmem, Mato Grosso, ano-safra 2025/26, de 1 de julho de 2025 a 30 de junho de 2026, sob a jurisdição brasileira e do Mato Grosso. Os Estados Unidos são uma extensão documentada e não aparecem em nenhuma linha de comparação.

## Consequências

Fácil: cada linha recebe um calendário real, um regime de crédito real e um limite real para a segunda safra. A regra de abstenção tem algo concreto para verificar.

Difícil: a ferramenta parece somente brasileira para um avaliador, e a pesquisa sobre os EUA não ganha presença na demonstração. Quem quiser um campo nos EUA precisa adicionar campos de jurisdição, seguro e arrendamento antes da primeira linha.

Revisar se a entrega de recursos de 2026-11-13 adicionar um conjunto de dados brasileiro que mude o mix de sensores, ou se um membro da equipe tiver conhecimento de campo dos EUA e puder assumir esses três campos extras.

## Revisão de 2026-11-14 (bloco 9)

Em 2026-11-14 o usuário decidiu acrescentar o dipolo brasileiro do ENSO à demonstração. Santa Carmem continua sendo o único lugar com cenários de rotação. Dois talhões piloto sintéticos se juntam a ela, um em Tupanciretã (Rio Grande do Sul, excesso de chuva no El Niño) e um em Luís Eduardo Magalhães (Bahia, déficit de chuva no El Niño). Eles carregam apenas evidência climática municipal: composições de chuva do NASA POWER, anomalias de produtividade do IBGE PAM em anos de El Niño forte e o estado do ENSO publicado pelo CPC. Eles não carregam cenário de rotação, porque escrever um seria inventar uma afirmação agronômica antes de existir método de pontuação. A cobertura deles não é medida, então eles sempre se abstêm. A spec é `field-shift-app/specs/bloco-9-sinal-enso.md`.

## Alternativas consideradas

- **Um campo por país.** Dobra a superfície de entrada e reduz pela metade a profundidade de evidência em cada um. Descartada por profundidade.
- **Um campo no Corn Belt dos EUA.** Dados de arrendamento e seguro mais limpos, mas perde a evidência de época de plantio e o mecanismo da safrinha que tornam o caso do Cerrado nítido. Descartada por evidência.
