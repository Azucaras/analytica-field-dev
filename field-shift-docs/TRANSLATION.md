# Translation rules (English to pt-BR)

Read this before translating. Every rule is binding.

## Output

- Write the translation to `src/content/docs/pt-br/<same relative path>` for each source file under `src/content/docs/`. Create directories as needed.
- One output file per input file. Never edit the English file.
- Translate the frontmatter `title` and `description` values. Keep the keys, keep `checked`, keep `template`, keep `status`, `date` and `deciders` in ADRs.

## Prose

- Brazilian Portuguese, second person or impersonal, the register of a competent engineer writing for colleagues.
- One idea per sentence, subject named. No filler openers.
- No em dashes and no en dashes. Use a comma, or "a" for numeric ranges.
- No dashes at all in the output. Check with `grep -c "—"` and `grep -c "–"` on each file and fix any hit.

## What must not change

- Every URL, including the markdown link targets. Link text is translated, targets are not.
- Code blocks, mermaid blocks, inline `code` identifiers, constant names such as `PROVISIONAL_ABSTENTION_GATE` and `FIELD_VOICE_TEST_01`, table column structure, and the order of rows.
- Every number, unit, date and percentage exactly as written.
- Headings keep their numbering prefix, for example `## 2.1` or `00-start-here`.
- Relative links between pages point at `/pt-br/...` versions where the target has been translated in this run. If a target is not part of your batch, keep the existing path and note it in your report.

## Vocabulary, keep it consistent across the whole site

| English | pt-BR |
|---|---|
| observed | observado |
| retrieved | recuperado |
| modelled | modelado |
| entered | inserido |
| posting (grid) | grade de publicação |
| footprint | pegada (do sensor) |
| abstention gate | regra de abstenção |
| evidence card | cartão de evidência |
| constraint form | formulário de restrições |
| coverage | cobertura |
| score, scoring | pontuação, pontuar |
| rotation | rotação de culturas |
| cover crop | planta de cobertura |
| cash rent | arrendamento em dinheiro |
| crop share | parceria agrícola (crop share) |
| safrinha, ZARC, PROAGRO, CAR, EUDR | keep as is |
| grant, GROUND | keep English technical product names |

Product names, dataset short names, agency names and file paths stay in English.

## Style examples

- "The demo runs one synthetic field" becomes "A demonstração roda em um campo sintético".
- "9 km posting from a 36 km footprint" becomes "grade de publicação de 9 km sobre uma pegada de 36 km".
- "Nothing persists without an on-screen confirmation" becomes "Nada persiste sem uma confirmação na tela".
