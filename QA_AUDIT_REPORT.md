# Executive Summary

MCQ Kash is not production-ready. The audit found release-blocking security/integrity risks, inconsistent guest state, incomplete routing and accessibility failures across core flows. The production build succeeds, but emits malformed-CSS and oversized-bundle warnings; the configured lint command does not run at all. Testing covered live guest flows at desktop and 320 px, direct/deep routes, route guards, empty states, DOM semantics, console output, and static inspection of authentication, rendering, economy, battle, media, and admin code. Authenticated payment, multi-user battle, Supabase failure injection, and real slow/offline network behavior could not be end-to-end validated without test accounts/backends.

**Total issues found:** 20  
**Critical:** 2  
**High:** 7  
**Medium:** 8  
**Low:** 3  
**Overall production readiness score:** **3.5/10**

## Issue #1

**Title**  
Stored HTML can execute in user-facing library and profile views

**Severity**  
🔴 Critical

**Category**  
Frontend security / Stored XSS

**Location**  
`BookmarksDashboard.jsx` saved outputs; `ProfileDashboard.jsx` saved outputs and MCQ content

**Steps to reproduce**  
Store or sync a saved output whose `html`, question, option, or explanation contains an event handler or unsafe element; open Library/Profile.

**Expected behaviour**  
Untrusted persisted content is sanitized against a strict allowlist before rendering.

**Actual behaviour**  
Persisted values are passed to `dangerouslySetInnerHTML`; `output.html` is inserted directly.

**Root cause (if inferable)**  
Rendering trusts database/local content and math-formatting output as HTML.

**Recommended fix**  
Sanitize at ingestion and rendering with a maintained sanitizer and strict tag/attribute/protocol allowlist. Store structured MCQ data rather than arbitrary HTML. Add XSS regression tests.

**Screenshots (if available)**  
Not captured; source-confirmed.

**Additional notes**  
Similar sinks exist in `FloatingNav`, `McqCard`, and admin preview. Treat every AI/database value as untrusted.

## Issue #2

**Title**  
Battle outcomes and opponent activity are decided or simulated on the client

**Severity**  
🔴 Critical

**Category**  
Logic integrity / Anti-cheat / Economy security

**Location**  
`BattleArena.jsx`

**Steps to reproduce**  
Inspect or modify runtime state/random functions during matchmaking and battle completion.

**Expected behaviour**  
Match assignment, answers, timestamps, outcomes, wagers, and rewards are server-authoritative and replay-resistant.

**Actual behaviour**  
The client uses `Math.random()` for win probability, matchmaking success, ghost opponents, scores/activity, offsets, and delays.

**Root cause (if inferable)**  
Simulation/demo logic is mixed into a competitive economy flow.

**Recommended fix**  
Move match creation, question seed, answer timing validation, result calculation, and balance mutation into transactional server functions. Sign match payloads and make settlement idempotent.

**Screenshots (if available)**  
Not applicable.

**Additional notes**  
Any coin, rank, or paid-value consequence makes this a release blocker.

## Issue #3

**Title**  
Guest KashCoin balance changes while navigating

**Severity**  
🟠 High

**Category**  
State management / Trust

**Location**  
Global header and guest economy state

**Steps to reproduce**  
As a signed-out user, navigate Home → Sign In → Bookmarks → Profile → Leaderboard.

**Expected behaviour**  
One stable guest balance is shown everywhere.

**Actual behaviour**  
Live test displayed different balances across routes (including 9, 60–62, 85–86, while Profile showed 100).

**Root cause (if inferable)**  
Multiple guest/economy initializations or route remounts update the same display independently.

**Recommended fix**  
Create one authoritative economy store, finish hydration before display, and never mutate balances during reads. Add cross-route persistence tests.

**Screenshots (if available)**  
Not captured; observed in DOM snapshots.

**Additional notes**  
This undermines confidence in wagers, rewards, pricing, and rank.

## Issue #4

**Title**  
Unknown and malformed URLs render an almost blank application

**Severity**  
🟠 High

**Category**  
Navigation / Error handling

**Location**  
`App.jsx` route table

**Steps to reproduce**  
Open `/mcq/definitely-missing` directly.

**Expected behaviour**  
A branded 404 explains the problem and offers Home/Back/Search actions.

**Actual behaviour**  
Only the splash/navigation shell appears; React Router repeatedly logs “No routes matched location”.

**Root cause (if inferable)**  
No catch-all `*` route exists.

**Recommended fix**  
Add an accessible Not Found route, preserve the requested URL for diagnostics, and ensure it cannot remain behind the splash.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
Breaks stale links, mistyped URLs, campaigns, and search-engine traffic.

