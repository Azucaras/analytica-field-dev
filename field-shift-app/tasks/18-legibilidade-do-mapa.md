# 18: legibilidade do mapa em zoom de talhao
Status: done
Blocked by: 16
Demo: O mapa mostra feicao e borda do talhao em vez de cor chapada, e a camada continua legivel na legenda?
What it delivers: Zoom inicial no talhao, opacidade de camada que deixa o basemap ler, e data de camada escolhida por cobertura.
Interface: None
Validation method: computer use
## Criteria
- On load the map opens at zoom 11 or higher, centred on the first field, and the field boundary is distinguishable. False if: the view opens wider than zoom 10 or the boundary is invisible.
- The raster layer renders at opacity 0.6 or lower in the `Satellite` preset so basemap features read through. False if: opacity is 1 and the scene is a flat colour.
- The layer date shown in the rail is the newest date that returns an image for the current viewport. False if: the rail shows a date whose tile request answers 404 or 400.
## Evidence required
- Captura 1440x900 nomeada AC-legibilidade antes e depois, com a borda do talhao visivel.
- Saida de dois curls de tile comparando a data exibida na rail com o status do upstream.
