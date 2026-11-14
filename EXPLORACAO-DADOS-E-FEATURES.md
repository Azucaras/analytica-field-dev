# Exploração de dados e features

Relatório de trabalho para o Field Shift. Reúne o que o app tem hoje, o que já está provado que existe e responde em dados de satélite sem credencial, o que exige credencial, e um catálogo detalhado de features que dá para explorar e testar. Cada número tem a fonte: chamada HTTP, arquivo ou comando. As medições cruas estão em `field-shift-app/artifacts/data-probe-2026-11-14.json`.

Escrito em 2026-11-14. Nenhuma divisão por relógio: o que ordena as features aqui é dependência técnica, não calendário.

## 1. O que o app tem hoje, medido

- Uma camada raster no ar. `field-shift-app/backend/main.py` linha 24 tem `TILE_LAYER_IDS` com uma entrada, `smap-soil-moisture` apontando para `SMAP_L3_Passive_Enhanced_Day_Soil_Moisture`.
- A URL do upstream está fixa em uma matriz de tiles. `_upstream_url` (linhas 152 a 158) monta `.../default/{data}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`. Isso funciona para SMAP e não funciona para nenhuma camada que declare outra matriz, o que a seção 2 demonstra com 400 real.
- O endpoint `/layers` (linhas 201 a 226) devolve id, label, basis, resolution e as_of, e hoje tem uma tupla com uma única entrada. O front consome isso em `src/components/LayerRail.tsx` linha 24.
- O catálogo do front está em `src/lib/layer-catalog.ts`: `LAYER_CATALOG` com uma entrada, incluindo o template de tiles, o tamanho de tile e a atribuição.
- Os três campos são fixture. `backend/fixtures/field-scenarios.json` tem `seasons` com 2023/24, 2024/25 e 2025/26, `default_season` 2025/26, e três fields com três cenários cada. Cada cenário carrega `why`, `benefit`, `gap`, `risk` e `evidence_rows` com layer, value, basis, as_of e source.
- O seletor de temporada existe (`src/components/SeasonSelect.tsx`) e as strings estão em inglês e português (`src/strings/en.ts`, `pt-BR.ts`).
- Existe um registro de comandos para agente em `main.py`: `select_field`, `set_composition`, `open_panel`, `apply_filter`, conforme ADR 0004. Não existe text-to-SQL nem voz.
- Proxy com cache, lookback de 5 dias e tile de reserva já funcionam (linhas 174 a 196 do `main.py`).

Consequência prática: o gargalo para explorar dados não é o front. É o backend ter uma camada só e uma matriz de tiles fixa.

## 2. Camadas raster sem chave: GIBS

### 2.1 Como o acesso funciona

O GIBS publica tiles PNG em Web Map Tile Service, sem conta e sem chave. A lista completa sai das capabilities:

    curl -s https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml -o gibs-caps.xml
    grep -o '<ows:Identifier>[^<]*' gibs-caps.xml | sed 's/<ows:Identifier>//' | sort -u | wc -l

Medido hoje: 1330 camadas, arquivo de 5,8 MB. Não é preciso ler o arquivo inteiro: dá para filtrar por nome.

### 2.2 A regra que quebra o código atual

Cada camada declara a sua própria matriz de tiles e o seu nível máximo. Uma URL montada com a matriz de outra camada devolve 400 em todo tile. Medido no ponto dos campos (-55.27, -11.91):

- `MODIS_Terra_NDVI_8Day` com `GoogleMapsCompatible_Level6` no zoom 6 devolve 400.
- A mesma camada com `GoogleMapsCompatible_Level9` no zoom 9 devolve 200 e 52.372 bytes.
- `SMAP_L3_Passive_Enhanced_Day_Soil_Moisture` com `Level9` devolve 400, porque ela é `Level6`.

Ou seja: antes de acrescentar camada, a matriz precisa virar atributo da camada. Sem isso, só entram as camadas Level6.

O mesmo código de erro tem dois significados distintos, e isso importa para o lookback: 400 significa que a matriz ou a data não serve, e 404 significa camada desconhecida ou nenhum dado naquele recorte. HLS S30 no zoom 12 para 2026-11-13 devolveu 404 porque não houve aquisição naquele tile naquele dia, não porque a camada não exista.

### 2.3 Fichas das camadas verificadas

