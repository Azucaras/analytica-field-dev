---
title: "9.4 Realidade de acesso: Earthdata Login, cotas e o que um avaliador pode de fato executar"
description: "Executado em 2026-11-10 (registro de execução documentado): um ambiente virtual CPython 3.12 descartável instalou e importou earthaccess==0.19.0..."
checked: 2026-11-10
---

## Status e limite de acesso

Executado em 2026-11-10 (registro de execução documentado): um ambiente virtual CPython 3.12 descartável instalou e importou `earthaccess==0.19.0`, `requests` e `rasterio==1.4.4`; o Rasterio reportou o GDAL 3.10.3 empacotado (documentado). As requisições ao [NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) sem login, para um ponto nos EUA e um ponto no Brasil, retornaram HTTP 200 e 31 valores diários de T2M cada, para janeiro de 2025 (resultados de execução documentados). A [consulta CMR de granules do SMAP](https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=C2938664763-NSIDC_CPRD&page_size=5&sort_key=-start_date) retornou HTTP 200 e cinco registros de granules (resultado de execução documentado). Essa consulta CMR executada não tinha filtro temporal nem espacial. Seus registros são dados globais de catálogo dessa coleção, não evidência para um campo selecionado ou uma janela de tempo. Uma reprojeção sintética com o Rasterio foi concluída (resultado de execução documentado). Os binários `gdalinfo` e `gdalwarp` do sistema estavam ausentes (verificação documentada do sistema). Nenhum granule científico da NASA foi baixado ou inspecionado.

Planejado: todos os comandos abaixo são exemplos reproduzíveis para um avaliador executar. Eles não foram executados como parte desta edição e não alteram o conjunto executado acima. O Earthdata Login, os downloads autenticados e a inspeção de arquivos não foram executados porque as credenciais não estavam disponíveis. O caminho público continua sendo o piso da demonstração. A visibilidade no catálogo não autoriza uma requisição de arquivo a um DAAC.

## Verificação pública prévia e extensão autenticada

Execute a configuração a partir do diretório de trabalho mostrado no comando. Ela prefere o CPython 3.12 e recorre ao `python3` somente se for CPython 3.10 ou mais recente. As versões fixadas de dependências testadas continuam sendo `earthaccess==0.19.0`, `requests` e `rasterio==1.4.4`.

```sh
# Binários/builds: Bash 5.x e GNU coreutils; python3.12 (CPython 3.12.x), depois python3 (CPython >=3.10); o pip roda como .venv/bin/python -m pip.
PYTHON_BIN=""
for candidate in python3.12 python3; do
  if command -v "&#36;candidate" >/dev/null 2>&1 && \
     "&#36;candidate" -c 'import sys; raise SystemExit(0 if sys.implementation.name == "cpython" and sys.version_info >= (3, 10) else 1)'; then
    PYTHON_BIN="&#36;(command -v "&#36;candidate")"
    break
  fi
done
if [ -z "&#36;PYTHON_BIN" ]; then
  printf '%s\n' 'Need CPython 3.10 or newer; python3.12 and python3 were not found.' >&2
  exit 1
fi
"&#36;PYTHON_BIN" -c 'import sys; print(sys.version.split()[0]); raise SystemExit(0 if sys.version_info >= (3, 10) else "Need CPython 3.10 or newer")' || exit 1
WORKDIR="&#36;HOME/earthdata-s9-demo"
mkdir -p "&#36;WORKDIR" && cd "&#36;WORKDIR" || exit 1
"&#36;PYTHON_BIN" -m venv .venv && \
  .venv/bin/python -m pip install --only-binary=:all: --disable-pip-version-check earthaccess==0.19.0 requests rasterio==1.4.4 && \
  .venv/bin/python -c 'import earthaccess, rasterio; assert earthaccess.__version__ == "0.19.0"; assert rasterio.__version__ == "1.4.4"; print("earthaccess", earthaccess.__version__, "rasterio", rasterio.__version__, "GDAL", rasterio.__gdal_version__)'
```

