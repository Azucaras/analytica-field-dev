---
title: ADR 0002, the public path is the demo floor
status: accepted
date: 2026-11-10
deciders: Build lead
---

## Context

Most of the useful NASA products need an Earthdata Login. A judge will not have one, and a demo that dies at a login prompt is a demo that scores zero on validity. POWER and the CMR catalogue answer with no account at all; the science files behind them do not.

## Decision

The credential-free path is the demo floor and the only path the demo depends on: POWER point values, public CMR metadata, a static source-dated fixture, and farmer-entered crop history. The authenticated download path is built and documented, and it sits behind the floor rather than under it.

## Consequences

Easy: the demo runs on any machine with a browser, and the panel can be replayed offline.

Hard: the numbers a judge sees are climate context and catalogue metadata, not soil moisture or evapotranspiration values. The interface must label which layer is live and which is fixture, and never let a fixture value pass as an observation.

Revisit if the run gets a working credential store before build freeze. Even then the floor stays, because the judge still has no account.

## Alternatives considered

- **Judge enters their own Earthdata account.** Adds a login step and a failure mode in the first minute. Lost on friction.
- **Ship only the authenticated path.** Best data, worst reachability. Lost on validity.
