# Inferência de cultura e de janela de plantio por satélite, sem geometria de polígono

Pesquisa para o Field Shift, tarefa `t_e83fdff8`, escrita em 2026-11-14 pelo perfil `data-scientist`.

Responde a uma pergunta: quando o polígono não cobre um campo, ou não diz o que está plantado nele, dá para inferir a cultura e a janela de plantio só com satélite? A ordem das seções é por dependência técnica: primeiro o que funciona sem credencial, depois o que exige login, depois o custo. Todos os números crus estão em `field-shift-app/artifacts/data-probe-crop-inference.json`, sha256 `e60902dbbbec80d9828857e208f865c31fb4a5e8dd093ae2650f3cbfcf5a9204`, repetido na seção 10.

Nenhuma chamada desta pesquisa usou credencial. Nenhuma toca em `specs/` nem nos blocos 1 a 4.

## 0. Resumo

1. **Não substitui o polígono.** A fronteira do talhão não sai de um índice de vegetação de uma data: a segmentação por limiar de NDVI fundiu uma janela de 10 por 10 km em um único componente de 15.072 ha, com IoU de 0,006 a 0,028 contra os polígonos do Trazo3. Para desenhar o talhão, a geometria vetorial continua necessária.
2. **Complementa com força.** Uma série de quatro bandas do Sentinel-2 L2A lida por HTTP range, sem login, entregou a estrutura de duas safras nos três campos do fixture: um ciclo com green-up em 5 a 20 de novembro de 2025 e outro com green-up em 5 a 10 de março de 2026. Isso é exatamente o par soja e segunda safra que o app chama de rotação atual, e não veio de nenhum produto pronto.
3. **Não identifica a cultura dentro do par.** O pico de NDVI dos dois ciclos difere em no máximo 0,03 (0,835 a 0,848 contra 0,815 a 0,834). O que separa os dois cultivos é o calendário, não o espectro. A satélite diz "cultura de verão seguida de segunda safra curta", não diz "soja" nem "milho" por conta própria.
4. **A data de plantio é uma faixa, não um dia.** O green-up é o único marco observável. Com o atraso de 10 a 20 dias entre plantio e resposta espectral, a janela estimada cai dentro da janela do ZARC nos dois ciclos. Mas o green-up da segunda safra está dentro de um buraco de 40 a 45 dias sem observação válida, em todos os três campos: essa data é interpolada, não medida.
5. **Os produtos prontos não resolvem.** O ESA WorldCereal é de 2021, tem classe de milho e de cereais mas não tem soja, e cada produto é um zip de 3,8 GB a 25,0 GB. O MapBiomas tem a classe certa e o ano certo, mas o acesso passa pelo Google Earth Engine. O GLAD tem soja anual até 2024 e lê por range, mas não tem milho e não declara licença. Nenhum deles distingue soja de milho no mesmo talhão em Mato Grosso, de graça e sem login.
6. **O caminho prático é híbrido.** Polígono do Trazo3 para geometria e rótulo provisório, série Sentinel-2 por polígono para datar o ciclo e conferir a classe. O polígono continua obrigatório para desenhar e para contar área; a satélite entra como datação e como checagem, e como estimativa de baixa confiança quando não há polígono.

## 1. O que foi medido, e como

Quatro rotas foram testadas com chamadas reais, não com leitura de literatura.

| Rota | O que foi executado | Resultado |
|---|---|---|
| A. Série temporal Sentinel-2 | busca STAC, 126 cenas lidas por COG em 4 bandas, índices por polígono e por caixa, detector de fenologia por regra | funciona sem login, entrega a estrutura de duas safras |
| B. Produtos prontos | 8 produtos, com status HTTP, bytes, licença e cobertura quando publicada | nenhum atende soja mais milho em 2025/26 sem login |
| C. Híbrido | classe do Trazo3 contra soja do GLAD no mesmo polígono | concordam em soja, com 47 a 79 por cento da área |
| D. Fronteira sem vetor | limiar de NDVI mais componentes conexos em três datas | não recupera talhão, resultado negativo |

Ponto de medida: os três centros do fixture, `[-55.27, -11.91]`, `[-55.24, -11.94]` e `[-55.21, -11.97]`, no município de Santa Carmem, IBGE 5107248, em Mato Grosso. A caixa que contém os três mede 0,025 por 0,02 grau, cerca de 600 ha por campo. Os campos do fixture são sintéticos: têm centro, polígono de retângulo de 2,7 por 2,2 km e uma sequência declarada "Soybean → Corn" em `field-shift-app/backend/fixtures/field-scenarios.json`, sha256 `2425a58f61030309e9184a6952bfbc18384a987db6f6c2067b9bf89beee549e6`. Essa sequência não tem data, não tem fonte e não foi verificada em campo. É a verdade de referência mais fraca possível: três pontos, rótulo declarado, sem data. Trato isso como hipótese a testar, não como acerto a confirmar.

O polígono de verdade foi lido do Trazo3: os três centros caem em polígonos de 101,0, 418,1 e 139,2 ha, todos com `mbmode24` igual a 39, que é soja na legenda do MapBiomas.

## 2. Rota A: série temporal do Sentinel-2 sem login

### 2.1 Acesso e custo

