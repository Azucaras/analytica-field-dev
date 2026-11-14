# Polígonos de cultura, timeline diária e tipos de dado

Relatório de pesquisa para o Field Shift. Responde a três perguntas: como o app crop-map faz os polígonos por cultura e se dá para fazer igual aqui, o que dá para ser diário de verdade numa timeline, e quais dados aparecem como imagem, quais como gráfico ou texto e quais só alimentam features.

Escrito em 2026-11-14. Continua o catálogo de `EXPLORACAO-DADOS-E-FEATURES.md` (features F-01 a F-25) e numera as novas de F-26 em diante. Sem divisão por relógio: a ordem das features é por dependência técnica. As medições cruas estão em `field-shift-app/artifacts/data-probe-2026-11-14-polygons-timeline.json`.

Cada número traz a fonte. Quando algo é inferência minha, está escrito "inferido". Quando não consegui verificar, está escrito "não verificado".

## 0. Resumo

1. O crop-map não calcula nada ao vivo. Ele pega um shapefile anual de campos já classificados (Califórnia, 2023, DWR e Land IQ), converte em PMTiles com níveis de detalhe prontos por zoom e pinta cada polígono por código de cultura. Não tem satélite no fundo e não tem série temporal.
2. Existe o equivalente para Mato Grosso e ele está aberto: o conjunto Trazo3 do WRI e da ASU tem 1.418.870 campos em Mato Grosso, licença CC BY 4.0, em PMTiles de 1,66 GB que lê por HTTP range sem chave e com CORS aberto. Provei lendo tiles reais no ponto dos campos do app.
3. Cada polígono do Trazo3 carrega `mbmode24`, que é a classe MapBiomas dominante em 2024 (inferido do nome e dos valores 39, 41, 15, 62, que batem com a legenda oficial). No ponto dos campos, 92 por cento da área mapeada é soja.
4. Polígonos translúcidos sobre satélite de alta resolução funcionam. Vi tiles reais: o Esri World Imagery mostra bordas de talhão, mata e linhas de plantio com nitidez; o Sentinel-2 cloudless da EOX mostra os mesmos talhões mais suave. O problema do Esri é licença, e o da EOX é ser não comercial.
5. Timeline diária existe para variáveis contínuas (chuva, temperatura, umidade modelada, SMAP, IMERG) e não existe para imagem óptica: em 61 dias o Sentinel-2 passou 18 vezes sobre o ponto e só 6 cenas tinham menos de 20 por cento de nuvem. Os polígonos de cultura são anuais.
6. Regra para decidir o que vira imagem: só vira imagem o dado cuja resolução nativa é menor que o objeto que o usuário olha. No ponto dos campos o polígono mediano tem 22,4 ha. Um pixel SMAP de 9 km cobre cerca de 88 desses polígonos com o mesmo valor, então SMAP é número e gráfico, não mapa de campo.
7. Medição que vira conteúdo de tela: a chuva de 1 de outubro a 11 de novembro de 2026 foi 171,9 mm contra mediana de 224,9 mm em 1991 a 2025, percentil 20; foram 28 dias com máxima de 35 C ou mais contra mediana de 17.
8. Não consegui ver o acesso ao Earthdata que você disse ter dado: o navegador gerenciado e o navegador local mostram o formulário de login e o cofre do Hermes está vazio. Nada deste relatório depende dele.

## 1. O que o crop-map realmente é

Repositório `SabhyaC26/crop-map`, licença MIT, 328 arquivos, último push em 2026-10-14. O post no X (2026-10-12, @sabhyac267) diz "384k" campos da Califórnia e o link curto t.co leva a `https://crops.sabhyachhabria.com/` (resposta 301 medida hoje).

Verificado no código e no README:

| Peça | O que é | Fonte |
|---|---|---|
| Dado | Shapefile "Statewide Crop Mapping 2023" do DWR, produzido pela Land IQ, cerca de 172 MB | README, seção Data and credits |
| Pipeline | Python, GDAL, tippecanoe e CLI pmtiles; `04_process.py` limpa, `05_tiles.sh` gera `fields.pmtiles` | `Makefile`, `pipeline/05_tiles.sh` |
| Três níveis de detalhe | `fields-low.pmtiles` do zoom 5 ao 8, `fields.pmtiles` do 9 ao 14, mais `overview.pmtiles` | `pipeline/08_fields_low.sh`, `05_tiles.sh` |
| Como o nível baixo fica leve | Funde todos os polígonos da mesma cultura em um multipolígono por tile e guarda só `crop_id` | `08_fields_low.sh`: `--coalesce`, `-y crop_id`, limite de 1,2 MB por tile |
| Como o nível alto fica leve | Descarta e funde só onde o tile estoura 500 KB, sem afinar por taxa a partir do zoom 9 | `05_tiles.sh`: `-B9`, `--drop-densest-as-needed`, `--coalesce-densest-as-needed` |
| Cor | Expressão MapLibre `match` sobre `crop_id`, com a cor vinda de `data/lookup/crops.csv` | `site/src/layers/fields.ts`, `cropMatch` |
| Transparência | `FILL_OPACITY = 0.85`, ou seja, quase opaco, sobre um basemap pastel desenhado à mão | `fields.ts` linha 47; README |
| Interação | Campo só clicável a partir do zoom 10,2; hover e seleção por `feature-state` | `fields.ts`, `INTERACTIVE_MIN_ZOOM` |
| Hospedagem | Site estático, sem backend, tiles em Cloudflare R2 lidos por HTTP range | README, seção Deploy |

