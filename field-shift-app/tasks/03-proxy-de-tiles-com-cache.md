# 03: proxy-de-tiles-com-cache
Status: done
Blocked by: 01
Demo: Duas requisições ao mesmo tile passam pelo proxy e a segunda sai do cache?
What it delivers: Proxy de tiles no backend com cache em disco de 24 h e reserva local quando o upstream falha.
Interface: GET /tiles/{layer}/{z}/{x}/{y}
Validation method: cli transcript
## Criteria
- A tile request hits the local origin at `/tiles/{layer}/{z}/{x}/{y}`. False if: it goes straight to `gibs.earthdata.nasa.gov`.
- With upstream forced to 503, the app serves the reserve tile and renders the fallback message. False if: the map blanks or no message renders.
- Two identical requests produce one upstream fetch and a cache hit. False if: the second request reaches upstream.
## Evidence required
- Transcrição de dois `curl` idênticos com o log do contador de upstream igual a 1.
- Transcrição do 503 forçado com o arquivo de reserva servido e o texto do aviso.
