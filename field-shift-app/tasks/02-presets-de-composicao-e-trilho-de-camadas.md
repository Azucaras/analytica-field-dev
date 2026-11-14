# 02: presets-de-composicao-e-trilho-de-camadas
Status: done
Blocked by: 01
Demo: Trocar entre Map, Satellite e Satellite with labels muda a composição sem a câmera pular?
What it delivers: Trilho de camadas com três presets e cada entrada mostrando base, resolução e data.
Interface: LayerRail, useMapStore
Validation method: computer use
## Criteria
- The rail contains exactly three preset buttons named `Map`, `Satellite`, `Satellite with labels`. False if: a fourth appears or a name differs.
- Each rail entry shows basis, resolution and as-of date. False if: any of the three is missing.
- Switching `Map` to `Satellite` leaves centre and zoom unchanged. False if: zoom changes or tiles reload from scratch.
## Evidence required
- Captura antes e depois da troca com o mesmo centro, nomeada pelo AC-12.
- Saída de `npx vitest run` com o teste das três presets e dos três rótulos por entrada.
