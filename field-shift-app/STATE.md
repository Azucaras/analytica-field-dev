# STATE

## Position

Bloco 1, gate 1 aprovado e congelado em 2026-11-10. Gate 3. Tarefa 01 concluída e verificada pelo orquestrador (2 testes passando, build 0, health 4 ms, field 03 abstido com limiar). Ondas 1 e 2 verificadas pelo orquestrador e aceitas. Achei e corrigi dois defeitos fora do escopo dos agentes: o GIBS devolve 400 (não 404) para data sem imagem e a imagem atrasa 3 dias, então o proxy agora caminha até 5 dias para trás (LOOKBACK_DAYS); e o catálogo abria a data com ano errado. Evidência: tile serve upstream datado de 2026-11-08, segunda requisição sai do cache, upstream morto serve reserva. Onda 3 aceita (18 testes verdes após eu corrigir a asserção de data que eu mesmo tinha mudado). Onda 4 aceita: aviso `Not enough valid area (62% of 80% required)` ao vivo, três cartões mantidos, nenhum marcador de ranking. Lacuna registrada: cenário rankeado ainda não exibe nota porque a API não devolve score. Onda 5 aceita: 30 testes, build 0, /commands com quatro entradas, 422 com nomes válidos, alerta na barra do agente. Corrigi a idempotência de select_field e apply_filter, que vinha como true nos dois lados. Onda 6 aceita: 34 testes, varredura de literal ativa com catálogo de chaves, build 0. Onda 7 aceita ao vivo: sete caixas com backend fora, motivo `Backend is unreachable`, retry presente. Onda 14 (bloco 2) aceita: canvas 1440x900, sem rolagem horizontal, nove contêineres overlay, arrasto move o centro de -55,27 para -55,7791 com zoom fixo. Adicionei `window.__fsMap` como gancho de verificação. Onda 8 antiga, checkpoint do bloco 1, executado pelo orquestrador: sete regiões uma vez cada, health 24 ms, tile 2,1 s no primeiro e 0,9 ms no cache com upstream=4, build 0, 36 testes, 34 antes. Bloco 1 fechado.
Lacunas registradas para bloco posterior: cenário rankeado sem nota (API não devolve score); SMAP do GIBS satura em Level6 e supera o zoom ficando chapado, enquanto a camada óptica HLS responde 200 em z10 mas é esparsa por data, então falta fonte óptica com data escolhida por cobertura.

Bloco 3 (game HUD), gate final de 2026-11-14: spec `bloco-3-game-hud.md` com 426 linhas, 102090 bytes, sha256 9b9de232878da4fb811ed5738b16fe30bbcf97ddf8cebdecb54b94dc6bb68d51, revisão 6, inalterada durante a medição (hash igual às 13:10 e às 13:21). O gate rodou `npx tsc -b --noEmit` (exit 0), `npx vitest run` (12 arquivos, 93 testes verdes) e `npm run build` (726 ms, exit 0) e mediu os 33 critérios no navegador real em 1440x900, 780x900 e 360x640. Resultado: 33 de 33 AC passam e o bloco está concluído. As seis falhas do gate anterior foram corrigidas e re-medidas: AC-10 (trilhos 218/218 a 1440 e 148/148 a 780 e 360, spread 0,00), AC-11 (frente `Charts for`, verso `Details for`), AC-15 (coluna termina em y 393 com o aviso montado nos dois largos), AC-26 e AC-30 (resize para 360 mantém só o painel aberto por último, foco no botão `Supporting data`, câmera e zoom intactos), AC-32 (teste de teclado dos quatro controles com `tagName`, `tabIndex`, Enter, Space e letra). Evidência em `artifacts/CHECKPOINT-BLOCO-3.md`; 40 capturas nomeadas por AC nesta rodada. Lacuna fora dos AC: R-02 exige preenchimento primário no botão `Command` (`#f2f6ea`, borda `#dfe8d1`, cor `#465d32`) e o build mede fundo transparente e cor `rgb(37,55,42)`; nenhum critério falsifica isso, então fica como item aberto, não como falha de AC.

