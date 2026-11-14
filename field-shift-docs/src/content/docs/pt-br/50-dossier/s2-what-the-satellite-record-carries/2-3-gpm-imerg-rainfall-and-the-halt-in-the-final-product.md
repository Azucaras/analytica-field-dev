---
title: "2.3 Chuva do GPM IMERG e a interrupção do produto Final"
description: "O ATBD do IMERG V07 (lido, 2023-07-12) descreve uma estimativa de precipitação por satélite em grade, não um pluviômetro na propriedade."
checked: 2026-11-10
---

O [ATBD do IMERG V07 (lido, 2023-07-12)](https://arthurhou.pps.eosdis.nasa.gov/Documents/IMERG_V07_ATBD_final.pdf) descreve uma estimativa de precipitação por satélite em grade, não um pluviômetro na propriedade. A constelação GPM combina estimativas de precipitação por micro-ondas, interpola-as com vetores de movimento e preenche o tempo entre as passagens de micro-ondas com estimativas de infravermelho. O IMERG Daily agrega 48 estimativas de meia hora (documentado). A grade tem 0.1 grau, cerca de 11 km no equador (documentado), de modo que uma célula faz a média de condições entre coberturas do terreno e propriedades. Totais diários fornecem contexto regional, não chuva de campo.

Final e Late diferem no tempo e no ajuste das estimativas. A V07 Final aplica um ajuste mensal posterior com dados de pluviômetros do GPCC (documentado), o que a torna adequada para totais sazonais regionais retrospectivos. Não é um produto de acompanhamento da safra. O registro da V07 Final terminou em 2025-09-30 (documentado). O aviso de transição da NASA de 28 de abril de 2026 projetou inicialmente a V08 Final para o verão de 2026, e sua atualização de 6 de agosto de 2026 moveu essa projeção para o outono de 2026 (documentado); status verificado em 2026-11-10, lançamento não verificado.

Late é a alternativa mais rápida e menos ajustada. Ela fica disponível no dia seguinte (documentado), antes do ajuste mensal com pluviômetros da Final. Os números oficiais de latência divergem: o ATBD diz 12 horas e a [página do produto Late no GES DISC](https://www.earthdata.nasa.gov/data/catalog/ges-disc-gpm-3imergdl-07) diz 14 horas (documentado). No uso, descreva isso como contexto do dia seguinte e preserve a discrepância, em vez de escolher um número como garantia. O catálogo verificado da NASA chama Late de um híbrido que ingere o GPROF V08 enquanto mantém a calibração CORRA em uma climatologia de anos anteriores (documentado). Ele não equivale à série Final posterior, ajustada por pluviômetros, especialmente em um ano anômalo.

Um uso crível é mostrar a chuva regional de uma safra completa com a V07 Final até seu corte explícito, ou usar o Late como indicação do dia seguinte de que uma janela de plantio pode ter tido chuva. Esta última deve ser checada com um pluviômetro local ou com o relato do agricultor antes que uma ação dependa da quantidade. A pergunta que ele pode ajudar a formular é se a área mais ampla parece úmida o bastante para justificar a verificação de uma segunda janela de cultivo. Uma estimativa em grade pode ajudar a priorizar essa verificação. Ela não pode decidir se um campo individual foi plantado, recebeu chuva suficiente ou pode ser trabalhado.

A habilidade cai sobre superfícies congeladas, terreno complexo, litorais e regimes de chuva quente (documentado). A média em grade e as mudanças nas entradas da constelação podem obscurecer tempestades locais ou introduzir descontinuidades no registro. O T1 não tem validação com pluviômetro da propriedade-alvo, e a chuva sozinha não descreve armazenamento no solo, escoamento, drenagem ou irrigação.

**Figura S2-F3. Cronologia e papel do produto IMERG (documentado, status verificado em 2026-11-10).**

| Status do produto | Período ou latência | Papel adequado |
|---|---|---|
| V07 Final interrompido | Até 2025-09-30 (documentado) | Totais sazonais regionais retrospectivos |
| V07 Late | Dia seguinte; latência oficial de 12 ou 14 horas (documentado) | Pista regional mais rápida, verificada localmente |
| V08 Final | Projetado para o outono de 2026, não verificado como lançado (documentado) | Não afirmar disponibilidade atual |

**Decisão que pode informar.** Escolha se uma janela de plantio de área ampla justifica a verificação local de chuva, ou compare totais sazonais regionais completos com a V07 Final até 2025-09-30. Mostre a versão do produto, o período válido e a atualidade da fonte.

**Decisão que apenas ilustra.** O IMERG não pode disparar irrigação para um campo específico nem estabelecer a verdade da precipitação de campo. A V07 Final não pode sustentar valores posteriores a 2025-09-30, e o Late não pode ser apresentado com a qualidade da Final ajustada por pluviômetros. O produto é uma estimativa regional a ser verificada localmente, não um pluviômetro de propriedade.
