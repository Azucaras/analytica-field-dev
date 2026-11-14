# Camada de satélite vem do GIBS público, com raster sintético para o que ele não cobre

status: accepted
date: 2026-11-10

O app precisa de camada de satélite na primeira tela, e a máquina do juiz não tem Earthdata Login. Decidimos servir as camadas NASA pelo GIBS, que responde sem chave, e servir raster sintético gerado localmente para o que o GIBS não tem, como aptidão de solo. A rota autenticada com `earthaccess` fica pronta atrás dessa base, nunca abaixo dela, porque a demo não pode depender de um login que o juiz não tem.

## Consequências

O teto de zoom do conjunto SMAP do GIBS é Level6, cerca de 2,4 km por pixel, então a camada sustenta leitura regional e a legenda precisa dizer isso. O raster sintético entra com selo de fixture e data de geração, e é o primeiro a ser trocado quando o dado autenticado chegar.

## Alternativas consideradas

- Instalar `earthaccess` e baixar granada real: melhor dado, pior alcance, porque exige credencial e download no caminho da primeira tela.
- Só raster sintético: controle visual total, mas perde a narrativa de que é camada NASA de verdade.