Degrau de recuperação: se nenhum dos interpretadores existir ou a verificação de versão falhar, instale o CPython 3.10 ou mais recente e execute este bloco novamente. Se a criação do venv ou a instalação dos wheels falhar, mantenha as versões fixadas, inspecione o erro exibido e a disponibilidade de wheels para a plataforma e então use um build suportado do CPython. Não prossiga para os comandos de requisição até que as asserções finais de importação e de versão passem.

As duas requisições públicas ao POWER abaixo usam `curl` 8.x e o `.venv/bin/python` da configuração. Cada requisição inclui seu ponto e o intervalo de janeiro de 2025. As saídas sem login são `power-us.json` e `power-br.json`. Cada uma analisa imediatamente o JSON salvo, verifica o formato da resposta do POWER e exige 31 valores diários de T2M.

```sh
# Binários/builds: curl 8.x (verificado com curl 8.23.0); .venv/bin/python, CPython >=3.10.
cd "&#36;HOME/earthdata-s9-demo" || exit 1
curl --fail --show-error --silent --location --get --retry 3 --retry-max-time 120 --connect-timeout 20 --max-time 120 \
  'https://power.larc.nasa.gov/api/temporal/daily/point' \
  --data-urlencode 'parameters=T2M' --data-urlencode 'community=AG' \
  --data-urlencode 'longitude=-98.0' --data-urlencode 'latitude=37.0' \
  --data-urlencode 'start=20250101' --data-urlencode 'end=20250131' \
  --data-urlencode 'format=JSON' --data-urlencode 'time-standard=UTC' \
  --output power-us.json && \
.venv/bin/python - <<'PY'
import json
from pathlib import Path
p = json.loads(Path("power-us.json").read_text())
values = p["properties"]["parameter"]["T2M"]
assert isinstance(values, dict), "POWER T2M must be a date-to-value object"
assert len(values) == 31, f"expected 31 daily T2M values, got {len(values)}"
assert "20250101" in values and "20250131" in values
print(f"POWER US JSON shape valid; T2M count={len(values)}")
PY
```

Degrau de recuperação: se o curl falhar, inspecione o erro HTTP ou do serviço e os parâmetros da consulta. Para HTTP 429, o curl repete com backoff até a janela de repetição configurada. Se ainda falhar, aguarde 60 segundos antes de uma nova tentativa manual e evite requisições paralelas. Se a verificação do formato do JSON ou da contagem falhar, guarde a resposta para diagnóstico, confirme as datas e o ponto solicitados e não trate o arquivo como dado válido.

```sh
# Binários/builds: curl 8.x (verificado com curl 8.23.0); .venv/bin/python, CPython >=3.10.
cd "&#36;HOME/earthdata-s9-demo" || exit 1
curl --fail --show-error --silent --location --get --retry 3 --retry-max-time 120 --connect-timeout 20 --max-time 120 \
  'https://power.larc.nasa.gov/api/temporal/daily/point' \
  --data-urlencode 'parameters=T2M' --data-urlencode 'community=AG' \
  --data-urlencode 'longitude=-56.1' --data-urlencode 'latitude=-15.8' \
  --data-urlencode 'start=20250101' --data-urlencode 'end=20250131' \
  --data-urlencode 'format=JSON' --data-urlencode 'time-standard=UTC' \
  --output power-br.json && \
.venv/bin/python - <<'PY'
import json
from pathlib import Path
p = json.loads(Path("power-br.json").read_text())
values = p["properties"]["parameter"]["T2M"]
assert isinstance(values, dict), "POWER T2M must be a date-to-value object"
assert len(values) == 31, f"expected 31 daily T2M values, got {len(values)}"
assert "20250101" in values and "20250131" in values
print(f"POWER Brazil JSON shape valid; T2M count={len(values)}")
PY
```

Degrau de recuperação: se o curl falhar, inspecione o erro HTTP ou do serviço e os parâmetros da consulta. Para HTTP 429, o curl repete com backoff até a janela de repetição configurada. Se ainda falhar, aguarde 60 segundos antes de uma nova tentativa manual e evite requisições paralelas. Se a verificação do formato do JSON ou da contagem falhar, guarde a resposta para diagnóstico, confirme as datas e o ponto solicitados e não trate o arquivo como dado válido.

