# SmartBuy Frontend - Minimal Day 1 Setup

A minimal React + TypeScript starter focused on collaboration. 

## Quick Start

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## Project Structure

```
src/
├── App.tsx        # Minimal landing component
├── main.tsx       # App bootstrap (no global styles)
├── types/         # Shared TypeScript interfaces
│   └── index.ts
├── components/    # Reusable components (empty, add as needed)
└── pages/         # Page components (empty, add as needed)
```

## What's Included

- React + TypeScript via Vite
- Basic `App.tsx` welcome content
- Shared types in `src/types/index.ts`
- No CSS imports (pure minimal)
- No external deps beyond React/ReactDOM

## Next Steps

1. Install routing: `npm install react-router-dom`
2. Create `Navbar` and basic routes
3. Build pages: Dashboard, Profile, Houses, Detail
4. Add API layer when backend is ready
5. Introduce styles (CSS modules or utility CSS)

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```