## Issue #5

**Title**  
Username sign-in lookup can expose account email addresses

**Severity**  
🟠 High

**Category**  
Authentication / Privacy

**Location**  
`AuthContext.jsx` username sign-in

**Steps to reproduce**  
Submit a known username; inspect the client request to `profiles.select('email').eq('username', ...)` and error differences.

**Expected behaviour**  
Identifier resolution happens server-side and returns one generic authentication result.

**Actual behaviour**  
The browser queries a profile email before authentication, making privacy depend entirely on RLS and enabling enumeration through differing failures.

**Root cause (if inferable)**  
Username-to-email resolution is implemented in the client.

**Recommended fix**  
Use a rate-limited server endpoint/RPC that verifies username and password without returning email; normalize timing and error copy.

**Screenshots (if available)**  
Not applicable.

**Additional notes**  
Verify production RLS immediately.

## Issue #6

**Title**  
Administrative passcode is persisted in plaintext localStorage

**Severity**  
🟠 High

**Category**  
Frontend security / Credential handling

**Location**  
`AdminSubiStudio.jsx`, key `civilsKash_adminPassword`

**Steps to reproduce**  
Authenticate to Creator Studio and inspect localStorage.

**Expected behaviour**  
No reusable administrative secret is readable by JavaScript or retained indefinitely.

**Actual behaviour**  
The entered passcode is stored verbatim and replayed to verification RPCs.

**Root cause (if inferable)**  
The passcode is used as a persistent client session token.

**Recommended fix**  
Replace it with short-lived, scoped, server-issued authorization in secure HttpOnly/SameSite cookies; require re-authentication for destructive operations.

**Screenshots (if available)**  
Not captured; source-confirmed.

**Additional notes**  
Any XSS or same-origin script can steal this credential.

## Issue #7

**Title**  
Sign-in fields have no programmatic labels or autocomplete metadata

**Severity**  
🟠 High

**Category**  
Accessibility / Forms

**Location**  
Sign In page

**Steps to reproduce**  
Inspect the email/username and password inputs with a screen reader or password manager.

**Expected behaviour**  
Inputs have persistent `<label>` elements, stable names/IDs, correct `autocomplete`, and associated error text.

**Actual behaviour**  
Accessible names come only from placeholders; `name`, labels, and autocomplete values are empty.

**Root cause (if inferable)**  
Visual placeholder text substitutes for form semantics.

**Recommended fix**  
Add `label for`, `id`, `name`, `autocomplete="username"` and `current-password`; associate errors with `aria-describedby` and use `aria-invalid`.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
This impairs screen readers, autofill, password managers, and voice control.

## Issue #8

**Title**  
Direct mock route loses required state and redirects instead of restoring intent

**Severity**  
🟠 High

**Category**  
Deep linking / State restoration

**Location**  
`ExamEngineWrapper` in `App.jsx`

**Steps to reproduce**  
Open or refresh `/mcq/mock-test`, or share the URL without router state.

**Expected behaviour**  
The mock ID is encoded in the URL and the test restores after authentication/refresh.

**Actual behaviour**  
The engine depends on `location.state?.mock`; signed-out users are redirected, and the fallback key is `no-mock` with no durable test identity.

**Root cause (if inferable)**  
Essential domain state exists only in transient router memory.

**Recommended fix**  
Use `/mock-test/:mockId`, fetch/validate by ID, persist in-progress answers, and return to the exact mock after sign-in.

**Screenshots (if available)**  
Not applicable.

**Additional notes**  
Refresh/back/multi-tab reliability is at risk.

## Issue #9

**Title**  
Payment upgrades are offered while the app says the user is offline

**Severity**  
🟠 High

**Category**  
Commerce UX / State handling

**Location**  
Upgrade page

**Steps to reproduce**  
Visit `/upgrade` while signed out; observe “You're offline. Sign In to activate your plan” alongside enabled Upgrade CTAs.

**Expected behaviour**  
CTA clearly becomes “Sign in to upgrade”, preserves the chosen plan, then continues safely.

**Actual behaviour**  
Enabled purchase-looking actions coexist with a contradictory offline message.

**Root cause (if inferable)**  
Authentication state is presented but not reflected in action hierarchy/copy.

**Recommended fix**  
Gate checkout, rename CTAs by state, preserve selected SKU through auth, and make payment creation/verification server-authoritative and idempotent.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
Authenticated checkout still requires end-to-end QA.

## Issue #10

**Title**  
Core mobile header targets are below minimum touch size

**Severity**  
🟡 Medium

**Category**  
Mobile accessibility

**Location**  
Global header at 320 px

**Steps to reproduce**  
Set viewport to 320×700 and measure Streak, Notifications, and Settings buttons.

