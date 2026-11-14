# O agente invoca a interface por um registro de comandos tipado, não por MCP

status: accepted
date: 2026-11-10

O agente precisa acender painéis, trocar camada e selecionar talhão. Decidimos que cada comando declara nome, esquema de entrada, alvo e efeito, e é registrado em código, com o mesmo esquema exposto em `/commands` para o agente ler em tempo de execução. O agente chama por HTTP interno, com um identificador de comando, e nunca por seletor de DOM.

## Consequências

Um componente novo só é alcançável pelo agente se declarar o comando correspondente, então a capacidade cresce junto com o registro e não com o layout. Renomear um painel não quebra o agente, porque o nome do comando é estável. O registro vira o inventário que um humano também usa para achar o que existe.

## Alternativas consideradas

- Servidor MCP expondo ferramentas de UI: contrato padrão e reaproveitável, mas uma camada e um processo a mais no prazo do hackathon.
- Agente simulando teclado e clique: nada a manter, e quebra na primeira mudança de layout.
