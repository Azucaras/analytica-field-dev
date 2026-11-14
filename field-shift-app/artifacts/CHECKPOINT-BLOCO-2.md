# CHECKPOINT BLOCO 2: HUD sobreposto

Verificador: subagente (só mede, nada foi alterado no código). Navegador real em http://127.0.0.1:5173, API em :8000 (`/health` = ok). Viewport por emulação CDP (1440x900, 780x900, 360x640). Gancho `window.__fsMap` para câmera. Capturas em `/home/carloshnp/.hermes/cache/scratch/` (nome `AC-NN[-largura].png`).

## Veredito do bloco

**Todos os 11 AC pedidos passam (AC-01 a 09, 11, 13, 14), mais AC-10 e AC-12, que a tarefa 19 exige.**
`npx vitest run` verde (9 arquivos, 46 testes) e `npm run build` com exit 0.
**Mesmo assim o bloco não deve ser dado como pronto sem revisão:** os quatro achados do orquestrador estão confirmados e há defeitos novos a 360 px, descritos abaixo. Nenhum deles reprova um AC literal, mas todos são defeitos reais do produto.

## Tabela de AC

| AC | Veredito | Número medido | Captura |
|---|---|---|---|
| AC-01 | PASS | 1440x900: canvas 1440x900 (= viewport); documento scrollWidth 1440 / scrollHeight 900; body overflow hidden | AC-01.png, AC-01-780.png, AC-01-360.png |
| AC-02 | PASS | Único fundo largo no topo é `main.app-shell`/`section.map-panel` (o próprio mapa, rgb 220,228,210); nenhuma faixa com fundo. `elementFromPoint` em y=30, x=200/500/720/900 devolve o CANVAS em todos | AC-02-1440.png, AC-02-780.png, AC-02-360.png |
| AC-03 | PASS | 1440x900, retângulos (l,t,r,b): marca 22,18,127,47 (top-left); chips de talhão 22,72,298,154 (esquerda, abaixo da marca); season/coverage 981,18,1418,48 (top-right); aviso 978,92,1358,157 (abaixo dos chips da direita, medido com Field 03); restrições 22,264,318,482 (esquerda, abaixo dos chips); cartões 20,498,480,858 (bottom-left); evidência 1070,595,1420,748 acima da régua 1070,806,1420,888 (bottom-right); barra do agente 502,824,938,888, centro x=720 = 1440/2 | AC-03.png, AC-03-780.png, AC-03-360.png |
| AC-04 | PASS (com ressalva de contraste) | Chips: 8 de 8 com `background-color` rgba(0,0,0,0), sem imagem nem sombra. Painéis: alfa 0.72 (cartões, restrições, régua, agente) e 0.86 (evidência), borda 1px, `backdrop-filter: blur(16px)`. Contraste do texto principal sobre a superfície composta com o tom do mapa: valores dos fatos 4,80:1, título 18,35:1, formulário 18,42:1, agente 6,80:1 | AC-04-1440.png, AC-04-780.png, AC-04-360.png |
| AC-05 | PASS | Alvo do clique em (700,300) é o CANVAS. Arrasto de 100x80 px: centro de (-55,2700; -11,9100) para (-55,3052; -11,8824), zoom 11 constante. Segundo arrasto, partindo da folga do contêiner da barra do agente (490,850, alvo também CANVAS): centro para (-55,3297; -11,8995), zoom 11 | AC-05.png |
| AC-06 | PASS | Cartões: altura 360 px = `max-height` 360 px, scrollHeight 1005 > clientHeight 358, `wheel` leva scrollTop de 0 a 300; documento scrollY 0, 900/900. Os outros painéis têm `max-height` e `overflow-y:auto` (evidência 252 px, agente 162 px, régua 118 px, campos 180 px), mas só os cartões transbordam no fixture | AC-06.png |
| AC-07 | PASS | z-index computado ao vivo: agente 60 > cartões 50 > aviso 40 > evidência 30 > régua 20 > chips 10. Teste `keeps all eight HUD anchors and the AC-07 layer sequence fixed` passa na suíte | (sem captura; método tests) |
| AC-08 | PASS (com ressalva de posição) | Atribuição não compacta (`maplibregl-compact` ausente, `details` aberto), `display:block`, `opacity:1`, 12 px. 1440x900: retângulo 825,776,1432,796, `elementFromPoint` devolve a própria atribuição; idêntico depois de Satellite, Satellite with labels e Map. Ressalva: a borda inferior está 104 px acima do rodapé (o canto inferior direito é ocupado pela régua) | AC-08-before.png, AC-08.png, AC-08-1440.png, AC-08-780.png, AC-08-360.png |
| AC-09 | PASS | 360x640: faixa de chips `field-chip-stack` em linha (`flex-direction:row`, `nowrap`, `overflow-x:auto`, scrollWidth 274 > clientWidth 207) e faixa `topbar-meta` (nowrap, 281 > 209); chips nunca quebram dentro da faixa. Cartões em grade de 1 coluna (3 `li` empilhados, 295 px), caixa em y=376..632: topo a 58,8% da altura (> 50%) e ocupa 40,0% inferiores (<= 45%) | AC-09.png, AC-09-780.png, AC-09-360.png |
| AC-10 | PASS (extra, tarefa 19) | Câmera forçada em centro (-55,2; -11,95), zoom 10,4. 1440x900, 780x900, 360x640 e de volta a 1440x900: centro e zoom idênticos nas quatro leituras (delta 0, zoom 10,4, bearing 0, pitch 0); canvas acompanha 1440x900, 780x900, 360x640 | AC-10-before-1440.png, AC-10-after-780.png |
| AC-11 | PASS | Árvore de acessibilidade, 1 ocorrência de cada: region `Field map`, navigation `Layers`, list `Rotation scenarios`, region `Evidence`, form `Constraints`, combobox `Season`, form `Agent command`. 7 de 7 | AC-11-780.png, AC-11-360.png |
| AC-12 | PASS (extra) | 360x640: scrollWidth 360 = clientWidth 360, scrollHeight 640. 1440x640: scrollWidth 1440 = clientWidth 1440 | AC-12.png, AC-12-1440x640.png |
| AC-13 | PASS | Nenhum botão, `summary` ou `[aria-expanded]` com rótulo Expand, Collapse ou Fullscreen. Botões renderizados: Zoom in, Zoom out, compass, Map, Satellite, Satellite with labels, Season, 3 chips de talhão, 4 selects, Run command. Único achado por texto é o `summary` "Toggle attribution" do MapLibre, `display:none`, largura 0 | AC-13-780.png, AC-13-360.png |
| AC-14 | PASS | Lista de cenários esvaziada por substituição de `fetch` (resposta 200 com `scenarios: []`, Field 02): textos "No scenarios available" e "No evidence available"; 8 contêineres `.overlay` presentes; retângulos de marca, chips, restrições, cartões, régua e agente idênticos aos do estado normal; evidência cresce para cima (topo 595 para 496, base 748 igual). Canvas 1440x900. Arrasto de 100x80 px: centro (-55,2400; -11,9400) para (-55,2754; -11,9123), zoom 11 | AC-14.png |