O que isso diz sobre a sua ideia:

- A granularidade que muda com o zoom é pré-computada na geração dos tiles. Não existe cálculo no navegador. Para ter o mesmo efeito é preciso um arquivo de tiles com níveis de detalhe prontos.
- O dado do crop-map é anual e de terceiros. Ele não tem timeline. Copiar o crop-map dá os polígonos, não a dimensão temporal.
- O crop-map não usa satélite como fundo. A sua combinação (polígono translúcido sobre satélite) é diferente do que ele faz e é viável, como mostra a seção 3.

## 2. De onde vêm os polígonos em Mato Grosso

### 2.1 Trazo3: limites de campo, verificado

Fonte: WRI Data Lab e Arizona State University, publicado no Source Cooperative em `wri-data-lab/trazofields`, citado como Grupp et al. (2026). Licença CC BY 4.0, com atribuição obrigatória a Trazo e WRI.

Verificado hoje:

- A página lista 10.935.129 limites na América do Sul. Para Mato Grosso, modelo Trazo3, 1.418.870 campos.
- O README da coleção `trazo3-fields` recomenda o Trazo3 para a maioria dos usos e cita 79,17 por cento de IoU de pixel no conjunto de teste de Mato Grosso. Os limites vêm de Sentinel-2 e cobrem 2023-07-01 a 2024-07-31.
- Arquivos: `trazo3_brazil_mato_grosso_2024.parquet` com 916 MB (GeoParquet), `geopackages/trazo3_brazil_mato_grosso_2024.gpkg` com 3,6 GB e `trazo3.pmtiles` com 1.662.582.674 bytes.
- O PMTiles responde com `HTTP 206`, `accept-ranges: bytes` e `access-control-allow-origin: *`. Isso significa que um navegador lê tiles direto, sem backend e sem CORS extra. Medido com `curl -I` hoje.
- Cabeçalho do arquivo: tipo MVT, compressão gzip, zoom 0 a 12, caixa de -68,99 a -41,26 de longitude e de -35,32 a 0,88 de latitude. Uma camada, `trazo`, com duas propriedades: `Id` e `mbmode24`.
- Os campos do app (centro -55,27 / -11,91) caem dentro da caixa.

Atributos do esquema, segundo o README: `Id`, `hansen_covered_area`, `hansen_loss_area` (perda florestal Hansen por campo), `mode_year`, `firstyear`, `firstyearmajority`, seis colunas `deforestarea*` por período, `mbmode24`, `mbcov_area_2024`, `mbvalid_area_2024` e `geometry`. O PMTiles só leva `Id` e `mbmode24`. Os demais atributos estão só nos parquets e nos geopackages.

### 2.2 O que `mbmode24` significa e o que ele não significa

- Inferido: é a moda da classe de cobertura MapBiomas dentro do polígono, para 2024. A evidência é o nome, as colunas `mbcov_area_2024` e `mbvalid_area_2024` ao lado, e os valores que apareceram nos tiles (39, 41, 15, 62), todos presentes na legenda oficial da Coleção 10.
- Legenda oficial (PDF "Legenda Coleção 10", lida hoje): 39 Soja, 20 Cana, 40 Arroz, 62 Algodão (beta), 41 Outras Lavouras Temporárias, 36 Lavoura Perene, 46 Café, 47 Citrus, 35 Dendê, 48 Outras Lavouras Perenes, 15 Pastagem, 9 Silvicultura, 21 Mosaico de Usos, 3 Formação Florestal, 4 Formação Savânica.
- O que ele não é: não é "o que foi plantado na safra 2025/26". É um único ano, 2024, e é a cultura de verão. A segunda safra (milho, algodão) não está nesse atributo.
- Os polígonos são previsão de modelo. Devem sair rotulados como `modelled`, e as bordas têm erro.

### 2.3 Medição no ponto dos campos

Lendo tiles reais por range request (68 requisições, 9,3 MB baixados no total):

| Zoom | Tamanho do tile (gzip) | Polígonos no tile |
|---|---|---|
| 4 | 7.277 KB | 3.641.092 |
| 6 | 1.090 KB | 361.881 |
| 7 | 179 KB | 48.227 |
| 8 | 73 KB | 18.212 |
| 9 | 136 KB | 9.368 |
| 10 | 67 KB | 3.388 |
| 11 | 24 KB | 898 |
| 12 | 8 KB | 227 |

Leitura: o Trazo3 não tem nível de visão geral. Abaixo do zoom 8 o tile cresce até virar inutilizável como preenchimento. Para mostrar polígonos de cultura em zoom baixo, é preciso ou começar a desenhar a partir do zoom 8, ou gerar um nível de visão geral como o crop-map faz (seção 6, F-27).

Estatística de um bloco de 3 por 3 tiles do zoom 12 ao redor do ponto (900 polígonos, 46.398 ha):

- Área por polígono: p10 1,5 ha, mediana 22,4 ha, p90 151,2 ha, máximo 453 ha. Cuidado: medido em fragmentos de tile, então os polígonos cortados na borda contam mais de uma vez e a mediana verdadeira é provavelmente maior.
- Por classe: 657 polígonos de soja (42.827 ha, 92 por cento da área), 127 de pastagem, 115 de outras lavouras temporárias e 1 de algodão.