Endpoint: `https://earth-search.aws.element84.com/v1/search`, coleção `sentinel-2-l2a`, sem chave e sem conta. Duas buscas por caixa, uma para a safra 2025/26 e outra para o começo de 2026/27, devolveram 1.835.461 e 389.110 bytes, 126 cenas únicas entre 2025-09-02 e 2026-11-11.

Cada cena traz COGs públicos em `https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/{utm}/{banda}/{ano}/{mes}/{id}/{banda}.tif`. Requisição por range nas bandas usadas, todas com HTTP 206 e sem credencial:

| Banda | Bytes do arquivo | Uso |
|---|---|---|
| B04 red | 181.332.255 | NDVI, EVI |
| B08 nir | 229.759.473 | NDVI, EVI, NDWI |
| B03 green | 190.122.990 | EVI, NDWI |
| SCL | 1.127.712 | máscara de nuvem, sombra e nodata |
| B11 swir16 | 53.019.381 | não usada nesta rodada |

Custo medido: 4 leituras por cena, janela de 1.336 por 1.316 pixels em EPSG:32721, que é 1,46 por cento do tile. Se a janela inteira tivesse de ser transferida, o teto seria 8.784.178 bytes por cena. O COG só transfere os blocos que cobrem a janela, então o valor real fica abaixo desse teto; não instrumentei o GDAL para medir byte a byte, e por isso reporto o teto, não uma estimativa disfarçada de medida. Tempo de leitura: 6,14 a 14,27 s por cena. As 126 cenas rodaram em 416,9, 411,6 e 500,4 s em três processos paralelos, cerca de 8 minutos no total.

Uma armadilha que custou uma rodada inteira: a reflectância. Os itens do Earth Search trazem `earthsearch:boa_offset_applied` igual a `true` e, mesmo assim, o `raster:bands` do asset declara `offset: -0.1`. Aplicar o offset de novo levou o vermelho a valores negativos (DN mediano 412, que viraria -0,0588) e descartou dois terços dos pixels de uma cena clara. A regra correta para esta coleção é `reflectance = DN * 0.0001`, sem offset. A prova está no JSON, no campo `reflectance_rule` e nos valores de DN registrados antes da correção.

### 2.2 A máscara muda o resultado

O fixture define o campo como retângulo de 600 ha. O Trazo3 define o campo como polígono de 101 a 418 ha. As duas médias não são a mesma coisa, e a diferença não é cosmética:

| Campo | Área do polígono | NDVI médio em 2026-07-31 (polígono) | NDVI médio na mesma data (caixa) |
|---|---|---|---|
| Field 01 | 101,0 ha | 0,3095 | 0,6276 |

A caixa mistura talhão, pasto e mata. Usar a caixa para fenologia suaviza a curva e desloca as datas. Todas as conclusões abaixo usam o polígono do Trazo3, e a caixa aparece só como comparação.

Isso não significa que o polígono do Trazo3 seja uma unidade de manejo limpa. A distribuição de NDVI dentro do polígono mostra o contrário em algumas datas:

| Data | Campo | NDVI abaixo de 0,35 | NDVI acima de 0,65 | p10 e p90 |
|---|---|---|---|---|
| 2025-10-04 | Field 01 | 77,6 por cento | 20,5 por cento | 0,155 e 0,776 |
| 2025-10-04 | Field 02 | 77,7 por cento | 18,9 por cento | 0,165 e 0,802 |
| 2026-01-15 | Field 01 | 0,0 por cento | 96,8 por cento | 0,794 e 0,907 |
| 2026-01-15 | Field 02 | 10,1 por cento | 24,2 por cento | 0,349 e 0,863 |

Em outubro os três polígonos são bimodais: uma parte já plantada, outra nua. Em janeiro, o Field 01 é homogêneo (96,8 por cento de dossel) e o Field 02 não é. Leitura: o polígono do Trazo3 no zoom 12 pode ser um talhão só ou a união de talhões vizinhos. Para estatística por campo, isso obriga a reportar a dispersão interna junto com a média. O spread mediano de p90 menos p10 dentro do polígono foi 0,609, 0,625 e 0,664 nos três campos.

### 2.3 Fenologia detectada

Método, reproduzível: manter cenas com `valid_frac` maior ou igual a 0,5, interpolar o NDVI em grade de 5 dias, suavizar com média móvel centrada de 15 dias, marcar verde quando o NDVI passa de `p10 + 0,5 * (p90 - p10)` da própria estação, e tratar um período verde de 45 dias ou mais como um ciclo. Parâmetros todos no campo `method` do JSON.

| Campo | Ciclo 1 green-up | Pico | Fim | Duração | Ciclo 2 green-up | Pico | Fim | Duração |
|---|---|---|---|---|---|---|---|---|
| Field 01 | 2025-11-20 | 2026-01-09, NDVI 0,848 | 2026-01-24 | 65 d | 2026-03-05 | 2026-04-19, NDVI 0,815 | 2026-06-08 | 95 d |
| Field 02 | 2025-11-05 | 2025-12-25, NDVI 0,838 | 2026-01-24 | 80 d | 2026-03-05 | 2026-04-24, NDVI 0,826 | 2026-05-29 | 85 d |
| Field 03 | 2025-11-05 | 2026-01-04, NDVI 0,835 | 2026-01-29 | 85 d | 2026-03-10 | 2026-03-30, NDVI 0,834 | 2026-05-29 | 80 d |

