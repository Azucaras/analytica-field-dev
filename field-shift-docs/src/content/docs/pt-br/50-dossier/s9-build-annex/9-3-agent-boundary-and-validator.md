---
title: "9.3 Limite do agente e validador"
description: "Executado (verificação documentada de pesquisa e de repositório): as verificações de pesquisa consultaram APIs públicas e metadados de catálogo..."
checked: 2026-11-10
---

## Status

Executado (verificação documentada de pesquisa e de repositório): as verificações de pesquisa consultaram APIs públicas e metadados de catálogo, mas nenhum agente, banco de dados, schema de produção, validador de consultas ou ferramenta de escrita do Field Shift existe no repositório. Nenhum modelo foi avaliado em benchmark quanto à correção de consultas ou à resistência a injeção de prompt (verificação documentada do repositório).

Planejado: a arquitetura abaixo trata um modelo de linguagem como analisador de requisições e planejador de consultas. Um serviço determinístico resolveria identificadores, validaria uma consulta somente leitura e retornaria evidências com limitações. Ações que alteram estado exigiriam um caminho separado, confirmado pelo usuário. Nenhum desses componentes foi construído ou verificado.

## Torne a semântica explícita na fronteira de dados

Uma requisição tipada proposta contém o `field_id` selecionado, a versão explícita do limite, o intervalo de temporada delimitado, o slot de indicador da lista de permitidos e a escolha de agregação. O S8.3 é o contrato de schema autoritativo, incluindo os períodos de limite e de observação versionados; esta seção define como o agente é mantido nessa fronteira de dados. O serviço resolve o campo e as temporadas contra os registros visíveis ao usuário. Se um nome de campo corresponder a vários registros, se uma temporada for ambígua ou se uma alegação de cultura solicitada não tiver suporte, o serviço pede correção ou recusa, em vez de adivinhar.

Mantenha tabelas documentadas com identificadores e relações explícitos. Retorne apenas os detalhes de schema e os caminhos de junção permitidos para a pergunta. O validador deve rejeitar instruções que não sejam SELECT, tabelas ou colunas desconhecidas, restrições ausentes de campo ou de temporada, predicados espaciais inválidos, junções que contornem as relações declaradas, contagens de linhas excessivas e saídas com unidades inconsistentes. Aplique modelos de consulta parametrizados sempre que possível. Use controle de acesso no serviço de dados, não apenas em um prompt. Limite o tempo de consulta e o tamanho do resultado, e registre a requisição resolvida, o resultado do validador e a proveniência dos dados, sem tratar explicações geradas pelo modelo como evidência.

Uma ferramenta somente leitura deve retornar valores estruturados junto com o campo e a temporada resolvidos, o caminho de junção, as fontes e os granules, as unidades, o suporte espacial e temporal efetivo, as exclusões de qualidade, a política de sobreposição, a ausência de dados e os avisos. O assistente pode explicar essa resposta em linguagem natural, mas não pode omitir o objeto de evidência estruturado. Se o modelo não conseguir preservar a limitação ou distinguir valores modelados de observados, mostre o resultado da ferramenta diretamente e abstenha-se de uma conclusão sintetizada.

## Teste junções erradas, não apenas SQL válido

Compare a saída da ferramenta com consultas de referência escritas por analistas e com fixtures desenhados para expor erros semânticos. Inclua campos adjacentes, limites compartilhados, temporadas ausentes, granules duplicados, QA inválido, sistemas de coordenadas misturados, observações sobrepostas e rótulos de cultura ambíguos. Teste se uma consulta sintaticamente válida não consegue anexar a imagem de um campo vizinho ao polígono selecionado nem combinar temporadas diferentes. Meça a resolução exata de identificadores, a correção das junções, as unidades, a filtragem, a abstenção e a completude da proveniência separadamente do sucesso de sintaxe SQL. Inclua texto adversarial nos registros recuperados e nas requisições do usuário, para testar se instruções conseguem escapar da lista de permitidos. Nenhum resultado de precisão ou de segurança está disponível até que esses testes sejam implementados e executados.

| Fronteira | Comportamento planejado |
|---|---|
| Analisador de requisições | Campo, temporada, indicador e agregação tipados |
| Lista de permitidos do schema | Somente tabelas e caminhos de junção documentados |
| Validador determinístico | Execução somente leitura, limitada e com verificação de unidades |
| Resposta de evidência | Valores com proveniência, QA, suporte e lacunas |
| Alteração de estado | Ferramenta separada que exige confirmação explícita |

**Figura S9-F3. Limite planejado do agente somente leitura (restrições documentadas, projeto proposto).**

Todas as operações que alteram estado, incluindo salvar um cenário, editar um registro de campo ou exportar dados para um serviço externo, ficam fora do caminho de consulta autônoma. O sistema mostra a prévia da ação exata e do registro afetado e então aguarda confirmação explícita. Uma recusa ou uma requisição ambígua deve oferecer um próximo passo seguro, como escolher o campo, restringir as temporadas ou pedir a um agrônomo que revise uma interpretação sem suporte.

A arquitetura proposta não é uma afirmação de implantação segura. Projeto de schema, armazenamento, modelos de consulta, validador, seleção de modelo e suíte de testes continuam não construídos. Um estudo de text-to-SQL sobre schema de produção pode orientar implementações futuras, mas não estabelece a precisão desta ferramenta. Redação do prompt, confiança do modelo, execução bem-sucedida de SQL ou uma explicação bem polida não podem substituir verificações determinísticas e avaliação.
