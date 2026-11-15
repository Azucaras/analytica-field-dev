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

## Integração com a `main` da equipe

Em 15 de novembro a `exp_vass` foi integrada à `main` da equipe, que já trazia o registro de camadas, a linha do
tempo, os polígonos de cultura e a região dos EUA em Cass County (Dakota do Norte). Os nossos blocos 4 a 6 viraram
9 a 11, porque a equipe já usava os números 4 a 8. Os talhões-piloto aparecem na região a que pertencem, o seletor
de safra deu lugar à linha do tempo da equipe e o `pt-BR.ts` ganhou as 91 chaves novas dela. Também foram
corrigidas duas falhas de teste que só aconteciam no Windows.

## Uma tela que aceita recursos novos

Os painéis da tela do mapa se posicionavam sozinhos por coordenadas fixas, e por isso se sobrepunham, cobriam o
mapa e tinham letras de 7 a 9 px. Isso já acontecia na `main` da equipe. Agora a tela é uma grade: barra
superior, uma coluna de botões à esquerda, colunas laterais, uma gaveta abaixo do mapa e o mapa livre no meio. No
celular, um painel por vez abre embaixo do mapa.

Cada recurso é um painel registrado em `field-shift-app/src/shell/panels.tsx`. Para incluir um recurso novo basta
escrever o componente e acrescentar uma entrada nessa lista; o botão, o lugar na tela e a aba do celular saem
dela. Um painel com erro mostra a própria mensagem sem derrubar o resto. O passo a passo está em
`field-shift-app/README.md`.

Na mesma mudança: os talhões de Cass County deixaram de mostrar chaves de tradução cruas e o mapa enquadra o
talhão escolhido; o SMAP aparece em pixels nítidos com o tamanho do pixel indicado; o divisor do comparar virou
uma linha com alça que se arrasta.

## Camadas mais rápidas e sem dados no mar

A cada data nova, o backend consultava a NASA camada por camada, abrindo uma conexão nova a cada tentativa: cerca
de 10 s até a lista de camadas aparecer. Agora as camadas são consultadas ao mesmo tempo, numa conexão
reaproveitada (de 1,3 a 3,8 s), e uma falha momentânea da NASA não deixa mais a camada "indisponível" pelo resto
do dia. Nas camadas que só têm valor em terra (umidade do solo, vegetação e temperatura da superfície), a água do
mapa base é desenhada por cima, então os pixels de 1 km do litoral não invadem mais o mar nem os lagos. O painel
Comando agora lista os comandos com um exemplo pronto de cada um.

Saíram da lista de camadas a umidade do solo SMAP L3 e as duas reflectâncias HLS (Landsat e Sentinel-2): em
qualquer data elas cobrem só faixas ou retalhos do mapa. A camada que abre ligada passou a ser a umidade do solo
SMAP L4, que cobre o mundo todo.

## Outras mudanças

- O app abre em português, com troca para inglês.
- `iniciar.cmd` (ou `npm start`) instala o que falta, sobe tudo e abre o navegador.
- Comentários, documentação e textos da interface foram revisados para ficar mais diretos.

## O que ainda falta

- Rotações dos EUA com trigo (McLean) e com sorgo (Lubbock) ficam sem nota: essas culturas ocupam menos de 1% da
  área plantada no condado nos últimos anos, e o método só calcula a produtividade das culturas principais.
- Datas de plantio do Brasil confirmadas pela CONAB.
- Notas em escala fixa (hoje são relativas entre as opções de cada lugar).
- CHIRPS e MapBiomas; mais municípios e condados; validação das notas contra a produtividade observada.