Os três campos mostram dois ciclos com um intervalo de solo nu entre eles. A caixa do fixture dá a mesma estrutura, com datas deslocadas em até 10 dias (Field 01, ciclo 1: 2025-11-15 na caixa contra 2025-11-20 no polígono). A estrutura é robusta à escolha da máscara; a data não é, e essa diferença de 5 a 10 dias é uma medida honesta da incerteza de método.

### 2.4 O que separa soja de milho, e o que não separa

Os picos dos dois ciclos, no mesmo polígono:

| Campo | NDVI pico ciclo 1 | NDVI pico ciclo 2 | EVI pico ciclo 1 | EVI pico ciclo 2 | NDWI pico ciclo 1 | NDWI pico ciclo 2 |
|---|---|---|---|---|---|---|
| Field 01 | 0,848 | 0,815 | 0,833 | 0,702 | -0,761 | -0,765 |
| Field 02 | 0,838 | 0,826 | 0,780 | 0,724 | -0,782 | -0,768 |
| Field 03 | 0,835 | 0,834 | 0,803 | 0,725 | -0,741 | -0,761 |

O NDVI de pico é praticamente o mesmo nos dois cultivos, com diferença máxima de 0,03. O EVI separa um pouco mais, com 0,06 a 0,13 de diferença, mas o número de observações dentro de 10 dias do pico é 1 a 3 por ciclo, então a diferença não tem base estatística para virar classificador. O NDWI não separa nada.

Conclusão direta: com essas bandas e essa cadência, o espectro não identifica a cultura. O que identifica é o calendário. Um ciclo que começa em novembro e colhe em janeiro, seguido de outro que começa em março e termina em maio ou junho, é a assinatura de verão mais segunda safra curta. Um segundo ciclo que ficasse verde até agosto ou setembro seria candidato a algodão, não a milho. O detector de regra consegue dizer isso; não consegue dizer se o primeiro ciclo é soja ou feijão, nem se o segundo é milho ou sorgo.

### 2.5 A janela de plantio é uma faixa

O green-up precede o plantio. Adoto 10 a 20 dias entre plantio e resposta espectral detectável (emergência mais fechamento inicial de dossel). É premissa agronômica, não medida aqui, e está marcada como tal no JSON.

| Campo | Green-up ciclo 1 | Plantio implícito | Green-up ciclo 2 | Plantio implícito |
|---|---|---|---|---|
| Field 01 | 2025-11-20 | 2025-10-31 a 2025-11-10 | 2026-03-05 | 2026-02-13 a 2026-02-23 |
| Field 02 | 2025-11-05 | 2025-10-16 a 2025-10-26 | 2026-03-05 | 2026-02-13 a 2026-02-23 |
| Field 03 | 2025-11-05 | 2025-10-16 a 2025-10-26 | 2026-03-10 | 2026-02-18 a 2026-02-28 |

Contra o ZARC de Santa Carmem para 2025/26, lido do snapshot do repositório (`zarc-mt-snapshot.json`, sha256 `b53c8a7be60948fccb72e5cfa108b95debfdd932f5f15b315363d42a332dfde9`):

- Soja, todos os níveis de risco: 2025-10-01 a 2026-01-10. A 20 por cento de risco, início em 2025-10-11 para os solos AD1 a AD3 e 2025-10-01 para AD4 a AD6.
- Milho de segunda safra, todos os níveis: 2026-01-01 a 2026-03-10, variando com o solo. A 20 por cento de risco o fim cai entre 2026-01-31 e 2026-02-28.

As duas estimativas caem dentro das janelas. Isso é o máximo que a satélite entrega: confirma que o plantio aconteceu dentro da janela legal, não diz o dia. A janela do ZARC para soja tem 102 dias; a estimativa por satélite tem 10 dias quando o green-up é observado e 40 a 45 dias quando ele cai em buraco de observação. É um ganho real, mas de resolução grosseira.

Resumo por campo, que é a entrega mínima desta pesquisa:

| Campo | Estrutura detectada | Plantio do ciclo 1 | Plantio do ciclo 2 | Incerteza do ciclo 1 | Incerteza do ciclo 2 |
|---|---|---|---|---|---|
| Field 01 | dois ciclos, verão e segunda safra curta | 2025-10-31 a 2025-11-10 | 2026-02-13 a 2026-02-23 | green-up observado, faixa de 10 dias mais a premissa de 10 a 20 dias | green-up interpolado em buraco de 45 dias |
| Field 02 | dois ciclos, verão e segunda safra curta | 2025-10-16 a 2025-10-26 | 2026-02-13 a 2026-02-23 | green-up observado, faixa de 20 dias mais a premissa | green-up interpolado em buraco de 40 dias |
| Field 03 | dois ciclos, verão e segunda safra curta | 2025-10-16 a 2025-10-26 | 2026-02-18 a 2026-02-28 | green-up observado, faixa de 20 dias mais a premissa | green-up interpolado em buraco de 40 dias |

Nenhuma das três linhas nomeia a cultura. A estrutura de dois ciclos é compatível com a sequência "Soybean → Corn" declarada na fixture, com o `mbmode24` igual a 39 do Trazo3 e com a soja do GLAD em 47 a 79 por cento da área do polígono. Três fontes concordam no verão; nenhuma delas prova o milho.

