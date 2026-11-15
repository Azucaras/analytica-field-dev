# Mudanças desde a chegada do projeto

Base: commit `757c91d` (README da raiz), estado em que o projeto chegou. Período: 2026-11-14.
Origem do que entrou: o projeto irmão Field Phase (`nasa_chall_train`, até o commit `4d1d7b4`).
Detalhes e critérios de aceite: `field-shift-app/specs/bloco-4-sinal-enso.md` e `bloco-5-analise-field-phase.md`.

## Bloco 4: sinal do ENSO e evidência climática real

- **Pipeline novo** em `field-shift-pipeline/` (projeto `uv`): ENSO da NOAA CPC (RONI, ONI, discussão, perspectiva), NASA POWER diário desde 1981, IBGE PAM, anos análogos de El Niño. Santa Carmem (IBGE 5107248) entrou ao lado de Tupanciretã (4322202) e Luís Eduardo Magalhães (2919553).
- **Fixture climática datada** em `backend/fixtures/climate/`, gravada só pelo exportador `pipeline.export_fieldshift`.
- **Backend:** `GET /climate/enso` e `GET /fields/{id}/climate`. `/fields` passa a listar 5 talhões; os talhões 04 (RS) e 05 (BA) são sintéticos, sem cenários, e se abstêm com `coverage_not_measured`.
- **Nova base `reported`** (estatística oficial publicada) no glossário, nos tipos e nos selos.
- **HUD:** chip do ENSO no topo, linha "chuva desde 1º set vs normal vs anos de El Niño forte" no painel de rotação e tabela climática no painel de evidência, com avisos de amostra pequena e de época de cultivo assumida.
- **Docs:** ADR 0001 revisada (dipolo), glossários com `Reportado` e `Município`.

## Bloco 5: análise completa do Field Phase

- **Pipeline:** Meteomatics (15 dias, 46 dias e sazonal, 51 cenários), Planetary Computer (NDVI MODIS, uso do solo 2017 a 2023, relevo), SoilGrids, FAO-56 (ET0 e balanço hídrico diário) e pontuação de rotações por prioridade. Santa Carmem não é pontuado: a região `mt` não tem rotações nem calendário configurados.
- **Backend:** `GET /fieldphase/data/v1/{arquivo}.json` serve o export estático do contrato Field Phase v1.2, gravado em `backend/fixtures/fieldphase/`.
- **Análise no mesmo app:** o kit `fieldphase` (React 19 e Recharts 2.15.3) abre como painel de tela cheia por cima do mapa, pelo botão **Análise** ou **Análise completa**, no município do talhão selecionado. Endereço `#analise/<código>`; Esc ou "Voltar ao mapa" fecham o painel, e uma falha nele não derruba o mapa.
- **Idioma:** português por padrão no app todo, com troca PT/EN; `pt-BR.ts` tem as 191 chaves.
- **Meteomatics:** baixada pelo próprio usuário com a sua credencial; nenhuma resposta salva guarda o usuário.

## Iniciação

- `iniciar.cmd` (dois cliques) ou `npm start` em `field-shift-app`: instala o que falta, escolhe portas livres a partir de 8000 e 5173, sobe backend e front-end e abre o navegador.

## Testes no fechamento

| Onde | Resultado |
|---|---|
| Pipeline (`uv run pytest`) | 152 passando |
| Backend (`unittest`) | 19 passando (8 antes) |
| Front-end (`vitest`) | 16 arquivos, 112 passando (97 antes) |
| `tsc -b --noEmit` e `npm run build` | ok |

## Em aberto

- Calendários de plantio sem confirmação da CONAB; escala min-max dos scores; CHIRPS e MapBiomas fora; só três municípios; validação contra produtividade (fase 4) não feita.
- Os cartões de rotação do HUD para Santa Carmem continuam o fixture escrito à mão; as rotações pontuadas existem só na análise, para RS e BA.
- Nenhum comando de agente para clima ou análise (ADR 0004).
- Capturas de tela dos critérios de layout não gravadas; a geometria foi medida no navegador.
- Primeira instalação do zero pelo `npm start` e o encerramento com Ctrl+C não foram testados.
