# Product Selector v2 — Summary, Test Cases & Issues

A plain-language walkthrough of the new logic from `Product Flowchart Weights.docx`, plus 12 worked examples and a list of weighting issues I found while running the math.

---

## Products (final card content)

There are seven cards in play. Each card shows: **Product · Unit · Delivered as · Best for · What it is and is not · CTA**.

| Product | Unit | Delivered as | CTA |
|---|---|---|---|
| Parcel Reports | Single parcel (address/coordinates) | PDF | Buy now |
| Zoning Attributes | Parcels or addresses (selected by client) | GeoPackage / GeoJSON / Geodatabase, plus CSV | Request a quote |
| Zoning Districts | Zoning district(s), base + overlay | CSV (+ geospatial add-on) | Request a quote |
| Zoning Rasters | 30×30 m raster cell | GeoTIFF | Request a quote |
| Zoning Slices | Unique base+overlay district combination | CSV (+ geospatial add-on) | Request a quote |
| Zoning Tables | Jurisdiction, census tract, block group, etc. | CSV (+ geospatial add-on) | Request a quote |
| Services | Custom geographies | Custom analysis | Get in touch → landuselabs.com/services |

---

## Question Flow

- **Q1** — Who are you? (single-select, 8 options A–H, alphabetical)
- **Q2** — What are you trying to accomplish? (multi-select, max 3, options A–J)
- **Q3** — What geographic scope? (single-select, A–G). *Skipped if Q2 includes E.*
- **Q4** — How much zoning information? (single-select, A–F). *Skipped if Q2 includes E.*
- **Q5** — How will the product be used? (multi-select, A–C). *Skipped if Q2 includes E.*

Q5 options B and C show their licensing caveat in italics: *"this will require a negotiated licensing agreement."*

---

## Step-by-Step Logic

### Step 1 — Hard overrides (skip straight to result)
First match wins. The remaining steps are skipped.

| Override | Condition | Notes |
|---|---|---|
| **Parcel Reports** | Q2 includes E **OR** Q3 = A (Single parcel) | If Q2 includes E, Q3–Q5 are never asked. |
| **Zoning Tables** | Q1 ∈ {E, G} **AND** Q2 includes C | Government or Researcher doing demographic cross-tabs. |
| **Zoning Attributes** | Q1 = A **AND** Q2 includes (D, H, or I) **AND** Q3 ∈ {B–G} | GIS-platform admin doing parcel/aggregate-area work. |
| **Zoning Attributes** | Q1 ∈ {A, B} **AND** Q5 includes (B or C) | GIS-platform admin or data aggregator redistributing data. |

License and geographic-cap notes still attach to override cards when their conditions are met.

### Step 2 — Q1 (role) weights

| Q1 | Score |
|---|---|
| A — GIS platform admin | Attributes +10, Slices +5 |
| B — Data aggregator | Tables +5, Attributes +5, Slices +5 |
| **C — Developer / RE pro** | *(no weights specified)* |
| **D — Env / planning consultant** | *(no weights specified)* |
| E — Government | Tables +5, Attributes +5 |
| **F — Lawyer** | *(no weights specified)* |
| G — Researcher | Tables +10, Attributes +5 |
| H — Site selection pro | Attributes +5 |

### Step 3 — Q2 (goal) weights, applied for each selected goal

| Q2 | Score |
|---|---|
| **A — Feasibility / due diligence** | *(no weights specified)* |
| B — Statistical / policy research | Tables +5, Attributes +5, Slices +5, Districts +5, Rasters +5 |
| C — Demographic cross-tabs | Tables +10 |
| D — Enhancing a data pipeline | Attributes +10 |
| E — Specific-property lookup | *(hard override — Parcel Reports)* |
| F — Selecting sites | Attributes +10, Slices +5, Rasters +5 |
| G — District-specific rules | Districts +10 |
| H — Prevailing rules across an area | Slices +10, Attributes +5 |
| I — Prevailing rules parcel-by-parcel | Attributes +10, Slices +5 |
| J — Visualizing land use / environment | Rasters +10 |