Esta consulta CMR planejada é deliberadamente delimitada pelo intervalo temporal de janeiro de 2025 e por uma caixa delimitadora em torno do ponto do POWER nos EUA. Diferentemente da consulta executada sem delimitação, ela não é uma listagem global do catálogo da coleção. O formato de `feed.entry` e a contagem retornada são verificados antes de qualquer resultado ser usado.

```sh
# Binários/builds: curl 8.x (verificado com curl 8.23.0); .venv/bin/python, CPython >=3.10.
cd "&#36;HOME/earthdata-s9-demo" || exit 1
curl --fail --show-error --silent --location --get --retry 3 --retry-max-time 120 --connect-timeout 20 --max-time 120 \
  'https://cmr.earthdata.nasa.gov/search/granules.json' \
  --data-urlencode 'collection_concept_id=C2938664763-NSIDC_CPRD' \
  --data-urlencode 'page_size=5' --data-urlencode 'sort_key=-start_date' \
  --data-urlencode 'temporal=2025-01-01T00:00:00Z,2025-01-31T23:59:59Z' \
  --data-urlencode 'bounding_box=-99,36,-97,38' \
  --output smap-cmr-scoped.json && \
.venv/bin/python - <<'PY'
import json
from pathlib import Path
feed = json.loads(Path("smap-cmr-scoped.json").read_text())["feed"]
entries = feed["entry"]
assert isinstance(entries, list), "CMR feed.entry must be a list"
assert 0 < len(entries) <= 5, f"expected 1 to 5 scoped entries, got {len(entries)}"
assert all(isinstance(row, dict) and row.get("id") and row.get("title") for row in entries)
print(f"Scoped CMR JSON shape valid; granule count={len(entries)} (maximum 5)")
PY
```

Degrau de recuperação: para HTTP 429, deixe o curl usar seu backoff de repetição; se as repetições se esgotarem, aguarde 60 segundos e repita uma vez. Se a resposta não for JSON válido ou não tiver `feed.entry`, verifique o endpoint e a resposta do CMR antes de repetir. Se a contagem de resultados válidos for zero, verifique o identificador de conceito da coleção e a ordem das coordenadas e depois amplie o intervalo temporal ou a caixa delimitadora. Se a contagem exceder o tamanho de página solicitado, pare e corrija a consulta ou o analisador. Uma consulta de metadados bem-sucedida ainda não autoriza o acesso aos dados.

O Earthdata Login tem caminhos de credenciais separados. Não digite credenciais em um comando, não as defina em um literal de comando nem as coloque no histórico do shell. O caminho `.netrc` armazena credenciais em texto simples, então use-o somente em uma máquina pessoal confiável, proteja-o com modo `600` e não o use em uma conta compartilhada. O prompt interativo do `earthaccess` é usado para criá-lo sem colocar a senha na linha de comando:

```sh
# Binários/builds: .venv/bin/python, CPython >=3.10 com earthaccess 0.19.0; chmod e stat do GNU coreutils.
cd "&#36;HOME/earthdata-s9-demo" || exit 1
umask 077
.venv/bin/python -c 'import earthaccess; auth = earthaccess.login(strategy="interactive", persist=True); assert auth.authenticated; print("Earthdata Login authenticated")' && \
  chmod 600 "&#36;HOME/.netrc" && stat -c 'mode=%a path=%n' "&#36;HOME/.netrc"
```

Degrau de recuperação: se o login interativo lançar uma exceção de autenticação, verifique a conta no Earthdata Login e repita o prompt sem copiar credenciais para um comando. Se o `.netrc` não existir ou seu modo não for `600`, pare, corrija a localização ou as permissões do arquivo e então execute novamente a verificação de login. Não imprima nem compartilhe o conteúdo do arquivo.

Verifique o login netrc e depois teste separadamente a autorização na coleção NSIDC selecionada. A sondagem faz uma requisição de intervalo de um byte para uma URL de dados retornada, não lê o corpo da resposta e não é um download de granule. Ela está planejada e não foi executada.

