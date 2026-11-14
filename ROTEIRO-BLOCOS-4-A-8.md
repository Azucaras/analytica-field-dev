# Roteiro dos blocos 4 a 8

Plano de execução das 39 features dos dois relatórios de pesquisa (`EXPLORACAO-DADOS-E-FEATURES.md`, F-01 a F-25, e `PESQUISA-POLIGONOS-TIMELINE-E-TIPOS-DE-DADO.md`, F-26 a F-39). Todas entram. A ordem é só de dependência técnica: nenhuma feature foi adiada por calendário.

Escrito em 2026-11-14. Cada bloco segue o ADR 0005: spec congelada antes do código, aprovação do usuário, ondas com um único escritor, e um gate de medição no fim.

## 1. Decisões já tomadas

| Decisão | Valor | Origem |
|---|---|---|
| Fundo de satélite | Interface com adaptadores. Padrão: EOX Sentinel-2 cloudless 2024. Adaptador Google especificado, ligado só se existir `VITE_GOOGLE_MAPS_API_KEY` | Usuário: "se não tiver como, vamos usar EOX". A política do Google admite MapLibre, mas exige chave com faturamento, proíbe cache e armazenamento e limita a 15.000 tiles por dia por padrão (PESQUISA, seção 11.1) |
| Timeline | Barra diária substitui o `SeasonSelect`. A temporada deixa de ser menu e vira faixa derivada da data | Usuário concordou com a seção 4 da pesquisa |
| Polígonos | Trazo3 (WRI e ASU, CC BY 4.0) lidos por PMTiles. A classe de cultura é recalculada a partir da MapBiomas Coleção 11, ano 2025 | Usuário pediu a coleção mais recente; PESQUISA, seções 2 e 11.2 |
| Histórico de rotação | MapBiomas Coleção 11: uso agrícola de 1ª safra (1985 a 2025) e de 2ª safra (2000 a 2025, beta) | PESQUISA, seção 11.2 |
| Campo | O app passa a trabalhar com o polígono clicado. O fixture de três campos fica como modo de demonstração | Usuário: "identificar polígonos que correspondessem à plantação" |
| Earthdata | Fora do caminho crítico. Nenhum bloco depende de login. Entra quando houver sessão visível para o navegador de automação | PESQUISA, seção 11.3 |

## 2. Blocos

### Bloco 4: camadas e timeline diária

Features: F-01 registro de camadas com matriz própria, F-02 legenda honesta, F-03 ordem e opacidade, F-04 óptica com data escolhida por cobertura, F-05 seletor de data por camada, F-06 animação, F-07 comparação lado a lado, F-24 sanidade de dado, F-25 modo degradado, F-31 timeline diária global, F-32 trilha de disponibilidade, F-33 faixa de safra, F-34 comparação de dois momentos.

Spec: `field-shift-app/specs/bloco-4-camadas-e-timeline.md`.
Dado de entrada: capabilities do GIBS, sondagem de 15 camadas em `field-shift-app/artifacts/data-probe-2026-11-14.json`, busca STAC do Sentinel-2, tábua de risco do ZARC.
Depende de: nada novo. É a fundação.
Armadilhas medidas: matriz de tiles por camada (NDVI com Level6 devolve 400); GRACE parado em 2022-07-01; HLS com poucas datas úteis; IMERG de 30 minutos tem data com hora.

### Bloco 5: polígonos de cultura sobre satélite

Features: F-26 polígonos Trazo3 em MapLibre, F-27 nível de visão geral para zoom baixo, F-28 legenda e cor por classe MapBiomas, F-29 fundo de satélite com preenchimento translúcido, F-30 clique no polígono vira o campo do app.

Spec: `field-shift-app/specs/bloco-5-poligonos-de-cultura.md`.
Dado de entrada: `trazo3.pmtiles` em `data.source.coop` (1.662.582.674 bytes, zoom 0 a 12, camada `trazo`, propriedades `Id` e `mbmode24`), legenda do MapBiomas Coleção 11.
Depende de: bloco 4, para o registro de camadas e o adaptador de fundo.
Armadilhas medidas: tile de 1,09 MB no zoom 6 e 7,3 MB no zoom 4; mediana de 22,4 ha por polígono; 92 por cento da área do ponto é soja; o crop-map usa opacidade 0,85, que esconderia a imagem.

