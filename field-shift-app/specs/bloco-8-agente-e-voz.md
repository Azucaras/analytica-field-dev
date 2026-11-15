# Spec: Block 8, agent and voice

Status: frozen on 2026-11-14 as revision 1. The governing rule is ADR 0005 (`docs/adr/0005-blocos-com-spec-congelada.md`): every block runs on a frozen spec before code. ADR 0004 (`docs/adr/0004-agente-invoca-a-interface-por-registro-de-comandos.md`) governs the one way the agent touches the interface: a typed command registry, called by command name, never by a DOM selector. This file produces the spec only. No application code, config, string catalog, test, other spec or block 1 to 7 text changes on the card that writes it. The freeze digest is in the Freeze record near the end of this file.

Inherits block 6 revision 2, the frozen text in the tree: `field-shift-app/specs/bloco-6-numeros-por-poligono.md`, 642 lines, raw sha256 `83f855ad47bf1d748973296f224bf88d2e76ce7e4f75810f904ac14c0c3897b4`, freeze digest `0d10c71fbe74519f3a801dcdc9eb475a8a53b1fbbfd23c52d8263880fbb7088e`. It inherits block 5 revision 5 (`field-shift-app/specs/bloco-5-poligonos-de-cultura.md`, 531 lines, raw sha256 `6823769b59910ac64814d6dddfb5f7a0501f994f9fcab8dd0a8431df4975296d`, freeze digest `ebc94342f57071cfea25d3074e392f73427b51a94286b2372ebc98c8458bea61`), block 4 revision 8 (`field-shift-app/specs/bloco-4-camadas-e-timeline.md`, 681 lines, raw sha256 `dd1aa5a067fe1d8c908454132a5c77d75c6d272ee99a6e26828891ef695ea51c`, freeze digest `f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e`), block 3 revision 7 (`field-shift-app/specs/bloco-3-game-hud.md`, 450 lines, raw sha256 `29a9d7efc2f182e0391faf00507232ad6631de6b93486224a0a7efd6c49b892d`, freeze digest `b384e88556e7e8b15c96b424c6f778b4fb3d874b5def987a502da83b1df88452`), block 2 revision 2 (`field-shift-app/specs/bloco-2-hud-sobreposto.md`, 108 lines, digest `3bb44541c55940b32af0958c57b2e00846fedf162f0602b54cf54e5a56e1a255`) and block 1 revision 3 (`field-shift-app/specs/bloco-1-mapa-de-composicao.md`, 177 lines, raw sha256 `70c235ccbc154762df4c6d9e35024da4a2bf501e6e70cc6eb38ee09bf26acab3`, freeze digest `5165dd4df375b74c455296562585bf00b2b2813304153e849d477d8e4735a117`). All six digests were reproduced on 2026-11-14 with each file's own `sed` recipe, so this file reads the text the tree actually carries.

It also inherits block 7 revision 1, the sibling frozen text: `field-shift-app/specs/bloco-7-decisao-e-produtor.md`, 562 lines, raw sha256 `0a6b054d46d25da0671516834e0f27866c3013cf50fd244b8b6a97dad68c2570`, freeze digest `d734c534b5ea9dcf8074b521dca1fa934401469dae0ae770212e2eee41da9748`, reproduced on this card with that file's own `sed` recipe, which carries the `g` flag. Block 7 did not exist when this card started (the directory held blocks 1 to 6 at 21:39), landed at 21:53 and was rewritten in place at 21:56, so it was read twice and both readings are recorded in M-13 and M-16. Blocks 7 and 8 are siblings by the ROTEIRO: neither inherits the other, and this file reads block 7 only for the shared clauses below.