### 2.6 Limites medidos

Nuvem é o limite dominante, e ele atinge exatamente a época que importa.

| Mês | Cenas observadas | Cenas com 50 por cento ou mais de pixels válidos, Field 01 |
|---|---|---|
| 2025-10 | 9 | 4 |
| 2025-11 | 8 | 3 |
| 2025-12 | 10 | 1 |
| 2026-01 | 7 | 3 |
| 2026-02 | 5 | 0 |
| 2026-03 | 9 | 3 |

Fevereiro de 2026, que é o mês de plantio da segunda safra, não tem nenhuma cena utilizável em cinco tentativas. O green-up de março só pôde ser estimado porque cai dentro de um intervalo de 40 a 45 dias entre a última cena válida de janeiro ou fevereiro e a primeira de março. A interpolação linear atravessa esse buraco, e o valor de 5 a 10 de março é o ponto onde a reta cruza o limiar, não uma observação. A incerteza dessa data é o próprio buraco: 40 a 45 dias.

Números gerais: 126 cenas lidas, 60, 57 e 64 utilizáveis por campo, e 55, 46 e 49 cenas em que o polígono ficou totalmente mascarado. Na safra 2025/26 foram 104 cenas, 35 com menos de 20 por cento de nuvem e 36 com mais de 80 por cento.

Resolução: um pixel de 10 m tem 0,01 ha, então um polígono de 101 ha tem cerca de 10 mil pixels. Espaço não é o problema para a média do campo. O problema é que a média esconde a mistura interna descrita na seção 2.2, e que a cultura não está no espectro.

## 3. Rota B: produtos pré-computados

Cada linha abaixo foi testada com chamada real, e o status e os bytes estão no JSON.

| Produto | Resolução | Licença | Cobertura | Distingue soja de milho | Acesso sem login ou Earth Engine | Veredito |
|---|---|---|---|---|---|---|
| ESA WorldCereal 10 m 2021 v100 | 10 m | CC BY 4.0 | global, só 2021 | não tem classe de soja; tem milho e cereais | sim, mas zip de 3,8 a 25,0 GB por produto | insuficiente: sem soja, 4 anos de atraso, caro de baixar |
| MapBiomas Coleção 11, agricultura | 30 m, ciclos a 10 m | CC BY 4.0 | Brasil, 1985 a 2025 | sim, soja e milho de segunda safra em produtos separados | não: bucket anônimo nega, caminho é o Earth Engine | o dado certo, o acesso errado |
| GLAD South America soybean | 30 m | não declarada na página | América do Sul, 2001 a 2024 | só soja | sim, GeoTIFF direto, 315.114.876 bytes por ano | bom para soja, inútil para milho, licença indefinida |
| GLAD annual cropland 2015 a 2024 | 30 m | não declarada na página | global | não, só lavoura | Earth Engine ou download | só máscara de lavoura |
| CropHarvest | pontos | CC BY-SA 4.0 | global, 800 rótulos multiclasse no Brasil | rótulos, não mapa | sim, Zenodo | serve para treinar, não para responder |
| GEOGLAM Best Available e GDA CropID | 0,05 grau e 250 m | restrita ao USDA FAS | Brasil incluído | sim, milho de 1ª e 2ª safra, soja, algodão | não, e a licença não permite uso comercial | resolução e licença bloqueiam |
| Conab Mapeamento de Safras | vetor | termos da Conab, sem licença aberta declarada | Brasil, soja de 2015/16 a 2024/25 | soja mapeada; milho não confirmado | página de download existe, URL direto não resolvido | promissor, não verificável daqui |
| Canasat, INPE | vetor | não verificada | cana apenas | não | não: HTTP 403 | fora de escopo por cultura |

### 3.1 ESA WorldCereal

Fonte: `https://esa-worldcereal.org/en/products/global-maps` e `https://zenodo.org/records/7875105`, licença CC BY 4.0 confirmada pela API do Zenodo (registro com 21 arquivos, publicado em 2023-05-12).

A página oficial diz que a coleção publicada hoje só tem 2021, com mais produtos previstos para o fim de 2026. Os produtos são `tc-annual` (lavouras temporárias), `tc-maize-main` e `tc-maize-second` (milho), `tc-wintercereals` e `tc-springcereals` (trigo, cevada e centeio agrupados) e irrigação. Não existe classe de soja. Para o app, isso é decisivo: o produto não nomeia a cultura principal de Mato Grosso.

Fiz a pergunta que importa de forma direta: o ponto do fixture tem estação definida para milho? Baixei o `WorldCereal_AEZ.geojson` (762.000 bytes) do próprio registro e testei o ponto contra os 106 polígonos de zona agroecológica. O ponto cai na zona `aez_id` 20087, grupo 20000, e ela define:

| Estação | Início, dia do ano | Fim, dia do ano |
|---|---|---|
| `tc-annual` | 300 | 299 |
| `tc-maize-main` | 361 | 222 |
| `tc-maize-second` | 305 | 105 |
| `tc-wintercereals` | 83 | 299 |
| `tc-springcereals` | nulo | nulo |

