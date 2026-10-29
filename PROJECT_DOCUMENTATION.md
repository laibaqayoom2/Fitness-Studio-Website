# FFL Fitness Studio — Project Documentation

A full-stack fitness studio website: public marketing site, member area with
class booking and Stripe checkout (Test mode), and a role-gated admin
dashboard. Built as two apps in one repository.

---

## 1. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + Vite 8, Tailwind CSS 4, react-router-dom |
| Backend | Node.js, Express 5, no ORM — raw SQL via `pg` |
| Database | PostgreSQL (Neon in this deployment) |
| Payments | Stripe Checkout, Test mode, webhook-driven order confirmation |
| Auth | Cookie sessions (`httpOnly`), scrypt password hashing |
| Tooling | ESLint (client), Vitest (server), Zod env validation, Helmet, CORS, express-rate-limit |

* Client served at `http://localhost:5173` (dev) → proxies `/api` to the API at `http://localhost:3000`.
* All secrets live in `.env` files (git-ignored); only `*.env.example` templates are committed.

## 2. Repository layout

```
ffl-fitness-studio/
├── client/                      # React app (Vite)
│   ├── index.html               # + inline pre-render theme bootstrap (no FOUC)
│   └── src/
│       ├── main.jsx / App.jsx   # Router: layout + routes + role guards
│       ├── index.css            # Tailwind theme tokens + .light overrides + @custom-variant dark/light
│       ├── api.js               # fetch wrapper (apiGet/apiPost/apiPut/apiPatch/apiDelete)
│       ├── auth/AuthContext.jsx # session state: /api/auth/me, login/signup/logout
│       ├── theme/               # ThemeProvider, useTheme (localStorage: 'ffl-theme')
│       ├── data.js              # nav, hours, social, topics, WHY, SERVICES, STATS
│       ├── hooks/               # useFetch, useCarousel
│       ├── components/          # Header, Footer, Hero, About, Services, Why, Trainers,
│       │                        # Schedule (+ SpotsStepper), Plans, Contact, Panel,
│       │                        # CarouselArrows, AnimatedNumber, Toast(+Provider),
│       │                        # Notifications, MemberBookings (shared booking list)
│       ├── pages/               # Home, Login, Signup, Account, CheckoutSuccess,
│       │                        # CheckoutCancelled, Admin + admin/* panels + ui.jsx + styles.js
│       └── utils/image.js       # client-side photo resize/compress for trainer photos
└── server/                      # Express API
    ├── index.js                 # all routes, body-parser split, webhook raw-body route
    ├── config.js                # Zod-validated env (fails fast w/ clear error)
    ├── errors.js / auth.js      # error classes; session create/destroy, attachUser, requireAuth, requireRole
    ├── passwords.js             # scrypt hash/verify
    ├── db.js                    # pg pool (DATABASE_URL)
    ├── schema.sql               # idempotent DDL for every table
    ├── migrate.js               # applies schema.sql without touching data (npm run migrate)
    ├── seed.js / seed-users.js / seed-data.js   # full reset | demo accounts | demo content
    ├── stripe.js                # Stripe client, Checkout Session, webhook signature/event logic
    ├── orders.js                # checkout validation, totals, order persistence
    └── *.test.js                # Vitest: auth, orders logic, stripe logic, DB integration (gated)
```

## 3. Roles & auth

* **Roles:** `member`, `manager`, `admin`. Admin-only content: messages, trainers, plans, users panels. Manager+admins: overview, classes, bookings.
* Sessions are `httpOnly` cookies with a signed id; TTL `SESSION_TTL_DAYS` (7 default). `attachUser` resolves the session on every request; `requireAuth` → 401; `requireRole(...)` → 403.
* Passwords: scrypt with per-user salt; never returned by any endpoint.
* Rate limiting on `/api/auth/login` and `/api/auth/signup` (20 / 15 min).

## 4. Class booking (members only)

