# Field Shift backend

FastAPI backend. Na inicialização, `main.py` carrega o fixture de campos; tiles passam pelo proxy local.

## Proxy de tiles

- `GET /tiles/{layer}/{z}/{x}/{y}` faz o proxy para GIBS. Camada suportada: `smap-soil-moisture`, mapeada para `SMAP_L3_Passive_Enhanced_Day_Soil_Moisture`, em `GoogleMapsCompatible_Level6`. Tenta a data UTC de hoje e, se GIBS retornar 404, tenta ontem.
- Tiles bem-sucedidos ficam em disco por 24 horas (chave por camada/z/x/y). Repetições frescas são servidas do cache.
- Falhas de conexão ou HTTP 5xx servem `reserve/{layer}.png` com `X-Tile-Source: reserve` e `X-Tile-Fallback` para o cliente mostrar o aviso. Respostas upstream normais incluem `X-Tile-Source: upstream`; cache inclui `X-Tile-Source: cache`.
- `GET /tiles/stats/upstream` expõe `{"upstream_requests": N}` para observar quantas chamadas foram feitas ao upstream desde o start do processo.

### Variáveis de ambiente

- `TILE_UPSTREAM_URL` (opcional): origem/base URL do upstream; por padrão usa `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best`. Útil para apontar a um mock/ambiente de teste ou para simular indisponibilidade. O caminho WMTS é acrescentado pelo proxy.
- `TILE_CACHE_DIR` (opcional): diretório do cache em disco; por padrão `backend/.tile-cache`.

### Executar

Na raiz do projeto:

```sh
backend/.venv/bin/python -m uvicorn main:app --app-dir backend --port 8000
```

A reserva incluída em `reserve/smap-soil-moisture.png` é PNG 256×256.
