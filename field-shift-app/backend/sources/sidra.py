"""IBGE SIDRA table 1612, API v3 (R-37, R-38): soy planted area, hectares, category 2713."""

from __future__ import annotations

from typing import Any, Iterable

YEARS = range(2021, 2026)


def url(level: str, code: str) -> str:
    return (
        "https://servicodados.ibge.gov.br/api/v3/agregados/1612/periodos/2021-2025/variaveis/109"
        f"?localidades={level}%5B{code}%5D&classificacao=81%5B2713%5D"
    )


def _to_int(raw: Any) -> int | None:
    """A SIDRA cell is a digit string, or '-', '...' or another marker for no value (R-38)."""
    if raw is None:
        return None
    text = str(raw).strip()
    return int(text) if text.isdigit() else None


def parse(payload: list, code: str, years: Iterable[int]) -> dict[int, int | None]:
    """The planted area per year for one locality. An unknown code is a LookupError, never a guess."""
    for variable in payload:
        for result in variable.get("resultados", []):
            for series in result.get("series", []):
                if str(series["localidade"]["id"]) == str(code):
                    values = series.get("serie", {})
                    return {year: _to_int(values.get(str(year))) for year in years}
    raise LookupError(f"no SIDRA series for locality {code}")
