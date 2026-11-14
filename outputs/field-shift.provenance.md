# Provenance: field-shift

- Date: 2026-11-10
- Tier: Deep (nine sections, thirty-seven subsections, five waves plus a revision wave)
- Rounds: 1 evidence wave of 6 children (first child gated alone), 1 plan wave of 3, 1 write wave of 9, 1 review batch (verifier and reviewer), 1 fix wave of 6, 1 second verification pass
- Sources consulted: 242 pack rows across 6 packs, of which 140 rows are source-list entries. Distinct URLs: 404 in the packs, 150 cited in the report. Read-status split in the packs: 3 rows explicitly `(read)` in the counted columns, 9 `(URL verified, not read)`, 172 carrying no label in the counted column because the pack conventions differ by file. Computed with `scripts/count_sources.py` for four packs and by hand for T3 and T6, whose table layouts the script parses as zero and one row respectively.
- Accepted findings: 71 of 75 fixed; 1 accepted (section 6 restates evidence from sections 4 and 5 by design); 3 folded into others
- Rejected findings: none
- Retrieval route per source group: challenge page and awards page through Hound stealthy fetch (Obscura network-errors on the host, plain curl returns nothing); product pages, CMR metadata, ATBDs and validation PDFs through Hound and `web_extract`; paper metadata through Semantic Scholar, OpenAlex and Crossref over curl; farmer voices through `web_extract` on X profile pages; the companion site logged-out through Hound; local packs through `read_file`
- X posts consulted: profile-page walks on grower and agronomy handles during the T3 and T4 packs; no `portal_x_search` in this session, posts verified through `api.fxtwitter.com` where quoted
- PDFs extracted: ATBDs, user guides, product handbooks, USDA and Embrapa bulletins, farmdoc and K-State factsheets, court and committee records, through `web_extract` and Hound, no page count recorded per document
- Freshness window: 2025-01-01 to 2026-11-10 for policy, price, release and current conditions; older agronomy and documentation admitted and dated in place
- Quantitative audit: 73-assertion fix check, 0 failures; citation ledger 150 entries, `verify` exit 0; aggregates recomputed by script; second verification pass 8 of 8 PASS
- Plan: `outputs/.plans/field-shift.md`; section plans `plans/S1.md` to `plans/S9.md`; briefs `outputs/.plans/field-shift-T1.md` to `T6.md`, `V1.md`, `R1.md`
- Research: `research/nasa-data/T1.md`, `research/sources/T2.md`, `research/farmers-us/T3.md`, `research/farmers-br/T4.md`, `research/pressures/T5.md`, `research/site-prior-art/T6.md`, `research/challenge/challenge-page.md`
- Findings: `outputs/.drafts/verification.md`, `outputs/.drafts/review.md`, `outputs/.drafts/verification2.md`, dispositions in `outputs/.drafts/resolution.md`
- Verification status: PASS WITH NOTES
- Report bytes: 226568
- Report sha256: 5922eeff8504bf0739a4d51d3b61ba8e517381ea347381c0080be464649508b9

## Notes

The only em dashes in the report are the separator inside the Sources block, because the ledger render emits them and `verify` compares that block byte for byte. Body prose carries none. En dashes: zero.

Not executed, and named in the report status line: no Earthdata download, no NASA raster, no field polygon, no crop classifier, no agronomic validation. Counts of "read" rows understate the packs, because four of the six packs put the label inside free text rather than a dedicated column.

One deviation from the skill: the citation style is inline markdown links with a ledger-rendered Sources block rather than bracketed ids in the body, so `verify` reports 150 registered sources as uncited inline. That is the style's consequence, not a gap, and every URL is in the ledger.
