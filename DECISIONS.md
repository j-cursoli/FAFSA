# Design decisions

The choices behind this form, why I made them, and what each cost. Where the brief left a
question open, my reasoning is here rather than only in the code.

## Framework and libraries

| Choice | Why |
| --- | --- |
| **React + TypeScript + Vite** | React is in your stack. TypeScript makes the form's shape and the conditional rules checkable at compile time. Vite gives a fast dev loop and doubles as the test runner's config. |
| **Mantine** | Its inputs have accessibility built in and keep the UI consistent: `error` sets `aria-invalid` and links the message via `aria-describedby`, `label` renders a real `<label for>`, `Radio.Group` gives a `fieldset`/`legend` with native radios. Hand-writing that is where accessibility bugs get introduced. I chose this library over say material due to its simplicity and the timeframe of the project, ive used material in the past but didnt want to battle its css overrides or other issues it can come with even though it may be a more complete component library. |
| **react-hook-form** | `trigger()` on a subset of fields is exactly what per-step validation needs. It's also uncontrolled by default — though honestly, splitting the form into steps already makes re-renders cheap, so pre-optimising for that wouldn't be worth much even on lower-powered mobiles. |
| **Zod** | One schema expresses field and cross-field rules together, and it's the single place a new rule gets added. It's also the leading tool for runtime schema validation. |
| **Vitest + Testing Library + jest-axe** | Same config as the build, and Testing Library's role/label queries let me black-box test components rather than testing implementation details. I have been a long time fan of Kent Dodds (the maker of testing library) and also share the same testing philosphy which testing library enables. |

**Dependencies I chose not to add.** I could have pulled in a library for date, currency and
number formatting. In a real production app I probably would, since it'd be used
application-wide rather than by one form — here it would have been weight for not much gain. Also if i didnt have an ai agent I would have brought one in to save time, but agents are pretty good at simple validations and formatting.

## Layout: multi-step wizard

Four steps — **Applicant, Dependency, Finances, Review** — then a confirmation.

Fourteen fields across five topics is a lot to face at once, especially on mobile where errors
stack up and the scrolling gets painful. Steps keep each screen to one topic and let the
conditional branches appear in context instead of making a long page jump around. Accordion
sections would also have worked, but I found the wizard cleaner on mobile, with less layout
shift.

**Review** exists because a wizard hides earlier answers. Everything is shown back with
per-section Edit links before submitting. The SSN appears in full: it's the last chance to
catch a typo, and masking it here would defeat the purpose.

## State management

Local state via react-hook-form — no Redux, Zustand, or context beyond RHF's `FormProvider`.
I've used RHF on other forms and it's been good to work with. The alternative was plain local
state threaded down to each component, which would have been tedious, and error and touched
state would have bloated it into something hard to reason about.

This is one form on one page whose state dies when it's submitted, and nothing else reads it.
A store would add indirection with nothing to show for it.

**Form values are flat**, not nested to match the sample payload. Flat names keep field
registration, per-step field lists, and the error summary's lookups trivial. Mapping to the
nested API shape belongs at the network boundary, not in the form.

## Validation

All seven rules live in **one Zod schema** (`src/domain/schema/schema.ts`), so adding an eighth
is one block in one file.

**Everything sits in `superRefine`; the base schema only checks shape.** This is the least
obvious decision here and the most important. Zod skips refinements when the underlying schema
fails, so a `.regex()` on the SSN would abort the parse and suppress every cross-field error —
the user fixes one problem, submits, and is shown the next. A permissive base plus one
`superRefine` reports every outstanding problem in a single parse, which is what the brief's
invalid sample is designed to catch.

| # | Rule | Notes |
| --- | --- | --- |
| 1 | Student at least 14 | Age is computed against an injectable reference date, so the boundary is testable and the tests can't rot. A birthday today counts as reached; future dates get their own message rather than reading as age zero. |
| 2 | SSN format `XXX-XX-XXXX` | The field masks as you type, so the value always matches the format the message asks for. |
| 3 | Parent income required if dependent | Shares the `requiresParentIncome` predicate with the UI. |
| 4 | Income cannot be negative | Zero is valid, and distinct from "not answered yet". |
| 5 | College ≤ household | The message quotes both numbers back and names both ways out. |
| 6 | Valid US state | Includes DC and the territories — their residents are eligible for federal aid. |
| 7 | Spouse details required if married | Shares `requiresSpouseInformation` with the UI; the spouse SSN is format-checked too. |

