---
title: "3.1 Levantamento de solos dos EUA: gSSURGO e gNATSGO na escala da unidade de mapeamento"
description: "Os produtos de solo do NRCS do USDA oferecem uma estimativa prévia mapeada útil, não um teste de solo para um campo específico."
checked: 2026-11-10
---

Os produtos de solo do NRCS do USDA oferecem uma estimativa prévia mapeada útil, não um teste de solo para um campo específico. A distinção importa quando uma grade de exibição se parece com pixels de satélite: uma célula de 10 m ou de 30 m pode ser a codificação raster de uma unidade de solo mapeada, e não uma observação independente naquele local.

O Gridded Soil Survey Geographic Database ([gSSURGO](https://www.nrcs.usda.gov/resources/data-and-reports/gridded-soil-survey-geographic-gssurgo-database) (lido)) vincula chaves de unidades de mapeamento a tabelas de componentes, horizontes e interpretações. Os levantamentos do NRCS delimitam unidades de mapeamento a partir de observações de campo, transectos, amostragem e análises laboratoriais. Uma unidade de mapeamento pode conter vários componentes de solo e inclusões, de modo que uma chave não significa um solo homogêneo. Os rasters estaduais do gSSURGO são publicados a 10 m, enquanto o raster do CONUS tem 30 m para limitar o tamanho dos arquivos no ciclo de dados de 2026. Muitas células vizinhas repetem a mesma chave de unidade de mapeamento. Portanto, a contagem de células não é uma contagem amostral, e o espaçamento exibido não estabelece a precisão de um limite de campo nem de uma estimativa de propriedade do solo.

Um app pode usar o gSSURGO para construir uma estimativa prévia de solo explicável em áreas com cobertura de levantamento detalhado. Ele deve reter a chave da unidade de mapeamento, a área do levantamento, a identidade e a proporção do componente, o horizonte ou a profundidade selecionados e a interpretação usada. Se o app reduzir os componentes a um único valor, precisa declarar a regra de agregação. Uma estimativa ponderada pela proporção dos componentes é mais defensável do que selecionar o componente dominante sem divulgação, mas ela ainda resume uma unidade de mapeamento e não mede o campo. Uma interpretação de zona radicular ou de capacidade de retenção de água também depende da profundidade e da agregação de componentes escolhida, por isso a resposta exibida deve expor essas escolhas.

O [gNATSGO](https://www.nrcs.usda.gov/resources/data-and-reports/gridded-national-soil-survey-geographic-database-gnatsgo) (lido) oferece continuidade nacional, mas seu raster não tem detalhe de fonte uniforme. Ele combina o SSURGO detalhado, onde disponível, com o [STATSGO2](https://www.nrcs.usda.gov/resources/data-and-reports/description-of-statsgo2-database) (lido) generalizado e com as Raster Soil Surveys nas lacunas. A grade nacional de 30 m é, portanto, uma exibição comum conveniente, e não evidência de que cada célula tem suporte de levantamento detalhado. A classe da fonte deve acompanhar cada valor. Quando a fonte subjacente for generalizada, um app deve reduzir visivelmente a confiança da interpretação em nível de campo, em vez de apresentar silenciosamente a camada nacional como equivalente ao mapeamento detalhado de solos.

O [Web Soil Survey](https://websoilsurvey.nrcs.usda.gov/app/) (lido) permite a uma pessoa inspecionar unidades de mapeamento, interpretações e relatórios de uma área de interesse. O NRCS informa cobertura em mais de 95% dos condados dos EUA, mas a cobertura por condado não significa que todo campo tenha um diagnóstico no local. Ele é mais útil para a revisão humana das evidências do levantamento e de suas escolhas de profundidade e interpretação. Não deve ser tratado como uma API estável de ingestão em massa nem como substituto de amostragem.

**Figura S3-F1. Cadeia de proveniência do levantamento de solos dos EUA (documentado).**

|Camada|Suporte nativo|Interpretação|
|---|---|---|
|gSSURGO|Raster de unidades de mapeamento de 10 m (estadual) ou de 30 m (CONUS)|Chaves repetidas, componentes do levantamento e proporções|
|gNATSGO|Raster nacional de 30 m, com detalhe de fonte misto|A classe da fonte governa a confiança|

A regra de design é mostrar a evidência de levantamento por trás de uma afirmação sobre o solo, não a aparente finura de sua grade renderizada. Nem o gSSURGO nem o gNATSGO garantem um perfil no local, e células repetidas não podem ser contadas como observações independentes de solo. Decisões que dependem das condições reais de campo ainda exigem revisão local ou amostragem. Esses produtos dos EUA e suas alegações de qualidade de levantamento não devem ser projetados sobre a cobertura brasileira.