### Step 4 — Q4 (zoning depth) weights

| Q4 | Score |
|---|---|
| A — Just residential / nonresidential | Rasters +10, Attributes +5 |
| B — Specific categories, specific uses | Attributes +5, Slices +5, Districts +5 |
| C — Specific categories, all uses | Attributes +5, Slices +5, Districts +5 |
| D — All categories, specific uses | Attributes +5, Slices +5, Districts +5 |
| E — All categories, all uses | Slices +5, Districts +5 |
| F — Unsure | *(no weights)* |

### Step 5 — Q3 (geographic scope) weights

| Q3 | Score |
|---|---|
| A — Single parcel | *(hard override — Parcel Reports)* |
| B — Census tract / block group | Tables +5 |
| C — Jurisdiction(s) | Attributes +5, Slices +5, Districts +5 |
| D — County or counties | Attributes +5, Slices +5, Districts +5, Rasters +5 |
| E — CBSA | Attributes +5, Slices +5, Districts +5, Rasters +5 |
| F — State(s) | Attributes +5, Slices +5, Districts +5, Rasters +5 |
| G — Whole country | Attributes +5, Slices +5, Districts +5, Rasters +5 |

### Step 6 — Special rules and notes

1. **Services secondary** — if Q1 ∈ {C, D, F, H} AND Q2 includes any of {A, F, H, I}, add Services as the secondary card.
2. **Rasters supplemental** — if Q1 ∈ {A, H} AND Q2 includes H, mark Rasters as a supplemental pick. Tertiary if Services is already secondary; otherwise secondary.
3. **License note** — if Q5 includes B or C, attach the redistribution-license note to the top card.
4. **Geographic-cap note** — if Q3 ∈ {E, F, G} (CBSA, State, Country), attach the cap note to the top card.
5. **Rasters fallback** — if Q2 includes H and Rasters didn't make the threshold, append Rasters as a third card.