**Numeric fields don't clamp.** Typing `0` into "number in household" stays `0` with an
explanation rather than silently becoming `1`. Rewriting input behind someone's back hides the
mistake instead of teaching it.

**Timing: on first blur, then live** (`mode: 'onTouched'`). Validating mid-typing scolds people
before they've finished — `J` isn't yet an invalid first name. Waiting for submit hides
problems until the end, which in a wizard means learning about step 1 while looking at step 4.
Pressing Next validates the whole step, catching fields never visited.

## Error presentation

**Both inline and summary**, because they solve different problems. Inline tells you what's
wrong with the field in front of you. The summary at the top of the step tells you how much is
left and gets you there — each entry is a link that moves focus to its field, so a keyboard
user reaches the problem in one keystroke instead of tabbing back through the form.

The summary carries `role="alert"`, which is what makes a refused Next perceivable rather than
a silent failure. Focus goes to the summary rather than the first bad field, so the user sees
the whole picture before being dropped into one input. It shows only errors on the current
step — being told about a problem three steps away, with no way to see it, isn't actionable.

## Conditional fields

Spouse fields appear when marital status is Married; parent income when dependency is
Dependent.

- **Unmounted, not hidden.** A `display: none` field can still be caught by validation, and
  blocking submission on a field nobody can see is a dead end.
- The schema asserts them **only when they apply**, using the same predicates the components
  use to decide what to render — one definition of "applies", not two that can drift.
- Their appearance is **announced** politely. A screen reader user who picks "Married" is
  several tab stops above the new inputs and wouldn't otherwise know the form grew.
- Values are **kept** when toggling back and forth, so an accidental click doesn't destroy
  typing.

## Accessibility

Target **WCAG 2.1 AA**, semantics first: a real `<form>` and `<label for>`, `fieldset`/`legend`
for radio groups, native radios, a native `<select>` for the state list, `<dl>` for the review.

Two deliberate choices of native controls over prettier ones:

- **`<input type="date">` for date of birth** — already keyboard operable and correctly
  announced, opens the platform picker on mobile, no popover to trap focus. A calendar is the
  wrong shape for a birth date anyway; nobody wants to page back twenty years. Like I mentioned above I didnt want to spend time vetting for a a11y friendly component.
- **`NativeSelect` for the state list** — for 56 options the native control gives type-ahead,
  full keyboard support and the platform's own mobile picker, with no listbox ARIA to get
  wrong. A custom combobox would look better and possibly behave worse. I didnt vet the component librarys dropdown to verify. 

**Focus is moved wherever it would otherwise be lost:** to the new step's `<h2>` on advancing,
to the error summary when Next is blocked, to the named field when a summary link is activated,
and to the confirmation heading on submit.

**Announcements.** The visible step counter *is* the live region, so a screen reader user hears
exactly what a sighted user reads instead of the step being announced twice.

**Colour is never the only signal** (1.4.1): errors carry text, and summary links are
permanently underlined since colour alone wouldn't identify them inside error text.
**Contrast**: three Mantine defaults fell short of 4.5:1 — dimmed text used by every
field description, error messages, and summary links on the alert background — all overridden
in `src/theme.ts`. **Focus indicators** are never removed, only replaced with ones
meeting 3:1.

Also addressed: 1.3.1, 2.1.1 keyboard, 2.4.6, 2.5.5 target size (≥44px), 3.2.2, 3.3.1, 3.3.2
(SSN format and the age requirement stated up front, before the user can get them wrong), 3.3.3,
1.4.10 reflow at 320px, and `prefers-reduced-motion`.

### How I tested it

- **axe-core in the test suite** across six states — clean form, error state, each step,
  revealed conditional fields, review, confirmation. The error state is scanned separately
  because alerts and `aria-invalid` wiring only exist after validation fails.
