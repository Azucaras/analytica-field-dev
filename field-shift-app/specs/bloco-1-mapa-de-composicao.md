# Spec: Bloco 1, mapa de composição com fixture datada

Aprovações e decisões ficam em STATE.md (seções Approvals e Decisions). Este arquivo não carrega linha de aprovação.

## Problem

O time precisa ver, rodando, a gramática de tela que o resto do app vai herdar: um mapa que compõe camada de satélite com rótulo, três cenários de rotação lado a lado e o painel de evidência que sustenta cada um. Hoje existe dossiê, site e nenhuma tela. O resultado serve para julgar espaço, hierarquia e o mecanismo de abstenção antes de qualquer estilo final, e o produto é em inglês porque é assim que ele será avaliado.

## Users and scope

- Users: o time de build, o juiz do hackathon e, por tabela, o produtor que a tela imita.
- In scope: as seis caixas com conteúdo fixture, três talhões em Santa Carmem, composição de camada, abstenção decidida no servidor, registro de comandos com quatro efeitos, strings em inglês.
- Out of scope: estilo final, transições, voz, `earthaccess` real, segunda língua populada, autenticação, persistência além de fixture. Motivo: cada um tem bloco próprio e nenhum é pré-requisito para julgar a gramática.

## Requirements

- R-01 (ubiquitous): The app SHALL render the field map as the first screen at route `/`.
- R-02 (ubiquitous): The app SHALL render exactly six boxes: map, layer rail, scenario cards, evidence panel, season selector and agent bar.
- R-03 (event-driven): When a field is selected, the app SHALL render exactly three scenario cards, the current sequence first.
- R-04 (ubiquitous): Each scenario card SHALL display exactly five labelled fields: `Why`, `Evidence`, `Benefit`, `Gap` and `Risk`.
- R-05 (ubiquitous): Each evidence row SHALL display the source URL, the as-of date and one basis label from `observed`, `retrieved`, `modelled` or `entered`, taken from that row's own `basis` field and from nothing else.
- R-06 (unwanted behaviour): If an evidence cell has no supporting series, then the app SHALL render the text `No observation` in place of the value.
- R-07 (state-driven): While coverage is below 80 percent of valid area, or fewer than two seasons are supported, the app SHALL render the abstention notice naming the failing threshold.
- R-08 (event-driven): When the abstention notice renders, the app SHALL keep the three cards visible and SHALL hide any ranking number.
- R-09 (ubiquitous): The layer rail SHALL offer exactly three composition presets: `Map`, `Satellite` and `Satellite with labels`.
- R-10 (event-driven): When a composition preset is chosen, the app SHALL recompose layers without remounting the map, preserving camera centre and zoom.
- R-11 (ubiquitous): Each layer entry in the rail SHALL display its basis, its resolution and its as-of date.
- R-12 (ubiquitous): The app SHALL request satellite tiles from the backend proxy at `/tiles/{layer}/{z}/{x}/{y}`.
- R-13 (unwanted behaviour): If the proxy answers 5xx, then the app SHALL fall back to the local reserve archive and render a status message naming the fallback.
- R-14 (ubiquitous): Every evidence row SHALL be presented from its own fields only: its displayed layer name SHALL be the `layer` string the fixture returns, its basis label SHALL be the label of its own `basis` through the matching `evidence.basis_*` catalog key, and its value SHALL print as the fixture returns it. Presentation SHALL be a function of basis alone, in exactly two classes: `observed`, `retrieved` and `entered` are measured bases, whose value presents as measured; `modelled` is a marked basis, whose value presents beside the `modelled` basis label and SHALL NOT be presented as measured. No row whose basis is a measured basis SHALL carry a modelled or an assumed marker, and no row's layer name or basis label SHALL be rewritten from any state outside the row.
- R-15 (ubiquitous): The app SHALL NOT carry a user control, global or per field, that sets, clears or overrides the honesty label or the presented value of any evidence row, and SHALL NOT relabel rows by matching a pattern in their layer name. The honesty label of a row SHALL derive from that row's `basis` alone.
- R-16 (ubiquitous): The season selector SHALL list the seasons present in the fixture and SHALL default to `2025/26`.
- R-17 (event-driven): When the agent bar submits a command name and JSON arguments, the app SHALL run that command through the registry.
- R-18 (unwanted behaviour): If a submitted command name is not registered, then the registry SHALL reject it with HTTP 422 and a body listing the valid names.
- R-19 (ubiquitous): `GET /commands` SHALL return, for each registered command, its name, label, input schema, effect, idempotency flag and guard.
- R-20 (ubiquitous): The app SHALL read every user-visible string from `src/strings/en.ts` through `t()`.
- R-21 (state-driven): While a panel is loading, the app SHALL render its skeleton; while a panel has no data, the app SHALL render its empty state with the reason.
- R-22 (ubiquitous): The proxy SHALL cache each tile on disk for 24 hours and serve the cached file on a repeat request.
- R-23 (ubiquitous): The backend SHALL answer `GET /health` with status 200 in under 100 ms.
- R-24 (ubiquitous): The app SHALL keep `en` as the default locale and SHALL NOT require a locale choice to render.
- R-25 (ubiquitous): The abstention decision SHALL be computed only on the server, from the fixture, and the client SHALL NOT recompute it.

