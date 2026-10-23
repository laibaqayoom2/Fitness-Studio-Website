# FFL Fitness Studio

A single-page marketing site for FFL Studio, a fitness and personal training gym. Built with React, Vite and Tailwind CSS, with a small client-side class-booking demo.

## Stack

- [React 19](https://react.dev)
- [Vite 8](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com) (configured in `src/index.css`)

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## Structure

```
src/
  main.jsx              React entry point
  App.jsx               Page shell: skip link, header, main, footer
  index.css             Tailwind theme tokens, custom utilities, print rules
  data.js               All copy and programme data (nav, classes, plans...)
  hooks/reveal.js       Scroll-reveal via IntersectionObserver
  components/
    Panel.jsx           Shared section wrapper (id, kicker, title, reveal)
    Header.jsx          Fixed nav with mobile menu
    Hero.jsx            Hero section and social proof
    MainPage.jsx        Composes the content sections
    About.jsx           Intro copy, stats and gym video
    Services.jsx        Service cards
    Why.jsx             Accordion of benefits
    Schedule.jsx        Weekly class schedule and booking flow
    SpotsStepper.jsx    Controlled spot counter used by Schedule
    Trainers.jsx        Coach profiles
    Plans.jsx           Membership tiers
    Cta.jsx             Free-trial call to action
    Footer.jsx          Hours, contact and social links
```

## Editing content

Most copy lives in `src/data.js`: navigation, stats, services, schedule, trainers, plans, opening hours and social links. Update the arrays there rather than editing components. Classes include `spots` (places still open) and `capacity`; the schedule progress bar and labels are derived from those.

## Booking flow

`src/components/Schedule.jsx` keeps all booking state in memory: pick a day, choose spots per class, then review and confirm in a native `<dialog>`. A confirmation can be printed; a print-only confirmation is rendered through a portal and the site itself is hidden by print styles in `src/index.css`.

## Images

Static assets live in `public/images`. The avatars in the hero are served as small WebP files (160×160); keep new thumbnails near that size. Prefer WebP/AVIF for photos and keep hero imagery under a few hundred kilobytes.
