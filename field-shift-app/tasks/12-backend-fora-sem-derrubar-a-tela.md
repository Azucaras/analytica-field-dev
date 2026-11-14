# 12: backend-fora-sem-derrubar-a-tela
Status: done
Blocked by: 11
Demo: Com o backend parado, as sete caixas continuam na tela com o motivo da falha?
What it delivers: Resiliência da árvore quando a API não responde.
Interface: None
Validation method: tests
## Criteria
- With the backend down, the seven boxes still render and the empty state names the failure. False if: the tree crashes or renders nothing.
## Evidence required
- Saída de `npx vitest run` com o backend mockado em erro.