Todas foram pedidas de verdade hoje, no ponto dos campos, e todas devolveram 200. A coluna "servida" é a data que o tile trouxe; "declarada" é o fim da faixa de tempo que a própria camada publica nas capabilities.

**Solo, SMAP L3 dia (a camada que já está no app)**
id `SMAP_L3_Passive_Enhanced_Day_Soil_Moisture`, matriz Level6, servida 2026-11-11, 9.999 bytes, resolução nativa 9 km de postagem sobre footprint de cerca de 36 km.
Responde: tendência de secagem e recarga entre chuvas, em escala de bloco, não de talhão.
Não responde: nada abaixo de 9 km, nada de profundidade, e regiões com vegetação densa, solo congelado ou água aberta ficam mal amostradas.

**Solo, SMAP L4 superfície (modelo com assimilação)**
id `SMAP_L4_Analyzed_Surface_Soil_Moisture`, Level6, servida 2026-11-10, 8.476 bytes, 9 km, camada 0 a 5 cm.
Responde: valor sem lacuna para animação e comparação entre datas, assumindo a base como modelo.
Risco: é estado de modelo, então precisa sair rotulado como `modelled` e nunca como medição.

**Solo, SMAP L4 zona de raiz (o mais próximo de "água disponível para a cultura")**
id `SMAP_L4_Analyzed_Root_Zone_Soil_Moisture`, Level6, servida 2026-11-10, 8.095 bytes, 9 km, 0 a 100 cm.
Responde: se o perfil deixou água para a próxima cultura, discussão de cultura de raiz profunda e pousio.
Risco: modelo, com erro que herda da chuva de entrada, e não serve para calendário de irrigação.

**Chuva, IMERG dia**
id `IMERG_Precipitation_Rate`, Level6, servida 2026-11-13, 2.299 bytes.
Responde: onde choveu na região nas últimas 24 a 48 horas, para contexto de janela de plantio.
Risco: o tile ficou pequeno porque a área estava seca, não porque a camada falhou. Estimativa quase em tempo real, não é a Final calibrada com pluviômetro.

**Chuva, IMERG meia hora**
id `IMERG_Precipitation_Rate_30min`, Level6, servida 2026-11-14T12:30:00Z, 1.357 bytes.
Responde: animação intradiária de chuva, útil para mostrar tempestade passando.
Risco: meia hora por quadro, então precisa de controle de tempo com hora, não com data. É a camada mais recente de todas as testadas: hoje ao meio-dia UTC.

**Vegetação, NDVI 8 dias**
id `MODIS_Terra_NDVI_8Day`, Level9, servida 2026-11-13, 46.881 bytes, 250 m.
Responde: onde a vegetação está verde ou secando, e comparação entre anos na mesma época.
Risco: compósito de 8 dias esconde evento curto, e satura em dossel fechado.

**Vegetação, EVI 8 dias**
id `MODIS_Terra_EVI_8Day`, Level9, servida 2026-11-13, 50.401 bytes, 250 m.
Responde: o mesmo que o NDVI com menos saturação em biomassa alta, o que ajuda em lavoura vigorosa.
Risco: mais sensível a correção atmosférica.

**Vegetação de longo prazo, NDVI mensal**
id `MODIS_Terra_L3_NDVI_Monthly`, Level7, servida 2026-10-01, 48.137 bytes, 250 m.
Responde: linha de base climatológica por mês, para dizer se esta safra está acima ou abaixo do normal.
Risco: fechamento mensal chega com atraso de um mês ou mais, o que é aceitável para base e inaceitável para "condição atual".

**Calor, LST Terra dia**
id `MODIS_Terra_L3_Land_Surface_Temp_Daily_Day`, Level7, servida 2026-11-13, 1.189 bytes, 1 km.
Responde: superfície mais quente que o entorno, ilha de calor, área com pouca cobertura.
Risco: tile pequeno indica céu limpo parcial na área, e temperatura de pele não é temperatura de ar nem de folha.

**Calor, LST Aqua dia**
id `MODIS_Aqua_Land_Surface_Temp_Day`, Level7, servida 2026-11-14, 1.189 bytes, 1 km.
Responde: a mesma pergunta com outro horário de passagem, o que permite comparar manhã e início da tarde.
Risco: mesma natureza de pele, e horário diferente muda a interpretação.

