# Field Shift, apoio à decisão de rotação

Contexto do aplicativo que compara rotações de cultura em um talhão a partir de observação de satélite, restrições do produtor e evidência datada. O vocabulário abaixo existe para impedir que um valor de satélite, um valor de modelo e um valor digitado pelo produtor circulem como se fossem a mesma coisa.

## Território e tempo

**Talhão**:
A menor unidade que o app compara e sobre a qual todas as camadas são recortadas. Um talhão tem limite versionado e nunca é renomeado.
_Avoid_: campo, área, polígono, lote

**Município**:
A unidade da evidência climática e de produtividade. O talhão herda a evidência do seu município, e essa evidência nunca descreve o talhão.
_Avoid_: região, área

**Safra**:
O intervalo de uma campanha agrícola nomeado por ano de colheita, por exemplo 2025/26. Toda comparação acontece dentro de uma safra.
_Avoid_: temporada, ciclo, ano

**Limite versionado**:
O contorno do talhão em uma versão datada. Redesenhar o contorno cria uma versão nova em vez de editar a anterior.
_Avoid_: geometria, shapefile

## Dado e evidência

**Camada**:
Uma série de valores recortada por talhão e safra, com procedência, resolução e data próprias.
_Avoid_: tema, overlay, raster

**Base**:
O rótulo que diz como um valor nasceu. São cinco: observado, recuperado, reportado, modelado e inserido. Um valor sem base não entra em cartão.
_Avoid_: tipo, origem, fonte

**Observado**:
Valor medido por sensor, com hora de aquisição e pegada conhecidas.
_Avoid_: medido, real

**Recuperado**:
Valor geofísico invertido a partir de uma medição, carregando erro de recuperação. Umidade de solo do SMAP é recuperada, não observada.
_Avoid_: derivado, calculado

**Modelado**:
Valor produzido por modelo de superfície, como zona radicular. Não é medição e não substitui uma.
_Avoid_: simulado, estimado

**Reportado**:
Estatística oficial publicada por um órgão, como produtividade do IBGE PAM ou o índice RONI do CPC. Um valor derivado de um reportado e de um modelado fica com a base mais fraca, modelado.
_Avoid_: oficial, censitário, inserido

**Inserido**:
Fato digitado pelo produtor, com autor e data. Histórico de cultura é sempre inserido.
_Avoid_: manual, informado, declarado

**Fixture datada**:
Resposta real de um endpoint público, gravada e servida com a data da gravação. Substitui o dado vivo só até o dado vivo entrar.
_Avoid_: mock, dado falso, seed

**Evidência**:
A ligação entre uma afirmação do app e o valor, a data e a fonte que a sustentam. Sem evidência, uma afirmação é opinião.
_Avoid_: prova, referência

## Decisão

**Restrição**:
Condição do produtor que decide viabilidade antes da agronomia, como arrendamento, seguro, crédito, água ou comprador. Uma restrição não respondida é um estado válido.
_Avoid_: preferência, requisito, filtro

**Cenário de rotação**:
Uma sequência de culturas proposta para o talhão em uma safra. A sequência atual do produtor é sempre um cenário.
_Avoid_: estratégia, alternativa, plano

**Cartão de cenário**:
O objeto que carrega um cenário e os cinco campos que o tornam julgável: motivo, evidência, benefício, lacuna e risco.
_Avoid_: card, ficha, popup

**Abstenção**:
O estado em que o app prefere não ranquear, porque a cobertura ou o número de safras não sustenta a comparação. Abstenção é resultado, não erro.
_Avoid_: falha, vazio, indisponível
