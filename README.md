# FAFSA

FAFSA — Free Application for Federal Student Aid.

A web form for collecting FAFSA application data, built with React 19,
TypeScript, Vite, and Mantine. Validation is schema-driven (Zod) and wired into
the form through react-hook-form.

**Status:** the domain layer (validation schema, formatting, state list) and the
controlled input components are in place and tested. `FafsaApplicationPage` is
still a heading-only stub — the multi-step form UI is the work in progress.

## Tech stack

| Concern    | Choice                                       |
| ---------- | -------------------------------------------- |
| UI         | React 19 + Mantine 9                         |
| Language   | TypeScript 5.7                               |
| Build/dev  | Vite 7                                       |
| Forms      | react-hook-form + `@hookform/resolvers`      |
| Validation | Zod 4                                        |
| Tests      | Vitest 4 + Testing Library + jest-axe (a11y) |

## Prerequisites

- **Node.js >= 20** (enforced via `engines`; developed on Node 22)
- npm 10+ (ships with Node 20/22)

## Getting started

```bash
git clone <repo-url>
cd FAFSA
npm install
npm run dev
```

`npm run dev` starts the Vite dev server with hot module replacement at
**http://localhost:5173**. Vite picks the next free port if 5173 is taken — check
the URL it prints. To expose the server on your local network, run
`npm run dev -- --host`.

## Running the project

### Development

```bash
npm run dev        # dev server with HMR at http://localhost:5173
npm start          # alias for `npm run dev`
```

### Production build

```bash
npm run build      # type-checks with `tsc -b`, then bundles to dist/
npm run preview    # serves the built dist/ at http://localhost:4173
```

`npm run build` fails on any TypeScript error, so a green build also means a
clean type-check. Output lands in `dist/` (git-ignored) and is a static bundle —
deploy it to any static host.

## Running tests

The suite runs on Vitest in a jsdom environment. No server needs to be running.

```bash
npm test           # run the whole suite once (CI mode)
npm run test:watch # re-run affected tests on file change
npm run test:coverage
```

### Targeting specific tests

Extra arguments are passed straight through to Vitest:

```bash
npm test -- src/domain/schema          # only files matching this path
npm test -- -t "rejects an invalid SSN" # only tests whose name matches
npm run test:watch -- src/domain/format
```

### Coverage

`npm run test:coverage` prints a per-file table and writes an HTML report to
`coverage/` (git-ignored). Open `coverage/index.html` to browse it:

```bash
npm run test:coverage && open coverage/index.html
```

Coverage uses the V8 provider over `src/**/*.{ts,tsx}`, excluding `src/main.tsx`,
`src/test/**`, and barrel `index.ts` files. Configuration lives in
`vite.config.ts`.

### Test layout and helpers

Tests sit next to the code they cover as `*.test.ts` / `*.test.tsx`:

- `src/domain/format/format.test.ts` — date parsing and age calculation
- `src/domain/schema/schema.test.ts` — Zod validation rules
- `src/domain/states/states.test.ts` — US state list and lookups
- `src/pages/FafsaApplicationPage/FafsaApplicationPage.test.tsx` — page rendering
  and accessibility

Two shared files support them:

- `src/test/setup.ts` — loaded before every test file. Registers
  `@testing-library/jest-dom` and `jest-axe` matchers, and stubs the browser APIs
  jsdom lacks but Mantine expects (`matchMedia`, `ResizeObserver`,
  `scrollIntoView`).
- `src/test/renderWithProviders.tsx` — renders a component inside
  `MantineProvider` with the app theme. Use it instead of Testing Library's bare
  `render` for anything that touches Mantine components.

Accessibility assertions use `jest-axe`, so a rendered view that introduces an
a11y violation will fail its test.

## Other scripts

```bash
npm run typecheck  # tsc -b --noEmit, no bundling
npm run check      # typecheck + tests + build — the full pre-push gate
npm run clean      # remove dist/, coverage/, and *.tsbuildinfo
```

## Project structure

```
src/
  main.tsx                    # entry point: mounts <App> into #root
  App.tsx                     # MantineProvider + page composition
  theme.ts                    # Mantine theme overrides
  styles/global.css           # global styles
  domain/                     # framework-free logic, each with its own tests
    format/                   # date parsing, age calculation
    schema/                   # Zod schema, form value types, defaults
    states/                   # US state codes and names
  components/                 # react-hook-form-controlled Mantine inputs
    ControlledCurrencyInput/
    ControlledDateInput/
    ControlledNativeSelect/
    ControlledNumberInput/
    ControlledRadioGroup/
    ControlledSsnInput/
    ControlledTextInput/
  pages/
    FafsaApplicationPage/     # the application form page (stub)
  test/                       # setup and shared render helpers
```

The form state is intentionally **flat** rather than nested — it keeps
react-hook-form registration, per-step field lists, and error-summary lookups
simple. The plan documented in `src/domain/schema/schema.ts` is to map it to the
nested shape the API expects at submit time, in a `toApplicationPayload` helper
that is not written yet.

Each folder exposes a barrel `index.ts`, so import from the folder
(`import { ControlledTextInput } from './components/ControlledTextInput'`) rather
than reaching into the implementation file.

## Configuration files

| File                 | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `vite.config.ts`     | Vite plugins plus the Vitest `test` and `coverage` config   |
| `tsconfig.json`      | Root project references                                     |
| `tsconfig.app.json`  | TypeScript config for `src/`                                |
| `tsconfig.node.json` | TypeScript config for Node-side files (e.g. `vite.config.ts`) |