### 2.4 MapBiomas: o histórico que falta para rotação

A Coleção 10 (factsheet de Agricultura e Irrigação, lido hoje) tem quatro produtos que importam para o Field Shift:

1. Classes de agricultura anuais de 1985 a 2024, Landsat, 30 m: soja, cana, arroz, algodão (beta), outras temporárias, café, citrus.
2. Segunda safra de 2000 a 2024, Landsat, 30 m, com classes de milho e algodão, em versão beta.
3. Número de ciclos por ano de 2017 a 2024, Sentinel-2, 10 m.
4. Irrigação anual de 1985 a 2024, 30 m.

Números do factsheet que apontam o valor para o app: em 2024 Mato Grosso teve 6,7 Mha de milho de segunda safra após soja, e 94 por cento do milho de segunda safra mapeado no Brasil veio depois de soja. Isso é exatamente o par soja e milho que o app chama de rotação atual.

Licença: dados públicos sob CC BY com atribuição, conforme o factsheet.

Acesso, o ponto que não resolvi: o bucket público `mapbiomas-public` devolve 401 na listagem e 403 nos objetos que testei (o tif de cobertura 2024 e o PDF do pôster), para acesso anônimo. As rotas que sobram são o Google Earth Engine (asset `projects/mapbiomas-public/...`, que pede conta Google com Earth Engine) e a plataforma MapBiomas. O site já publica a legenda da Coleção 11 (PDFs de 2026-08); não examinei o que mudou.

### 2.5 Outras fontes encontradas

| Fonte | O que dá | Estado |
|---|---|---|
| Sentinel-2 L2A COG, Element84 Earth Search | Bandas de 10 m para NDVI por polígono, sem login | Verificado: `B04`, `B08`, `TCI` e `SCL` respondem 206 sem credencial |
| IBGE SIDRA, tabela 1612 (PAM) | Área plantada por município e por ano, estatística oficial | Verificado: soja em Mato Grosso, 10,37 Mha em 2021, 10,93 em 2022, 11,98 em 2023, 12,38 em 2024 e 12,79 em 2025 |
| ZARC, Ministério da Agricultura | Janelas de plantio por cultura, município e solo, CSV por safra | Verificado: conjunto em CC BY, atualizado em 2026-11-13; o CSV em si não foi aberto |
| SoilGrids, ISRIC | Textura, pH e carbono do solo a 250 m, 3 profundidades | Verificado com chamada real (seção 5.2); API ainda em beta |
| ESA WorldCereal | Culturas e irrigação a 10 m, global, sazonal | Página diz que a coleção publicada hoje só tem 2021; não testei acesso |
| GFSAD30 (NASA, LP DAAC) | Extensão de lavoura a 30 m, ano nominal 2015 | Só máscara de lavoura, antiga; não testei |
| Fields of The World | Modelos e benchmark de limites de campo, 24 países | O Trazo é derivado dele; não testei inferência própria |
| SICAR, CAR | Perímetro de imóvel rural declarado, por estado | Encontrado, não baixado; é imóvel, não talhão |

## 3. Satélite de fundo com polígonos translúcidos

Pedi tiles reais no ponto dos campos e olhei três deles.

| Fonte | Testado | O que vi | Licença e condição |
|---|---|---|---|
| Esri World Imagery | z10, 14, 16, 17, 18 todos 200 | z14: bordas de talhão, mata e construções nítidas. z17: linhas de plantio, borda de mata e estrada de terra visíveis | Fontes da comunidade Esri dizem que exige licença ArcGIS ou chave; o plano gratuito exato não foi verificado. Atribuição à Esri é obrigatória |
| EOX Sentinel-2 cloudless 2024 | z10, 14, 16, 17 todos 200 | z14: mesma disposição do Esri, mais suave; talhões distinguíveis; verde mais saturado. Resolução nativa 10 m, então acima de z14 é ampliação | CC BY-NC-SA 4.0 para 2018 a 2024, com atribuição obrigatória. A versão 2016 é CC BY 4.0, uso comercial permitido |
| NASA GIBS MODIS Terra cor verdadeira, z9 | 200 nos 4 dias testados | Em 2026-11-13 o tile era nuvem mais a borda preta da faixa sem dado. Não serve como fundo | Aberta, sem chave |
| NASA GIBS VIIRS SNPP cor verdadeira, z9, jpg | 404 nos 4 dias testados | Não investiguei a causa | |
| Mapbox Satellite, MapTiler | Não testados | | Exigem chave e conta |
| Google Maps | Não testado | A Map Tiles API existe e está sujeita ao contrato do Google; não verifiquei se o uso em MapLibre é permitido | |

Leitura:

- "Igual ao Google Maps" tecnicamente quer dizer imagem de satélite de resolução submétrica. Das fontes que testei só o Esri chega a isso, e ele tem a condição de licença.
- A EOX serve sem chave e já resolve a demonstração. O custo é ser não comercial e ter resolução de 10 m.
- O fundo é uma camada fixa e separada dos dados diários. Não é o mesmo conceito que a camada "satélite do dia" da timeline.
- Para ver o satélite por baixo do polígono, o preenchimento precisa ser translúcido. O crop-map usa 0,85, que cobriria a imagem. Para a sua proposta serve algo perto de 0,35 a 0,5 mais um contorno de linha, que é o que preserva a borda do talhão. Isso é decisão de estilo e precisa de teste visual; não renderizei esse conjunto.