**Expected behaviour**  
Primary controls provide at least 44×44 CSS px hit areas.

**Actual behaviour**  
Live measurement found several 38×38 px controls.

**Root cause (if inferable)**  
Compact visual dimensions are also used as hit-box dimensions.

**Recommended fix**  
Increase invisible/visible hit areas to 44–48 px with adequate spacing; retest at 200% zoom.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
No horizontal overflow occurred on the tested home/sign-in view.

## Issue #11

**Title**  
Production JavaScript ships as a very large single entry chunk

**Severity**  
🟡 Medium

**Category**  
Performance

**Location**  
Production build output

**Steps to reproduce**  
Run `npm run build`.

**Expected behaviour**  
Route-level code splitting keeps first-load JavaScript focused on the current page.

**Actual behaviour**  
The entry chunk is 1,961.96 kB minified / 541.62 kB gzip. Vite warns that attempted dynamic imports in Battle Arena cannot split already-static modules.

**Root cause (if inferable)**  
All pages are statically imported in `App.jsx`; heavy admin, chart, battle, capture, and animation dependencies load eagerly.

**Recommended fix**  
Use `React.lazy` per route, isolate admin/battle/chart/payment bundles, remove ineffective dynamic imports, and add bundle budgets.

**Screenshots (if available)**  
Not applicable.

**Additional notes**  
This will materially hurt low-end Android and slow-network startup.

## Issue #12

**Title**  
Malformed global CSS selector is emitted in production

**Severity**  
🟡 Medium

**Category**  
Browser compatibility / Styling

**Location**  
Generated CSS near `input[type="text"]body`

**Steps to reproduce**  
Run `npm run build` and inspect the CSS minifier warning.

**Expected behaviour**  
Production CSS parses without warnings.

**Actual behaviour**  
esbuild reports `Unexpected "body"` for `input[type="text"]body`.

**Root cause (if inferable)**  
A missing comma or brace concatenates selectors.

**Recommended fix**  
Correct the source selector and add CSS linting/minification warnings as CI failures.

**Screenshots (if available)**  
Not applicable.

**Additional notes**  
Affected rules may be dropped differently by browsers.

## Issue #13

**Title**  
The lint quality gate is nonfunctional

**Severity**  
🟡 Medium

**Category**  
Engineering quality / CI

**Location**  
`package.json` lint script / missing ESLint configuration

**Steps to reproduce**  
Run `npm run lint`.

**Expected behaviour**  
The codebase is linted and CI fails on violations.

**Actual behaviour**  
ESLint exits 2 because it cannot find a configuration file.

**Root cause (if inferable)**  
The script exists without a checked-in config and also scans generated `dist`.

**Recommended fix**  
Add a version-compatible flat/legacy config, ignore `dist`, enable React/hooks/a11y rules, and require lint in CI.

**Screenshots (if available)**  
Not applicable.

**Additional notes**  
This allows keyboard, hook, and unsafe-rendering regressions to accumulate unnoticed.

## Issue #14

**Title**  
No global reduced-motion policy is evident despite pervasive animation

**Severity**  
🟡 Medium

**Category**  
Accessibility / Motion

**Location**  
Splash, cards, modals, particles, timers, transitions

**Steps to reproduce**  
Enable `prefers-reduced-motion: reduce` and navigate the app.

**Expected behaviour**  
Nonessential motion, spinning, pulsing, confetti, canvas particles, and parallax-like transitions are removed or reduced.

**Actual behaviour**  
Numerous `animate-*`, canvas, interval, and `transition-all` effects are present without a coherent global opt-out.

**Root cause (if inferable)**  
Motion was added component-by-component without an accessibility design token/policy.

**Recommended fix**  
Add a global reduced-motion layer and gate Framer Motion, canvas loops, confetti, and rotating copy through one preference hook.

**Screenshots (if available)**  
Not applicable.

**Additional notes**  
Also pause nonessential animation when the document is hidden.

## Issue #15

**Title**  
Focus indication is inconsistent and sometimes deliberately removed

**Severity**  
🟡 Medium

**Category**  
Accessibility / Keyboard

**Location**  
Sign-in inputs, admin inputs/editor, generated video play button, pricing styles

**Steps to reproduce**  
Navigate controls using Tab in light and dark themes.

**Expected behaviour**  
Every interactive element has a visible, high-contrast `:focus-visible` indicator.

**Actual behaviour**  
Many controls use `outline-none`; several replace it only with a subtle border-color change, while generated video controls explicitly use `outline:none`.

**Root cause (if inferable)**  
Focus styling is locally improvised rather than standardized.

