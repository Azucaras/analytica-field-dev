# Estado do projeto

Atualizado em 2026-11-15. O histórico detalhado de cada etapa está no git e nas specs em `specs/`.

## Onde estamos

| Etapa | O que entregou | Situação |
|---|---|---|
| Bloco 1 | Mapa, seleção de talhão, camadas, abstenção, cartões de cenário, painel de evidência, comandos do agente | fechado em 2026-11-10 |
| Bloco 2 | Mapa em tela cheia com os painéis por cima | fechado em 2026-11-11 |
| Bloco 3 | HUD no estilo de jogo: botões que abrem e fecham painéis, cartões que viram | fechado em 2026-11-14, 33 de 33 critérios |
| Remoção das restrições | O formulário de restrições saiu; cada linha de evidência mostra a própria base | fechado em 2026-11-14 |
| Bloco 4 (equipe) | Registro de camadas e linha do tempo diária | spec congelada na revisão 9; implementado |
| Bloco 5 (equipe) | Polígonos de cultura sobre o mapa de satélite; região EUA em Cass County (ND) | revisão 6 aguarda aprovação; implementado |
| Bloco 6 (equipe) | Números por polígono | spec congelada na revisão 2 |
| Bloco 7 (equipe) | Registro do talhão, histórico declarado e calendário de plantio | spec congelada na revisão 9 |
| Bloco 8 (equipe) | Agente e voz | spec congelada na revisão 1 |
| Bloco 9 | El Niño e evidência climática real no mapa; talhões 04 (RS) e 05 (BA) | fechado em 2026-11-14 |
| Bloco 10 | Análise completa do Field Phase na mesma página; português por padrão; previsão Meteomatics | fechado em 2026-11-14 |
| Bloco 11 | Estados Unidos: McLean (IL) e Lubbock (TX), talhões 06 e 07 | fechado em 2026-11-15, com NASS e Meteomatics dos condados |
| Bloco 12 | Tela em grade com registro de painéis: nada mais flutua sobre o mapa | fechado em 2026-11-15 |

Os blocos 9 a 11 foram feitos na branch `exp_vass` com os números 4 a 6 e renumerados ao entrar na `main`, que já
tinha blocos 4 a 8 da equipe.

Testes depois do bloco 12: front-end 336, backend 45, pipeline 167, `tsc` e build sem erro. O front-end tinha 364; os 48 testes de posição dos blocos 2 a 5 deram lugar a 21 testes da grade e do registro.

## Aprovações

- 2026-11-10: "está ótimo, pode prosseguir. implemente escrevendo com subagents gpt luna 6" (bloco 1)
- 2026-11-11: "aprovado." (bloco 2)
- 2026-11-14: "ok go on, implement" (bloco 3)
- 2026-11-14: "siga com o caminho 1" (remoção das restrições)
- 2026-11-14: "Aprovado, implemente" (bloco 9)
- 2026-11-14: "I want you to apply all the features down below, using this project as a basis" (bloco 10)
- 2026-11-15: "Eu gostaria que você fizesse isso tudo até agora só que com dados integrados dos estados unidos, a mesma maneira, eu também gostaria que você retirasse o cheiro de ia que o projeto está no momento." (bloco 11 e revisão de texto)
- 2026-11-15: "Sim, integre" (integração da `exp_vass` com a `main` da equipe)
- 2026-11-15: "Refazer a base", na branch `integracao-exp_vass` (bloco 12)
- As aprovações dos blocos 4 a 8 da equipe estão nas próprias specs.

## Decisões que valem para o projeto todo

- Nenhum número sem fonte. O que não tem fonte citável fica marcado como suposição e aparece como aviso.
- O app lê arquivos JSON datados que o pipeline grava; a demonstração não depende de login nem de rede.
- Bases de um valor: observado, recuperado, reportado (estatística oficial), modelado e inserido.
- Brasil usa o ano-safra de julho a junho; os EUA usam o ano hídrico de outubro a setembro.
- A análise do município fica num painel na mesma página, não em outro endereço.
- Todo recurso novo da tela do mapa é um painel registrado em `src/shell/panels.tsx`; nenhum painel se posiciona
  sobre o mapa (bloco 12).
- As specs dos blocos 1 a 8 estão congeladas com hash e não foram reescritas.
- A região dos EUA da equipe é Cass County (ND); os talhões-piloto de McLean e Lubbock aparecem na mesma região.

## Pendências

- A previsão Meteomatics é um retrato de 2026-11-15; para atualizar, rodar `pipeline.fetch_meteomatics`, `build_evidence` e as duas exportações.
- Nos EUA, as rotações com trigo (McLean) e com sorgo (Lubbock) ficam sem nota, porque essas culturas têm menos
  de 1% da área plantada recente e o método só calcula a produtividade das culturas principais.
- McLean não espelha Lubbock: o inverno lá também fica mais chuvoso no El Niño. Trocar por um condado mais ao
  norte, se o contraste for importante.
- Datas de plantio do Brasil pela CONAB; notas em escala fixa; CHIRPS e MapBiomas; validação contra produtividade.
- Santa Carmem não tem rotações pontuadas; os cartões do mapa são os exemplos escritos à mão do bloco 1.
- Nenhum comando de agente para clima ou análise.
- Os talhões de Cass County não têm código de município no pipeline, então a linha climática deles diz
  "indisponível". Pôr Cass County (FIPS 38017) no pipeline resolveria, e ele fica no norte, onde o El Niño
  costuma deixar o inverno mais seco.
- O estado aberto ou fechado dos painéis não é lembrado entre recargas.
- O SMAP é um produto de 9 km; uma camada na escala do talhão (HLS de 30 m, por exemplo) seria outro trabalho.