Ou seja, o produto existe para o ponto. Mas o calendário da zona não bate com a prática local: `tc-maize-second` começa no dia 305, que é 1 de novembro, e termina no dia 105, que é 15 de abril. A segunda safra de Mato Grosso é plantada em fevereiro e colhida em junho. O rótulo de "segunda safra" do produto, nessa zona, não corresponde à safrinha local. Usar o produto exigiria validar o calendário por região, o que anula parte da vantagem de usar um produto pronto.

Custo de acesso: os zips do Zenodo vão de 3.813.149.175 bytes (`tc-maize-second_irrigation_confidence`) a 24.969.180.828 bytes (`tc-annual_temporarycrops_confidence`). Não há leitura por range útil dentro de um zip. Para um ponto em Mato Grosso, é baixar o produto inteiro.

### 3.2 MapBiomas Coleção 11

Fonte: `https://brasil.mapbiomas.org/downloads/` e `https://github.com/mapbiomas/user-toolkit`, licença CC BY 4.0 declarada no repositório oficial de ferramentas.

É o produto certo: 30 m, anual de 1985 a 2025, com uso agrícola de primeira safra (9 classes, incluindo soja e algodão beta) e segunda safra em beta desde 2000 (milho de segunda safra, algodão e outras), mais número de ciclos a 10 m. Distingue soja de milho de segunda safra, que é exatamente o que falta.

O acesso é o problema, e medi de novo: `https://mapbiomas.s3.amazonaws.com/` devolve 403 para listagem anônima; `mapbiomas-public.s3.amazonaws.com` e `mapbiomas-brazil.s3.amazonaws.com` devolvem 404 no formato testado, então o nome de bucket da pesquisa anterior não resolveu daqui. O caminho real é a plataforma MapBiomas ou os assets do Google Earth Engine, e os dois pedem conta Google com Earth Engine habilitado. Não é um login de satélite, é um login de plataforma, mas continua sendo login. A recomendação da pesquisa anterior de recalcular `mbmode24` a partir da Coleção 11 continua válida e continua bloqueada pelo mesmo acesso.

### 3.3 GLAD e UMD

Fonte: `https://glad.umd.edu/projects/commodity-crop-mapping-and-monitoring-south-america`. O produto de soja da América do Sul é anual de 2001 a 2024, 30 m, em GeoTIFF por ano. O arquivo de 2024 tem 315.114.876 bytes e responde HTTP 206 a requisição por range, ou seja, dá para ler só a janela do campo sem baixar o continente. Isso é uma vantagem concreta sobre o WorldCereal.

Duas ressalvas. A primeira: a página não declara licença. Não achei texto de licença no HTML baixado. Para um app comercial, isso é bloqueio até haver confirmação escrita. A segunda: o produto só tem soja. Não há arquivo de milho com o mesmo nome (`SouthAmerica_Corn_2024.tif` devolve 404).

O que ele diz no ponto: dentro dos polígonos do Trazo3, a fração de pixels de soja foi 0,691, 0,733 e 0,663 em 2022; 0,754, 0,794 e 0,671 em 2023; e 0,472, 0,752 e 0,567 em 2024. Na caixa do fixture, que é maior e mistura outros usos, a fração de 2024 cai para 0,132. Duas leituras: a caixa diluía a soja, e o GLAD concorda com o `mbmode24` igual a 39 do Trazo3 em 47 a 79 por cento da área do polígono. É a melhor evidência cruzada que consegui montar.

O GLAD também tem lavoura anual global de 2015 a 2024, 30 m, binária, sem tipo de cultura. Serve como máscara, não como classificação.

### 3.4 CropHarvest

Fonte: `https://zenodo.org/records/5828893`, licença CC BY-SA 4.0 confirmada pela API (4 arquivos, 2021-06-24). É um conjunto de rótulos georreferenciados com séries Sentinel-1, Sentinel-2, SRTM e ERA5, para treinar e comparar classificadores. Não é mapa. No Brasil são 800 rótulos multiclasse e 36 binários, o que é pouco e não cobre Mato Grosso de forma sistemática. Serve se o projeto decidir treinar um classificador próprio; não responde à pergunta desta pesquisa.

### 3.5 GEOGLAM, GDA e o que se chama de EPIC

Fonte: `https://glam1.gsfc.nasa.gov/api/doc/cropmask/v1/GDA-CropID-Brazil_2024_Corn-2nd-harvest`. Existe um mapa CropID do Brasil de 2024 em 250 m, feito pela GDA para o sistema GLAM, com milho de segunda safra e algodão. A licença é o bloqueio: a GDA concede ao USDA FAS licença para uso do governo federal americano e para compartilhar produtos derivados, mas não é uma licença aberta. Além disso, 250 m é uma resolução que cobre dezenas de talhões por pixel; não serve para um campo de 101 ha.

Não localizei um produto chamado EPIC que cubra o Brasil com tipo de cultura em resolução de campo. O mais próximo em nome e proposta é o conjunto harmonizado do GEOGLAM, que é publicado em 0,05 grau, cerca de 5,5 km, e por construção não distingue talhão. Registro isso como não verificado, não como inexistente.

### 3.6 Conab, Mapeamento de Safras

Fonte: `https://portaldeinformacoes.conab.gov.br/mapeamentos-agricolas-downloads.html`. O portal descreve o produto como "dados vetoriais referentes à distribuição espacial de áreas cultivadas", unidade GEOTE, tipo de informação pública. O 12º levantamento da safra 2024/25, publicado em setembro de 2025, descreve mapeamento de soja nas dez safras mais recentes, de 2015/16 a 2024/25, e cita a página de downloads como destino dos dados.