### Bloco 6: números por polígono

Features: F-08 série POWER por campo, F-09 agregados agronômicos, F-10 balanço hídrico simples, F-11 extração por polígono, F-12 proveniência por linha, F-13 contraevidência por recomendação, F-14 registro de lacunas, F-35 normais climáticas e percentil, F-36 série NDVI por polígono com Sentinel-2, F-37 cartão de solo, F-38 histórico de rotação com MapBiomas, F-39 contexto municipal.

Spec: `field-shift-app/specs/bloco-6-numeros-por-poligono.md`.
Dado de entrada: POWER (16 parâmetros confirmados), Sentinel-2 L2A do Element84 Earth Search, SoilGrids, SIDRA tabela 1612, MapBiomas Coleção 11.
Depende de: bloco 5, porque tudo é por `Id` de polígono.
Armadilhas medidas: -999 no POWER, normal de 36 anos com 2026 no percentil 20, 6 de 18 cenas Sentinel-2 com nuvem abaixo de 20 por cento, cerca de 88 polígonos por célula SMAP.

### Bloco 7: decisão e entrada do produtor

Features: F-15 comparador com pesos do produtor, F-16 simulador de condição, F-17 calendário de janelas, F-21 cadastro de talhão, F-22 histórico de manejo declarado, F-23 restrições econômicas.

Spec: `field-shift-app/specs/bloco-7-decisao-e-produtor.md`.
Depende de: bloco 6.
Regra herdada do bloco 1: todo número tem base e nenhum controle reclassifica uma linha. O formulário de restrições foi removido por decisão do usuário, então F-23 precisa de justificativa explícita de cada campo e de um consumidor real, ou não entra.

### Bloco 8: agente e voz

Features: F-18 text-to-SQL sobre a evidência, F-19 voz sobre o registro de comandos, F-20 explicação do que está na tela.

Spec: `field-shift-app/specs/bloco-8-agente-e-voz.md`.
Depende de: bloco 6 estável, e do registro de comandos do ADR 0004.

## 3. Ordem

    bloco 4  camadas e timeline
       -> bloco 5  polígonos sobre satélite
            -> bloco 6  números por polígono
                 -> bloco 7  decisão e produtor
                 -> bloco 8  agente e voz

As specs são escritas em cadeia: bloco 4, depois 5, depois 6, e então 7 e 8 em paralelo. O bloco 5 herda o registro de camadas e o adaptador de fundo do bloco 4, e os blocos 6, 7 e 8 herdam o identificador de polígono do bloco 5. Escrever em paralelo produziria contratos que se contradizem, como aconteceu na rodada 5 da spec do bloco 3.

## 4. Portões

1. Spec escrita e congelada pelo tech-lead, com digest reproduzível.
2. Aprovação do usuário no chat ("ok go on, implement"), registrada no `STATE.md`.
3. Cards do developer em ondas, um escritor por vez, porque `App.tsx` e `index.css` recebem edições de todos os blocos e duas mãos concorrentes se sobrescreveriam. O repositório no GitHub agora guarda o histórico, mas as ondas continuam sequenciais por segurança.
4. Gate do tech-lead medindo cada critério no navegador real em 1440x900, 780x900 e 360x640, com o resultado em `artifacts/CHECKPOINT-BLOCO-N.md`.

## 5. O que não está resolvido

- Hospedagem dos polígonos: ler direto do Source Cooperative ou recortar Mato Grosso para um arquivo próprio. Recomendação: recorte próprio com fallback ao original. A spec do bloco 5 deve nomear o padrão de ambos.
- Preço do Google Map Tiles API: não verificado. A página de preços não carregou.
- Acesso ao MapBiomas Coleção 11: a página de download direto devolveu "não encontrada" e o bucket anônimo devolve 401 e 403. O caminho é um download pela Plataforma MapBiomas ou um export no Earth Engine, uma vez, recortado em Mato Grosso.
- Qual coleção alimentou o `mbmode24` do Trazo3: não verificado.
- Earthdata: a sessão que o usuário abriu não é visível ao navegador de automação.
- Renderização do estilo translúcido sobre satélite: ninguém testou a opacidade de 0,35 a 0,5 no mapa real.
