# FFL Fitness Studio

A marketing site for FFL Studio with a class schedule, booking flow, accounts, and a role-based management dashboard. The stack is JavaScript/JSX throughout (no TypeScript) with a small Express + PostgreSQL API.

## Stack

- [React 19](https://react.dev) + [Vite 8](https://vite.dev) + [React Router](https://reactrouter.com)
- [Tailwind CSS v4](https://tailwindcss.com) (configured in `client/src/index.css`)
- [Express 5](https://expressjs.com) + [`pg`](https://node-postgres.com)

## Features

- Public class schedule with transactional booking and printable confirmation.
- Login, signup, logout, and persistent httpOnly cookie sessions.
- Three roles:
  - **member** — public site and class booking. New signups always get this role.
  - **manager** — trainer accounts. Can manage classes and bookings from `/admin`.
  - **admin** — full access: trainers, classes, bookings, plans, users, and roles.
- Admin dashboard at `/admin` with role-aware tabs.
- Admin-created trainer accounts are automatically linked to the trainer profile and given the `manager` role.
- Members see their own bookings in a header menu, refreshed immediately after booking.
- Days with three or more classes switch from a grid to a swipeable slider; coaches autoplay in a carousel that pauses on hover, focus, or from the pause button.

## Structure

```
client/
  index.html
  vite.config.js          Dev proxy: /api -> http://localhost:3000
  .env.example            VITE_API_URL for split deployments
  src/
    main.jsx              React entry point + BrowserRouter
    App.jsx               Routes and auth provider
    index.css             Tailwind theme tokens, custom utilities, print rules
    data.js               Static copy: nav, stats, services, hours, social...
    api.js                Credential-aware JSON API client
    auth/
      AuthContext.js      Auth context + useAuth hook
      AuthProvider.jsx    Session bootstrap, login/signup/logout
    hooks/useFetch.js     GET hook with loading/error state and refetch
    hooks/useCarousel.js  Scroll-snap carousel: arrows, autoplay, pause state
    components/
      SiteLayout.jsx      Header, routed main outlet, footer, hash scrolling
      Panel.jsx           Shared section wrapper (id, kicker, title, reveal)
      Header.jsx          Fixed nav, auth links, member bookings, mobile menu
      CarouselArrows.jsx  Previous/next controls shared by both carousels
      MemberBookings.jsx  Member booking menu (desktop) and list (mobile)
      Hero.jsx            Hero section and social proof
      MainPage.jsx        Composes the content sections
      About.jsx           Intro copy, stats and gym video
      Services.jsx        Service cards
      Why.jsx             Accordion of benefits
      Schedule.jsx        Weekly schedule; grid or slider plus booking flow
      SpotsStepper.jsx    Controlled spot counter used by Schedule
      Trainers.jsx        Autoplay coach carousel (API)
      Plans.jsx           Membership tiers (API)
      Cta.jsx             Free-trial call to action
      Footer.jsx          Hours, contact and social links
    pages/
      Home.jsx            Public landing page
      Login.jsx           Login form
      Signup.jsx          Member signup form
      Admin.jsx           Protected manager/admin dashboard
      admin/              Classes, bookings, trainers, plans and users panels
server/
  index.js                Express app and API routes
  auth.js                 Sessions, cookie helpers, role middleware
  passwords.js            scrypt password hashing and verification
  db.js                   PostgreSQL pool
  schema.sql              Tables + migrations (capacity, users, sessions, links)
  seed.js                 Creates schema, clears data and seeds everything
  seed-users.js           Non-destructive schema + demo user upsert
  seed-data.js            Classes, trainers, plans and demo accounts
  .env.example            Database + CORS + session/cookie config
```

## Getting started

Create a PostgreSQL database, then:

```bash
cd server
cp .env.example .env     # fill in DATABASE_URL
npm install
npm run seed

cd ../client
npm install
```

Run the API and the Vite dev server in two terminals:

```bash
# terminal 1
cd server
npm run dev              # http://localhost:3000

# terminal 2
cd client
npm run dev              # http://localhost:5173
```

`npm run seed` resets the classes, trainers, plans, users, sessions and bookings tables, then reseeds demo data. If you already have live bookings, use `npm run seed:users` instead: it applies the schema and upserts the demo accounts without clearing classes, trainers, or bookings.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ffl.com` | `Admin123!` |
| Manager (trainer) | `amara@ffl.com` | `Trainer123!` |
| Manager (trainer) | `idris@ffl.com` | `Trainer123!` |
| Manager (trainer) | `lena@ffl.com` | `Trainer123!` |
| Member | `member@ffl.com` | `Member123!` |

These are demo credentials from `server/seed-data.js`. Change them before using this outside a demo deployment. Running `npm run seed:users` re-applies the demo passwords and roles.

### Scripts

Client (`cd client`):

```bash
npm run dev      # start Vite
npm run build    # production build to client/dist
npm run preview  # preview the production build
npm run lint     # run ESLint
```

Server (`cd server`):

```bash
npm run dev        # node --watch index.js
npm start          # production start
npm run seed       # create/migrate tables and reset all demo data
npm run seed:users # create/migrate tables and upsert demo accounts only
```

## Auth and roles

Passwords are hashed with Node's built-in `crypto.scrypt` and per-user random salts. Successful login creates a random session token, stores only its SHA-256 hash in `sessions`, and sets an httpOnly `ffl_session` cookie. Sessions expire after `SESSION_TTL_DAYS` (default 7).

- Public signup always creates a `member`.
- Only an admin can change roles or delete users.
- Managers can create, edit, and delete classes and bookings.
- Admins can additionally manage trainers, plans, users, and create trainer accounts with the `manager` role.
- Public booking remains available, but bookings made while signed in are linked to the user via `bookings.user_id`.

Relevant server environment variables:

```bash
DATABASE_URL=postgresql://user:password@host/dbname
CLIENT_ORIGIN=http://localhost:5173,http://localhost:4173
PORT=3000
SESSION_TTL_DAYS=7
COOKIE_SAMESITE=lax
```

`COOKIE_SAMESITE` is `lax` by default for same-origin deployments. For a split-origin deployment, set it to `none` and serve both sites over HTTPS; the cookie is then marked `secure` automatically.

## API

Public routes:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/classes` | All classes with `spots` (places left) and `capacity` |
| GET | `/api/trainers` | All coaches |
| GET | `/api/plans` | All membership plans |
| POST | `/api/bookings` | Reserve spots; decrements availability transactionally |

Auth routes:

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create a `member` account and start a session |
| POST | `/api/auth/login` | Verify credentials and start a session |
| POST | `/api/auth/logout` | Delete the current session |
| GET | `/api/auth/me` | Return the current user, or `null` |

Manager/admin routes (session required):

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/api/bookings` | manager/admin | List bookings with their classes |
| POST | `/api/classes` | manager/admin | Create a class |
| PUT | `/api/classes/:id` | manager/admin | Update a class |
| DELETE | `/api/classes/:id` | manager/admin | Delete a class without bookings |
| DELETE | `/api/bookings/:id` | manager/admin | Cancel a booking and restore spots |
| POST | `/api/trainers` | admin | Create a trainer, optionally with a manager login |
| PUT | `/api/trainers/:id` | admin | Update a trainer profile |
| DELETE | `/api/trainers/:id` | admin | Delete a trainer profile |
| POST/PUT/DELETE | `/api/plans/:id?` | admin | Manage membership plans |
| GET | `/api/users` | admin | List users |
| PATCH | `/api/users/:id` | admin | Change a user's role |
| DELETE | `/api/users/:id` | admin | Delete a user |

`POST /api/bookings` body:

```json
{
  "name": "Alex Doe",
  "email": "alex@example.com",
  "items": [{ "classId": 1, "spots": 2 }]
}
```

The endpoint locks the selected class rows, rejects overbooking with `409`, writes the booking and its items, and returns a reference such as `FFL-1A2B3C4D5E6F`. Invalid input returns `400`; unknown classes return `404`. When a session cookie is present, the booking is also linked to that user.

Admin-created trainer body:

```json
{
  "name": "New Coach",
  "role": "Strength & Conditioning",
  "img": "trainer-amara.webp",
  "bio": "Short profile for the public team section.",
  "email": "coach@ffl.com",
  "password": "at-least-8-characters"
}
```

Omit `email` and `password` to create a profile-only trainer. If both are supplied, the trainer gets a linked `manager` account.

## Editing content

- Classes, trainers, plans and demo accounts live in `server/seed-data.js`. Edit them there and run `npm run seed`; the client loads them from the API.
- `spots` is the number of places still open; `capacity` is the class size. The schedule progress bar labels are derived from both.
- Navigation, stats, services, benefits, opening hours and social links are static in `client/src/data.js`.
- In the running app, managers/admins can edit classes and bookings, and admins can edit trainers, plans and users from `/admin`.

## Deploying

**Single origin (default):** run `npm run build` in `client`, then `npm start` in `server`. Express serves `client/dist` and falls back to `index.html` for client-side routes. No client env var is needed. The session cookie works with the default `COOKIE_SAMESITE=lax`.

**Separate origins:** deploy the API and the static client separately. Set `VITE_API_URL` in the client build environment (for example `https://api.example.com`), set `CLIENT_ORIGIN` on the server to a comma-separated list of allowed client origins, and set `COOKIE_SAMESITE=none` over HTTPS. CORS is enabled for those origins with credentials.

## Images

Static assets live in `client/public/images`. The avatars in the hero are served as small WebP files (160×160); keep new thumbnails near that size. Prefer WebP/AVIF for photos and keep hero imagery under a few hundred kilobytes.