**Óptico de alta resolução, HLS Landsat 30 m**
id `HLS_L30_Nadir_BRDF_Adjusted_Reflectance`, Level12, servida 2026-11-06, e no zoom 12 as datas com imagem real nos últimos 25 dias foram 2026-11-01 com 146.477 bytes, 2026-10-31 com 46.144, 2026-10-24 com 122.826, 2026-10-23 com 66.444 e 2026-10-16 com 163.066.
Responde: ver talhão, resteva, falha de plantio e presença de segunda safra onde houver céu limpo.
Risco: esparso por data. É exatamente a lacuna já registrada no STATE.md, e agora está medida: cerca de uma a duas datas boas por quinzena.

**Óptico de alta resolução, HLS Sentinel-2 30 m**
id `HLS_S30_Nadir_BRDF_Adjusted_Reflectance`, Level12, servida 2026-11-06, 104.260 bytes no zoom 10.
Responde: mais frequência que o Landsat, com 5 dias de revisita combinada.
Risco: mesma dependência de céu limpo, e correção atmosférica pode falhar em alvo claro.

**Umidade de solo alternativa, AMSR2 0.25 grau**
id `LPRM_AMSR2_Surface_Soil_Moisture_C1_Band_Day_Daily`, Level6, servida 2026-11-08.
Responde: segunda opinião sobre umidade de superfície, com produto e sensor diferentes do SMAP.
Risco: resolução de 0.25 grau é grosseira, e serve para dizer "a região está seca", nunca o campo.

**Água subterrânea, GRACE mascon**
id `GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI`, Level6, declarada e servida 2022-07-01, 1.457 bytes.
Responde hoje: nada de atual. A camada do GIBS está parada há mais de quatro anos.
Uso possível: série histórica de tendência de armazenamento até 2022, com aviso na tela. Para dado atual, só PO.DAAC com login.

**Contexto de seca, mapa estático**
id `NDH_Drought_Hazard_Frequency_Distribution_1980-2000`, Level7, 935 bytes, sem dimensão de tempo (a chamada com `default` no lugar da data devolve 200).
Responde: frequência histórica de seca no local, como pano de fundo de risco.
Risco: é 1980 a 2000 e não muda. Entra como contexto, nunca como condição.

### 2.4 O número que muda a conversa

Os três campos do fixture estão a 3 a 6 km um do outro: centros -55.27/-11.91, -55.24/-11.94 e -55.21/-11.97. Isso significa que qualquer produto de 9 km ou mais entrega praticamente o mesmo valor nos três. E a API de ponto usada na seção 3 confirma: os três devolveram agregados idênticos, porque caem na mesma célula.

Implicação de produto: painel de números por campo só diferencia os campos se a fonte for de 30 m, ou se o produtor entrar com o histórico de manejo. Isso não é defeito, é a fronteira do satélite, e é a tese do relatório de pesquisa. Vale mostrar na interface, não esconder.

## 3. Dados por ponto sem chave: NASA POWER

Endpoint verificado hoje, sem registro e sem chave:

    curl -s "https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M,T2M_MIN,GWETROOT&community=AG&longitude=-55.27&latitude=-11.91&start=20261001&end=20261111&format=JSON"

### 3.1 Parâmetros confirmados, com unidade

Todos os dezesseis abaixo vieram com valor real para o período, com dados até 2026-11-11 e -999 nos dias ainda não consolidados:

    T2M                C            temperatura média a 2 m
    T2M_MAX            C            máxima
    T2M_MIN            C            mínima
    T2MDEW             C            ponto de orvalho
    RH2M               %            umidade relativa
    PRECTOTCORR        mm/dia       chuva corrigida
    GWETROOT           1            umidade de raiz normalizada, modelo
    GWETPROF           1            perfil inteiro, modelo
    GWETTOP            1            camada superficial, modelo
    ALLSKY_SFC_SW_DWN  MJ/m2/dia    radiação de onda curta
    WS2M               m/s          vento
    QV2M               g/kg         umidade específica
    EVLAND             mm/dia       evaporação da superfície
    EVPTRNS            MJ/m2/dia    evapotranspiração potencial
    FROST_DAYS         dias         dias com geada
    T2M_RANGE          C            amplitude diária

### 3.2 Agregados que já saem do dado, calculados hoje