## 4. Timeline diária: o que é diário de verdade

Cadência e última data medida hoje no ponto dos campos:

| Variável | Fonte | Cadência nativa | Última data servida | Observação |
|---|---|---|---|---|
| Chuva e temperatura | NASA POWER | diária | 2026-11-11 | dias ainda não consolidados vêm como -999 |
| Umidade de solo, superfície | SMAP L3, GIBS | diária | 2026-11-11 | 9 km sobre footprint de 36 km |
| Umidade de solo, zona de raiz | SMAP L4, GIBS | diária no tile | 2026-11-10 | modelo com assimilação |
| Chuva | IMERG, GIBS | diária | 2026-11-13 | estimativa quase em tempo real |
| Chuva | IMERG 30 min, GIBS | meia hora | 2026-11-14 12:30 UTC | a mais recente de todas |
| Temperatura de superfície | MODIS Terra LST, GIBS | diária | 2026-11-13 | 1 km, depende de céu limpo |
| Vegetação | MODIS NDVI 8 dias, GIBS | 8 dias | 2026-11-13 | 250 m |
| Imagem de 10 m | Sentinel-2 L2A | revisita 5 dias | 18 cenas em 61 dias | 6 cenas com menos de 20 por cento de nuvem |
| Imagem de 30 m | HLS Landsat | 8 a 16 dias | cinco datas com imagem útil em 25 dias | medido na seção 2.3 do relatório anterior |
| Polígono de cultura | Trazo3 e MapBiomas | anual | 2024 | não muda ao longo do ano |

Consequências para o desenho:

1. Uma barra de tempo em dias é correta para as variáveis contínuas. Ela é a base para chuva, temperatura, umidade e SMAP.
2. A imagem óptica não é diária e a barra precisa mostrar isso. Cada camada deve exibir a data efetiva servida, a idade em dias e um marcador de "sem observação". Isso evita o erro de mostrar uma imagem de três semanas como se fosse de hoje.
3. O polígono de cultura é um estado por safra, não uma série. Na barra de tempo ele aparece como uma faixa de safra, e a classe muda no limite da safra. Isso também resolve o seletor de temporada atual: a temporada passa a ser derivada da data, em vez de um menu separado.
4. Em Mato Grosso a faixa de safra pode vir do ZARC, que traz as janelas de plantio por município e cultura.
5. A extensão máxima comum da barra é 2015-04, quando o SMAP começa. O POWER vai a 1981 e serve como base climática.

### 4.1 Comparar dois momentos, com um número real

O POWER permite comparar a data escolhida com a normal de 36 anos. Para o ponto dos campos, janela de 1 de outubro a 11 de novembro de cada ano:

- Chuva acumulada em 2026: 171,9 mm.
- Mediana de 1991 a 2025: 224,9 mm, mínimo 88,9 mm, máximo 389,7 mm.
- 2026 está no percentil 20 dos 35 anos anteriores (posição 7 de 35).
- Dias com máxima de 35 C ou mais: 28 em 2026 contra mediana de 17.

Isso diz que o início desta safra está mais seco e mais quente que o típico para esse ponto, segundo a reanálise. É base `modelled` e a célula tem cerca de 0,5 grau.

## 5. O que aparece como imagem, o que vira gráfico e texto, e o que só alimenta features

### 5.1 A regra

Uma variável merece pixels na tela quando a sua resolução nativa é menor que o objeto que o usuário está olhando. Se for maior, o valor é constante sob o objeto e mostrar como mapa só desenha blocos.

Aplicada aos polígonos do ponto dos campos (mediana 22,4 ha, p10 1,5 ha, p90 151 ha, valores computados da seção 2.3):

| Resolução nativa | Área do pixel | Pixels no polígono mediano | Veredito |
|---|---|---|---|
| SMAP, IMERG, POWER, 9 km a 55 km | 8.100 ha ou mais | menos de 1 | Mesmo valor para cerca de 88 polígonos. Número e gráfico |
| MODIS 250 m | 6,25 ha | 3,6 | Só para polígonos grandes. No p10, 0,24 pixel por polígono |
| HLS 30 m | 0,09 ha | cerca de 250 | Imagem e estatística por polígono |
| Sentinel-2 10 m | 0,01 ha | cerca de 2.240 | Imagem e estatística por polígono |

O número de 88 polígonos por célula SMAP é computado: 900 polígonos em 3 por 3 tiles de zoom 12 (cerca de 82.500 ha), dividido por 10,2 células de 8.100 ha.

### 5.2 Classificação

**Imagem de fato (raster ou vetor na tela)**

- Satélite de fundo (Esri, EOX ou Sentinel-2 cor verdadeira).
- Polígonos de cultura, como camada vetorial translúcida colorida por classe.
- NDVI ou EVI do Sentinel-2 ou HLS, recalculado por data, como imagem do campo.
- NDVI MODIS de 250 m como contexto regional, não como leitura de talhão.
- IMERG de 30 minutos como animação regional (tempestade passando). Não como leitura de campo.

**Gráfico e texto por polígono**

