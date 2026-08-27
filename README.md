# FAFSA Application Form

An accessible, validated web form for entering FAFSA (Free Application for Federal
Student Aid) data. Four guided steps, validation as you go, a review before
submitting, and a clear summary of anything that needs fixing.

Built with React 19, TypeScript, Vite, and Mantine. Validation is schema-driven with
Zod and wired into the form through react-hook-form.

The reasoning behind every design choice is in **[DECISIONS.md](./DECISIONS.md)**.

## Requirements

- **Node.js 20 or newer** (developed on 22)
- npm 10+ (ships with Node 20/22)

## Install and run

```bash
npm install
npm run dev
```

The dev server prints its URL — **http://localhost:5173** unless that port is taken.

```bash
npm test           # run the full test suite once
npm run build      # type-check and bundle to dist/
npm run preview    # serve the production build
```

## All scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot module replacement |
| `npm start` | Alias for `npm run dev` |
| `npm test` | Run the suite once (CI mode) |
| `npm run test:watch` | Re-run affected tests on change |
| `npm run test:coverage` | Coverage table plus an HTML report in `coverage/` |
| `npm run build` | `tsc -b` then a production bundle in `dist/` |
| `npm run preview` | Serve the built bundle at http://localhost:4173 |
| `npm run typecheck` | Types only, no bundling |
| `npm run check` | typecheck + tests + build — the full gate |
| `npm run clean` | Remove `dist/`, `coverage/`, and `*.tsbuildinfo` |

Arguments pass straight through to Vitest:

```bash
npm test -- src/domain/schema           # only files under this path
npm test -- -t "at least 14 years old"  # only tests whose name matches
```

## Trying it out

The form walks through four steps — student information, status, household and
finances, review — then confirms. To exercise the validation, the sample data from
the assignment maps onto the fields like this.

**A valid application** (advances cleanly to the review step):

| Field | Value |
| --- | --- |
| First / last name | Jane / Smith |
| Social Security number | `123456789` — hyphens are added as you type |
| Date of birth | `2003-05-15` |
| State of legal residence | California |
| Dependency / marital status | Dependent / Single |
| Number in household / college | 4 / 1 |
| Your income / parent income | 5000 / 65000 |

**An application that breaks every rule.** Enter SSN `invalid`, a date of birth of
`2015-01-01`, leave the state unselected, choose Dependent and Married, leave the
spouse fields and parent income empty, and enter a household of 2 with 5 in college
and an income of `-1000`. Each step refuses to advance and lists everything wrong at
the top; every entry in that summary is a link that jumps focus to its field.

**Keyboard only.** The whole form can be completed without a mouse — Tab between
fields, arrow keys within the Dependent/Independent and Single/Married groups, Enter
or Space to activate buttons and summary links.

## Testing

196 tests run on Vitest in jsdom. Every one is black-box: they find elements by
accessible role, label, and visible text, and drive them with `user-event`. None
assert on class names, test ids, or internal state.

```bash
npm test
npm run test:coverage && open coverage/index.html
```

Accessibility is asserted, not assumed — `jest-axe` scans every step, the error
state, the revealed conditional fields, the review, and the confirmation. Note that
jsdom cannot check colour contrast (it has no layout engine); that was verified
separately with axe-core in Chrome. See
[Accessibility testing](./DECISIONS.md#accessibility-testing) for what was and was
not covered.

## Project structure

Every unit — page, component, wizard step, domain module — lives in its own folder
with its source, its test, and its CSS module together, re-exported through an
`index.ts`.

```
src/
  App.tsx  main.tsx  theme.ts       # entry, providers, Mantine theme overrides
  styles/global.css
  domain/                           # framework-free logic
    schema/                         # Zod schema — the single source of validation
    format/                         # age, currency, SSN and date formatting
    states/                         # US states, DC and territories
  components/                       # reusable across the project
    ControlledTextInput/  ControlledSsnInput/  ControlledDateInput/
    ControlledNumberInput/  ControlledCurrencyInput/
    ControlledRadioGroup/  ControlledNativeSelect/
    ErrorSummary/                   # role="alert" list; links focus their field
    ErrorBoundary/
  pages/
    FafsaApplicationPage/
      wizard/
        FafsaWizard.tsx             # step state, focus management, submission
        steps.ts                    # step definitions and field labels
        useFormDraft/               # sessionStorage draft (never stores an SSN)
        useFocusField.ts
        steps/
          StudentInfoStep/  StatusStep/  HouseholdFinanceStep/
          ReviewStep/  ConfirmationStep/
  test/                             # setup and shared render helpers
```

**Where to look first:**

- `src/domain/schema/schema.ts` — all seven validation rules, in one place.
- `src/pages/FafsaApplicationPage/wizard/FafsaWizard.tsx` — step gating, focus
  management, and how the error summary is wired.
- `src/components/ErrorSummary/` — the summary and its focus-moving links.

## Configuration

| File | Purpose |
| --- | --- |
| `vite.config.ts` | Vite plugins plus the Vitest and coverage config |
| `tsconfig.json` | Project references |
| `tsconfig.app.json` | TypeScript for `src/` |
| `tsconfig.node.json` | TypeScript for Node-side files |
