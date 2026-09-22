# LUL header — local styling workspace

Extracted styling for the Squarespace header so it can be restyled outside Squarespace.

## Files

| File | What it is |
|---|---|
| `lul_header.html` | Header markup copied from the live site (source of truth for classes) |
| `header.css` | **Generated.** Squarespace's styling, filtered to rules that match the header |
| `../styles/lul.css` | **Yours.** Palette, type scale and the header restyle, one file. Loaded after `header.css`. (Was `styles/lul.css`, merged in on 2026-09-21.) |
| `header_preview.html` | **Generated.** Standalone preview wiring the three together |
| `tools/extract-header-css.mjs` | The extractor |
| `tools/refresh.sh` | Re-download the live CSS and regenerate `header.css` |

## Preview locally

    cd header && python3 -m http.server 8899
    # open http://localhost:8899/header_preview.html

Use a server, not `file://` — the relative stylesheet links need HTTP.

## How the extraction works

`header.css` is not a copy of Squarespace's CSS. The extractor builds a test DOM from
`lul_header.html` and keeps only rules whose selectors actually match it, then pulls in
the custom properties those rules reference (transitively). 1.7 MB of Squarespace CSS
reduces to ~27 KB.

The test DOM reproduces the live ancestor chain:

    html.js.flexbox… > body.<tweak classes> > div#siteWrapper.site-wrapper > header#header

That `#siteWrapper` wrapper matters — rules like button padding are scoped to
`#siteWrapper.site-wrapper .sqs-button-element--secondary` and silently fail to match
without it. Keep it in any page where you use this CSS.

## Restyling

Put everything in `styles/lul.css` (header rules live in its header section). To apply it on the real site, paste the same
text into Squarespace: **Design -> Custom CSS**. That loads after Squarespace's own
stylesheets, so ordering is on your side — but two things still bite.

### 1. Set variables on `#header`, not `:root`

The `<header>` has `data-section-theme="white-bold"` and redefines the theme variables
**on itself**. Custom properties resolve from the nearest element, so a `:root`
definition never reaches the header no matter what order it loads in. Verified:

| Override | Result |
|---|---|
| `:root { --navigationLinkColor: red }` | **no effect** |
| `#header { --navigationLinkColor: red }` | works |
| `[data-section-theme="white-bold"] { ... }` | works |

    #header {
      --navigationLinkColor: hsla(257, 17%, 24%, 1);
      --headerBorderColor:   hsla(257, 17%, 24%, 0.15);
    }

### 2. For plain rules, mind specificity

Squarespace's nav colour comes from `:not(.header--menu-open) .header-nav-wrapper a`,
specificity (0,2,1). Loading later does not help a weaker selector:

| Override | Specificity | Result |
|---|---|---|
| `.header-nav-wrapper a` | (0,1,1) | **loses** |
| `#header .header-nav-wrapper a` | (1,1,1) | wins |

Prefixing with `#header` beats essentially everything Squarespace ships and avoids
`!important`.

Never hand-edit `header.css` — `refresh.sh` overwrites it.

## Testing on a single page first

Two ways to try the restyle on one page before rolling it site-wide.

### Scope it to the page's body id (works on any plan)

Every Squarespace page carries a unique `collection-<id>` as the `<body>` id. Prefixing
every rule with it confines the CSS to that one page. `tools/scope-to-page.mjs` does the
prefixing for you:

    node tools/scope-to-page.mjs collection-6a41d45bb52a355c76fed701 > /tmp/scoped.css

Get the id by opening the page and running `document.body.id` in the browser console.
Paste the output into **Design → Custom CSS**, check the page, then delete it and paste
the unscoped `styles/lul.css` when you're happy. Verified live: the scoped CSS applied
on `/services` and did nothing on `/reports`.

Known ids at time of writing:

| Page | body id |
|---|---|
| / | `collection-6a71f5420bbecb7190894ebe` |
| /services | `collection-6a41d45bb52a355c76fed701` |
| /reports | `collection-6a8c7a17d42095173e77e2b5` |
| /sectors | `collection-6a885836bdef7e5ea069fe9c` |
| /about | `collection-6aa0321526969a76a7ca3b83` |

### Page Header Code Injection (Business plan and above)

Pages → the page → ⚙ Settings → Advanced → **Page Header Code Injection**, and paste
`styles/lul.css` wrapped in `<style>…</style>`. No scoping needed — it only loads on
that page. Simpler, but the menu is not available on Personal plans.

Note the header is shared across the whole site, so either way you are testing the *same*
header under different CSS — there is no way to give one page a genuinely different header
without this kind of scoping.

## Design-system sources

The CTA is not styled from Squarespace's button variables. It follows the project's own
component — `buttons/BUTTONS_SECONDARY_TERTIARY.html`, the `--tertiary` variant:

