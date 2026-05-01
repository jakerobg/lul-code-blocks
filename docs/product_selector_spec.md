# Product Selector — Algorithm Spec & Test Cases

Companion to `product_selector.html`. This document specifies the recommendation algorithm and provides worked examples for manual testing.

---

## Question Flow

| # | Question | Type | Notes |
|---|---|---|---|
| Q1 | What best describes you? | Single-select (8 options) | Used by Stage A.5 rules P4 and P7, and the downsell post-pass. Q1 soft weight nudges are deferred. |
| Q2 | What are you trying to accomplish? | Multi-select, **max 3** | Each option silently maps to one or two products (see Q2 weight table). Mappings are NOT shown to the user. |
| Q3 | What geographic scope are you interested in? | Single-select + conditional fields | If Single Parcel → terminal. Otherwise: Jurisdiction/County/CBSA → State + sub-state field; State → State only; Country → no field. |
| Q4 | How much zoning information do you need? | Single-select (2 options) | **Skipped** when Q2 selections are all in {B, C, E, J} (i.e. no Attributes/Slices/Districts in play). |
| Q5 | How will the data be used? | Multi-select (3 options) | Drives the redistribution-license annotation only; does not change ranking. |

Q1 user types: Data Aggregator, GIS Platform, Technologist, Developer / Real Estate Professional, Environmental Consultant, Government, Housing / Transportation Planner, Lawyer / Legal Professional, Researcher, Site Selection Professional / Consultant.

Q2 use cases (codes used internally):
- A — Assessing development feasibility
- B — Conducting statistical analysis or policy research
- C — Creating demographic cross-tabs
- D — Enhancing an existing data pipeline
- E — Looking up the zoning rules for one specific property
- F — Selecting sites
- G — Understanding district-specific regulations and/or boundaries
- H — Understanding prevailing regulations across a geographic area
- I — Understanding prevailing regulations on a parcel-by-parcel basis
- J — Visualizing and analyzing land uses and/or environmental conditions

---

## Three-Stage Pipeline

```
1. Stage A — Hard overrides (terminal + annotations)
2. Stage A.5 — Named priority rules (explicit boosts and side effects)
3. Stage B — Weighted scoring
4. Tiebreakers
5. Downsell post-pass
6. Card selection (top 1–3, ≥60% of top score)
7. P6 secondary-Rasters injection
8. Render cards with accumulated notes
```

---

## Stage A — Hard Overrides

Checked first, in order. Terminal overrides return immediately. Annotation overrides accumulate into a notes bag attached to every rendered card.

| ID | Condition | Effect |
|---|---|---|
| A1 | Q3 = Single Parcel | **Terminal.** Recommend Parcel Reports. Skip Q4/Q5. |
| A2 | Q2 includes E | **Terminal.** Recommend Parcel Reports. |
| A3 | Q5 includes "Shared externally" OR "Displayed publicly" | Append redistribution-license note: *"This use case requires a redistribution license. We'll be in touch to discuss terms."* |

---

## Stage A.5 — Named Priority Rules

Mirrors the doc's priority table. Most rules are emergent from Stage B. The ones below require explicit handling.

| Doc # | Rule | Implementation |
|---|---|---|
| **P2** | Q2 includes D → Attributes | Emergent (Stage B baseline). |
| **P3a** | Q2 includes A or F AND Q4 = many regs → Slices | Emergent. Slices 15 vs Attributes 7. |
| **P3b** | Q2 includes A or F AND Q4 = 1–2 regs → Attributes | Emergent. Attributes 12 vs Slices 10. |
| **P4** | Q1 ∈ {Researcher, Government} OR (Q2 includes B AND Q4 = 1–2 regs) → Tables | **Explicit boost: Tables +10.** *(Diverges from doc — tightened to reduce over-fire from the original `AND (B OR 1-2)` formulation.)* |
| **P5** | Q2 includes J → Rasters | Emergent. (Q1 condition dropped per design decision — J alone is enough.) |
| **P6** | Q2 includes H → Slices primary + Rasters as secondary | **Side effect:** set `rasters_secondary_note = true`. Forces Rasters into the result list (even below threshold) with note: *"Rasters can complement Slices for visualization."* |
| **P7** | Q1 ∈ {Data Aggregator, GIS Platform, Technologist} AND Q2 does NOT include D → Districts (surface Attributes first) | **Explicit boost: Districts +8, Attributes +5.** Combined with downsell post-pass for the "surface Attributes first" framing. |