Tentei resolver o link direto e não consegui: a página é uma aplicação Angular de 42.540 bytes que devolve o mesmo shell para qualquer rota, o JavaScript principal tem um `buildDownloadUrl` que monta a URL a partir de um `apiUrl` que não está no bundle público, e `https://portaldeinformacoes.conab.gov.br/api/mapeamentos` devolve o HTML da aplicação, não JSON. Então o produto existe, é público e é o mais próximo do que o app precisa, mas eu não consegui baixar um arquivo. A licença também não está declarada como aberta; a Conab tem um termo de uso próprio em `https://www.conab.gov.br/termo-de-uso-conab`, que precisa ser lido antes de uso comercial. Fica como recomendação de follow up, não como solução.

### 3.7 Canasat

Fonte: `http://www.dsr.inpe.br/laf/canasat/`, HTTP 403 para acesso anônimo. Além do bloqueio, o produto é de cana, não de soja nem de milho. Fora de escopo.

### 3.8 O que exige Earthdata Login

HLS completo com bandas, SMAP nativo, ECOSTRESS e IMERG Final continuam fora de alcance por credencial, como já registrado na pesquisa anterior. Nada nesta pesquisa depende deles. Vale registrar o que se perde: HLS daria 30 m com revisita combinada de 2 a 3 dias, o que reduziria o buraco de fevereiro, e ECOSTRESS daria estresse hídrico a 70 m. Se a credencial aparecer, a Rota A melhora em cadência, não em identidade de cultura.

## 4. Rota C: híbrido

O que a satélite pode fazer pelo polígono, com o que foi medido:

1. **Datas.** A série por polígono entrega green-up, pico e fim de cada ciclo. É o que o bloco 6 precisa para montar um intervalo de datas.
2. **Estrutura de rotação.** Detectar dois ciclos separados por solo nu é detectar safrinha. Nos três campos isso apareceu, e a fixture declara "Soybean → Corn". Concordância de estrutura, em terreno sintético.
3. **Checagem de classe.** Se o polígono diz soja (39) e a série não mostra ciclo de verão, há inconsistência. Se mostra dois ciclos, há segunda safra, que o `mbmode24` não carrega. O `mbmode24` é de 2024 e de coleção não verificada; a série de 2025/26 é do ano que o app quer mostrar.
4. **Correção de borda, não.** A série não corrige a geometria. Ela só mede dentro do que o polígono delimita.

O híbrido não é uma opinião: os dois produtos independentes concordam que o ponto é soja (Trazo3 pela moda de 2024, GLAD por 47 a 79 por cento da área em 2022 a 2024), e a série mostra o ciclo de verão mais segunda safra. Três fontes, uma conclusão de estrutura, nenhuma delas capaz de nomear o segundo cultivo.

## 5. Rota D: fronteira sem vetor

Teste: uma cena Sentinel-2, NDVI, limiar em 0,55, abertura e fechamento morfológicos de 3 pixels, componentes conexos, mínimo de 5 ha, em três datas. Depois, IoU contra o polígono do Trazo3 que contém cada centro.

| Data | Componentes | Componentes com 5 ha ou mais | Maior componente | IoU Field 01 | Segmento no centro do Field 01 |
|---|---|---|---|---|---|
| 2025-10-04 | 208 | 26 | 1.594,4 ha | 0,0 | 0 ha, o campo está nu, não é "verde" |
| 2026-01-15 | 313 | 29 | 5.527,1 ha | 0,019 | 5.105,4 ha |
| 2026-04-22 | 69 | 7 | 15.071,7 ha | 0,006 | 15.071,7 ha |

Resultado negativo, e limpo. Um limiar de NDVI separa vegetação de solo, não um talhão do talhão vizinho. Em janeiro e abril a paisagem inteira fica acima do limiar e tudo funde em um componente só. Em outubro o campo está nu e o centro nem cai em componente verde. IoU de 0,006 a 0,028 é ruído.

Fronteira sem vetor existe como problema, mas com outro método: modelos de segmentação de talhão, como os do benchmark Fields of The World citado na pesquisa anterior, treinados com dados de referência. Isso é um projeto, não uma chamada de API, e não foi testado aqui. Para o app, a conclusão prática é que a geometria continua vindo do Trazo3.

## 6. Comparação de métodos

