# 05: cartao-de-cenario-com-cinco-campos
Status: done
Blocked by: 01
Demo: Cada cartão mostra Why, Evidence, Benefit, Gap e Risk, com a sequência atual em primeiro?
What it delivers: Cartão de cenário completo, com a sequência atual marcada e ordenada primeiro.
Interface: ScenarioCards
Validation method: tests
## Criteria
- The first `option` row is the current sequence. False if: the row labelled `Current sequence` is not first.
- Each card exposes the five labels. False if: any label is absent on any card.
## Evidence required
- Saída de `npx vitest run` com o teste de ordem e o teste dos cinco rótulos em três cartões.