Restrições fora do app (rota 1), gate de 2026-11-14: por decisão do usuário o formulário de Constraints saiu do app e cada linha de evidência passou a se rotular pelo próprio `basis`. Specs congeladas em revisão 2 (`bloco-1-mapa-de-composicao.md`, 176 linhas, 25 R / 28 AC, sha256 `4fe0d2b7298e`) e revisão 7 (`bloco-3-game-hud.md`, 450 linhas, 42 R / 33 AC, sha256 `29a9d7efc2f1`), re-hasheadas iguais às 14:29 e às 14:36. O gate rodou `npx tsc -b --noEmit` (exit 0), `npx vitest run` (11 arquivos, 95 testes), `npm run build` (exit 0, 787 ms) e os 8 testes de backend, e mediu os seis critérios no navegador em 1440x900, 780x900 e 360x640. Resultado: seis de seis passam, nenhum FAIL. Zero formas e zero nomes acessíveis `Constraints` nas três larguras; o SMAP desenha 0,28 / 0,31 / 0,19 com 56,00 / 62,00 / 38,00 por cento de preenchimento, sem interação no Field 01; régua, painel de rotação e controle de navegação idênticos ao checkpoint do bloco 3. Evidência em `artifacts/CHECKPOINT-CONSTRAINTS-REMOVAL.md`. Esta linha vem depois de o gate do bloco 3 ter fechado em 2026-11-14 com 33 de 33 AC na revisão 6, e os critérios do bloco 3 afetados por esta remoção estão superados pelo texto emendado da revisão 7.

## Approvals

Approved by user on 2026-11-10: "está ótimo, pode prosseguir. implemente escrevendo com subagents gpt luna 6"
Approved by user on 2026-11-11: "aprovado." (quiz do bloco 2, spec `bloco-2-hud-sobreposto.md` congelada, tarefas 14 a 18)
Approved by user on 2026-11-14: "ok go on, implement" (spec do bloco 3, `bloco-3-game-hud.md`. A decisão C-05, cards em uma linha e flip pela própria carta sem botão visível, foi pedida pelo usuário depois de ver o build em execução e está registrada na spec. Esta linha foi escrita pelo gate; o texto de Status da spec não foi editado.)
Approved by user on 2026-11-14: "siga com o caminho 1" (remoção do formulário de Constraints e rótulo de evidência por linha a partir do `basis`; specs bloco 1 revisão 2 e bloco 3 revisão 7, registrado no ledger AM-11 dos dois arquivos.)

## Commands

```sh
npm run dev                                  # 5173
npm run build                                # exit 0 medido em 2026-11-10
npx tsc -b --noEmit                          # exit 0 medido
npx vitest run                               # exit 1 sem teste: "No test files found"
backend/.venv/bin/uvicorn main:app --reload --app-dir backend --port 8000
curl -s localhost:8000/health
```

## Decisions

- Rascunho de trabalho em inglês no produto e português na interação: decisão registrada aqui e nas strings.
- Abstenção nunca recalculada no cliente: provisório, confirma-se na aprovação da spec.
- Playwright entra como devDependency mas a evidência de layout usa a captura da sessão, porque o download de navegador é custo que ninguém pediu (referência 17 do skill).
- Bloco 3, C-05: as três cartas de rotação ficam em uma linha com rolagem horizontal abaixo de 1440, e o flip vira um botão transparente sobre o corpo da carta, sem rótulo visível `Details`/`Charts`; o nome acessível e o teclado continuam obrigatórios. Decidido pelo usuário depois de ver o build em execução e aplicado na spec (R-18, R-42, AC-11, AC-33).
- Bloco 3, OD-05 a OD-09: aprovados pelo default recomendado junto com a spec: cada carta vira sozinha, barras de cultura seguem barras de sequência sem quantidade, a evidência não alarga, `SMAP_SCALE_MAX` fica em 0,5 m³/m³ e a 360 só um dos dois painéis da direita abre por vez.
- Bloco 3, gate final: o cap da coluna da direita em y 393 (AM-08) e a transição de resize para 360 que mantém só o painel aberto por último (AM-09) foram medidos no navegador e ficam como decididos. O aviso continua com um único nó no `.left-stack`, com `display: contents` acima de 640, e a relação dele com a coluna é geométrica, como AM-06 registra.
- Bloco 3, R-02: o preenchimento primário do botão `Command` não está implementado e não é medido por nenhum AC. Decisão pendente do dono da spec: corrigir o CSS do botão ou acrescentar a medição de fundo e cor ao AC-14.

## Open items

Varredura de requisitos implícitos, um por linha:

