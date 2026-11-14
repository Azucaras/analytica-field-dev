---
title: "9.2 Pontuação de três rotações com evidências, lacunas e risco"
description: "Data de execução: 2026-11-10 (documentado)."
checked: 2026-11-10
---

## Status e entradas públicas

Data de execução: 2026-11-10 (documentado). Esta é uma comparação ilustrativa, não uma recomendação validada. Geografia: Santa Carmem, Mato Grosso, Brasil; ponto representativo (11.97° S, 55.28° W) (coordenadas de consulta documentadas), não um limite de campo. A [consulta ao NASA POWER](https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=AG&longitude=-55.28&latitude=-11.97&start=20250101&end=20250131&format=JSON&time-standard=UTC) sem login retornou 31 valores diários de T2M para janeiro de 2025 (documentado), com média de 25.28 °C (calculada a partir dos valores retornados; base: reanálise MERRA-2, grade de aproximadamente 0.5 grau; recuperado em 2026-11-10). Os [metadados públicos do CMR](https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=C2938664763-NSIDC_CPRD&page_size=5&sort_key=-start_date&bounding_box=-55.50%2C-12.10%2C-55.10%2C-11.80) listaram cinco registros do SMAP L3, o mais recente em 2026-11-09 (resultado documentado do catálogo; verificado em 2026-11-10). Nenhum valor do SMAP foi recuperado; os downloads exigem Earthdata Login. Nenhuma das fontes valida as condições do campo nem os resultados da rotação.

Histórico lembrado/manual, não verificado, inserido em 2026-11-10 (lembrado): soja em 2023/24, soja mais milho safrinha em 2024/25, soja em 2025/26. As alternativas são hipotéticas; o contexto compartilhado da NASA não distingue os cenários.

## Critérios e agregação

| Critério | Direção e unidades | Regra de pontuação e disponibilidade |
|---|---|---|
| Diversidade de cultivos | Maior; tipos de cultivo distintos em três temporadas | 100 x min(count / 3, 1) (fórmula de pontuação calculada); três tipos é uma meta provisória de projeto. |
| Adequação à janela de plantio | Maior; temporadas adequadas / temporadas avaliadas, em percentual | Requer datas e calendário locais; indisponível. Qualquer limiar de aprovação é provisório. |
| Viabilidade operacional | Maior; restrições viáveis declaradas / restrições declaradas, em percentual | Requer entradas do agricultor; indisponível. Qualquer limiar de aprovação é provisório. |

Regra de agregação: calcule a média simples das pontuações válidas dos critérios somente quando pelo menos dois dos três critérios estiverem disponíveis (limiar de projeto calculado); caso contrário, a pontuação agregada e o ranking ficam indisponíveis. Esta regra de completude é provisória e não validada. Um composto de 70 ou mais (limiar provisório de projeto calculado) apenas sinaliza uma opção para revisão humana; 70 é um limiar não validado, nunca uma seleção automática. As pontuações de diversidade de cultivos são 67/100 para o caso atual (calculado a partir de 2 tipos inseridos) e 100/100 para cada alternativa (calculado a partir de 3 ou mais tipos inseridos). Apenas um critério está disponível (calculado a partir dos dados fornecidos), então nenhuma pontuação agregada ou ranking é produzido.

## Comparação de três rotações

| Cenário e cinco campos de desafio | Comparação detalhada |
|---|---|
| **Atual: soja / soja + milho safrinha / soja. Por que é sugerida:** linha de base. **Evidência:** sequência manual inserida em 2026-11-10; 2 tipos, 67/100 (calculado a partir da sequência inserida); entradas públicas datadas do POWER e do CMR acima. **Benefícios:** continuidade com a prática inserida; benefício na fazenda indisponível. **Lacunas de informação:** histórico verificado, limite do campo, datas, produtividades, custos e solo indisponíveis. **Riscos que precisam de revisão local:** calendário, água, pragas, mercado e adequação de equipamentos indisponíveis. **Responsável pela decisão:** agricultor, com revisão de agrônomo. | Caso de referência, não verdade de referência. |
| **Alternativa A: soja / soja + milho safrinha / algodão. Por que é sugerida:** testa uma cultura diferente na terceira temporada. **Evidência:** sequência manual hipotética inserida em 2026-11-10; 3 tipos, 100/100 (calculado a partir da sequência inserida); entradas públicas datadas do POWER e do CMR acima. **Benefícios:** a diversificação é uma hipótese; benefício realizado indisponível. **Lacunas de informação:** adequação do algodão, datas locais, orçamento de insumos, comprador e histórico verificado indisponíveis. **Riscos que precisam de revisão local:** água, pragas, mercado, equipamentos e época indisponíveis. **Responsável pela decisão:** agricultor, com revisão de agrônomo. | Candidata a verificações de viabilidade local, não uma previsão. |
| **Alternativa B: soja / soja + milho + cobertura de ruzigrass / algodão. Por que é sugerida:** testa a adição de cobertura e a mudança da cultura seguinte. **Evidência:** sequência manual hipotética inserida em 2026-11-10; 4 tipos, 100/100 (calculado a partir da sequência inserida); entradas públicas datadas do POWER e do CMR acima. **Benefícios:** os ganhos de cobertura e de diversificação são hipóteses; benefício medido indisponível. **Lacunas de informação:** estabelecimento, manejo de encerramento, sementes, água, solo, custos e histórico verificado indisponíveis. **Riscos que precisam de revisão local:** competição da cobertura, época de encerramento, pragas, maquinário e adequação ao algodão indisponíveis. **Responsável pela decisão:** agricultor, com revisão de agrônomo. | Candidata a verificações de viabilidade local, não uma previsão. |

**Figura S9-F2. Comparação ilustrativa (base: calculada a partir de cenários inseridos à mão e de entradas públicas documentadas do POWER e do CMR; não é uma recomendação validada).**

Este exemplo usa o caminho público sem login mais o histórico inserido manualmente. Ele compara opções, mas não sustenta produtividade, lucro, causalidade sobre a saúde do solo nem um vencedor. O POWER é um contexto climático amplo; as entradas do catálogo SMAP não são evidência de umidade do campo. A revisão agronômica local é necessária antes de mudar uma rotação.