## Expected Interface

Nomes públicos apenas. O contrato de DOM vale por papel e nome acessível, para o teste sobreviver a reestilização.

- `MapCanvas`: `<section role="region" aria-label="Field map">`, hospeda o MapLibre e as camadas do Deck.
- `LayerRail`: `<nav aria-label="Layers">`, com três botões de preset nomeados `Map`, `Satellite` e `Satellite with labels`.
- `ScenarioCards`: `<ul aria-label="Rotation scenarios">` com três `<li role="option">`, `aria-current` na sequência atual, heading com o nome do cenário.
- `EvidencePanel`: `<section role="region" aria-label="Evidence">`, `<table>` com as colunas `Layer`, `Value`, `Basis`, `As of`, `Source`.
- `SeasonSelect`: `<select aria-label="Season">`.
- `AgentBar`: `<form aria-label="Agent command">` com `role="textbox"` no campo de comando e `role="alert"` para rejeição.
- `AbstentionNotice`: `role="status"`, texto com o nome do limiar que falhou.
- `registerCommand`, `runCommand`, `listCommands` em `src/lib/commands.ts`: registro em memória com efeito restrito a `select_field`, `set_composition`, `open_panel` e `apply_filter`, com `open_panel` aceitando apenas `scenarios` ou `evidence` no campo `panel`.
- `useMapStore`: estado de talhão selecionado, preset de composição, painel aberto e filtro, com as ações homônimas dos quatro efeitos.
- `t(key)`: leitura de `src/strings/en.ts`, chave plana com namespace por caixa.
- `GET /fields`, `GET /fields/{id}/scenarios`, `GET /layers`, `GET /commands`, `GET /tiles/{layer}/{z}/{x}/{y}`, `GET /health`.
- Withdrawn: `PUT /fields/{id}/constraints` and `GET /fields/{id}/evidence` were listed here in earlier revisions and neither is implemented. `backend/main.py` answers exactly eight routes: `GET /commands`, `POST /commands/{name}`, `GET /layers`, `GET /tiles/stats/upstream`, `GET /tiles/{layer}/{z}/{x}/{y}`, `GET /health`, `GET /fields` and `GET /fields/{field_id}/scenarios`; no constraints route and no evidence route exists in it. `src` never requests `/evidence`: the evidence panel renders `evidence_rows` of the current scenario from the scenarios response (`src/App.tsx` lines 114-120). No requirement, criterion or task in this file depends on either endpoint (block 1 AM-01, block 1 AM-11).

## Assumptions

- A camada SMAP do GIBS sustenta leitura regional em zoom de 4 a 6; verificada por AC-11, que exige a resolução declarada na rail.
- O fixture de três talhões cobre os casos de gate; verificado por AC-07 e AC-08, que exigem um talhão reprovado e dois aprovados.
- O proxy local responde mais rápido que o GIBS direto; verificado por AC-22, que exige acerto de cache na segunda requisição.
- `en.ts` é fonte única de string; verificado por AC-20, que falha se aparecer literal solto em JSX.

## Open questions

Vazio no congelamento.

## Frozen answers

