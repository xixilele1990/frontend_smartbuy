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
│   └── Footer.tsx   # Global footer showing project/team names
└── pages/
	├── Dashboard.tsx # Home: Profile summary, Example SmartScore rankings, Properties preview
	├── Profile.tsx   # Buyer preferences form with localStorage persistence
	└── Houses.tsx    # Property management with add/delete functionality
```

## Data Flow

1. User visits Dashboard → sees "Get Started" if no profile, else shows Profile Summary + Properties
2. User clicks "Set Up Profile" → goes to Profile page
3. User fills Profile form + clicks "Save Profile" → data saved to localStorage
4. User returns to Dashboard → Profile Summary displays with SmartScore example
5. User clicks "Go to Houses" → goes to Houses page, can add properties
6. User adds property → saved to localStorage
7. Dashboard shows properties list preview

## Next Steps

- [x] Initialize Vite + React + TypeScript minimal setup
- [x] Install routing: `npm install react-router-dom`
- [x] Add placeholder pages: `Dashboard`, `Profile`, `Houses`
- [x] Implement Buyer Profile form on `Profile` page with localStorage
- [x] Add SmartScore weight calculation based on Priority Mode
- [x] Add Example SmartScore Rankings display on Dashboard
- [x] Implement House list and add-house flow on `Houses` page
- [x] Add Delete Profile and Delete Property features
- [x] Display Properties preview on Dashboard
- [x] Create API service layer for backend integration
- [x] Add form validation for Profile and Houses pages
- [x] Update Profile.tsx to use API instead of localStorage
- [ ] Create houseService.ts for Houses API integration
- [ ] Update Houses.tsx to use API instead of localStorage
- [ ] Implement actual SmartScore calculation with real property data
- [ ] Create `HouseDetail` route (`/houses/:id`) with full scoring breakdown
- [ ] Add loading states and error handling UI
- [ ] Add CSS styling (CSS modules or utility framework)
- [ ] Add property filtering and sorting options
- [ ] Implement property comparison feature

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

2. **Configure CORS** in `application.properties`:
   ```properties
   app.cors.allowed-origins=http://localhost:5173
   ```

3. **Test connection**:
   ```bash
   curl http://localhost:8080/buyerProfile/test_session
   ```

### API Services

- ✅ `profileService.ts` - Buyer profile CRUD operations
- ⏳ `houseService.ts` - Property management (coming soon)
- ⏳ `scoringService.ts` - SmartScore calculations (coming soon)


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