## Evidência de execução

- `npx vitest run`: Test Files 9 passed (9), Tests 46 passed (46). Duas execuções, as duas verdes. Saída em `scratch/vitest.txt`.
- `npm run build`: exit 0 (`tsc -b && vite build`, built in 889 ms). Saída em `scratch/build.txt`. Aviso de chunk acima de 500 kB (1.558 kB), sem erro.

## Achados do orquestrador (reabertos até prova): resultado

| Achado | Estado | Medida |
|---|---|---|
| Colunas truncadas na tabela de evidência | **CONFIRMADO** | Tabela `table-layout: fixed`, 316 px. Cabeçalho "SMAP soil moisture (assumes)": scrollWidth 138 > clientWidth 85. Células: "0.28 m³/m³" 53 > 51; "Soybean → Corn" 75 > 51; links de fonte 132 > 67 e 182 > 67 (elipse). 5 de 8 células de dados cortadas; a coluna Source não mostra o domínio |
| Falta de rótulo nos talhões no mapa | **CONFIRMADO** | 0 camadas `symbol` para talhões (`boundary-mt-santa-carmem-01..03` são só `line`); 0 marcadores e 0 popups no DOM do mapa. Os nomes Field 01 a 03 só existem na lista de chips |
| Fonte de 8 a 9 px nos cartões | **CONFIRMADO (pior que descrito)** | Nós de texto visíveis por tamanho: 7 px = 9, 8 px = 30, 9 px = 51, 10 px = 17. Cartões: `scenario-facts` 9 px, `scenario-kicker` 8 px, `current-badge` 7 px; evidência 7 a 9 px; régua 8 a 9 px. |
| Datas de fixture em 2025 contra a camada em 2026 | **CONFIRMADO** | `backend/fixtures/field-scenarios.json`: 15 ocorrências de `as_of` 2025-11-10 e 3 de 2025-06-30, 0 de 2026. A régua mostra a camada SMAP em 2026-11-08 (tile real). Dados de evidência ficam 363 dias atrás da camada exibida ao lado |