```sh
# Binários/builds: .venv/bin/python, CPython >=3.10 com earthaccess 0.19.0 e requests.
cd "&#36;HOME/earthdata-s9-demo" || exit 1
EDL_STRATEGY=netrc .venv/bin/python - <<'PY'
import os
import earthaccess

assert os.environ["EDL_STRATEGY"] == "netrc"
auth = earthaccess.login(strategy="netrc")
assert auth.authenticated, "Earthdata Login netrc authentication failed"
granules = earthaccess.search_data(
    count=1,
    concept_id="C2938664763-NSIDC_CPRD",
    temporal=("2025-01-01", "2025-01-31"),
    bounding_box=(-99, 36, -97, 38),
)
assert granules, "No granule matched this collection, date, and bounding box"
links = granules[0].data_links(access="external")
assert links, "CMR returned no external data link for the granule"
session = earthaccess.get_requests_https_session()
response = session.get(
    links[0], headers={"Range": "bytes=0-0"}, timeout=(15, 30), stream=True
)
try:
    assert response.status_code in (200, 206), f"DAAC authorization probe returned HTTP {response.status_code}"
    print(f"NSIDC collection data-link authorization probe: HTTP {response.status_code}; response body not read")
finally:
    response.close()
PY
```

Degrau de recuperação: em caso de exceção de autenticação, corrija a entrada do netrc ou o login da conta e execute novamente a etapa de login netrc. Diante de HTTP 401 ou 403 da URL de dados, a conta está autenticada, mas a coleção selecionada ou seu endpoint de dados do DAAC não autorizou o acesso; verifique o acesso à coleção e qualquer EULA exigido e então execute novamente esta mesma sondagem da coleção. Se nenhum granule corresponder, verifique o identificador de conceito, o intervalo de datas e a caixa delimitadora ou amplie a consulta. Não infira a permissão de arquivo a partir dos metadados públicos do CMR.

A rota por variáveis de ambiente usa `read -s`, para que a senha seja digitada em silêncio, não fique guardada no histórico do shell e seja removida ao sair do subshell. Sua estratégia de login é explicitamente `environment`, não `netrc`:

```sh
# Binários/builds: Bash 5.x; .venv/bin/python, CPython >=3.10 com earthaccess 0.19.0 e requests.
cd "&#36;HOME/earthdata-s9-demo" || exit 1
(
  set +x
  cleanup_edl() { unset EARTHDATA_USERNAME EARTHDATA_PASSWORD; }
  trap cleanup_edl EXIT HUP INT TERM
  read -r -p 'Earthdata username: ' EARTHDATA_USERNAME
  read -r -s -p 'Earthdata password: ' EARTHDATA_PASSWORD
  printf '\n'
  export EARTHDATA_USERNAME EARTHDATA_PASSWORD
  EDL_STRATEGY=environment .venv/bin/python - <<'PY'
import os
import earthaccess

assert os.environ["EDL_STRATEGY"] == "environment"
auth = earthaccess.login(strategy="environment")
assert auth.authenticated, "Earthdata Login environment authentication failed"
granules = earthaccess.search_data(
    count=1,
    concept_id="C2938664763-NSIDC_CPRD",
    temporal=("2025-01-01", "2025-01-31"),
    bounding_box=(-99, 36, -97, 38),
)
assert granules, "No granule matched this collection, date, and bounding box"
links = granules[0].data_links(access="external")
assert links, "CMR returned no external data link for the granule"
session = earthaccess.get_requests_https_session()
response = session.get(
    links[0], headers={"Range": "bytes=0-0"}, timeout=(15, 30), stream=True
)
try:
    assert response.status_code in (200, 206), f"DAAC authorization probe returned HTTP {response.status_code}"
    print(f"NSIDC collection data-link authorization probe: HTTP {response.status_code}; response body not read")
finally:
    response.close()
PY
)
```

Degrau de recuperação: em caso de exceção de autenticação por variável de ambiente, confirme as credenciais da conta no Earthdata Login e repita o prompt silencioso. O subshell remove as duas variáveis ao sair. Diante de HTTP 401 ou 403, o login bem-sucedido não autorizou esta URL de dados da coleção; verifique o acesso à coleção selecionada e qualquer EULA exigido e então execute a mesma sondagem novamente. Se a busca delimitada estiver vazia, corrija o identificador da coleção ou amplie o intervalo da consulta ou a bbox. Nunca imprima nem persista as variáveis de ambiente.