**Recommended fix**  
Create a global focus-ring token, apply `focus-visible`, never suppress focus without an equivalent, and test keyboard-only flows.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
Hover-only affordances do not help keyboard or touch users.

## Issue #16

**Title**  
Practice URLs accept invalid categories and expose inconsistent naming

**Severity**  
🟡 Medium

**Category**  
Validation / Content hierarchy

**Location**  
`/mcq/:category` Practice Engine

**Steps to reproduce**  
Open an unknown or mismatched category slug (for example `/mcq/computer` if the registry uses another ID).

**Expected behaviour**  
Canonical slugs resolve, aliases redirect, and invalid categories show a clear not-found state.

**Actual behaviour**  
The app renders “computer Practice”, “0 questions available”, and “being prepared”, conflating invalid input with unpublished content.

**Root cause (if inferable)**  
Route params are not validated against the category registry before rendering.

**Recommended fix**  
Validate and canonicalize slugs, distinguish invalid/empty/loading/error states, and capitalize category display names.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
This also weakens SEO and deep-link reliability.

## Issue #17

**Title**  
Loading splash imposes delay and can mask failures

**Severity**  
🟡 Medium

**Category**  
Loading / Perceived performance

**Location**  
`AppContent` in `App.jsx`

**Steps to reproduce**  
Reload any route and observe splash lifecycle; simulate question-source or economy initialization failure.

**Expected behaviour**  
Content appears as soon as usable, with bounded loading and actionable failure recovery.

**Actual behaviour**  
The splash waits for multiple global dependencies and then adds a fixed 600 ms delay. The question loader has no catch/finally timeout, so a rejection can leave `contentReady` false indefinitely.

**Root cause (if inferable)**  
Global readiness is all-or-nothing and only models success.

**Recommended fix**  
Render route shells progressively; catch failures; provide retry/offline fallback; cap splash duration and remove artificial delay.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
The splash repeatedly appeared during direct-route testing.

## Issue #18

**Title**  
Native browser alerts are used extensively for core feedback and errors

**Severity**  
🟡 Medium

**Category**  
UX / Error handling / Accessibility

**Location**  
Creator Studio and Resurrection flows

**Steps to reproduce**  
Trigger invalid input, clipboard denial, insufficient coins, AI failure, or sync failure.

**Expected behaviour**  
Contextual, nonblocking, accessible feedback explains the error and recovery action.

**Actual behaviour**  
Dozens of paths call blocking `alert()`, including raw backend error messages.

**Root cause (if inferable)**  
No consistent error-feedback system is used in these flows.

**Recommended fix**  
Use inline errors, toasts, and confirmation dialogs with focus management; map backend errors to safe user copy and log technical detail separately.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
Browser alerts interrupt editing and are difficult to test reliably.

## Issue #19

**Title**  
Copy and capitalization are inconsistent and sometimes grammatically incorrect

**Severity**  
🟢 Low

**Category**  
Copywriting

**Location**  
Home, sign-in, practice, profile, admin

**Steps to reproduce**  
Review visible guest routes and source strings.

**Expected behaviour**  
Consistent product naming, sentence case, pluralization, and concise action labels.

**Actual behaviour**  
Examples include “MCQKash” vs “MCQ Kash”, “MCQ's” (incorrect plural), “Get me In”, “Sign In To Sync”, “computer Practice”, and “This doesnt seem to be account of Admin”.

**Root cause (if inferable)**  
No centralized content style guide or copy QA.

**Recommended fix**  
Adopt a product glossary and sentence-case rules; replace with “MCQs”, “Sign in”, “Sign in to sync”, “Computer practice”, and “This account is not an administrator”.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
Terminology such as Kash/coins/KashCoins also needs standardization.

## Issue #20

**Title**  
Home presents unavailable categories as active content in multiple hubs

**Severity**  
🟢 Low

**Category**  
Information architecture / Visual noise

**Location**  
Home — MCQ Zone and Subject Hub

**Steps to reproduce**  
Open Home as a first-time guest and scan both content sections.

**Expected behaviour**  
Available learning paths dominate; unavailable content is hidden, grouped into a roadmap, or clearly disabled.

**Actual behaviour**  
Repeated categories appear in adjacent hubs, many with vague “Some MCQ's” or “Coming Soon” labels, creating duplication and dead-end scanning.

**Root cause (if inferable)**  
Backend/catalog availability is exposed directly without editorial prioritization.

**Recommended fix**  
Merge or clearly differentiate hubs, rank available content first, hide empty categories by default, and show exact counts/progress.

**Screenshots (if available)**  
Not captured.

**Additional notes**  
“View All” repeats three times with identical accessible names; section-specific labels would improve orientation.
