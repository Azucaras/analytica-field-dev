---
title: "2.5 GRACE, SRTM, GEDI e POWER: tendência, terreno, biomassa e envelope climático"
description: "Um mapa que alinha camadas de GRACE, SRTM, GEDI e POWER não torna essas camadas medições equivalentes."
checked: 2026-11-10
---

Um mapa que alinha camadas de GRACE, SRTM, GEDI e POWER não torna essas camadas medições equivalentes. O [manual de mascons do GRACE e do GRACE Follow On (lido, manual datado de 2021-05-10)](https://earthdata.nasa.gov/s3fs-public/2025-12/GRACE-FO_L3_Handbook_JPL.pdf) explica que a medição de distância por satélite sente variações gravitacionais, usadas para inferir mudanças amplas de massa. Os mascons nativos equiárea de 3 graus abrangem cerca de 300 a 330 km (documentado), enquanto as células de 0.5 grau são uma publicação sobreamostrada (documentado). Anomalias mensais combinam água do solo, neve, água superficial, água subterrânea e gelo em relação à média de 2004.0 a 2009.999 (documentado), e não ao armazenamento absoluto. Vazamento e premissas de separação da água subterrânea limitam a atribuição. O GRACE pode informar uma tendência de bacia ou aquífero de vários anos, mas não pode mostrar se uma propriedade ou um município ganhou água por causa de uma rotação.

O SRTM contribui com um tipo diferente de contexto: elevação derivada de uma missão de radar de banda C em fevereiro de 2000 (documentado). O [guia do usuário do SRTM (lido, revisado em 2015-10)](https://lpdaac.usgs.gov/documents/179/SRTM_User_Guide_V3.pdf) dá uma publicação de cerca de 30 m (documentado). A fase do radar reflete um centro de fase de espalhamento, que pode estar dentro do dossel florestal em vez do solo nu. O SRTM pode ajudar a triar declive, terreno e possíveis caminhos de drenagem. Não tem registro repetido, portanto não pode descrever erosão, terraceamento, mudanças de drenagem ou nivelamento do terreno após 2000. Uma camada estática de elevação é uma covariável de terreno, não a condição atual do campo.

O GEDI amostra a estrutura do dossel e do solo com lidar ao longo de trilhas. O [guia do GEDI L4B (lido, revisão de 2023-10-29)](https://data.ornldaac.earthdata.nasa.gov/public/gedi/GEDI_L4B_Gridded_Biomass_V2_1/comp/GEDI_L4B_Gridded_Biomass_V2_1.pdf) descreve sua grade de biomassa acima do solo de 1 km como modelada a partir de amostragem lidar esparsa (documentado), não como observação de cobertura total. O registro abrange 2019-04-18 a 2023-03-16 (documentado). Lacunas de trilha podem deixar células inadequadamente amostradas, e o modelo de biomassa treinado em florestas não se transfere automaticamente para culturas anuais. O GEDI pode sinalizar contexto histórico de floresta ou de desmatamento, não biomassa de cultura anual nem mudança de carbono do solo.

O NASA POWER fornece contexto climático diário amplo, não uma observação direta de instrumento na propriedade. A [documentação da API diária do POWER (lida, verificada em 2026-11-10)](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) descreve valores diários em grade, baseados em meteorologia de modelo e de reanálise e em entradas solares ligadas a satélite. A API diária usa uma grade de cerca de 0.5 grau (documentado); a documentação diverge quanto às dimensões de hidrologia, dando 0.5 por 0.5 grau em um ponto e meio por cinco oitavos de grau em outro (documentado). Não resolva silenciosamente essa discrepância. O POWER pode ajudar a caracterizar um envelope climático amplo, graus-dia de crescimento, período livre de geadas e contexto de déficit hídrico de longo prazo. Não pode fornecer a chuva observada, a água do solo nem o balanço hídrico completo de uma propriedade para um dia específico.

A umidade da zona radicular do SMAP L4 é um estado de modelo, não uma observação. O [guia do SMAP L4 (lido, 2025-04)](https://nsidc.org/sites/default/files/documents/user-guide/multi_spl4smau-v008-userguide.pdf) define uma média de 0 a 100 cm em uma grade de 9 km (documentado). Um modelo de superfície Catchment usa temperaturas de brilho assimiladas e entradas de precipitação; o SMAP não sente a umidade da zona radicular. Durante interrupções do SMAP, o L4 continua como saída somente de modelo. Já a LST do ECOSTRESS é uma temperatura radiométrica de superfície recuperada, enquanto seus JET ET e ESI são produtos modelados. Rotule essas saídas pelo tipo de evidência, não apenas pela grade.

**Figura S2-F5. Escada de evidência e escala (documentado).**

| Camada | Suporte e tipo de evidência |
|---|---|
| GRACE | Mascon nativo de cerca de 300 a 330 km (documentado), anomalia mensal de massa total |
| POWER | Grade de contexto diário de cerca de 0.5 grau (documentado), modelo e reanálise |
| GEDI L4B | 1 km (documentado), biomassa modelada a partir de lidar amostrado |
| SRTM | Publicação de cerca de 30 m (documentado), elevação estática derivada de radar de 2000 |
| SMAP L4 | Publicação de 9 km, estado modelado de 0 a 100 cm, não observação da zona radicular (documentado) |

**Decisão que pode informar.** Use o GRACE apenas como contexto de tendência de grandes bacias ou aquíferos; o SRTM para triagem de terreno; o GEDI para salvaguardas de florestas históricas; o POWER para viabilidade climática ampla; e o SMAP L4, se mostrado, como estado modelado explicitamente da zona radicular. Escolha cada um apenas pela sua escala e pelo seu tipo de evidência.

**Decisão que apenas ilustra.** Essas camadas não podem estabelecer a água da zona radicular de um campo, a drenagem atual, a biomassa de cultura anual, um ganho de carbono do solo, a produtividade, nem uma mudança de bacia causada por rotação. O alinhamento de pixels não harmoniza suporte físico, datas ou incerteza. Associe as camadas a medições locais e a registros de manejo antes de fazer recomendações em nível de propriedade.
