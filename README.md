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

1. User visits Dashboard → loads profile from backend API, shows Profile Summary + Properties
2. User navigates to Profile → loads existing profile if exists
3. User fills Profile form + saves → POST to `/buyerProfile` → persists to backend database
4. User navigates to Dashboard → profile data reloaded from backend
5. User navigates to Houses → can add properties by address
6. User enters address + submits → calls ATTOM API via backend → returns real property data (beds, baths, price, schools, crime index)
7. Properties stored in local state (not persisted to backend yet)
8. User can delete properties from local list

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
- [x] Implement loading states and error handling
- [x] Clean up unused code and optimize imports
- [x] Push all changes to GitHub

### In Progress ⏳
- [ ] Persist houses to backend database (currently local-only)
- [ ] Implement house deletion on backend

### Future Features 🚀
- [ ] Implement actual SmartScore calculation with real property data
- [ ] Create `HouseDetail` route with full scoring breakdown
- [ ] Add property filtering and sorting options
- [ ] Implement property comparison feature
- [ ] Add CSS styling (design system)
- [ ] Scoring service integration
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
- ✅ `houseService.ts` - House CRUD with ATTOM API integration


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