Para 2026-10-01 a 2026-11-11, 42 dias válidos, nos três campos (que caem na mesma célula):

    chuva acumulada      171,9 mm
    maior veranico       7 dias com menos de 1 mm
    graus-dia base 10    836
    dias de geada        0
    mínima do período    21,8 C
    GWETROOT médio       0,49

Isso é o tipo de número que transforma overlay em afirmação por campo, e é calculável agora, sem credencial.

### 3.3 Limites que precisam aparecer na tela

- É reanálise, não medição. Base `modelled`.
- Célula de cerca de 0,5 grau, então os três campos são o mesmo ponto na prática.
- -999 significa dado não consolidado, e a série precisa filtrar antes de desenhar, senão a linha despenca no fim.
- Elevação da grade pode não coincidir com a elevação da fazenda.

## 4. Produtos que exigem Earthdata Login

Estes existem e são os melhores para o argumento agronômico, mas são arquivos, não tiles, e exigem conta gratuita mais `earthaccess` ou AppEEARS:

- SMAP L3 e L4 em resolução nativa, com QA por célula.
- ECOSTRESS ET e índice de estresse evaporativo em 70 m. Não existe no GIBS, confirmado: zero camadas com esse nome nas 1330.
- HLS completo, com bandas, não só o compósito visual.
- IMERG Final, calibrado com pluviômetro.
- GEDI biomassa.

O T1 do research registra que nenhum granulo foi baixado até hoje por falta de credencial. Sem a conta, metade das features da seção 6 fica na prateleira.

## 5. Achados negativos e armadilhas

- GRACE no GIBS parado em 2022-07-01. Overlay de água subterrânea "atual" seria enfeite.
- ECOSTRESS ausente do GIBS.
- Matriz de tiles fixa no código atual: qualquer camada fora de Level6 devolve 400.
- SMAP satura no Level6 do GIBS, então aproximar o zoom achata a imagem em vez de detalhar.
- HLS é esparso por data: 5 datas boas em 25 dias no recorte testado.
- Os três campos são o mesmo pixel para qualquer fonte maior que 6 km, medido.
- POWER devolve -999 antes da consolidação, medido em 2026-11-12 e 2026-11-13.
- IMERG do GIBS é estimativa quase em tempo real, não a Final.
- O eixo temporal do fixture não é usado pelas linhas de evidência: `evidence_rows` não tem campo de temporada, apesar de `seasons` existir no arquivo.

## 6. Catálogo de features

Cada feature traz a pergunta que responde, o dado necessário, a mudança técnica exata, como testar e o critério de aceite. As identificações começam com F.

### 6.1 Mapa e camadas

**F-01 Registro de várias camadas raster**
Pergunta: o app consegue mostrar mais de um produto sem virar código especial para cada um?
Dado: as fichas da seção 2.3.
Mudança: `TILE_LAYER_IDS` passa a ser um dicionário de camadas com `gibs_id`, `matrix`, `max_zoom`, `label`, `basis`, `resolution`. `_upstream_url` passa a ler a matriz da camada em vez de `GoogleMapsCompatible_Level6`. `/layers` deixa de ser uma tupla fixa e percorre esse dicionário. `layer-catalog.ts` ganha as mesmas entradas.
Teste: `curl 'http://localhost:8000/layers'` deve listar N camadas com as_of diferente por camada; `curl -o /dev/null -w '%{http_code}' 'http://localhost:8000/tiles/<id>/10/<x>/<y>'` deve dar 200 para cada id.
Aceite: cinco camadas no `/layers`, cada uma com 200 no tile.
Risco: se o lookback continuar em 5 dias para todas, camada mensal (NDVI) sempre falha. Precisa de janela por camada.

**F-02 Legenda honesta por camada**
Pergunta: quem olha sabe o que a cor significa, de que data e com que base?
Dado: resolução nativa, base e data servida, que o backend já devolve.
Mudança: `LayerRail` mostra rótulo, resolução, base e data; o cabeçalho do mapa repete a data da camada ativa. Nenhum texto novo sem chave em `en.ts` e `pt-BR.ts`.
Teste: `npx vitest run src/components/LayerRail.test.tsx`, mais leitura do DOM com `document.querySelector('.layer-rail').innerText`.
Aceite: para cada camada, a string inclui a data servida e a palavra da base.

