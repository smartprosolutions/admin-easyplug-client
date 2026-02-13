# Copilot Instructions — admin-easyplug-client

## Project Overview

Admin dashboard for the **EasyPlug** marketplace platform. React 19 SPA built with Vite, deployed on Vercel. Manages sellers, inventory listings, subscriptions, advertisements, users, and transactions.

## Tech Stack & Key Libraries

- **UI**: MUI v7 (`@mui/material`, `@mui/x-data-grid`, `@mui/x-charts`) — all UI uses MUI components, no Tailwind/CSS modules
- **Server state**: TanStack React Query v5 — all API data fetching uses `useQuery`/`useMutation`
- **Forms**: Formik + Yup for validation — use the project's wrapper components, not raw MUI inputs
- **Routing**: React Router v7 (BrowserRouter) — nested routes under `<Navigation>` layout
- **HTTP**: Axios via singleton `src/api/axiosClient.js` with JWT interceptor

## Architecture & Data Flow

### Service Layer Pattern

Each domain has a dedicated service file in `src/services/` that wraps `axiosClient` calls and returns `resp.data`:

- `authService.js` — login, register, Google OAuth, user profile (`/auth/*`, `/users/*`)
- `listingService.js` — CRUD for inventory (`/listings/*`)
- `subscriptionService.js` — CRUD for subscriptions (`/subscriptions/*`)
- `sellerInfoService.js` — seller profile updates (`/seller-info/*`)
- `queries.js` — shared React Query hooks (e.g., `useUserProfileQuery`)

**Pattern**: Services are plain async functions. Pages/modals call them via `useMutation`/`useQuery` directly. When adding a new domain, create a service file following this pattern and import `axiosClient`.

### Auth Flow

- JWT token stored in `localStorage` as `access_token`
- Auto-attached to requests by axios interceptor in `src/api/axiosClient.js`
- Route guards: `PrivateRoute` (calls `/auth/me` to verify) and `PublicRoute` (redirects authenticated users to `/dashboard`)
- Google One Tap SSO via `GoogleOneTap` component rendered app-wide

### Routing Structure

Public routes (`/login`, `/register`) are wrapped in `PublicRoute`. All admin pages nest under `/` wrapped in `PrivateRoute` + `Navigation` layout which provides the sidebar and `<Outlet>`. Modals for add/edit use nested routes (e.g., `/subscriptions/add`, `/subscriptions/:id/edit`).

## Component Conventions

### Forms

Always use the Formik wrapper components from `src/components/forms/`:

- `TextFieldWrapper` — wraps MUI `TextField` with Formik field binding
- `SelectFieldWrapper` — wraps MUI `Select`, expects `options` as `[{value, label}]`
- `YearDatePicker` — date picker with Formik integration

### Toast Notifications

Use `ToastAlert` with local state pattern `{open, severity, message}`:

```jsx
const [toast, setToast] = useState({
  open: false,
  severity: "info",
  message: "",
});
// In mutation callbacks:
setToast({ open: true, severity: "success", message: "Created!" });
```

### Data Grids

Two DataGrid components exist — use the right one:

- `CustomDataGrid` — full-featured, supports server-side pagination (`paginationMode="server"`), checkbox selection. Use for main CRUD pages.
- `MetricsDataGrid` — simpler, client-side only, includes empty-state overlay. Use for dashboard/analytics.

### Theme

Dual theme (light/dark) toggled in `App.jsx`. Theme defined in `src/theme/theme.js`. Use the exported `gradientPrimary` for accent backgrounds. Primary color: `#667eea`, secondary: `#764ba2`.

### Constants

Category options live in `src/constants/categories.js`. Use `toOptions(SERVICES)` or `toOptions(PRODUCTS)` to convert to `[{value, label}]` for `SelectFieldWrapper`.

## Environment Variables

- `VITE_API_URL` — backend base URL (default: `http://localhost:8000/api/v1`)
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — ESLint check
- `npm run preview` — preview production build locally

## File Organization

```
src/api/          — Axios client singleton
src/services/     — API service functions (one per domain)
src/components/   — Reusable UI (alerts/, auth/, forms/, metrics/, modals/, navigations/, route/)
src/pages/        — Route-level page components
src/constants/    — Static data (categories, enums)
src/theme/        — MUI theme definitions
```

## Key Patterns to Follow

1. **New API endpoints**: Add to existing service file or create new one in `src/services/`, always use `axiosClient` and return `resp.data`
2. **New pages**: Add component in `src/pages/`, register route in `App.jsx` inside the `PrivateRoute` layout
3. **Mutations**: Use `useMutation` with `onSuccess`/`onError` handlers that set toast state and invalidate relevant query keys via `queryClient.invalidateQueries()`
4. **File uploads**: Use `FormData` with `Content-Type: multipart/form-data` header — see `registerSeller` or `uploadProfilePicture` in `authService.js` for the upload progress pattern
5. **No TypeScript** — project is plain JavaScript (`.jsx`/`.js`)
