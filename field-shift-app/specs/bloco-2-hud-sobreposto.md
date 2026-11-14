# Spec: Bloco 2, mapa em tela cheia com HUD sobreposto

Aprovações e decisões ficam em STATE.md (seções Approvals e Decisions). Este arquivo não carrega linha de aprovação.

## Problem

Hoje o mapa mora dentro de um painel de 264 px de coluna mais conteúdo, abaixo de uma topbar branca de 68 px. Como o mapa é o objeto principal do app, ele precisa ocupar a tela inteira e todos os controles precisam flutuar sobre ele. A topbar deixa de existir como barra e seus itens viram chips soltos, de modo que o mapa apareça no meio do topo. Nenhuma caixa ganha botão de expandir ainda, porque a distribuição final dos painéis será decidida depois.

## Users and scope

- Users: o produtor que opera o mapa e o juiz que avalia a tela.
- In scope: mapa em 100 por cento de largura e altura, ainda sobreposto, chips de topo, âncoras de cada caixa, superfície translúcida nos painéis, regra de ponteiro, alturas máximas com rolagem interna, faixa de comportamento até 640 px.
- Out of scope: botão de expandir ou recolher, reorganização de painel, mudança de estilo visual além da superfície, nova funcionalidade de dado. Motivo: cada um depende de decisão posterior de distribuição.

## Requirements

- R-01 (ubiquitous): The map SHALL fill 100 percent of viewport width and height with no page scrollbar.
- R-02 (ubiquitous): The shell SHALL render no bar with background; application identity and metadata SHALL render as separate floating chips.
- R-03 (ubiquitous): The application mark chip SHALL anchor top-left, the field chips the left edge below it, the season and coverage chips top-right, the abstention notice below those chips, the scenario cards the bottom-left, the evidence panel the bottom-right above the layer rail, and the agent bar the bottom centre.
- R-04 (ubiquitous): Every panel SHALL have a translucent surface and a one-pixel border; every chip SHALL render with no background.
- R-05 (ubiquitous): Every overlay container SHALL set `pointer-events: none`, and every interactive child SHALL set `pointer-events: auto`.
- R-06 (ubiquitous): Each panel SHALL carry a maximum height and scroll its own content when the content overflows.
- R-07 (ubiquitous): The stacking order SHALL be fixed: agent bar above cards, cards above the notice, the notice above evidence, evidence above the rail, the rail above chips.
- R-08 (ubiquitous): The map SHALL keep a non-compact attribution control in the bottom-right corner, always visible; the current map initialises with `attributionControl: { compact: true }`, which hides credit behind a toggle and violates R-13.
- R-09 (state-driven): While the viewport is 640 px wide or narrower, the top chips SHALL lay out as a horizontal scroll strip and the scenario cards SHALL stack in the bottom 45 percent of the screen.
- R-10 (event-driven): When the viewport resizes, the map SHALL keep its centre and zoom.
- R-11 (ubiquitous): The existing DOM contracts SHALL stay: `region` `Field map`, `nav` `Layers`, `ul` `Rotation scenarios`, `section` `Evidence`, `select` `Season`, `form` `Agent command`.
- R-12 (unwanted behaviour): If the viewport is 360 px wide or 640 px tall, then no horizontal page scroll SHALL appear.
- R-13 (ubiquitous): No box SHALL mount an expand, collapse or fullscreen toggle in this block.

## Expected Interface

Nomes públicos e contrato de layout apenas.

- `AppShell`: elemento raiz que hospeda o mapa e as âncoras; classes de âncora por caixa no padrão `anchor-top-left`, `anchor-left`, `anchor-top-right`, `anchor-bottom-left`, `anchor-bottom-right`, `anchor-bottom-centre`.
- `PointerRule`: regra de `pointer-events` aplicada por classe (`overlay` sem ponteiro, `overlay-interactive` com ponteiro).
- `ZOrder`: constantes de ordem fixa por caixa.
- `PanelSurface`: classe de superfície translúcida com borda de um pixel.
- Mantidos: `MapCanvas`, `LayerRail`, `ScenarioCards`, `EvidencePanel`, `SeasonSelect`, `AbstentionNotice`, `AgentBar`.

## Assumptions

- Translucidez com a superfície clara atual mantém contraste legível sobre o raster SMAP; verificado por AC-04, que exige razão de contraste medida no texto principal do painel.
- Painéis com altura máxima preservam o mecanismo do bloco 1 sem rolagem de página; verificado por AC-06, que exige rolagem interna no painel, não no documento.
- A regra de ponteiro não quebra o arrasto do mapa; verificado por AC-05, que exige arrasto efetivo na área livre.

## Open questions

Vazio no congelamento.

## Frozen answers

