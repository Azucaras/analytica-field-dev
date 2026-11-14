# Trabalho avança em blocos com spec congelada, não em ciclos curtos

status: accepted
date: 2026-11-10

O projeto tem prazo de hackathon e pesquisa aberta em paralelo, e cascata pura desperdiça o que a pesquisa descobre no meio. Decidimos que o trabalho corre em blocos com spec congelada e tickets curtos dentro do bloco, usando o `spec-driven-coding` também para implementações pequenas. O ciclo por área foi descartado porque exige demo a cada rodada e transforma cada incremento em compromisso de agenda.

## Consequências

Um bloco fecha com incremento rodando, captura e linha no log de decisões, e não espera a pesquisa do bloco seguinte. Pesquisa entra como ticket que produz arquivo de evidência e nunca bloqueia o build, porque a feature nasce com fixture datada. Quem revisa lê a spec congelada antes de o código existir, então o custo de mudar de ideia sobe depois do congelamento, e é essa a intenção.

## Alternativas consideradas

- Ciclos de 60 a 90 minutos com incremento e captura: cadência mais rápida e retorno humano mais frequente, porém cada ciclo vira compromisso e a pesquisa atrasada vira bloqueio de agenda. Fica como modo de iteração dentro de um bloco já especificado.
