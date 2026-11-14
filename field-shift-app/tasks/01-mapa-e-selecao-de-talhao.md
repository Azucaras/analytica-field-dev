# 01: mapa-e-selecao-de-talhao
Status: done
Blocked by: None
Demo: Ao abrir a raiz, o mapa renderiza e selecionar um talhão mostra três linhas de cenário?
What it delivers: A primeira tela do app, com mapa, lista de talhões vinda do servidor e três cenários ao selecionar.
Interface: MapCanvas, ScenarioCards, GET /fields, GET /fields/{id}/scenarios, GET /health
Validation method: tests
## Criteria
- When `/` loads, a `region` named `Field map` renders. False if: the region is absent.
- When `select_field` runs for `mt-santa-carmem-01`, exactly three `option` rows render. False if: two or four rows render.
- `GET /health` answers 200 in under 0.1 s. False if: the code is not 200 or the time exceeds 0.1 s.
## Evidence required
- Saída de `npx vitest run` com os dois testes de render passando.
- Saída de `curl -w '%{time_total}' localhost:8000/health` com código e tempo.
- Saída de `curl -s localhost:8000/fields` listando três talhões.
- Execução vermelha do teste antes da implementação.
