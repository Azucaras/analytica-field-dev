# 07: restricoes-com-desconhecido-e-assumes
Status: done
Blocked by: 01
Demo: Deixar água como unknown marca as linhas dependentes com assumes?
What it delivers: Formulário de quatro restrições com padrão unknown e marcação assumes na evidência dependente.
Interface: ConstraintForm
Validation method: tests
## Criteria
- The form renders four labelled controls each defaulting to `unknown`. False if: a control is missing or a default differs.
- With water left `unknown`, dependent evidence rows carry `assumes`. False if: the label is absent.
## Evidence required
- Saída de `npx vitest run` com os testes dos quatro controles e do rótulo assumes.