| Caminho | Limite |
|---|---|
| POWER | Sem login, contexto diário em grade |
| CMR | Busca pública de metadados, não autorização de arquivo |
| Sondagem da coleção NSIDC | Requisição de intervalo de um byte autenticada; não é um download |
| Cinco produtos científicos recomendados | Earthdata Login exigido para download; a autorização da coleção deve ser verificada separadamente |

**Figura S9-F4. Caminhos de acesso público e autenticado (testes públicos documentados; o acesso autenticado segue planejado).**

## Latência, cotas e ordem de recuperação

Conforme verificado em 2026-11-10 (documentado), a latência meteorológica típica do POWER foi de 2 a 3 dias, e a latência solar, de 5 a 7 dias (documentado). O [HLS](https://doi.org/10.5067/HLS/HLSL30.002) declara uma meta de processamento de 1 a 2 dias (documentado), enquanto os granules verificados ficaram cerca de 3 dias atrás (documentado). A latência média reportada do SMAP L3 foi de cerca de 1.2 dias (documentado). O granule mais recente do [ECOSTRESS JET](https://www.earthdata.nasa.gov/data/catalog/lpcloud-eco-l3t-jet-003) tinha pelo menos 13 dias (documentado). O [GPM IMERG V07 Final](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary) encerrou em 2025-09-30 (documentado); uma liberação V08 Final no outono de 2026 foi projetada, não garantida (documentado). Estes não são compromissos de tempo real. Nenhuma cota numérica do CMR foi estabelecida, então não invente uma.

Em caso de falha, primeiro verifique o binário, a versão, o status HTTP, os parâmetros solicitados e o formato da resposta. Para um interpretador ausente ou uma instalação de pacote com falha, use o degrau de recuperação da configuração acima. Para uma exceção do Earthdata Login, use o degrau de recuperação ao lado do caminho de credenciais selecionado. Para HTTP 429, respeite o backoff de repetição do curl e aguarde 60 segundos antes de uma única nova tentativa manual. Para um resultado CMR delimitado, válido, mas vazio, verifique o identificador da coleção e a ordem da bbox e depois amplie a janela de datas ou a caixa delimitadora. Em seguida, use o POWER sem login para contexto público e depois os metadados públicos do CMR, sem afirmar autorização de arquivo. Depois, busque um único produto obrigatório disponível somente depois que a verificação de autorização da coleção for aprovada, removendo as camadas opcionais nesta ordem: ECOSTRESS, HLS e depois o contexto grosseiro, se a comparação puder prosseguir sem ele. Em seguida, reduza a resolução de exibição ou de processamento, mantendo as ressalvas de suporte nativo. Por fim, use um fixture estático construído à parte, rotulado e datado pela fonte. Nunca relaxe as regras de autenticação, QA, junções de campo ou temporada, divulgação de incerteza ou abstenção.

## PDFs e artigos sugeridos para uma possível segunda rodada de pesquisa

Os pacotes de fontes apontaram seis documentos que merecem uma segunda leitura, que esta execução não conseguiu ler por completo ou não abriu. Eles estão listados apenas como acompanhamentos e não contam como evidência consultada.

1. O'Neill et al., relatório de avaliação de calibração e validação do SMAP, JPL D-56297 (2019-08-15), a base de validação dos valores de ubRMSE do SMAP citados na seção 2.1, acessível a partir da página do produto na NSIDC.
2. O manual do GRACE Nível 3, tabela 2, que traz a orientação sobre fator de ganho e correção de mascons da qual depende a seção 2.5.
3. O guia do produto HLS v2.0 e as listas de problemas L30 e S30, para os modos de falha de aerossol e de Fmask que a seção 2.4 declara.
4. Os avisos de transição do GPM V08 de 2026, para definir se a execução Final retoma na data de outono de 2026 projetada, questão que a seção 2.3 mantém em aberto.
5. Uma fonte revisada por pares sobre a economia de rotação e de plantas de cobertura no Cerrado, já que a seção 5.3 se apoia em relatórios de cooperativas e de tradings para o cálculo do netback.
6. Qualquer validação publicada de um classificador de tipo de cultura em rotações brasileiras de soja e milho a 30 m, porque a seção 9.2 precisa rotular a identificação de culturas como planejada, e não validada.