**F-03 Ordem e opacidade**
Pergunta: consigo ver solo e chuva ao mesmo tempo sem que um apague o outro?
Mudança: estado de opacidade por camada no `map-store.ts`, um slider por camada na rail, `setPaintProperty` de `raster-opacity` na camada do MapLibre.
Teste: medir `map.getPaintProperty(id, 'raster-opacity')` via `window.__fsMap`, que já existe como gancho de verificação.
Aceite: opacidade muda sem recriar a fonte, e o estado sobrevive à troca de composição.

**F-04 Óptica com data escolhida por cobertura**
Pergunta: onde houve céu limpo, e qual é a imagem mais recente que mostra o talhão?
Dado: HLS L30 e S30, com a lista de datas boas medidas.
Mudança: endpoint `/layers/{id}/dates?days=30` que varre as datas e devolve as que têm tile com mais de um tamanho mínimo, baseado na medição de bytes.
Teste: chamar o endpoint e comparar com a varredura manual (5 datas em 25 dias).
Aceite: a lista devolvida bate com a varredura, e o mapa abre na data mais recente com imagem.

### 6.2 Tempo

**F-05 Seletor de data por camada**
Pergunta: o que mudou entre duas datas?
Mudança: `?date=YYYY-MM-DD` no tile do proxy, cache por data, e um controle na rail. A data precisa viajar até o header `X-Tile-Date`, que já existe.
Teste: pedir a mesma camada com três datas e conferir bytes e header.
Aceite: a imagem muda, o header diz a data efetivamente servida, e data sem imagem cai no lookback registrado.

**F-06 Animação**
Pergunta: dá para ver a seca chegando?
Mudança: laço de datas no cliente sobre a mesma fonte, com pré-carregamento. Nada de novo no backend além do F-05.
Teste: contar quadros e conferir que não há requisição por quadro repetida no cache.
Aceite: 8 quadros em menos de 3 segundos com cache quente.

**F-07 Comparação lado a lado**
Pergunta: como estava antes e como está agora?
Mudança: duas instâncias de fonte raster com `clip` por metade do mapa, ou duas capturas com o mesmo enquadramento.
Teste: medir coordenadas e comparar com o enquadramento original.
Aceite: o divisor move e as duas metades mostram datas diferentes no rótulo.

### 6.3 Números por campo

**F-08 Série POWER por campo**
Pergunta: qual foi a chuva e a temperatura dos últimos 14 dias neste campo?
Mudança: endpoint `/fields/{id}/climate?days=14` que chama o POWER com o centro do campo, filtra -999, e devolve série mais metadados de fonte e base.
Teste: `curl` no endpoint e conferência contra a chamada direta do POWER.
Aceite: 14 dias, sem -999, com unidade e base `modelled` na resposta.

**F-09 Agregados agronômicos**
Pergunta: houve veranico, qual o acumulado, quantos graus-dia?
Mudança: função pura que recebe a série e devolve chuva acumulada, maior veranico, GDD base 10, dias de geada, mínima. Testes com série sintética e com o período real.
Aceite: os valores batem com os da seção 3.2, dentro de arredondamento, e existe teste que falha se -999 entrar na conta.

**F-10 Balanço hídrico simples**
Pergunta: a chuva do período cobre o que a cultura consome?
Mudança: chuva do POWER menos evapotranspiração de referência, com umidade observada do SMAP como âncora. Três números na tela: entrou, saiu, sobrou, cada um com base.
Aceite: o saldo fecha com a aritmética mostrada, e a tela diz que é estimativa, não medição.

**F-11 Extração por polígono**
Pergunta: qual é o valor médio dentro deste talhão, e quantos pixels válidos havia?
Dado: exige raster de verdade. Duas rotas: ler os tiles PNG do próprio proxy e mascarar por polígono no cliente, ou baixar granulos com Earthdata e calcular no servidor com rasterio.
Mudança: rota 1 é JavaScript sobre o canvas; rota 2 é pipeline Python com manifesto de proveniência.
Teste: comparar a média dos tiles com a de um GeoTIFF baixado para o mesmo polígono.
Aceite: diferença abaixo de 10 por cento entre as rotas, e cobertura válida reportada junto com a média.
Risco: rota 1 herda a paleta do PNG e não os valores físicos, então serve para proporção de cor, não para unidade. Dizer isso é obrigatório.

### 6.4 Evidência e honestidade

