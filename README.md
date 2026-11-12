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

## Colors

All brand colors live in `src/index.css` under `@theme` ("Haldi & Dhania"). Change them there and every page follows.

## Structure

```
src/
  components/   Navbar, Footer, Logo, ChefCard, SafeImage, Reveal, Doodles
  pages/        Home (done), ComingSoon (placeholder for pages not built yet)
  constants/    cities, images (free Unsplash photos)
  lib/api.js    Axios instance with cookies (withCredentials)
```

Photos: [Unsplash](https://unsplash.com/license) (free to use).
