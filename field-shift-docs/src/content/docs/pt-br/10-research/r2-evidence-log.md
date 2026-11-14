---
title: Registro de evidências
description: Registro somente de acréscimos do que foi executado, com resultado e confiança.
---

Somente acréscimos. Nunca reescreva uma linha para encaixá-la em uma conclusão posterior; acrescente uma linha de correção. Confiança: `medido` é um número que esta máquina produziu, `documentado` é uma fonte que o afirma, `lembrado` é memória, e `inferido` é nosso raciocínio sobre um dos dois.

| Id | Pergunta | O que foi executado, exatamente | Resultado | Confiança | Fonte |
|---|---|---|---|---|---|
| E-01 | O catálogo do CMR retorna granules do SMAP publicamente | `curl` no endpoint de granules do CMR com `collection_concept_id=C2938664763-NSIDC_CPRD`, tamanho de página 5 | HTTP 200, 4160 resultados, granule mais recente em 2026-11-09 | medido | cmr.earthdata.nasa.gov |
| E-02 | O POWER responde sem chave | `curl` na API diária de ponto do POWER, no ponto 42.03, -93.63, de 2025-05-01 a 2025-09-30 | HTTP 200, 153 dias, total da estação de 622 mm | medido | power.larc.nasa.gov |
| E-03 | Os trechos iniciais do site rodam como impressos | Executados sete trechos do site complementar em um venv de teste, seis em Python e um em Node | 7 de 7 executados, 0 falhas | medido | Trechos iniciais do site complementar |
| E-04 | Um raster sintético reprojeta no rasterio 1.4.4 | `calculate_default_transform` seguido de `reproject` em uma grade de 2 por 2 | 2 por 2 transformada em 4 por 4, valores finitos, GDAL 3.10.3 | medido | venv local |
| E-05 | Qual resolução e suporte o SMAP tem | Leitura do guia do produto e do ATBD | Grade de publicação de 9 km sobre pegada de 36 km, 5 cm superficiais, células de 9 km não independentes | documentado | Guia do usuário do NSIDC |
| E-06 | Quão atual é o ECOSTRESS | Consulta de granules no CMR para ECO_L3T_JET | Granule mais recente em 2026-10-28, pelo menos 13 dias de atraso | medido | cmr.earthdata.nasa.gov |
| E-07 | O produto GPM Final ainda é entregue | Leitura dos avisos de transição e consulta ao produto | Registro da V07 Final encerrado em 2025-09-30, V08 Final prevista para o outono de 2026 | documentado | Notícias da NASA GPM |
| E-08 | Existe um levantamento de solos brasileiro com qualidade dos EUA | Leitura do resumo do PronaSolos e do pacote de fontes T2 | Menos de 5 por cento do Brasil mapeado em 1:100,000 ou mais detalhado em 2022, sem equivalente ao SSURGO | documentado | gov.br PronaSolos |
| E-09 | O site do Atlas tem fluxo de pontuação ou de submissão | Varredura de 22 URLs públicas, sem login | 22 páginas, sem placar, seis cartões de conjuntos de dados ranqueados, um widget CMR ao vivo | medido | spacedata.swapniltamse.com |
| E-10 | Os links citados continuam funcionando | `curl` em seis URLs substitutas após a passagem de verificação | 6 de 6 com HTTP 200 | medido | Ver a proveniência do dossiê |
| E-11 | As culturas citadas no desafio têm literatura sobre rotação | Busca de artigos no Semantic Scholar, OpenAlex e Crossref | Retorna resultados, sem chave, sem barreira de acesso | medido | Endpoints de API |
