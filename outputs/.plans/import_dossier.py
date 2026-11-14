#!/usr/bin/env python3
"""Import the full dossier into the docs site as one page per subsection.

Reads outputs/field-shift.md, writes src/content/docs/50-dossier/<section>/<n>-<slug>.md
with frontmatter, demoted internal headings, and the Sources block as its own page.
"""
import pathlib, re, json, unicodedata

ROOT = pathlib.Path("/run/media/carloshnp/D/Programming/analytica-field-dev")
SRC = ROOT / "outputs/field-shift.md"
DOCS = ROOT / "field-shift-docs/src/content/docs/50-dossier"
SECTIONS = {}

SECTION_NAMES = {
    1: "s1-the-challenge",
    2: "s2-what-the-satellite-record-carries",
    3: "s3-the-non-nasa-data-problem",
    4: "s4-what-us-farmers-weigh",
    5: "s5-what-brazilian-farmers-weigh",
    6: "s6-the-2026-conditions",
    7: "s7-the-companion-site-and-prior-art",
    8: "s8-making-the-app-usable",
    9: "s9-build-annex",
}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:60].strip("-")


def desc(body):
    for para in body.split("\n"):
        p = para.strip()
        if p and not p.startswith(("#", "|", "```", ">", "-")):
            p = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", p)
            p = re.sub(r"[*_`]", "", p)
            return (p[:150].rsplit(" ", 1)[0] + ".") if len(p) > 150 else p
    return "Dossier subsection."


def main():
    text = SRC.read_text()
    body, sources = text.split("\n## Sources", 1)
    lines = body.split("\n")
    cur_sec, cur_sub, buf, order = None, None, [], []

    def flush():
        if cur_sub and buf:
            SECTIONS.setdefault(cur_sec, []).append((cur_sub[0], cur_sub[1], "\n".join(buf).strip()))

    for l in lines[1:]:
        m2 = re.match(r"^## (\d)\. (.+)$", l)
        m3 = re.match(r"^### (\d)\.(\d) (.+)$", l)
        if m3:
            flush()
            buf = []
            cur_sec, cur_sub = int(m3.group(1)), (f"{m3.group(1)}-{m3.group(2)}", m3.group(3).strip())
            continue
        if m2:
            flush()
            buf = []
            cur_sec, cur_sub = int(m2.group(1)), ("00-index", m2.group(2).strip())
            continue
        if cur_sub is not None:
            buf.append(l)
    flush()

    n = 0
    for sec, items in SECTIONS.items():
        d = DOCS / SECTION_NAMES[sec]
        d.mkdir(parents=True, exist_ok=True)
        for key, title, content in items:
            # demote internal headings to keep one H1 per page
            content = re.sub(r"^#{3,6} ", "## ", content, flags=re.M)
            if key == "00-index":
                fn = d / "index.md"
                fm_title = title
            else:
                fn = d / f"{key}-{slug(title)}.md"
                fm_title = f"{key.replace('-', '.')} {title}"
            fn.write_text(
                f"---\ntitle: {json.dumps(fm_title)}\n"
                f"description: {json.dumps(desc(content))}\n"
                f"checked: 2026-11-10\n---\n\n{content}\n"
            )
            order.append(str(fn.relative_to(DOCS)))
            n += 1

    # sources page
    src_body = re.sub(r"^\n?\n?", "", sources).strip()
    (DOCS / "99-sources.md").write_text(
        "---\ntitle: \"99 Sources\"\ndescription: \"All 150 sources cited in the dossier, rendered from the citation ledger.\"\nchecked: 2026-11-10\n---\n\n"
        + src_body + "\n")
    order.append("99-sources.md")
    print("pages written:", n + 1)
    for o in order[:6]:
        print(" ", o)


if __name__ == "__main__":
    main()