---

## Stage B — Weighted Scoring

Each product starts at 0. Apply the following.

### Q2 use case (per selection)

| Code | Score |
|---|---|
| A | Slices +10, Attributes +7 |
| B | Tables +10 |
| C | Tables +10 |
| D | Attributes +10 |
| E | *(hard override A2)* |
| F | Slices +10, Attributes +7 |
| G | Districts +10 |
| H | Slices +10 |
| I | Slices +10, Attributes +7 |
| J | Rasters +10 |

### Q4 zoning depth

| Selection | Score |
|---|---|
| One or two regulations | Attributes +5 |
| Many regulations | Slices +5, Districts +5 |

### Q3 scope nudge (non-parcel only)

| Selection | Score |
|---|---|
| Jurisdiction | (none) |
| County | Slices +2 |
| Metro Area (CBSA) | Slices +2 |
| State | Tables +2 |
| Country | Tables +2 |

### Q1 user type
**Deferred — currently no soft nudges.** When enabled later, suggested values:
- Data Aggregator / GIS Platform / Technologist → Districts +3, Attributes +3
- Researcher → Tables +3, Rasters +3
- Government → Tables +3
- Lawyer / Legal → Parcel Reports +3, Slices +3
- Site Selection Professional → Slices +3
- Developer / Real Estate → Parcel Reports +3, Slices +3
- Housing / Transportation Planner → Tables +3, Slices +3
- Environmental Consultant → Rasters +3

(Note: Q1 still drives Stage A.5 rules P4/P7 and the downsell — those fire regardless of the soft-nudge weights.)

### Q5 distribution
No score impact. Triggers A3 annotation only.

---

## Tiebreakers

Applied when top scores are within 3 points of each other.

1. **More-specific signal wins:** Q4 > Q2 > Q3.
2. **Districts vs Slices tie + non-platform user → Slices.**
3. **Stable order fallback:** Parcel Reports → Slices → Attributes → Tables → Rasters → Districts.

---

## Downsell Post-Pass

After Stage B + tiebreakers, before card selection:

> If the top-scored product is **Districts** AND Q1 is NOT in {Data Aggregator, GIS Platform, Technologist}: demote Districts to secondary, promote Slices to primary. Attach copy: *"Most clients who think they need Zoning Districts actually get what they need from Zoning Slices, which are computed from the same underlying data at a fraction of the cost. Zoning Districts are best when you need the raw boundary polygons themselves."*

---

## Card Selection

1. Take all products with score ≥ **60% of top score**.
2. Cap at 3.
3. If `rasters_secondary_note = true` (P6) and Rasters didn't make the cut, append it as a third (or replace the third) card with the secondary note.

---

## Card Display Format

Each card shows:

1. **Product name** (bold, prominent)
2. **One-sentence description**
3. **Key details** — unit of analysis, delivery format
4. **Best for** — 2–3 bullets
5. **What it's not** — 1–2 sentences (e.g. for Slices: *"Zoning Slices are not raw district polygons — if you need raw boundaries, see Zoning Districts."*)
6. **Next step CTA** — "Request a quote" (Parcel Reports → "Buy now")
7. **Annotations** — license note, discount note, downsell copy, secondary-Rasters copy as applicable.

Below the cards (inside the block):
- Primary CTA: *"Request a quote"*
- Outline button: *"Not what you're looking for? Explore all products"*
- Outline button: *"Explore services"*

---

## Worked Examples