- SMAP e SMAP L4: uma série por polígono com o valor da célula que o cobre, rotulada com a resolução e o aviso de que 88 vizinhos dividem o valor.
- Chuva, temperatura, umidade de raiz e evapotranspiração do POWER: séries diárias, acumulados e comparação com a normal.
- NDVI médio do polígono por data de Sentinel-2: série irregular, com ponto em cada cena válida.
- Balanço hídrico: chuva menos demanda, com a umidade de solo como âncora. É gráfico de três números, não imagem.
- Qualidade do solo, medida em texto: SoilGrids no ponto dos campos devolveu argila 225 g/kg, areia 635 g/kg, pH 5,0 (valor 50 com fator 10) e carbono orgânico de 22,2 g/kg em 0 a 5 cm, caindo para 16,2 e 9,1 g/kg nas camadas de 5 a 15 e 15 a 30 cm. Conversões pelo fator `d_factor` da resposta. É modelo de 250 m estático, então vira cartão de texto e não mapa.

**Só alimenta features, nunca aparece como imagem**

- Janelas de plantio do ZARC, para marcar na barra de tempo a faixa permitida.
- Percentil de chuva e contagem de dias quentes contra a normal, para uma frase de alerta.
- Maior veranico, graus-dia e dias de geada, para pontuar cenários de rotação.
- Classe MapBiomas e histórico de segunda safra, para montar a sequência de rotação atual.
- Perda florestal Hansen por campo, como bandeira de conformidade.
- Área do polígono e estatística municipal do IBGE, como contexto de escala.

### 5.3 Respostas diretas às suas perguntas

- Qualidade do solo: aparece como texto e gráfico, e como entrada para o motor. Não vale uma imagem, porque a fonte de acesso aberto é modelo estático de 250 m.
- Balanço hídrico: gráfico e texto. Nenhuma fonte entrega o balanço como imagem de campo.
- Animações: só para variáveis com estrutura espacial e cadência alta em escala regional, que são IMERG e SMAP. Para o campo, a animação útil é uma sequência de imagens Sentinel-2 ou HLS nas datas em que existem.
- Comparar momentos: dois lados de tela fazem sentido para NDVI de Sentinel-2 ou HLS, que têm detalhe espacial. Para o resto, a comparação é um delta numérico e um gráfico com as duas datas marcadas.

## 6. Features novas, em ordem de dependência

Continuam o catálogo do relatório anterior. Cada uma traz pergunta, mudança técnica, como testar e critério de aceite.

### 6.1 Polígonos e fundo

**F-26 Polígonos de campo a partir do Trazo3**
Pergunta: o usuário vê cada plantação com a sua região, como no crop-map?
Mudança: fonte vetorial no MapLibre apontando para `trazo3.pmtiles` pelo protocolo `pmtiles`, camada `trazo`, preenchimento colorido por `mbmode24` e contorno em linha. O app já usa MapLibre.
Teste: com o mapa centrado em -55,27 / -11,91 no zoom 10, `map.querySourceFeatures('trazo', {sourceLayer: 'trazo'})` deve devolver milhares de feições, a mesma ordem de grandeza dos 3.388 que a leitura direta do tile deu. A contagem exata pode diferir porque o MapLibre deduplica feições cortadas entre tiles.
Aceite: polígonos coloridos visíveis a partir do zoom definido, clique devolve `Id` e `mbmode24`.

**F-27 Nível de visão geral para zoom baixo**
Pergunta: como evitar tile de 1 a 7 MB abaixo do zoom 8?
Mudança: gerar um PMTiles de visão geral para Mato Grosso com `tippecanoe`, fundindo por classe como o crop-map faz em `08_fields_low.sh`, ou ocultar a camada abaixo do zoom 8.
Teste: tamanho gzip por tile em z5, z6 e z7 abaixo de 300 KB.
Aceite: nenhum tile da visão geral passa do limite e a classe dominante continua legível.

**F-28 Cor e legenda por classe MapBiomas**
Pergunta: o que significa cada cor?
Mudança: tabela id para nome e cor com a legenda oficial da Coleção 10 (seção 2.2), com o rótulo `modelled` e o ano 2024 na própria legenda.
Aceite: toda classe presente no tile tem nome e cor, e uma classe fora da tabela mostra "classe não mapeada" em vez de ficar sem cor.

**F-29 Fundo de satélite separado**
Pergunta: o polígono fica sobre uma imagem real do solo?
Mudança: camada raster de fundo selecionável (Esri com chave, EOX, ou Sentinel-2 cor verdadeira), com a atribuição que a licença exige impressa no mapa, e o preenchimento do polígono com opacidade em torno de 0,35 a 0,5.
Teste: renderizar o mesmo enquadramento com 0,85 e com 0,4 e comparar visualmente se a borda do talhão e a imagem aparecem juntas.
Aceite: a atribuição da fonte escolhida aparece em tela, e a imagem fica visível por baixo do polígono.

**F-30 Clique no polígono vira o campo do app**
Pergunta: como o campo selecionado passa a ser real e não do fixture?
Mudança: o `select_field` do registro de comandos aceita o `Id` do polígono; o painel de cenários e a evidência passam a ser montados a partir dele. O fixture de três campos continua como modo de demonstração.
Aceite: clicar em um polígono carrega área, classe, clima e solo daquele polígono, e a seleção sobrevive ao recarregar.

### 6.2 Tempo

**F-31 Timeline diária global**
Pergunta: o que mudou ao longo do tempo, em vez de temporadas?
Mudança: um controle de data em dias, de 2015-04 até a última data válida, que substitui `SeasonSelect`. Cada camada resolve a data efetiva por regra de "última observação anterior" e mostra a idade em dias.
Teste: com a data em 2026-11-12, IMERG mostra 2026-11-12, SMAP mostra 2026-11-11 e o NDVI de Sentinel-2 mostra a cena clara mais recente, cada uma com a idade rotulada.
Aceite: nenhuma camada exibe imagem sem a sua data real e a idade.

