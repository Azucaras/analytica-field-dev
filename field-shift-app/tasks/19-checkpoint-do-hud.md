# 19: checkpoint-do-hud
Status: done
Blocked by: 15,16,17,18
Demo: Redimensionar de 1440 para 780 mantém a câmera e nenhum toggle de expandir aparece?
What it delivers: Fecho do bloco: câmera estável no resize, contratos de DOM intactos, nenhum toggle novo.
Interface: None
Validation method: computer use
## Criteria
- Across a resize from 1440 to 780 the centre and zoom hold. False if: the camera jumps.
- All seven DOM contracts still resolve. False if: any role and name pair is missing.
- No toggle labelled Expand, Collapse or Fullscreen renders. False if: one appears.
## Evidence required
- Captura antes e depois do resize, nomeada pelo AC-10.
- Saída de `npx vitest run` completo e de `npm run build`.
