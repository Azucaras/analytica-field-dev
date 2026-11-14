# 08: seletor-de-safra
Status: done
Blocked by: 01
Demo: O seletor lista as safras do fixture com 2025/26 marcada?
What it delivers: Seletor de safra alimentado pelo fixture, com padrão fixo.
Interface: SeasonSelect
Validation method: tests
## Criteria
- The selector lists the fixture seasons and defaults to `2025/26`. False if: the default differs or the list is empty.
## Evidence required
- Saída de `npx vitest run` com o teste de opções e padrão.