| Round | Question | Answer | Requirement row |
|---|---|---|---|
| 1 | Cadência | "a ideia é usar a skill spec-driven-coding, tanto para implementações curtas quanto para longas (opção (a) pode ser viável também em etapas de iteração)" | R-02 |
| 1 | Recorte | "pode manter, depois expandimos para mais regiões" | R-03 |
| 1 | Primeira família de dados | "(a) e (b), (c) acho que vem depois (mas numa etapa posterior próxima)" | R-11, R-12, R-13 |
| 1 | Política de mock | "esses mocks são apenas para essa etapa inicial, a ideia é não mockar nada" | R-05, R-06 |
| 1 | Contrato de invocação | "(a)" registro tipado | R-17, R-18, R-19 |
| 1 | Inventário do wireframe | "cabe tudo isso sim, e podemos adicionar dados sim nas caixas" | R-02 |
| 2 | Onde o app nasce | "crie a pasta em ... pode fazer com backend, opção (a)" | R-01 |
| 2 | Alternador | "(b)" pilha de camadas com opacidade | R-09, R-10 |
| 2 | Tiles e fixtures | "(a) e (b)" proxy mais reserva local | R-12, R-13, R-22 |
| 2 | Esquema do registro | "pode ser sim, depois vamos melhorar isso" | R-19 |
| 2 | Língua do produto | "o app em si é em inglês" | R-20, R-24 |
| 2 | Caixas com dado | "as três" | R-04, R-05 |
| 2 | Parada | "(a)" | R-07, R-08 |
| 3 | Fixture | "exatamente esse recorte" | R-03, R-07 |
| 3 | Lugar da abstenção | "fica em um lugar só" | R-25 |
| 3 | Lista de comandos | "usar recomendação" | R-17 |
| 3 | Stack | "confirmar os cinco" | R-01 |

## Acceptance criteria