**F-32 Trilha de disponibilidade**
Pergunta: em que dias existe observação de fato?
Mudança: por camada, uma faixa com marcas nos dias válidos. Para Sentinel-2, as marcas vêm da busca STAC com o filtro de nuvem.
Aceite: a faixa do Sentinel-2 mostra 18 marcas para 2026-09-15 a 2026-11-14, com 6 destacadas como claras.

**F-33 Faixa de safra na barra de tempo**
Pergunta: em que fase da safra estamos?
Mudança: janelas de plantio do ZARC por município e cultura desenhadas como faixa. Troca o conceito de temporada por data.
Aceite: a faixa vem do CSV do ZARC e cita a portaria de origem.

**F-34 Comparação de dois momentos**
Pergunta: como estava antes e como está agora?
Mudança: divisor de tela com duas datas para NDVI de Sentinel-2 ou HLS, e para as variáveis contínuas um painel de delta com as duas datas marcadas no gráfico.
Aceite: as duas datas aparecem rotuladas e o delta bate com a diferença calculada.

**F-35 Normais climáticas e percentil**
Pergunta: este período está acima ou abaixo do normal?
Mudança: série POWER de 1991 a 2025 para o ponto, com cache, e função que devolve o percentil de uma janela. Já há o exemplo medido: 171,9 mm no percentil 20.
Teste: reproduzir 224,9 mm de mediana e o percentil 20.
Aceite: a frase na tela cita a janela, a base `modelled` e o tamanho da célula.

### 6.3 Dado por polígono

**F-36 Série NDVI por polígono com Sentinel-2**
Pergunta: como estava a vegetação neste talhão em cada data?
Mudança: para cada cena clara, ler as bandas `B04` e `B08` por range request, recortar pelo polígono e calcular a média de NDVI, mascarando com `SCL`. Sem login.
Teste: comparar com o NDVI do GIBS no mesmo dia para o mesmo polígono, esperando valores próximos mas não idênticos por causa da resolução.
Aceite: série irregular com um ponto por cena válida e a cobertura válida do polígono em cada ponto.

**F-37 Cartão de solo por polígono**
Pergunta: qual é a textura e a acidez do solo aqui?
Mudança: consulta ao SoilGrids por centroide do polígono, com as três profundidades e a conversão pelo `d_factor`.
Aceite: o cartão mostra argila, areia, pH e carbono em unidades convertidas e a nota de que é modelo de 250 m.

**F-38 Histórico de rotação com MapBiomas**
Pergunta: o que foi plantado antes neste local?
Mudança: sequência soja, milho, algodão por ano e ciclos por ano, lida do MapBiomas. Depende da decisão de acesso da seção 8.
Aceite: a sequência alimenta a "rotação atual" no lugar do campo `Crop history` do fixture e traz a classe e o ano.

**F-39 Contexto municipal**
Pergunta: este campo é grande ou pequeno em relação ao município?
Mudança: consulta ao SIDRA 1612 (área plantada) e razão entre a área do polígono e a do município.
Aceite: o texto mostra o valor do IBGE com ano e fonte.

## 7. Ordem por dependência

    F-26  polígonos Trazo3
      -> F-27 visão geral para zoom baixo
      -> F-28 legenda por classe
      -> F-29 fundo de satélite
      -> F-30 clique vira campo
           -> F-36 série NDVI por polígono
           -> F-37 cartão de solo
           -> F-39 contexto municipal
    F-31  timeline diária
      -> F-32 trilha de disponibilidade
      -> F-33 faixa de safra
      -> F-34 comparação de dois momentos
    F-35  normais climáticas (depende do cliente POWER, F-08 do relatório anterior)
    F-38  histórico de rotação (depende de acesso ao MapBiomas)

Dependências com o catálogo anterior: F-31 usa o seletor de data por camada (F-05) e o registro de camadas com matriz própria (F-01). F-36 estende a extração por polígono (F-11).

## 8. Decisões abertas

- Fundo de satélite: Esri com chave (melhor imagem, condição de licença), EOX (sem chave, mas não comercial e 10 m) ou Mapbox e MapTiler (chave). Define a aparência do app.
- Acesso ao Earthdata: não consegui ver a sessão. O navegador gerenciado e o local mostram o formulário de login em `urs.earthdata.nasa.gov` e o cofre do Hermes está vazio. Se você quiser que eu use o login, o caminho é o `save_login` do cofre, que pede a senha num campo mascarado e nunca passa por mim. Nada dos itens F-26 a F-35 depende disso. O Earthdata abre HLS completo, SMAP nativo e ECOSTRESS.
- MapBiomas por Google Earth Engine ou plataforma: o bucket anônimo não abre. F-38 precisa de uma conta Google com Earth Engine, ou do download manual pela plataforma.
- Hospedagem dos polígonos: ler direto do Source Cooperative, que funciona hoje e não custa nada, ou extrair um recorte de Mato Grosso para um arquivo próprio. O recorte protege a demonstração se a fonte ficar fora do ar, a mesma lógica do tile de reserva que o proxy já tem. O comando `pmtiles extract` com caixa existe no CLI do pmtiles, mas não rodei aqui.
- O que é "campo": polígono do Trazo3 ou os três do fixture. Muda o banco e as features de número.
- Escopo geográfico: só Mato Grosso, ou também Goiás, Pará e outros estados que o Trazo3 cobre.

