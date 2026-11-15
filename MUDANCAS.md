# Mudanças desde que o projeto chegou

Ponto de partida: commit `757c91d`. Tudo abaixo foi feito em 14 e 15 de novembro de 2026, na branch `exp_vass`.
A base dos dados e da análise é o projeto Field Phase (`nasa_chall_train`).

## Dados reais do El Niño no mapa

O app só tinha um arquivo de exemplo com três talhões. Agora o mapa mostra:

- o estado atual do El Niño segundo a NOAA (RONI de +1,97 °C, muito forte);
- a chuva desde o início da safra, comparada ao normal de 1991 a 2020 e aos anos de El Niño forte;
- uma tabela com o que os anos de El Niño forte já mostraram no município: chuva, sequência seca e produtividade.

Esses números saem de um pipeline novo (`field-shift-pipeline/`), que baixa NOAA, NASA POWER e IBGE e grava os
arquivos que o backend lê. Entraram os talhões 04 (Tupanciretã, RS) e 05 (Luís Eduardo Magalhães, BA) para
mostrar o contraste: no El Niño chove mais no Sul e menos no Norte.

## Análise completa

O botão **Análise** abre, na mesma página, a análise do município do talhão: El Niño agora, previsão da
Meteomatics para 15 dias, 46 dias e a estação, rotações recomendadas conforme as prioridades do agricultor (solo,
água, renda) e o cálculo de cada nota, produtividade por cultura, vegetação, uso do solo e relevo.

## Estados Unidos

Entraram McLean County (Illinois, Corn Belt) e Lubbock County (Texas, Plains do sul), como talhões 06 e 07, com
as mesmas camadas do Brasil. A produtividade vem do USDA NASS e as datas de plantio do calendário do USDA. Nos
EUA o ano vai de outubro a setembro, porque o efeito do El Niño aparece no inverno.

O contraste nos EUA não é tão limpo quanto no Brasil. Lubbock recebe bem mais chuva no inverno de El Niño
(+35%), mas McLean também (+21%), então os dois não se espelham.

## Outras mudanças

- O app abre em português, com troca para inglês.
- `iniciar.cmd` (ou `npm start`) instala o que falta, sobe tudo e abre o navegador.
- Comentários, documentação e textos da interface foram revisados para ficar mais diretos.

## O que ainda falta

- Produtividade e renda dos EUA: rodar `pipeline.fetch_nass` com a chave do NASS.
- Previsão Meteomatics dos condados dos EUA: rodar `pipeline.fetch_meteomatics` com a conta.
- Datas de plantio do Brasil confirmadas pela CONAB.
- Notas em escala fixa (hoje são relativas entre as opções de cada lugar).
- CHIRPS e MapBiomas; mais municípios e condados; validação das notas contra a produtividade observada.