- Validação de entrada: AC-19 cobre nome de comando inválido; JSON malformado devolve 422 com o erro do Zod.
- Mensagens de erro e códigos: AC-19 (422), AC-22 (cache miss conta como falha), AC-26 (backend fora).
- Casos vazio, único e grande: AC-21 vazio; três talhões no fixture; tamanho grande fica para o bloco 2, N/A porque o fixture é fixo.
- Concorrência e repetição: AC-22 cobre repetição de tile; escrita de restrição é last-write-wins, N/A para bloco 1 por não haver multiusuário.
- Permissões e arquivos ausentes: AC-26 cobre backend fora; permissão de disco no cache entra como falha de escrita com mensagem, sem AC próprio no bloco.
- Compatibilidade: AC-25 protege os quatro efeitos; não há chamador externo ainda.
- Log: uma linha por comando executado, sem logar valor de restrição do produtor.
- Limite de performance: AC-23 e AC-12.
- Limpeza após falha: cache parcial de tile é sobrescrito no próximo acerto, N/A para o resto.

Itens abertos que o bloco 3 deixa (gate de 2026-11-14, 33 de 33 AC aprovados):

- R-02: implementar o preenchimento primário de `Command` (`#f2f6ea`, borda `#dfe8d1`, raio 6 px, cor `#465d32`) mantendo a área de toque de 44 px, ou acrescentar a medição de fundo e cor ao AC-14. Enquanto nenhum dos dois acontecer, um build sem preenchimento passa em todos os AC.
- CO-01: a régua de camadas continua 100% coberta pela carta de rotação a 360; medido 21253,58 px2, igual à área da régua, e o centro da régua resolve para `LI.scenario-card`.
- CO-02: a atribuição do MapLibre continua no meio da tela a 360, topo em 404,41, 63,2% da altura.
- CO-03 a CO-09 não foram re-auditados neste gate; os arquivos que os produzem estão intocados e o painel de evidência continua com 400 px a 1440 e 351 a 780.
- Sinal de flip por toque: nenhum antes do primeiro toque, como R-18 e C-05 registram; não é medido por AC.
- A 360, com a faixa superior rolada até o fim para alcançar Season (AC-18), os botões `Command` e `Supporting data` saem da borda esquerda e só voltam a ser clicáveis depois de rolar de volta. É overflow comum, registrado para não ser confundido com press engolido.
- O texto de Status da spec do bloco 3 não foi editado por este gate; o checkpoint e esta linha carregam o resultado.
- O corpo do card do gate fala em 28 AC e em espelho `en.ts`/`pt-BR.ts`; a spec carrega 33 AC e R-37 deixa `pt-BR.ts` vazio de propósito. A spec governa.

Itens abertos que o gate da remoção de Constraints deixa (2026-11-14, seis de seis critérios aprovados):

- `t_60978c58` (painel de Fields nunca expande) não se reproduz neste gate. Em aba visível, com press real por CDP, o painel abre para 93 px a 1440 e 99 px a 360 e o `data-starting-style` limpa em cerca de 200 ms; os 11 px do handoff são o primeiro quadro da transição de altura, congelado quando a aba está em segundo plano e o `requestAnimationFrame` fica estrangulado. O card deve ser fechado ou re-escopado, não consertado. O passo `Page.bringToFront` falta na receita do harness.
- Delta fora de AC desde o gate do bloco 3: a face da carta de rotação mede 110 px e o topo da carta 699,81 a 1440 (checkpoint anterior: 91,5 e 718,31), porque o readout do SMAP passou a imprimir valor, selo de basis e data, como R-14 e AM-12 exigem. Nenhum AC emendado fixa o topo da carta, então é delta de checkpoint e não falha; qualquer documento que cite 718,31 ou 91,5 como número atual está velho.
- A 360 o readout do SMAP fica em y 657,19, abaixo do fundo visível do painel de rotação em 632: o número está no DOM do primeiro paint e no nome acessível do grupo, mas exige a rolagem interna do painel. Comportamento anterior à remoção, medido de novo aqui.
- Modelled, null e `Not entered` do SMAP são provados só por teste, porque o fixture não carrega nenhuma linha SMAP nesses estados; AC-13 nomeia esse método. `Rotation suitability` modelled existe apenas em `soy-cotton`, que não é o cenário corrente, então o painel de evidência nunca o renderiza no app.
