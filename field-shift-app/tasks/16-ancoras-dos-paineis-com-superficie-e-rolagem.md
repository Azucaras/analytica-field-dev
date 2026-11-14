# 16: ancoras-dos-paineis-com-superficie-e-rolagem
Status: done
Blocked by: 14
Demo: Cada caixa aparece na sua âncora, com superfície translúcida e rolagem interna quando enche?
What it delivers: As oito âncoras, a superfície translúcida, a ordem de camadas fixa e a altura máxima por painel.
Interface: PanelSurface, ZOrder
Validation method: computer use
## Criteria
- Each of the eight anchors holds its named box in the named corner or edge. False if: any box renders elsewhere.
- A panel with more rows than fit scrolls inside its own box. False if: it grows past the maximum or the document scrolls.
- The computed z-order follows agent bar above cards above notice above evidence above rail above chips. False if: any pair is inverted.
## Evidence required
- Captura em 1440 nomeada pelo AC-03.
- Captura do painel de evidência com rolagem interna, nomeada pelo AC-06.
- Saída do teste de ordem de camadas do AC-07.