* Public schedule shows all classes; **spot selection is disabled while signed out** and a prompt links to login/signup. Identity always comes from the session (the modal shows "Booking as …", no guest name/email fields).
* `POST /api/bookings` validates selected spots, then **transactionally** decrements `classes.spots` so two members can never book the same last spot.
* Booking confirmation arrives as server data (reference + items), echoed in the Notifications dropdown and on `/account`, and a hidden print-only portal is injected for a printable confirmation.

## 5. Membership plans & Stripe checkout (Test mode)

Payment flow — the browser redirect is never treated as proof of payment:

1. `POST /api/orders/checkout` (auth): accepts only `{ planId, quantity }`; loads the plan from the DB; computes `unit_amount` in **cents** (`price × 100`); creates a `pending` order snapshotting plan name/price/quantity at purchase time; asks Stripe to create a Checkout Session; returns `checkoutUrl`. If the session fails, the pending row is deleted so retries start clean. Without `STRIPE_SECRET_KEY`: honest `503`.
2. Browser redirects to Stripe's hosted page (card data never touches this server).
3. `POST /api/webhooks/stripe`: raw body + `stripe.webhooks.constructEvent` → only `checkout.session.completed` / `async_payment_succeeded` with `payment_status === 'paid'` can flip an order to `paid` (expired sessions → `canceled`). Transitions apply to still-`pending` rows only, so **duplicate deliveries are idempotent**.
4. `/checkout/success` polls `GET /api/orders/:id` (max 10 × 3 s) to learn the *verified* status, then stops.

Security invariants:

* `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are server-only env values, never in the client bundle.
* Totals are computed from the DB row — client fields (`price`, `total`, `userId`, …) are parsed out and discarded (unit-tested tamper attempts).
* `GET /api/orders/:id` scopes ownership in SQL; another user's order reads as a 404, never 403.
* Local webhook setup (secret is **per `stripe listen` session** — update `.env` + restart whenever the listener restarts):
  ```powershell
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  # copy printed whsec_... into server/.env (STRIPE_WEBHOOK_SECRET), restart server
  ```

### Membership model shown to members

`/account` treats a paid order as a 30-day membership from `paid_at`: card shows plan, price, member-since, and the renewal date; past that date it flips to "Renewed — renew your plan →" (display-only; nothing is cancelled server-side).

## 6. Notifications & account (member UX)

* Header bell (all signed-in users) derived **client-side** from `/api/bookings/mine` + `/api/orders/mine`: confirmed bookings, purchased memberships, pending payments. Unread badge + **Clear all** persist a per-user timestamp in `localStorage['ffl-notifications-cleared-<userId>']` — items newer than it count as unread; no DB changes.
* Header name → **account dropdown**: My bookings & membership (`/account`), Dashboard (manager+), Log out. Mobile menu exposes the equivalent "My account" link.
* `/account`: membership summary card + booking history (shared `BookingList`).

## 7. Theming system

* The site is dark-first. `<html>` receives `.dark` or `.light`:
  * an inline script in `client/index.html` sets the class before first paint from `localStorage['ffl-theme']` (falling back to `prefers-color-scheme`, default dark) — no flash of wrong theme;
  * `ThemeProvider` (client/src/theme) keeps React state in sync and persists toggles.
* Tokens live in `client/src/index.css`: `ink/panel/panel-alt/card/cta/brand/soft/muted/line` flip under `.light`, and Tailwind's `@custom-variant light` enables paired classes. Convention when adding UI: **variable tokens flip automatically; literal colors need an explicit `light:` pair** (e.g. `text-white light:text-gray-900`, `bg-white/5 light:bg-black/5`). White text over photo/video overlays is intentionally unpaired.

## 8. Admin dashboard (`/admin`)

* `OverviewPanel`: totals (bookings, occupancy, open spots, resources, users) + **Payments card** — how many members have paid, how many checkouts are pending; 7-day booking trend, top classes by fill, today's classes.
* Tabbed panels share common styles (`styles.js`) and UI atoms (`ui.jsx`): classes CRUD, bookings browser + CSV export, messages inbox, trainers CRUD (with client-side photo compression), plans CRUD (price is whole dollars; featured plan styling), users management with role changes and self-deletion protection.

## 9. Database schema (all DDL idempotent)

| Table | Purpose / notable constraints |
| --- | --- |
| `users` | identity + `role` CHECK (member/manager/admin), scrypt hash |
| `sessions` | hashed session ids for cookie lookup |
| `classes` | schedule: day CHECK, time, capacity; `spots` is live availability |
| `trainers` | profiles, optional linked login |
| `plans` | products: name, **price = whole dollars**, note, perks, featured, button style |
| `bookings` / `booking_items` | member reservations; items reference classes with spot counts |
| `contact_messages` | enquiry inbox (`status` new/read) |
| `orders` | checkout orders: `reference` UNIQUE, `user_id` FK→users (cascade), `status` CHECK (pending/paid/canceled), `stripe_session_id` UNIQUE, `amount_total` in **cents**, `paid_at` |
| `order_items` | purchase-time snapshot: plan FK (restrict), plan_name, quantity, unit_amount (cents) |

Never reset data by hand: `npm run migrate` applies DDL only; `npm run seed` truncates + reseeds demo content; `npm run seed:users` upserts demo accounts only.

## 10. API reference (summary)

Public: `/api/classes` (GET), `/api/trainers` (GET), `/api/plans` (GET), `/api/contact` (POST, rate-limited + honeypot).
Auth: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
Member (auth): `POST /api/bookings`, `GET /api/bookings/mine`, `POST /api/orders/checkout`, `GET /api/orders/mine`, `GET /api/orders/:id` (owner-scoped).
Staff (manager+/admin): `/api/classes` (POST/PUT/DELETE), `/api/bookings` admin list, `/api/contact` (PATCH/DELETE), `/api/trainers` (POST/PUT/DELETE), `/api/plans` (POST/PUT/DELETE), `/api/users` (list/PATCH role/DELETE), `/api/dashboard`.
Stripe: `POST /api/webhooks/stripe` (signature-verified; raw body).

## 11. Testing

```
cd server && npm test            # Vitest: auth, checkout validation/tamper, webhook signature
# optional DB-integration suite (owners, idempotent marking, real Neon):
$env:TEST_DATABASE_URL = (Get-Content server/.env | Select-String '^DATABASE_URL=(.*)$').Matches[0].Groups[1].Value
$env:DATABASE_URL = $env:TEST_DATABASE_URL; npx vitest run
cd client && npm run lint && npm run build
```

Unit tests cover: `requireAuth` gating; checkout input rejection (non-int, `'2'`, `true`, oversized); client-supplied price fields ignored; totals only from the DB row; webhook HMAC verification (valid/tampered/wrong/missing); duplicate-event idempotency; async-payment & expiry mapping. Integration tests (self-cleaning users) cover ownership 404 semantics and real `pending → paid` transitions.

## 12. Environment

`server/.env` (see `server/.env.example`):

```
DATABASE_URL=postgresql://…        # Neon in this deployment
CLIENT_ORIGIN=http://localhost:5173,http://localhost:4173
PORT=3000
SESSION_TTL_DAYS=7
COOKIE_SAMESITE=lax
STRIPE_SECRET_KEY=sk_test_…        # optional; empty => checkout answers 503
STRIPE_WEBHOOK_SECRET=whsec_…      # optional; from the current `stripe listen` session
```

## 13. Runbook

```powershell
cd client ; npm install ; npm run dev     # http://localhost:5173
cd server ; npm install ; npm run migrate ; npm run dev   # http://localhost:3000
stripe listen --forward-to localhost:3000/api/webhooks/stripe   # keep running; update whsec_ + restart on each new session
```

## 14. Known limitations

* Stripe Test mode/local development only (`sk_test_` keys committed nowhere; real keys not on file) — Stripe does not currently support businesses registered in Pakistan; production payment support would require a supported entity or an alternative PSP for Pakistan (e.g. PayFast/JazzCash/Flutterwave).
* Notifications are client-derived; "cleared" state is per-browser (`localStorage`), not synced across devices.
* Webhook delivery requires the Stripe CLI listener on localhost; if unavailable, payments stay `pending` until a reconciliation pass mirrors the webhook (server-side, Stripe-verified).
