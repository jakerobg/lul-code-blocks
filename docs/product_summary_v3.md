# Product Selector v3 — Summary, Test Cases & Issues

**v3 change:** Zoning Attributes has been removed as a product. All Attributes references — overrides, weights, card cross-references, and tie-order — are gone.

---

## Products (final card content)

| Product | Unit | Delivered as | CTA |
|---|---|---|---|
| Parcel Reports | Single parcel (address/coordinates) | PDF | Buy now |
| Zoning Districts | Zoning district(s), base + overlay | CSV (+ geospatial add-on) | Request a quote |
| Zoning Rasters | 30×30 m raster cell | GeoTIFF | Request a quote |
| Zoning Slices | Unique base+overlay district combination | CSV (+ geospatial add-on) | Request a quote |
| Zoning Tables | Jurisdiction, census tract, block group, etc. | CSV (+ geospatial add-on) | Request a quote |
| Services | Custom geographies | Custom analysis | Get in touch → landuselabs.com/services |

Tie order: **Parcel Reports → Slices → Tables → Rasters → Districts** (Services last, inserted by rule).

---

## Question Flow

Same as v2 — Q1 (8 options, single-select), Q2 (10 options, max 3), Q3 (7 scopes, single), Q4 (6 depths, single), Q5 (3 use modes, multi). Q3–Q5 are skipped if Q2 includes E (specific-property lookup).

---

## Step-by-Step Logic

### Step 1 — Hard overrides
First match wins.

| Override | Condition |
|---|---|
| **Parcel Reports** | Q2 includes E **OR** Q3 = A (Single parcel) |
| **Zoning Tables** | Q1 ∈ {E, G} **AND** Q2 includes C |

The two former Attributes overrides (Q1=A with D/H/I + Q3 ∈ {B–G}, and Q1 ∈ {A, B} with Q5 ∈ {B, C}) are **gone** with Attributes.

### Step 2 — Q1 (role) weights

| Q1 | Score |
|---|---|
| A — GIS platform admin | Slices +5 |
| B — Data aggregator | Tables +5, Slices +5 |
| **C — Developer / RE pro** | *(none)* |
| **D — Env / planning consultant** | *(none)* |
| E — Government | Tables +5 |
| **F — Lawyer** | *(none)* |
| G — Researcher | Tables +10 |
| **H — Site selection pro** | *(none)* — was Attributes-only |

### Step 3 — Q2 (goal) weights

| Q2 | Score |
|---|---|
| **A — Feasibility / due diligence** | *(none)* |
| B — Statistical / policy research | Tables +5, Slices +5, Districts +5, Rasters +5 |
| C — Demographic cross-tabs | Tables +10 |
| **D — Enhancing a data pipeline** | *(none)* — was Attributes +10 |
| E — Specific-property lookup | *(hard override)* |
| F — Selecting sites | Slices +5, Rasters +5 |
| G — District-specific rules | Districts +10 |
| H — Prevailing rules across an area | Slices +10 |
| I — Prevailing rules parcel-by-parcel | Slices +5 |
| J — Visualizing land use / environment | Rasters +10 |

### Step 4 — Q4 (zoning depth) weights

| Q4 | Score |
|---|---|
| A — Just residential / nonresidential | Rasters +10 |
| B–E — anything more detailed | Slices +5, Districts +5 |
| F — Unsure | *(none)* |

### Step 5 — Q3 (geographic scope) weights

| Q3 | Score |
|---|---|
| A — Single parcel | *(hard override)* |
| B — Census tract / block group | Tables +5 |
| C — Jurisdiction(s) | Slices +5, Districts +5 |
| D–G — County, CBSA, State, Country | Slices +5, Districts +5, Rasters +5 |

### Step 6 — Special rules

1. **Services secondary** if Q1 ∈ {C, D, F, H} AND Q2 includes any of {A, F, H, I}.
2. **Rasters supplemental** if Q1 ∈ {A, H} AND Q2 includes H.
3. **License note** if Q5 includes B or C.
4. **Geographic-cap note** if Q3 ∈ {E, F, G}.
5. **Rasters fallback** — if Q2 includes H and Rasters didn't make the threshold, append it.

