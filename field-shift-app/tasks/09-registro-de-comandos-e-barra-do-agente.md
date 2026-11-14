# 09: registro-de-comandos-e-barra-do-agente
Status: done
Blocked by: 02
Demo: Enviar `set_composition` com preset satellite muda o mapa, e um nome inválido volta 422 com a lista?
What it delivers: Registro de comandos com quatro efeitos, endpoint `/commands` e barra do agente executando por nome.
Interface: registerCommand, runCommand, listCommands, AgentBar, GET /commands
Validation method: tests
## Criteria
- `runCommand("set_composition", {preset:"satellite"})` leaves the store in `satellite`. False if: the store is unchanged.
- An unregistered name returns 422 with the valid names. False if: status is 200 or the body omits the names.
- `GET /commands` returns four entries, each with name, label, input schema, effect, idempotency flag and guard. False if: a field is missing or the count differs.
- The four effects stay the only accepted values. False if: a fifth registers.
## Evidence required
- Saída de `npx vitest run` com os testes de execução, de 422 e de esquema.
- Saída de `curl -s localhost:8000/commands` com as quatro entradas.
