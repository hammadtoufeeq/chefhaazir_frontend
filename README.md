# Chef Haazir — Frontend

*Ghar se door, ghar ka khana.* React frontend for [chefhaazir_backend](https://github.com/hammadtoufeeq/chefhaazir_backend).

React 19 + Vite, Tailwind CSS 4, React Router, React Query, Axios, Framer Motion.

## Run locally

```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

The backend must be running for live data (the chefs section on Home). Its `CLIENT_URL` must be `http://localhost:5173`.

## Deploy on Vercel

1. Vercel → Add New → Project → import `chefhaazir_frontend`.
2. Framework preset: Vite (detected automatically).
3. Environment variable: `VITE_API_URL` = your deployed backend URL + `/api`.
4. Deploy. `vercel.json` sends every route to `index.html` so page refreshes work.

## Colors and fonts

All brand colors live in `src/index.css` under `@theme`: **rust** (brand accent) and **sage** (primary actions) on a cream background. Fonts: Newsreader (headings) and Manrope (text).

## Structure

```
src/
  components/   Navbar, CityPicker, Footer, Logo, ChefCard, SafeImage, Reveal, Icon
  context/      AuthContext (GET /auth/me, logout), CityContext (city picked in the navbar)
  pages/        Home (done), ComingSoon (placeholder for pages not built yet)
  constants/    cities, cuisines (same lists as the backend), images (free Unsplash photos)
  lib/          api.js (Axios with cookies + automatic token refresh), time.js (Pakistan time, slots)
```

Chefs have no photo in the backend, so each chef card shows a dish from the chef's main cuisine.

Photos: [Unsplash](https://unsplash.com/license) (free to use).