### Example 1 — Researcher doing policy research
**Inputs:** Q1 = Researcher, Q2 = [B], Q3 = State, Q4 = (skipped — B doesn't trigger Q4), Q5 = [Internal]

- Stage A: nothing.
- Stage B: B → Tables +10. Q3 State → Tables +2. **Tables = 12.**
- Stage A.5 P4: Researcher + B → Tables +10. **Tables = 22.**
- Top: Tables. Threshold: 13.2. Only Tables clears.
- **Result:** Tables (single card).

### Example 2 — Researcher with pipeline + narrow regs
**Inputs:** Q1 = Researcher, Q2 = [D], Q3 = Country, Q4 = One or two regulations, Q5 = [Internal]

- Stage B: D → Attributes +10. Q4-1-2 → Attributes +5. Q3 Country → Tables +2. **Attributes = 15, Tables = 2.**
- Stage A.5 P4: Researcher + Q4=1-2 regs → Tables +10. **Tables = 12.**
- Top: Attributes (15). Threshold: 9.0. Tables clears (12 ≥ 9).
- **Result:** Attributes (primary), Tables (secondary).

### Example 3 — Site selector with full-coverage feasibility
**Inputs:** Q1 = Site Selection Professional, Q2 = [F, H], Q3 = CBSA, Q4 = Many regulations, Q5 = [Internal]

- Stage B: F → Slices +10, Attributes +7. H → Slices +10. Q4-many → Slices +5, Districts +5. Q3 CBSA → Slices +2. **Slices = 27, Attributes = 7, Districts = 5.**
- P6 fires (H selected): `rasters_secondary_note = true`.
- Threshold: 16.2. Only Slices clears. Rasters injected as secondary via P6.
- **Result:** Slices (primary), Rasters (secondary, with complement note).

### Example 4 — Single property lookup (hard override)
**Inputs:** Q1 = Lawyer, Q2 = [E, G], Q3 = Jurisdiction

- Stage A2 fires (Q2 includes E): terminal.
- **Result:** Parcel Reports (single card).

### Example 5 — Single parcel scope (hard override)
**Inputs:** Q1 = Developer, Q2 = [F], Q3 = Single Parcel

- Stage A1 fires: terminal.
- **Result:** Parcel Reports. Q4/Q5 not asked.

### Example 6 — Platform aggregator wanting raw districts
**Inputs:** Q1 = Data Aggregator, Q2 = [G], Q3 = State, Q4 = Many regulations, Q5 = [Shared externally]

- Stage B: G → Districts +10. Q4-many → Slices +5, Districts +5. Q3 State → Tables +2. **Districts = 15, Slices = 5, Tables = 2.**
- Stage A.5 P7: Aggregator + no D → Districts +8, Attributes +5. **Districts = 23, Attributes = 5.**
- Top: Districts. Q1 IS platform-type → no downsell.
- A3 annotation: license note attached.
- Threshold: 13.8. Only Districts clears.
- **Result:** Districts (single card) with redistribution-license note.

### Example 7 — Lawyer wanting district info (downsell triggers)
**Inputs:** Q1 = Lawyer, Q2 = [G], Q3 = State, Q4 = Many regulations, Q5 = [Internal]

- Stage B: G → Districts +10. Q4-many → Slices +5, Districts +5. Q3 State → Tables +2. **Districts = 15, Slices = 5, Tables = 2.**
- No P7 (lawyer not platform).
- Top: Districts. Q1 is NOT platform → **downsell post-pass fires.** Promote Slices, attach downsell copy.
- After downsell: Slices is primary, Districts demoted to secondary.
- **Result:** Slices (primary, with downsell copy explaining Districts), Districts (secondary).

### Example 8 — Government with cross-tabs
**Inputs:** Q1 = Government, Q2 = [B, C], Q3 = Country, Q4 = (skipped), Q5 = [Internal]

- Stage B: B → Tables +10. C → Tables +10. Q3 Country → Tables +2. **Tables = 22.**
- Stage A.5 P4: Gov + B → Tables +10. **Tables = 32.**
- **Result:** Tables (single card).

### Example 9 — Environmental consultant visualizing land use
**Inputs:** Q1 = Environmental Consultant, Q2 = [J], Q3 = State, Q4 = (skipped — J doesn't trigger), Q5 = [Internal]

- Stage B: J → Rasters +10. Q3 State → Tables +2. **Rasters = 10, Tables = 2.**
- No P5 condition needed (J alone).
- Threshold: 6.0. Only Rasters clears.
- **Result:** Rasters (single card).

### Example 10 — Pipeline + narrow regs, non-researcher
**Inputs:** Q1 = Developer, Q2 = [D, I], Q3 = County, Q4 = One or two regulations, Q5 = [Internal]

- Stage B: D → Attributes +10. I → Slices +10, Attributes +7. Q4-1-2 → Attributes +5. Q3 County → Slices +2. **Attributes = 22, Slices = 12.**
- Threshold: 13.2. Only Attributes clears.
- **Result:** Attributes (single card).

### Example 11 — Multi-product Q2 stress test
**Inputs:** Q1 = Housing Planner, Q2 = [A, B, J], Q3 = State, Q4 = Many regulations, Q5 = [Internal]

- Stage B: A → Slices +10, Attributes +7. B → Tables +10. J → Rasters +10. Q4-many → Slices +5, Districts +5. Q3 State → Tables +2. **Slices = 15, Tables = 12, Rasters = 10, Attributes = 7, Districts = 5.**
- No P4 (planner not researcher/gov), no P7.
- Top: Slices (15). Threshold: 9.0. Slices, Tables, Rasters all clear (Attributes 7 below threshold).
- **Result:** Slices (primary), Tables, Rasters (capped at 3).

### Example 12 — Public redistribution flag
**Inputs:** Q1 = Developer, Q2 = [F], Q3 = Country, Q4 = Many regulations, Q5 = [Displayed publicly]

- Stage A3: license note attached.
- Stage B: F → Slices +10, Attributes +7. Q4-many → Slices +5, Districts +5. Q3 Country → Tables +2. **Slices = 15, Attributes = 7, Districts = 5, Tables = 2.**
- Threshold: 9.0. Only Slices clears.
- **Result:** Slices (single card) with redistribution-license note.

### Example 13 — Aggregator with pipeline (P7 should NOT fire)
**Inputs:** Q1 = Data Aggregator, Q2 = [D], Q3 = Country, Q4 = One or two regulations, Q5 = [Shared externally]

- Stage A3: license note attached.
- Stage B: D → Attributes +10. Q4-1-2 → Attributes +5. Q3 Country → Tables +2. **Attributes = 15, Tables = 2.**
- P7 condition: aggregator AND Q2 does NOT include D — **fails** (D is included). No boost.
- Threshold: 9.0. Only Attributes clears.
- **Result:** Attributes (single card) with license note.

### Example 14 — H + Q4=1-2 regs (researcher)
**Inputs:** Q1 = Researcher, Q2 = [H], Q3 = State, Q4 = One or two regulations, Q5 = [Internal]

- Stage B: H → Slices +10. Q4-1-2 → Attributes +5. Q3 State → Tables +2. **Slices = 10, Attributes = 5, Tables = 2.**
- Stage A.5 P4: Q1 = Researcher → fires. Tables +10. **Tables = 12.**
- P6 fires (H): `rasters_secondary_note = true`.
- Top: Tables (12). Threshold: 7.2. Slices (10) clears.
- Card selection: Tables, Slices. Rasters not in top — but P6 forces it in.
- **Result:** Tables (primary), Slices, Rasters (secondary with complement note).

### Example 15 — Mixed signals, lawyer
**Inputs:** Q1 = Lawyer, Q2 = [G, H], Q3 = Jurisdiction, Q4 = Many regulations, Q5 = [Internal]

- Stage B: G → Districts +10. H → Slices +10. Q4-many → Slices +5, Districts +5. **Districts = 15, Slices = 15.**
- Tiebreaker 2 fires: Districts vs Slices tie + Q1 not platform → Slices.
- Even if it didn't, downsell post-pass would force the swap.
- P6 fires (H): rasters secondary note.
- Final: Slices primary (with downsell copy), Districts secondary, Rasters tertiary.
- **Result:** Slices, Districts, Rasters.

### Example 16 — Demographic cross-tabs across the country
**Inputs:** Q1 = Researcher, Q2 = [C], Q3 = Country, Q4 = (skipped), Q5 = [Shared externally]

- Stage A3: license note.
- Stage B: C → Tables +10. Q3 Country → Tables +2. **Tables = 12.**
- Stage A.5 P4: Q1 = Researcher → fires. Tables +10. **Tables = 22.**
- **Result:** Tables (single card) with license note.

---

## Open Questions / Decisions to Revisit

1. **Q1 soft nudges.** Deferred. Re-enable the +3 weights when ready.
2. **Q4 follow-up question** (the "specific uses / specific regulations" deep-dive). Per doc, this only matters for Attributes / Districts / Slices recommendations. Not implemented in v1 — flag for v2.

## Resolved

- **P4 rule diverges from doc.** Original doc rule was `(Q1 ∈ {Researcher, Government}) AND (Q2 includes B OR Q4 = 1-2 regs)`. We changed it to `Q1 ∈ {Researcher, Government} OR (Q2 includes B AND Q4 = 1-2 regs)` to make the trigger more distinct and reduce co-firing with Slices/Attributes flows. Researcher/Gov users always get a Tables boost; non-research users only get the boost if they specifically combine policy-research intent (B) with narrow-regs depth (1-2).