**F-12 Proveniência por linha, estendida a métricas**
Pergunta: de onde veio cada número da tela?
Estado: `evidence_rows` já carrega `source`, `basis` e `as_of`, e o app já rotula por base depois da remoção do formulário de restrições.
Mudança: aplicar o mesmo contrato às métricas novas de F-08 a F-10 e às camadas de F-01.
Aceite: nenhum número na tela sem fonte, base e data, verificável por busca no DOM.

**F-13 Contraevidência por recomendação**
Pergunta: o que derrubaria esta sugestão de rotação?
Mudança: cada cenário ganha um campo `falsifier` com o dado que o invalidaria, e a tela mostra isso junto do benefício.
Aceite: todo cenário exibido tem falsificador e teste que falha se faltar.

**F-14 Registro de lacunas**
Pergunta: o que faltou para este campo, e por quê?
Mudança: lista de lacunas por campo (sem série óptica, sem histórico de manejo, produto parado), montada a partir do estado real das fontes.
Aceite: a lacuna aparece quando o dado falta, e não quando o dado existe.

### 6.5 Decisão

**F-15 Comparador com pesos do produtor**
Pergunta: qual rotação ganha para quem prioriza água, e qual ganha para quem prioriza renda?
Mudança: sliders de prioridade (água, renda, palhada, nitrogênio) que reordenam os cenários por soma ponderada explícita, com a fórmula visível.
Aceite: mexer o peso muda a ordem de forma reproduzível, e a ordem com pesos iguais reproduz a ordem atual da fixture.

**F-16 Simulador de condição**
Pergunta: e se a próxima safra vier 20 por cento mais seca?
Mudança: transformação declarada sobre a série (chuva menos X por cento, temperatura mais Y), recalculando F-09 e F-10 com aviso de que é cenário, não previsão.
Aceite: o número muda na direção esperada e o rótulo diz que é simulação.

**F-17 Calendário de janelas**
Pergunta: quando plantar e quando colher, dado o risco?
Mudança: usar `seasons` que já existe no fixture mais os agregados para desenhar janelas por risco de veranico e geada, com a fonte de cada limite.
Aceite: cada janela cita o dado que a sustenta.

### 6.6 Agente e voz

**F-18 Text-to-SQL sobre a evidência**
Pergunta: o produtor pergunta em linguagem natural e a resposta vem do banco, não do modelo.
Mudança: base SQLite com fields, scenarios e evidence_rows, um agente que gera SQL restrito a views somente leitura, e execução com limite. O registro de comandos de ADR 0004 já define como a interface reage.
Aceite: dez perguntas de teste, todas respondidas com SQL inspecionável e nenhuma escrita possível.

**F-19 Voz sobre o registro de comandos**
Pergunta: dá para operar o mapa falando?
Mudança: reconhecimento de fala no cliente mapeando para os quatro comandos existentes, com confirmação antes de aplicar.
Aceite: cada comando é acionado por voz em três tentativas seguidas, e nada é aplicado sem confirmação.

**F-20 Explicação do que está na tela**
Pergunta: por que este campo está marcado assim?
Mudança: botão que gera um parágrafo a partir do estado real (camada ativa, data, base, lacunas), sem inventar dado.
Aceite: o texto cita a data e a base efetivamente servidas, verificado em teste.

### 6.7 Entrada do produtor

**F-21 Cadastro de talhão**
Pergunta: como o produtor entra com o próprio desenho?
Mudança: desenho no mapa, importação GeoJSON e KML, validação de área e de sobreposição, persistência em arquivo local.
Aceite: um polígono desenhado vira a área de consulta das features F-08 a F-11 e sobrevive a recarregar.

**F-22 Histórico de manejo declarado**
Pergunta: o que foi plantado, quando, e com que insumo?
Mudança: formulário de rotação por safra, com base `entered` e nenhuma inferência. É o único jeito de diferenciar os três campos.
Aceite: o histórico entra no cálculo e aparece rotulado como declarado.

**F-23 Restrições econômicas**
Pergunta: a rotação cabe no bolso e no contrato?
Mudança: custo por hectare, preço do produto, prazo de arrendamento. Sem isso, recomendação é agronomia sem economia.
Aceite: o comparador de F-15 usa as restrições declaradas e marca o cenário inviável.

### 6.8 Qualidade