- **axe-core in Chrome against the running app**, which is what caught the contrast failures.
  jsdom has no layout engine, so contrast rules never run there — a suite that only runs in
  jsdom will report a clean bill of health on a page that fails AA. In the browser: **0
  violations across every state**.
- **Keyboard operation**, asserted in tests rather than by hand alone: Tab reaches every
  control, arrow keys move within radio groups, Tab moves past a group as one stop, summary
  links move focus to their field, and the form completes without a mouse.

**Not tested: a real screen reader.** The ARIA is derived from the specifications and verified
structurally, but no assistive technology has been driven over this form. That's the honest
gap — automated tools catch maybe a third of accessibility problems, and the announcement
phrasing on the conditional reveals is where I'd expect real testing to change something.

## Responsive design

Fluid from 320px, no fixed widths. On narrow screens the step indicator stacks vertically
rather than wrapping into a ragged block, review rows put the label above its value, the
Back/Next buttons go full width, and the step panel goes edge to edge. `inputMode` is set on
SSN and numeric fields so touch devices raise a number pad.

## Testing strategy

**205 tests, all black-box.** They query by accessible role, label and visible text and drive
interaction with `user-event`. None assert on a class name, test id, internal state or prop — a
good test here would still pass after the internals were rewritten. It also means the tests
double as accessibility checks: if a control can't be found by its accessible name, the test
can't find it either.

Layered as **domain** (the schema against the brief's own valid and invalid payloads, plus
focused cases per rule), **components** (each field as a user meets it, inside a real form
wired to the real schema), **wizard** (step gating, error summary, focus management, and
end-to-end journeys for the dependent/single and independent/married paths), and
**accessibility** (axe across every state).

Writing tests first paid for itself — it caught a currency formatter dropping the second
decimal on amounts with cents, the kind of thing that reads fine in review.

## Production concerns

- **Error boundary** around the form: a render crash shows an explanation and says plainly that
  nothing was submitted. Leaving someone unsure whether their application went through is worse
  than the crash.
- **Draft persistence** to `sessionStorage` as the user types, so a refresh doesn't cost them
  their work — but **Social Security numbers are never written to storage**. They're the most
  damaging field here to leak and would outlive the moment the user is looking at the form;
  re-typing nine digits is a fair price. The draft dies with the tab and is cleared on submit,
  and the loader restores only keys the form actually has, so a tampered draft can't inject
  fields.
- **`autoComplete="off"` on SSN fields** — browsers shouldn't fill a government identifier from
  a saved profile, and a wrong autofilled SSN is worse than an empty one.

## Assumptions

Submission is simulated (`onSubmit` hands over the values; the confirmation says plainly that
nothing was sent). Included territories as legal residence unsure if they should be included. Household and college counts
are whole numbers ≥ 1. Income accepts cents and has no upper bound which we would need one if went to prod to prevent possible issues in the API. English, US locale only.

## Known limitations

- **No screen reader testing** — the most significant gap. i dont have a decent one installed I know I could use google VOX but ran out of time to do screen reader testing. 
- **No progressive enhancement.** This is a client-rendered SPA; with JavaScript disabled,
  nothing renders. Fixing it properly means server-rendering and validating server-side — the
  same schema would work in both places, so the path exists, but it's a different architecture. 
- **`<input type="date">` renders differently across browsers** and forces a locale-driven
  display format. That's the trade for its accessibility and mobile behaviour; a segmented
  three-part input would be the next thing to try. I could have gone with a react based date component but didnt want to spend the time vetting them for a11y issues. 
- **Draft persistence is per-tab and unencrypted** — on a shared machine, a small but real
  exposure. Production would persist server-side against an authenticated session.
- **The 320px layout was verified in the browser**, not on physical hardware.
- **No rate limiting, CSRF protection or server-side validation.** Client-side validation is a
  convenience, never a security boundary.

## Effort and AI use

I built this using Claude. I started at about 8:20pm finished the code at about 10pm and spend the next 40ish minutes updating this document and manual testing. 
