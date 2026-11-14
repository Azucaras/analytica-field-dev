# 10: strings-em-ingles-com-t
Status: done
Blocked by: 05
Demo: Com t stubbado para devolver a chave, sobra algum literal em inglês nas caixas?
What it delivers: Módulo único de strings em inglês lido por t(), com pt-BR vazio e inglês como padrão.
Interface: t
Validation method: tests
## Criteria
- With `t` stubbed to return the key, no visible string in the seven boxes equals an English literal. False if: a literal survives the stub.
- With no stored locale, `t` resolves `en`. False if: it falls back to `pt-BR` or throws.
## Evidence required
- Saída de `npx vitest run` com a varredura de literais e o teste de padrão de locale.