- AC-01 (covers R-01; method: computer use): When the dev server serves `/`, the app SHALL render a `region` named `Field map`. False if: the map section is absent, or the first screen is a landing panel.
- AC-02 (covers R-02; method: tests): The rendered tree SHALL contain one instance of each of the six named regions. False if: any of the six is missing, or a seventh top-level box appears.
- AC-03 (covers R-03; method: tests): When `select_field` runs for field `mt-santa-carmem-01`, the scenario list SHALL contain exactly three `option` rows. False if: two or four rows render.
- AC-04 (covers R-03; method: tests): The first `option` row in the list SHALL be the current sequence. False if: the row labelled `Current sequence` is not first.
- AC-05 (covers R-04; method: tests): Each card SHALL expose the five labels `Why`, `Evidence`, `Benefit`, `Gap`, `Risk`. False if: any label is absent on any card.
- AC-06 (covers R-05; method: tests): Each evidence row SHALL contain the basis label of its own `basis`, from the four allowed values. False if: a row shows no basis, shows a value outside the four, or shows a label that differs from the `basis` the row carries.
- AC-07 (covers R-07, R-25; method: cli transcript): When `GET /fields/mt-santa-carmem-03/scenarios` runs, the response SHALL carry `state: "abstained"` and the failing threshold name. False if: the response is `ranked`, or the threshold name is missing.
- AC-08 (covers R-07; method: cli transcript): When the same request runs for `mt-santa-carmem-01`, the response SHALL carry `state: "ranked"` and no threshold. False if: the response is `abstained`.
- AC-09 (covers R-08; method: computer use): While the abstention notice shows, the cards SHALL stay visible and no rank number SHALL appear. False if: cards unmount, or a `#1` marker still renders.
- AC-10 (covers R-09; method: tests): The layer rail SHALL contain exactly three preset buttons with those names. False if: a fourth preset appears or a name differs.
- AC-11 (covers R-11; method: tests): Each rail entry SHALL show basis, resolution and as-of date. False if: any of the three is missing on any entry.
- AC-12 (covers R-10; method: computer use): After switching `Map` to `Satellite`, the camera centre and zoom SHALL be unchanged. False if: zoom changes, or the map remounts and reloads tiles.
- AC-13 (covers R-12; method: cli transcript): A tile request SHALL hit `/tiles/{layer}/{z}/{x}/{y}` on the local origin. False if: the request goes straight to `gibs.earthdata.nasa.gov`.
- AC-14 (covers R-13; method: cli transcript): With the upstream forced to 503, the app SHALL serve the reserve tile and render the fallback message. False if: the map blanks, or no message renders.
- AC-15 (covers R-14; method: tests): With `Supporting data` open and each of the three fixture fields selected in turn, every evidence row in the panel SHALL carry the layer name and the basis label of its own fixture row, and the panel renders the rows of the field's current scenario, which is how the two-row count below is derived. For `mt-santa-carmem-01` that is two rows: `SMAP soil moisture`, basis `retrieved`, value `0.28 m³/m³`; and `Crop history`, basis `entered`. For `mt-santa-carmem-02` the same two rows carry `0.31 m³/m³`; for `mt-santa-carmem-03` they carry `0.19 m³/m³`. No layer name SHALL carry a parenthetical suffix, and no basis label SHALL differ from the basis its row carries. The modelled class SHALL be proven by a test that renders `EvidencePanel` with one injected row of basis `modelled`, which SHALL show that row's value beside the `modelled` basis label and SHALL NOT present it as measured. The modelled class is injected because no current scenario carries a `modelled` row and the panel renders the current scenario only, so the fixture needs no new data. False if a row is missing or extra, a basis label differs from its row, a layer name carries a suffix the fixture does not contain, or the modelled row presents as measured or loses its `modelled` label.
- AC-16 (covers R-15; method: tests): At first paint, and again with each toggle open, the rendered tree SHALL contain no `form` element other than the `Agent command` form, and that form SHALL be mounted only while its toggle is open. No control labelled `Water`, `Rent`, `Credit` or `Market outlet` SHALL exist in any of those states. With the panel open, activating every disclosure control the app renders SHALL leave every evidence row's layer name and basis label unchanged, and the SMAP rows SHALL read `SMAP soil moisture` and `retrieved` before and after each activation. False if a second form exists, a control with one of those four labels is found, or a row's layer name or basis label changes after an activation.
- AC-17 (covers R-16; method: tests): The season selector SHALL list the fixture seasons and default to `2025/26`. False if: the default differs or the list is empty.
- AC-18 (covers R-17; method: tests): When `runCommand("set_composition", {preset:"satellite"})` runs, the store composition SHALL be `satellite`. False if: the store is unchanged.
- AC-19 (covers R-18; method: tests): Submitting an unregistered name SHALL return 422 with the valid names. False if: the status is 200, or the body omits the names.
- AC-20 (covers R-20; method: tests): With `t` stubbed to return the key, no visible string in the six boxes SHALL equal an English literal. False if: a literal survives stub.
- AC-21 (covers R-21; method: computer use): During load each panel SHALL show its skeleton, and an empty panel SHALL show its empty state with a reason. False if: a panel renders blank.
- AC-22 (covers R-22; method: cli transcript): Two identical tile requests SHALL produce one upstream fetch and a cache hit on the second. False if: the second request reaches upstream.
- AC-23 (covers R-23; method: cli transcript): `curl -w '%{time_total}' /health` SHALL return 200 under 0.1 s. False if: the code is not 200 or the time exceeds 0.1.
- AC-24 (covers R-24; method: tests): With no stored locale, `t` SHALL resolve `en`. False if: it falls back to `pt-BR` or throws.
- AC-25 (must not change; method: tests): The four command effects SHALL stay the only accepted values. False if: a fifth effect registers without a spec row.
- AC-26 (unhappy path; method: tests): With the backend down, the six boxes SHALL still render with the empty state naming the failure. False if: the tree crashes or renders nothing.
- AC-27 (covers R-06; method: tests): An evidence cell with no series SHALL render `No observation` instead of a dash or a zero. False if: the cell is empty, shows `0`, or shows `-`.
- AC-28 (covers R-19; method: cli transcript): `GET /commands` SHALL return four entries, each with name, label, input schema, effect, idempotency flag and guard, and the `panel` enum of the `open_panel` entry SHALL be exactly `["scenarios", "evidence"]` in both the response and `src/lib/commands.ts`. False if: an entry lacks a field, the count differs from four, the enum carries a value outside those two, or the response and the module disagree.

## Amendments

One row per change. All of them come from the user's route 1 decision of 2026-11-14, verbatim "siga com o caminho 1": the four-control form is withdrawn and every honesty label moves onto the row's own `basis`. This file had no ledger before this revision, so its rows start at AM-01; block 3 keeps its own ledger and its withdrawal rows are AM-11 and later. Block 1's own ledger also continues at AM-11 from this revision on, so a cross-file citation names the file: `block 1 AM-11` is this file's row, while `block 3 AM-11` and later are block 3's.

