"""Exercise the two fixture routes against the six entry fixture (block 3 R-07, R-24)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path("/home/carloshnp/.hermes/kanban/boards/field-shift/workspaces/t_cf98ed11/field-shift-app/backend")))

import main  # noqa: E402

failures = []


def check(condition, message):
    if not condition:
        failures.append(message)
        print("FAIL ", message)


listing = main.list_fields()
print("GET /fields ->", len(listing["fields"]), "fields")
print("  keys of a US entry:", sorted(listing["fields"][3].keys()))
check(len(listing["fields"]) == 6, "the listing does not carry six fields")
check(
    [field["region"] for field in listing["fields"]] == ["br"] * 3 + ["us"] * 3,
    "the listing is not separable by region",
)
check(all("scenarios" not in field for field in listing["fields"]), "the listing leaks scenarios")

for field in listing["fields"]:
    payload = main.get_scenarios(field["id"])
    check(payload["field_id"] == field["id"], f"{field['id']}: wrong field_id")
    check(len(payload["scenarios"]) == 3, f"{field['id']}: {len(payload['scenarios'])} scenarios")
    check(payload["state"] in {"ranked", "abstained"}, f"{field['id']}: bad state")
    print(
        f"  {field['id']:<18} region={field['region']} coverage={field['coverage']:>3} "
        f"state={payload['state']:<9} threshold={payload['threshold']} "
        f"scenarios={[s['name'] for s in payload['scenarios']]}"
    )

try:
    main.get_scenarios("not-a-field")
    check(False, "an unknown field id did not raise")
except Exception as exc:  # noqa: BLE001
    print("unknown id ->", type(exc).__name__, getattr(exc, "status_code", ""))

print()
print("failures:", len(failures))
raise SystemExit(1 if failures else 0)