| | Design system | Squarespace's tertiary |
|---|---|---|
| padding | `10px 26px` | `0.6rem 2.2rem` (9.6 × 35.2px) |
| font-size | `1rem` | `0.9rem` |
| ink | `#393348` | `#393348` |
| style | filled, hover lifts to `#4c4460` | outline, fills on hover |

The two inks were unified on 2026-09-21. The design system previously used `#393347`
and Squarespace's tertiary `#393348`; they are now both `#393348`, which is what 166 of
the repo's 183 `rgba()` ink tints already spelled out as `57, 51, 72`.

`--lul-ink` is the single source for every dark surface in the header — the CTA fill, the
menu hover state, and the card border/shadow tints (via `--lul-ink-rgb`, the same colour in
`r, g, b` form for `rgba()`). If the component changes, update the ink variables at the top
of `styles/lul.css` and everything follows.

## Squarespace Custom CSS constraints

Squarespace compiles the Custom CSS panel server-side, and its compiler **evaluates
colour functions and `calc()` at build time**. Anything computed from a `var()` fails.
When it fails the whole stylesheet is replaced by an error report, so *nothing* applies
live — while the editor panel, which previews the raw CSS client-side, still looks right.
That mismatch is the tell.

Rejected:

    rgba(var(--ink-rgb), .15)     Function rgba requires at least 4 args, found 2
    calc(var(--w) * .6)           Operation * cannot be applied to FUNCTION_CALL
                                  and DIMENSION

Safe:

    rgba(57, 51, 72, 0.15)        literal, four plain arguments
    var(--lul-chevron-h)          plain substitution, no maths

So: every derived value is written out as its own variable rather than computed. If you add
rules, keep `var()` out of `calc()` and out of `rgba()`/`hsla()`.

**To check whether a paste actually published**, fetch the live `custom.css` — its URL is in
the page source, `static1.squarespace.com/static/custom-css/.../custom.css`. If it comes back
a few hundred bytes of ASCII art plus a `Line / Statement` report, it failed to compile and
the report names the offending line.

## Header code injection (JavaScript)

`nav-folder-links.js` goes in **Settings → Advanced → Code Injection → Header**. It makes the
Products and Sectors folder titles navigate on desktop click while still opening the folder
on mobile. It replaces an earlier version that matched on label text
(`textContent.trim() === 'PRODUCTS'`) and silently stopped working once the labels were
renamed to "Products" / "Sectors".

It keys off `aria-controls` (`products`, `sectors`) instead, which Squarespace derives from
the folder and does not change when you rename a label.

Do **not** use the button's own `data-href` — it points at the folder's first child, not the
landing page: `/product` redirects to `/reports`, `/sector` to `/developers`.

## Known gaps

- **The active-page underline is a background gradient, not a border.** Squarespace paints it
  with `background-image: linear-gradient(...)`, `background-size: 1px 1px`, `repeat-x` — so
  `text-decoration: none` and `border: none` do nothing. `styles/lul.css` clears it with
  `background-image: none`. Note it is painted on *different elements* depending on the page:
  the `<a>` for a top-level page, but the inner `.header-nav-folder-title-text` span when a
  folder parent is active, so both have to be covered.

- **Casing is not touched by the CSS.** Nav labels render exactly as typed in Squarespace
  (Pages → navigation title). An earlier version lowercased them via CSS; that was removed
  so it cannot fight the real labels.

- **The selected state cannot be seen in the preview** (the captured markup has no active
  page), but it was verified against the live site by injecting the rules into
  `/services` and `/reports`. Squarespace marks it four ways, all of which the CSS handles:
  a top-level page gets `.header-nav-item--active`; a submenu page marks *both* the parent
  folder (`.header-nav-item--active` + `aria-current="true"`) and the item itself
  (`.header-nav-folder-item--active` + `aria-current="page"`); the overlay menu uses
  `.header-menu-nav-item--active`.

- **Dropdown markers are drawn in CSS, not markup.** Squarespace injects a stroked chevron
  (`<use href="#openArrowHead">`) with JavaScript. A path's shape cannot be restyled from
  CSS, so `styles/lul.css` hides that SVG and draws a small filled triangle with
  `::after` + `clip-path`. This is why it works when pasted into Custom CSS — an earlier
  version added `<svg class="lul-chevron">` to `lul_header.html`, which only ever appeared
  in the local preview and did nothing live. Knobs: `--lul-chevron-w`, `--lul-chevron-gap`.
  Note the CSS hides `.header-dropdown-icon`, the wrapper span, not just the `<svg>` —
  the wrapper is ~18px wide with its own margin and would otherwise hold that space open.
- **State-dependent rules are not extracted.** The matcher tests selectors against the static
  markup, so rules keyed on runtime state — `[aria-expanded="true"]`, `.header--menu-open`,
  `.header-nav-item--active` — are skipped when the captured markup does not carry that state.
- Fonts come from Google Fonts (Inter) in the preview, not Squarespace's font CDN.
- Header behaviour that depends on Squarespace JS (mobile menu toggle, scroll states) will
  not work in the preview — only the styling is reproduced.
