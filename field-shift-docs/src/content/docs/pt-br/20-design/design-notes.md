---
title: Notas de design
description: Raciocínio que ainda não tem linha de evidência. Mova para os achados assim que tiver.
---

## Por que o cartão de evidência, e não o mapa, carrega a resposta

Um mapa mostra onde. Ele não consegue mostrar por que uma sequência foi sugerida nem quem precisa confirmá-la. O cartão de evidência é a unidade que guarda os cinco campos do desafio, e o mapa é o caminho até o cartão. Isto é um argumento, não um achado: nenhum teste de usabilidade foi feito.

## Por que a regra de abstenção é provisória

Oitenta por cento de área válida e duas safras com suporte é um número redondo, escolhido para ser defensável, e não medido. Ele existe para que a interface tenha uma única regra, em vez de um julgamento caso a caso em cada campo. Espere alterá-lo depois que três ou quatro campos reais tiverem sido testados.

## Como é uma boa falha

A ferramenta deve falhar de forma explícita e cedo: um campo com uma safra de evidência e 40 por cento de nuvens não retorna ranking, informa qual dos dois limites falhou e aponta o dado que falta. Uma resposta parcial silenciosa é o modo de falha que o design precisa evitar.

## Termos que continuam gerando discussões

Veja o [glossário](/pt-br/40-reference/glossary/). Observado, recuperado, modelado e inserido são quatro coisas diferentes, e toda a lógica de honestidade do projeto desmorona se forem usados como sinônimos.
