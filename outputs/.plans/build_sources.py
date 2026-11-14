#!/usr/bin/env python3
"""Register every URL cited in the report into a citation ledger and render the
Sources block mechanically. URLs come from the assembled body, never from memory.
"""
import re, pathlib, subprocess, sys

ROOT = pathlib.Path("/run/media/carloshnp/D/Programming/analytica-field-dev")
REPORT = ROOT / "outputs/field-shift.md"
LEDGER = ROOT / "outputs/.drafts/citations.json"
S = pathlib.Path.home() / ".hermes/skills/research/grounded-citations/scripts/sources.py"


def run(*args):
    r = subprocess.run([sys.executable, str(S), "--ledger", str(LEDGER), *args],
                       capture_output=True, text=True)
    return r.returncode, r.stdout.strip(), r.stderr.strip()


def main():
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    run("reset")
    text = REPORT.read_text()
    body = text.split("## Sources")[0]
    ids, seen = [], {}
    for m in re.finditer(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", body):
        title, url = m.group(1).strip(), m.group(2)
        if url in seen:
            continue
        rc, out, err = run("add", url, "--title", title[:120])
        m2 = re.search(r"\[(\d+)\]", out)
        if rc != 0 or not m2:
            print("FAILED add", url, err or out)
            continue
        seen[url] = m2.group(1)
        ids.append(m2.group(1))
    print("urls registered:", len(ids))
    rc, block, err = run("render", "--only", ",".join(ids))
    if rc != 0:
        sys.exit("render failed: " + err)
    REPORT.write_text(body.rstrip() + "\n\n## Sources\n\n" + re.sub(r"^#+\s*Sources\s*", "", block.strip()).lstrip() + "\n")
    rc, out, err = run("verify", str(REPORT))
    print("verify rc", rc)
    print(out[-1500:]); print(err[-800:])


if __name__ == "__main__":
    main()