| Id | Change | Where |
|---|---|---|
| AM-01 | `PUT /fields/{id}/constraints` is withdrawn from the endpoint list, because it was never implemented. The eight routes `backend/main.py` actually answers are named at the withdrawal. The second unreachable route on the same line, `GET /fields/{id}/evidence`, is withdrawn by block 1 AM-11. | Expected Interface, endpoint list |
| AM-02 | The `ConstraintForm` interface entry is withdrawn with the form it described. The nine `constraints.*` catalog keys and `evidence.layer_assumes` lose their only consumers, and `evidence.assumes` already has none; deleting a catalog key is a code review item, because no criterion can observe a key that nothing renders. | Expected Interface, AM-01 |
| AM-03 | Six boxes, not seven: the form is no longer one of them. The scope line, R-02, AC-02, AC-20 and AC-26 follow the new count. | Users and scope, R-02, AC-02, AC-20, AC-26 |
| AM-04 | The per-row rule replaces the retired pair. R-05 takes the label from the row's own `basis`; R-14 states the two presentation classes, measured for `observed`, `retrieved` and `entered` and marked for `modelled`, and forbids a suffix that the row's basis does not produce; R-15 forbids any control, global or per field, that sets or overrides the label. This retires the four-control requirement and the `unknown` relabel requirement of revision 1. | R-05, R-14, R-15 |
| AM-05 | AC-06 asserts that the rendered basis label equals the row's own basis, which is the falsifier for the retirement in AM-04. | AC-06 |
| AM-06 | AC-15 is measured per field against the fixture: two rows per field, the SMAP value each field carries and the `entered` crop row. The `modelled` class is proven with one injected row, because the evidence panel renders the current scenario only and no current scenario carries a `modelled` row, so no new fixture data is needed. | AC-15 |
| AM-07 | AC-16 asserts what the withdrawal leaves behind: no form other than `Agent command`, no control carrying the four old labels, and no row label that changes on any activation. | AC-16 |
| AM-08 | The `open_panel` value list is stated as `scenarios` and `evidence` only, and AC-28 asserts it in the response and in the module. The code consequence is named with it: `src/lib/commands.ts` line 74 and its cast at line 109, the `openPanelName` union at `src/lib/map-store.ts` line 17, and the `panel` enum of the `open_panel` schema at `backend/main.py` line 60. | Expected Interface, AC-28 |
| AM-09 | Freeze record added, with the digest and the command that reproduces it. | Freeze record |
| AM-10 | An artifact table for the criteria this amendment rewrites, because block 1 carries no per-AC artifact column and block 3 does. Each row names the output a verifier keeps. | Amendments |
| AM-11 | `GET /fields/{id}/evidence` is withdrawn from the endpoint list for the same reason as AM-01: `backend/main.py` answers eight routes and none of them is it, and `src` reads evidence rows from the scenarios response (`src/App.tsx` lines 114-120). The panel name `evidence` in the `open_panel` enum is untouched, because it names a panel and not a route (AC-28). | Expected Interface, endpoint list, AM-01 |

**Artifacts for the criteria this amendment rewrites.** AC-02, AC-20 and AC-26 changed only their count of boxes and keep their existing method; the other four changed an assertion and each row below names the output that proves it.

| Criterion | Artifact |
|---|---|
| AC-02 | vitest run output of the box-count assertion, which now counts six |
| AC-06 | vitest run output of the basis label assertion |
| AC-15 | vitest run output of the evidence panel test, three fixture fields plus one injected `modelled` row |
| AC-16 | vitest run output of the first-paint form assertion plus the activation sweep |
| AC-20 | vitest run output of the literal scan |
| AC-26 | vitest run output of the backend-down render |
| AC-28 | `curl -s localhost:8000/commands` output, and the enum line in `src/lib/commands.ts` |

Every other requirement and acceptance criterion of this file is unchanged, and the count stays at 25 requirements and 28 criteria.

## Freeze record

Frozen at revision 3 on 2026-11-14, after the evidence route withdrawal.

| Field | Value |
|---|---|
| Revision | 3 |
| Requirements | 25, R-01 to R-25 |
| Criteria | 28, AC-01 to AC-28 |
| sha256 | `5165dd4df375b74c455296562585bf00b2b2813304153e849d477d8e4735a117` |

A file cannot carry the digest of itself, so the sha256 row holds `PENDING` before hashing. Reproduce the digest with:

```sh
sed 's/`[0-9a-f]\{64\}`/`PENDING`/' specs/bloco-1-mapa-de-composicao.md | sha256sum
```

The result SHALL equal the value in the sha256 row above. That comparison is the freeze check.

## Exit criteria

Todos os AC de AC-01 a AC-28 passando é a definição de pronto do bloco. Tarefas tomam fatias desta lista; critério que nenhuma tarefa tomar é lacuna, critério de tarefa fora da lista é escopo extra.