### Steps 7–8 — Sort + Districts/Slices downsell
Highest score wins; ties broken by stable order (Slices before Districts). If Q1 ∈ {C, D, E, F, G} AND Districts and Slices are within 5 points, swap so Slices wins; attach the downsell note.

### Steps 9–10 — Pick & render
Top score sets the cutoff; products at ≥60% of top are included, max 3. Then Services and Rasters are inserted per Step 6. First card "Top recommendation" / "Recommended"; second "Also consider"; third "Complementary".

---

## Worked Examples

### 1. Lawyer single property — `F / [E] / – / – / –`
Q2=E hard override → **Parcel Reports**.

### 2. Government cross-tabs — `E / [C] / F / – / [A]`
Q1=E + Q2=C override → **Zoning Tables** (+ cap note).

### 3. GIS admin doing pipeline work, jurisdiction — `A / [D] / C / B / [A]`
- Q1=A: Slices+5
- Q2=D: nothing
- Q3=C: Slices+5, Districts+5
- Q4=B: Slices+5, Districts+5

Final: **Slices=15, Districts=10**. Picks: Slices, Districts.

### 4. Aggregator redistributing — `B / [D] / G / B / [B]`
- Q1=B: Tables+5, Slices+5
- Q2=D: nothing
- Q3=G: Slices+5, Districts+5, Rasters+5
- Q4=B: Slices+5, Districts+5

Final: **Slices=15, Districts=10, Rasters=5, Tables=5**. Picks: Slices, Districts (+ license + cap notes).

### 5. Researcher policy research — `G / [B] / F / F / [A]`
- Q1=G: Tables+10
- Q2=B: Tables+5, Slices+5, Districts+5, Rasters+5
- Q3=F: Slices+5, Districts+5, Rasters+5
- Q4=F: nothing

Final: **Tables=15**, Districts=10, Rasters=10, Slices=10. ✅ This was a problem in v2 (Attributes tied with Tables); now Tables clearly leads.
**Picks:** Tables, Slices, Rasters (+ cap note).

### 6. Site selector full-area feasibility — `H / [F, H] / E / E / [A]`
- Q2=F: Slices+5, Rasters+5
- Q2=H: Slices+10
- Q3=E: Slices+5, Districts+5, Rasters+5
- Q4=E: Slices+5, Districts+5

Final: **Slices=25**, Districts=10, Rasters=10. Step 6 fires services secondary (Q1=H, Q2 includes F/H) and rasters supplemental (Q1=H, Q2=H).
**Picks:** Slices, Services, Rasters (+ cap note).

### 7. Lawyer wanting district info — `F / [G] / F / E / [A]`
- Q2=G: Districts+10
- Q3=F: S/D/R +5
- Q4=E: S+5, D+5

Final: **Districts=20**, Slices=10, Rasters=5. Gap > 5 → no downsell.
**Picks:** Districts (+ cap note).

### 8. Developer feasibility only — `C / [A] / C / B / [A]`
- Q1=C: nothing
- Q2=A: nothing
- Q3=C: Slices+5, Districts+5
- Q4=B: Slices+5, Districts+5

Final: **Slices=10, Districts=10**. Tie → Slices first by stable order. Step 6 services secondary fires (Q1=C, Q2=A).
**Picks:** Slices, Services, Districts. ⚠️ See issue #1.

### 9. Pipeline + parcel-by-parcel, county — `C / [D, I] / D / B / [A]`
- Q2=D: nothing
- Q2=I: Slices+5
- Q3=D: Slices+5, Districts+5, Rasters+5
- Q4=B: Slices+5, Districts+5

Final: **Slices=15**, Districts=10, Rasters=5. Services secondary (Q1=C, Q2=I).
**Picks:** Slices, Services, Districts.

