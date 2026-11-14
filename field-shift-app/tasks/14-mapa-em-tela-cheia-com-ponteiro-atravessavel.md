# 14: mapa-em-tela-cheia-com-ponteiro-atravessavel
Status: done
Blocked by: 13
Demo: O mapa ocupa a janela inteira e arrastar numa área livre move a câmera?
What it delivers: Casca de tela cheia com o mapa atrás e as caixas em contêineres que deixam o ponteiro passar.
Interface: AppShell, PointerRule
Validation method: computer use
## Criteria
- At 1440x900 the canvas measures at least the viewport width and height. False if: narrower or shorter than the viewport.
- Dragging in a free map area moves the camera. False if: the press lands on an overlay container and the camera does not move.
- With the scenario list empty the anchors hold and the map stays interactive. False if: the layout collapses or the map stops responding.
## Evidence required
- Captura em 1440x900 com o nome do AC-01 na legenda.
- Captura antes e depois de um arrasto na área livre, nomeada pelo AC-05 e pelo AC-14.
