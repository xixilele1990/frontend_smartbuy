# SmartBuy Frontend - Minimal Setup (Routing Ready)

A minimal React + TypeScript starter focused on collaboration. Now includes basic routing and placeholder pages, with no styles and no API layer yet.

## Quick Start

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## Project Structure

```
src/
├── App.tsx          # Router with basic routes
├── main.tsx         # App bootstrap (no global styles)
├── types/
│   └── index.ts     # Shared TypeScript interfaces
├── components/
│   ├── Navbar.tsx   # Minimal navbar using react-router Links
│   └── Footer.tsx   # Minimal footer showing project/team names
└── pages/
	├── Dashboard.tsx
	├── Profile.tsx
	└── Houses.tsx
```

## What's Included

- React + TypeScript via Vite
- Basic routing with `react-router-dom`
- Minimal `Navbar` and three placeholder pages (Dashboard, Profile, Houses)
- Reusable `Footer` component for project/team labels
- Shared types in `src/types/index.ts`
- No CSS imports (pure minimal)

## Next Steps

- [x] Initialize Vite + React + TypeScript minimal setup
- [x] Install routing: `npm install react-router-dom`
- [x] Create `Navbar` component with links
- [x] Add placeholder pages: `Dashboard`, `Profile`, `Houses`
- [x] Verify type-check (`npx tsc --noEmit`) and build (`npm run build`)
- [x] Implement Buyer Profile form on `Profile` page
- [ ] Add House list and add-house flow on `Houses`
- [ ] Create `HouseDetail` route (`/houses/:id`) placeholder
- [ ] Introduce API service when backend is ready
- [ ] Add styles (CSS modules or a utility CSS framework)

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```