## 9. Limites e armadilhas

- `mbmode24` é um ano só e só cultura de verão. Não responde "o que foi plantado em 2025/26".
- Os polígonos são previsão de modelo, IoU de pixel de 79,17 por cento no teste de Mato Grosso segundo o README. Bordas erram.
- As áreas medidas na seção 2.3 vêm de fragmentos de tile e subestimam a mediana.
- SMAP, IMERG e POWER não separam campos vizinhos. Cerca de 88 polígonos compartilham o mesmo valor SMAP.
- O POWER é reanálise, não medição, e tem célula de cerca de 0,5 grau.
- Em 61 dias, o Sentinel-2 passou 18 vezes e só 6 cenas tiveram menos de 20 por cento de nuvem. É começo de estação chuvosa; no inverno seco a taxa deve ser melhor, o que não medi.
- O SoilGrids é modelo estático de 250 m com API em beta.
- A EOX 2018 a 2024 é CC BY-NC-SA. A Esri pede licença. Nada disso foi decidido.
- O Trazo3 depende de `data.source.coop` para funcionar ao vivo.

## 10. Comandos para reproduzir

Cabeçalho e um tile do PMTiles, sem baixar o arquivo:

    curl -sI -H 'Range: bytes=0-126' https://data.source.coop/wri-data-lab/trazofields/trazo3-fields/trazo3.pmtiles

Ler tiles por range request em Python, com `pip install pmtiles mapbox-vector-tile requests`:

    from pmtiles.reader import Reader
    # passe uma função get_bytes(offset, length) que faz a requisição com o cabeçalho Range

Cenas Sentinel-2 sobre o ponto, sem login:

    curl -s -X POST https://earth-search.aws.element84.com/v1/search -H 'Content-Type: application/json' \
      -d '{"collections":["sentinel-2-l2a"],"intersects":{"type":"Point","coordinates":[-55.27,-11.91]},"datetime":"2026-09-15T00:00:00Z/2026-11-14T23:59:59Z","limit":100}'

Solo no ponto:

    curl -s 'https://rest.isric.org/soilgrids/v2.0/properties/query?lon=-55.27&lat=-11.91&property=soc&property=clay&property=sand&property=phh2o&depth=0-5cm&value=mean'

Soja em Mato Grosso, IBGE:

    curl -s 'https://apisidra.ibge.gov.br/values/t/1612/n3/51/v/109/p/last%205/c81/2713'

Normal de chuva, com o ponto dos campos:

    curl -s 'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG&longitude=-55.27&latitude=-11.91&start=19910101&end=20261111&format=JSON'

## 11. Atualização de 2026-11-14, fim da tarde

Esta seção corrige e completa as seções 2.4, 3 e 8 depois das respostas do usuário. Onde houver conflito, vale esta seção.

### 11.1 Google Map Tiles API em MapLibre

Resposta curta: a política do Google admite renderizador de terceiros e sobreposição de dados de terceiros, então tecnicamente cabe em MapLibre. Não é de graça nem sem chave, e as restrições mudam a arquitetura. Li as páginas "Policies", "Overview", "2D Tiles overview" e "Usage and billing" do Map Tiles API no navegador hoje. Não chamei a API, porque não há chave.

O que a documentação diz:

- A página de políticas tem uma seção "Display the Google Maps logo with third-party renderers" e uma regra para "overlay third-party (non-Google) geospatial data": o logo e a atribuição do Google não podem ser cobertos, e a atribuição dos dados de terceiros tem de ficar claramente separada.
- É obrigatório ter faturamento ativado no projeto e mandar chave de API ou token OAuth em toda requisição.
- Antes dos tiles é preciso pedir um session token com `mapType` (satélite, no nosso caso).
- A cota padrão é de 15.000 requisições de tile 2D por projeto por dia, ajustável. Preço: não verificado, a página de preços não carregou.
- Não se pode fazer pre-fetch, indexar, armazenar nem cachear conteúdo fora das condições estreitas dos termos.
- O uso é só de visualização. Proibidos: análise de imagem, interpretação por máquina, detecção de objetos, extração de geodados e uso offline.
- Seção 3.2.3(c) dos termos: não criar conteúdo derivado do conteúdo do Google, por exemplo traçar ou digitalizar feições da imagem de satélite.
- Recordado, não verificado nesta rodada: o endereço de tile 2D tem a forma `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=...&key=...`.

O que isso muda no app:

- O proxy atual guarda tiles em disco e serve um tile de reserva quando o upstream cai. Isso não pode ser aplicado ao Google. Os tiles teriam de ir do navegador direto ao Google, com a chave restrita por referenciador, e o modo offline da demonstração não existiria para esse fundo.
- Os polígonos do Trazo3 não violam a regra de derivação, porque vêm de outra fonte e não foram traçados sobre imagem do Google.
- A série NDVI por polígono (F-36) continua saindo do Sentinel-2, nunca do fundo do Google, por causa da proibição de análise de imagem.
- Para o usuário usar, ele precisa criar um projeto no Google Cloud com faturamento ativo e uma chave. Eu não faço isso e não guardo cartão.

