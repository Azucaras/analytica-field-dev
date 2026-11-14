# 04: abstencao-no-servidor-e-aviso
Status: done
Blocked by: 01
Demo: O talhão 03 mostra o aviso de abstenção com o limiar que falhou e nenhuma nota de ranking?
What it delivers: Estado de abstenção calculado no servidor e renderizado como aviso, mantendo os cartões visíveis.
Interface: AbstentionNotice, GET /fields/{id}/scenarios
Validation method: cli transcript
## Criteria
- `GET /fields/mt-santa-carmem-03/scenarios` carries `state: "abstained"` and the failing threshold name. False if: it returns `ranked` or omits the name.
- The same request for `mt-santa-carmem-01` carries `state: "ranked"` and no threshold. False if: it returns `abstained`.
- While the notice shows, cards stay visible and no rank marker renders. False if: cards unmount or a `#1` marker appears.
## Evidence required
- Transcrição dos dois `curl` com os estados opostos.
- Captura da tela no talhão 03, nomeada pelo AC-09, mostrando cartões e aviso.