## Defeitos novos (fora da letra dos AC, a corrigir)

1. **360x640: evidência e régua de camadas inalcançáveis.** `elementFromPoint` no centro da evidência (71,383,352,536) devolve o painel dos cartões; no centro da régua (93,550,352,632) devolve a barra do agente. As duas ficam 100% cobertas pela ordem de camadas. A barra do agente (536..632) cobre 96 px dos 256 px dos cartões (37,5%). O usuário móvel perde o seletor de camada e a evidência.
2. **360x640: atribuição no meio da tela.** Retângulo 0,304,352,344 (`.maplibregl-ctrl-bottom-right`), 3 linhas, topo em 47,5% da altura (304/640), não no canto inferior direito. Visível e descoberta, por isso AC-08 passa a 1440, mas R-08 pede canto inferior direito.
3. **780x900: barra do agente sobre cartões.** Agente 226,769,554,888 sobrepõe cartões 20,498,394,858 em 168 x 89 px. Restrições (bottom 500) e cartões (top 498) se sobrepõem em 2 px.
4. **360x640: controles de navegação sobre as faixas de chips.** `NavigationControl` (top-right, ~39 x 97 px) cobre a ponta direita da faixa `topbar-meta` (até x=348 de 360) e das faixas de campo.
5. **Contraste dos rótulos.** Sobre o tom claro do mapa, 47 de 73 textos dos cartões ficam abaixo de 4,5:1 (mínimo 2,97:1; rótulos "Why/Evidence/Benefit" 3,32:1; "PLAN WITH EVIDENCE" 3,02:1). Sobre fundo escuro o cinza `rgb(137,145,137)` chega a 1,63:1. O texto principal (4,80:1) passa.

## Lista de FAIL

**Nenhum AC com FAIL.** Os itens 1 a 5 acima são defeitos fora da redação dos AC; se o orquestrador quiser lê-los como reprovação, os candidatos são AC-08 (item 2, canto inferior direito) e AC-09 (item 1, cartões na faixa inferior mas ilegíveis atrás da barra do agente).

## Limitações da medição

- Emulação CDP de 1440x900, 780x900 e 360x640 no Chromium do harness (não o perfil real do usuário). `devicePixelRatio` 1, não móvel (sem toque).
- AC-14: lista vazia obtida substituindo `window.fetch` no navegador, não por dado vazio no backend.
- AC-07 e AC-11/AC-13: medidos ao vivo e pela suíte, não só pela suíte.
- Contraste calculado com o tom do mapa claro (rgb 220,228,210), não por amostragem de pixel por painel.
- Capturas em `scratch/`; `artifacts/AC-03.png` e `artifacts/AC-06.png` pré-existentes não foram tocadas.
