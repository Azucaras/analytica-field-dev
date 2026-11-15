# Estado do projeto

Atualizado em 2026-11-15. O histórico detalhado de cada etapa está no git e nas specs em `specs/`.

## Onde estamos

| Etapa | O que entregou | Situação |
|---|---|---|
| Bloco 1 | Mapa, seleção de talhão, camadas, abstenção, cartões de cenário, painel de evidência, comandos do agente | fechado em 2026-11-10 |
| Bloco 2 | Mapa em tela cheia com os painéis por cima | fechado em 2026-11-11 |
| Bloco 3 | HUD no estilo de jogo: botões que abrem e fecham painéis, cartões que viram | fechado em 2026-11-14, 33 de 33 critérios |
| Remoção das restrições | O formulário de restrições saiu; cada linha de evidência mostra a própria base | fechado em 2026-11-14 |
| Bloco 4 | El Niño e evidência climática real no mapa; talhões 04 (RS) e 05 (BA) | fechado em 2026-11-14 |
| Bloco 5 | Análise completa do Field Phase na mesma página; português por padrão; previsão Meteomatics | fechado em 2026-11-14 |
| Bloco 6 | Estados Unidos: McLean (IL) e Lubbock (TX), talhões 06 e 07 | fechado em 2026-11-15, com NASS e Meteomatics dos condados |

Testes no fechamento do bloco 6: pipeline 165, backend 19, front-end 112, `tsc` e build sem erro.

## Aprovações

- 2026-11-10: "está ótimo, pode prosseguir. implemente escrevendo com subagents gpt luna 6" (bloco 1)
- 2026-11-11: "aprovado." (bloco 2)
- 2026-11-14: "ok go on, implement" (bloco 3)
- 2026-11-14: "siga com o caminho 1" (remoção das restrições)
- 2026-11-14: "Aprovado, implemente" (bloco 4)
- 2026-11-14: "I want you to apply all the features down below, using this project as a basis" (bloco 5)
- 2026-11-15: "Eu gostaria que você fizesse isso tudo até agora só que com dados integrados dos estados unidos, a mesma maneira, eu também gostaria que você retirasse o cheiro de ia que o projeto está no momento." (bloco 6 e revisão de texto)

## Decisões que valem para o projeto todo

- Nenhum número sem fonte. O que não tem fonte citável fica marcado como suposição e aparece como aviso.
- O app lê arquivos JSON datados que o pipeline grava; a demonstração não depende de login nem de rede.
- Bases de um valor: observado, recuperado, reportado (estatística oficial), modelado e inserido.
- Brasil usa o ano-safra de julho a junho; os EUA usam o ano hídrico de outubro a setembro.
- A análise do município fica num painel na mesma página, não em outro endereço.
- As specs dos blocos 1 a 3 estão congeladas com hash e não foram reescritas.

## Pendências

- A previsão Meteomatics é um retrato de 2026-11-15; para atualizar, rodar `pipeline.fetch_meteomatics`, `build_evidence` e as duas exportações.
- Nos EUA, as rotações com trigo (McLean) e com sorgo (Lubbock) ficam sem nota, porque essas culturas têm menos
  de 1% da área plantada recente e o método só calcula a produtividade das culturas principais.
- McLean não espelha Lubbock: o inverno lá também fica mais chuvoso no El Niño. Trocar por um condado mais ao
  norte, se o contraste for importante.
- Datas de plantio do Brasil pela CONAB; notas em escala fixa; CHIRPS e MapBiomas; validação contra produtividade.
- Santa Carmem não tem rotações pontuadas; os cartões do mapa são os exemplos escritos à mão do bloco 1.
- Nenhum comando de agente para clima ou análise.
- Pendências antigas do bloco 3: o botão `Command` sem o preenchimento primário, a régua de camadas coberta a
  360 px, a atribuição do mapa no meio da tela a 360 px, tipografia de 7 a 9 px e contraste de rótulos secundários.
