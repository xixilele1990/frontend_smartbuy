# SmartBuy Frontend - Buyer Preference & Property Management

A React + TypeScript application for home buying decision support. Features buyer profile management, property tracking, and SmartScore ranking system. Built with Vite and React Router, no external styling.

## Quick Start

### Frontend Only (Development)
```bash
npm install
npm run dev
```

App runs at http://localhost:5173

### With Backend Integration
1. **Start Backend** (see [Backend Setup](#backend-integration))
   ```bash
   cd /path/to/smartbuy-backend
   ./gradlew bootRun
   ```

2. **Configure Frontend**
   ```bash
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:8080" > .env
   ```

3. **Start Frontend**
   ```bash
   npm install
npm run dev
   ```

## Project Structure

```
src/
├── App.tsx          # Router entry point
├── main.tsx         # App bootstrap
├── types/
│   └── index.ts     # Shared TypeScript interfaces (UserProfile, House, etc.)
├── components/
│   └── Footer.tsx   # Global footer
├── services/
│   ├── api.ts           # Base HTTP client with session management
│   ├── profileService.ts  # Profile CRUD with backend API + DTO mapping
│   └── houseService.ts    # House CRUD with ATTOM API integration
└── pages/
    ├── Dashboard.tsx # Home: Profile summary, Properties preview
    ├── Profile.tsx   # Buyer preferences form with backend persistence
    └── Houses.tsx    # Property management (add/delete) with ATTOM data
```

## Data Flow

### Dashboard Workflow
1. User visits Dashboard → loads profile from backend API, shows Profile Summary + Properties
2. Profile Summary Card displays: budget, target bedrooms/bathrooms, priority mode
3. Properties section shows list of added houses
4. SmartScore Rankings: user selects mode (Balanced/Budget Driven/Safety First/Education First) and clicks "Calculate SmartScore"
5. Dashboard calls `/api/score/batch-from-attom` for all properties → returns scores for each dimension
6. Results display: total score + expandable details showing dimension scores, summary, and warnings

### Profile Workflow
7. User navigates to Profile → loads existing profile if exists
8. User fills Profile form + saves → POST to `/buyerProfile` → persists to backend database
9. Form validates: budget ≥ 0, bedrooms/bathrooms ≥ 0, priority mode selected
10. User can delete profile (confirmation dialog)

### Houses Workflow
11. User navigates to Houses → can add properties by address
12. User enters address + submits → `addHouse()` → calls ATTOM API via backend → returns property data
13. Backend returns: beds, baths, rooms, AVM value, school data, crime index
14. Properties stored in **localStorage** (not persisted to backend yet)
15. User can click "View Details" on any property → displays:
    - Property basics: address, beds, baths, rooms, estimated value
    - **Schools**: Institution name, type, grades, distance, rating, student count, teacher ratio
    - **Crime Index**: Overall crime score for the area
    - **Map**: Embedded map showing property location (via Nominatim)
16. User can delete individual properties or clear all (with confirmation)

### Session Management
- Auto-generated `sessionId` stored in localStorage on first visit
- All API calls include `sessionId` for user identification
- Backend uses `sessionId` to persist data across sessions

## Progress Checklist

### Completed ✅
- [x] Initialize Vite + React + TypeScript setup
- [x] Install routing: `react-router-dom`
- [x] Add Dashboard, Profile, Houses pages
- [x] Implement Buyer Profile form with validation
- [x] Create API service layer (`api.ts`)
- [x] Add session management (auto-generate `sessionId`)
- [x] Integrate Profile with backend API (DTO mapping)
- [x] Update Dashboard to load profile from backend
- [x] Create houseService.ts with ATTOM API integration
- [x] Update Houses.tsx to fetch real property data from ATTOM
- [x] Add CORS support in backend (HouseController)
- [x] Add scoringService.ts and integrate Score API
- [x] Update Dashboard to manually calculate SmartScore on button click
- [x] Display SmartScore results with user-entered addresses
- [x] Handle ATTOM score errors with friendly messaging
- [x] Implement loading states and error handling
- [x] Clean up unused code and optimize imports
- [x] Push all changes to GitHub
- [x] Add house detail viewer with school & crime data
- [x] Integrate Nominatim/OpenStreetMap for property location mapping
- [x] Handle ATTOM detailed property data (AVM value, schools, crime)
- [x] Implement scoringService.ts with batch scoring API

### In Progress ⏳
- [ ] Persist houses to backend database (currently local-only)
- [ ] Implement house deletion on backend

### Future Features 🚀
- [x] Implement actual SmartScore calculation with real property data
- [ ] Create `HouseDetail` route with full scoring breakdown
- [ ] Add property filtering and sorting options
- [ ] Implement property comparison feature
- [x] Add CSS styling (design system)
- [ ] User authentication/authorization

## Backend Integration

This frontend is designed to work with the SmartBuy Java Spring Boot backend.

**Backend Repository**: https://github.com/xixilele1990/smartbuy

### Setup Instructions

1. **Clone and start backend**:
   ```bash
   git clone https://github.com/xixilele1990/smartbuy.git
   cd smartbuy
   ./gradlew bootRun
   ```

2. **CORS Configuration** (already in `application.properties`):
   ```properties
   app.cors.allowed-origins=http://localhost:3000,https://smartbuy-frontend.onrender.com,http://localhost:5173
   ```

3. **Frontend Configuration**:
   ```bash
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:8080" > .env
   ```

4. **Test Connection**:
   ```bash
   # Test Profile API
   curl http://localhost:8080/buyerProfile/test_session
   
   # Test House API
   curl -X POST "http://localhost:8080/api/houses/from-attom-hardcoded?address1=2464%20Forbes%20Ave&address2=Santa%20Clara%2C%20CA%2095050"
   ```

### API Endpoints

#### Profile API
- `POST /buyerProfile` - Save buyer profile
- `GET /buyerProfile/{sessionId}` - Get profile by session
- `DELETE /buyerProfile/{sessionId}` - Delete profile

#### House API (ATTOM Integration)
- `POST /api/houses/from-attom-hardcoded?address1=...&address2=...` - Fetch house data from ATTOM
- Returns: `{house: HouseFromAttom, warnings: string[]}`

### Frontend Services

- ✅ `api.ts` - Generic HTTP client with session & CORS handling
- ✅ `profileService.ts` - Profile CRUD with DTO mapping
  - `saveProfile(profile)` - Save or update buyer profile
  - `getProfile()` - Load profile by sessionId
  - `deleteProfile()` - Delete profile by sessionId
- ✅ `houseService.ts` - House CRUD with ATTOM API integration
  - `addHouse(house)` - Add property and fetch ATTOM data
  - `getHouseDetails(address)` - Get detailed property info (schools, crime, etc.)
- ✅ `scoringService.ts` - SmartScore calculation
  - `scoreHouse(profile, house)` - Score single property
  - `batchScoreFromAddresses(profile, addresses)` - Score multiple properties in batch


## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Run ESLint
```

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Routing**: React Router DOM
- **State Management**: React hooks + localStorage (no external state library yet)
- **Type System**: TypeScript with strict type checking (`verbatimModuleSyntax` enabled)
- **Styling**: None (pure HTML, ready for CSS addition)