### Step 7 — Sort and break ties
Highest score wins. Tie order: **Parcel Reports → Attributes → Slices → Tables → Rasters → Districts** (Services last, since it's inserted by rule).

### Step 8 — Districts vs. Slices downsell
If Districts and Slices are within **5 points** of each other AND Q1 ∈ {C, D, E, F, G}, swap so Slices wins and attach the downsell note explaining that Slices/Attributes show regulatory outcomes while Districts only shows district info.

### Step 9 — Pick cards
Top score sets the cutoff. Any product scoring **≥ 60% of the top score** is included, max **3 products**. Then Services and/or Rasters are inserted per Step 6.

### Step 10 — Show cards
First card → "Top recommendation" (or "Recommended" if alone). Second → "Also consider." Third → "Complementary." Notes are attached to the relevant cards.

---

## Worked Examples

Notation: `Q1 / Q2 / Q3 / Q4 / Q5`. Scores are listed only when scoring runs (i.e., no hard override).

### 1. Lawyer looking up one parcel
**F / [E] / – / – / –** → Q2=E hard override → **Parcel Reports**.

### 2. Government with demographic cross-tabs
**E / [C] / F / – / [A]** → Q1=E + Q2=C hard override → **Zoning Tables** *(+ geographic-cap note since Q3=F)*.

### 3. GIS admin redistributing for a third-party platform
**A / [F] / F / C / [C]** → Q1=A + Q5=C override → **Zoning Attributes** *(+ license note + cap note)*.

### 4. Researcher doing policy research at the state level
**G / [B] / F / F / [A]** →
- Q1=G: Tables+10, Attributes+5
- Q2=B: every product +5
- Q3=F: A/S/D/R +5
- Q4=F: nothing

Final scores: **Attributes=15, Tables=15**, Districts=10, Rasters=10, Slices=10. Tie at 15 → stable order picks Attributes first.
**Picks:** Attributes, Tables, Slices *(cap note)*. ⚠️ See issue #1 below — Tables probably should lead.

### 5. Site selector on full-coverage feasibility (CBSA)
**H / [F, H] / E / E / [A]** →
- Q1=H: Attributes+5
- Q2=F: Attributes+10, Slices+5, Rasters+5
- Q2=H: Slices+10, Attributes+5
- Q3=E: A/S/D/R +5
- Q4=E: Slices+5, Districts+5

Final scores: **Attributes=25, Slices=25**, Districts=10, Rasters=10. Tie → stable order picks Attributes. Step 6 fires: Services secondary (Q1=H, Q2 includes F/H), Rasters supplemental (Q1=H, Q2 includes H).
**Picks:** Attributes, Services, Rasters *(cap note)*.

### 6. Site selector wanting prevailing rules across a state
**H / [H] / F / E / [A]** →
- Q1=H: Attributes+5
- Q2=H: Slices+10, Attributes+5
- Q3=F: A/S/D/R +5
- Q4=E: Slices+5, Districts+5

Final: **Slices=20**, Attributes=15, Districts=10, Rasters=5. Step 6: Services secondary, Rasters supplemental.
**Picks:** Slices, Services, Rasters *(cap note)*.

### 7. Lawyer wanting raw district info statewide
**F / [G] / F / E / [A]** →
- Q2=G: Districts+10
- Q3=F: A/S/D/R +5
- Q4=E: Slices+5, Districts+5

Final: **Districts=20**, Slices=10, Attributes=5, Rasters=5. Downsell would only fire within 5 points; gap is 10.
**Picks:** Districts *(cap note)*. The user gets exactly what they asked for, no downsell.

### 8. Developer assessing feasibility (Q2=A only)
**C / [A] / C / B / [A]** →
- Q1=C: nothing
- Q2=A: nothing
- Q3=C: Attributes+5, Slices+5, Districts+5
- Q4=B: Attributes+5, Slices+5, Districts+5

Final: **Attributes=10, Slices=10, Districts=10**. Three-way tie → stable order picks Attributes; Slices clears 60% threshold; Districts also clears, then gets dropped because Step 6 inserts Services. Step 8 downsell: Districts and Slices within 5 → swap (already done by stable order).
**Picks:** Attributes, Services, Slices. ⚠️ See issue #2 — feasibility-only users get nothing from Q1 or Q2.

### 9. Environmental consultant visualizing land use statewide
**D / [J] / F / F / [A]** →
- Q2=J: Rasters+10
- Q3=F: A/S/D/R +5

Final: **Rasters=15**, Attributes=5, Districts=5, Slices=5. Threshold=9, only Rasters clears.
**Picks:** Rasters *(cap note)*.

### 10. Pipeline + parcel-by-parcel work, county scope
**C / [D, I] / D / B / [A]** →
- Q2=D: Attributes+10
- Q2=I: Attributes+10, Slices+5
- Q3=D: A/S/D/R +5
- Q4=B: Attributes+5, Slices+5, Districts+5

Final: **Attributes=30**, Slices=15, Districts=10, Rasters=5. Threshold=18, only Attributes clears. Step 6 services secondary fires (Q1=C, Q2 includes I).
**Picks:** Attributes, Services.

### 11. Mixed signals, lawyer wanting both district + prevailing rules
**F / [G, H] / C / E / [A]** →
- Q2=G: Districts+10
- Q2=H: Slices+10, Attributes+5
- Q3=C: A/S/D +5
- Q4=E: Slices+5, Districts+5

Final: **Districts=20, Slices=20**, Attributes=10. Stable order puts Slices first (no swap needed; downsell flag does NOT fire because no swap was performed). Step 6: services secondary (Q1=F, Q2 includes H).
**Picks:** Slices, Services, Districts. ⚠️ See issue #3 — the downsell *note* would actually be useful here, but it's suppressed because Slices was already winning.

### 12. Government cross-tabs that *would* be redistributed
**E / [C] / G / – / [B]** → Q1=E + Q2=C hard override → **Zoning Tables** *(+ license + cap notes)*.

---

## Issues / Things That Don't Quite Add Up

### Issue 1 — Q2=B (policy research) spreads +5 to everything
Every product gets +5 from Q2=B. This often cancels out the Q1 Tables boost for Researchers/Government because Attributes also gets:
- +5 from Q1 (Researcher → Tables+10, Attributes+5)
- +5 from Q2=B
- +5 from Q3 (any non-parcel)
= 15, which equals Tables (10+5). Result: a Researcher doing policy research lands on Attributes by tiebreaker. If Tables is meant to lead for research-style use cases, the Q2=B spread is too generous to non-Tables products. **Suggest: Q2=B → Tables+10 only**, or keep the spread but bump Tables to +10.

### Issue 2 — Feasibility-only flow has almost no signal
Q1 ∈ {C, D, F} (Developer, Env consultant, Lawyer) **have no weights**, and Q2=A (feasibility / due diligence) **has no weights**. A user who answers any combination of those and "Unsure" on Q4 ends up scoring entirely off Q3+Q5, which barely differentiates products. The Step 6 "Services secondary" rule does fill the gap by inserting Services, but the *primary* card is essentially random across Attributes/Slices/Districts.

This is flagged as a placeholder in the source doc ("filled them initially as logical placeholders") so it's known. **Recommendation:** at minimum, give Q2=A something like **Attributes+5, Slices+5, Services-flag** so the primary card is meaningful. Q1=C/D/F could also nudge Parcel Reports / Slices.

### Issue 3 — Districts/Slices downsell only fires when there's a swap
Step 8 sets the downsell *note* only when it actually moves Districts below Slices. But when stable order has already put Slices ahead of Districts at a tie, the note is suppressed — even though the user is still seeing Slices instead of Districts and would benefit from the explanation. See Example 11.

**Recommendation:** trigger the downsell note whenever Q1 ∈ {C, D, E, F, G} AND Districts is in the picks AND Slices ranks at or above it AND the score gap is within 5. Decoupling the note from the swap is cleaner.

### Issue 4 — Step 5 (Q3) weights are nearly flat
C/D/E/F/G only differ by whether Rasters gets +5. The doc calls these "small points" but they're the same +5 size as Step 4 weights, which the doc treats as full-weight. In practice scope barely changes ranking outside of Rasters. If scope is supposed to be a tiebreaker rather than a primary signal, dropping these to **+2 or +3** would match the intent better.

### Issue 5 — Q2=A + parcel-area Q3 always pulls in Services
With the Step 6 services-secondary rule firing on Q1 ∈ {C, D, F, H} AND Q2 ∈ {A, F, H, I}, a developer doing feasibility (Q2=A) at a Jurisdiction or larger gets Services as their #2 card almost regardless of other answers. That's probably intentional, but it means Services will appear *very often* — likely the most common secondary card. Worth deciding if that's the goal.

### Issue 6 — Q4=Unsure has no impact
F (Unsure) gives no points. That's reasonable behavior, but combined with Q1=C/D/F blank and Q2=A blank, an "Unsure" path becomes very thin on signal. Consider giving Q4=F a small spread (e.g., Attributes+3, Slices+3) to keep the scoring from collapsing.

---

## Summary of recommendations

1. **Fill in placeholder weights** for Q1 ∈ {C, D, F} and Q2 = A.
2. **Reduce Q2=B spread** so Tables actually leads for research-leaning users.
3. **Decouple the downsell note from the swap** so it fires whenever Districts is at risk of being chosen by a non-platform user.
4. **Shrink Q3 weights to +2/+3** (or shift more variance into Q4).