| Round | Question | Answer | Requirement row |
|---|---|---|---|
| 1 | Âncoras | "pode confirmar por enquanto" | R-03 |
| 1 | Superfície | "painel com fundo translúcido, borda fina" | R-04 |
| 1 | Ponteiro | "(a)" contêiner sem ponteiro, filho com ponteiro | R-05 |
| 2 | Mobile | "faixa superior com chips em rolagem horizontal e cartões empilhados nos 45% de baixo" | R-09 |
| 2 | Atribuição | "controle de atribuição do MapLibre no canto inferior direito" | R-08 |
| 2 | Colisão | "cada painel ganha altura máxima com rolagem interna e ordem de camadas fixa" | R-06, R-07 |

## Acceptance criteria

- AC-01 (covers R-01; method: computer use): At 1440x900 the map canvas SHALL measure at least the viewport width and height. False if: the canvas is narrower or shorter than the viewport.
- AC-02 (covers R-02; method: computer use): At the top of the screen the map SHALL be visible between the corner chips, with no full-width bar. False if: a horizontal band with background spans the whole width.
- AC-03 (covers R-03; method: computer use): Each of the seven anchors SHALL hold its named box in the named corner or edge. False if: any box renders in an anchor other than the one named.
- AC-04 (covers R-04; method: computer use): Panels SHALL show a translucency over the map and chips SHALL show no background. False if: a chip has a filled background, or a panel is fully opaque.
- AC-05 (covers R-05; method: computer use): Dragging in a free map area SHALL move the camera. False if: the press lands on an overlay container and the camera does not move.
- AC-06 (covers R-06; method: computer use): A panel with more rows than fit SHALL scroll inside its own box. False if: the panel grows past its maximum height or the document scrolls instead.
- AC-07 (covers R-07; method: tests): The computed z-order SHALL follow the named sequence. False if: any pair is inverted relative to R-07.
- AC-08 (covers R-08; method: computer use): The attribution control SHALL render in the bottom-right and stay visible after a preset switch. False if: it is absent, covered or below the fold.
- AC-09 (covers R-09; method: computer use): At 360 px wide the chips SHALL scroll horizontally and the cards SHALL occupy the bottom band. False if: chips wrap into multiple rows or the cards sit above the midline.
- AC-10 (covers R-10; method: computer use): Across a resize from 1440 to 780 the centre and zoom SHALL hold. False if: the camera jumps.
- AC-11 (must not change; method: tests): All six DOM contracts SHALL still resolve. False if: any role and name pair is missing.
- AC-12 (covers R-12; method: computer use): At 360x640 there SHALL be no horizontal document scroll. False if: `scrollWidth` exceeds `clientWidth`.
- AC-13 (covers R-13; method: tests): No toggle labelled `Expand`, `Collapse` or `Fullscreen` SHALL render. False if: one appears.
- AC-14 (unhappy path; method: computer use): With the scenario list empty, the shell SHALL keep the anchors and the map SHALL stay interactive. False if: the layout collapses or the map stops responding.

## Amendments

One row per change. The withdrawal comes from the user's route 1 decision of 2026-11-14, verbatim "siga com o caminho 1"; this file had no ledger before this revision, so its rows start at AM-01, while block 3 records the same withdrawal in its own ledger at block 3 AM-13.

| Id | Change | Where |
|---|---|---|
| AM-01 | The `form` `Constraints` pair is withdrawn, so six role and name pairs remain: `region` `Field map`, `nav` `Layers`, `ul` `Rotation scenarios`, `section` `Evidence`, `select` `Season` and `form` `Agent command`. All six are unconditional, because R-13 forbids an expand, collapse or fullscreen toggle in this block, unlike the two conditional pairs of block 3. The count of six follows block 3 R-36, which fixes the surviving pair count for this block, and the withdrawal itself follows block 3 AM-13. Two counts are recomputed with it and stated in place: the anchors go from eight to seven, recounted from the edited R-03, and the DOM contracts go from seven to six. Three clauses are edited: R-03, which loses the constraint form from its anchor list, R-11, which loses the pair, and the Expected Interface kept list, which loses `ConstraintForm`; AC-03 and AC-11 follow the two recomputed counts. | R-03, R-11, Expected Interface, AC-03, AC-11 |

## Freeze record

Frozen at revision 2 on 2026-11-14, after the constraint form withdrawal. Revision 1 was approved on 2026-11-11 (STATE.md) and carried no digest; this is the first freeze record in this file.

| Field | Value |
|---|---|
| Revision | 2 |
| Requirements | 13, R-01 to R-13 |
| Criteria | 14, AC-01 to AC-14 |
| sha256 | `3bb44541c55940b32af0958c57b2e00846fedf162f0602b54cf54e5a56e1a255` |

A file cannot carry the digest of itself, so the sha256 row holds `PENDING` before hashing. Reproduce the digest with:

```sh
sed 's/`[0-9a-f]\{64\}`/`PENDING`/' specs/bloco-2-hud-sobreposto.md | sha256sum
```

The result SHALL equal the value in the sha256 row above. That comparison is the freeze check.

## Exit criteria

Todos os AC de AC-01 a AC-14 passando, com captura nomeada por critério nas três larguras, é a definição de pronto do bloco.