| Método | Resolução | Licença | Cobertura | O que distingue | Custo medido | Veredito |
|---|---|---|---|---|---|---|
| Série Sentinel-2 L2A por polígono | 10 m, revisita 5 d | Copernicus, aberta | global | estrutura de ciclos e datas; não nomeia cultura | 4 range reads e 8,8 MB de teto por cena, 6 a 14 s | melhor opção sem login, para datar e conferir |
| Trazo3 PMTiles | vetor, zoom até 12 | CC BY 4.0 | Mato Grosso, 1.418.870 campos | geometria e `mbmode24` de 2024 | 3 a 25 range requests, 154.561 bytes para 3 pontos | necessário para geometria e rótulo provisório |
| GLAD soybean anual | 30 m | não declarada | América do Sul, 2001 a 2024 | soja sim, milho não | 315.114.876 bytes por ano, range ok | bom cruzamento para soja, licença impede uso |
| ESA WorldCereal 2021 | 10 m | CC BY 4.0 | global, 2021 | lavoura, milho, cereais, irrigação; sem soja | zip de 3,8 a 25,0 GB por produto | insuficiente por ano e por classe |
| MapBiomas Coleção 11 | 30 m | CC BY 4.0 | Brasil, 1985 a 2025 | soja, milho de 2ª safra, algodão beta, ciclos | Earth Engine ou plataforma | dado certo, acesso bloqueado |
| Conab Mapeamento de Safras | vetor | termos da Conab | Brasil, soja 2015/16 a 2024/25 | soja | download não resolvido | follow up prioritário |
| Segmentação por limiar de NDVI | 10 m | não se aplica | não se aplica | nada de útil | uma cena por data | reprovado |
| HLS, SMAP, ECOSTRESS | 30 m a 70 m | aberta com conta | global | mais cadência e estresse hídrico | exige Earthdata Login | fora de alcance agora |

## 7. Recomendação para os blocos 5 e 6

**O polígono continua obrigatório.** Não por preferência, por três razões medidas: a fronteira não sai de índice de vegetação (seção 5), a identidade de cultura não sai do espectro (seção 2.4), e fevereiro não tem observação utilizável (seção 2.6). Sem polígono não há área, e sem área o bloco 6 não conta nada.

O que muda é o papel de cada fonte:

1. **Bloco 5, geometria.** Manter o Trazo3 como fonte de geometria. Responder sobre três pontos custou 25 range requests e 154.561 bytes para seis tiles. Não ler estatística por campo do PMTiles no zoom 12: a seção 2.2 mostra polígonos bimodais, provavelmente uniões de talhões. Para estatística, usar o GeoParquet ou o GeoPackage, que têm a geometria completa e os atributos que o PMTiles não carrega.
2. **Bloco 5, rótulo.** Manter `mbmode24` como rótulo provisório, escrito como `modelled`, ano 2024, coleção não verificada. Acrescentar um selo de conferência por satélite: concorda, não concorda, sem dado. A conferência é a série de dois ciclos descrita aqui.
3. **Bloco 6, intervalo de datas.** Usar os marcos da série por polígono como intervalo: green-up, pico e fim de cada ciclo, com a incerteza de 40 a 45 dias quando o marco cai em buraco de observação. O intervalo do bloco 6 passa a ser medido, não herdado do ZARC.
4. **Bloco 4 e ZARC.** O ZARC continua sendo o envelope legal municipal. A satélite mostra que o plantio observado caiu dentro dele. Quando a série existir para o polígono, a faixa pode ser estreitada para a janela observada e rotulada como observada, mantendo o ZARC como referência regulatória. Isso resolve em parte o OD-22, mas só em parte: a satélite data o plantio, não o solo nem o ciclo da cultivar, que são as duas variáveis que fazem o ZARC abrir a faixa.
5. **Campo sem polígono.** Se o Trazo3 não cobrir o ponto, a série por ponto ainda entrega a estrutura de ciclos e uma faixa de plantio, com confiança baixa e o aviso de que não há área. Isso é melhor que nada para o bloco 6, desde que o número apareça rotulado como estimativa de ponto, não como medição de talhão.

Nada disso deve ser aplicado sem decisão do usuário, porque muda fonte de dado em blocos posteriores. Fica como recomendação para o orquestrador levar a ele.

## 8. O que este estudo não prova

- **A verdade de referência é sintética.** Três pontos, rótulo "Soybean → Corn" sem data e sem fonte. A concordância da satélite com a fixture é compatível com acerto, não é evidência de acerto. Para validar de verdade seriam necessários talhões com data de plantio declarada, o que não existe neste repositório.
- **A premissa de 10 a 20 dias entre plantio e green-up não foi medida.** Vem da agronomia e não foi calibrada aqui.
- **O segundo cultivo não foi identificado.** A estrutura de ciclo curto é compatível com milho e incompatível com algodão, mas não prova milho.
- **O calendário da zona agroecológica do WorldCereal não bate com a safrinha local**, então mesmo com o produto em mãos haveria trabalho de validação.
- **A leitura por range não foi instrumentada byte a byte.** O custo da série é um teto, não uma medida exata.
- **Amostra de três campos, um município, uma safra.** Nada aqui generaliza para outro município, outro solo ou outro ano sem repetir a medição.
- **O `mbmode24` do Trazo3 tem erro de borda declarado** (IoU de pixel de 79,17 por cento no teste de Mato Grosso, segundo o README da coleção), e a pesquisa anterior classifica a coleção de origem como não verificada.

## 9. Como reproduzir

Busca de cenas, sem login:

```
curl -s -X POST https://earth-search.aws.element84.com/v1/search \
  -H 'Content-Type: application/json' \
  -d '{"collections":["sentinel-2-l2a"],"bbox":[-55.30,-12.00,-55.18,-11.88],
       "datetime":"2025-09-01T00:00:00Z/2026-08-31T23:59:59Z","limit":200}'
```

Leitura de uma banda por range, para provar o acesso:

```
curl -sI -H 'Range: bytes=0-1023' \
  https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/21/L/XG/2026/4/S2A_21LXG_20260422_0_L2A/B04.tif
```

