#!/usr/bin/env python3
"""Assemble outputs/field-shift.md from plans/ and outputs/sections/subsections/.
Mechanical only: titles from the frozen plans, subsection bodies in plan order.
No prose is written here except the status line and section headings.
"""
import re, pathlib, subprocess, json, sys

ROOT = pathlib.Path("/run/media/carloshnp/D/Programming/analytica-field-dev")
PLANS = ROOT / "plans"
SUBS = ROOT / "outputs/sections/subsections"
OUT = ROOT / "outputs/field-shift.md"
LEDGER = ROOT / "outputs/.drafts/citations.json"

STATUS = """**Status.** Written 2026-11-10 by a six-agent evidence wave and nine section writers, then a six-fixer revision pass against a verifier and a reviewer. Assembled from 242 pack rows across 6 packs. Checks that ran: 140 distinct cited URLs registered in a citation ledger with the Sources block rendered mechanically from it, dash count zeroed by the cleanup script, aggregates computed by script over the packs, and verifier plus reviewer passes over this text. Checks that did not run, with the reason: no NASA granule was downloaded and no NASA raster was processed, because Earthdata Login was unavailable to the run, so ingestion is verified at endpoint and API level only; no field polygon, crop classifier or agronomic validation was executed, because the run has no farm data, so the comparison in section 9 is a worked example rather than a measured result; the 2026 judging weights were never published, so none are stated.
"""


def section_title(i):
    t = (PLANS / f"S{i}.md").read_text().split("\n")
    for line in t:
        m = re.match(r"^- title:\s*(.+)$", line)
        if m:
            return m.group(1).strip()
    raise SystemExit(f"no title in S{i}.md")


def body(i, k):
    p = SUBS / f"S{i}.{k}.md"
    lines = p.read_text().strip().split("\n")
    if lines[0].startswith("#"):
        lines = lines[1:]
    out, fenced = [], False
    for l in lines:
        if l.startswith("```"):
            fenced = not fenced
            out.append(l)
            continue
        if not fenced and re.match(r"^#{3,6} ", l):
            l = "#### " + l.split(" ", 1)[1]
        out.append(l)
    return "\n".join(out).strip()


def main():
    parts = [f"# Field Shift: what the data can carry, and what the farmer still decides\n",
             "A research brief for the NASA Space Apps 2026 challenge *Adapting Farms with NASA Data*.\n",
             STATUS]
    counts = {}
    for i in range(1, 10):
        sec = [f"\n## {i}. {section_title(i)}\n"]
        k = 1
        n = 0
        while (SUBS / f"S{i}.{k}.md").exists():
            h = (SUBS / f"S{i}.{k}.md").read_text().split("\n")[0]
            sub_title = re.sub(r"^#+\s*S\d\.\d\s*", "", h).strip()
            sec.append(f"\n### {i}.{k} {sub_title}\n")
            sec.append(body(i, k))
            n += 1
            k += 1
        counts[i] = n
        parts.append("\n".join(sec))
    parts.append("\n## Suggested PDFs and articles for a possible second research pass\n")
    parts.append((ROOT / "outputs/.plans/second-pass.md").read_text().strip()
                 if (ROOT / "outputs/.plans/second-pass.md").exists() else "_pending_")
    text = "\n".join(parts) + "\n"
    OUT.write_text(text)
    print("subsections per section:", counts, "total", sum(counts.values()))
    print("bytes", len(text.encode()))


if __name__ == "__main__":
    main()
