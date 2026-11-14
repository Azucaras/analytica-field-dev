# 06: painel-de-evidencias-com-base-e-lacuna
Status: done
Blocked by: 05
Demo: Cada linha de evidência mostra base, data e fonte, e a célula sem série diz No observation?
What it delivers: Painel de evidência com as cinco colunas, base obrigatória e lacuna explícita.
Interface: EvidencePanel
Validation method: tests
## Criteria
- Each evidence row contains a basis label from the four allowed values. False if: a row shows none or a value outside the four.
- A cell with no series renders `No observation`. False if: it is empty, shows `0`, or shows `-`.
- The table exposes the columns Layer, Value, Basis, As of, Source. False if: a column is missing.
## Evidence required
- Saída de `npx vitest run` com os testes de base, lacuna e colunas.
