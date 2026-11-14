# 17: faixa-estreita-e-atribuicao
Status: done
Blocked by: 16
Demo: Em 360 px os chips rolam na horizontal, os cartões ficam na faixa de baixo e o crédito continua visível?
What it delivers: Comportamento até 640 px e controle de atribuição sempre presente.
Interface: None
Validation method: computer use
## Criteria
- The attribution control renders bottom-right and stays visible after a preset switch. False if: absent, covered or below the fold.
- At 360 px the chips scroll horizontally and the cards occupy the bottom band. False if: chips wrap into rows or cards sit above the midline.
- At 360x640 there is no horizontal document scroll. False if: `scrollWidth` exceeds `clientWidth`.
## Evidence required
- Três capturas: 360 px com chips rolando, cartões na faixa e atribuição visível, nomeadas por AC-08, AC-09 e AC-12.