### 10. Env consultant visualizing — `D / [J] / F / F / [A]`
- Q2=J: Rasters+10
- Q3=F: S+5, D+5, R+5

Final: **Rasters=15**, Districts=5, Slices=5. Threshold=9 → only Rasters clears.
**Picks:** Rasters (+ cap note).

### 11. Lawyer mixed G+H — `F / [G, H] / C / E / [A]`
- Q2=G: Districts+10
- Q2=H: Slices+10
- Q3=C: Slices+5, Districts+5
- Q4=E: Slices+5, Districts+5

Final: **Districts=20, Slices=20**. Tie → Slices wins via stable order. Step 6 services secondary (Q1=F, Q2=H). Rasters fallback fires (Q2=H but Rasters not in picks).
**Picks:** Slices, Services, Rasters. Districts pushed out by Services + Rasters insertion. ⚠️ See issue #3.

### 12. All-rules all-uses Lawyer + G — `F / [G] / C / E / [A]`
- Q2=G: Districts+10
- Q3=C: S+5, D+5
- Q4=E: S+5, D+5

Final: **Districts=20**, Slices=10. Gap > 5 → no downsell.
**Picks:** Districts.

---

## Issues / Things to Flag

### Issue 1 — Q2 = A (Feasibility / due diligence) has no weights
Same gap as v2. Still a placeholder. Combined with empty Q1=C/D/F weights, a feasibility-only flow scores entirely from Q3+Q4, which always award both Slices and Districts equally → 10/10 tie. The result is "Slices, Services, Districts" by tie-order, which is reasonable, but it's coming from no real signal. **Suggested fill:** Q2=A → Slices+5 (the prevailing-rules product is the natural feasibility tool); also bump Q1=C/D +3 toward Slices.

### Issue 2 — Q2 = D (Enhancing a data pipeline) has no weights
This is **new in v3**. D used to be Attributes +10 — the strongest single signal in the doc. With Attributes removed, D now contributes nothing, so a user who picks "I'm enhancing a data pipeline" gets no signal from that selection. **Suggested fill:** Q2=D → Slices+10 (the data product most readily piped into a downstream system).

### Issue 3 — Q1 = H (Site selector) has no weights
Also new — H was Attributes+5 only. Site-selection users lose their role nudge entirely. **Suggested fill:** Q1=H → Slices+5.

### Issue 4 — Slices and Districts often tie at 10
Q3 (C–G) and Q4 (B–E) both award Slices and Districts the same amount. Without Attributes acting as a separate target, anyone whose primary signal is "I want regulations" splits evenly between the two. The tie-order resolves to Slices, which is usually the right call for non-platform users (and the downsell rule reinforces it). But it means the score-based ranking doesn't really distinguish the two. **Suggested fix:** make Q4=B/C/D give Slices+5 and Districts+3 (or similar asymmetric weights). Same for Q3=C–G.

### Issue 5 — The downsell note still doesn't fire when Slices already leads via stable order
Same as v2 issue #3. See Example 11: Districts and Slices tied at 20, Slices wins via stable order, no swap happens, no downsell note. The user could still benefit from the explanation. **Suggested fix:** trigger the downsell note whenever the tie-break (or the stable-order win) puts Slices over Districts for non-platform users.

### Issue 6 — Q4 = Unsure has no impact
Unchanged from v2. Combined with the empty Q1/Q2 cells, "Unsure" paths can collapse to almost no signal.

### Issue 7 — Step 5 (Q3) weights still flat across most scopes
C/D/E/F/G barely differ. Same call as v2 — consider dropping these to +2/+3 to reduce their share.

---

## Summary of recommendations

1. **Fill in placeholders** for Q1 ∈ {C, D, F, H}, Q2 ∈ {A, D}.
2. **Asymmetric Slices/Districts weights** in Q3/Q4 so they don't always tie.
3. **Decouple downsell note from swap** — fire whenever Slices is at or above Districts at a tie/near-tie for non-platform users.
4. **Shrink Q3 weights** if scope is meant to be a tiebreaker rather than a primary signal.