Decisão registrada: o fundo é uma interface com adaptadores. O adaptador padrão é o EOX Sentinel-2 cloudless 2024 (já testado, sem chave, atribuição obrigatória, CC BY-NC-SA 4.0). O adaptador do Google fica especificado e só liga se existir `VITE_GOOGLE_MAPS_API_KEY`. Sem chave, o app não pede nada ao Google.

### 11.2 MapBiomas Coleção 11

A Coleção 11 já foi lançada: o MapBiomas anunciou em 2026-08-12 os mapas anuais de 1985 a 2025, 30 m, mais de 30 classes. A legenda da Coleção 11 foi publicada em PDF em 2026-08.

Para agricultura, a Coleção 11 traz, segundo as páginas oficiais dos produtos lidas hoje:

| Produto | Período | Classes | Observação |
|---|---|---|---|
| Uso agrícola, 1ª safra | 1985 a 2025 | 9 classes: 39 Soja, 20 Cana, 40 Arroz, 62 Algodão (beta), 41 Outras Lavouras Temporárias, 46 Café, 47 Citrus, 35 Dendê, 48 Outras Lavouras Perenes | Foca em cultivos de verão, de outubro a março. Legenda lida do CSV oficial da Coleção 11 |
| Uso agrícola, 2ª safra (beta) | 2000 a 2025 | 3 classes: Milho de segunda safra (código 1), Algodão de segunda safra (62), Outras culturas de segunda safra (41) | Só mapeia PR, SP, MG, MS, MT, GO, TO, BA, PI e MA |
| Número de ciclos, 10 m e irrigação | pelo repositório `mapbiomas/brazil-agriculture` (pastas `cycles`, `irrigation`, `lulc_10m`, `second_crop`) | | Licença do repositório MPL-2.0 |

Números do factsheet Agropecuária da Coleção 11 (2026-11-11), para o Brasil:

- Soja em 2025: 44,2 Mha.
- Segunda safra em 2025: 29,2 Mha cultivados, 72,9 por cento da área mapeada.
- 51,1 por cento da área de soja de primeira safra de 2025 teve milho mapeado na segunda safra. 21,9 por cento não teve outro cultivo mapeado.

Armadilhas:

- O código do milho de segunda safra é 1, e no produto de primeira safra o código 1 não existe como cultura. Misturar os dois mapeamentos por código sem separar o produto produz erro silencioso.
- O `mbmode24` do Trazo3 é de ano 2024 e de uma coleção anterior, não verificada qual. A recomendação é recalcular a classe de cada polígono a partir da Coleção 11 de 2025 e guardar o ano e a coleção junto.
- O Trazo3 usa Sentinel-2 de 2023-07 a 2024-07. Campos abertos depois dessa janela não existem no arquivo.
- Acesso: pela Plataforma MapBiomas (download), pelos assets do Google Earth Engine e por tabelas de estatística em xlsx por estado e bioma. A página de download direto de GeoTIFF devolveu "não encontrada" para o meu navegador, e o bucket público anônimo continua devolvendo 401 e 403. Então o caminho prático é um download manual ou um export no Earth Engine recortado em Mato Grosso, feito uma vez, e um passo de estatística zonal por polígono offline.
- Licença: CC BY 4.0 com citação no formato que o MapBiomas pede.

### 11.3 Earthdata

Você disse que está logado no navegador do Hermes. No navegador que eu controlo, `https://urs.earthdata.nasa.gov/profile` redireciona para `/home` e mostra o formulário de senha. O navegador gerenciado e a cópia local do seu perfil compartilham o mesmo espaço de trabalho e mostram as mesmas abas, e nenhuma está logada. A sessão que você abriu deve estar em outra instância, provavelmente a janela embutida do Desktop, que eu não consigo dirigir pelo `browser_exec`. Nada das features desta pesquisa depende disso. Para HLS completo, SMAP nativo e ECOSTRESS, o caminho é o `save_login` do cofre no navegador de automação, com senha em campo mascarado.

## 12. Proveniência

- Repositório e post do crop-map: `gh api repos/SabhyaC26/crop-map`, README, `Makefile`, `pipeline/05_tiles.sh`, `pipeline/08_fields_low.sh`, `site/src/layers/fields.ts`; post via `api.fxtwitter.com/i/status/2109751973625110827`; redirecionamento do t.co medido com `curl`.
- Trazo3: página do Source Cooperative `wri-data-lab/trazofields`, listagem do bucket S3, `README.md` da coleção `trazo3-fields`, leitura direta do `trazo3.pmtiles` por range request.
- Legenda MapBiomas: PDF "Legenda Coleção 10" e factsheet de Agricultura e Irrigação da Coleção 10, ambos lidos com `pdftotext`.
- Basemaps: tiles reais do Esri, EOX e GIBS no ponto -55,27 / -11,91, três deles vistos por imagem; páginas de licença da EOX, documentação do Esri e da Mapbox.
- Cenas Sentinel-2: busca STAC do Element84 Earth Search.
- Clima: API POWER, 36 anos, ponto dos campos.
- Solo, SIDRA e ZARC: chamadas reais às APIs do ISRIC, do IBGE e do portal de dados do Ministério da Agricultura.
- Estado do Earthdata: `urs.earthdata.nasa.gov/home` nos dois navegadores e `browser_vault list`.
- Dados brutos: `field-shift-app/artifacts/data-probe-2026-11-14-polygons-timeline.json`.