Resposta esperada: HTTP 206, `content-range: bytes 0-1023/181332255`.

Polígono do Trazo3 no ponto, sem baixar o arquivo:

```
curl -sI -H 'Range: bytes=0-126' \
  https://data.source.coop/wri-data-lab/trazofields/trazo3-fields/trazo3.pmtiles
```

Leitura da série, com Python e `rasterio`, `pyproj`, `shapely` e `numpy`:

1. Abrir o COG de B04 em `https://sentinel-cogs.s3.us-west-2.amazonaws.com/.../B04.tif` com `rasterio.open`, sem credencial, com `GDAL_DISABLE_READDIR_ON_OPEN=EMPTY_DIR`.
2. Recortar a janela pelos limites do polígono convertidos para EPSG:32721 com `pyproj.Transformer`.
3. Ler B08, B03 e SCL na mesma janela, com `out_shape` igual ao da B04 e reamostragem bilinear para as bandas de 10 m e vizinho mais próximo para SCL.
4. Reflectância igual a `DN * 0.0001`, sem offset.
5. Mascarar SCL em 0, 1, 3, 8, 9, 10 e 11.
6. Calcular NDVI, EVI e NDWI e guardar média, p10 e p90 dentro do polígono.

Detector de fenologia, parâmetros exatos no campo `method` do JSON: `valid_frac` mínimo 0,5, grade de 5 dias, suavização de 15 dias, limiar em `p10 + 0,5 * (p90 - p10)`, ciclo mínimo de 45 dias.

Leitura do produto de soja do GLAD, sem baixar o continente:

```
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' -r 0-0 \
  https://glad.umd.edu/projects/AnnualClassMapsV1/SouthAmerica_Soybean_2024.tif
```

Resposta esperada: 206, com `content-range: bytes 0-0/315114876`.

Zona agroecológica do WorldCereal:

```
curl -L -o WorldCereal_AEZ.geojson \
  'https://zenodo.org/records/7875105/files/WorldCereal_AEZ.geojson?download=1'
```

Depois, testar o ponto `Point(-55.27, -11.91)` contra os 106 polígonos e ler as propriedades `tc-maize-main_sos`, `tc-maize-main_eos`, `tc-maize-second_sos` e `tc-maize-second_eos`.

## 10. Proveniência

Arquivos deste repositório lidos como entrada, com sha256:

| Arquivo | sha256 |
|---|---|
| `PESQUISA-POLIGONOS-TIMELINE-E-TIPOS-DE-DADO.md` | `eeadc201e957aa6124086cca7fd1b7bf0d3e2ddd857a30d8429c4f8af434f3df` |
| `EXPLORACAO-DADOS-E-FEATURES.md` | `15b1f3a0e7ff3c439f7fa37fafad23c4f9cf5d240625c8841e24942d5c8da9cf` |
| `field-shift-app/artifacts/data-probe-2026-11-14-polygons-timeline.json` | `0e25dfaf495a733d6a5776252d4ead7d84165ecc8e552c80078e28299265ecdd` |
| `field-shift-app/artifacts/zarc-mt-snapshot.json` | `b53c8a7be60948fccb72e5cfa108b95debfdd932f5f15b315363d42a332dfde9` |
| `field-shift-app/backend/fixtures/field-scenarios.json` | `2425a58f61030309e9184a6952bfbc18384a987db6f6c2067b9bf89beee549e6` |

Saídas:

| Arquivo | sha256 |
|---|---|
| `field-shift-app/artifacts/data-probe-crop-inference.json` | `e60902dbbbec80d9828857e208f865c31fb4a5e8dd093ae2650f3cbfcf5a9204` |

Fontes externas, todas chamadas hoje e registradas com status no JSON:

- Sentinel-2 L2A, Element84 Earth Search, `https://earth-search.aws.element84.com/v1/search`
- COGs Sentinel-2, `https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/`
- Trazo3, WRI Data Lab e ASU, `https://data.source.coop/wri-data-lab/trazofields/trazo3-fields/trazo3.pmtiles`, CC BY 4.0
- ESA WorldCereal 2021 v100, `https://zenodo.org/records/7875105`, CC BY 4.0
- ESA WorldCereal, páginas de produto, `https://esa-worldcereal.org/en/products/global-maps`
- MapBiomas Brasil, `https://brasil.mapbiomas.org/downloads/`, CC BY 4.0
- MapBiomas user toolkit, `https://github.com/mapbiomas/user-toolkit`, CC BY 4.0
- GLAD South America soybean, `https://glad.umd.edu/projects/commodity-crop-mapping-and-monitoring-south-america`, licença não declarada
- GLAD annual cropland, `https://www.glad.umd.edu/dataset/annual-croplands`, licença não declarada
- CropHarvest, `https://zenodo.org/records/5828893`, CC BY-SA 4.0
- GDA CropID Brasil 2024, `https://glam1.gsfc.nasa.gov/api/doc/cropmask/v1/GDA-CropID-Brazil_2024_Corn-2nd-harvest`, licença restrita ao USDA FAS
- Conab Mapeamento de Safras, `https://portaldeinformacoes.conab.gov.br/mapeamentos-agricolas-downloads.html`
- Canasat, `http://www.dsr.inpe.br/laf/canasat/`, HTTP 403