**F-24 Sanidade de dado**
Pergunta: o que está na tela tem data, unidade e cobertura válida?
Mudança: verificação antes de renderizar (fill, cobertura mínima, data futura, camada parada) e aviso em vez de gráfico silencioso.
Aceite: com dado forçado a -999 a tela avisa; com data no futuro a tela recusa.

**F-25 Modo degradado**
Pergunta: o que acontece sem internet no palco?
Estado: já existe tile de reserva e aviso de backend inacessível.
Mudança: estender a política para as camadas novas e para o POWER, com cache local do último período válido.
Aceite: desligar a rede deixa a tela coerente, com aviso e dados da última sincronização.

## 7. O que cada bloco exige de infraestrutura

- F-01, F-02, F-05 e F-24 são a mesma fundação: camada com matriz, janela de datas, base e data servida. Sem isso, o resto vira caso especial.
- F-08, F-09 e F-10 pedem um cliente POWER no backend com cache curto, porque a API é gratuita mas não é rápida.
- F-11 e F-18 pedem banco e pipeline, os dois maiores custos.
- F-15, F-16 e F-17 dependem de F-22 e F-23 para ter o que comparar.
- F-19 depende do registro de comandos, que já está estável e testado.

## 8. Ordem por dependência

    F-01  registro de camadas com matriz e janela de data
      -> F-02, F-03, F-04, F-05, F-24
      -> F-06, F-07
    F-08  cliente POWER
      -> F-09, F-10, F-16
    F-22  histórico declarado
      -> F-15, F-17, F-23
    F-11  extração por polígono
      -> F-13, F-14 com número real por talhão
    F-18, F-19, F-20  agente e voz, dependem de dados estáveis

## 9. Comandos prontos para testar agora

Camadas:

    curl -s 'http://localhost:8000/layers' | head -c 400
    curl -s -o /dev/null -w '%{http_code} %{size_download}\n' 'http://localhost:8000/tiles/smap-soil-moisture/6/22/34'

GIBS direto, sem passar pelo proxy, para conferir uma camada nova antes de codificar:

    curl -s -o /tmp/t.png -w '%{http_code} %{size_download}\n' \
      'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2026-11-13/GoogleMapsCompatible_Level9/6/22/34.png'

POWER, com os parâmetros da seção 3.1:

    curl -s 'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,T2M_MIN,GWETROOT&community=AG&longitude=-55.27&latitude=-11.91&start=20261001&end=20261111&format=JSON' | head -c 600

Testes do projeto:

    cd field-shift-app && npx tsc -b --noEmit && npx vitest run && npm run build
    cd field-shift-app/backend && .venv/bin/python -m unittest -q test_commands

## 10. Decisões abertas

- Conta Earthdata: sem ela, ECOSTRESS, IMERG Final, HLS completo e extração por granulo ficam fora. Com ela, F-11 vira pipeline de verdade.
- O que é "campo" no produto: continuar com três polígonos de fixture ou permitir desenho do produtor (F-21). Muda o desenho do banco e das features de número.
- Profundidade do agente: só comandos (como hoje), comandos mais voz, ou comandos mais text-to-SQL. Cada degrau multiplica risco de demo.
- Se a diferenciação entre os três campos vem de dado de 30 m ou de manejo declarado. Hoje o dado grosso não diferencia, e isso está medido.

## 11. Proveniência

- Capabilities do GIBS, 1330 camadas, arquivo de 5,8 MB, obtido em 2026-11-14 às 15h45. Correção: a primeira contagem, 1353, contou linhas do arquivo e não identificadores de camada.
- Sondagem de 15 camadas com tile real no ponto -55.27, -11.91, resultado em `field-shift-app/artifacts/data-probe-2026-11-14.json`.
- Teste da regra de matriz com 400 e 200 reais para NDVI e SMAP.
- Varredura de 25 dias de HLS L30 no zoom 12 para medir frequência de imagem utilizável.
- POWER: dezesseis parâmetros com unidade, valores válidos até 2026-11-11, agregados de 2026-10-01 a 2026-11-11.
- Estado do app: `backend/main.py` linhas 24, 152 a 158, 174 a 196, 201 a 226; `src/lib/layer-catalog.ts`; `src/components/LayerRail.tsx` linha 24; `backend/fixtures/field-scenarios.json`.
- Pesquisa de produto: `research/nasa-data/T1.md`, tabela de capacidade, linhas 11 a 26.
