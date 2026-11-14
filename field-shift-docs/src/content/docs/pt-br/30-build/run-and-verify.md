---
title: Executar e verificar
description: Cada verificação, como é uma aprovação, como é uma falha e o que afrouxar primeiro.
---

Primeiro as verificações do site, depois as verificações de dados das quais o app depende. Cada comando indica o seu ambiente de execução.

## Site

| Verificação | Aprovação | Falha | Comando |
|---|---|---|---|
| Build | Saída 0, `dist/` gerado | Link quebrado, título ausente, componente indefinido | `npm run build` |
| Índice servido | 200 | 404 significa que o plugin não está registrado ou que `site` não está definido | `curl -s -o /dev/null -w '%{http_code}' http://localhost:4321/llms.txt` |
| Tipo do espelho | `text/markdown` | `application/octet-stream`, que um agente interpreta como download | `curl -sI http://localhost:4321/architecture.md \| grep -i content-type` |
| Encaixe da tabela | Sem rolagem lateral | `scrollWidth` maior que `clientWidth` em uma tabela | Meça no console, não a olho |

## Dados

| Verificação | Aprovação | Falha | Comando |
|---|---|---|---|
| Respostas do POWER | 200 com valores | Diferente de 200, ou somente valores de preenchimento | `curl -sSG https://power.larc.nasa.gov/api/temporal/daily/point --data-urlencode parameters=T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN --data-urlencode community=AG --data-urlencode latitude=-11.97 --data-urlencode longitude=-55.28 --data-urlencode start=20250101 --data-urlencode end=20250131 --data-urlencode format=JSON` |
| Consulta CMR delimitada | 200 com granules dentro da caixa | 200 com granules globais, o que significa que a caixa delimitadora está ausente | Mesma chamada com `bounding_box` e `sort_key=-start_date` no endpoint de granules |
| Forma do JSON | Chaves esperadas presentes e contagem diferente de zero | Feed vazio, ou valor com códigos de preenchimento | `jq '.feed.entry \| length'` no arquivo de resposta |

## Caminho de falha, na ordem em que se deve afrouxar

1. Verifique o status HTTP e a string de consulta, não o código.
2. Recue para o caminho sem conta: somente POWER e CMR, e fixture para o resto.
3. Reduza o intervalo de datas e depois a caixa delimitadora.
4. Reduza a uma única camada e a uma família de indicadores.
5. Recorra à fixture estática, identificada como fixture com a data do build.

Nunca afrouxe a máscara de qualidade, a junção de campo e temporada, nem a regra de abstenção para fazer um resultado aparecer.