The two sibling conflicts this block reports rather than edits, both for the orchestrator:
- Block 7 AM-02 rewrites block 2 R-11 to add two conditional pairs and block 7 AM-03 rewrites block 3 R-32 to add two `ZOrder` keys, while this block does neither, because the user's constraint of 2026-11-14 forbids amending block 2 and block 3. The two readings cannot both be right: either the constraint permits an additive amendment (block 7's reading) or it does not (this block's reading). This block keeps its stricter reading and does not edit block 7 (M-16).
- Block 7 adds no route, so the route inventory of AM-07 is unaffected by it.

The region rule of this file is stated once, in R-47, and it follows block 6 R-51 in the revision 2 bytes that landed at 21:57: the default region is the United States, `csb:` selects the United States, `trazo:` selects Brazil, a fixture id resolves in the region its own fixture entry carries, and an id with no prefix and no fixture entry resolves in the United States. The fixture file on disk still carries three entries and no `region` key, so the three `mt-santa-carmem` rows take `br` from block 5 R-24, which names them as the Brazil fixture fields, and a later entry that carries its own region overrides that value (M-17).

The user's constraints of 2026-11-14 that this file applies, each cited where it lands:
- The `Command` form is planned later by the user. Block 8 SHALL NOT design, extend, replace or assume that form: it does not edit `CommandToggle.tsx`, does not rely on its DOM, its state or its labels, and does not require the form to be open for any feature here (R-41, R-46, AC-35).
- No dependency on the block 3 right edge column (R-23, R-40) or on the `Supporting data` panel: the agent surface is a sibling screen that never measures against that column, and while it is open the map screen reports zero area (R-40, R-41).
- The placement of the agent surface is an OPEN DECISION for the user (OD-01), not a requirement. Three candidate placements are stated with their measured trade offs, one is recommended, and every criterion that needs a visible surface names the candidate it assumes and is marked blocked on that decision (AC-33, AC-34, AC-37).
- Block 2 and block 3 are not amended by this file. The Amendments table records gate notes and one code contract growth; no requirement text of blocks 1 to 7 is rewritten. Block 7, written in parallel, read the same constraint differently and amended both; M-16 records the conflict and leaves it to the orchestrator, and this file does not edit block 7.

## Problem

Blocks 1 to 6 make the map, its layers, its timeline, its polygons and its per polygon numbers. None of them answers a question the producer actually asks, which is a sentence, not a control: "which field has the lowest coverage", "how many evidence rows are modelled", "why is this screen showing what it shows". The app answers only through widgets a person must already know how to work.

Block 8 adds the three things that make the app answerable: a question goes to a database and comes back with the SQL that produced it (F-18), a spoken phrase maps onto the command registry ADR 0004 already defines and is applied only after the user confirms it (F-19), and one button explains the current screen from the state the screen already holds (F-20).

The trap this spec is written against is the fluent lie. A language model that writes both the query and the paragraph will produce confident prose over numbers it never read. So the model here is allowed to write exactly one thing, a SQL statement, and nothing else: no sentence reaches the screen from the model. The answer sentence is assembled by the app from the rows the database returned, every number carries the basis and the date of the rows behind it, and a question the four views cannot answer abstains instead of guessing. The second trap is the write. Prompt wording is not a safety mechanism, so writes are made impossible by construction, by a read only connection, a read only file mode and an SQLite authorizer, and each of the three was measured on this card (M-03 to M-07) rather than assumed.

The third trap is voice. The Web Speech API is not available everywhere, and it is not available in the browser this card measured (M-12). A voice feature that silently does nothing is worse than no voice feature, so availability is checked at runtime per language and every unavailable state falls back to typing the same phrase into the same matcher, and nothing is ever applied without a confirmation step that the code makes mandatory.

## Users and scope

- Users: the producer who asks a question instead of hunting a control, and the judge who checks that every number on screen can be traced to the query and the rows that produced it.
- In scope: F-18 (text to SQL over the evidence, read only views, limits, ten fixed questions), F-19 (voice over the command registry with confirmation and an audit trail), F-20 (an explanation of the screen from its real state), the read only evidence database and its build script, the five agent routes, the agent surface and its placement options, the explanation template and its guard.
- Out of scope: the `Command` form and every control of blocks 1 to 7 (not edited, not assumed); the right edge column; the map layers and the layer registry (block 4); the polygon source and the readout (block 5); the per polygon numbers and their route (block 6, read only when its payload is held); producer input and the weighted comparator (block 7, which has no frozen spec); any write to any database; any model prose; the durable storage of the audit trail (CO-B8-05); a live microphone measurement (CO-B8-01); Portuguese user interface strings, since block 3 R-37 keeps `pt-BR.ts` empty (R-22).

## Game UX rationale

Source: `Game UX.md` (thumb zone, clear centre, progressive disclosure, peripheral anchoring, one number at a time, two step actions), as blocks 3 and 6 cite it.

| Control | Wild Rift principle | One line |
|---|---|---|
| `Ask` tab and its one question field | Progressive disclosure | The whole map stays legible because the question lives on its own screen, one press away. |
| The `SQL` block under every answer | Scoreboard disclosure | The number is one tap from its derivation, the way a scoreboard opens into per player detail. |
| Basis and date printed beside every quoted number | Honest peripheral signal | The eye lands on `modelled` or on `no date recorded` before it lands on the number. |
| The ten fixed question chips | Quick pings | The phrases that are known to work are one tap, so a first time user cannot fail. |
| Rejected query card with the reason code | Honest miss feedback | A miss reads as a named miss with the SQL that caused it, not as silence. |
| Voice microphone as the primary control on its tab | Ability on the right thumb | Speaking is the largest, lowest target on the tab, and it is the only one that starts listening. |
| The confirmation card before any command applies | Aim then fire | The command is staged, named and shown with its arguments, then confirmed, the way a skill is aimed before it casts. |
| The `Explain this screen` paragraph | Combat log | The screen says why it looks like this in one paragraph, from the state it actually has. |
| `Close agent` in the header at every width | Clear centre | The way back to the map is the same place at 1440, at 780 and at 360. |

## Requirements

Types follow blocks 2, 3 and 6: ubiquitous, state-driven, event-driven, unwanted behaviour.

### The read only evidence database (F-18)

- R-01 (ubiquitous): The backend SHALL build the evidence database from `backend/fixtures/field-scenarios.json` with one script, `backend/evidence/build_evidence_db.py`, which writes `backend/evidence/evidence_data.sqlite` (the four base relations of Data contracts Table B) and `backend/evidence/evidence_shell.sqlite` (the empty read only main database the agent connection opens). The build SHALL derive every row from the fixture and from nothing else, SHALL be idempotent (a second run replaces both files with the same row content), and SHALL NOT read the network. The fixture it reads is pinned: 45 lines, 7,768 bytes, raw sha256 `2425a58f61030309e9184a6952bfbc18384a987db6f6c2067b9bf89beee549e6` (M-01).
- R-02 (ubiquitous): The agent's connection SHALL be read only by construction, in four independent layers, and no layer SHALL be the only one: (a) the main database is opened with the SQLite URI `file:...evidence_shell.sqlite?mode=ro`, (b) the data database is attached with the URI `file:...evidence_data.sqlite?mode=ro`, (c) `PRAGMA query_only = ON` is set on the connection, and (d) a `set_authorizer` callback in `backend/agent/executor.py` returns `SQLITE_OK` only for `SQLITE_SELECT`, `SQLITE_RECURSIVE`, `SQLITE_READ` of one of the four view names on the `temp` schema or of one of the four base relation names on the attached alias (the view expansion, which the engine authorizes as a second event, M-03), and `SQLITE_FUNCTION` of a name in R-05's allowlist, and `SQLITE_DENY` for every other action. The order is fixed and measured: the temp views of R-03 are created before `query_only` is set, because `query_only` refuses `CREATE TEMP VIEW` (M-04).
- R-03 (ubiquitous): The only relations an agent query may name SHALL be the four views `v_field`, `v_scenario`, `v_evidence` and `v_numbers` of Data contracts Table B. The views SHALL be created as `TEMP` views per connection over the attached data database under a per connection random schema alias, because a persistent SQLite view cannot reference an attached database (M-03). The base relations SHALL be named with a character that is not legal in a bare identifier (`raw~field`, `raw~scenario`, `raw~evidence_row`, `raw~numbers`), so that `SELECT * FROM field` fails with `no such table` (M-03), and neither the model prompt of Data contracts Table F, nor any response of R-19, nor any rendered error SHALL carry a base relation name.
- R-04 (ubiquitous): Exactly one statement SHALL be executed per question, and it SHALL begin with `SELECT` or `WITH`. The text gate of Data contracts Table C runs before execution and SHALL reject: a second statement, any `;` other than a single trailing one, a first token other than `SELECT` or `WITH`, a forbidden keyword, and any identifier outside the allowlist of Table C. `EXPLAIN` SHALL be rejected by the gate even though the authorizer permits it (M-07), because its output is a schema and bytecode disclosure.
- R-05 (ubiquitous): The only SQL functions a query may call SHALL be `count`, `sum`, `avg`, `min`, `max`, `round`, `abs`, `coalesce`, `ifnull`, `nullif`, `length`, `lower`, `upper`, `substr`, `trim` and `like`. The list SHALL be enforced twice: by the authorizer's `SQLITE_FUNCTION` branch and by the text gate's function allowlist. `like` is in the list because SQLite reports it as a function named `like` in the authorizer (M-08), so a natural question that uses `LIKE` fails without it. Every function outside the list SHALL be denied, including `load_extension`, `readfile`, `writefile`, `edit`, `fts3_tokenizer`, `zeroblob`, `randomblob` and `printf`, which were measured to be denied (M-07).
- R-06 (ubiquitous): A result SHALL carry at most 200 rows. The executor SHALL wrap a query that carries no `LIMIT` as `SELECT * FROM (<query>) LIMIT 201` (measured to be valid for a `WITH` query, M-10), SHALL fetch with `fetchmany(201)` and SHALL close the cursor without draining the scan, and SHALL set `truncated` true when the 201st row exists. The response SHALL carry `row_count` (the rows returned, at most 200) and `truncated`. A result SHALL also carry at most 24 columns and each text cell SHALL be at most 1,000 characters; a result that exceeds either SHALL be rejected with `result_too_wide`.
- R-07 (ubiquitous): A statement SHALL have a wall clock deadline of 2.0 seconds, enforced by a `set_progress_handler` callback installed every 1,000 virtual machine instructions that checks `time.monotonic()` against the deadline and aborts. An aborted statement SHALL be reported as a rejection with reason `statement_timeout`, SHALL return no partial rows, and SHALL NOT be retried by the app. The deadline is measured: an 8 way self join of `v_evidence` aborts at 2.0 seconds, while a 6 way join completes in 0.295 seconds (M-09).
- R-08 (ubiquitous): The database SHALL carry the `numbers` base relation and the `v_numbers` view of Data contracts Table B with the eleven columns block 6's provenance row carries, and the view SHALL return zero rows in the fixture build, because no block 6 payload exists yet. A question whose answer needs `v_numbers` SHALL abstain with reason `no_numbers_snapshot`, SHALL NOT return an empty result as an answer, and SHALL NOT fall back to a fixture value. The snapshot that fills it is CO-B8-02.
- R-09 (ubiquitous): The evidence database SHALL contain no audit table, no cache table and no log table, and no agent action SHALL write a byte to either database file. The audit trail of F-19 lives in process memory (R-29), and a query's only side effect SHALL be the in memory audit row of R-29. A criterion SHALL compare the two files' raw sha256 before and after a run of questions and find them equal (AC-09).

### The text to SQL agent (F-18)

- R-10 (ubiquitous): The agent SHALL call one OpenAI compatible chat completions endpoint, configured by three environment variables of Data contracts Table A, and SHALL accept exactly one shape of reply: a JSON object whose only key is `sql` and whose value is a string. The request SHALL carry the system prompt of Data contracts Table F verbatim, `temperature` 0, a maximum of 400 output tokens and the user's question as the only user message. The reply SHALL NOT be rendered as prose anywhere: no field of the response SHALL contain text produced by the model other than `sql`, and `answer` SHALL be built by R-17.
- R-11 (ubiquitous): The model credential SHALL live only in the environment variable `AGENT_API_KEY`. The app SHALL read exactly four agent variables, `AGENT_BASE_URL`, `AGENT_MODEL`, `AGENT_API_KEY` and the non credential path `AGENT_DB_DIR` of Data contracts Table A, SHALL contain no other credential path, and SHALL NOT read the reviewing session's own `EXPLABS_API_KEY`, which belongs to the operator's tooling and not to the app. No key, token or `.env` file SHALL be committed: `.env` SHALL be listed in `.gitignore`, and a test SHALL grep the working tree for the literal value of `AGENT_API_KEY` when it is set and fail if the value appears in any tracked file. The limits of that test are stated rather than hidden: with no key in the environment it can only prove that no `.env` is tracked and that the four names are the only reads (AC-11).
- R-12 (state-driven): While no `AGENT_API_KEY` is set, the agent SHALL answer the ten fixed questions of Data contracts Table E by normalised exact match on the question text, with the recorded SQL of that table, and SHALL answer anything else with state `unavailable` and reason `model_unavailable`. In that state the app SHALL show the ten questions as chips, SHALL make zero outbound requests to the model host, and SHALL print the sentence that free form questions need a credential. A fixed question answered in this mode SHALL carry `model: null` and `fixed_question_id` set.
- R-13 (ubiquitous): Every model reply SHALL pass the four gates of R-04 to R-07 in a fixed order (parse, statement, identifier, relation, function, then execute), and a failure SHALL cost at most one retry: the second request SHALL carry the first reason code and no other context, and a second failure SHALL end the question as `rejected` with the second reason. The app SHALL NOT attempt a third reply, SHALL NOT repair the SQL itself, and SHALL NOT fall back to a fixed question whose text does not match the question exactly.
- R-14 (ubiquitous): A rejected question SHALL print three things and nothing else: the reason code of Data contracts Table C, one sentence from the string catalog explaining that code in plain words, and the rejected SQL in a block labelled `Rejected SQL`. It SHALL NOT print the engine's own message, a file path, a schema name, a table name of the data file or a stack trace, because the engine's message names the relation it refused (M-03, M-07) and that name is one of the facts R-03 keeps out of the response.
- R-15 (state-driven): While a question cannot be answered from the four views, the response SHALL be state `abstained`, `sql` `null`, a reason from `not_answerable_from_views` or `no_numbers_snapshot`, and no rows. An abstention SHALL print the sentence that the data cannot answer the question and SHALL offer the ten fixed questions. The app SHALL NOT print an empty result set as if it were an answer, SHALL NOT answer `0` for a missing relation, and SHALL NOT send the question to the model a second time with a hint to try harder.
- R-16 (ubiquitous): Every answer SHALL print the SQL that produced it, the row count, and one provenance line per number it quotes. A provenance line SHALL carry the column or aggregate, its `basis`, its `as_of`, its `as_of_all` (every distinct date behind the number, sorted, de-duplicated) and its `source`. A number whose rows carry no date SHALL print `no date recorded` and the source file, and SHALL NOT print a date. A count over rows with two dates SHALL print both dates, which is the `Q-08` case of Table E: six `entered` rows carry 2025-06-30 and 2025-11-10 (M-02).
- R-17 (ubiquitous): The `answer` text SHALL be assembled by the app from the returned rows and from the catalog strings, never from the model: one sentence carrying the row count and, for a single row and single column, the value, and for a count its integer. A test SHALL inject a model reply whose SQL is valid and whose surrounding text is a false sentence, and SHALL find no word of that surrounding text in `answer` (AC-16).
- R-18 (ubiquitous): The ten fixed questions of Data contracts Table E SHALL be the acceptance set of F-18. Each SHALL carry its English text, its Portuguese text, its expected SQL shape and its expected result, and every expected result in that table was produced by running the query against the fixture build on this card (M-02). A change to the fixture that changes one of the ten answers SHALL change Table E in the same commit.
- R-19 (ubiquitous): The backend SHALL answer `POST /agent/query` with the request and response of Data contracts Table D, in the five states `ok`, `fixed`, `abstained`, `rejected` and `unavailable`. The route SHALL answer 200 for the first four states, because a rejection is a legitimate outcome with a printable reason, and 503 only for `unavailable` with `model_unavailable`. A question longer than 500 characters SHALL be rejected with `question_too_long` before any model call.

### Voice over the command registry (F-19)

- R-20 (ubiquitous): Speech input SHALL use the Web Speech API `SpeechRecognition`, obtained as `window.SpeechRecognition ?? window.webkitSpeechRecognition`, in `src/lib/voice.ts`. One recognition SHALL be configured with `continuous` false, `interimResults` false, `maxAlternatives` 3 and `lang` set from R-22, SHALL start only from an explicit press of the one microphone button of the Voice tab, and SHALL stop itself after one result. No audio element, no `MediaRecorder` and no recording buffer SHALL exist in the app.
- R-21 (state-driven): Availability SHALL be checked at runtime and every outcome SHALL have a stated treatment, because the API is not universally available (M-12): (a) no constructor means `mic_unsupported`, (b) a constructor and `SpeechRecognition.available` present and false for the selected language means `mic_language_unavailable`, (c) an `error` event with `not-allowed` means `mic_permission_denied`, with `service-not-allowed` or `network` means `mic_network_unavailable`, and with `no-speech` means `mic_no_speech`. In all five cases the microphone button SHALL be disabled with the reason printed, and the typed phrase field of the same tab SHALL stay enabled and feed the same matcher of R-23, so the command mapping, the confirmation step and the audit trail are identical with and without speech. Nothing SHALL be applied from the typed path without confirmation either.
- R-22 (ubiquitous): Voice SHALL support exactly two recognition languages, English with `lang` `en-US` and Portuguese with `lang` `pt-BR`, selected by a two option control on the Voice tab whose default follows `navigator.language` and falls back to English when that value starts with neither `en` nor `pt`. The user interface SHALL stay English in both cases, because block 3 R-37 keeps `src/strings/pt-BR.ts` empty; the language control SHALL say that it changes what the microphone listens for and not the language of the screen.
- R-23 (ubiquitous): The matcher in `src/lib/voice.ts` SHALL be a pure function from a transcript and a language to a draft of Data contracts Table H, and SHALL be deterministic: normalise the transcript by lowercasing, removing diacritics, collapsing whitespace and dropping punctuation, then match against the phrase table of Data contracts Table G, preferring an exact phrase, then the longest phrase contained in the transcript, then no match. Two phrases of different commands matching with the same length SHALL produce `ambiguous` and SHALL stage nothing. An unmatched transcript SHALL produce `no_match` with the transcript printed verbatim. The matcher SHALL evaluate both language phrase lists and rank the selected language first, so a Portuguese phrase typed in English mode still matches.
- R-24 (ubiquitous): An utterance SHALL map onto the four existing commands and the one new command, and onto nothing else: `select_field`, `set_composition`, `open_panel`, `apply_filter` and `open_view` with `view` `agent`. The mapping SHALL be the phrase table of Data contracts Table G, and a command name, a JSON body or a raw argument string spoken aloud SHALL NOT be accepted as a substitute for a phrase.
- R-25 (ubiquitous): An argument SHALL be resolved from the utterance and from live state, never guessed: a field by its ordinal word or digit in either language (`field one`, `field 1`, `campo um`, `campo 1`) against the field list in the order `GET /fields` returns it, and an enum value by the phrase table entry that carries it. A field ordinal beyond the loaded list SHALL produce `no_match` with the reason printed, and SHALL NOT clamp to the last field.
- R-26 (ubiquitous): A recognised phrase SHALL stage a draft and SHALL NOT apply anything. The store's `selectedFieldId`, `composition`, `openPanelName`, `activeFilter` and the agent surface's open state SHALL be unchanged after a recognition, and the recognition handler SHALL NOT call `runCommand`, `POST /commands/{name}` or `POST /agent/apply` (AC-23).
- R-27 (ubiquitous): A staged draft SHALL be applied only by a confirmation, in one of two forms: the `Apply` button of the draft card, or a second recognition whose phrase is one of the confirm phrases of Table G while a draft is pending. `Discard` and the cancel phrases SHALL drop the draft. A draft SHALL expire 120 seconds after staging, SHALL be consumed by one application, and a second application of the same draft SHALL be refused with 409 and SHALL change nothing.
- R-28 (ubiquitous): The apply path SHALL be one route, `POST /agent/apply`, which consumes a draft id issued by `POST /agent/draft`, executes the command through the same code path as `POST /commands/{name}`, appends the audit row of R-29 and returns the command's effect and the backend state. The voice path SHALL NOT call `POST /commands/{name}` at all, and a criterion SHALL assert zero such calls in a full voice flow (AC-24).
- R-29 (ubiquitous): The backend SHALL keep an audit trail with one row per applied command, in process memory, capped at 100 rows with the oldest dropped, exposed by `GET /agent/audit` newest first with `persistent: false`. A row SHALL carry the nine fields of Data contracts Table H. The agent surface SHALL print the last five rows in a `Command log` card with time, source, command and arguments, and SHALL print the empty text when the trail is empty. The trail SHALL NOT be written to local storage (block 4 R-51's rule), to a cookie, or to either database file. A restart empties it, and the response says so (CO-B8-05).
- R-30 (ubiquitous): The app SHALL store no audio and SHALL upload no audio itself: the transcript string is the only artefact it keeps, in the draft and in the audit row. The Voice tab SHALL carry the disclosure that on Chrome the recognition engine is server based and the audio is sent to that service for recognition, that it therefore does not work offline (M-12), and that the app itself sends only text to its own backend.
- R-31 (state-driven): While the browser is offline, or the recognition service fails, the microphone button SHALL be disabled with the reason of R-21 and the typed phrase field SHALL stay usable, because Chrome's engine is server based and cannot work offline (M-12). No retry loop and no automatic restart of the recognition SHALL exist, and the reason SHALL stay printed until the next press.

### The explanation of the screen (F-20)

- R-32 (ubiquitous): `explain(state)` in `src/lib/explain.ts` SHALL be a pure function from the state fields of R-33 to one paragraph, and SHALL be built only from the exact template of Data contracts Table I, whose sentence forms are fixed and whose every value comes from the state. The function SHALL return the paragraph and the list of facts it used, and the surface SHALL print the paragraph and that list under it.
- R-33 (ubiquitous): The explanation SHALL read exactly these state fields and no others: `selectedFieldId`; the matching field row of `GET /fields` (`name`, `location`); `chosenDate` and `chosenDateOf()`, which carries the axis default when the field is null; the `catalog` rows of the block 4 response (`label`, `basis`, `resolution`, `status`, `effective_date`, `age_days`); `on` and `order`; `composition`; `activeFilter`; `tileDecisions` per layer (`status`, `date`, `offline`, `source`); and, when a block 6 payload is held, `numbersPayload.gaps`. It SHALL NOT read the network, a fixture, a scenario response, `openPanelName`, `localStorage` or the clock, and it SHALL NOT depend on any panel of blocks 2 to 7 being open, because the panels of the right edge column are out of this block's reach (R-41).
- R-34 (ubiquitous): No sentence of the explanation SHALL quote a date, a basis label or a number that is not present in the state of R-33. Every date the paragraph prints SHALL equal `chosenDate`, an `effective_date`, an `age_days` derived date, a `tileDecisions` date or a `numbersPayload` date of that same state. Every basis token SHALL equal the `basis` of a catalog row in that state. A criterion SHALL extract every `YYYY-MM-DD` and every basis token from the rendered paragraph and fail if one is absent from the state projection, and SHALL prove it can fail by appending a foreign date to the template in a test fixture (AC-30).
- R-35 (ubiquitous): The gaps sentence SHALL be built only from measured gaps of the state: a layer whose `status` is `unavailable`, `none_in_lookback` or `stale`, a `tileDecisions` entry whose `draw` is false, and, when a block 6 payload is held, each row of its `gaps`. With no such entry the paragraph SHALL print the empty sentence of Table I and no gap clause. The paragraph SHALL NOT print a gap for a layer that is off, and SHALL NOT invent a cause for a layer that has none.
- R-36 (state-driven): With no field selected the paragraph SHALL print the no field sentence and the field independent clauses, and SHALL NOT print a field name, a coverage, a scenario or a number. With no layer on the paragraph SHALL print the no layer sentence. With no block 6 payload the paragraph SHALL NOT print a numbers clause, and SHALL NOT say that the numbers are zero or that the field has none.
- R-37 (unwanted behaviour): The explanation SHALL NOT pass through a model in this block: the paragraph SHALL be the template of Table I and nothing else, and the `Explain` tab SHALL issue no request to any model host. A model rewritten explanation is OD-03, and if the user takes it, it needs its own route, its own amendment row and its own criterion that applies the invariant of R-34 to the rewritten text, because a rewrite reopens the one channel this requirement closes.

### The agent surface and the frozen screen

- R-38 (ubiquitous): The three features SHALL render on exactly one new surface, a `region` named `Agent`, mounted from `src/components/AgentView.tsx`, with three tabs `Ask`, `Voice` and `Explain`, a `Close agent` button in its header, and the `Command log` card of R-29. The tab state SHALL be URL state (`?agent=1&tab=ask|voice|explain`), SHALL survive a reload and SHALL NOT be written to local storage.
- R-39 (ubiquitous): The surface SHALL be reachable in two ways and no third: the URL parameter `?agent=1` and the command `open_view` of R-24. This block SHALL NOT add a button to a region frozen by blocks 1 to 7, and SHALL NOT require the `Command` form to be open, because that form is planned later (R-41, R-46).
- R-40 (ubiquitous): While the surface is open the map screen SHALL be `display: none`, every box of blocks 1 to 5 plus the block 6 numbers view SHALL report a zero area rectangle, and the surface SHALL be `position: fixed; inset: 0` with internal scroll and no page scroll. On close the map SHALL call `map.resize()`, the camera centre, zoom, bearing and pitch SHALL equal the values they had before opening, and the close SHALL remove the `agent` and `tab` parameters and no other parameter (`date`, `region`, `polygon`, `basemap` and `numbers` keep their bytes). This is block 6 R-02's pattern, reused deliberately: one screen at a time is what makes the zero intersection trivial rather than fragile.
- R-41 (ubiquitous): Block 8 SHALL NOT import, mount, position against, read or write `CommandToggle.tsx`, `EvidencePanel.tsx`, `SupportingDataToggle.tsx`, `AgentBar` or the right edge column, and SHALL NOT depend on the block 3 R-23 or R-40 geometry. `AgentView.tsx` SHALL import none of those modules, and a static check SHALL assert the absence (AC-35).
- R-42 (ubiquitous): The surface SHALL be a landmark `region` named `Agent` with a level two heading, every control inside it SHALL be a native `button`, `input`, `select` or `textarea` reachable with Tab and answering Enter and Space as its native element does, focus SHALL move to the first control of the mounted tab on open and SHALL return to the element that opened it on close, or to the page's main landmark when the surface was opened by the URL and no such element exists, no timer SHALL change a rendered answer, and under `prefers-reduced-motion: reduce` every computed `transition-duration` inside the surface SHALL be `0s`. The microphone button SHALL carry the accessible name from the catalog and SHALL NOT be the only way to reach its function, because the typed field of R-21 is the second way.
- R-43 (ubiquitous): Every new visible string and every new accessible name of this block SHALL come from `src/strings/en.ts` through `t()` in the same change, `src/strings/pt-BR.ts` SHALL stay empty as block 3 R-37 leaves it, the literal scan SHALL stay green, and no unit symbol, class name or source string SHALL enter the catalog, because those are data values read from the rows (block 6 R-11's rule, kept here).
- R-44 (ubiquitous): The block SHALL add no runtime dependency. The backend SHALL use the standard library `sqlite3`, whose SQLite library reports 3.53.1 in the backend environment measured on this card (M-09), plus the already installed `fastapi` and `httpx`; the frontend SHALL add no package, because the Web Speech API is a browser global. A new dependency is an open decision for the user, not an implementer's choice.
- R-45 (ubiquitous): The surface SHALL follow the box geometry of Layout contract Table J at 1440x900, 780x900 and 360x640, with a 2 px tolerance, SHALL NOT grow the page at any width, and SHALL NOT let the result table or the SQL block grow the surface: both scroll inside themselves.
- R-46 (ubiquitous): The `Command` form SHALL survive this block exactly as block 3 leaves it: the `form` accessible name `Agent command`, its two text boxes, its `Run command` button, its four effect names and its behaviour. Block 8 SHALL NOT edit, wrap or re-render `CommandToggle.tsx` or its `AgentBar` export, and SHALL NOT add a voice control inside it. The form keeps working with the four commands when the fifth exists, because `open_view` is additive.
- R-47 (ubiquitous): The region of a field SHALL be resolved by one mapping, stated once and nowhere else: `csb:` is the United States, `trazo:` is Brazil, a fixture id resolves in the region its own fixture entry carries, which for the three `mt-santa-carmem` entries is `br` under block 5 R-24 even though the fixture file on this card carries no `region` key yet, and every other id form, including an unprefixed reference and block 7's `local:` form, defaults to the United States (block 6 R-51). The default is the United States and SHALL NOT be inferred from a centroid, a name, a locale, the browser or the reviewing session, and no other requirement of this block SHALL carry a second, different default. The `v_field` view SHALL carry a `region` column whose value is the output of that mapping, so the rule is queryable and an answer that names a field can print its region beside the field's name.

## Data contracts

### Table A: the agent environment and the five routes

| Name | Kind | Value | Read by |
|---|---|---|---|
| `AGENT_BASE_URL` | environment | OpenAI compatible base URL, for example `https://host/v1`; no default in code | `backend/agent/model.py` |
| `AGENT_MODEL` | environment | the model identifier the endpoint expects; no default in code, so an unset model is `model_unavailable` | `backend/agent/model.py` |
| `AGENT_API_KEY` | environment | the bearer token; read from the environment only, never from a file in the repository (R-11) | `backend/agent/model.py` |
| `AGENT_DB_DIR` | environment | directory holding `evidence_data.sqlite` and `evidence_shell.sqlite`; default `backend/evidence` | `backend/agent/executor.py` |

| Method and path | Request | Response | Rule |
|---|---|---|---|
| `POST /agent/query` | `{"question": string, "locale": "en" or "pt"}` | the payload of Table D | R-19 |
| `POST /agent/draft` | `{"source": "voice" or "typed", "transcript": string, "locale": "en" or "pt", "command": string, "arguments": object}` | `{"draft_id": string, "expires_at": ISO 8601 UTC, "command": string, "arguments": object, "text": string}` and no state change | R-26, R-27 |
| `DELETE /agent/draft/{draft_id}` | none | `{"discarded": true}` or 404 | R-27 |
| `POST /agent/apply` | `{"draft_id": string}` | `{"name", "effect", "arguments", "state", "audit_id"}` | R-27, R-28 |
| `GET /agent/audit` | none | `{"persistent": false, "rows": [row of Table H]}` newest first, at most 100 | R-29 |

Route inventory, corrected against the tree this card measured: `backend/main.py` answers nine routes today (M-11), block 6 adds one and makes ten once it ships, and block 8 adds five and makes fifteen. No existing route changes shape.

### Table B: the evidence database

The agent's read set is exactly four view names. The base relations exist only under a name that is not a bare identifier (R-03). Column types preserve the fixture exactly, which keeps `value` as `TEXT` because it carries `0.19 m³/m³` and `Not entered`.

| View | Columns | Rows in the fixture build | Reads |
|---|---|---|---|
| `v_field` | `id`, `name`, `location`, `region`, `coverage`, `center_lon`, `center_lat` | 3 | `raw~field` |
| `v_scenario` | `field_id`, `scenario_id`, `name`, `is_current`, `crops` | 9 | `raw~scenario` |
| `v_evidence` | `field_id`, `scenario_id`, `layer`, `value`, `basis`, `as_of`, `source` | 18 | `raw~evidence_row` |
| `v_numbers` | `polygon_id`, `metric_id`, `label`, `value`, `unit`, `basis`, `as_of`, `source`, `resolution`, `route`, `fetched_at` | 0 | `raw~numbers` |

Base relations, never named by a query: `raw~field` (`id` primary key, `name`, `location`, `region`, `coverage`, `center_lon`, `center_lat`), `raw~scenario` (`field_id`, `scenario_id`, `name`, `is_current`, `crops`, primary key `(field_id, scenario_id)`), `raw~evidence_row` (`id` primary key, `field_id`, `scenario_id`, `layer`, `value`, `basis`, `as_of`, `source`), `raw~numbers` (the eleven columns of `v_numbers`).

The `region` column is the output of R-47's mapping and not a key of the fixture build: the three `mt-santa-carmem` entries are block 5 R-24's Brazil fixture fields, so they carry `Brazil` (block 6 R-51's `br`), and their own `location` (`Santa Carmem, Mato Grosso`) agrees with it. An entry that carries its own `region` key overrides that constant, which is the form block 6 R-51 expects once CO-B5-01 writes the three CSB fixture fields. The probe of this card built the four views before R-47 existed and did not carry the column; the ten answers of Table E are unaffected because no question selects it, and AC-17 re-measures them with the column present.

Row identity for the provenance rule of R-16: `v_field.coverage` carries no date in the fixture, so an answer that quotes it prints `no date recorded` and the fixture path `backend/fixtures/field-scenarios.json` (M-02). `v_evidence` rows carry their own `basis`, `as_of` and `source`, and those are the values an answer quotes for a count or a value over evidence rows.

### Table C: the gates, their order and their reason codes

The gate runs in this order and stops at the first failure. The authorizer of R-02 is the fourth layer and runs during execution, not before it.

| Order | Gate | Accepts | Rejects with |
|---|---|---|---|
| 1 | length | a question of at most 500 characters | `question_too_long` |
| 2 | model reply | exactly one JSON object with the single key `sql`, a string | `model_invalid_response` |
| 3 | statement | one statement; first token `SELECT` or `WITH`; no `;` except one trailing; no `--` and no `/*` | `not_a_select`, `multiple_statements`, `unparseable` |
| 4 | forbidden keywords | none of `insert`, `update`, `delete`, `replace`, `drop`, `alter`, `create`, `attach`, `detach`, `pragma`, `vacuum`, `reindex`, `analyze`, `begin`, `commit`, `rollback`, `savepoint`, `release`, `trigger`, `explain`, and no `~` | `not_a_select` |
| 5 | identifiers | a view name of Table B, a column of Table B, a function of R-05, a type name after `AS` inside `CAST`, a number, a string literal, an operator, or one of the keywords `select`, `from`, `where`, `group`, `by`, `order`, `limit`, `offset`, `asc`, `desc`, `and`, `or`, `not`, `in`, `between`, `is`, `null`, `like`, `as`, `with`, `case`, `when`, `then`, `else`, `end`, `distinct`, `join`, `inner`, `left`, `on`, `having`, `cast`, `recursive` | `relation_not_allowed`, `function_not_allowed`, `unparseable` |
| 6 | execution | at most 200 rows, at most 24 columns, at most 1,000 characters per cell, inside 2.0 seconds | `result_too_wide`, `statement_timeout` |
| 7 | answer | at least one row, or a legitimate abstention | `not_answerable_from_views`, `no_numbers_snapshot` |

Rule 5 is the relation gate: the base relation names of Table B contain `~`, which rule 4 rejects outright, so no query can name one even in quotes, and the unquoted form fails at the engine with `no such table: field` (M-03). Two failures of the gate cost the one retry of R-13 and then end the question.

### Table D: the query payload

| Field | Type | Present in | Meaning |
|---|---|---|---|
| `state` | string | always | `ok`, `fixed`, `abstained`, `rejected` or `unavailable` |
| `question` | string | always | the question as received, echoed unchanged |
| `sql` | string or null | always | the statement that ran, or the statement that was rejected, or null for an abstention |
| `columns` | array of string | `ok`, `fixed` | the result column names, at most 24 |
| `rows` | array of array | `ok`, `fixed` | at most 200 rows, each at most 24 cells |
| `row_count` | integer | `ok`, `fixed` | the rows returned |
| `truncated` | boolean | `ok`, `fixed` | true when a 201st row existed |
| `answer` | string | `ok`, `fixed` | the sentence built by R-17 |
| `provenance` | array of object | `ok`, `fixed` | one entry per quoted number with `column`, `basis`, `as_of`, `as_of_all`, `source` |
| `reason` | string or null | always | a code of Table C, or `no_numbers_snapshot` |
| `reason_key` | string or null | always | the catalog key of the sentence that explains `reason` |
| `model` | string or null | always | the model identifier used, null in `fixed` and in every state that made no call |
| `fixed_question_id` | string or null | `fixed` | `Q-01` to `Q-10` |
| `duration_ms` | integer | always | the wall clock of the statement, 0 when none ran |

### Table E: the ten fixed questions

Every expected result was produced on this card by running the statement against the fixture build (M-02). `Q-03` is `239 / 3 = 79.666...` rounded half up to one decimal, which is 79.7.

| Id | Question (English) | Question (Portuguese) | Expected SQL shape | Expected result | Provenance printed |
|---|---|---|---|---|---|
| `Q-01` | How many fields are in the fixture? | Quantos campos existem na fixture? | `SELECT count(*) FROM v_field` | 1 row, 1 column: `3` | count over `v_field`: basis `entered`, `no date recorded`, fixture path |
| `Q-02` | Which field has the lowest coverage? | Qual campo tem a menor cobertura? | `SELECT id, coverage FROM v_field ORDER BY coverage ASC, id ASC LIMIT 1` | 1 row: `mt-santa-carmem-03`, `62` | `v_field.coverage`: `entered`, `no date recorded` |
| `Q-03` | What is the mean coverage? | Qual e a cobertura media? | `SELECT round(avg(coverage), 1) FROM v_field` | 1 row: `79.7` | `v_field.coverage`: `entered`, `no date recorded` |
| `Q-04` | How many scenarios does each field carry? | Quantos cenarios cada campo tem? | `SELECT field_id, count(*) FROM v_scenario GROUP BY field_id ORDER BY field_id` | 3 rows: each field id, `3` | count over `v_scenario`: `entered`, `no date recorded` |
| `Q-05` | Which scenario is current in each field? | Qual cenario e o atual em cada campo? | `SELECT field_id, scenario_id FROM v_scenario WHERE is_current = 1 ORDER BY field_id` | 3 rows: each field id, `current-sequence` | `v_scenario.is_current`: `entered`, `no date recorded` |
| `Q-06` | How many evidence rows are modelled? | Quantas linhas de evidencia sao modeladas? | `SELECT count(*) FROM v_evidence WHERE basis = 'modelled'` | 1 row: `6` | count over `v_evidence` where basis `modelled`: `2025-11-10` |
| `Q-07` | Which field has the highest rotation suitability for the cover-crop option? | Qual campo tem a maior aptidao de rotacao para a opcao com cobertura? | `SELECT field_id, max(CAST(value AS REAL)) FROM v_evidence WHERE layer = 'Rotation suitability' AND scenario_id = 'soy-corn-cover' GROUP BY field_id ORDER BY max(CAST(value AS REAL)) DESC LIMIT 1` | 1 row: `mt-santa-carmem-02`, `0.79` | `v_evidence.value` for `Rotation suitability`: `modelled`, `2025-11-10` |
| `Q-08` | How many evidence rows are there per basis? | Quantas linhas de evidencia existem por base? | `SELECT basis, count(*) FROM v_evidence GROUP BY basis ORDER BY basis` | 3 rows: `entered` `6`, `modelled` `6`, `retrieved` `6` | the `entered` count prints `2025-06-30` and `2025-11-10` |
| `Q-09` | What is the SMAP soil moisture of the current sequence at Field 03? | Qual e a umidade SMAP da sequencia atual no Campo 03? | `SELECT value FROM v_evidence WHERE field_id = 'mt-santa-carmem-03' AND scenario_id = 'current-sequence' AND layer = 'SMAP soil moisture'` | 1 row: `0.19 m³/m³` | that row's `retrieved`, `2025-11-10`, `https://gibs.earthdata.nasa.gov/` |
| `Q-10` | Which fields have coverage below 80 percent? | Quais campos tem cobertura abaixo de 80 por cento? | `SELECT id FROM v_field WHERE coverage < 80 ORDER BY id` | 1 row: `mt-santa-carmem-03` | `v_field.coverage`: `entered`, `no date recorded` |

A question that needs `v_numbers` has no entry here, because the view is empty until block 6 lands: for example, the rain total of field 01 in the window ending 2026-11-11 abstains with `no_numbers_snapshot`, and the value 171.9 mm is block 6's oracle O-01, not a value this block may print from the fixture.

### Table F: the model contract

| Item | Value |
|---|---|
| Endpoint | `{AGENT_BASE_URL}/chat/completions`, `Authorization: Bearer {AGENT_API_KEY}`, `Content-Type: application/json` |
| Request body | `{"model": AGENT_MODEL, "temperature": 0, "max_tokens": 400, "messages": [{"role": "system", "content": <the prompt below>}, {"role": "user", "content": <the question>}]}` |
| Accepted reply | one JSON object, one key, `{"sql": "<one SELECT statement>"}`; fenced code blocks, prose before or after, and any second key are rejected as `model_invalid_response` |
| Retry | one retry only, whose user message is the question plus `previous attempt rejected: <reason code>` (R-13) |
| Timeout | 15.0 seconds per call, then `model_unavailable` |

No model is named by this block, and that is a decision rather than an omission: naming one would encode a provider, a price and a data handling term the team has not approved, and this card holds no such credential. The model that serves the agent is the identifier in `AGENT_MODEL`, supplied together with `AGENT_API_KEY` by whoever runs the app, and the default this block ships is no model at all: the app answers the ten fixed questions and says why for every other question (R-12). The reviewing session's own model and provider are operator tooling and are not the app's model, which is why R-11 forbids reading that key.

The system prompt, verbatim, held in `backend/agent/prompt.py` and pinned by a test that hashes the string:

```text
You translate a question into one SQLite SELECT statement. Reply with JSON only, exactly {"sql": "..."} and nothing else.

Available views and columns:
v_field(id, name, location, coverage, center_lon, center_lat)
v_scenario(field_id, scenario_id, name, is_current, crops)
v_evidence(field_id, scenario_id, layer, value, basis, as_of, source)
v_numbers(polygon_id, metric_id, label, value, unit, basis, as_of, source, resolution, route, fetched_at)

Rules:
1. One statement. It must start with SELECT or WITH.
2. Use only the views above. No other relation exists.
3. Do not write, alter, attach, pragma, explain or call any function except count, sum, avg, min, max, round, abs, coalesce, ifnull, nullif, length, lower, upper, substr, trim, like.
4. No aliases. No comments. No semicolon.
5. value in v_evidence is text. Cast it with CAST(value AS REAL) to compare numbers.
6. Add LIMIT 200 when the question asks for a list and you cannot bound it.
7. If the question cannot be answered from these views, reply {"sql": null} and add no other key.
8. Quote string literals with single quotes only.
```

Rule 7 makes `{"sql": null}` the model's only way to abstain, and R-15 turns it into state `abstained` with `not_answerable_from_views`.

### Table G: the voice phrase table

Every phrase is normalised by R-23 before matching. The first five rows are the five registry commands of R-24. The last two rows are confirmation intents, not registry commands: they are handled by `confirmIntent` and are live only while a draft is pending.

| Command | Arguments | English phrases | Portuguese phrases |
|---|---|---|---|
| `select_field` | `field_id` from an ordinal | `select field one`, `show field one`, `field one`, `select field 1` | `selecione o campo um`, `mostrar o campo um`, `campo um`, `campo 1` |
| `set_composition` | `preset` | `satellite`, `satellite view`, `show the satellite`, `map`, `show the map`, `satellite with labels`, `labels` | `satelite`, `visao de satelite`, `mapa`, `mostrar o mapa`, `satelite com rotulos`, `rotulos` |
| `open_panel` | `panel` | `open scenarios`, `show the scenarios`, `open evidence`, `show the evidence` | `abrir cenarios`, `mostrar os cenarios`, `abrir evidencias`, `mostrar as evidencias` |
| `apply_filter` | `filter` | `show all`, `all scenarios`, `ranked only`, `show the ranked`, `show the abstained` | `mostrar todos`, `todos os cenarios`, `apenas classificados`, `mostrar os classificados`, `mostrar os abstidos` |
| `open_view` | `view` `agent` | `open the agent`, `ask the data`, `explain this screen` | `abrir o agente`, `perguntar aos dados`, `explicar a tela` |
| confirm | none | `confirm`, `apply`, `yes`, `go ahead` | `confirmar`, `aplicar`, `sim`, `pode aplicar` |
| cancel | none | `cancel`, `discard`, `no`, `stop` | `cancelar`, `descartar`, `nao`, `parar` |

The ordinal words are `one`, `two`, `three` and `um`, `dois`, `tres`, plus the digits `1`, `2`, `3`, resolved against the field list in the order `GET /fields` returns it (R-25).

### Table H: the draft and the audit row

| Row | Field | Type | Meaning |
|---|---|---|---|
| draft | `draft_id` | string | 32 hex characters from `os.urandom(16)`, unique per process |
| draft | `expires_at` | string | ISO 8601 UTC, 120 seconds after staging |
| draft | `source` | string | `voice` or `typed` |
| draft | `transcript` | string | the recognised or typed phrase, verbatim |
| draft | `locale` | string | `en` or `pt` |
| draft | `command` | string | one of the five command names |
| draft | `arguments` | object | the resolved arguments, valid against the command's `input_schema` |
| draft | `text` | string | the confirmation sentence from the catalog, naming the command and its arguments |
| audit | `id` | integer | monotonic per process |
| audit | `at` | string | ISO 8601 UTC of the application |
| audit | `source` | string | `voice` or `typed` |
| audit | `transcript` | string | the phrase that produced the draft |
| audit | `locale` | string | `en` or `pt` |
| audit | `command` | string | the applied command name |
| audit | `arguments` | object | the arguments applied |
| audit | `confirmation` | string | `button` or `voice`, the form of R-27 that applied it |
| audit | `outcome` | string | `applied`, because a rejected application writes no row |

### Table I: the explanation template

The exact template, with the six sentences in this order and this punctuation. `{...}` is a slot; nothing else in the paragraph is variable.

```text
{field_sentence} {date_sentence} {layer_sentence} {filter_sentence} {composition_sentence} {gaps_sentence}
```

| Slot | Exact forms |
|---|---|
| `field_sentence` | `Field {name} ({id}) is selected.` or `No field is selected.` |
| `date_sentence` | `The chosen date is {date}.` or `The chosen date is the axis default {date}.` |
| `layer_sentence` | one clause per layer that is on, in stack order, joined by `; ` and closed by `.`: `{label} ({basis label}) {status phrase}, served {date}.` The status phrases are `served on the chosen date`, `served {n} days earlier`, `no tile in the lookback`, `stale since {last observation}`, `unavailable`; the date phrase is `{effective_date}` or `no served date`. With no layer on the sentence is `No layer is active.` |
| `filter_sentence` | `No scenario filter is applied.` or `The scenario filter is {filter}.` |
| `composition_sentence` | `The map composition is {composition}.` |
| `gaps_sentence` | `No gap is recorded.` or `Recorded gaps: {n}. ` followed by one clause per gap joined by `; ` and closed by `.`: `{label} {status} ({cause})` of the state sources of R-35. When a block 6 payload is held and its `gaps` is not empty, ` Numbers gaps: {n}.` is appended. |

The basis label inside `layer_sentence` is the label of that row's own `basis` under block 1 R-14's two presentation classes, read from the catalog.

### Table J: the layout of the agent surface

Build targets for candidate A of OD-01, 2 px tolerance. The surface is a full viewport view, so its outer box is the viewport at every width and the boxes below are what a verifier measures inside it. Candidate B and candidate C have no box table, because they are not implemented until the user decides.

| Box | 1440x900 | 780x900 | 360x640 |
|---|---|---|---|
| `Agent` region | fixed, inset 0, opaque background, internal scroll, page scroll 0 | same | same |
| Header band | height 56, padding 0 22, `Close agent` 44 by 44 at the left, the `Agent` title beside it, the tab strip right aligned | same, padding 0 22 | height 56, padding 0 8, `Close agent` 44 by 44, the title truncated with an ellipsis, no right hand content |
| Tab row `Ask` `Voice` `Explain` | height 44, three tabs of at least 96 by 44 | height 44, three tabs of at least 96 by 44 | height 44, one horizontal scroll strip of three 96 by 44 tabs |
| Content column | left 22, right 22, top 112, bottom 16, internal scroll; 12 columns, 16 px gap, column 101.67 px (note 1) | left 22, right 22, top 112, bottom 16; 6 columns, 16 px gap, column 109.33 px | left 8, right 8, top 104, bottom 8; 1 column |
| `Answer` card | columns 1 to 8, width 925.3 | columns 1 to 6, width 736 | full width 344 |
| `Command log` card | columns 9 to 12, width 454.7 | columns 1 to 6, below the answer card | full width, below the answer card |
| Question row | height 44, the field spanning the card minus 60, the `Ask` button 44 by 44 | same | same, `Ask` 44 by 44 |
| `SQL` block | monospace 12 px, `white-space: pre`, max height 120, internal scroll | same | same, max height 96 |
| Result table | header row 32, at most 8 body rows of 28, then internal scroll and the `{n} more rows` text | same | same, at most 5 body rows |
| `Voice` microphone | 64 by 64 centred above the typed phrase field | 64 by 64 | 64 by 64 |
| Draft card | full width of the answer card, `Apply` and `Discard` 44 by 44 at the right | same | full width, both buttons 44 by 44 in one row |
| `Explain` paragraph | the answer card width, line height 1.5, no fixed height | same | same |
| Map screen | `display: none` | `display: none` | `display: none` |

Notes a verifier can measure:

1. The 12 columns at 1440x900: `(1396 - 11 * 16) / 12 = 101.67`. A span of 8 is `8 * 101.67 + 7 * 16 = 925.3`, a span of 4 is `4 * 101.67 + 3 * 16 = 454.7`, and the two spans plus one gap give 1396. At 780x900: `(736 - 5 * 16) / 6 = 109.33`, a span of 6 is 736. At 360x640 the content width is `360 - 16 = 344`.
2. With the map screen at `display: none`, every box of blocks 1 to 5 and the block 6 numbers view reports a 0 by 0 rectangle, so the intersection with the right edge column is 0 at all three widths while the surface is open, and the column is not part of any measurement of this block (R-41).
3. No box of this surface grows the document: `document.documentElement.scrollHeight` equals the viewport height within 2 px at every width, and the SQL block and the result table scroll inside themselves.

## Expected Interface

Public names only.

- Front: `src/components/AgentView.tsx` renders the `region` of R-38, its header, its three tabs, the answer card, the command log and the three tab bodies; `src/components/AgentAnswer.tsx` renders one payload of Table D with its SQL block, its result table and its provenance lines; `src/lib/agent-api.ts` exports `askAgent(question, locale)`, `stageDraft(draft)`, `applyDraft(draftId)`, `discardDraft(draftId)` and `fetchAudit()`; `src/lib/voice.ts` exports `recognitionSupport(locale)`, `matchUtterance(transcript, locale, phrases)` and `confirmIntent(transcript, locale)`; `src/lib/explain.ts` exports `explain(state)` and `EXPLAIN_TEMPLATE`.
- Store: `useMapStore` gains `agentOpen`, `agentTab`, `voiceDraft`, `lastVoiceError` and `auditRows`; `?agent=1&tab=...` is URL state only and nothing is written to local storage (block 4 R-51's rule). `App` mounts `AgentView` as a sibling of `MapCanvas` and puts the map screen subtree at `display: none` while the surface is open.
- `ZOrder` gains `agentView: 85`, above block 6's `numbersView: 80`, above block 7's `decisionView: 81` and `fieldRecordView: 82`, and above every map screen key. This is a key of the surface's own screen, not a member of the map screen's order: while the surface is open the map screen is `display: none`, so the two orders never compare, and block 3 R-32 is not amended (AM-03).
- Backend: `backend/agent/executor.py` exports `open_readonly()`, `GATE_ORDER`, `run_query(sql, limit=200, deadline_seconds=2.0)` and the reason codes of Table C; `backend/agent/model.py` exports `generate_sql(question, previous_reason)`; `backend/agent/registry.py` exports `stage_draft`, `apply_draft`, `discard_draft` and `AUDIT`; `backend/agent/routes.py` registers the five routes of Table A in `backend/main.py`; `backend/evidence/build_evidence_db.py` builds the two files of R-01.
- Changed in the registry and nowhere else: `COMMANDS` in `backend/main.py` gains a fifth entry `open_view` with `input_schema` `{"type": "object", "properties": {"view": {"type": "string", "enum": ["agent"]}}, "required": ["view"], "additionalProperties": false}`, `effect` `open_view`, `idempotent` true and the guard `view must be a supported application view`; `command_state` gains `open_view`; `COMMAND_EFFECTS` in `src/lib/commands.ts` gains `open_view` and the registry size cap follows it, which lifts the registry from four commands to five; `runCommand` gains the matching case, which sets `agentOpen` true and leaves every other store field untouched; `backend/test_commands.py` updates its count and its `valid_names` list. Nothing else in the registry changes (AM-02).
- Not edited: `CommandToggle.tsx`, `EvidencePanel.tsx`, `SupportingDataToggle.tsx`, `MapCanvas.tsx`, `ScenarioCards.tsx`, `RotationFlipCard.tsx`, every block 4 and block 5 component, and `src/strings/pt-BR.ts`.

## Layout contract

The box geometry is Table J. Three sentences fix the intent: the surface replaces the map screen rather than floating over it, so no rectangle of blocks 1 to 5 has to be avoided; at 780x900 the answer card and the command log stack in one column rather than shrinking side by side, because two 360 px columns would not fit the SQL block; and at 360x640 the tab row scrolls horizontally instead of wrapping, which keeps the header at 56 px and the content top at 104 px.

This block moves no box of blocks 1 to 7 in any state: while the surface is open those boxes are `display: none`, and while it is closed the surface is not mounted. The agent bar of block 2 keeps its bottom centre anchor, the right edge column keeps block 3 R-23 and R-40 exactly as frozen, and no box of this block is positioned relative to either.

Keyboard, names and motion:

| Element | Role and name | Keys | Rule |
|---|---|---|---|
| `Close agent` | `button` named `Close agent` | Enter and Space close the surface, focus returns to whatever opened it | R-42, AC-33 |
| Tabs | three `button` elements named `Ask`, `Voice`, `Explain` | Enter and Space switch the tab, the selected one carries `aria-selected` | R-38, AC-33 |
| Question field | `textbox` named `Question` | Enter submits, Shift Enter does not exist in a single line field | R-42, AC-33 |
| `Ask` | `button` named `Ask` | Enter and Space submit | R-42, AC-33 |
| Microphone | `button` named `Start listening` and `Stop listening` while listening | Enter and Space start and stop one recognition | R-20, R-42 |
| `Apply` and `Discard` | two `button` elements named `Apply command` and `Discard command` | Enter and Space | R-27 |
| `Explain this screen` | `button` named `Explain this screen` | Enter and Space | R-32 |
| Reduced motion | every element inside the region | none | computed `transition-duration` 0s, R-42 |

## Test oracles

Oracles pin files, counts and the values this card measured. A live model call at the gate is a smoke check whose result is recorded with its date and never compared as an oracle.

Pinned fixture: `field-shift-app/backend/fixtures/field-scenarios.json`, 45 lines, 7,768 bytes, raw sha256 `2425a58f61030309e9184a6952bfbc18384a987db6f6c2067b9bf89beee549e6`. It holds three fields (`mt-santa-carmem-01` coverage 86, `-02` coverage 91, `-03` coverage 62), nine scenarios (three per field, one `current-sequence` marked current) and eighteen evidence rows (six `entered`, six `modelled`, six `retrieved`).

| Id | Oracle | Value | Recorded by |
|---|---|---|---|
| O-01 | Fixture row counts | 3 fields, 9 scenarios, 18 evidence rows, 0 numbers rows | the build probe of this card, M-01 |
| O-02 | The ten fixed answers | `Q-01` 3; `Q-02` `mt-santa-carmem-03`, 62; `Q-03` 79.7; `Q-04` 3, 3, 3; `Q-05` `current-sequence` three times; `Q-06` 6; `Q-07` `mt-santa-carmem-02`, 0.79; `Q-08` entered 6, modelled 6, retrieved 6; `Q-09` `0.19 m³/m³`; `Q-10` `mt-santa-carmem-03` | the ten statements of Table E run against the fixture build, M-02 |
| O-03 | The base relation name is not a bare identifier | `SELECT * FROM field` fails with `no such table: field`; `DELETE FROM v_field` fails with `cannot modify v_field because it is a view` | M-03 |
| O-04 | One statement per execute | `SELECT 1; DROP TABLE field` fails with `You can only execute one statement at a time.` | M-06 |
| O-05 | The authorizer denies the schema and the filesystem | `PRAGMA table_info(v_field)` fails with `not authorized`; `SELECT load_extension('x')` and `SELECT randomblob(1000000)` fail with `not authorized to use function`; reads of `sqlite_master` and `sqlite_temp_master` are denied | M-07 |
| O-06 | `EXPLAIN` passes the authorizer | `EXPLAIN SELECT * FROM v_field` returns 16 bytecode rows, which is why Table C rule 4 rejects `explain` | M-07 |
| O-07 | The deadline bites | a 4 way self join of `v_evidence` takes 0.001 s and a 6 way join 0.295 s; an 8 way join aborts at the 2.0 s deadline with `interrupted after 2.0 s` | M-09 |
| O-08 | Registry state | 4 commands, 4 effects, 7 passing backend tests in `test_commands.py`, `AgentBar` exported from `CommandToggle.tsx` (143 lines) with no `AgentBar.tsx` in the tree | M-11 |
| O-09 | Speech API availability in the measured browser | `hasSpeechRecognition` false, `hasWebkitSpeechRecognition` false, `hasMediaDevices` true, user agent `Chrome/143.0.0.0` | M-12 |
| O-10 | Inherited digests | block 1 `5165dd4d`, block 2 `3bb44541`, block 3 `b384e885`, block 4 `f74a1715`, block 5 `ebc94342`, block 6 `0d10c71f`, block 7 `d734c534`, all reproduced on 2026-11-14 | the recipe of each file, run from `field-shift-app/` |

Recomputation commands, run from `field-shift-app/`:

```sh
# O-01, O-02: build the database from the fixture and run the ten questions
backend/.venv/bin/python backend/evidence/build_evidence_db.py
backend/.venv/bin/python backend/evidence/run_fixed_questions.py --check

# O-03 to O-07: the gate cases, the deadline and the row cap
backend/.venv/bin/python -m unittest backend/test_agent_executor.py -v

# O-08: the registry and its tests
backend/.venv/bin/python -m unittest backend/test_commands.py -v

# O-10: the inherited digests, each with its own file's recipe
for f in bloco-1-mapa-de-composicao bloco-2-hud-sobreposto bloco-3-game-hud bloco-4-camadas-e-timeline bloco-5-poligonos-de-cultura bloco-6-numeros-por-poligono; do
  printf '%s ' "$f"; sed 's/`[0-9a-f]\{64\}`/`PENDING`/' specs/$f.md | sha256sum
done
# block 7 quotes several digests per line, so its own recipe carries the g flag
printf 'bloco-7 '; sed 's/`[0-9a-f]\{64\}`/`PENDING`/g' specs/bloco-7-decisao-e-produtor.md | sha256sum
```

The first two commands do not exist yet: they are the deliverable of the implementation card, and until they exist the oracle values above are the ones this card measured with its own probe, which is stated in Findings rather than implied.

Pinned artifacts the implementation and the gate replay:

- `artifacts/block8/voice-transcripts.json`, the 30 replays of AC-21: five commands, two languages, three attempts each, with the expected draft of every attempt.
- `artifacts/block8/model-replies.json`, the recorded model replies of AC-10 and AC-16: one valid, one prose wrapped, one two statement, one base relation, one `{"sql": null}`.
- `artifacts/block8/explain-states.json`, the three state projections of AC-30: a normal state, a state with a layer that has no served date, and a mutated template that appends a foreign date.
- `artifacts/block8/AC-33-*.png`, `AC-34-*.png` and `AC-37-*.png`, the surface at the three widths, all blocked on OD-01.

## Assumptions

- `sqlite3` in the backend's Python is the standard library module, and its SQLite library reports 3.53.1 in the backend virtual environment, with `set_authorizer`, `set_progress_handler` and URI filenames all present. Measured on 2026-11-14 (M-09).
- A `TEMP` view can read a table in an attached database, while a persistent view cannot. Measured: `view v_field cannot reference objects in database data` for the persistent case (M-03), and the ten questions run for the temp case.
- `PRAGMA query_only = ON` blocks `CREATE TEMP VIEW`, so the views are created first. Measured: `attempt to write a readonly database` when the order is reversed (M-04).
- The fixture's `value` strings are the values the app prints for an evidence answer, including `0.19 m³/m³` and `Not entered`, and the answer prints them verbatim rather than converting them to a number the fixture does not carry.
- Chrome's speech engine is server based and the app cannot make it work offline. MDN states it, and the reviewer's browser does not expose the API at all (M-12), so the fallback of R-21 is the normal path in the measured environment, not an edge case.
- A model with a key is available to whoever runs the app; the team holds no such key in this repository, so the default path is the fixed question mode of R-12 and the key is OD-02, not an assumption.
- Block 6's payload is not implemented yet, so `v_numbers` is empty and the explanation's numbers clause is never taken. Both branches are specified and marked not verified until block 6 ships.

## Acceptance criteria

Every criterion carries a method, a named artifact and an explicit falsifier. A result without its artifact is not a pass. Criterion AC-33, AC-34 and AC-37 name candidate A of OD-01 and are blocked until the user chooses a placement; they report blocked, not passed, and not failed.

- AC-01 (covers R-01; method: tests over the built files; artifact: `AC-01-db.txt` with the two file paths, the fixture sha256 and the four view row counts): Running the build twice SHALL produce two files whose four views return 3, 9, 18 and 0 rows, SHALL read no network, and SHALL read only the pinned fixture. False if: a row count differs, a network call is recorded, or the second run changes a row count.
- AC-02 (covers R-02; method: tests on the executor, four cases; artifact: `AC-02-readonly.txt` with the four error messages): A write through the agent connection SHALL fail, `PRAGMA query_only` SHALL report 1, the authorizer SHALL deny a write action, and the data file opened with `mode=ro` SHALL refuse a write with `attempt to write a readonly database`. False if: any of the four succeeds, or the executor has no authorizer.
- AC-03 (covers R-03; method: tests on the executor; artifact: `AC-03-relations.txt` with the four results and the prompt text scan): `SELECT * FROM field`, `SELECT * FROM raw~field` and `SELECT * FROM "raw~field"` SHALL each be rejected, the four view names SHALL each answer, and the system prompt, the response payload and every rendered error SHALL contain no base relation name. False if: a base relation query succeeds, a base relation name appears in the prompt or the response, or a view name is rejected.
- AC-04 (covers R-04; method: tests on the gate; artifact: `AC-04-statements.txt` with each rejected statement and its reason): A second statement, a `PRAGMA`, an `EXPLAIN`, an `INSERT`, a `WITH ... DELETE` and a statement that does not start with `SELECT` or `WITH` SHALL each be rejected with the reason of Table C, and the two statement case SHALL be rejected by the gate before SQLite sees it. False if: any of them executes, or a reason differs.
- AC-05 (covers R-05; method: tests on the gate and the authorizer; artifact: `AC-05-functions.txt` with each function and its verdict): `load_extension`, `readfile`, `writefile`, `randomblob`, `printf` and `zeroblob` SHALL each be rejected with `function_not_allowed`, while `count`, `sum`, `avg`, `round`, `max`, `min`, `coalesce` and `like` SHALL each run. False if: a denied function runs, or an allowed one is rejected.
- AC-06 (covers R-06; method: tests on the executor with a generated 5,000 row query and with `Q-08`; artifact: `AC-06-limit.txt` with the row counts, the `truncated` flag and the fetch size): The 5,000 row query SHALL return 200 rows with `truncated` true and SHALL NOT materialise more than 201 rows, and `Q-08` SHALL return 3 rows with `truncated` false. False if: more than 200 rows return, `truncated` is wrong, or the executor drains the scan.
- AC-07 (covers R-07; method: tests on the executor with a fake clock and a real 8 way join; artifact: `AC-07-timeout.txt` with the two durations and the reason): The 8 way join SHALL be rejected with `statement_timeout` at or under 2.0 seconds plus 100 ms of callback granularity, SHALL return no rows, and SHALL NOT be retried. False if: the statement completes, a partial row returns, or a retry is issued.
- AC-08 (covers R-08; method: tests over the built files and the query route; artifact: `AC-08-numbers.txt` with the view columns, the row count and the abstention payload): `v_numbers` SHALL carry the eleven columns of Table B and return 0 rows, and a question about a rain total SHALL be `abstained` with `no_numbers_snapshot` and no SQL. False if: a column is missing, a row returns, or the answer carries a value.
- AC-09 (covers R-09; method: tests with file hashing around 50 questions; artifact: `AC-09-immutable.txt` with the two sha256 values and the 50 question ids): The raw sha256 of both database files SHALL be identical before and after 50 questions, and no table other than the four base relations SHALL exist in the data file. False if: either hash changes, or an audit, cache or log table exists.
- AC-10 (covers R-10, R-13; method: tests with the recorded model replies of `artifacts/block8/model-replies.json`; artifact: `AC-10-model.txt` with each reply, its gate verdict and the request count): A valid reply SHALL run once, a prose wrapped or two statement or base relation reply SHALL trigger exactly one retry and then a rejection, a `{"sql": null}` reply SHALL abstain, and every request SHALL carry the system prompt byte for byte, `temperature` 0 and at most 400 output tokens. False if: a reply runs unvalidated, more than one retry occurs, or a request differs from Table F.
- AC-11 (covers R-11; method: tests plus a tree scan with and without a key; artifact: `AC-11-credentials.txt` with the scan output, the `.gitignore` line and the three environment names): With `AGENT_API_KEY` set to a sentinel value the scan SHALL find that value in no tracked file, `.env` SHALL be ignored, and the backend SHALL read only `AGENT_BASE_URL`, `AGENT_MODEL` and `AGENT_API_KEY` among agent variables. False if: the sentinel appears in a tracked file, `.env` is not ignored, or a fourth credential name is read.
- AC-12 (covers R-12; method: tests with no key and a network log; artifact: `AC-12-nokey.txt` with the two payloads and the request log): With no key, each of the ten questions SHALL answer state `fixed` with its Table E SQL and result, a paraphrase SHALL answer `unavailable` with `model_unavailable`, and the network log SHALL record zero requests to the model host. False if: a fixed question fails, a paraphrase answers, or a model request is issued.
- AC-13 (covers R-14; method: tests over the rejection cases; artifact: `AC-13-rejection.txt` with the three printed parts of each case and a scan for engine strings): Each rejection SHALL print its reason code, one catalog sentence and the rejected SQL, and SHALL print no engine message, no file path, no schema alias and no base relation name. False if: an engine string appears, a part is missing, or the SQL is hidden.
- AC-14 (covers R-15; method: tests with a `{"sql": null}` reply and a numbers question; artifact: `AC-14-abstain.txt` with the two payloads and the rendered text): Both SHALL be `abstained` with their reason, `sql` null, no rows, and the text that the data cannot answer, plus the ten fixed questions offered. False if: a row returns, a `0` prints, or a second model call is made.
- AC-15 (covers R-16; method: tests over `Q-02`, `Q-06`, `Q-08` and `Q-09`; artifact: `AC-15-provenance.txt` with the SQL block text and each provenance line): Every answer SHALL print its SQL and one provenance line per quoted number, `Q-02` SHALL print `no date recorded`, `Q-08` SHALL print both 2025-06-30 and 2025-11-10 for the `entered` count, and `Q-09` SHALL print `retrieved`, 2025-11-10 and the GIBS URL. False if: a number has no line, a line lacks `basis`, `as_of`, `as_of_all` or `source`, or a date prints where the rows carry none.
- AC-16 (covers R-17; method: tests with a reply whose SQL is valid and whose surrounding text is a false sentence; artifact: `AC-16-answer.txt` with the reply, the payload and the sentence diff): The `answer` SHALL be one sentence built from the rows, and the false sentence's words SHALL appear in no field of the payload. False if: a model produced word reaches the response, or the answer contradicts `row_count` or the value.
- AC-17 (covers R-18; method: tests running all ten statements against the fixture build; artifact: `AC-17-fixed.txt` with the ten result sets and their SQL): Each of the ten SHALL return exactly the result of Table E, column for column and value for value. False if: a result differs at its printed value, or a question is missing.
- AC-18 (covers R-19; method: curl transcripts against the running backend; artifact: `AC-18-route.txt` with one request and response per state): The five states SHALL each be reachable with the status of R-19, a 501 character question SHALL be `rejected` with `question_too_long`, and `unavailable` SHALL be the only 503. False if: a status differs, a state is unreachable, or a rejection returns 500.
- AC-19 (covers R-20; method: tests with a fake `SpeechRecognition` constructor; artifact: `AC-19-speech.txt` with the constructor arguments of one recognition): One recognition SHALL be created with `continuous` false, `interimResults` false, `maxAlternatives` 3 and the `lang` of the selected locale, SHALL start only from the microphone button, and no `MediaRecorder` or audio element SHALL exist. False if: a constructor argument differs, a recognition self starts, or an audio buffer exists.
- AC-20 (covers R-21; method: tests with the constructor removed, `available` false, and each error code; artifact: `AC-20-availability.txt` with the five reasons and the typed fallback's result): Each of the five states SHALL disable the microphone with its reason printed and SHALL leave the typed path able to stage, confirm and apply a command. False if: a state is silent, the typed path is disabled, or a command applies without confirmation.
- AC-21 (covers R-22, R-23; method: tests replaying `artifacts/block8/voice-transcripts.json`; artifact: `AC-21-matcher.txt` with the 30 replays, the ambiguous case and the no match case): Five commands times two languages times three consecutive attempts SHALL each stage the expected draft, the ambiguous case SHALL stage nothing, `no_match` SHALL print the transcript, and the default locale SHALL follow `navigator.language` with the English fallback. False if: an attempt stages the wrong command or argument, an ambiguous phrase stages, or a no match is silent.
- AC-22 (covers R-24, R-25; method: tests over the phrase table; artifact: `AC-22-mapping.txt` with each command, its phrase and the draft arguments): Every phrase of Table G SHALL map to its command and arguments, every command SHALL be reachable in both languages, `open_view` SHALL carry `view` `agent`, a field ordinal beyond the list SHALL produce `no_match`, and no command name spoken as such SHALL be accepted. False if: a phrase maps to another command, a command is unreachable in one language, or a raw command name is accepted.
- AC-23 (covers R-26; method: tests with a store spy and a network log; artifact: `AC-23-no-apply.txt` with the store state after 30 recognitions and the request log): After every recognition the five state fields SHALL be unchanged, `runCommand` SHALL show zero calls, and the log SHALL show zero `POST /commands/` and zero `POST /agent/apply`. False if: a recognition changes state or issues an apply.
- AC-24 (covers R-27, R-28; method: tests with a fake clock; artifact: `AC-24-confirm.txt` with the apply, the second apply, the expired apply and the confirm by voice): `Apply` SHALL apply once and write one audit row, a second apply SHALL return 409 and change nothing, a draft applied after 120 seconds SHALL return 409, a confirm phrase SHALL apply while a draft is pending, and a cancel phrase SHALL discard. False if: a second apply succeeds, an expired draft applies, a confirm phrase applies without a pending draft, or two audit rows are written for one application.
- AC-25 (covers R-29; method: tests over the ring and computer use on the log card; artifact: `AC-25-audit.txt` with the nine fields of five rows, the ring after 101 applications and the rendered card): Each applied command SHALL write one row with the nine fields of Table H, the ring SHALL hold 100 rows with the oldest dropped, the card SHALL print the last five, and `persistent` SHALL be false. False if: a field is missing, the ring grows past 100, the card prints another count, or a row survives a restart.
- AC-26 (covers R-30; method: tests and a scan of the source tree; artifact: `AC-26-privacy.txt` with the scan and the disclosure text): The app SHALL create no `MediaRecorder`, no `Blob` of audio, no audio element and no upload of audio, the transcript SHALL be the only stored artefact, and the disclosure sentence SHALL print on the Voice tab. False if: an audio buffer or an audio request exists, or the disclosure is absent.
- AC-27 (covers R-31; method: tests with the transport offline and with each error code; artifact: `AC-27-offline.txt` with the disabled states, the reasons and the typed path result): Offline SHALL disable the microphone with `mic_network_unavailable`, the typed path SHALL stay usable and apply after confirmation, and no retry loop SHALL start. False if: the microphone stays enabled, the typed path is disabled, or a retry loop exists.
- AC-28 (covers R-32; method: tests over three state projections; artifact: `AC-28-template.txt` with the three paragraphs and the fact list of each): `explain(state)` SHALL return the paragraph of Table I for each projection and the list of facts it used, and two calls with the same state SHALL return the same string. False if: a sentence differs from the template, the fact list is missing, or two identical states differ.
- AC-29 (covers R-33; method: tests with a state whose unread fields carry impossible values; artifact: `AC-29-state.txt` with the field list read and the paragraph): The paragraph SHALL change when any field of R-33 changes and SHALL NOT change when `selectedFieldId`'s scenario list, the network, the clock or local storage changes. False if: a field of R-33 is unread, or a field outside R-33 changes the paragraph.
- AC-30 (covers R-34; method: tests extracting dates and basis tokens from the rendered paragraph; artifact: `AC-30-invariant.txt` with each extracted token, the state projection and the mutated template result): Every `YYYY-MM-DD` and every basis token in the paragraph SHALL be present in the state projection, and the mutated template that appends `2026-01-01` SHALL fail the same check. False if: a token is absent from the state, or the mutated template passes.
- AC-31 (covers R-35, R-36; method: tests over five states; artifact: `AC-31-gaps.txt` with the five paragraphs and their gap clauses): A layer that is `unavailable`, `none_in_lookback` or `stale`, and a `tileDecisions` entry that does not draw, SHALL each produce a gap clause; no field, no layer on and no block 6 payload SHALL each produce their empty sentence and no clause. False if: a gap is missing, a gap prints for a layer that is off, or a numbers clause prints without a payload.
- AC-32 (covers R-37; method: tests with a spy on the model client and a byte comparison; artifact: `AC-32-no-rewrite.txt` with the call count and the two paragraphs): The rendered paragraph SHALL equal the output of `explain(state)` byte for byte, the model client SHALL show zero calls for the whole `Explain` flow, and no request SHALL leave for any model host. False if: the paragraph differs from the template, a model call is recorded, or a rewrite path exists in the surface.
- AC-33 (covers R-38, R-39, R-42; method: tests and computer use at 1440x900, 780x900 and 360x640; artifact: `AC-33-{width}-{tab}.png`, `AC-33-keys.txt`, `AC-33-url.txt`; blocked: OD-01): One `region` named `Agent` SHALL exist per page, `?agent=1` SHALL open it at all three widths, the three tabs SHALL switch and write `tab` without touching another parameter, `Close agent` SHALL close it, focus SHALL follow R-42, and no new button SHALL appear in a frozen region. False if: a second region exists, a parameter other than `tab` changes, a key does not work, or a button is added to a frozen region.
- AC-34 (covers R-40; method: tests with a spy on `map.resize` and computer use at the three widths; artifact: `AC-34-camera.txt` with centre, zoom, bearing and pitch before and after, `AC-34-rects.txt`, `AC-34-open-1440.png`; blocked: OD-01): While the surface is open every box of blocks 1 to 6 SHALL report a 0 by 0 rectangle and the surface SHALL equal the viewport with no page scroll; on close `map.resize` SHALL have been called once and the camera values SHALL be identical. False if: a box reports area, the page scrolls, `resize` is not called, or a camera value differs.
- AC-35 (covers R-41, R-46; method: a static import scan and a diff; artifact: `AC-35-scope.txt` with the import graph of `AgentView.tsx` and `git diff --name-only`): `AgentView.tsx` and every new module SHALL import none of `CommandToggle`, `EvidencePanel`, `SupportingDataToggle` or `AgentBar`, and the diff SHALL contain none of those files and not `src/strings/pt-BR.ts`. False if: an import appears, a frozen file is edited, or `pt-BR.ts` changes.
- AC-36 (covers R-43; method: tests and the literal scan; artifact: vitest output and the scan report): Every new visible string and accessible name SHALL resolve through `t()` with its key in `en.ts`, the literal scan SHALL stay green, and no unit symbol, class name or source string SHALL be a catalog key. False if: a literal appears in a component, a key is missing, or a data value enters the catalog.
- AC-37 (covers R-44, R-45; method: tests and computer use at the three widths; artifact: `AC-37-deps.txt` with `git diff package.json package-lock.json backend/requirements.txt` and `AC-37-boxes.txt` with the box rectangles per width; blocked: OD-01): `package.json`, `package-lock.json` and `backend/requirements.txt` SHALL be unchanged, and every box of Table J SHALL match at the three widths inside 2 px with page scroll 0. False if: a dependency is added, a box differs by more than 2 px, or the page scrolls.
- AC-38 (covers R-47; method: unit tests on the resolver and on the built database; artifact: `AC-38-region.txt` with the five resolutions and the three `v_field` rows): `mt-santa-carmem-01` and `trazo:12345` SHALL resolve to Brazil, `csb:381825001868504` and `local:0f0e7d2c-1f4b-4a54-9d4e-6a2f3b8c1d20` SHALL resolve to the United States, an unprefixed id that is not a fixture SHALL resolve to the United States, and the three `v_field` rows SHALL carry `Brazil`. False if: a resolution differs, the mapping appears in a second place with another default, or the default is inferred from a centroid, a name, a locale or the browser.

Coverage check. Every active requirement R-01 to R-47 has at least one criterion: R-01 (AC-01), R-02 (AC-02), R-03 (AC-03), R-04 (AC-04), R-05 (AC-05), R-06 (AC-06), R-07 (AC-07), R-08 (AC-08), R-09 (AC-09), R-10 and R-13 (AC-10), R-11 (AC-11), R-12 (AC-12), R-14 (AC-13), R-15 (AC-14), R-16 (AC-15), R-17 (AC-16), R-18 (AC-17), R-19 (AC-18), R-20 (AC-19), R-21 (AC-20), R-22 and R-23 (AC-21), R-24 and R-25 (AC-22), R-26 (AC-23), R-27 and R-28 (AC-24), R-29 (AC-25), R-30 (AC-26), R-31 (AC-27), R-32 (AC-28), R-33 (AC-29), R-34 (AC-30), R-35 and R-36 (AC-31), R-37 (AC-32), R-38, R-39 and R-42 (AC-33), R-40 (AC-34), R-41 and R-46 (AC-35), R-43 (AC-36), R-44 and R-45 (AC-37), R-47 (AC-38). Every feature of this block has at least one requirement and one criterion: F-18 (R-01 to R-19, AC-01 to AC-18), F-19 (R-20 to R-31, AC-19 to AC-27), F-20 (R-32 to R-37, AC-28 to AC-32), the surface (R-38 to R-46, AC-33 to AC-37), and the region rule is R-47 with AC-38.

## Evidence required per AC

| AC | Method | Artifact |
|---|---|---|
| AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-19, AC-20, AC-21, AC-22, AC-23, AC-24, AC-25, AC-26, AC-27, AC-28, AC-29, AC-30, AC-31, AC-32, AC-36, AC-38 | vitest and pytest | the named text file of each criterion and the vitest output |
| AC-18 | curl transcripts | the route transcript and the state dump |
| AC-33, AC-34, AC-37 | vitest plus computer use at 1440x900, 780x900 and 360x640 | the screenshots named in each criterion and the rectangle file |
| AC-35 | static scan and diff | the import graph and `git diff --name-only` |

Every screenshot is named by its AC, its width and its tab, and lands in `artifacts/block8/`. A criterion with no artifact counts as not verified, not as passed. AC-33, AC-34 and AC-37 report blocked until OD-01 is decided, and blocked is neither a pass nor a fail.

## Amendments

One row per change this block makes to a requirement of blocks 1 to 7, plus one row for the registry contract that grows and one count correction this block measured. No requirement text of blocks 2 or 3 is rewritten, because the user's constraint of 2026-11-14 forbids it. Rows marked gate note change no text; they record a relation the next gate must read so that it does not fail on a clause this block leaves alone.

| Id | Change | Where |
|---|---|---|
| AM-01 | Gate note. The block 2 role and name pair list gains no `region` `Agent` pair in this block, because the surface has no placement until OD-01 is decided. When the user chooses a candidate, the pair is added by an amendment card for that candidate, not by this file. Block 7 AM-02 takes the additive reading of the same constraint and adds two pairs of its own, so the list as block 7 leaves it holds eight pairs and this block adds none of them; the two readings cannot both be right and the conflict is M-16. | block 2 R-11, block 3 R-36 |
| AM-02 | Code contract, not a requirement: the command registry grows from four commands to five. `COMMAND_EFFECTS` in `src/lib/commands.ts` gains `open_view`, which lifts the registry size cap from four to five; `COMMANDS` in `backend/main.py` gains the fifth entry of Expected Interface; `command_state` gains `open_view`; `backend/test_commands.py` updates its count from four to five and its `valid_names` list. No requirement of blocks 1 to 7 states the command count, so no requirement text changes, and the four existing commands keep their names, schemas, effects, idempotence and guards exactly. | `src/lib/commands.ts`, `backend/main.py`, `backend/test_commands.py` |
| AM-03 | Gate note. Block 3 R-32's list of map screen keys gains no entry. The surface's own key `agentView: 85` is added to the `ZOrder` export beside block 6's `numbersView: 80`, and both live outside the map screen's order: while the surface is open the map screen is `display: none`, so no pair of block 3's order is compared against it and every adjacent pair of the frozen order keeps its relative position. | block 3 R-32 |
| AM-04 | Gate note. Block 3 R-23 and R-40 are not amended. The right edge column is not mounted while the agent surface is open, because the whole map screen is `display: none` under R-40, and no block 8 rule, stylesheet or component places, sizes or positions anything in, next to or relative to that column. The zero intersection of AC-34 is measured against the column's zero area rectangle in the open state and against its absence in the closed state. | block 3 R-23, R-40 |
| AM-05 | Gate note. Block 1 R-02's clause about the boxes of the map screen still counts the map screen and no longer describes every screen of the app: block 8 adds one screen that mounts in place of the map screen, as block 6 already does. On the map screen the boxes are unchanged and the agent surface is not one of them. | block 1 R-02, AC-02 |
| AM-06 | Gate note. Block 6 R-01 keeps its two openers for the numbers surface. The new command `open_view` carries `view` enum `["agent"]` only, so the numbers surface gains no third opener, block 6 is not amended, and a later decision to include `numbers` in that enum (OD-06) is a new amendment row for that card. | block 6 R-01 |
| AM-07 | Count correction, measured. The route inventory is nine routes today, not the eight that block 1 AM-01 counts and not the ten that block 6 AM-08 arrives at after its own route. Block 6's row is right about its own total of ten; this row records the arithmetic from the tree: nine today, ten with block 6, fifteen with the five routes of Table A, and block 7 adds none. No existing route changes shape. | block 1 AM-01, block 6 AM-08, block 7 Expected Interface |

Every other requirement and criterion of blocks 1 to 7 stays in force unchanged. In particular block 1 R-14 and R-15 (basis per row, no control relabels a row, no relabel by pattern) apply to every provenance line of this block through R-16; block 3 R-37 keeps the catalog rule and the empty `pt-BR.ts`; block 3 R-32 keeps its order; block 4 R-51 keeps state out of local storage and the `?agent=1` parameter is URL state only; block 6 R-01, R-02 and R-07 keep their surface, their `display: none` pattern and their provenance row shape, which this block mirrors rather than changes; block 7 R-01, R-52 and R-56 keep their two surfaces and their two stored keys, which this block neither reads nor writes; and block 7 AM-07's `local:` id form is a route change to block 6 that this block's database does not know, so a registered field has no row in `v_field` and a question about it abstains through R-15 rather than falling back to a fixture field (CO-B8-03).

## Freeze record

Frozen at revision 1 on 2026-11-14, the first revision of this file. It inherits block 6 revision 2, the frozen texts of blocks 5, 4, 3, 2 and 1, and the sibling text of block 7 revision 1, and it reproduced all seven digests with their own recipes (O-10). This card wrote one file and no other.

| Field | Value |
|---|---|
| Revision | 1 |
| Approval | Not yet approved. The card stops at the frozen spec and requests review; the user approves in chat first, as with blocks 1 to 6. |
| Inherits | block 7 revision 1 (`d734c534b5ea9dcf8074b521dca1fa934401469dae0ae770212e2eee41da9748`, the 21:56 bytes), block 6 revision 2 (`0d10c71fbe74519f3a801dcdc9eb475a8a53b1fbbfd23c52d8263880fbb7088e`), block 5 revision 5 (`ebc94342f57071cfea25d3074e392f73427b51a94286b2372ebc98c8458bea61`), block 4 revision 8 (`f74a1715d28b0808504065653b296ffbce9e87a84aeb2e238949c6a42787d82e`), block 3 revision 7 (`b384e88556e7e8b15c96b424c6f778b4fb3d874b5def987a502da83b1df88452`), block 2 revision 2 (`3bb44541c55940b32af0958c57b2e00846fedf162f0602b54cf54e5a56e1a255`), block 1 revision 3 (`5165dd4df375b74c455296562585bf00b2b2813304153e849d477d8e4735a117`) |
| Requirements | 47 active, R-01 to R-47; none withdrawn |
| Criteria | 38 active, AC-01 to AC-38, of which AC-33, AC-34 and AC-37 are marked blocked on OD-01 |
| Amendments | 7, AM-01 to AM-07; 0 rewrite a requirement of blocks 1 to 7, 5 are gate notes, 1 is a code contract growth, 1 is a count correction |
| Open decisions | 8, OD-01 to OD-08, each with a written default and a consequence |
| Carry-over | 9, CO-B8-01 to CO-B8-09 |
| Findings | 17, M-01 to M-17 |
| sha256 | `cc2061ef4d0494385b359d7598830ecc3e7842ffd992dcc622922efe2d43d358` |

A file cannot carry the digest of itself, so the sha256 row holds `PENDING` before hashing. The raw sha256 of the frozen file bytes is reported on the card, because a file cannot record its own raw digest. Reproduce the digest with, from `field-shift-app/`:

```sh
sed 's/`[0-9a-f]\{64\}`/`PENDING`/g' specs/bloco-8-agente-e-voz.md | sha256sum
```

The result SHALL equal the value in the sha256 row above. That comparison is the freeze check. The substitution carries the `g` flag, following block 7's freeze record, because this file quotes several digests on one line (the status line and the Inherits row each carry seven), and a first match only recipe would leave all but the first unnormalised and make the check depend on the literal digest text. Blocks 4, 5 and 6 state the non global form and their rows reproduce only that way, deliberately: each of those files quotes one digest per line where it counts, and a verifier must read each file's own recipe rather than carry one habit across files. The `g` flag neutralises every 64 hexadecimal digest this file quotes, on every line, so a quoted digest never changes the normalised file.

## Exit criteria

All active criteria AC-01 to AC-38 pass or report blocked on OD-01, each with its named artifact, at the widths the method names. A pass with a missing artifact is not a pass. A regression in any criterion of blocks 1 to 7 that this file does not amend fails the block, and the gate applies the gate notes AM-01, AM-03, AM-04, AM-05 and AM-06 when it measures the clauses they leave alone, the code contract AM-02 when it measures the registry, and the count correction AM-07 when it measures the route inventory.

Some branches report not verified rather than passed until their prerequisite lands, and that is the honest state of this block: AC-08 needs block 6's payload, AC-12 and AC-32 need either a key or its absence to be recorded, AC-18 needs the five routes to exist, and AC-33, AC-34 and AC-37 need the placement decision OD-01. A live microphone measurement is CO-B8-01 and no criterion claims it: the matcher is measured by replay, the recogniser is not.

## Findings from the measurements of this card

These are measured on 2026-11-14 or read from the cited file. Each one shapes a requirement above, and none is a guess. The probe scripts ran in the backend virtual environment against copies of the fixture, and their output is quoted here.

| Id | Finding | Source | Effect |
|---|---|---|---|
| M-01 | The fixture holds 3 fields, 9 scenarios and 18 evidence rows, and the evidence bases are 6 `entered`, 6 `modelled` and 6 `retrieved`. Coverage is 86, 91 and 62, so `239 / 3 = 79.666...` prints as 79.7. The file is 45 lines, 7,768 bytes, raw sha256 `2425a58f...549e6`. | `backend/fixtures/field-scenarios.json`, read and measured | R-01, R-18, O-01 |
| M-02 | The ten statements of Table E run against the fixture build and return exactly the values in that table, including `79.7`, `0.79` for `mt-santa-carmem-02`, `0.19 m³/m³` and the three `6` counts. No statement needed a rewrite after the schema was fixed. | the build probe of this card | R-18, O-02, AC-17 |
| M-03 | The SQLite authorizer reports `SQLITE_READ` for the view name with `dbname` `temp` first and then for the base table behind it, and a persistent view cannot reference an attached database: `CREATE VIEW v_field AS SELECT ... FROM data.field` fails with `view v_field cannot reference objects in database data`. With the base relation renamed `raw~field`, `SELECT * FROM field` fails with `no such table: field` while `SELECT * FROM "raw~field"` succeeds, which is why the relation gate of Table C rule 4 rejects `~` and the name never reaches the prompt. | the three probes of this card | R-02, R-03, AC-03 |
| M-04 | `PRAGMA query_only = ON` refuses `CREATE TEMP VIEW` with `attempt to write a readonly database`, so the views are created first and the pragma is set after them. | the probe of this card | R-02, Assumptions |
| M-05 | A write is refused by the file mode alone: `sqlite3 "file:...?mode=ro" "INSERT ..."` prints `Error in 2nd command line argument: attempt to write a readonly database` and exits 1, and the Python connection reports the same message. | sqlite3 3.54.0 CLI and the backend's Python 3.14.9 | R-02, AC-02 |
| M-06 | Python's `sqlite3` refuses a second statement before SQLite executes it: `SELECT 1; DROP TABLE field` raises `ProgrammingError: You can only execute one statement at a time.` | the probe of this card | R-04, AC-04 |
| M-07 | The authorizer denies `PRAGMA` (`not authorized`), `load_extension` and `randomblob` (`not authorized to use function`), and reads of `sqlite_master` and `sqlite_temp_master`, while `EXPLAIN SELECT * FROM v_field` passes it and returns 16 bytecode rows. `EXPLAIN` is therefore rejected by the text gate, not by the engine. | the probe of this card | R-04, R-05, AC-04, AC-05 |
| M-08 | `LIKE` reaches the authorizer as a function named `like`, so an allowlist without `like` denies a natural question that uses `LIKE`. | the probe of this card | R-05 |
| M-09 | A 4 way self join of `v_evidence` takes 0.001 s and a 6 way join 0.295 s, both over 104,976 and 34,012,224 rows; an 8 way join is interrupted at the 2.0 s deadline with `interrupted after 2.0 s`. The backend environment reports Python 3.14.9 and `sqlite3.sqlite_version` 3.53.1. | the probe of this card | R-06, R-07, AC-06, AC-07 |
| M-10 | `SELECT * FROM (<query>) LIMIT 201` is valid for a plain query and for a recursive `WITH` query, which is the wrap of R-06. | the probe of this card | R-06 |
| M-11 | The registry holds 4 commands with 4 effects, `registerCommand` caps the registry at the number of effects, and `backend/test_commands.py` passes 7 tests, not the 8 the card body states. `AgentBar` is exported from `src/components/CommandToggle.tsx`, which is 143 lines, and there is no `AgentBar.tsx` in `src/components/`, so block 6's instruction not to edit `AgentBar.tsx` names a file that does not exist. | `backend/main.py`, `src/lib/commands.ts`, `src/components/CommandToggle.tsx`, the test run of this card | AM-02, R-46, O-08 |
| M-12 | The reviewer's browser exposes neither constructor: `hasSpeechRecognition` false, `hasWebkitSpeechRecognition` false, `hasMediaDevices` true, user agent Chrome 143. MDN records the interface as limited availability and states that Chrome recognition is server based and does not work offline. | the browser probe of this card and `https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition` | R-20, R-21, R-30, R-31, AC-20, O-09 |
| M-13 | At 21:39, when this card read the tree, `field-shift-app/specs/` held blocks 1 to 6 and no block 7. At 21:53, while this card ran, `bloco-7-decisao-e-produtor.md` appeared as an untracked file, frozen at revision 1: 561 lines, 122,392 bytes, freeze digest `99e3f33c...de5a`. At 21:56 the same file was rewritten in place without a revision bump, and it is now 562 lines, 124,053 bytes, 60 requirements, 53 criteria, 15 findings, freeze digest `d734c534...9748`, raw sha256 `0a6b054d...2570`. This file cites the second state, which is the one on disk and the one the operator's note quotes, and records that a frozen file changing its bytes while keeping its revision number is a process finding in its own right. | `ls -la` and the two digest runs at 21:39, 21:53 and 21:56, plus the operator's note | Status line, CO-B8-03, CO-B8-09 |
| M-14 | All seven inherited digests reproduce on 2026-11-14 with each file's own `sed` recipe: block 1 `5165dd4d...a117`, block 2 `3bb44541...a255`, block 3 `b384e885...8452`, block 4 `f74a1715...d82e`, block 5 `ebc94342...ea61`, block 6 `0d10c71f...088e`, block 7 `d734c534...9748` with its `g` recipe. Block 3 is at revision 7, 450 lines, raw sha256 `29a9d7ef...892d`. | the loop of Test oracles | Status line, O-10 |
| M-15 | Block 6's own Numbers surface sits at z index 80 over a map screen that is `display: none`, and its provenance row carries the ten keys this block's `v_numbers` mirrors. The agent surface reuses that pattern at 85 rather than inventing a second way to hide the map, which is why R-40 is one paragraph and not a geometry problem. | block 6 R-01, R-02, R-07 and Expected Interface, read in the tree | R-40, Table B, AM-03 |
| M-16 | Two sibling blocks read the same user constraint in opposite ways. Block 7 AM-02 rewrites block 2 R-11 to add two conditional pairs, `region` `Decision` and `region` `Field record`, and block 7 AM-03 rewrites block 3 R-32 to add two `ZOrder` keys, while this block records gate notes and adds no pair and no map screen key, because the constraint says block 8 SHALL NOT amend block 2 or block 3. In code the two outcomes coexist: the pair list becomes eight and the `ZOrder` export holds 80, 81, 82 and 85 beside the map screen's keys. What cannot coexist is the reading. This card does not edit block 7 and does not adopt its reading, and the conflict is left to the orchestrator or the user before either gate measures R-11 or R-32. | block 7 AM-02 and AM-03, read in the tree on 2026-11-14; this file's AM-01 and AM-03 | AM-01, AM-03, status line |
| M-17 | Block 6 revision 2 landed at 21:57 while this card ran: 642 lines, 137,661 bytes, 51 requirements, 50 criteria, freeze digest `0d10c71f...088e`, raw sha256 `83f855ad...97b4`, with R-51 fixing the default region as the United States. R-47 follows it directly. What revision 2 presumes and the disk does not yet carry is the fixture side of R-51: it says every fixture entry carries a `region` (the three `mt-santa-carmem` entries with `br`, the three CSB entries with `us`), while `backend/fixtures/field-scenarios.json` still holds three entries, no `region` key, and no CSB field, because block 5 R-24 defers those to CO-B5-01. The three rows therefore take `br` from block 5 R-24's naming, and the build reads an entry's own `region` when one appears. | block 6 revision 2 R-51 and Table B, block 5 R-24, and the fixture file re-read at 21:58 | R-47, Table B, CO-B8-09 |

## Carry-over

Not part of block 8. These stay open and go to a later block or a prerequisite card unless the user pulls one in.

| Id | Item | Goes to |
|---|---|---|
| CO-B8-01 | A live microphone measurement with a human speaker in the browser the demo runs on, for the five commands in both languages, because no criterion of this block can honestly claim speech recognition: AC-21 replays transcripts through the matcher and measures the matcher only. Until it lands, the voice feature is specified and its mapping is tested, and its recogniser is unmeasured. | the block 8 gate, run by a human |
| CO-B8-02 | The block 6 numbers snapshot that fills `v_numbers`: a recorded extraction of the per polygon numbers payload of block 6, one row per metric, with the eleven columns of Table B and a sha256 of the extract. Until it lands, every numbers question abstains and AC-08 reports not verified. | a data card owned by data-scientist, after block 6 ships |
| CO-B8-03 | The producer data that block 7 defines and stores: a registered field's `local:` id, its declared management history and its two constraint keys. Block 7 revision 1 now specifies them (R-35 to R-51 and R-52 to R-56) and none of it is in the evidence database, which is built from the three fixture fields only. Until a later card folds block 7's stored records into `v_field` and a declared history view, a question about a registered field abstains through R-15, and that is the correct state rather than a fallback to a fixture field. | a later card, after block 7 ships |
| CO-B8-04 | On device recognition through `SpeechRecognition.processLocally` and `SpeechRecognition.install`, which would remove the network dependency and the Chrome service. Not usable in the measured browser, which has no constructor at all (M-12). | a later block, when the API is available in the target browser |
| CO-B8-05 | A durable audit trail, a file or a table, if the user wants the applied command history to survive a restart. The in memory ring of R-29 is the honest default for a hackathon, and its loss on restart is stated rather than hidden. | a later ops block, if the user asks |
| CO-B8-06 | A Portuguese user interface, which block 3 R-37 keeps out of scope by keeping `pt-BR.ts` empty. Voice in Portuguese currently means a Portuguese phrase mapped to an English screen, and R-22 says so on the control. | a later block, with the string catalog |
| CO-B8-07 | A labelled evaluation set beyond the ten fixed questions, with a human graded answer for each, so free form text to SQL can be measured for accuracy rather than for safety alone. Ten questions prove the gates; they do not prove the model. | a data card owned by data-scientist |
| CO-B8-08 | A cost and latency budget for the model calls, with a per session cap and a recorded p95 for the ten questions, once a credential exists and a model is chosen (OD-02). | a later ops block |
| CO-B8-09 | The fixture side of block 6 R-51: the three CSB fixture fields of block 5 R-24 with their `region` keys, written by CO-B5-01, so that a `csb:` fixture id has a row in `v_field` and the region column is read from the fixture rather than taken from block 5 R-24's naming. Until then the three `mt-santa-carmem` rows carry `Brazil` and no CSB row exists, and a question about a CSB fixture abstains through R-15. | a prerequisite card owned by data-scientist, or CO-B5-01 |

## Open decisions

Eight items, each with a written default that the requirements already encode and a consequence if the user moves it. None is decided by this file.

| Id | Question | Recommended default | Status | Consequence if changed |
|---|---|---|---|---|
| OD-01 | Where the agent surface lives. The user's constraint of 2026-11-14 leaves the placement open until the `Command` form is planned. Three candidates: A, a full viewport `Agent` screen at `?agent=1` that replaces the map screen, opened by the parameter and by the new `open_view` command, with the map screen at `display: none` and the camera restored on return. B, a bottom sheet over the map at 1440x900 only, which keeps the map visible but overlaps the block 3 right edge column, the agent bar, the scenario cards and the layer rail, and cannot exist at 360x640. C, a left drawer at 1440x900 at left 22, top 60, width 320, bottom 20, which also keeps the map visible but overlaps the block 5 `Polygon` region and the block 3 left column, and has no room at 780x900 or 360x640. | Candidate A, because it is the only one of the three with zero intersection against every frozen box at all three widths, because it reuses the pattern block 6 already froze, and because it adds no button to a frozen region while the form is undecided. | recommended; the user decides | B and C keep the map visible, which is a real gain for F-20, and both cost a geometry exception in at least one width and an overlap with a frozen box, so each would need its own amendment rows and its own layout table. If the user picks B or C, AC-33, AC-34 and AC-37 are rewritten for that candidate and the box table of Table J is replaced, not extended. |
| OD-02 | The model and its credential. No key exists in this repository, and the reviewing session's `EXPLABS_API_KEY` is operator tooling that the app must not read (R-11). | Ship the fixed question mode of R-12 as the default and treat the model as an optional upgrade: `AGENT_BASE_URL`, `AGENT_MODEL` and `AGENT_API_KEY` supplied by whoever runs the app, no default model name in code, and no key committed. | needs a user decision before any free form question is demonstrated | Without a key the app answers the ten fixed questions and nothing else, which is honest but narrow. Naming a default model in code would encode a provider the team has not approved and a cost nobody has measured; using the operator's key would leak a credential across contexts. |
| OD-03 | Whether the explanation may be rewritten by the model at all. R-37 forbids it in this block. | No rewrite. The template of Table I is the product and the explanation is deterministic, so the paragraph a judge reads is the paragraph the state produces. | recommended; the user confirms at freeze | A rewrite reads more naturally and reopens the hallucination channel the template closes. Taking it later needs a route, an amendment row and a criterion that applies the invariant of R-34 to the rewritten text, and a failing rewrite falls back to the template, which is two behaviours to test for one paragraph. |
| OD-04 | Where the `v_numbers` rows come from and when they refresh. | From a recorded block 6 payload extract with a sha256, rebuilt by a script, never read from the live route at question time, so a question returns the same rows as the screen (CO-B8-02). | recommended; the user confirms when block 6 ships | Reading the live route would make a question depend on six upstream sources and break AC-09's immutability check; caching the live route in the database would add a write path to a file this block keeps read only. |
| OD-05 | The voice language default. | Follow `navigator.language`, `pt-BR` for Portuguese and `en-US` otherwise, with English as the fallback for a value that starts with neither. | recommended; the user confirms at freeze | Defaulting to Portuguese would make the microphone fail for an English speaking judge in a Portuguese locale browser; defaulting to English would ignore the producer's own language. The control is two options either way. |
| OD-06 | Whether `open_view` should also open block 6's numbers surface, which would make its enum `["agent", "numbers"]`. | No. Keep the enum `["agent"]` so block 6 R-01 keeps its two openers exactly as frozen and this block amends no block 6 requirement. | recommended; the user decides with OD-01 | Adding `numbers` gives voice a second useful target and requires an amendment row on block 6 R-01, plus a criterion that the numbers surface's camera and close behaviour survive a third opener. |
| OD-07 | The query limits: 200 rows, 24 columns, 1,000 characters per cell and a 2.0 second deadline. | Those four, which the measurements support: the 8 way join aborts at 2.0 s while a 6 way join completes in 0.295 s, and no legitimate question of Table E returns more than 3 rows. | recommended; the user confirms at freeze | A 500 row cap makes the result table scroll further without adding an answer; a 1.0 s deadline is close to the measured 0.295 s for a legal 6 way join on a slow machine; a 5 s deadline lets one question hold the event loop for five seconds on a single worker backend. |
| OD-08 | The audit trail's lifetime and size. | The in memory ring of 100 rows, newest first, `persistent: false`, with the five newest printed and the loss on restart stated in the route response. | recommended; the user confirms at freeze | A durable trail needs a write path, a file permission story and a privacy answer for the transcript strings, which is more than a hackathon needs; a smaller ring loses the history a judge may want to inspect during a demo. |
