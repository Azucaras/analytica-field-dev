---
title: "9.3 Agent boundary and validator"
description: "Executed (documented research and repository check): the research checks queried public APIs and catalogue metadata, but no Field Shift agent..."
checked: 2026-11-10
---

## Status

Executed (documented research and repository check): the research checks queried public APIs and catalogue metadata, but no Field Shift agent, database, production schema, query validator, or write tool exists in the repository. No model has been benchmarked for query correctness or resistance to prompt injection (documented repository check).

Planned: the architecture below treats a language model as a request parser and query planner. A deterministic service would resolve identifiers, validate a read-only query, and return evidence with limitations. State-changing actions would require a separate user-confirmed path. None of those components is built or verified.

## Make semantics explicit at the data boundary

A proposed typed request contains selected `field_id`, explicit boundary version, bounded season interval, allowlisted indicator slot, and aggregation choice. S8.3 is the authoritative schema contract, including versioned boundary and observation periods; this section defines how the agent is held at that data boundary. The service resolves the field and seasons against records visible to the user. If a field name matches multiple records, a season is ambiguous, or a requested crop claim is unsupported, the service asks for correction or declines instead of guessing.

Maintain documented tables with explicit identifiers and relationships. Return only schema details and join paths allowed for the question. The validator should reject non-SELECT statements, unknown tables or columns, missing field or season constraints, invalid spatial predicates, joins that bypass declared relationships, excessive row counts, and outputs with inconsistent units. Apply parameterized query templates where possible. Use access control at the data service, not only in a prompt. Limit query time and result size, and log the resolved request, validator result, and data provenance without treating model-generated explanations as evidence.

A read-only tool should return structured values together with field and season resolved, join path, sources and granules, units, effective spatial and temporal support, quality exclusions, overlap policy, missingness, and warnings. The assistant can explain this response in natural language, but it must not omit the structured evidence object. If the model cannot preserve the limitation or distinguish modeled from observed values, show the tool result directly and abstain from a synthesized conclusion.

## Test wrong joins, not just valid SQL

Compare tool output with analyst-authored gold queries and fixtures designed to expose semantic errors. Include adjacent fields, shared boundaries, missing seasons, duplicate granules, invalid QA, mixed coordinate systems, overlapping observations, and ambiguous crop labels. Test that a syntactically valid query cannot attach a neighboring field's image to the selected polygon or combine different seasons. Measure exact identifier resolution, join correctness, units, filtering, abstention, and provenance completeness separately from SQL syntax success. Include adversarial text in retrieved records and user requests to test whether instructions can escape the allowlist. No accuracy or security result is available until these tests are implemented and run.

| Boundary | Planned behavior |
|---|---|
| Request parser | Typed field, season, indicator, aggregation |
| Schema allowlist | Only documented tables and join paths |
| Deterministic validator | Read-only, bounded, unit-checked execution |
| Evidence response | Values with provenance, QA, support, gaps |
| State change | Separate tool requiring explicit confirmation |

**Figure S9-F3. Planned read-only agent boundary (documented constraints, proposed design).**

All state-changing operations, including saving a scenario, editing a field record, or exporting data to an external service, stay outside the autonomous query path. The system previews the exact action and affected record, then waits for explicit confirmation. A refusal or ambiguous request should offer a safe next step, such as choosing the field, narrowing seasons, or asking an agronomist to review an unsupported interpretation.

The proposed architecture is not a claim of safe deployment. Schema design, storage, query templates, validator, model selection, and test suite remain unbuilt. A production-schema text-to-SQL study may inform future implementation, but it does not establish this tool's accuracy. Prompt wording, model confidence, successful SQL execution, or a polished explanation cannot replace deterministic checks and evaluation.
