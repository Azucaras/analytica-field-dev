# Tarefa 03 — evidência por CLI

Transcrições realizadas em 2026-11-11 UTC com o backend iniciado em `127.0.0.1:8011` (porta 8000 já estava ocupada por outro processo uvicorn). Para provar o proxy sem depender da disponibilidade externa do GIBS, `TILE_UPSTREAM_URL` apontou a um servidor HTTP local de demonstração que devolve o arquivo PNG de reserva com 200. Uma segunda instância de mock local devolveu 503.

## AC-13 — tile passa pelo endpoint local

O caminho pedido pelo cliente é local: `/tiles/smap-soil-moisture/1/0/0`. O log do mock confirma que o backend compôs o upstream WMTS com camada, data UTC atual, matriz e eixos esperados:

```text
UPSTREAM GET /SMAP_L3_Passive_Enhanced_Day_Soil_Moisture/default/2026-11-11/GoogleMapsCompatible_Level6/1/0/0.png
```

Resposta do proxy:

```text
$ curl -sS -D - http://127.0.0.1:8011/tiles/smap-soil-moisture/1/0/0 -o backend/.tile-first.bin
HTTP/1.1 200 OK
x-tile-source: upstream
x-tile-date: 2026-11-11
content-length: 997
content-type: image/png
```

## AC-22 — a repetição é do cache

```text
$ curl -sS -D - http://127.0.0.1:8011/tiles/smap-soil-moisture/1/0/0 -o backend/.tile-first.bin
HTTP/1.1 200 OK
x-tile-source: upstream
x-tile-date: 2026-11-11
content-length: 997
content-type: image/png

$ curl -sS -D - http://127.0.0.1:8011/tiles/smap-soil-moisture/1/0/0 -o backend/.tile-second.bin
HTTP/1.1 200 OK
x-tile-source: cache
content-length: 997
content-type: image/png

$ curl -sS http://127.0.0.1:8011/tiles/stats/upstream
{"upstream_requests":1}

$ cmp backend/.tile-first.bin backend/.tile-second.bin && wc -c backend/.tile-first.bin
997 backend/.tile-first.bin
```

A primeira busca gerou uma única requisição no mock; o segundo `curl` recebeu `X-Tile-Source: cache` sem novo acesso ao mock.

## AC-14 — upstream 503 serve a reserva e um aviso

Iniciado outro backend com `TILE_UPSTREAM_URL=http://127.0.0.1:8013` apontando a um mock local que responde HTTP 503:

```text
$ TILE_UPSTREAM_URL=http://127.0.0.1:8013 curl -sS -D - http://127.0.0.1:8014/tiles/smap-soil-moisture/1/0/0 -o backend/.fallback.bin
HTTP/1.1 200 OK
x-tile-source: reserve
x-tile-fallback: Local reserve tile served after upstream failure (503)
content-length: 997
content-type: image/png

$ sha256sum backend/.fallback.bin backend/reserve/smap-soil-moisture.png
f87a85785edc559448295786b8b2d02439407d90edeb1a5153254fc6a6312e0d  backend/.fallback.bin
f87a85785edc559448295786b8b2d02439407d90edeb1a5153254fc6a6312e0d  backend/reserve/smap-soil-moisture.png

$ curl -sS http://127.0.0.1:8014/tiles/stats/upstream
{"upstream_requests":1}
```

O corpo foi comparado byte a byte com `backend/reserve/smap-soil-moisture.png`; cabeçalhos `X-Tile-Source` e `X-Tile-Fallback` identificam explicitamente a reserva e o motivo para a UI mostrar o aviso. O mock registrou a chamada:

```text
UPSTREAM 503 GET /SMAP_L3_Passive_Enhanced_Day_Soil_Moisture/default/2026-11-11/GoogleMapsCompatible_Level6/1/0/0.png
```

## Prova da data fallback (hoje → ontem)

Com o upstream de demonstração configurado para responder 404 para a data de hoje e 200 para ontem, o endpoint faz duas tentativas e retorna a data anterior:

```text
$ curl -sS -D - http://127.0.0.1:8016/tiles/smap-soil-moisture/1/0/0 -o /dev/null
HTTP/1.1 200 OK
x-tile-source: upstream
x-tile-date: 2026-11-10
content-length: 997
content-type: image/png

$ curl -sS http://127.0.0.1:8016/tiles/stats/upstream
{"upstream_requests":2}

UPSTREAM /SMAP_L3_Passive_Enhanced_Day_Soil_Moisture/default/2026-11-11/GoogleMapsCompatible_Level6/1/0/0.png
UPSTREAM /SMAP_L3_Passive_Enhanced_Day_Soil_Moisture/default/2026-11-10/GoogleMapsCompatible_Level6/1/0/0.png
```

## Verificações adicionais

- `backend/.venv/bin/python -m py_compile backend/main.py` terminou sem erro.
- Reserva verificada como PNG válido 256×256, com CRCs dos chunks corretos.
- `GET /health` respondeu HTTP 200 no processo já ocupado em `127.0.0.1:8000`. Para os curls acima foram usados portas livres 8011 e 8014; o processo preexistente de 8000 não foi interrompido.
